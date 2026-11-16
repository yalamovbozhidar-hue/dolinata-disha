/* =========================================
   СИМУЛАТОР „ИЗЧИСТИ НЕБЕТО“
   Плъзгач и отметки променят колко е замърсен въздухът,
   а canvas рисува небето, къщите и дима от комините.
   ========================================= */
const simCanvas = document.getElementById("sim-canvas");
const simCtx = simCanvas.getContext("2d");
const slider = document.getElementById("clean-heating");
const sliderValue = document.getElementById("clean-heating-value");
const checkboxes = document.querySelectorAll(".sim__options input");
const statusText = document.getElementById("sim-status");
const meterBar = document.getElementById("meter-bar");
const simReset = document.getElementById("sim-reset");
const SLIDER_START = slider.value; // началната стойност от HTML – за бутона „Върни както беше“

// pollution: 1 = много замърсено, 0 = напълно чисто
let pollution = 0.9;        // текуща стойност (плавно се мени)
let targetPollution = 0.9;  // към коя стойност отиваме
let smokeParticles = [];
let simIsVisible = false;   // рисуваме само когато симулаторът е на екрана
let simScale = 1;           // колко пиксела от canvas-а са един CSS пиксел (остри екрани)
let simLastFrame = 0;       // кога е бил предишният кадър

// Цветове на небето: [мръсно, чисто]
const SKY_TOP = [[70, 66, 60], [74, 144, 226]];
const SKY_BOTTOM = [[140, 128, 108], [190, 225, 250]];

// Комини на къщите (в проценти от ширината)
const chimneys = [0.12, 0.22, 0.31, 0.43, 0.52, 0.61, 0.72, 0.83, 0.91];

// На остър екран (телефон, лаптоп с HiDPI) рисуваме с повече пиксели – иначе
// картинката е размазана. Най-много 2 пъти, за да не тежи.
function resizeSim() {
  simScale = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(simCanvas.offsetWidth * simScale);
  const height = Math.round(simCanvas.offsetHeight * simScale);
  // На телефон „resize“ идва и когато лентата с адреса се скрие – тогава размерът е същият
  if (width === simCanvas.width && height === simCanvas.height) return false;
  simCanvas.width = width;
  simCanvas.height = height;
  return true;
}

// Изчислява замърсяването от избраните настройки
function calculatePollution() {
  const cleanHeating = Number(slider.value); // 0–100
  let improvement = cleanHeating * 0.55;     // отоплението тежи най-много

  checkboxes.forEach((box) => {
    if (box.checked) improvement += Number(box.dataset.effect);
  });

  targetPollution = clamp(1 - improvement / 100, 0.03, 1);
  updateLabels();
}

function updateLabels() {
  sliderValue.textContent = slider.value;
  slider.style.setProperty("--fill", `${slider.value}%`); // запълнената част на плъзгача (CSS)
  // Бутонът за връщане работи само ако нещо е променено
  simReset.disabled = slider.value === SLIDER_START && !Array.from(checkboxes).some((box) => box.checked);
  meterBar.style.width = `${Math.round((1 - targetPollution) * 100)}%`;
  meterBar.style.backgroundColor = mixColor([201, 88, 60], [126, 224, 161], 1 - targetPollution);

  let label;
  if (targetPollution > 0.75) label = "Много замърсен 😷";
  else if (targetPollution > 0.5) label = "Замърсен 😕";
  else if (targetPollution > 0.25) label = "Умерен 🙂";
  else label = "Чист 🌿";
  statusText.textContent = label;
}

// Рисува хълмовете и къщите
function drawLandscape(w, h) {
  // Балканът отзад
  simCtx.fillStyle = mixColor([60, 60, 55], [70, 110, 90], 1 - pollution);
  simCtx.beginPath();
  simCtx.moveTo(0, h * 0.55);
  [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1].forEach((x, i) => {
    simCtx.lineTo(w * x, h * (i % 2 === 0 ? 0.38 : 0.5));
  });
  simCtx.lineTo(w, h);
  simCtx.lineTo(0, h);
  simCtx.fill();

  // Поляна отпред
  simCtx.fillStyle = mixColor([45, 50, 40], [60, 120, 70], 1 - pollution);
  simCtx.fillRect(0, h * 0.8, w, h * 0.2);

  // Къщи с комини
  simCtx.fillStyle = "#1c2420";
  chimneys.forEach((cx) => {
    const x = w * cx;
    const houseW = w * 0.06;
    const houseH = h * 0.1;
    const baseY = h * 0.82;
    simCtx.fillRect(x - houseW / 2, baseY - houseH, houseW, houseH);       // стена
    simCtx.beginPath();                                                     // покрив
    simCtx.moveTo(x - houseW * 0.6, baseY - houseH);
    simCtx.lineTo(x, baseY - houseH * 1.6);
    simCtx.lineTo(x + houseW * 0.6, baseY - houseH);
    simCtx.fill();
    simCtx.fillRect(x + houseW * 0.15, baseY - houseH * 1.7, houseW * 0.15, houseH * 0.6); // комин
  });
}

// Добавя нови частици дим от комините според замърсяването.
// speed = колко „кадъра при 60 в секунда“ са минали (виж drawSim).
function spawnSmoke(w, h, speed) {
  chimneys.forEach((cx) => {
    if (Math.random() < pollution * 0.35 * speed) {
      smokeParticles.push({
        x: w * cx + w * 0.02,
        y: h * 0.82 - h * 0.17,
        radius: (4 + Math.random() * 6) * simScale,
        vx: (0.2 + Math.random() * 0.4) * simScale,
        vy: (-0.3 - Math.random() * 0.4) * simScale,
        life: 1,
      });
    }
  });
}

function drawSim(now = performance.now()) {
  const w = simCanvas.width;
  const h = simCanvas.height;

  // Екраните са различно бързи (60, 90, 120 кадъра в секунда). За да се движи
  // димът еднакво навсякъде, смятаме колко време е минало от предишния кадър.
  const speed = clamp((now - simLastFrame) / (1000 / 60), 0, 3);
  simLastFrame = now;

  // Плавно доближаване до целевата стойност
  pollution += (targetPollution - pollution) * Math.min(0.04 * speed, 1);

  // Небе
  const sky = simCtx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, mixColor(SKY_TOP[0], SKY_TOP[1], 1 - pollution));
  sky.addColorStop(1, mixColor(SKY_BOTTOM[0], SKY_BOTTOM[1], 1 - pollution));
  simCtx.fillStyle = sky;
  simCtx.fillRect(0, 0, w, h);

  // Слънце – вижда се по-ясно, когато въздухът е чист
  simCtx.fillStyle = `rgba(255, 230, 150, ${0.25 + (1 - pollution) * 0.75})`;
  simCtx.beginPath();
  simCtx.arc(w * 0.8, h * 0.2, h * 0.07, 0, Math.PI * 2);
  simCtx.fill();

  drawLandscape(w, h);

  // Дим от комините
  spawnSmoke(w, h, speed);
  smokeParticles.forEach((p) => {
    p.x += p.vx * speed;
    p.y += p.vy * speed;
    p.radius += 0.15 * simScale * speed;
    p.life -= 0.006 * speed;
    simCtx.fillStyle = `rgba(120, 110, 95, ${p.life * 0.5})`;
    simCtx.beginPath();
    simCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    simCtx.fill();
  });
  smokeParticles = smokeParticles.filter((p) => p.life > 0);

  // „Похлупак“ от смог над долината (инверсия)
  const haze = simCtx.createLinearGradient(0, h * 0.3, 0, h * 0.85);
  haze.addColorStop(0, "rgba(130, 120, 100, 0)");
  haze.addColorStop(1, `rgba(130, 120, 100, ${pollution * 0.6})`);
  simCtx.fillStyle = haze;
  simCtx.fillRect(0, 0, w, h);

  // Продължаваме анимацията само докато симулаторът се вижда
  if (simIsVisible) requestAnimationFrame(drawSim);
}

slider.addEventListener("input", calculatePollution);
checkboxes.forEach((box) => box.addEventListener("change", calculatePollution));

// „Върни както беше“: плъзгачът и отметките се връщат в началото
simReset.addEventListener("click", () => {
  slider.value = SLIDER_START;
  checkboxes.forEach((box) => { box.checked = false; });
  calculatePollution();
});
window.addEventListener("resize", () => {
  // Смяната на размера изчиства canvas-а; извън екрана цикълът не върви – рисуваме един кадър
  if (resizeSim() && !simIsVisible) drawSim();
});

// Пестим батерията: анимацията спира, когато симулаторът е извън екрана
const simObserver = new IntersectionObserver((entries) => {
  const wasVisible = simIsVisible;
  simIsVisible = entries[0].isIntersecting;
  if (simIsVisible && !wasVisible) {
    simLastFrame = performance.now();
    requestAnimationFrame(drawSim);
  }
});

resizeSim();
calculatePollution();
pollution = targetPollution; // започваме директно от началното състояние
drawSim();                   // рисуваме един кадър веднага
simObserver.observe(simCanvas);
