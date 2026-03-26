(() => {
  // i18n: подстановка текста из languages.json в элементы с data-i18n="key"
  let languagesCache = null;

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
    const languagesUrl = getLanguagesUrl();
    const res = await fetch(languagesUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    languagesCache = await res.json();
    return languagesCache;
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

  // Language selector
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    const syncSelect = () => {
      const docLang = (document.documentElement.lang || '').trim().toLowerCase();
      langSelect.value = docLang || 'en';
    };

    syncSelect();
    langSelect.addEventListener('change', () => {
      const lang = (langSelect.value || '').trim().toLowerCase();
      if (!lang) return;
      document.documentElement.lang = lang;
      void applyI18n(lang);
    });
  }

})();
