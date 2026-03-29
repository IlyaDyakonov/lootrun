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
      if (s.label === 'FREE SPINS') {
        sectorEl.classList.add('sector-free-spins');
      } else if (s.label === 'BONUS') {
        sectorEl.classList.add('sector-bonus');
      }

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

  let spinStateActivated = false;

  const WHEEL_RESULT_POPUP_DELAY_MS = 3000;

  const activateSpinStateUi = () => {
    if (spinStateActivated) return;
    spinStateActivated = true;

    const spinButtonRoot = document.querySelector('.btn-spin');
    const spinButton = document.querySelector('.wheel-spin');
    const normalDescription = document.querySelector('.hero-header-description-fine:not(.hero-header-description-fine-spinning)');
    const spinningDescription = document.querySelector('.hero-header-description-fine-spinning');
    const wheelText = document.querySelector('.wheel-text');
    const spinningBonusOne = document.querySelector('.spinning-bonus-one');
    const spinningBonusTwo = document.querySelector('.spinning-bonus-two');
    const spinningBonusContainer = document.querySelector('.spinning-bonus-container');
    const wheelFireworks = document.getElementById('wheelFireworks');
    const wheelResultPopup = document.getElementById('wheelResultPopup');
    const sectors = document.getElementById('sectors');
    const wheelArrow = document.querySelector('.wheel-arrow');

    if (spinningDescription) {
      spinningDescription.hidden = false;
      requestAnimationFrame(() => {
        spinningDescription.classList.add('is-visible');
      });
    }

    if (spinButton) {
      spinButton.classList.add('is-fade-out');
      window.setTimeout(() => {
        spinButton.hidden = true;
      }, 300);
    }

    if (normalDescription) {
      normalDescription.classList.add('is-fade-out');
      window.setTimeout(() => {
        normalDescription.hidden = true;
      }, 300);
    }

    if (wheelText) {
      wheelText.classList.add('is-fade-out');
      window.setTimeout(() => {
        wheelText.hidden = true;
      }, 300);
    }

    if (spinningBonusOne) {
      spinningBonusOne.classList.add('is-visible');
    }
    if (spinningBonusTwo) {
      spinningBonusTwo.classList.remove('is-visible');
    }
    if (spinningBonusOne || spinningBonusTwo) {
      window.setTimeout(() => {
        if (spinningBonusOne) spinningBonusOne.classList.remove('is-visible');
        if (spinningBonusTwo) spinningBonusTwo.classList.add('is-visible');
      }, 1500);
    }

    if (sectors) {
      sectors.classList.add('is-swapped');

      const caseEl = sectors.closest('.case');
      const spinTimingParent = caseEl || document.documentElement;
      const spinCs = getComputedStyle(spinTimingParent);
      const durParsed = parseFloat(spinCs.getPropertyValue('--wheel-spin-duration'));
      const delayParsed = parseFloat(spinCs.getPropertyValue('--wheel-spin-delay'));
      const durSec = Number.isFinite(durParsed) ? durParsed : 3.8;
      const delaySec = Number.isFinite(delayParsed) ? delayParsed : 0;
      const fallbackMs = Math.ceil((durSec + delaySec) * 1000) + 80;

      if (wheelArrow) {
        wheelArrow.classList.add('is-spinning');
        const settleArrow = () => {
          wheelArrow.classList.remove('is-spinning');
          wheelArrow.classList.add('wheel-arrow--spin-settled');
        };
        const onArrowSpinEnd = (e) => {
          if (e.animationName !== 'wheelArrowSpin') return;
          wheelArrow.removeEventListener('animationend', onArrowSpinEnd);
          window.clearTimeout(arrowFallbackTimer);
          settleArrow();
        };
        wheelArrow.addEventListener('animationend', onArrowSpinEnd);
        const arrowFallbackTimer = window.setTimeout(() => {
          wheelArrow.removeEventListener('animationend', onArrowSpinEnd);
          settleArrow();
        }, fallbackMs);
      }

      const showEndSectors = () => {
        sectors.classList.add('sectors-ended');
        if (spinningBonusContainer) {
          spinningBonusContainer.classList.add('is-fade-out');
          const bonusFadeSec = parseFloat(getComputedStyle(spinningBonusContainer).transitionDuration);
          const bonusHideMs = Math.ceil((Number.isFinite(bonusFadeSec) ? bonusFadeSec : 0.45) * 1000) + 30;
          window.setTimeout(() => {
            spinningBonusContainer.hidden = true;
          }, bonusHideMs);
        }
        if (wheelFireworks) {
          wheelFireworks.hidden = false;
          wheelFireworks.setAttribute('aria-hidden', 'false');
        }

        if (wheelResultPopup) {
          window.setTimeout(() => {
            wheelResultPopup.hidden = false;
            wheelResultPopup.setAttribute('aria-hidden', 'false');
            requestAnimationFrame(() => {
              wheelResultPopup.classList.add('is-open');
            });
          }, WHEEL_RESULT_POPUP_DELAY_MS);
        }
      };

      const onSpinAnimationEnd = (e) => {
        if (e.animationName !== 'sectorsSpin') return;
        sectors.removeEventListener('animationend', onSpinAnimationEnd);
        window.clearTimeout(fallbackTimer);
        showEndSectors();
      };

      sectors.addEventListener('animationend', onSpinAnimationEnd);
      const fallbackTimer = window.setTimeout(() => {
        sectors.removeEventListener('animationend', onSpinAnimationEnd);
        showEndSectors();
      }, fallbackMs);
    }
  };

  const resetWheelToInitialState = () => {
    spinStateActivated = false;

    const wheelResultPopup = document.getElementById('wheelResultPopup');
    if (wheelResultPopup) {
      wheelResultPopup.classList.remove('is-open');
      wheelResultPopup.hidden = true;
      wheelResultPopup.setAttribute('aria-hidden', 'true');
    }

    const sectors = document.getElementById('sectors');
    if (sectors) {
      sectors.classList.remove('is-swapped', 'sectors-ended');
    }

    const wheelArrow = document.querySelector('.wheel-arrow');
    if (wheelArrow) {
      wheelArrow.classList.remove('is-spinning', 'wheel-arrow--spin-settled');
    }

    const spinButton = document.querySelector('.wheel-spin');
    if (spinButton) {
      spinButton.hidden = false;
      spinButton.classList.remove('is-fade-out');
    }

    const normalDescription = document.querySelector(
      '.hero-header-description-fine:not(.hero-header-description-fine-spinning)',
    );
    if (normalDescription) {
      normalDescription.hidden = false;
      normalDescription.classList.remove('is-fade-out');
    }

    const spinningDescription = document.querySelector('.hero-header-description-fine-spinning');
    if (spinningDescription) {
      spinningDescription.hidden = true;
      spinningDescription.classList.remove('is-visible');
    }

    const wheelText = document.querySelector('.wheel-text');
    if (wheelText) {
      wheelText.hidden = false;
      wheelText.classList.remove('is-fade-out');
    }

    const spinningBonusOne = document.querySelector('.spinning-bonus-one');
    const spinningBonusTwo = document.querySelector('.spinning-bonus-two');
    if (spinningBonusOne) spinningBonusOne.classList.remove('is-visible');
    if (spinningBonusTwo) spinningBonusTwo.classList.remove('is-visible');

    const spinningBonusContainer = document.querySelector('.spinning-bonus-container');
    if (spinningBonusContainer) {
      spinningBonusContainer.hidden = false;
      spinningBonusContainer.classList.remove('is-fade-out');
    }

    const wheelFireworks = document.getElementById('wheelFireworks');
    if (wheelFireworks) {
      wheelFireworks.hidden = true;
      wheelFireworks.setAttribute('aria-hidden', 'true');
    }

    if (spinButton) spinButton.focus();
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

  const spinButton = document.querySelector('.wheel-spin');
  if (spinButton) {
    spinButton.addEventListener('click', () => {
      activateSpinStateUi();
      void applyI18n();
    });
  }

  const tryAgainButton = document.querySelector('.wheel-result-popup__box-button-try-again');
  if (tryAgainButton) {
    tryAgainButton.addEventListener('click', () => {
      resetWheelToInitialState();
    });
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
