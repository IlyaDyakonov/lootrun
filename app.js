(() => {
  const wheelEl = document.getElementById('wheel');
  const wheelLabelsEl = document.getElementById('wheelLabels');
  const spinBtn = document.getElementById('spinBtn');
  const spinsTodayEl = document.getElementById('spinsToday');
  const bonusesClaimedEl = document.getElementById('bonusesClaimed');
  const resultEl = document.getElementById('spinResult');

  if (!wheelEl || !wheelLabelsEl || !spinBtn || !spinsTodayEl || !bonusesClaimedEl || !resultEl) {
    // Если разметка не совпала - тихо выходим.
    return;
  }

  const outcomes = [
    { top: '200 FREE', sub: 'SPINS', result: '200' },
    { top: '+500%', sub: 'BONUS', result: '+500%' },
    { top: '50', sub: 'SPINS', result: '50' },
    { top: '+200%', sub: 'BONUS', result: '+200%' },
    { top: '100', sub: 'SPINS', result: '100' },
    { top: '+300%', sub: 'BONUS', result: '+300%' },
    { top: '75', sub: 'SPINS', result: '75' },
    { top: '+150%', sub: 'BONUS', result: '+150%' },
    { top: '25', sub: 'SPINS', result: '25' },
    { top: '+100%', sub: 'BONUS', result: '+100%' }
  ];

  // Начальная ротация (под “как на макете” визуально).
  let currentRotation = -18; // degrees
  let isSpinning = false;

  const segments = outcomes.length;
  const segAngle = 360 / segments;

  const formatWithSpaces = (n) =>
    String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const makeWheelLabels = () => {
    wheelLabelsEl.innerHTML = '';
    for (let i = 0; i < segments; i++) {
      const o = outcomes[i];
      const angle = i * segAngle + segAngle / 2; // центр сегмента

      const label = document.createElement('div');
      label.className = 'wheel__label';
      label.style.transform = `rotate(${angle}deg) translateY(-170px) rotate(-${angle}deg)`;

      const top = document.createElement('div');
      top.textContent = o.top;
      top.style.fontSize = '14px';

      const sub = document.createElement('div');
      sub.className = 'wheel__labelSmall';
      sub.textContent = o.sub;

      label.appendChild(top);
      label.appendChild(sub);

      wheelLabelsEl.appendChild(label);
    }
  };

  const setWheelRotation = (deg, animate) => {
    if (!animate) {
      wheelEl.style.transition = 'none';
      wheelEl.style.transform = `rotate(${deg}deg)`;
      // Force reflow
      // eslint-disable-next-line no-unused-expressions
      wheelEl.offsetHeight;
      wheelEl.style.transition = '';
      return;
    }
    wheelEl.style.transform = `rotate(${deg}deg)`;
  };

  const readSpinsValue = () => {
    const raw = spinsTodayEl.textContent.trim().replace(/\s+/g, '');
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  };

  const writeSpinsValue = (n) => {
    spinsTodayEl.textContent = formatWithSpaces(Math.max(0, n));
  };

  const readBonusesValue = () => {
    const raw = bonusesClaimedEl.textContent.trim().replace(/\s+/g, '');
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  };

  const writeBonusesValue = (n) => {
    bonusesClaimedEl.textContent = formatWithSpaces(Math.max(0, n));
  };

  const pickOutcomeIndex = () => {
    // Равномерно. Если хочешь “весы” (например, чаще 200, реже +500%), скажи - добавлю.
    return Math.floor(Math.random() * segments);
  };

  const spin = async () => {
    if (isSpinning) return;

    const spinsLeft = readSpinsValue();
    if (spinsLeft <= 0) {
      resultEl.textContent = 'Нет спинов сегодня.';
      return;
    }

    isSpinning = true;
    spinBtn.disabled = true;

    const targetIndex = pickOutcomeIndex();
    const fullSpins = 5 + Math.floor(Math.random() * 4); // 5..8 полных оборотов

    // Требуемая ротация, чтобы выбранный сегмент оказался под “иглой”.
    const desiredMod = ((-(targetIndex * segAngle + segAngle / 2)) % 360 + 360) % 360;
    const currentMod = ((currentRotation % 360) + 360) % 360;
    const deltaMod = ((desiredMod - currentMod) + 360) % 360;

    const targetRotation = currentRotation + fullSpins * 360 + deltaMod;
    const durationMs = 4200;

    setWheelRotation(targetRotation, true);

    // Обновляем UI после анимации.
    window.setTimeout(() => {
      currentRotation = targetRotation;
      const o = outcomes[targetIndex];

      resultEl.textContent = o.result === '200'
        ? '200 FREE SPINS'
        : `BONUS ${o.result}`;

      writeSpinsValue(spinsLeft - 1);
      writeBonusesValue(readBonusesValue() + 17); // условная “прибавка” для красоты

      isSpinning = false;
      spinBtn.disabled = false;
    }, durationMs);
  };

  // Инициализация
  makeWheelLabels();
  setWheelRotation(currentRotation, false);
  spinBtn.addEventListener('click', spin);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') spin();
  });
})();

