/**
 * ALIE CREATIVES — Google Sheets Webhook Receiver & Intake Processor
 * 
 * Instructions:
 * 1. Open your Google Sheet:
 *    https://docs.google.com/spreadsheets/d/1sf6nPdHUAiKvoCZAM2My25XhAacuXWfMssVHHfhaSXQ/edit?usp=sharing
 * 2. In the top menu, navigate to: Extensions > Apps Script
 * 3. Replace all existing code in Code.gs with this code.
 * 4. Click "Deploy" (top right) > "New deployment".
 * 5. Click the gear icon next to "Select type" and choose "Web app".
 * 6. Set:
 *    - Description: "ALIE CREATIVES Intake Webhook v2"
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone" (CRITICAL: Must be "Anyone" so client submissions succeed without Google login)
 * 7. Click "Deploy" and grant requested permissions.
 * 8. Copy the Web app URL (starts with https://script.google.com/macros/s/...)
 * 9. Paste that URL into your client intake portal!
 */

// ==========================================
// CONFIGURATION
// ==========================================
var CONFIG = {
  // Google Spreadsheet ID (fallback if run as standalone script)
  SPREADSHEET_ID: "1sf6nPdHUAiKvoCZAM2My25XhAacuXWfMssVHHfhaSXQ",
  
  // Sheet tab name dedicated to submissions
  SHEET_NAME: "Client Submissions",
  
  // Script Timezone for submission timestamps
  TIMEZONE: "GMT+5",
  
  // Set to true if you want an email alert on each submission
  ENABLE_EMAIL_NOTIFICATION: false,
  
  // Recipient email address (leave empty to default to script owner's email)
  NOTIFICATION_EMAIL: ""
};

// Exact 57-column mapping matching ALIE CREATIVES Database
var HEADERS = [
  "Submission_ID",
  "Submitted_At",
  "Account_Type",
  "Client_or_Brand_Name",
  "Professional_Role_or_Niche",
  "Discipline_or_Team_Size",
  "Availability_or_Engagement_Model",
  "Location_or_Studio_Model",
  "Resume_or_Project_Minimum",
  "Official_Email",
  "Phone_WhatsApp",
  "Primary_Brand_Color",
  "Accent_Brand_Color",
  "Typography_Fonts",
  "Aesthetic_Tone",
  "Years_Experience",
  "Clients_Served",
  "Projects_Completed",
  "Brand_Story_Mission",
  "Logo_Asset_Link",
  "Case_Study_1_Name",
  "Case_Study_1_Problem",
  "Case_Study_1_Solution",
  "Case_Study_1_Result",
  "Case_Study_1_Drive_Link",
  "Case_Study_2_Name",
  "Case_Study_2_Problem",
  "Case_Study_2_Solution",
  "Case_Study_2_Result",
  "Case_Study_2_Drive_Link",
  "Case_Study_3_Summary",
  "Case_Study_4_Summary",
  "Services_Offered",
  "Client_Testimonials",
  "Frequently_Asked_Questions",
  "Physical_Address",
  "Preferred_Contact_Method",
  "Business_Hours",
  "Instagram",
  "LinkedIn",
  "Twitter_X",
  "Behance_Dribbble",
  "Founder_Name",
  "Founder_Title",
  "Founder_Headshot_Link",
  "Founder_Bio",
  "Case_Study_Architecture",
  "Pages_Required",
  "Existing_Site_Status",
  "Existing_Site_URL",
  "Domain_Status",
  "Target_Launch_Date",
  "Reference_Websites",
  "Copy_Status",
  "Revision_Policy_Agreed",
  "Authorized_Signatory",
  "Agreement_Date"
];

// ==========================================
// HTTP POST HANDLER (Webhook Endpoint)
// ==========================================
function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = false;

  // 1. Acquire concurrency lock safely
  try {
    hasLock = lock.tryLock(10000);
  } catch (lockErr) {
    hasLock = false;
  }

  if (!hasLock) {
    return createJsonResponse({
      result: "error",
      error: "Server busy. Could not acquire write lock within 10 seconds. Please retry."
    });
  }

  try {
    // 2. Safely parse incoming payload
    var data = parseIncomingPayload(e);

    // 3. Connect to target Spreadsheet and Sheet
    var ss = resolveSpreadsheet();
    if (!ss) {
      throw new Error("Unable to open Spreadsheet. Please verify SPREADSHEET_ID or container permissions.");
    }

    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    }

    // 4. If sheet is empty, initialize styled headers and column widths
    initializeHeadersIfNeeded(sheet);

    // 5. Normalize and extract data for all 57 columns
    var rowValues = HEADERS.map(function (col) {
      var val = extractFieldValue(data, col);
      return sanitizeCellForSheets(val);
    });

    // 6. Append submission row
    sheet.appendRow(rowValues);
    var newRowNum = sheet.getLastRow();

    // 7. Optional Email Notification
    sendEmailNotificationIfNeeded(data, ss);

    // 8. Return success response
    var submissionId = extractFieldValue(data, "Submission_ID") || "ALIE-" + newRowNum;

    return createJsonResponse({
      result: "success",
      submissionId: submissionId,
      row: newRowNum,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return createJsonResponse({
      result: "error",
      error: err.toString()
    });
  } finally {
    // Release lock only if we actually hold it
    if (hasLock) {
      try {
        lock.releaseLock();
      } catch (e) {}
    }
  }
}

// ==========================================
// HTTP GET HANDLER (Health Check & Diagnostics)
// ==========================================
function doGet(e) {
  try {
    var ss = resolveSpreadsheet();
    var sheet = ss ? ss.getSheetByName(CONFIG.SHEET_NAME) : null;
    var totalRows = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;

    return createJsonResponse({
      status: "online",
      message: "ALIE CREATIVES Google Sheet Webhook is active and ready for POST requests.",
      spreadsheetName: ss ? ss.getName() : "Unknown",
      sheetName: sheet ? sheet.getName() : "Not initialized yet",
      totalSubmissionsRecorded: totalRows,
      timestamp: Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss")
    });
  } catch (err) {
    return createJsonResponse({
      status: "warning",
      message: "Webhook endpoint is live, but check spreadsheet permissions: " + err.toString()
    });
  }
}

// ==========================================
// CORS PREFLIGHT OPTIONS HANDLER
// ==========================================
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

// ==========================================
// PAYLOAD PARSER (JSON, URL Encoded, Parameters)
// ==========================================
function parseIncomingPayload(e) {
  if (!e) {
    return {};
  }

  // Handle postData contents (JSON or URL-encoded form body)
  if (e.postData && e.postData.contents) {
    var contents = e.postData.contents.trim();
    if (contents.length > 0) {
      try {
        return JSON.parse(contents);
      } catch (jsonErr) {
        // Fallback if sent as application/x-www-form-urlencoded
        return parseQueryString(contents);
      }
    }
  }

  // Fallback to query/form parameters
  if (e.parameter && Object.keys(e.parameter).length > 0) {
    return e.parameter;
  }

  return {};
}

function parseQueryString(qs) {
  var out = {};
  var pairs = qs.split("&");
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split("=");
    if (pair.length === 2) {
      var key = decodeURIComponent(pair[0].replace(/\+/g, " "));
      var val = decodeURIComponent(pair[1].replace(/\+/g, " "));
      out[key] = val;
    }
  }
  return out;
}

// ==========================================
// SPREADSHEET RESOLVER (Active or By ID)
// ==========================================
function resolveSpreadsheet() {
  var ss = null;

  // Try container-bound spreadsheet first
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {}

  // If running as standalone script, open via SPREADSHEET_ID
  if (!ss && CONFIG.SPREADSHEET_ID) {
    try {
      ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    } catch (e) {}
  }

  return ss;
}

// ==========================================
// HEADER INITIALIZATION & FORMATTING
// ==========================================
function initializeHeadersIfNeeded(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);

    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground("#0A0D11");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Segoe UI");
    headerRange.setFontSize(10);
    headerRange.setWrap(true);
    headerRange.setVerticalAlignment("middle");
    headerRange.setHorizontalAlignment("center");

    sheet.setRowHeight(1, 44);
    sheet.setFrozenRows(1);

    // Set clean column widths once on initialization (prevents 50+ API calls on each submit)
    for (var i = 1; i <= HEADERS.length; i++) {
      sheet.setColumnWidth(i, 160);
    }
  }
}

// ==========================================
// UNIVERSAL VALUE EXTRACTION (Resilient Mapping)
// Supports:
// 1. Direct underscore keys (e.g. "Official_Email")
// 2. Human spaced keys (e.g. "Official Email")
// 3. Nested object structures from app.js (e.g. data.contact.email)
// ==========================================
function extractFieldValue(data, col) {
  if (!data || typeof data !== "object") return "";

  // 1. Direct underscore match
  if (data[col] !== undefined && data[col] !== null && data[col] !== "") {
    return formatRawValue(data[col]);
  }

  // 2. Human spaced match ("Official_Email" -> "Official Email")
  var spacedCol = col.replace(/_/g, " ");
  if (data[spacedCol] !== undefined && data[spacedCol] !== null && data[spacedCol] !== "") {
    return formatRawValue(data[spacedCol]);
  }

  // 3. Normalized alphanumeric case-insensitive match
  var normTarget = col.toLowerCase().replace(/[^a-z0-9]/g, "");
  var keys = Object.keys(data);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (k.toLowerCase().replace(/[^a-z0-9]/g, "") === normTarget) {
      if (data[k] !== undefined && data[k] !== null && data[k] !== "") {
        return formatRawValue(data[k]);
      }
    }
  }

  // 4. Intelligent mapping for nested structures from frontend gatherFormData()
  var val = mapNestedStructure(data, col);
  if (val !== undefined && val !== null && val !== "") {
    return formatRawValue(val);
  }

  // 5. Automatic fallbacks for critical audit columns
  if (col === "Submission_ID") {
    var randCode = ("00" + Math.floor(Math.random() * 1000)).slice(-3);
    var timeStr = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd-HHmmss");
    return "ALIE-INTAKE-" + timeStr + "-" + randCode;
  }

  if (col === "Submitted_At") {
    return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  }

  return "";
}

// Mapping nested objects from app.js gatherFormData()
function mapNestedStructure(d, col) {
  var account = d.account || {};
  var branding = d.branding || {};
  var about = d.about || {};
  var contact = d.contact || {};
  var founder = d.founder || {};
  var structure = d.structure || {};
  var policy = d.policy || {};
  var caseStudies = Array.isArray(d.caseStudies) ? d.caseStudies : [];
  var services = Array.isArray(d.services) ? d.services : [];
  var testimonials = Array.isArray(d.testimonials) ? d.testimonials : [];
  var faqs = Array.isArray(d.faqs) ? d.faqs : [];

  switch (col) {
    case "Account_Type":
      return account.type;
    case "Client_or_Brand_Name":
      return branding.name || d.clientName;
    case "Professional_Role_or_Niche":
      return account.personalRole || account.agencyNiche;
    case "Discipline_or_Team_Size":
      return account.personalDiscipline || account.agencyTeamSize;
    case "Availability_or_Engagement_Model":
      return account.personalAvailability || account.agencyEngagementModel;
    case "Location_or_Studio_Model":
      return account.personalLocation || account.agencyModel;
    case "Resume_or_Project_Minimum":
      return account.personalResumeLink || account.agencyMinBudget;
    case "Official_Email":
      return contact.email;
    case "Phone_WhatsApp":
      return contact.phone;
    case "Primary_Brand_Color":
      return branding.primaryColor;
    case "Accent_Brand_Color":
      return branding.accentColor;
    case "Typography_Fonts":
      return branding.fonts;
    case "Aesthetic_Tone":
      return branding.tone;
    case "Years_Experience":
      return about.yearsExp;
    case "Clients_Served":
      return about.clientsServed;
    case "Projects_Completed":
      return about.projectsCompleted;
    case "Brand_Story_Mission":
      return about.story;
    case "Logo_Asset_Link":
      return branding.logoLink;
    case "Case_Study_1_Name":
      return caseStudies[0] ? caseStudies[0].name : "";
    case "Case_Study_1_Problem":
      return caseStudies[0] ? caseStudies[0].problem : "";
    case "Case_Study_1_Solution":
      return caseStudies[0] ? caseStudies[0].solution : "";
    case "Case_Study_1_Result":
      return caseStudies[0] ? caseStudies[0].result : "";
    case "Case_Study_1_Drive_Link":
      return caseStudies[0] ? caseStudies[0].driveLink : "";
    case "Case_Study_2_Name":
      return caseStudies[1] ? caseStudies[1].name : "";
    case "Case_Study_2_Problem":
      return caseStudies[1] ? caseStudies[1].problem : "";
    case "Case_Study_2_Solution":
      return caseStudies[1] ? caseStudies[1].solution : "";
    case "Case_Study_2_Result":
      return caseStudies[1] ? caseStudies[1].result : "";
    case "Case_Study_2_Drive_Link":
      return caseStudies[1] ? caseStudies[1].driveLink : "";
    case "Case_Study_3_Summary":
      return caseStudies[2] ? (caseStudies[2].name + (caseStudies[2].result ? " (" + caseStudies[2].result + ")" : "")) : "";
    case "Case_Study_4_Summary":
      return caseStudies[3] ? (caseStudies[3].name + (caseStudies[3].result ? " (" + caseStudies[3].result + ")" : "")) : "";
    case "Services_Offered":
      if (services.length > 0) {
        return services.map(function (s, i) {
          return (i + 1) + ". " + (s.name || "Service") + (s.price ? " (" + s.price + ")" : "") + (s.desc ? ": " + s.desc : "");
        }).join("; ");
      }
      return "";
    case "Client_Testimonials":
      if (testimonials.length > 0) {
        return testimonials.map(function (t) {
          return (t.author || "Client") + ": \"" + (t.text || "") + "\" [Permission: " + (t.permission ? "Yes" : "No") + "]";
        }).join("; ");
      }
      return "";
    case "Frequently_Asked_Questions":
      if (faqs.length > 0) {
        return faqs.map(function (f, i) {
          return "Q" + (i + 1) + ": " + (f.q || "") + " | A: " + (f.a || "");
        }).join("; ");
      }
      return "";
    case "Physical_Address":
      return contact.address;
    case "Preferred_Contact_Method":
      return contact.prefMethod;
    case "Business_Hours":
      return contact.hours;
    case "Instagram":
      return contact.instagram;
    case "LinkedIn":
      return contact.linkedin;
    case "Twitter_X":
      return contact.twitter;
    case "Behance_Dribbble":
      return contact.behance;
    case "Founder_Name":
      return founder.name;
    case "Founder_Title":
      return founder.title;
    case "Founder_Headshot_Link":
      return founder.imagesLink;
    case "Founder_Bio":
      return founder.bio;
    case "Case_Study_Architecture":
      return structure.choice;
    case "Pages_Required":
      return Array.isArray(structure.pages) ? structure.pages.join(", ") : structure.pages;
    case "Existing_Site_Status":
      return structure.existingStatus;
    case "Existing_Site_URL":
      return structure.existingUrl;
    case "Domain_Status":
      return structure.domainStatus;
    case "Target_Launch_Date":
      return structure.deadline;
    case "Reference_Websites":
      return structure.references;
    case "Copy_Status":
      return structure.copyStatus;
    case "Revision_Policy_Agreed":
      return policy.agreed ? "Yes — Agreed to Revision Policy" : (policy.agreed === false ? "No" : "");
    case "Authorized_Signatory":
      return policy.signature;
    case "Agreement_Date":
      return policy.date;
    default:
      return "";
  }
}

// Format raw values (arrays, objects, booleans) into human-readable text
function formatRawValue(val) {
  if (val === undefined || val === null) return "";
  if (typeof val === "boolean") return val ? "Yes" : "No";

  if (Array.isArray(val)) {
    if (val.length === 0) return "";
    // If array of strings or numbers
    if (typeof val[0] !== "object") {
      return val.join(", ");
    }
    // If array of objects
    return JSON.stringify(val);
  }

  if (typeof val === "object") {
    return JSON.stringify(val);
  }

  return String(val);
}

// Prevent Google Sheets formula injection and phone number format mangling
function sanitizeCellForSheets(val) {
  if (val === undefined || val === null) return "";
  var str = String(val).trim();

  // If value begins with =, +, -, or @, prefix with ' to avoid Sheets formula interpretation
  if (str.length > 0 && (str.charAt(0) === "=" || str.charAt(0) === "+" || str.charAt(0) === "@" || (str.charAt(0) === "-" && !/^-?\d+(\.\d+)?$/.test(str)))) {
    return "'" + str;
  }

  return str;
}

// ==========================================
// EMAIL NOTIFICATION SERVICE
// ==========================================
function sendEmailNotificationIfNeeded(data, ss) {
  if (!CONFIG.ENABLE_EMAIL_NOTIFICATION) return;

  try {
    // Resolve email safely without throwing empty email error
    var recipient = CONFIG.NOTIFICATION_EMAIL;
    if (!recipient) {
      recipient = Session.getEffectiveUser().getEmail();
    }
    if (!recipient && ss.getOwner()) {
      recipient = ss.getOwner().getEmail();
    }
    if (!recipient) return;

    var clientName = extractFieldValue(data, "Client_or_Brand_Name") || "New Client";
    var accountType = extractFieldValue(data, "Account_Type") || "Not Specified";
    var email = extractFieldValue(data, "Official_Email") || "N/A";
    var phone = extractFieldValue(data, "Phone_WhatsApp") || "N/A";
    var subId = extractFieldValue(data, "Submission_ID") || "N/A";

    var subject = "🚀 New Client Intake Received: " + clientName;
    var body = "A new client intake form has been submitted to ALIE CREATIVES.\n\n" +
               "Client Name: " + clientName + "\n" +
               "Account Type: " + accountType + "\n" +
               "Email: " + email + "\n" +
               "Phone: " + phone + "\n" +
               "Submission ID: " + subId + "\n\n" +
               "View Spreadsheet:\n" + ss.getUrl();

    MailApp.sendEmail(recipient, subject, body);
  } catch (emailErr) {
    Logger.log("Email notification failed: " + emailErr.toString());
  }
}

// ==========================================
// HELPER: CREATE JSON RESPONSE
// ==========================================
function createJsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// MANUAL TEST HARNESS (For Apps Script Editor)
// Run this function directly inside Apps Script IDE to test!
// ==========================================
function testSubmission() {
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        Submission_ID: "TEST-" + Date.now(),
        Account_Type: "Personal Portfolio",
        Client_or_Brand_Name: "Test Client via Apps Script",
        Official_Email: "test@example.com",
        Phone_WhatsApp: "+92 300 0000000",
        Primary_Brand_Color: "#0A0D11",
        Accent_Brand_Color: "#38BDF8",
        Pages_Required: ["Home", "About", "Contact"],
        Revision_Policy_Agreed: true,
        Authorized_Signatory: "Test Signer"
      })
    }
  };

  var res = doPost(mockEvent);
  Logger.log("doPost Result: " + res.getContent());
}
