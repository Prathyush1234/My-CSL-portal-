// My CSL - Application Logic & Navigation Drawer Controller

document.addEventListener('DOMContentLoaded', () => {
  // Navigation State
  const state = {
    activeModule: 'front',  // Start on Quick Access Dashboard as in screenshot!
    currentDictView: 1,         // 1: Folders, 2: Folder Content, 3: Single Term
    selectedFolderId: null,
    selectedTermId: null,
    isDrawerOpen: false,
    language: 'en'              // 'en', 'ml', 'hi'
  };

  // DOM Elements
  const navDrawer = document.getElementById('navDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawerOpenBtn = document.getElementById('drawerOpenBtn');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const cslCrestBtn = document.getElementById('cslCrestBtn');

  const moduleDictionary = document.getElementById('moduleDictionary');
  const moduleDashboard = document.getElementById('moduleDashboard');
  const moduleCalendar = document.getElementById('moduleCalendar');
  const moduleTax = document.getElementById('moduleTax');
  const moduleAttendance = document.getElementById('moduleAttendance');
  const moduleSalary = document.getElementById('moduleSalary');
  const moduleFront = document.getElementById('moduleFront');

  const view1 = document.getElementById('view1FolderList');
  const view2 = document.getElementById('view2FolderContent');
  const view3 = document.getElementById('view3TermCard');

  const foldersGrid = document.getElementById('foldersGrid');
  const termsListContainer = document.getElementById('termsListContainer');
  const masterDiagramContainer = document.getElementById('masterDiagramContainer');

  const crumbHome = document.getElementById('crumbHome');
  const crumbSep1 = document.getElementById('crumbSep1');
  const crumbFolder = document.getElementById('crumbFolder');
  const crumbSep2 = document.getElementById('crumbSep2');
  const crumbTerm = document.getElementById('crumbTerm');

  const termSearchInput = document.getElementById('termSearchInput');
  const searchResultsList = document.getElementById('searchResultsList');

  /* ==========================================================================
     1. DRAWER TOGGLE & INTERACTION
     ========================================================================== */
  function openDrawer() {
    state.isDrawerOpen = true;
    navDrawer.classList.add('open');
    drawerOverlay.classList.add('active');
    window.history.pushState({ type: 'drawer-open' }, '', '');
  }

  function closeDrawer() {
    if (!state.isDrawerOpen) return;
    state.isDrawerOpen = false;
    navDrawer.classList.remove('open');
    drawerOverlay.classList.remove('active');
  }

  if (drawerOpenBtn) drawerOpenBtn.addEventListener('click', openDrawer);
  if (cslCrestBtn) cslCrestBtn.addEventListener('click', openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', () => window.history.back());
  if (drawerOverlay) drawerOverlay.addEventListener('click', () => window.history.back());

  // Drawer menu items click handler
  document.querySelectorAll('.drawer-item').forEach((item) => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-target');
      if (target) {
        document.querySelectorAll('.drawer-item').forEach((el) => el.classList.remove('active'));
        item.classList.add('active');
        closeDrawer();
        switchPortalModule(target);
      }
    });
  });

  /* ==========================================================================
     2. MODULE SWITCHING
     ========================================================================== */
  window.switchPortalModule = function(moduleName) {
    state.activeModule = moduleName;

    // Highlight drawer item
    document.querySelectorAll('.drawer-item').forEach((el) => {
      if (el.getAttribute('data-target') === moduleName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Hide all modules
    const allModules = [moduleDictionary, moduleDashboard, moduleCalendar, moduleTax, moduleAttendance, moduleSalary, moduleFront];
    allModules.forEach((m) => {
      if (m) m.style.display = 'none';
    });

    if (moduleName === 'dictionary') {
      if (moduleDictionary) moduleDictionary.style.display = 'block';
      updateDictionaryView(1);
    } else if (moduleName === 'dashboard') {
      if (moduleDashboard) moduleDashboard.style.display = 'block';
    } else if (moduleName === 'calendar') {
      if (moduleCalendar) moduleCalendar.style.display = 'block';
    } else if (moduleName === 'tax') {
      if (moduleTax) moduleTax.style.display = 'block';
    } else if (moduleName === 'attendance') {
      if (moduleAttendance) moduleAttendance.style.display = 'block';
    } else if (moduleName === 'salary') {
      if (moduleSalary) moduleSalary.style.display = 'block';
    } else if (moduleName === 'front') {
      if (moduleFront) moduleFront.style.display = 'block';
    } else {
      // Yard Operations link into Dictionary
      if (moduleDictionary) moduleDictionary.style.display = 'block';
      updateDictionaryView(1);
    }

    window.history.pushState({ type: 'module', module: moduleName }, '', '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ==========================================================================
     3. HARDWARE & BROWSER MOBILE BACK BUTTON
     ========================================================================== */
  window.addEventListener('popstate', (e) => {
    // 1. If Drawer is open, close it
    if (state.isDrawerOpen) {
      state.isDrawerOpen = false;
      navDrawer.classList.remove('open');
      drawerOverlay.classList.remove('active');
      return;
    }

    // 2. If Blueprint modal is open, close it
    const analyzerModal = document.getElementById('analyzerModal');
    if (analyzerModal && analyzerModal.classList.contains('active')) {
      analyzerModal.classList.remove('active');
      return;
    }

    // 3. Handle Dictionary Views
    if (state.activeModule === 'dictionary') {
      if (state.currentDictView === 3) {
        updateDictionaryView(2, state.selectedFolderId);
        return;
      } else if (state.currentDictView === 2) {
        updateDictionaryView(1);
        return;
      } else {
        // Return to Dashboard from Dictionary
        switchPortalModule('dashboard');
        return;
      }
    }

    // 4. Return to Dashboard from other modules
    if (state.activeModule === 'dashboard') {
      switchPortalModule('front');
    } else if (state.activeModule !== 'front') {
      switchPortalModule('dashboard');
    }
  });

  /* ==========================================================================
     4. SHIP THEORY DICTIONARY 3-LEVEL VIEW CONTROLLER
     ========================================================================== */
  function pushDictionaryNav(view, folderId = null, termId = null) {
    window.history.pushState({ type: 'dict', view, folderId, termId }, '', '');
    updateDictionaryView(view, folderId, termId);
  }

  function updateDictionaryView(view, folderId = null, termId = null) {
    state.currentDictView = view;
    state.selectedFolderId = folderId;
    state.selectedTermId = termId;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    view1.classList.remove('active');
    view2.classList.remove('active');
    view3.classList.remove('active');

    if (view === 1) {
      view1.classList.add('active');
      crumbSep1.style.display = 'none';
      crumbFolder.style.display = 'none';
      crumbSep2.style.display = 'none';
      crumbTerm.style.display = 'none';
    } else if (view === 2) {
      view2.classList.add('active');
      renderFolderContentView(folderId);
      crumbSep1.style.display = 'inline';
      crumbFolder.style.display = 'inline';
      crumbSep2.style.display = 'none';
      crumbTerm.style.display = 'none';
    } else if (view === 3) {
      view3.classList.add('active');
      renderTermCardView(folderId, termId);
      crumbSep1.style.display = 'inline';
      crumbFolder.style.display = 'inline';
      crumbSep2.style.display = 'inline';
      crumbTerm.style.display = 'inline';
    }
  }

  function renderFoldersList() {
    foldersGrid.innerHTML = '';
    const data = window.DICTIONARY_DATA || [];
    data.forEach((folder) => {
      const card = document.createElement('div');
      card.className = 'folder-card';
      card.innerHTML = `
        <div class="folder-top-row">
          <div class="folder-badge-number">${folder.number}</div>
          <div class="folder-term-count">${folder.terms.length} Terms</div>
        </div>
        <h3 class="folder-card-title">${folder.titleEn}</h3>
        <div class="folder-card-title-ml">${folder.titleMl}</div>
        <p class="folder-card-desc">${folder.desc}</p>
        <div class="folder-card-footer">
          <span>Explore Category</span>
          <span>→</span>
        </div>
      `;
      card.addEventListener('click', () => {
        pushDictionaryNav(2, folder.id);
      });
      foldersGrid.appendChild(card);
    });
  }

  function renderFolderContentView(folderId) {
    const data = window.DICTIONARY_DATA || [];
    const folder = data.find((f) => f.id === folderId);
    if (!folder) return;

    document.getElementById('folderTitleEn').textContent = `FOLDER ${folder.number}: ${folder.titleEn.toUpperCase()}`;
    document.getElementById('folderTitleMl').textContent = folder.titleMl;
    document.getElementById('folderDesc').textContent = folder.desc;
    crumbFolder.textContent = folder.titleEn;
    document.getElementById('folderTermsCountBadge').textContent = `${folder.terms.length} Technical Terms`;
    document.getElementById('masterDiagramLabel').textContent = `${folder.titleEn} · Master Structural Blueprint`;

    masterDiagramContainer.innerHTML = folder.masterDiagramSvg;

    termsListContainer.innerHTML = '';
    folder.terms.forEach((term, index) => {
      const itemCard = document.createElement('div');
      itemCard.className = 'term-item-card';
      itemCard.innerHTML = `
        <div class="term-item-left">
          <div class="term-index-badge">${index + 1}</div>
          <div class="term-item-info">
            <h4 class="term-item-title">${term.titleEn}</h4>
            <div class="term-item-malayalam">${term.titleMl}</div>
            <p class="term-item-snippet">${term.defEn}</p>
          </div>
        </div>
        <div class="term-item-arrow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      `;
      itemCard.addEventListener('click', () => {
        pushDictionaryNav(3, folder.id, term.id);
      });
      termsListContainer.appendChild(itemCard);
    });
  }

  function renderTermCardView(folderId, termId) {
    const data = window.DICTIONARY_DATA || [];
    const folder = data.find((f) => f.id === folderId);
    if (!folder) return;
    const termIndex = folder.terms.findIndex((t) => t.id === termId);
    if (termIndex === -1) return;
    const term = folder.terms[termIndex];

    crumbFolder.textContent = folder.titleEn;
    crumbTerm.textContent = term.titleEn;

    document.getElementById('termParentCategory').innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>
      <span>CATEGORY ${folder.number} · ${folder.titleEn.toUpperCase()}</span>
    `;
    document.getElementById('termNumberIndicator').textContent = `Term ${termIndex + 1} of ${folder.terms.length}`;

    document.getElementById('termTitleEn').textContent = term.titleEn;
    document.getElementById('termTitleMl').textContent = term.titleMl;
    document.getElementById('termDefEn').textContent = term.defEn;
    document.getElementById('termDefMl').textContent = term.defMl;

    const svgBox = document.getElementById('termSvgContainer');
    svgBox.innerHTML = term.diagramSvg || '';

    const formulaBox = document.getElementById('termFormulaBox');
    const formulaText = document.getElementById('termFormulaText');
    if (term.formula) {
      formulaBox.style.display = 'flex';
      formulaText.textContent = term.formula;
    } else {
      formulaBox.style.display = 'none';
    }

    const prevBtn = document.getElementById('btnPrevTerm');
    const nextBtn = document.getElementById('btnNextTerm');

    if (termIndex > 0) {
      prevBtn.style.opacity = '1';
      prevBtn.disabled = false;
      prevBtn.onclick = () => {
        pushDictionaryNav(3, folder.id, folder.terms[termIndex - 1].id);
      };
    } else {
      prevBtn.style.opacity = '0.4';
      prevBtn.disabled = true;
    }

    if (termIndex < folder.terms.length - 1) {
      nextBtn.style.opacity = '1';
      nextBtn.disabled = false;
      nextBtn.onclick = () => {
        pushDictionaryNav(3, folder.id, folder.terms[termIndex + 1].id);
      };
    } else {
      nextBtn.style.opacity = '0.4';
      nextBtn.disabled = true;
    }
  }

  /* ==========================================================================
     5. BUTTON EVENT LISTENERS
     ========================================================================== */
  const btnBackToFolders = document.getElementById('btnBackToFolders');
  if (btnBackToFolders) {
    btnBackToFolders.addEventListener('click', () => window.history.back());
  }

  const btnBackTop = document.getElementById('btnBackToFolderTermsTop');
  if (btnBackTop) {
    btnBackTop.addEventListener('click', () => window.history.back());
  }

  const btnBackBottom = document.getElementById('btnBackToFolderTermsBottom');
  if (btnBackBottom) {
    btnBackBottom.addEventListener('click', () => window.history.back());
  }

  if (crumbHome) crumbHome.addEventListener('click', () => pushDictionaryNav(1));
  if (crumbFolder) {
    crumbFolder.addEventListener('click', () => {
      if (state.selectedFolderId) pushDictionaryNav(2, state.selectedFolderId);
    });
  }

  /* ==========================================================================
     6. SEARCH FILTER
     ========================================================================== */
  if (termSearchInput) {
    termSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        searchResultsList.style.display = 'none';
        searchResultsList.innerHTML = '';
        return;
      }

      const matches = [];
      const data = window.DICTIONARY_DATA || [];
      data.forEach((folder) => {
        folder.terms.forEach((term) => {
          const hay = `${term.titleEn} ${term.titleMl} ${term.defEn} ${term.defMl}`.toLowerCase();
          if (hay.includes(q)) matches.push({ folder, term });
        });
      });

      if (matches.length === 0) {
        searchResultsList.style.display = 'block';
        searchResultsList.innerHTML = `
          <div style="padding: 12px; font-size: 13px; color: var(--text-muted); text-align: center;">
            No matching terms found.
          </div>
        `;
        return;
      }

      searchResultsList.style.display = 'block';
      searchResultsList.innerHTML = '';
      matches.slice(0, 8).forEach(({ folder, term }) => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
          <div>
            <div class="search-term-title">${term.titleEn}</div>
            <div style="font-family: 'Manjari', sans-serif; font-size: 12.5px; color: var(--accent-maroon);">${term.titleMl}</div>
          </div>
          <div style="font-size: 12px; color: var(--text-muted);">${folder.titleEn} →</div>
        `;
        item.addEventListener('click', () => {
          termSearchInput.value = '';
          searchResultsList.style.display = 'none';
          pushDictionaryNav(3, folder.id, term.id);
        });
        searchResultsList.appendChild(item);
      });
    });
  }

    /* ==========================================================================
     7. LANGUAGE SELECTOR & FRONT PAGE CONTROLLER
     ========================================================================== */
  let selectedCategory = 'permanent';

  window.selectEmployeeCategory = function(cat) {
    selectedCategory = cat;
    const optPerm = document.getElementById('optPermanentEmp');
    const optContr = document.getElementById('optContractEmp');
    const txtSel = document.getElementById('txtSelectedStatus');
    const isMl = state.language === 'ml';

    if (cat === 'permanent') {
      if (optPerm) {
        optPerm.className = 'front-option-card active';
        const txt = optPerm.querySelector('.front-opt-text');
        if (txt) txt.className = 'front-opt-text';
        const act = optPerm.querySelector('.front-opt-action-active, .front-opt-action-inactive');
        if (act) act.className = 'front-opt-action-active';
      }
      if (optContr) {
        optContr.className = 'front-option-card inactive';
        const txt = optContr.querySelector('.front-opt-text');
        if (txt) txt.className = 'front-opt-text inactive';
        const act = optContr.querySelector('.front-opt-action-active, .front-opt-action-inactive');
        if (act) act.className = 'front-opt-action-inactive';
      }
      if (txtSel) txtSel.textContent = isMl ? 'തിരഞ്ഞെടുത്തത്: സ്ഥിരം ജീവനക്കാരൻ' : 'Selected: Permanent Employee';
    } else {
      if (optPerm) {
        optPerm.className = 'front-option-card inactive';
        const txt = optPerm.querySelector('.front-opt-text');
        if (txt) txt.className = 'front-opt-text inactive';
        const act = optPerm.querySelector('.front-opt-action-active, .front-opt-action-inactive');
        if (act) act.className = 'front-opt-action-inactive';
      }
      if (optContr) {
        optContr.className = 'front-option-card active';
        const txt = optContr.querySelector('.front-opt-text');
        if (txt) txt.className = 'front-opt-text';
        const act = optContr.querySelector('.front-opt-action-active, .front-opt-action-inactive');
        if (act) act.className = 'front-opt-action-active';
      }
      if (txtSel) txtSel.textContent = isMl ? 'തിരഞ്ഞെടുത്തത്: കമ്പനി കോൺട്രാക്ട് ജീവനക്കാരൻ' : 'Selected: Company on Contract Employee';
    }
  };

  window.proceedToPortal = function(e) {
    if (e) e.stopPropagation();
    switchPortalModule('dashboard');
  };

  window.toggleMoreCategories = function() {
    const tray = document.getElementById('moreCategoriesTray');
    if (tray) tray.classList.toggle('open');
  };

  function applyLanguage(lang) {
    state.language = lang;
    const isMl = lang === 'ml';

    const topbarLangTxt = document.getElementById('topbarLangTxt');
    if (topbarLangTxt) topbarLangTxt.textContent = isMl ? 'ML' : 'EN';

    document.querySelectorAll('.lang-segment-btn').forEach((b) => {
      if (b.getAttribute('data-lang') === lang) b.classList.add('active');
      else b.classList.remove('active');
    });

    // Front page elements
    const txtFrontOrgName = document.getElementById('txtFrontOrgName');
    if (txtFrontOrgName) txtFrontOrgName.textContent = isMl ? 'കൊച്ചിൻ ഷിപ്പ്‌യാർഡ് ലിമിറ്റഡ്' : 'Cochin Shipyard Limited';

    const txtFrontGovtUnder = document.getElementById('txtFrontGovtUnder');
    if (txtFrontGovtUnder) txtFrontGovtUnder.textContent = isMl ? 'ഭാരത സർക്കാർ സ്ഥാപനം' : 'A GOVERNMENT OF INDIA UNDERTAKING';

    const txtFrontLocation = document.getElementById('txtFrontLocation');
    if (txtFrontLocation) txtFrontLocation.textContent = isMl ? 'കൊച്ചിൻ ഷിപ്പ്‌യാർഡ് · കൊച്ചി, ഇന്ത്യ' : 'COCHIN SHIPYARD · KOCHI, INDIA';

    const txtFrontWelcome = document.getElementById('txtFrontWelcome');
    if (txtFrontWelcome) txtFrontWelcome.textContent = isMl ? 'നിങ്ങളുടെ എംപ്ലോയി പോർട്ടലിലേക്ക് സ്വാഗതം.' : 'Welcome to your employee portal.';

    const txtFrontSub = document.getElementById('txtFrontSub');
    if (txtFrontSub) txtFrontSub.textContent = isMl ? 'തുടരുന്നതിനായി നിങ്ങളുടെ എംപ്ലോയി വിഭാഗം തിരഞ്ഞെടുക്കുക.' : 'Choose your employee category to continue.';

    const txtFrontCatLabel = document.getElementById('txtFrontCatLabel');
    if (txtFrontCatLabel) txtFrontCatLabel.textContent = isMl ? 'വിഭാഗം തിരഞ്ഞെടുക്കുക' : 'SELECT YOUR CATEGORY';

    const txtFrontQuestion = document.getElementById('txtFrontQuestion');
    if (txtFrontQuestion) txtFrontQuestion.textContent = isMl ? 'നിങ്ങൾ സിഎസ്എല്ലുമായി എങ്ങനെ ബന്ധപ്പെട്ടിരിക്കുന്നു?' : 'How are you associated with CSL?';

    const txtOptPermanentTitle = document.getElementById('txtOptPermanentTitle');
    if (txtOptPermanentTitle) txtOptPermanentTitle.textContent = isMl ? 'സ്ഥിരം ജീവനക്കാരൻ' : 'Permanent Employee';

    const txtOptPermanentSub = document.getElementById('txtOptPermanentSub');
    if (txtOptPermanentSub) txtOptPermanentSub.textContent = isMl ? 'പ്രത്യൂഷ് മോഹൻ കെ ആയി സൈൻ ഇൻ ചെയ്തു' : 'Signed in as Prathyush Mohan K';

    const txtOptContractTitle = document.getElementById('txtOptContractTitle');
    if (txtOptContractTitle) txtOptContractTitle.textContent = isMl ? 'കമ്പനി കോൺട്രാക്ട് ജീവനക്കാരൻ' : 'Company on Contract Em...';

    const txtOptContractSub = document.getElementById('txtOptContractSub');
    if (txtOptContractSub) txtOptContractSub.textContent = isMl ? 'സിഎസ്എല്ലിൽ ജോലി ചെയ്യുന്ന കരാർ ജീവനക്കാർ' : 'For employees of companies working on c...';

    const txtMoreCategories = document.getElementById('txtMoreCategories');
    if (txtMoreCategories) txtMoreCategories.textContent = isMl ? 'കൂടുതൽ വിഭാഗങ്ങൾ (അപ്രന്റീസ് / വെണ്ടർ) ∨' : 'More categories (Apprentice / Vendor) ∨';

    const txtSelectedStatus = document.getElementById('txtSelectedStatus');
    if (txtSelectedStatus) {
      txtSelectedStatus.textContent = isMl 
        ? (selectedCategory === 'permanent' ? 'തിരഞ്ഞെടുത്തത്: സ്ഥിരം ജീവനക്കാരൻ' : 'തിരഞ്ഞെടുത്തത്: കോൺട്രാക്ട് ജീവനക്കാരൻ') 
        : (selectedCategory === 'permanent' ? 'Selected: Permanent Employee' : 'Selected: Company on Contract Employee');
    }

    const txtContinueBtn = document.getElementById('txtContinueBtn');
    if (txtContinueBtn) txtContinueBtn.textContent = isMl ? 'തുടരുക' : 'Continue';

    const txtTrustNote = document.getElementById('txtTrustNote');
    if (txtTrustNote) txtTrustNote.textContent = isMl ? 'കൊച്ചിൻ ഷിപ്പ്‌യാർഡ് ജീവനക്കാർക്കും കരാർ ജീവനക്കാർക്കും വേണ്ടി' : 'For Cochin Shipyard employees and contract staff';

    // Drawer text items
    const txtFront = document.querySelector('.nav-txt-front');
    if (txtFront) txtFront.textContent = isMl ? 'പോർട്ടൽ പ്രവേശന പേജ് (ലോഗിൻ)' : 'Portal Front Page (Login)';
    const txtDash = document.querySelector('.nav-txt-dashboard');
    if (txtDash) txtDash.textContent = isMl ? 'ദ്രുത പ്രവേശന ഡാഷ്‌ബോർഡ്' : 'Quick Access Dashboard';
    const txtCal = document.querySelector('.nav-txt-calendar');
    if (txtCal) txtCal.textContent = isMl ? 'CSL വാൾ കലണ്ടർ 2026' : 'CSL Wall Calendar 2026';
    const txtTax = document.querySelector('.nav-txt-tax');
    if (txtTax) txtTax.textContent = isMl ? 'CSL ഇൻകം ടാക്സ് കാൽക്കുലേറ്റർ' : 'CSL Income Tax Calculator';
    const txtAtt = document.querySelector('.nav-txt-attendance');
    if (txtAtt) txtAtt.textContent = isMl ? 'ബയോമെട്രിക് ഹാജർ വിവരങ്ങൾ' : 'Biometric Attendance & Shift Register';
    const txtDuty = document.getElementById('txtDutyStatus');
    if (txtDuty) txtDuty.textContent = isMl ? 'ഡ്യൂട്ടിയിലാണ്' : 'Currently on Duty';
  }

  const topbarLangBtn = document.getElementById('topbarLangBtn');
  if (topbarLangBtn) {
    topbarLangBtn.addEventListener('click', () => {
      const nextLang = state.language === 'en' ? 'ml' : 'en';
      applyLanguage(nextLang);
    });
  }

  document.querySelectorAll('.lang-segment-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      applyLanguage(lang);
    });
  });

  /* ==========================================================================
     8. GEMINI PRO DRAWING ANALYZER MODAL
     ========================================================================== */
  const analyzerModal = document.getElementById('analyzerModal');
  const openAnalyzerTopBtn = document.getElementById('openAnalyzerTopBtn');
  const bannerAnalyzerBtn = document.getElementById('bannerAnalyzerBtn');
  const closeAnalyzerBtn = document.getElementById('closeAnalyzerBtn');
  const drawingDropzone = document.getElementById('drawingDropzone');
  const drawingFileInput = document.getElementById('drawingFileInput');
  const analyzerLoading = document.getElementById('analyzerLoading');
  const analysisOutputContainer = document.getElementById('analysisOutputContainer');

  window.openAnalyzerModalDirect = function() {
    if (analyzerModal) {
      analyzerModal.classList.add('active');
      window.history.pushState({ type: 'analyzer-modal' }, '', '');
    }
  };

  if (openAnalyzerTopBtn) openAnalyzerTopBtn.addEventListener('click', window.openAnalyzerModalDirect);
  if (bannerAnalyzerBtn) bannerAnalyzerBtn.addEventListener('click', window.openAnalyzerModalDirect);
  if (closeAnalyzerBtn) closeAnalyzerBtn.addEventListener('click', () => window.history.back());
  if (analyzerModal) {
    analyzerModal.addEventListener('click', (e) => {
      if (e.target === analyzerModal) window.history.back();
    });
  }

  if (drawingDropzone && drawingFileInput) {
    drawingDropzone.addEventListener('click', () => drawingFileInput.click());
    drawingFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          sendDrawingToGemini(re.target.result, file.type, file.name);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  document.querySelectorAll('.sample-pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sample = btn.getAttribute('data-sample');
      const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      sendDrawingToGemini(placeholder, 'image/png', `Sample: ${sample}`);
    });
  });

  async function sendDrawingToGemini(imageBase64, mimeType, label) {
    analyzerLoading.style.display = 'block';
    analysisOutputContainer.style.display = 'none';

    try {
      const res = await fetch('/api/analyze-drawing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType, drawingContext: label })
      });
      const json = await res.json();
      if (json.success && json.data) {
        renderAnalysisResults(json.data, json.model);
      }
    } catch (err) {
      console.error(err);
    } finally {
      analyzerLoading.style.display = 'none';
    }
  }

  function renderAnalysisResults(data, model) {
    analysisOutputContainer.style.display = 'block';
    document.getElementById('outDrawingTitle').textContent = data.drawingTitle || 'Drawing Analysis';
    document.getElementById('outModelBadge').textContent = model === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro Model' : 'CSL Naval Architecture Engine';
    document.getElementById('outVesselType').textContent = data.vesselType || '-';
    document.getElementById('outSectionType').textContent = data.sectionType || '-';
    document.getElementById('outFrameRange').textContent = data.frameRange || '-';
    document.getElementById('outSteelGrade').textContent = data.primarySteelGrade || '-';

    const tbody = document.getElementById('extractedTableBody');
    tbody.innerHTML = '';

    (data.extractedComponents || []).forEach((c) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <strong>${c.name}</strong>
          <div style="font-family: 'Manjari', sans-serif; font-size: 11px; color: var(--accent-maroon);">${c.malayalamName || ''}</div>
        </td>
        <td>${c.location || '-'}</td>
        <td><code>${c.scantlings || '-'}</code></td>
        <td>
          <div>${c.structuralFunction || ''}</div>
          ${c.dictionaryTermId ? `<div class="link-to-term" data-term-id="${c.dictionaryTermId}">📖 View in Dictionary →</div>` : ''}
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.link-to-term').forEach((lnk) => {
      lnk.addEventListener('click', () => {
        const tId = lnk.getAttribute('data-term-id');
        const dataList = window.DICTIONARY_DATA || [];
        for (const f of dataList) {
          const t = f.terms.find((x) => x.id === tId);
          if (t) {
            analyzerModal.classList.remove('active');
            switchPortalModule('dictionary');
            pushDictionaryNav(3, f.id, t.id);
            return;
          }
        }
      });
    });

    const sumBox = document.getElementById('outSummaryBox');
    sumBox.innerHTML = `<strong>Naval Architect Inspection Notes:</strong><br>${data.navalArchitectSummary || ''}`;
  }

  // Initial Boot: Start on Dashboard matching the user's screenshot
  renderFoldersList();
  window.history.replaceState({ type: 'module', module: 'dashboard' }, '', '');
});
