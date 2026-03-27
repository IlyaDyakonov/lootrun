(() => {
  // i18n: подстановка текста из languages.json в элементы с data-i18n="key"
  let languagesCache = null;
  const inlineLanguages = window.__LANGUAGES__ || null;

  const createEl = (tag, className, attrs) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        el.setAttribute(k, String(v));
      });
    }
    return el;
  };

  const renderWheelSectors = () => {
    const sectorsEl = document.getElementById('sectors');
    if (!sectorsEl) return;

    // Базовый набор “как на картинке”: чередуем 200 FREE SPINS и +500% BONUS.
    // Кол-во и тексты можно менять — DOM построится автоматически.
    const sectors = [
      { value: '200', label: 'FREE SPINS' },
      { value: '+500%', label: 'BONUS' },
      { value: '200', label: 'FREE SPINS' },
      { value: '+500%', label: 'BONUS' },
      { value: '200', label: 'FREE SPINS' },
      { value: '+500%', label: 'BONUS' },
      { value: '200', label: 'FREE SPINS' },
      { value: '+500%', label: 'BONUS' },
    ];

    sectorsEl.innerHTML = '';
    sectorsEl.style.setProperty('--sector-count', String(sectors.length));
    sectors.forEach((s, idx) => {
      // sector (Figma group: "sect+txt" inside the sector)
      const sectorEl = createEl('div', 'sector', {
        'data-sector-index': idx,
      });
      sectorEl.style.setProperty('--sector-index', String(idx));

      // Figma: "Ellipse 21"
      sectorEl.appendChild(createEl('div', 'ellipse-21', { 'aria-hidden': 'true' }));

      // Figma: "sect+txt" (text group)
      const txtEl = createEl('div', 'sect-txt');
      txtEl.appendChild(createEl('div', 'sect-txt-value', { 'data-part': 'value' })).textContent = s.value;
      txtEl.appendChild(createEl('div', 'sect-txt-label', { 'data-part': 'label' })).textContent = s.label;
      sectorEl.appendChild(txtEl);

      // Figma: "Subtract" (shape overlay / wedge)
      sectorEl.appendChild(createEl('div', 'subtract', { 'aria-hidden': 'true' }));

      sectorsEl.appendChild(sectorEl);
    });
  };

  const getLanguagesUrl = () => {
    // Resolve relative path robustly (helps when main.html is served/opened from a different base URL)
    try {
      const scriptUrl = document.currentScript?.src;
      if (scriptUrl) return new URL('languages.json', scriptUrl).toString();
    } catch {
      // ignore and fallback
    }
    return new URL('languages.json', window.location.href).toString();
  };

  const loadLanguages = async () => {
    if (languagesCache) return languagesCache;

    if (window.location.protocol === 'file:' && inlineLanguages) {
      languagesCache = inlineLanguages;
      return languagesCache;
    }

    const languagesUrl = getLanguagesUrl();
    try {
      const res = await fetch(languagesUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      languagesCache = await res.json();
      return languagesCache;
    } catch (error) {
      if (inlineLanguages) {
        languagesCache = inlineLanguages;
        return languagesCache;
      }
      throw error;
    }
  };

  const applyI18n = async (langOverride) => {
    const targets = document.querySelectorAll('[data-i18n]');
    if (!targets.length) return;

    try {
      const languages = await loadLanguages();
      const currentLang = (langOverride || document.documentElement.lang || '').trim().toLowerCase();
      const lang = languages[currentLang] ? currentLang : 'en';

      targets.forEach((el) => {
        const key = el.getAttribute('data-i18n');
        const value = languages?.[lang]?.[key];
        if (typeof value === 'string') el.textContent = value;
      });
    } catch (e) {
      console.warn('Failed to load languages.json', {
        languagesUrl: getLanguagesUrl(),
        error: e,
      });
      return;
    }
  };

  // script defer => DOM уже готов, но оставим безопасный хук на случай другой загрузки
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      renderWheelSectors();
      void applyI18n();
    });
  } else {
    renderWheelSectors();
    void applyI18n();
  }

  // Custom language dropdown
  const langRoot = document.querySelector('.lang');
  const langToggle = document.getElementById('langToggle');
  const langMenu = document.getElementById('langMenu');
  const langToggleLabel = document.querySelector('.langToggleLabel');
  const langOptions = Array.from(document.querySelectorAll('[data-lang-option]'));

  if (langRoot && langToggle && langMenu && langToggleLabel && langOptions.length) {
    const closeMenu = () => {
      langRoot.classList.remove('is-open');
      langMenu.hidden = true;
      langToggle.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
      langRoot.classList.add('is-open');
      langMenu.hidden = false;
      langToggle.setAttribute('aria-expanded', 'true');
    };

    const syncLanguageUi = () => {
      const docLang = (document.documentElement.lang || 'en').trim().toLowerCase();
      const activeLang = langOptions.find((option) => option.dataset.langOption === docLang)?.dataset.langOption || 'en';

      langToggleLabel.textContent = activeLang.toUpperCase();
      langOptions.forEach((option) => {
        const isSelected = option.dataset.langOption === activeLang;
        option.setAttribute('aria-selected', String(isSelected));
        option.hidden = isSelected;
      });
    };

    syncLanguageUi();
    closeMenu();

    langToggle.addEventListener('click', () => {
      if (langMenu.hidden) {
        openMenu();
        return;
      }
      closeMenu();
    });

    langOptions.forEach((option) => {
      option.addEventListener('click', () => {
        const lang = (option.dataset.langOption || '').trim().toLowerCase();
        if (!lang) return;
        document.documentElement.lang = lang;
        syncLanguageUi();
        closeMenu();
        void applyI18n(lang);
      });
    });

    document.addEventListener('click', (event) => {
      if (!langRoot.contains(event.target)) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

})();
