/**
 * ALIE CREATIVES — Framer Quest Integrated Engine
 * Theme toggling with dynamic logo swap (Alie Black.png / Alie WHITE.png),
 * FAQ accordions, multi-step intake repeaters, autosave, and multi-format exporters.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Theme & Logo Management
  const themeToggle = document.getElementById('themeToggle');
  const navLogo = document.getElementById('navLogo');
  const footerLogo = document.getElementById('footerLogo');
  const themeIcon = document.getElementById('themeIcon');

  const LOGO_WHITE = 'assets/Alie WHITE.png';
  const LOGO_BLACK = 'assets/Alie Black.png'; // Exact user path: "D:\DATA 2025\alie_designs\Alie Creatives Logo\Alie Black.png"

  function applyTheme(isLight) {
    if (isLight) {
      document.documentElement.setAttribute('data-theme', 'light');
      if (navLogo) navLogo.src = LOGO_BLACK;
      if (footerLogo) footerLogo.src = LOGO_BLACK;
      localStorage.setItem('alie_theme', 'light');
      if (themeIcon) {
        themeIcon.innerHTML = `
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        `;
      }
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (navLogo) navLogo.src = LOGO_WHITE;
      if (footerLogo) footerLogo.src = LOGO_WHITE;
      localStorage.setItem('alie_theme', 'dark');
      if (themeIcon) {
        themeIcon.innerHTML = `
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        `;
      }
    }
  }

  // Check saved theme (default to Light Mode as requested by user)
  const savedTheme = localStorage.getItem('alie_theme');
  applyTheme(savedTheme !== 'dark');

  // Ensure user lands at the top Hero view on fresh load
  if (!window.location.hash) {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  themeToggle?.addEventListener('click', () => {
    const isCurrentlyLight = document.documentElement.getAttribute('data-theme') === 'light';
    applyTheme(!isCurrentlyLight);
    showToast(`Switched to ${!isCurrentlyLight ? 'Light' : 'Dark'} Mode`, 'info');
  });

  // FAQ Accordion on Landing Page
  document.querySelectorAll('.faq-accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.faq-accordion-item');
      item.classList.toggle('open');
    });
  });

  // State
  let currentStep = 1;
  let isInitialLoad = true;
  const totalSteps = 11;
  const STORAGE_KEY = 'alie_creatives_intake_draft_v1';

  const stepTitles = [
    'Account Type & Brand Identity',
    'About Us & Credibility Metrics',
    'Past Work / Case Studies',
    'Services Offered',
    'Client Testimonials & Reviews',
    'Frequently Asked Questions',
    'Contact Information & Channels',
    'Profile & Leadership Spotlight',
    'Website Structure & Specifications',
    'Revision Policy & Agreement',
    'Review, Export & Submission Center'
  ];

  // DOM Elements
  const form = document.getElementById('clientIntakeForm');
  const btnPrev = document.getElementById('btnPrevStep');
  const btnNext = document.getElementById('btnNextStep');
  const btnSaveManual = document.getElementById('btnSaveManual');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressPercentage = document.getElementById('progressPercentage');
  const currentStepLabel = document.getElementById('currentStepLabel');
  const stepperNav = document.getElementById('stepperNav');
  const toastContainer = document.getElementById('toastContainer');
  const reviewDossier = document.getElementById('reviewDossier');

  // Containers for repeaters
  const caseStudiesContainer = document.getElementById('caseStudiesContainer');
  const btnAddProject = document.getElementById('btnAddProject');
  const servicesContainer = document.getElementById('servicesContainer');
  const btnAddService = document.getElementById('btnAddService');
  const testimonialsContainer = document.getElementById('testimonialsContainer');
  const btnAddTestimonial = document.getElementById('btnAddTestimonial');
  const faqContainer = document.getElementById('faqContainer');
  const btnAddFaq = document.getElementById('btnAddFaq');

  // Color Pickers Sync
  const primaryColorPicker = document.getElementById('primaryColorPicker');
  const primaryColor = document.getElementById('primaryColor');
  const accentColorPicker = document.getElementById('accentColorPicker');
  const accentColor = document.getElementById('accentColor');

  if (primaryColorPicker && primaryColor) {
    primaryColorPicker.addEventListener('input', (e) => {
      primaryColor.value = e.target.value.toUpperCase();
      triggerAutosave();
    });
    primaryColor.addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        primaryColorPicker.value = e.target.value;
      }
      triggerAutosave();
    });
  }

  if (accentColorPicker && accentColor) {
    accentColorPicker.addEventListener('input', (e) => {
      accentColor.value = e.target.value.toUpperCase();
      triggerAutosave();
    });
    accentColor.addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        accentColorPicker.value = e.target.value;
      }
      triggerAutosave();
    });
  }

  // Pre-fill Today's Date in Agreement
  const agreementDate = document.getElementById('agreementDate');
  if (agreementDate && !agreementDate.value) {
    agreementDate.value = new Date().toISOString().split('T')[0];
  }

  // ==========================================
  // ACCOUNT TYPE MANAGEMENT (Personal vs Agency)
  // ==========================================
  const personalConditionalFields = document.getElementById('personalConditionalFields');
  const agencyConditionalFields = document.getElementById('agencyConditionalFields');
  const brandNameLabel = document.getElementById('brandNameLabel');
  const brandName = document.getElementById('brandName');
  const brandNameHint = document.getElementById('brandNameHint');
  const logoLinkLabel = document.getElementById('logoLinkLabel');
  const stepperNavStep8 = document.getElementById('stepperNavStep8');
  const step8Title = document.getElementById('step8Title');
  const step8Desc = document.getElementById('step8Desc');
  const founderNameLabel = document.getElementById('founderNameLabel');
  const founderTitleLabel = document.getElementById('founderTitleLabel');
  const founderImagesLabel = document.getElementById('founderImagesLabel');
  const founderBioLabel = document.getElementById('founderBioLabel');

  function updateAccountTypeUI(accountType) {
    if (accountType === 'Agency') {
      if (personalConditionalFields) personalConditionalFields.style.display = 'none';
      if (agencyConditionalFields) agencyConditionalFields.style.display = 'block';

      if (brandNameLabel) brandNameLabel.innerHTML = 'Official Agency / Studio Name <span class="required">*</span>';
      if (brandName) brandName.placeholder = 'e.g. Apex Studio, Vertex Labs, or Nexus Creative';
      if (brandNameHint) brandNameHint.textContent = 'The registered or commercial agency name for your digital flagship.';
      if (logoLinkLabel) logoLinkLabel.innerHTML = 'Official Agency Logo Link (Google Drive / Dropbox / Figma) <span class="required">*</span>';

      if (stepperNavStep8) stepperNavStep8.textContent = 'Leadership';
      if (step8Title) step8Title.textContent = 'Leadership & Founder Profile';
      if (step8Desc) step8Desc.textContent = 'Highlight agency founders, creative directors, and key leadership team.';
      if (founderNameLabel) founderNameLabel.textContent = 'Founder / Managing Partner Name';
      if (founderTitleLabel) founderTitleLabel.textContent = 'Executive Title (e.g. Creative Director & Founder)';
      if (founderImagesLabel) founderImagesLabel.textContent = 'Founder High-Res Headshot Link (Google Drive / Dropbox)';
      if (founderBioLabel) founderBioLabel.textContent = 'Founder / Leadership Biography';
    } else {
      // Personal
      if (personalConditionalFields) personalConditionalFields.style.display = 'block';
      if (agencyConditionalFields) agencyConditionalFields.style.display = 'none';

      if (brandNameLabel) brandNameLabel.innerHTML = 'Your Display Name / Personal Brand <span class="required">*</span>';
      if (brandName) brandName.placeholder = 'e.g. Muhammad Ali, Jane Doe, or Apex by Alex';
      if (brandNameHint) brandNameHint.textContent = 'Your personal name or solo brand moniker displayed across all portfolio headings and meta tags.';
      if (logoLinkLabel) logoLinkLabel.innerHTML = 'Personal Monogram / Logo Link (or Headshot) <span class="required">*</span>';

      if (stepperNavStep8) stepperNavStep8.textContent = 'Profile';
      if (step8Title) step8Title.textContent = 'Personal Profile & Headshots';
      if (step8Desc) step8Desc.textContent = 'Spotlight your personal headshots, creative background, and signature craft.';
      if (founderNameLabel) founderNameLabel.textContent = 'Your Full Name';
      if (founderTitleLabel) founderTitleLabel.textContent = 'Professional Designation';
      if (founderImagesLabel) founderImagesLabel.textContent = 'High-Resolution Headshot Link (Google Drive / Dropbox)';
      if (founderBioLabel) founderBioLabel.textContent = 'Short Personal Bio';
    }
  }

  document.querySelectorAll('input[name="accountType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      updateAccountTypeUI(e.target.value);
      triggerAutosave();
      showToast(`Switched account mode to ${e.target.value === 'Agency' ? 'Agency / Studio' : 'Personal Portfolio'}`, 'info');
    });
  });

  // ==========================================
  // REPEATERS (Case Studies, Services, Testimonials, FAQs)
  // ==========================================

  // 1. Case Studies (Min 2, Max 4)
  function renderProjectCard(index, data = {}) {
    const card = document.createElement('div');
    card.className = 'repeater-card project-card';
    card.dataset.index = index;
    card.innerHTML = `
      <div class="repeater-card-header">
        <div class="repeater-item-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          <span class="project-title-label">Case Study 0${index + 1}</span>
          <span class="repeater-item-badge">Min 4 High-Res Images Required</span>
        </div>
        <button type="button" class="btn-remove-item btn-remove-project" title="Remove Case Study">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          <span>Remove</span>
        </button>
      </div>

      <div class="form-grid">
        <div class="col-12 form-group">
          <label class="form-label"><span>Project Name / Client Name <span class="required">*</span></span></label>
          <input type="text" class="form-control project-name" placeholder="e.g. Lumina Health Brand & Web App" value="${data.name || ''}" required>
        </div>

        <div class="col-4 form-group">
          <label class="form-label"><span>The Problem <span class="required">*</span></span></label>
          <textarea class="form-control project-problem" rows="3" placeholder="What core problem or outdated setup was the client struggling with?" required>${data.problem || ''}</textarea>
        </div>

        <div class="col-4 form-group">
          <label class="form-label"><span>The Solution <span class="required">*</span></span></label>
          <textarea class="form-control project-solution" rows="3" placeholder="What was your creative or technical solution and execution strategy?" required>${data.solution || ''}</textarea>
        </div>

        <div class="col-4 form-group">
          <label class="form-label"><span>The Result <span class="required">*</span></span></label>
          <textarea class="form-control project-result" rows="3" placeholder="Outcome: ROI, conversion boost, aesthetic transformation..." required>${data.result || ''}</textarea>
        </div>

        <div class="col-12 form-group">
          <label class="form-label">
            <span>Google Drive Link (Images: Min 1920px wide, JPG/PNG, Min 4 images) <span class="required">*</span></span>
          </label>
          <div class="input-with-icon">
            <span class="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </span>
            <input type="url" class="form-control project-drive-link" placeholder="https://drive.google.com/drive/folders/..." value="${data.driveLink || ''}" required>
          </div>
        </div>
      </div>
    `;

    card.querySelector('.btn-remove-project').addEventListener('click', () => {
      const allProjects = caseStudiesContainer.querySelectorAll('.project-card');
      if (allProjects.length <= 2) {
        showToast('You must provide at least 2 case studies (Min 2, Max 4).', 'error');
        return;
      }
      card.remove();
      updateProjectIndices();
      triggerAutosave();
    });

    card.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', triggerAutosave);
    });

    return card;
  }

  function updateProjectIndices() {
    const cards = caseStudiesContainer.querySelectorAll('.project-card');
    cards.forEach((card, idx) => {
      card.dataset.index = idx;
      card.querySelector('.project-title-label').textContent = `Case Study 0${idx + 1}`;
    });
    btnAddProject.style.display = cards.length >= 4 ? 'none' : 'inline-flex';
  }

  btnAddProject.addEventListener('click', () => {
    const currentCards = caseStudiesContainer.querySelectorAll('.project-card');
    if (currentCards.length >= 4) {
      showToast('Maximum of 4 case studies permitted.', 'error');
      return;
    }
    caseStudiesContainer.appendChild(renderProjectCard(currentCards.length));
    updateProjectIndices();
    triggerAutosave();
  });

  // 2. Services Repeater
  function renderServiceCard(index, data = {}) {
    const card = document.createElement('div');
    card.className = 'repeater-card service-card';
    card.innerHTML = `
      <div class="repeater-card-header">
        <div class="repeater-item-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          <span>Service 0${index + 1}</span>
        </div>
        <button type="button" class="btn-remove-item btn-remove-service" title="Remove Service">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          <span>Remove</span>
        </button>
      </div>

      <div class="form-grid">
        <div class="col-8 form-group">
          <label class="form-label"><span>Service Title <span class="required">*</span></span></label>
          <input type="text" class="form-control service-name" placeholder="e.g. Brand Identity Design, Full-Stack Web Development" value="${data.name || ''}" required>
        </div>

        <div class="col-4 form-group">
          <label class="form-label"><span>Starting Price / Range</span> <span class="optional">Optional</span></label>
          <input type="text" class="form-control service-price" placeholder="e.g. 50,000 PKR / $500+" value="${data.price || ''}">
        </div>

        <div class="col-12 form-group">
          <label class="form-label"><span>Short Scope / Deliverables Summary</span></label>
          <input type="text" class="form-control service-desc" placeholder="e.g. Complete visual system, design tokens, logo suite & guidelines" value="${data.desc || ''}">
        </div>
      </div>
    `;

    card.querySelector('.btn-remove-service').addEventListener('click', () => {
      const allServices = servicesContainer.querySelectorAll('.service-card');
      if (allServices.length <= 1) {
        showToast('Please specify at least one service offering.', 'error');
        return;
      }
      card.remove();
      triggerAutosave();
    });

    card.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', triggerAutosave);
    });

    return card;
  }

  btnAddService.addEventListener('click', () => {
    const current = servicesContainer.querySelectorAll('.service-card').length;
    servicesContainer.appendChild(renderServiceCard(current));
    triggerAutosave();
  });

  // 3. Testimonials Repeater
  function renderTestimonialCard(index, data = {}) {
    const card = document.createElement('div');
    card.className = 'repeater-card testimonial-card';
    card.innerHTML = `
      <div class="repeater-card-header">
        <div class="repeater-item-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <span>Testimonial 0${index + 1}</span>
        </div>
        <button type="button" class="btn-remove-item btn-remove-testimonial" title="Remove Testimonial">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          <span>Remove</span>
        </button>
      </div>

      <div class="form-grid">
        <div class="col-6 form-group">
          <label class="form-label"><span>Client Full Name & Role <span class="required">*</span></span></label>
          <input type="text" class="form-control testimonial-author" placeholder="e.g. Sarah Jenkins — CEO at Nova Labs" value="${data.author || ''}" required>
        </div>

        <div class="col-6 form-group">
          <label class="form-label"><span>Client Photo / Company Logo URL</span> <span class="optional">Optional</span></label>
          <input type="url" class="form-control testimonial-photo" placeholder="https://drive.google.com/... or https://..." value="${data.photo || ''}">
        </div>

        <div class="col-12 form-group">
          <label class="form-label"><span>Written Client Review <span class="required">*</span></span></label>
          <textarea class="form-control testimonial-text" rows="3" placeholder="Paste the client's direct review or feedback quotation..." required>${data.text || ''}</textarea>
        </div>

        <div class="col-12 form-group">
          <label class="custom-checkbox-card">
            <input type="checkbox" class="testimonial-permission" ${data.permission !== false ? 'checked' : ''} required>
            <div class="card-checkbox-ui"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
            <span class="card-check-label">Confirmation: Client has provided explicit permission to display this publicly.</span>
          </label>
        </div>
      </div>
    `;

    card.querySelector('.btn-remove-testimonial').addEventListener('click', () => {
      const allTestimonials = testimonialsContainer.querySelectorAll('.testimonial-card');
      if (allTestimonials.length <= 1) {
        showToast('Please maintain at least one testimonial.', 'error');
        return;
      }
      card.remove();
      triggerAutosave();
    });

    card.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', triggerAutosave);
      input.addEventListener('change', triggerAutosave);
    });

    return card;
  }

  btnAddTestimonial.addEventListener('click', () => {
    const current = testimonialsContainer.querySelectorAll('.testimonial-card').length;
    testimonialsContainer.appendChild(renderTestimonialCard(current));
    triggerAutosave();
  });

  // 4. FAQs Repeater (Min 5 pre-loaded)
  const defaultFaqs = [
    {
      q: 'What is your turnaround time for a custom portfolio website?',
      a: 'Our typical design & development sprint takes 5 to 7 business days from the moment all assets and copy are provided.'
    },
    {
      q: 'How does your payment and milestone structure work?',
      a: 'We require a 50% upfront deposit to initiate the project sprint, with the remaining 50% due upon final approval and live deployment.'
    },
    {
      q: 'What do you require from clients before starting the build?',
      a: 'We require completion of this intake portal, high-resolution logo files, at least 2 case studies with 4+ images, and preferred reference links.'
    },
    {
      q: 'Do you offer post-launch support and revisions?',
      a: 'Yes! We include up to 3 small revision rounds within 2 days of delivery, plus 14 days of technical launch support.'
    },
    {
      q: 'What industries or design aesthetics do you specialize in?',
      a: 'We specialize in modern digital aesthetics for creative agencies, technology founders, design studios, and high-growth personal brands.'
    }
  ];

  function renderFaqCard(index, data = {}) {
    const card = document.createElement('div');
    card.className = 'repeater-card faq-card';
    card.innerHTML = `
      <div class="repeater-card-header">
        <div class="repeater-item-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <span>FAQ 0${index + 1}</span>
        </div>
        <button type="button" class="btn-remove-item btn-remove-faq" title="Remove FAQ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          <span>Remove</span>
        </button>
      </div>

      <div class="form-grid">
        <div class="col-12 form-group">
          <label class="form-label"><span>Question <span class="required">*</span></span></label>
          <input type="text" class="form-control faq-question" placeholder="e.g. What is your turnaround time?" value="${data.q || ''}" required>
        </div>

        <div class="col-12 form-group">
          <label class="form-label"><span>Answer <span class="required">*</span></span></label>
          <textarea class="form-control faq-answer" rows="2" placeholder="Write a clear, reassuring answer..." required>${data.a || ''}</textarea>
        </div>
      </div>
    `;

    card.querySelector('.btn-remove-faq').addEventListener('click', () => {
      const allFaqs = faqContainer.querySelectorAll('.faq-card');
      if (allFaqs.length <= 5) {
        showToast('A minimum of 5 FAQs is required.', 'error');
        return;
      }
      card.remove();
      triggerAutosave();
    });

    card.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', triggerAutosave);
    });

    return card;
  }

  btnAddFaq.addEventListener('click', () => {
    const current = faqContainer.querySelectorAll('.faq-card').length;
    faqContainer.appendChild(renderFaqCard(current));
    triggerAutosave();
  });

  // ==========================================
  // STEP NAVIGATION & PROGRESS
  // ==========================================
  function updateStepUI() {
    document.querySelectorAll('.form-step-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    const activePanel = document.getElementById(`step-${currentStep}`);
    if (activePanel) {
      activePanel.classList.add('active');
    }

    const percent = Math.round((currentStep / totalSteps) * 100);
    progressBarFill.style.width = `${percent}%`;
    progressPercentage.textContent = `${percent}%`;
    currentStepLabel.textContent = `Step ${currentStep} of ${totalSteps}: ${stepTitles[currentStep - 1]}`;

    const navButtons = stepperNav.querySelectorAll('.step-nav-btn');
    navButtons.forEach(btn => {
      const stepNum = parseInt(btn.dataset.step, 10);
      btn.classList.remove('active');
      if (stepNum === currentStep) {
        btn.classList.add('active');
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
      if (stepNum < currentStep) {
        btn.classList.add('completed');
      }
    });

    btnPrev.disabled = currentStep === 1;
    if (currentStep === totalSteps) {
      btnNext.style.display = 'none';
      renderLiveDossier();
    } else {
      btnNext.style.display = 'inline-flex';
      btnNext.innerHTML = `
        <span>Next Step</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      `;
    }

    // Scroll gently to top of intake wrapper when switching steps
    if (!isInitialLoad) {
      const intakeSection = document.getElementById('intake');
      if (intakeSection) {
        intakeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    isInitialLoad = false;
  }

  function validateCurrentStep() {
    const currentPanel = document.getElementById(`step-${currentStep}`);
    if (!currentPanel) return true;

    const requiredInputs = currentPanel.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;
    let firstInvalid = null;

    requiredInputs.forEach(input => {
      // Ignore hidden inputs (e.g. inactive conditional blocks for Personal/Agency)
      if (input.offsetParent === null && input.type !== 'hidden') {
        return;
      }

      if (input.type === 'checkbox') {
        if (!input.checked) {
          isValid = false;
          input.closest('.custom-checkbox-card')?.classList.add('shake');
          if (!firstInvalid) firstInvalid = input;
        }
      } else if (!input.value.trim()) {
        isValid = false;
        input.classList.add('input-error');
        if (!firstInvalid) firstInvalid = input;
      } else {
        input.classList.remove('input-error');
      }
    });

    if (currentStep === 3) {
      const projects = caseStudiesContainer.querySelectorAll('.project-card');
      if (projects.length < 2) {
        showToast('Please provide at least 2 case studies (Min 2, Max 4).', 'error');
        return false;
      }
    }

    if (currentStep === 6) {
      const faqs = faqContainer.querySelectorAll('.faq-card');
      if (faqs.length < 5) {
        showToast('Please provide at least 5 FAQs.', 'error');
        return false;
      }
    }

    if (!isValid) {
      showToast('Please complete all required fields before proceeding.', 'error');
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return false;
    }

    return true;
  }

  btnNext.addEventListener('click', () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps) {
        currentStep++;
        updateStepUI();
        triggerAutosave();
      }
    }
  });

  btnPrev.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      updateStepUI();
    }
  });

  stepperNav.addEventListener('click', (e) => {
    const btn = e.target.closest('.step-nav-btn');
    if (!btn) return;
    const targetStep = parseInt(btn.dataset.step, 10);
    if (targetStep < currentStep || validateCurrentStep()) {
      currentStep = targetStep;
      updateStepUI();
    }
  });

  // ==========================================
  // LIVE DOSSIER GENERATION
  // ==========================================
  function gatherFormData() {
    const selectedAccountType = document.querySelector('input[name="accountType"]:checked')?.value || 'Personal';
    const selectedTone = document.querySelector('input[name="preferredTone"]:checked')?.value || 'Minimal & Modern';
    const selectedStructure = document.querySelector('input[name="siteStructure"]:checked')?.value || 'Option A';
    
    const checkedPages = [];
    document.querySelectorAll('input[name="pagesNeeded"]:checked').forEach(cb => {
      checkedPages.push(cb.value);
    });

    const projects = [];
    caseStudiesContainer.querySelectorAll('.project-card').forEach((card, i) => {
      projects.push({
        num: i + 1,
        name: card.querySelector('.project-name')?.value || '',
        problem: card.querySelector('.project-problem')?.value || '',
        solution: card.querySelector('.project-solution')?.value || '',
        result: card.querySelector('.project-result')?.value || '',
        driveLink: card.querySelector('.project-drive-link')?.value || ''
      });
    });

    const services = [];
    servicesContainer.querySelectorAll('.service-card').forEach(card => {
      services.push({
        name: card.querySelector('.service-name')?.value || '',
        price: card.querySelector('.service-price')?.value || '',
        desc: card.querySelector('.service-desc')?.value || ''
      });
    });

    const testimonials = [];
    testimonialsContainer.querySelectorAll('.testimonial-card').forEach(card => {
      testimonials.push({
        author: card.querySelector('.testimonial-author')?.value || '',
        photo: card.querySelector('.testimonial-photo')?.value || '',
        text: card.querySelector('.testimonial-text')?.value || '',
        permission: card.querySelector('.testimonial-permission')?.checked || false
      });
    });

    const faqs = [];
    faqContainer.querySelectorAll('.faq-card').forEach(card => {
      faqs.push({
        q: card.querySelector('.faq-question')?.value || '',
        a: card.querySelector('.faq-answer')?.value || ''
      });
    });

    return {
      account: {
        type: selectedAccountType,
        personalRole: document.getElementById('personalRole')?.value || '',
        personalDiscipline: document.getElementById('personalDiscipline')?.value || 'UI/UX & Product Design',
        personalAvailability: document.getElementById('personalAvailability')?.value || 'Available for Freelance & Sprints',
        personalLocation: document.getElementById('personalLocation')?.value || '',
        personalResumeLink: document.getElementById('personalResumeLink')?.value || '',
        agencyNiche: document.getElementById('agencyNiche')?.value || 'B2B SaaS & Tech Startups',
        agencyTeamSize: document.getElementById('agencyTeamSize')?.value || 'Boutique Studio (1–5 specialists)',
        agencyEngagementModel: document.getElementById('agencyEngagementModel')?.value || 'Fixed-Scope Fast Sprints (5–10 days)',
        agencyMinBudget: document.getElementById('agencyMinBudget')?.value || '50,000 – 150,000 PKR / $300 – $800',
        agencyModel: document.getElementById('agencyModel')?.value || ''
      },
      branding: {
        name: document.getElementById('brandName')?.value || '',
        logoLink: document.getElementById('logoLink')?.value || '',
        primaryColor: document.getElementById('primaryColor')?.value || '#0A0D11',
        accentColor: document.getElementById('accentColor')?.value || '#38BDF8',
        fonts: document.getElementById('brandFonts')?.value || '',
        tone: selectedTone
      },
      about: {
        yearsExp: document.getElementById('yearsExp')?.value || '',
        clientsServed: document.getElementById('clientsServed')?.value || '',
        projectsCompleted: document.getElementById('projectsCompleted')?.value || '',
        story: document.getElementById('brandStory')?.value || ''
      },
      caseStudies: projects,
      services: services,
      testimonials: testimonials,
      faqs: faqs,
      contact: {
        email: document.getElementById('contactEmail')?.value || '',
        phone: document.getElementById('contactPhone')?.value || '',
        address: document.getElementById('contactAddress')?.value || '',
        prefMethod: document.getElementById('prefContactMethod')?.value || 'WhatsApp',
        hours: document.getElementById('businessHours')?.value || '',
        instagram: document.getElementById('socialInstagram')?.value || '',
        linkedin: document.getElementById('socialLinkedin')?.value || '',
        twitter: document.getElementById('socialTwitter')?.value || '',
        behance: document.getElementById('socialBehance')?.value || ''
      },
      founder: {
        name: document.getElementById('founderName')?.value || '',
        title: document.getElementById('founderTitle')?.value || '',
        imagesLink: document.getElementById('personalImagesLink')?.value || '',
        bio: document.getElementById('founderBio')?.value || ''
      },
      structure: {
        choice: selectedStructure,
        pages: checkedPages,
        existingStatus: document.getElementById('existingSiteStatus')?.value || '',
        existingUrl: document.getElementById('existingSiteUrl')?.value || '',
        domainStatus: document.getElementById('domainStatus')?.value || '',
        deadline: document.getElementById('targetLaunchDate')?.value || '',
        references: document.getElementById('referenceSites')?.value || '',
        copyStatus: document.getElementById('copyStatus')?.value || ''
      },
      policy: {
        agreed: document.getElementById('policyAgreementCheck')?.checked || false,
        signature: document.getElementById('clientSignatureName')?.value || '',
        date: document.getElementById('agreementDate')?.value || ''
      }
    };
  }

  function renderLiveDossier() {
    const d = gatherFormData();
    reviewDossier.innerHTML = `
      <div class="dossier-account-banner">
        <div class="dossier-account-info">
          <span class="dossier-account-pill ${d.account.type === 'Personal' ? 'pill-personal' : 'pill-agency'}">
            ${d.account.type === 'Personal' ? '👤 Personal Portfolio' : '🏢 Agency / Studio'}
          </span>
          <span class="dossier-account-tagline">
            ${d.account.type === 'Personal' 
              ? (d.account.personalRole || 'Solo Creator & Specialist') 
              : (d.account.agencyNiche || 'Creative Agency Flagship')}
          </span>
        </div>
        <button type="button" class="dossier-edit-btn" onclick="jumpToStep(1)">Change Account Type</button>
      </div>

      <div class="dossier-section-block">
        <div class="dossier-section-head">
          <span class="dossier-section-title">00. Account & Strategy Specification</span>
          <button type="button" class="dossier-edit-btn" onclick="jumpToStep(1)">Edit</button>
        </div>
        <div class="dossier-grid">
          <div class="dossier-item"><span class="dossier-label">Account Category</span><span class="dossier-val">${d.account.type === 'Personal' ? 'Personal Portfolio (Solo)' : 'Agency / Studio'}</span></div>
          ${d.account.type === 'Personal' ? `
            <div class="dossier-item"><span class="dossier-label">Professional Role</span><span class="dossier-val">${d.account.personalRole || 'Not specified'}</span></div>
            <div class="dossier-item"><span class="dossier-label">Discipline</span><span class="dossier-val">${d.account.personalDiscipline}</span></div>
            <div class="dossier-item"><span class="dossier-label">Availability</span><span class="dossier-val" style="color:#10b981;">${d.account.personalAvailability}</span></div>
            <div class="dossier-item"><span class="dossier-label">Current Base</span><span class="dossier-val">${d.account.personalLocation || 'Remote'}</span></div>
            <div class="dossier-item"><span class="dossier-label">Resume / CV</span><span class="dossier-val">${d.account.personalResumeLink ? `<a href="${d.account.personalResumeLink}" target="_blank" style="color:var(--accent-cyan);">View Credentials</a>` : 'Not provided'}</span></div>
          ` : `
            <div class="dossier-item"><span class="dossier-label">Agency Core Niche</span><span class="dossier-val">${d.account.agencyNiche}</span></div>
            <div class="dossier-item"><span class="dossier-label">Team Size / Headcount</span><span class="dossier-val">${d.account.agencyTeamSize}</span></div>
            <div class="dossier-item"><span class="dossier-label">Engagement Model</span><span class="dossier-val">${d.account.agencyEngagementModel}</span></div>
            <div class="dossier-item"><span class="dossier-label">Project Minimum</span><span class="dossier-val" style="color:#38bdf8;">${d.account.agencyMinBudget}</span></div>
            <div class="dossier-item" style="grid-column: span 2;"><span class="dossier-label">Studio Operating Model</span><span class="dossier-val">${d.account.agencyModel || 'Remote Studio'}</span></div>
          `}
        </div>
      </div>

      <div class="dossier-section-block">
        <div class="dossier-section-head">
          <span class="dossier-section-title">01. Branding & Identity</span>
          <button type="button" class="dossier-edit-btn" onclick="jumpToStep(1)">Edit</button>
        </div>
        <div class="dossier-grid">
          <div class="dossier-item"><span class="dossier-label">${d.account.type === 'Personal' ? 'Personal Name' : 'Agency / Studio Name'}</span><span class="dossier-val">${d.branding.name || 'Not provided'}</span></div>
          <div class="dossier-item"><span class="dossier-label">Aesthetic Tone</span><span class="dossier-val">${d.branding.tone}</span></div>
          <div class="dossier-item"><span class="dossier-label">Brand Colors</span><span class="dossier-val">${d.branding.primaryColor} / ${d.branding.accentColor}</span></div>
          <div class="dossier-item"><span class="dossier-label">Logo Link</span><span class="dossier-val"><a href="${d.branding.logoLink}" target="_blank" style="color:var(--accent-cyan);">${d.branding.logoLink ? 'View Assets' : 'Pending'}</a></span></div>
        </div>
      </div>

      <div class="dossier-section-block">
        <div class="dossier-section-head">
          <span class="dossier-section-title">02. About & Metrics</span>
          <button type="button" class="dossier-edit-btn" onclick="jumpToStep(2)">Edit</button>
        </div>
        <div class="dossier-grid">
          <div class="dossier-item"><span class="dossier-label">Experience</span><span class="dossier-val">${d.about.yearsExp || '-'}</span></div>
          <div class="dossier-item"><span class="dossier-label">Clients Served</span><span class="dossier-val">${d.about.clientsServed || '-'}</span></div>
          <div class="dossier-item"><span class="dossier-label">Projects Completed</span><span class="dossier-val">${d.about.projectsCompleted || '-'}</span></div>
          <div class="dossier-item" style="grid-column: span 2;"><span class="dossier-label">${d.account.type === 'Personal' ? 'Personal Bio' : 'Agency Mission'}</span><span class="dossier-val">${d.about.story || '-'}</span></div>
        </div>
      </div>

      <div class="dossier-section-block">
        <div class="dossier-section-head">
          <span class="dossier-section-title">03. Case Studies (${d.caseStudies.length} Projects)</span>
          <button type="button" class="dossier-edit-btn" onclick="jumpToStep(3)">Edit</button>
        </div>
        <div>
          ${d.caseStudies.map(p => `
            <div style="margin-bottom: 12px; padding: 12px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px;">
              <strong>${p.name || 'Untitled Case Study'}</strong> — 
              <a href="${p.driveLink}" target="_blank" style="color: var(--accent-cyan); font-size: 0.82rem;">Drive Folder</a><br>
              <span style="font-size: 0.82rem; color: var(--text-weak);">Problem: ${p.problem ? `${p.problem.substring(0, 60)}...` : 'Provided'}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="dossier-section-block">
        <div class="dossier-section-head">
          <span class="dossier-section-title">04. Scope, Architecture & Policy</span>
          <button type="button" class="dossier-edit-btn" onclick="jumpToStep(9)">Edit</button>
        </div>
        <div class="dossier-grid">
          <div class="dossier-item"><span class="dossier-label">Case Study Structure</span><span class="dossier-val">${d.structure.choice}</span></div>
          <div class="dossier-item"><span class="dossier-label">Pages Selected</span><span class="dossier-val">${d.structure.pages.join(', ') || 'None'}</span></div>
          <div class="dossier-item"><span class="dossier-label">Target Launch Date</span><span class="dossier-val">${d.structure.deadline || 'Flexible'}</span></div>
          <div class="dossier-item"><span class="dossier-label">Revision Policy Agreement</span><span class="dossier-val" style="color: #10b981;">${d.policy.agreed ? `Signed by ${d.policy.signature} (${d.policy.date})` : 'Pending Signature'}</span></div>
        </div>
      </div>
    `;

    updateWhatsAppLink(d);
  }

  window.jumpToStep = function(step) {
    currentStep = step;
    updateStepUI();
  };

  // WhatsApp & Exporters
  function generateFormattedMarkdown(data) {
    return `# ALIE CREATIVES — Client Portfolio Intake Dossier
**Submitted Date:** ${new Date().toLocaleDateString()}
**Account Type:** ${data.account.type === 'Personal' ? '👤 Personal Portfolio (Solo Creator)' : '🏢 Agency / Studio'}
**Authorized Signatory:** ${data.policy.signature || data.branding.name}

---

## 0. Account & Strategy Specification
* **Account Category:** ${data.account.type === 'Personal' ? 'Personal Portfolio' : 'Agency / Studio'}
${data.account.type === 'Personal' ? `* **Professional Title:** ${data.account.personalRole || 'N/A'}
* **Primary Discipline:** ${data.account.personalDiscipline}
* **Availability Status:** ${data.account.personalAvailability}
* **Current Base & Remote Preference:** ${data.account.personalLocation || 'N/A'}
* **Resume / CV / Credentials:** ${data.account.personalResumeLink || 'N/A'}` : `* **Agency Core Niche:** ${data.account.agencyNiche}
* **Team Size / Headcount:** ${data.account.agencyTeamSize}
* **Client Engagement Model:** ${data.account.agencyEngagementModel}
* **Minimum Project Engagement:** ${data.account.agencyMinBudget}
* **Studio Operating Model:** ${data.account.agencyModel || 'N/A'}`}

---

## 1. Branding & Identity
* **${data.account.type === 'Personal' ? 'Personal Name' : 'Agency / Studio Name'}:** ${data.branding.name}
* **Preferred Aesthetic:** ${data.branding.tone}
* **Colors:** Primary: ${data.branding.primaryColor} | Accent: ${data.branding.accentColor}
* **Fonts:** ${data.branding.fonts || 'Google Sans & Inter'}
* **Official Logo Asset Link:** ${data.branding.logoLink}

---

## 2. About Us & Metrics
* **Years of Experience:** ${data.about.yearsExp}
* **Total Clients Served:** ${data.about.clientsServed}
* **Projects Completed:** ${data.about.projectsCompleted}
* **${data.account.type === 'Personal' ? 'Personal Bio' : 'Brand Story'}:**
> ${data.about.story}

---

## 3. Past Work / Case Studies
${data.caseStudies.map(cs => `
### ${cs.name}
* **Problem:** ${cs.problem}
* **Solution:** ${cs.solution}
* **Result:** ${cs.result}
* **Google Drive Link (Min 4 High-Res Images):** ${cs.driveLink}
`).join('\n')}

---

## 4. Services Offered
${data.services.map(s => `* **${s.name}** (${s.price || 'Contact for Quote'}): ${s.desc}`).join('\n')}

---

## 5. Client Testimonials
${data.testimonials.map(t => `
* **${t.author}**: "${t.text}"
  * Asset Link: ${t.photo || 'N/A'}
  * Public Display Permission: ${t.permission ? 'Yes' : 'No'}
`).join('\n')}

---

## 6. FAQs (5+ Questions)
${data.faqs.map((f, i) => `**Q${i+1}: ${f.q}**\n* ${f.a}`).join('\n\n')}

---

## 7. Contact Details
* **Email:** ${data.contact.email}
* **Phone / WhatsApp:** ${data.contact.phone}
* **Address:** ${data.contact.address || 'Remote'}
* **Preferred Contact Channel:** ${data.contact.prefMethod}
* **Business Hours:** ${data.contact.hours || 'Standard'}
* **Socials:** Instagram: ${data.contact.instagram} | LinkedIn: ${data.contact.linkedin} | X: ${data.contact.twitter} | Behance: ${data.contact.behance}

---

## 8. ${data.account.type === 'Personal' ? 'Personal Profile & Showcase' : 'Leadership & Founder Profile'}
* **${data.account.type === 'Personal' ? 'Full Name' : 'Founder / Lead Name'}:** ${data.founder.name || 'N/A'}
* **Title:** ${data.founder.title || 'N/A'}
* **Headshot Link:** ${data.founder.imagesLink || 'N/A'}
* **Bio:** ${data.founder.bio || 'N/A'}

---

## 9. Website Architecture & Preferences
* **Case Study Structure:** ${data.structure.choice}
* **Pages Required:** ${data.structure.pages.join(', ')}
* **Website Build Type:** ${data.structure.existingStatus} ${data.structure.existingUrl ? `(${data.structure.existingUrl})` : ''}
* **Domain Status:** ${data.structure.domainStatus}
* **Target Launch Date:** ${data.structure.deadline}
* **Reference Websites:**
${data.structure.references}
* **Website Copy Status:** ${data.structure.copyStatus}

---

## 10. Revision Policy & Terms Agreement
* **Revision Policy Terms:** 3 small revisions included within 2 days of delivery. Additional revisions billed at 500 PKR each.
* **Agreement Check:** ${data.policy.agreed ? 'AGREED & SIGNED' : 'NOT AGREED'}
* **Signed By:** ${data.policy.signature}
* **Date:** ${data.policy.date}

---
*Created via **ALIE CREATIVES** Client Onboarding Portal.*
`;
  }

  // ==========================================
  // COMPLETE WHATSAPP SUBMISSION GENERATOR (ALL SECTIONS & DATA)
  // ==========================================
  function generateCompleteWhatsAppMessage(data) {
    const lines = [];
    const isPersonal = data.account.type === 'Personal';
    const subId = `ALIE-INTAKE-${Date.now().toString().slice(-6)}`;
    const today = new Date().toISOString().split('T')[0];

    lines.push(`*🚀 ALIE CREATIVES — Client Portfolio Intake Dossier*`);
    lines.push(`*Submission ID:* ${subId} | *Date:* ${today}`);
    lines.push(``);

    // 00. Strategy & Account
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`*00. ACCOUNT & STRATEGY SPECIFICATION*`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`• *Category:* ${isPersonal ? '👤 Personal Portfolio (Solo Specialist)' : '🏢 Agency / Studio'}`);
    if (isPersonal) {
      if (data.account.personalRole) lines.push(`• *Title / Role:* ${data.account.personalRole}`);
      lines.push(`• *Primary Discipline:* ${data.account.personalDiscipline}`);
      lines.push(`• *Availability:* ${data.account.personalAvailability}`);
      if (data.account.personalLocation) lines.push(`• *Base / Location:* ${data.account.personalLocation}`);
      if (data.account.personalResumeLink) lines.push(`• *Resume / CV:* ${data.account.personalResumeLink}`);
    } else {
      lines.push(`• *Agency Niche:* ${data.account.agencyNiche}`);
      lines.push(`• *Team Headcount:* ${data.account.agencyTeamSize}`);
      lines.push(`• *Engagement Model:* ${data.account.agencyEngagementModel}`);
      lines.push(`• *Minimum Project:* ${data.account.agencyMinBudget}`);
      if (data.account.agencyModel) lines.push(`• *Operating Model:* ${data.account.agencyModel}`);
    }
    lines.push(``);

    // 01. Branding & Identity
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`*01. BRANDING & IDENTITY*`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`• *Client / Brand Name:* ${data.branding.name || 'Not provided'}`);
    lines.push(`• *Aesthetic Tone:* ${data.branding.tone}`);
    lines.push(`• *Primary Color:* ${data.branding.primaryColor}`);
    lines.push(`• *Accent Color:* ${data.branding.accentColor}`);
    if (data.branding.fonts) lines.push(`• *Brand Fonts:* ${data.branding.fonts}`);
    if (data.branding.logoLink) lines.push(`• *Official Logo Assets:* ${data.branding.logoLink}`);
    lines.push(``);

    // 02. About Us & Authority
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`*02. ABOUT & CREDIBILITY METRICS*`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    if (data.about.yearsExp) lines.push(`• *Years Experience:* ${data.about.yearsExp}`);
    if (data.about.clientsServed) lines.push(`• *Clients Served:* ${data.about.clientsServed}`);
    if (data.about.projectsCompleted) lines.push(`• *Projects Completed:* ${data.about.projectsCompleted}`);
    if (data.about.story) {
      lines.push(`• *Brand Story / Bio:*`);
      lines.push(`  ${data.about.story}`);
    }
    lines.push(``);

    // 03. Case Studies
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`*03. CASE STUDIES (${data.caseStudies.length} Flagship Projects)*`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    data.caseStudies.forEach((cs, i) => {
      lines.push(`📁 *Case Study 0${i + 1}: ${cs.name || 'Untitled Project'}*`);
      if (cs.driveLink) lines.push(`   • Assets Link: ${cs.driveLink}`);
      if (cs.problem) lines.push(`   • Problem: ${cs.problem}`);
      if (cs.solution) lines.push(`   • Solution: ${cs.solution}`);
      if (cs.result) lines.push(`   • Results: ${cs.result}`);
      lines.push(``);
    });

    // 04. Services Offered
    if (data.services.length > 0) {
      lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`*04. SERVICES OFFERED (${data.services.length} Services)*`);
      lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      data.services.forEach(s => {
        const price = s.price ? ` (${s.price})` : '';
        const desc = s.desc ? `: ${s.desc}` : '';
        lines.push(`• *${s.name || 'Service'}*${price}${desc}`);
      });
      lines.push(``);
    }

    // 05. Testimonials
    if (data.testimonials.length > 0) {
      lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`*05. CLIENT TESTIMONIALS (${data.testimonials.length} Reviews)*`);
      lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      data.testimonials.forEach(t => {
        const perm = t.permission ? 'Public Permission Granted' : 'Internal Only';
        lines.push(`• *${t.author || 'Client Partner'}* (${perm})`);
        if (t.text) lines.push(`  "${t.text}"`);
        if (t.photo) lines.push(`  Photo: ${t.photo}`);
      });
      lines.push(``);
    }

    // 06. FAQs
    if (data.faqs.length > 0) {
      lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`*06. FREQUENTLY ASKED QUESTIONS (${data.faqs.length} FAQs)*`);
      lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      data.faqs.forEach((f, i) => {
        lines.push(`*Q${i + 1}: ${f.q}*`);
        lines.push(`A: ${f.a}`);
      });
      lines.push(``);
    }

    // 07. Contact Details & Socials
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`*07. CONTACT DETAILS & CHANNELS*`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`• *Email:* ${data.contact.email || 'Pending'}`);
    lines.push(`• *Phone / WhatsApp:* ${data.contact.phone || 'Pending'}`);
    if (data.contact.address) lines.push(`• *Address / Base:* ${data.contact.address}`);
    lines.push(`• *Preferred Method:* ${data.contact.prefMethod}`);
    if (data.contact.hours) lines.push(`• *Business Hours:* ${data.contact.hours}`);
    if (data.contact.instagram) lines.push(`• *Instagram:* ${data.contact.instagram}`);
    if (data.contact.linkedin) lines.push(`• *LinkedIn:* ${data.contact.linkedin}`);
    if (data.contact.twitter) lines.push(`• *X / Twitter:* ${data.contact.twitter}`);
    if (data.contact.behance) lines.push(`• *Behance / Dribbble:* ${data.contact.behance}`);
    lines.push(``);

    // 08. Founder Profile
    if (data.founder.name || data.founder.title || data.founder.imagesLink || data.founder.bio) {
      lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`*08. ${isPersonal ? 'PERSONAL PROFILE' : 'LEADERSHIP PROFILE'}*`);
      lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      if (data.founder.name) lines.push(`• *Name:* ${data.founder.name}`);
      if (data.founder.title) lines.push(`• *Designation:* ${data.founder.title}`);
      if (data.founder.imagesLink) lines.push(`• *Headshot Drive Link:* ${data.founder.imagesLink}`);
      if (data.founder.bio) lines.push(`• *Bio:* ${data.founder.bio}`);
      lines.push(``);
    }

    // 09. Architecture
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`*09. WEBSITE ARCHITECTURE & PREFERENCES*`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`• *Case Study Structure:* ${data.structure.choice}`);
    lines.push(`• *Pages Required:* ${data.structure.pages.join(', ') || 'Home'}`);
    lines.push(`• *Build Status:* ${data.structure.existingStatus}`);
    if (data.structure.existingUrl) lines.push(`• *Existing Website:* ${data.structure.existingUrl}`);
    lines.push(`• *Domain Status:* ${data.structure.domainStatus}`);
    lines.push(`• *Target Launch Date:* ${data.structure.deadline || 'Flexible'}`);
    if (data.structure.references) {
      lines.push(`• *Reference Websites:*`);
      lines.push(`  ${data.structure.references}`);
    }
    lines.push(`• *Website Copy Status:* ${data.structure.copyStatus}`);
    lines.push(``);

    // 10. Revision Policy & Agreement
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`*10. REVISION POLICY & AGREEMENT*`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`• *Revision Terms:* 3 small revisions within 2 days of delivery (extra at 500 PKR each).`);
    lines.push(`• *Agreement Acceptance:* ${data.policy.agreed ? '✅ SIGNED & ACCEPTED' : '❌ PENDING SIGNATURE'}`);
    lines.push(`• *Authorized Signatory:* ${data.policy.signature || data.branding.name || 'Client'}`);
    lines.push(`• *Date Signed:* ${data.policy.date || today}`);
    lines.push(``);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`_Submitted via ALIE CREATIVES Client Onboarding System_`);

    return lines.join('\n');
  }

  function getWhatsAppUrl(messageText) {
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
  }

  function updateWhatsAppLink(data) {
    const btn = document.getElementById('btnSendWhatsApp');
    if (!btn) return;
    const msg = generateCompleteWhatsAppMessage(data);
    btn.href = getWhatsAppUrl(msg);
  }

  // ==========================================
  // CSV EXPORTER ENGINE (FULL DATABASE & 2-COLUMN DOSSIER)
  // ==========================================

  const MASTER_DATABASE_COLUMNS = [
    // 00. Metadata
    "Submission ID",
    "Submission Date & Time",
    
    // 01. Account & Strategy
    "Account Category",
    "Client or Brand Name",
    "Official Email",
    "Phone / WhatsApp",
    "Physical Address / Location",
    "Preferred Contact Method",
    "Business Operating Hours",
    "Instagram Handle / URL",
    "LinkedIn Profile URL",
    "X (Twitter) Handle / URL",
    "Behance / Dribbble URL",

    // 02. Branding & Identity
    "Aesthetic Tone Preference",
    "Primary Brand Color (Hex)",
    "Accent Brand Color (Hex)",
    "Brand Typography & Fonts",
    "Logo Asset Link (Drive/Dropbox)",

    // 03. About Us & Authority Metrics
    "Years of Experience",
    "Total Clients Served",
    "Projects Completed",
    "Brand Story / Personal Bio",

    // 04. Personal Strategy (If Personal Portfolio)
    "Personal - Professional Title",
    "Personal - Primary Discipline",
    "Personal - Availability Status",
    "Personal - Base Location",
    "Personal - Resume & CV Link",

    // 05. Agency Strategy (If Agency/Studio)
    "Agency - Core Market Niche",
    "Agency - Team Size / Headcount",
    "Agency - Client Engagement Model",
    "Agency - Minimum Project Engagement",
    "Agency - Studio Operating Model",

    // 06. Founder / Leadership Spotlight
    "Founder / Lead - Full Name",
    "Founder / Lead - Designation",
    "Founder / Lead - Headshot Drive Link",
    "Founder / Lead - Bio",

    // 07. Case Studies 1 to 4
    "Case Study 1 - Title",
    "Case Study 1 - Drive Link (Min 4 Images)",
    "Case Study 1 - Problem Statement",
    "Case Study 1 - Executed Solution",
    "Case Study 1 - Measurable Results",

    "Case Study 2 - Title",
    "Case Study 2 - Drive Link (Min 4 Images)",
    "Case Study 2 - Problem Statement",
    "Case Study 2 - Executed Solution",
    "Case Study 2 - Measurable Results",

    "Case Study 3 - Title",
    "Case Study 3 - Drive Link (Min 4 Images)",
    "Case Study 3 - Problem Statement",
    "Case Study 3 - Executed Solution",
    "Case Study 3 - Measurable Results",

    "Case Study 4 - Title",
    "Case Study 4 - Drive Link (Min 4 Images)",
    "Case Study 4 - Problem Statement",
    "Case Study 4 - Executed Solution",
    "Case Study 4 - Measurable Results",

    // 08. Services Offered
    "Service 1 - Name",
    "Service 1 - Starting Price",
    "Service 1 - Scope & Description",

    "Service 2 - Name",
    "Service 2 - Starting Price",
    "Service 2 - Scope & Description",

    "Service 3 - Name",
    "Service 3 - Starting Price",
    "Service 3 - Scope & Description",

    "Service 4 - Name",
    "Service 4 - Starting Price",
    "Service 4 - Scope & Description",

    "All Services List",

    // 09. Client Testimonials & Reviews
    "Testimonial 1 - Author",
    "Testimonial 1 - Quote",
    "Testimonial 1 - Photo Asset Link",
    "Testimonial 1 - Public Display Permission",

    "Testimonial 2 - Author",
    "Testimonial 2 - Quote",
    "Testimonial 2 - Photo Asset Link",
    "Testimonial 2 - Public Display Permission",

    "Testimonial 3 - Author",
    "Testimonial 3 - Quote",
    "Testimonial 3 - Photo Asset Link",
    "Testimonial 3 - Public Display Permission",

    "All Testimonials List",

    // 10. Frequently Asked Questions
    "FAQ 1 - Question",
    "FAQ 1 - Answer",
    "FAQ 2 - Question",
    "FAQ 2 - Answer",
    "FAQ 3 - Question",
    "FAQ 3 - Answer",
    "FAQ 4 - Question",
    "FAQ 4 - Answer",
    "FAQ 5 - Question",
    "FAQ 5 - Answer",

    "All FAQs List",

    // 11. Website Architecture & Preferences
    "Case Study Structure Preference",
    "Pages Required",
    "Website Build Status",
    "Existing Website URL",
    "Domain Status",
    "Preferred Target Launch Date",
    "Reference Websites & Notes",
    "Website Copywriting Status",

    // 12. Policy & Legal Agreement
    "Revision Policy Agreed",
    "Authorized Legal Signatory",
    "Date of Agreement"
  ];

  function buildFullDatabaseRecord(data) {
    const isPersonal = data.account.type === 'Personal';
    const subId = `ALIE-INTAKE-${Date.now()}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    return {
      "Submission ID": subId,
      "Submission Date & Time": timestamp,
      "Account Category": isPersonal ? 'Personal Portfolio (Solo Creator)' : 'Agency / Studio',
      "Client or Brand Name": data.branding.name || '',
      "Official Email": data.contact.email || '',
      "Phone / WhatsApp": data.contact.phone || '',
      "Physical Address / Location": data.contact.address || '',
      "Preferred Contact Method": data.contact.prefMethod || '',
      "Business Operating Hours": data.contact.hours || '',
      "Instagram Handle / URL": data.contact.instagram || '',
      "LinkedIn Profile URL": data.contact.linkedin || '',
      "X (Twitter) Handle / URL": data.contact.twitter || '',
      "Behance / Dribbble URL": data.contact.behance || '',

      "Aesthetic Tone Preference": data.branding.tone || '',
      "Primary Brand Color (Hex)": data.branding.primaryColor || '',
      "Accent Brand Color (Hex)": data.branding.accentColor || '',
      "Brand Typography & Fonts": data.branding.fonts || '',
      "Logo Asset Link (Drive/Dropbox)": data.branding.logoLink || '',

      "Years of Experience": data.about.yearsExp || '',
      "Total Clients Served": data.about.clientsServed || '',
      "Projects Completed": data.about.projectsCompleted || '',
      "Brand Story / Personal Bio": data.about.story || '',

      "Personal - Professional Title": isPersonal ? (data.account.personalRole || '') : '',
      "Personal - Primary Discipline": isPersonal ? (data.account.personalDiscipline || '') : '',
      "Personal - Availability Status": isPersonal ? (data.account.personalAvailability || '') : '',
      "Personal - Base Location": isPersonal ? (data.account.personalLocation || '') : '',
      "Personal - Resume & CV Link": isPersonal ? (data.account.personalResumeLink || '') : '',

      "Agency - Core Market Niche": !isPersonal ? (data.account.agencyNiche || '') : '',
      "Agency - Team Size / Headcount": !isPersonal ? (data.account.agencyTeamSize || '') : '',
      "Agency - Client Engagement Model": !isPersonal ? (data.account.agencyEngagementModel || '') : '',
      "Agency - Minimum Project Engagement": !isPersonal ? (data.account.agencyMinBudget || '') : '',
      "Agency - Studio Operating Model": !isPersonal ? (data.account.agencyModel || '') : '',

      "Founder / Lead - Full Name": data.founder.name || '',
      "Founder / Lead - Designation": data.founder.title || '',
      "Founder / Lead - Headshot Drive Link": data.founder.imagesLink || '',
      "Founder / Lead - Bio": data.founder.bio || '',

      "Case Study 1 - Title": data.caseStudies[0]?.name || '',
      "Case Study 1 - Drive Link (Min 4 Images)": data.caseStudies[0]?.driveLink || '',
      "Case Study 1 - Problem Statement": data.caseStudies[0]?.problem || '',
      "Case Study 1 - Executed Solution": data.caseStudies[0]?.solution || '',
      "Case Study 1 - Measurable Results": data.caseStudies[0]?.result || '',

      "Case Study 2 - Title": data.caseStudies[1]?.name || '',
      "Case Study 2 - Drive Link (Min 4 Images)": data.caseStudies[1]?.driveLink || '',
      "Case Study 2 - Problem Statement": data.caseStudies[1]?.problem || '',
      "Case Study 2 - Executed Solution": data.caseStudies[1]?.solution || '',
      "Case Study 2 - Measurable Results": data.caseStudies[1]?.result || '',

      "Case Study 3 - Title": data.caseStudies[2]?.name || '',
      "Case Study 3 - Drive Link (Min 4 Images)": data.caseStudies[2]?.driveLink || '',
      "Case Study 3 - Problem Statement": data.caseStudies[2]?.problem || '',
      "Case Study 3 - Executed Solution": data.caseStudies[2]?.solution || '',
      "Case Study 3 - Measurable Results": data.caseStudies[2]?.result || '',

      "Case Study 4 - Title": data.caseStudies[3]?.name || '',
      "Case Study 4 - Drive Link (Min 4 Images)": data.caseStudies[3]?.driveLink || '',
      "Case Study 4 - Problem Statement": data.caseStudies[3]?.problem || '',
      "Case Study 4 - Executed Solution": data.caseStudies[3]?.solution || '',
      "Case Study 4 - Measurable Results": data.caseStudies[3]?.result || '',

      "Service 1 - Name": data.services[0]?.name || '',
      "Service 1 - Starting Price": data.services[0]?.price || '',
      "Service 1 - Scope & Description": data.services[0]?.desc || '',

      "Service 2 - Name": data.services[1]?.name || '',
      "Service 2 - Starting Price": data.services[1]?.price || '',
      "Service 2 - Scope & Description": data.services[1]?.desc || '',

      "Service 3 - Name": data.services[2]?.name || '',
      "Service 3 - Starting Price": data.services[2]?.price || '',
      "Service 3 - Scope & Description": data.services[2]?.desc || '',

      "Service 4 - Name": data.services[3]?.name || '',
      "Service 4 - Starting Price": data.services[3]?.price || '',
      "Service 4 - Scope & Description": data.services[3]?.desc || '',

      "All Services List": data.services.map(s => `${s.name} (${s.price || 'N/A'}): ${s.desc || ''}`).filter(Boolean).join('; '),

      "Testimonial 1 - Author": data.testimonials[0]?.author || '',
      "Testimonial 1 - Quote": data.testimonials[0]?.text || '',
      "Testimonial 1 - Photo Asset Link": data.testimonials[0]?.photo || '',
      "Testimonial 1 - Public Display Permission": data.testimonials[0] ? (data.testimonials[0].permission ? 'Yes' : 'No') : '',

      "Testimonial 2 - Author": data.testimonials[1]?.author || '',
      "Testimonial 2 - Quote": data.testimonials[1]?.text || '',
      "Testimonial 2 - Photo Asset Link": data.testimonials[1]?.photo || '',
      "Testimonial 2 - Public Display Permission": data.testimonials[1] ? (data.testimonials[1].permission ? 'Yes' : 'No') : '',

      "Testimonial 3 - Author": data.testimonials[2]?.author || '',
      "Testimonial 3 - Quote": data.testimonials[2]?.text || '',
      "Testimonial 3 - Photo Asset Link": data.testimonials[2]?.photo || '',
      "Testimonial 3 - Public Display Permission": data.testimonials[2] ? (data.testimonials[2].permission ? 'Yes' : 'No') : '',

      "All Testimonials List": data.testimonials.map(t => `${t.author}: "${t.text}" (Permission: ${t.permission ? 'Yes' : 'No'})`).filter(Boolean).join('; '),

      "FAQ 1 - Question": data.faqs[0]?.q || '',
      "FAQ 1 - Answer": data.faqs[0]?.a || '',

      "FAQ 2 - Question": data.faqs[1]?.q || '',
      "FAQ 2 - Answer": data.faqs[1]?.a || '',

      "FAQ 3 - Question": data.faqs[2]?.q || '',
      "FAQ 3 - Answer": data.faqs[2]?.a || '',

      "FAQ 4 - Question": data.faqs[3]?.q || '',
      "FAQ 4 - Answer": data.faqs[3]?.a || '',

      "FAQ 5 - Question": data.faqs[4]?.q || '',
      "FAQ 5 - Answer": data.faqs[4]?.a || '',

      "All FAQs List": data.faqs.map(f => `Q: ${f.q} | A: ${f.a}`).filter(Boolean).join('; '),

      "Case Study Structure Preference": data.structure.choice || '',
      "Pages Required": (data.structure.pages || []).join(', '),
      "Website Build Status": data.structure.existingStatus || '',
      "Existing Website URL": data.structure.existingUrl || '',
      "Domain Status": data.structure.domainStatus || '',
      "Preferred Target Launch Date": data.structure.deadline || '',
      "Reference Websites & Notes": data.structure.references || '',
      "Website Copywriting Status": data.structure.copyStatus || '',

      "Revision Policy Agreed": data.policy.agreed ? 'Yes (Accepted)' : 'No',
      "Authorized Legal Signatory": data.policy.signature || '',
      "Date of Agreement": data.policy.date || ''
    };
  }

  function escapeCsvCell(val) {
    if (val === null || val === undefined) return '""';
    let str = String(val).trim();
    // Normalize newlines to prevent breaking single CSV row in Excel
    str = str.replace(/\r\n|\r|\n/g, ' \\ ');
    // Escape double quotes as per RFC-4180
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  }

  // Multi-column Tabular CSV (Row 1 = Column Headings, Row 2 = Data Values)
  function generateTabularCsvContent(data) {
    const record = buildFullDatabaseRecord(data);
    const lines = [];
    // sep=, directive instructs Microsoft Excel to strictly separate by comma
    lines.push('sep=,');
    lines.push(MASTER_DATABASE_COLUMNS.map(col => escapeCsvCell(col)).join(','));
    lines.push(MASTER_DATABASE_COLUMNS.map(col => escapeCsvCell(record[col] || '')).join(','));
    return `\uFEFF${lines.join('\r\n')}\r\n`;
  }

  // Two-column Dossier CSV (Column A = Headings, Column B = Data Values)
  function generateTwoColumnCsvContent(data) {
    const record = buildFullDatabaseRecord(data);
    const lines = [];
    lines.push('sep=,');
    lines.push('"Field / Specification Heading","Client Submitted Information"');
    MASTER_DATABASE_COLUMNS.forEach(col => {
      const val = record[col] || '';
      lines.push(`${escapeCsvCell(col)},${escapeCsvCell(val)}`);
    });
    return `\uFEFF${lines.join('\r\n')}\r\n`;
  }

  // Download helper
  function triggerCsvDownload(csvString, filename) {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ==========================================
  // FORM RESET & AUTOMATIC CLEANUP ENGINE
  // ==========================================
  function clearAllFormFieldsAndStorage() {
    // 1. Remove draft from browser storage
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch(e) {}

    // 2. Native form reset
    form.reset();

    // 3. Explicitly wipe every text, url, email, tel, date input and textarea
    form.querySelectorAll('input, textarea').forEach(el => {
      if (el.type === 'radio' || el.type === 'checkbox') return;
      el.value = '';
    });

    // Reset Personal / Agency specific conditional inputs
    const textFieldsToClear = [
      'personalRole', 'personalLocation', 'personalResumeLink',
      'agencyModel', 'brandName', 'logoLink', 'brandFonts',
      'yearsExp', 'clientsServed', 'projectsCompleted', 'brandStory',
      'contactEmail', 'contactPhone', 'contactAddress', 'businessHours',
      'socialInstagram', 'socialLinkedin', 'socialTwitter', 'socialBehance',
      'founderName', 'founderTitle', 'personalImagesLink', 'founderBio',
      'existingSiteUrl', 'targetLaunchDate', 'referenceSites', 'clientSignatureName'
    ];
    textFieldsToClear.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    // 4. Reset colors
    if (primaryColor) primaryColor.value = '#0A0D11';
    if (primaryColorPicker) primaryColorPicker.value = '#0a0d11';
    if (accentColor) accentColor.value = '#38BDF8';
    if (accentColorPicker) accentColorPicker.value = '#38bdf8';

    // 5. Reset radios
    const personalRadio = document.getElementById('accountTypePersonal');
    if (personalRadio) {
      personalRadio.checked = true;
      updateAccountTypeUI('Personal');
    }
    const defaultTone = document.querySelector('input[name="preferredTone"][value="Minimal & Modern"]');
    if (defaultTone) defaultTone.checked = true;

    const defaultStruct = document.querySelector('input[name="siteStructure"][value="Option A — Link directly to Drive/Behance"]');
    if (defaultStruct) defaultStruct.checked = true;

    // Reset checkboxes
    document.querySelectorAll('input[name="pagesNeeded"]').forEach(cb => {
      cb.checked = true;
    });
    const policyCheck = document.getElementById('policyAgreementCheck');
    if (policyCheck) policyCheck.checked = false;

    // 6. Reset repeaters to completely clean, empty states
    initDefaultRepeaters();

    // 7. Reset agreement date to today
    const agreementDate = document.getElementById('agreementDate');
    if (agreementDate) {
      agreementDate.value = new Date().toISOString().split('T')[0];
    }

    // 8. Wipe review dossier
    if (reviewDossier) reviewDossier.innerHTML = '';
  }

  // Memory cache of the last submitted record (ensures downloads work even after auto-clear)
  let lastSubmittedRecordData = null;

  function getActiveOrCachedData() {
    const live = gatherFormData();
    // If live form is populated, return live data
    if (live.branding.name || live.contact.email || live.caseStudies.length > 0 && live.caseStudies[0].name) {
      return live;
    }
    // Otherwise fallback to cached submission if form was just cleared
    return lastSubmittedRecordData || live;
  }

  // ==========================================
  // SUPABASE CONFIGURATION & REALTIME SYNC
  // ==========================================
  const SUPABASE_PROJECT_REF = 'sehyhpwulwgwonhqvssm';
  const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHlocHd1bHdnd29uaHF2c3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyODQxODgsImV4cCI6MjEwNDg2MDE4OH0.xUMdTdhubH_w40bgD9LDjjLTnYGsDowxlUAerkjte_Q';

  let supabaseClient = null;
  function getSupabaseClient() {
    if (!supabaseClient && typeof window.supabase !== 'undefined' && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'PASTE_YOUR_ANON_KEY_HERE') {
      try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      } catch (err) {
        console.warn('Supabase init error:', err);
      }
    }
    return supabaseClient;
  }

  async function saveIntakeToSupabase(data) {
    const client = getSupabaseClient();
    if (!client) {
      console.log('Supabase client pending anon key.');
      return;
    }

    try {
      const subId = `ALIE-INTAKE-${Date.now()}`;
      const payload = {
        submission_id: subId,
        client_name: data.branding?.name || 'Unnamed Client',
        official_email: data.contact?.email || '',
        phone_whatsapp: data.contact?.phone || '',
        account_type: data.account?.type || '',
        raw_data: data
      };

      const { error } = await client
        .from('client_submissions')
        .insert([payload]);

      if (error) {
        console.error('Supabase save error:', error);
      } else {
        console.log('Successfully saved to Supabase:', subId);
      }
    } catch (e) {
      console.error('Supabase exception:', e);
    }
  }

  // Primary: Handle Full WhatsApp submission and automatic clearing
  document.getElementById('btnSendWhatsApp')?.addEventListener('click', (e) => {
    e.preventDefault();
    const data = gatherFormData();
    lastSubmittedRecordData = data;

    // Asynchronously log and save into Supabase database
    saveIntakeToSupabase(data);

    // Generate comprehensive WhatsApp text with 100% of the client's filled data
    const fullMsg = generateCompleteWhatsAppMessage(data);
    const waUrl = getWhatsAppUrl(fullMsg);

    // Open WhatsApp directly in new window/tab
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // Reveal success confirmation banner
    const successBanner = document.getElementById('submissionSuccessBanner');
    if (successBanner) {
      successBanner.style.display = 'flex';
      successBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Automatically clear every single field and storage for new clients!
    setTimeout(() => {
      clearAllFormFieldsAndStorage();
      showToast('🎉 All details sent to ALIE! Form emptied for the next client.', 'success');
    }, 1200);
  });

  // Secondary 1: Download Master Database CSV (Row 1 = Headings in Columns, Row 2 = Data)
  document.getElementById('btnDownloadCsv')?.addEventListener('click', () => {
    const data = getActiveOrCachedData();
    const csvContent = generateTabularCsvContent(data);
    const clientClean = (data.branding.name || 'ALIE_Client').replace(/[^a-z0-9]/gi, '_');
    triggerCsvDownload(csvContent, `${clientClean}_Database_Columns.csv`);
    showToast('📊 CSV with all headings in separate columns downloaded!', 'success');
  });

  // Secondary 2: Download Two-Column CSV (Column A = Headings, Column B = Data)
  document.getElementById('btnDownloadDossierCsv')?.addEventListener('click', () => {
    const data = getActiveOrCachedData();
    const csvContent = generateTwoColumnCsvContent(data);
    const clientClean = (data.branding.name || 'ALIE_Client').replace(/[^a-z0-9]/gi, '_');
    triggerCsvDownload(csvContent, `${clientClean}_Two_Column_Dossier.csv`);
    showToast('📑 Two-column (Heading & Value) CSV downloaded!', 'success');
  });

  // Secondary 3: Copy Complete WhatsApp Message to Clipboard
  document.getElementById('btnCopyWhatsApp')?.addEventListener('click', async () => {
    const data = getActiveOrCachedData();
    const fullMsg = generateCompleteWhatsAppMessage(data);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullMsg);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      showToast('📋 Complete WhatsApp brief copied to clipboard!', 'success');
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = fullMsg;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('📋 Complete WhatsApp brief copied to clipboard!', 'success');
    }
  });

  // Banner Download Action
  document.getElementById('btnSuccessDownloadCsv')?.addEventListener('click', () => {
    const data = getActiveOrCachedData();
    const csvContent = generateTabularCsvContent(data);
    const clientClean = (data.branding.name || 'ALIE_Client').replace(/[^a-z0-9]/gi, '_');
    triggerCsvDownload(csvContent, `${clientClean}_Database_Columns.csv`);
    showToast('📊 Submission CSV record downloaded!', 'success');
  });

  // Manual Clear Button
  document.getElementById('btnClearFormManual')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all fields? All entered details will be emptied.')) {
      clearAllFormFieldsAndStorage();
      lastSubmittedRecordData = null;
      currentStep = 1;
      updateStepUI();
      showToast('All fields have been cleared.', 'info');
    }
  });

  // Start New Client Entry Button
  document.getElementById('btnStartNewEntry')?.addEventListener('click', () => {
    clearAllFormFieldsAndStorage();
    lastSubmittedRecordData = null;
    const successBanner = document.getElementById('submissionSuccessBanner');
    if (successBanner) successBanner.style.display = 'none';
    currentStep = 1;
    updateStepUI();
    showToast('Ready for new client entry!', 'success');
  });

  // Autosave
  let autosaveTimeout = null;

  function triggerAutosave() {
    clearTimeout(autosaveTimeout);
    autosaveTimeout = setTimeout(() => {
      saveDraft();
    }, 600);
  }

  function saveDraft() {
    try {
      const data = gatherFormData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }
  }

  btnSaveManual?.addEventListener('click', () => {
    saveDraft();
    showToast('Your progress has been saved to this device!', 'success');
  });

  form.addEventListener('input', triggerAutosave);
  form.addEventListener('change', triggerAutosave);

  function loadSavedDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        updateAccountTypeUI('Personal');
        initDefaultRepeaters();
        return;
      }
      const d = JSON.parse(raw);

      if (d.account) {
        const accType = d.account.type || 'Personal';
        const radio = document.querySelector(`input[name="accountType"][value="${accType}"]`);
        if (radio) {
          radio.checked = true;
          updateAccountTypeUI(accType);
        }

        if (d.account.personalRole && document.getElementById('personalRole')) document.getElementById('personalRole').value = d.account.personalRole;
        if (d.account.personalDiscipline && document.getElementById('personalDiscipline')) document.getElementById('personalDiscipline').value = d.account.personalDiscipline;
        if (d.account.personalAvailability && document.getElementById('personalAvailability')) document.getElementById('personalAvailability').value = d.account.personalAvailability;
        if (d.account.personalLocation && document.getElementById('personalLocation')) document.getElementById('personalLocation').value = d.account.personalLocation;
        if (d.account.personalResumeLink && document.getElementById('personalResumeLink')) document.getElementById('personalResumeLink').value = d.account.personalResumeLink;

        if (d.account.agencyNiche && document.getElementById('agencyNiche')) document.getElementById('agencyNiche').value = d.account.agencyNiche;
        if (d.account.agencyTeamSize && document.getElementById('agencyTeamSize')) document.getElementById('agencyTeamSize').value = d.account.agencyTeamSize;
        if (d.account.agencyEngagementModel && document.getElementById('agencyEngagementModel')) document.getElementById('agencyEngagementModel').value = d.account.agencyEngagementModel;
        if (d.account.agencyMinBudget && document.getElementById('agencyMinBudget')) document.getElementById('agencyMinBudget').value = d.account.agencyMinBudget;
        if (d.account.agencyModel && document.getElementById('agencyModel')) document.getElementById('agencyModel').value = d.account.agencyModel;
      } else {
        updateAccountTypeUI('Personal');
      }

      if (d.branding) {
        if (d.branding.name) document.getElementById('brandName').value = d.branding.name;
        if (d.branding.logoLink) document.getElementById('logoLink').value = d.branding.logoLink;
        if (d.branding.primaryColor) {
          primaryColor.value = d.branding.primaryColor;
          primaryColorPicker.value = d.branding.primaryColor;
        }
        if (d.branding.accentColor) {
          accentColor.value = d.branding.accentColor;
          accentColorPicker.value = d.branding.accentColor;
        }
        if (d.branding.fonts) document.getElementById('brandFonts').value = d.branding.fonts;
        if (d.branding.tone) {
          const radio = document.querySelector(`input[name="preferredTone"][value="${d.branding.tone}"]`);
          if (radio) radio.checked = true;
        }
      }

      if (d.about) {
        if (d.about.yearsExp) document.getElementById('yearsExp').value = d.about.yearsExp;
        if (d.about.clientsServed) document.getElementById('clientsServed').value = d.about.clientsServed;
        if (d.about.projectsCompleted) document.getElementById('projectsCompleted').value = d.about.projectsCompleted;
        if (d.about.story) document.getElementById('brandStory').value = d.about.story;
      }

      if (d.caseStudies && d.caseStudies.length > 0) {
        caseStudiesContainer.innerHTML = '';
        d.caseStudies.forEach((cs, i) => {
          caseStudiesContainer.appendChild(renderProjectCard(i, cs));
        });
        updateProjectIndices();
      } else {
        initDefaultProjects();
      }

      if (d.services && d.services.length > 0) {
        servicesContainer.innerHTML = '';
        d.services.forEach((s, i) => {
          servicesContainer.appendChild(renderServiceCard(i, s));
        });
      } else {
        initDefaultServices();
      }

      if (d.testimonials && d.testimonials.length > 0) {
        testimonialsContainer.innerHTML = '';
        d.testimonials.forEach((t, i) => {
          testimonialsContainer.appendChild(renderTestimonialCard(i, t));
        });
      } else {
        initDefaultTestimonials();
      }

      if (d.faqs && d.faqs.length > 0) {
        faqContainer.innerHTML = '';
        d.faqs.forEach((f, i) => {
          faqContainer.appendChild(renderFaqCard(i, f));
        });
      } else {
        initDefaultFaqs();
      }

      if (d.contact) {
        if (d.contact.email) document.getElementById('contactEmail').value = d.contact.email;
        if (d.contact.phone) document.getElementById('contactPhone').value = d.contact.phone;
        if (d.contact.address) document.getElementById('contactAddress').value = d.contact.address;
        if (d.contact.prefMethod) document.getElementById('prefContactMethod').value = d.contact.prefMethod;
        if (d.contact.hours) document.getElementById('businessHours').value = d.contact.hours;
        if (d.contact.instagram) document.getElementById('socialInstagram').value = d.contact.instagram;
        if (d.contact.linkedin) document.getElementById('socialLinkedin').value = d.contact.linkedin;
        if (d.contact.twitter) document.getElementById('socialTwitter').value = d.contact.twitter;
        if (d.contact.behance) document.getElementById('socialBehance').value = d.contact.behance;
      }

      if (d.founder) {
        if (d.founder.name) document.getElementById('founderName').value = d.founder.name;
        if (d.founder.title) document.getElementById('founderTitle').value = d.founder.title;
        if (d.founder.imagesLink) document.getElementById('personalImagesLink').value = d.founder.imagesLink;
        if (d.founder.bio) document.getElementById('founderBio').value = d.founder.bio;
      }

      if (d.structure) {
        if (d.structure.choice) {
          const r = document.querySelector(`input[name="siteStructure"][value="${d.structure.choice}"]`);
          if (r) r.checked = true;
        }
        if (d.structure.pages && Array.isArray(d.structure.pages)) {
          document.querySelectorAll('input[name="pagesNeeded"]').forEach(cb => {
            cb.checked = d.structure.pages.includes(cb.value);
          });
        }
        if (d.structure.existingStatus) document.getElementById('existingSiteStatus').value = d.structure.existingStatus;
        if (d.structure.existingUrl) document.getElementById('existingSiteUrl').value = d.structure.existingUrl;
        if (d.structure.domainStatus) document.getElementById('domainStatus').value = d.structure.domainStatus;
        if (d.structure.deadline) document.getElementById('targetLaunchDate').value = d.structure.deadline;
        if (d.structure.references) document.getElementById('referenceSites').value = d.structure.references;
        if (d.structure.copyStatus) document.getElementById('copyStatus').value = d.structure.copyStatus;
      }

      if (d.policy) {
        if (d.policy.agreed) document.getElementById('policyAgreementCheck').checked = d.policy.agreed;
        if (d.policy.signature) document.getElementById('clientSignatureName').value = d.policy.signature;
        if (d.policy.date) document.getElementById('agreementDate').value = d.policy.date;
      }

      showToast('Loaded saved intake draft!', 'success');
    } catch (e) {
      console.error('Error restoring draft:', e);
      initDefaultRepeaters();
    }
  }

  function initDefaultProjects() {
    caseStudiesContainer.innerHTML = '';
    caseStudiesContainer.appendChild(renderProjectCard(0, {
      name: '',
      problem: '',
      solution: '',
      result: '',
      driveLink: ''
    }));
    caseStudiesContainer.appendChild(renderProjectCard(1, {
      name: '',
      problem: '',
      solution: '',
      result: '',
      driveLink: ''
    }));
    updateProjectIndices();
  }

  function initDefaultServices() {
    servicesContainer.innerHTML = '';
    servicesContainer.appendChild(renderServiceCard(0, {
      name: '',
      price: '',
      desc: ''
    }));
  }

  function initDefaultTestimonials() {
    testimonialsContainer.innerHTML = '';
    testimonialsContainer.appendChild(renderTestimonialCard(0, {
      author: '',
      photo: '',
      text: '',
      permission: true
    }));
  }

  function initDefaultFaqs() {
    faqContainer.innerHTML = '';
    defaultFaqs.forEach((item, i) => {
      faqContainer.appendChild(renderFaqCard(i, item));
    });
  }

  function initDefaultRepeaters() {
    initDefaultProjects();
    initDefaultServices();
    initDefaultTestimonials();
    initDefaultFaqs();
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ==========================================
  // SCROLL REVEAL / FADE-IN UPWARD OBSERVER
  // ==========================================
  function initScrollReveal() {
    const revealElements = document.querySelectorAll('.fade-in-up');
    
    if (!('IntersectionObserver' in window)) {
      revealElements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.10,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('is-visible');
      } else {
        revealObserver.observe(el);
      }
    });
  }

  // ==========================================
  // DYNAMIC NAVBAR GLASS EFFECT
  // ==========================================
  function initNavbarGlass() {
    const headerCapsule = document.querySelector('.header-capsule');
    if (!headerCapsule) return;

    const handleScroll = () => {
      if (window.scrollY > 20) {
        headerCapsule.classList.add('scrolled-glass');
      } else {
        headerCapsule.classList.remove('scrolled-glass');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  loadSavedDraft();
  updateStepUI();
  initScrollReveal();
  initNavbarGlass();
});
