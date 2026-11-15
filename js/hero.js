/* =========================================
   НЕБЕТО НАД ДОЛИНАТА (фон на целия сайт)
   Canvas с position: fixed стои зад съдържанието.
   В началото долината е в гъст смог. Колкото повече
   скролваш (т.е. колкото повече научаваш), толкова
   по-чисто става небето, а планините – по-зелени.
   ========================================= */
const skyCanvas = document.getElementById("sky");
const skyCtx = skyCanvas.getContext("2d");

// Цветове: [в смог, в чист въздух]. Всеки цвят е [r, g, b].
const SKY_COLORS = {
  top: [[46, 43, 40], [16, 48, 92]],         // небето най-горе
  middle: [[92, 83, 70], [40, 98, 152]],     // небето в средата
  horizon: [[148, 130, 104], [118, 176, 206]], // небето над планините
  balkan: [[70, 67, 60], [40, 96, 72]],      // Балканът отзад
  valley: [[36, 34, 30], [22, 50, 38]],      // дъното на долината с града
  sredna: [[25, 25, 23], [15, 38, 28]],      // Средна гора отпред
};

// Върхове на Балкана: [x, y] в части от ширината и височината на екрана
const BALKAN_PEAKS = [
  [0, 0.66], [0.08, 0.58], [0.15, 0.63], [0.24, 0.52], [0.33, 0.61],
  [0.4, 0.56], [0.49, 0.64], [0.57, 0.53], [0.67, 0.62], [0.75, 0.55],
  [0.84, 0.63], [0.92, 0.56], [1, 0.61],
];

// Сградите на града – създаваме ги веднъж, в части от екрана,
// за да не се „разбъркват“ при промяна на размера
const buildings = [];
for (let x = 0.03; x < 0.97; x += 0.018 + Math.random() * 0.02) {
  buildings.push({ x, width: 0.01 + Math.random() * 0.012, height: 0.012 + Math.random() * 0.035 });
}

// Облачетата смог – също в части от екрана.
// На телефон са по-малко, за да върви плавно.
const PUFF_COUNT = window.innerWidth < 720 ? 28 : 44;
const smogPuffs = Array.from({ length: PUFF_COUNT }, (_, i) => ({
  x: Math.random(),
  y: 0.25 + Math.random() * 0.7,          // повече смог в ниската част
  radius: 0.12 + Math.random() * 0.2,     // спрямо по-голямата страна на екрана
  speed: 0.00004 + Math.random() * 0.0001,
  alpha: 0.25 + Math.random() * 0.35,
  // Праг: облачетата с по-нисък праг изчезват по-рано –
  // така смогът изтънява постепенно, а не наведнъж
  threshold: i / PUFF_COUNT,
  // Колко пиксела го е отместил „вятърът“ (виж blowWind по-долу)
  pushX: 0,
  pushY: 0,
}));

// Едно меко „петно“ смог, нарисувано веднъж в малък скрит canvas.
// После само го копираме – много по-бързо от нов градиент всеки кадър.
const puffSprite = document.createElement("canvas");
puffSprite.width = puffSprite.height = 128;
const puffCtx = puffSprite.getContext("2d");
const puffGradient = puffCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
puffGradient.addColorStop(0, "rgba(160, 146, 122, 1)");
puffGradient.addColorStop(1, "rgba(160, 146, 122, 0)");
puffCtx.fillStyle = puffGradient;
puffCtx.fillRect(0, 0, 128, 128);

// Два скрити canvas-а за вятъра:
// cleanView – същата долина, но в напълно чист въздух (рисува се веднъж);
// windLayer – само парчетата от cleanView, които вятърът „отваря“.
const cleanView = document.createElement("canvas");
const cleanCtx = cleanView.getContext("2d");
const windLayer = document.createElement("canvas");
const windCtx = windLayer.getContext("2d");

let skyWidth = 0;
let skyHeight = 0;
let targetClean = 0;  // колко чист трябва да е въздухът според скрола (0–1)
let clean = 0;        // колко чист е в момента (плавно гони targetClean)

// Настройва размера на canvas-ите според екрана.
// Небето и смогът са меки, затова не рисуваме в двойна резолюция
// на острите екрани – така телефонът рисува 2–4 пъти по-малко пиксели.
function resizeSky() {
  skyWidth = window.innerWidth;
  skyHeight = window.innerHeight;
  [skyCanvas, cleanView, windLayer].forEach((canvas) => {
    canvas.width = skyWidth;
    canvas.height = skyHeight;
  });
  drawValley(cleanCtx, skyWidth, skyHeight, 1); // чистата долина – веднъж при всяка промяна на размера
  if (reduceMotion) drawSky();
}

// Прогресът на скрола (0 → 1) определя колко чист е въздухът
function updateTargetClean() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  // Въздухът става напълно чист малко преди края на страницата
  targetClean = clamp(progress / 0.85, 0, 1);

  if (reduceMotion) {
    clean = targetClean; // без плавен преход – рисуваме само при скрол
    drawSky();
  }
}

/* -----------------------------------------
   РИСУВАНЕ НА ДОЛИНАТА
   Всяка функция получава къде да рисува (ctx),
   размерите (w, h) и колко е чист въздухът (c: 0–1).
   ----------------------------------------- */

// Помощна функция: цвят от SKY_COLORS според чистотата c
const skyColor = (name, c) => mixColor(SKY_COLORS[name][0], SKY_COLORS[name][1], c);

function drawSkyGradient(ctx, w, h, c) {
  const gradient = ctx.createLinearGradient(0, 0, 0, h * 0.7);
  gradient.addColorStop(0, skyColor("top", c));
  gradient.addColorStop(0.55, skyColor("middle", c));
  gradient.addColorStop(1, skyColor("horizon", c));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

// Слънцето: бледо петно в смога, ярко и с ореол в чистия въздух
function drawSun(ctx, w, h, c) {
  const x = w * 0.78;
  const y = h * 0.22;
  const r = Math.min(w, h) * 0.05;

  const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 5);
  glow.addColorStop(0, `rgba(255, 236, 170, ${0.05 + c * 0.35})`);
  glow.addColorStop(1, "rgba(255, 236, 170, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);

  ctx.fillStyle = `rgba(255, 238, 180, ${0.15 + c * 0.8})`;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawBalkan(ctx, w, h, c) {
  ctx.fillStyle = skyColor("balkan", c);
  ctx.beginPath();
  ctx.moveTo(0, h);
  BALKAN_PEAKS.forEach(([x, y]) => ctx.lineTo(w * x, h * y));
  ctx.lineTo(w, h);
  ctx.fill();
}

// Дъното на долината с града и светлините в прозорците
function drawCity(ctx, w, h, c) {
  const groundY = h * 0.74;
  ctx.fillStyle = skyColor("valley", c);
  ctx.fillRect(0, groundY, w, h - groundY);

  buildings.forEach((b) => {
    ctx.fillRect(w * b.x, groundY - h * b.height, w * b.width, h * b.height + 1);
  });

  // Светлините се виждат през смога и избледняват на дневна светлина
  ctx.fillStyle = `rgba(255, 210, 122, ${0.25 + (1 - c) * 0.45})`;
  buildings.forEach((b, i) => {
    if (i % 2 === 0) ctx.fillRect(w * (b.x + b.width / 3), groundY - h * b.height * 0.6, 2, 2);
  });
}

function drawSrednaGora(ctx, w, h, c) {
  ctx.fillStyle = skyColor("sredna", c);
  ctx.beginPath();
  ctx.moveTo(0, h * 0.88);
  ctx.quadraticCurveTo(w * 0.25, h * 0.81, w * 0.5, h * 0.87);
  ctx.quadraticCurveTo(w * 0.75, h * 0.93, w, h * 0.85);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();
}

// Цялата долина без смога: небе, слънце, планини, град
function drawValley(ctx, w, h, c) {
  drawSkyGradient(ctx, w, h, c);
  drawSun(ctx, w, h, c);
  drawBalkan(ctx, w, h, c);
  drawCity(ctx, w, h, c);
  drawSrednaGora(ctx, w, h, c);
}

// Смогът: облачета, които бавно се носят, плюс общ „похлупак“
function drawSmog(w, h) {
  const smog = 1 - clean;
  const size = Math.max(w, h);

  smogPuffs.forEach((puff) => {
    // Колко се вижда това облаче: 1 при гъст смог, 0 при чисто небе
    const visibility = clamp((smog * 1.25 - puff.threshold) / 0.25, 0, 1);
    if (visibility > 0) {
      const r = puff.radius * size;
      skyCtx.globalAlpha = puff.alpha * visibility;
      skyCtx.drawImage(puffSprite, puff.x * w + puff.pushX - r, puff.y * h + puff.pushY - r, r * 2, r * 2);
    }
    // Облачето се носи надясно; когато излезе от екрана, се връща отляво
    if (!reduceMotion) {
      puff.x += puff.speed;
      if (puff.x > 1.4) puff.x = -0.4;
    }
    // Отместването от вятъра бавно отшумява и облачето се връща
    puff.pushX *= 0.98;
    puff.pushY *= 0.98;
  });
  skyCtx.globalAlpha = 1;

  // Похлупакът: инверсията държи мръсния въздух ниско над града
  const haze = skyCtx.createLinearGradient(0, h * 0.3, 0, h);
  haze.addColorStop(0, "rgba(130, 118, 96, 0)");
  haze.addColorStop(1, `rgba(130, 118, 96, ${smog * 0.55})`);
  skyCtx.fillStyle = haze;
  skyCtx.fillRect(0, 0, w, h);
}

/* -----------------------------------------
   ВЯТЪР ОТ РЪКАТА ТИ
   Мишката или пръстът „духат“ смога: зад тях остава
   следа от чист въздух, която бавно се затваря,
   а облачетата наблизо се отместват по посоката на движението.
   ----------------------------------------- */
const windTrail = [];   // следата: точки { x, y, life }, life пада от 1 до 0
let lastWind = null;    // предишната точка, за да знаем посоката

function blowWind(x, y) {
  const now = performance.now();
  if (lastWind && Math.hypot(x - lastWind.x, y - lastWind.y) < 10) return; // твърде малко движение

  // Посока на вятъра; ако е минало много време, започваме „на чисто“
  const isFresh = !lastWind || now - lastWind.time > 150;
  const dx = isFresh ? 0 : x - lastWind.x;
  const dy = isFresh ? 0 : y - lastWind.y;
  lastWind = { x, y, time: now };

  windTrail.push({ x, y, life: 1 });
  if (windTrail.length > 40) windTrail.shift(); // пазим само последните 40 точки

  // Облачетата близо до ръката се отместват по посоката на движението
  const size = Math.max(skyWidth, skyHeight);
  smogPuffs.forEach((puff) => {
    const reach = puff.radius * size;
    const distance = Math.hypot(puff.x * skyWidth + puff.pushX - x, puff.y * skyHeight + puff.pushY - y);
    if (distance < reach) {
      const strength = 1 - distance / reach; // по-близо = по-силно
      puff.pushX += dx * strength * 1.5;
      puff.pushY += dy * strength * 1.5;
    }
  });
}

// Рисува следата на вятъра: там, където е духнал, се вижда чистата долина
function drawWind(w, h) {
  if (windTrail.length === 0) return;
  const radius = Math.min(w, h) * 0.16;
  const strength = 1 - clean; // когато въздухът вече е чист, няма какво да „издухваме“

  // 1) Рисуваме „маска“ – меки кръгове по следата
  windCtx.clearRect(0, 0, w, h);
  windTrail.forEach((point) => {
    const spot = windCtx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
    spot.addColorStop(0, `rgba(0, 0, 0, ${point.life * strength})`);
    spot.addColorStop(1, "rgba(0, 0, 0, 0)");
    windCtx.fillStyle = spot;
    windCtx.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
    point.life -= 0.01; // за около 1.5 секунди следата изчезва
  });

  // 2) source-in: чистата долина остава само там, където има маска
  windCtx.globalCompositeOperation = "source-in";
  windCtx.drawImage(cleanView, 0, 0);
  windCtx.globalCompositeOperation = "source-over";

  // 3) Слагаме парчетата чист въздух върху смога
  skyCtx.drawImage(windLayer, 0, 0);

  // Махаме точките, които вече са изчезнали
  while (windTrail.length && windTrail[0].life <= 0) windTrail.shift();
}

// Мишка и писалка: pointermove. Пръст: touchmove – той продължава
// да идва и докато страницата се скролва.
if (!reduceMotion) {
  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "touch") blowWind(event.clientX, event.clientY);
  }, { passive: true });
  window.addEventListener("touchmove", (event) => {
    blowWind(event.touches[0].clientX, event.touches[0].clientY);
  }, { passive: true });
}

/* -----------------------------------------
   ВЪЗДУХОМЕРЪТ в менюто
   Точката сменя цвета си от кафяво (смог) към зелено (чист въздух),
   а думата – при всяка от трите граници.
   ----------------------------------------- */
const airChip = document.querySelector(".air-chip");
const airValue = document.getElementById("air-chip-value");
const AIR_DOT_COLORS = [[181, 154, 114], [126, 224, 161]]; // [смог, чисто]
const AIR_LEVELS = [
  { below: 0.35, label: "смог" },
  { below: 0.75, label: "мъгла" },
  { below: Infinity, label: "чист" },
];
let airShown = -1; // за коя стойност е показан въздухомерът

function updateAirChip() {
  if (Math.abs(clean - airShown) < 0.005) return; // няма видима промяна
  airShown = clean;
  airChip.style.setProperty("--air", mixColor(AIR_DOT_COLORS[0], AIR_DOT_COLORS[1], clean));
  const label = AIR_LEVELS.find((level) => clean < level.below).label;
  if (airValue.textContent !== label) airValue.textContent = label;
}

// Рисува един кадър от небето
function drawSky() {
  drawValley(skyCtx, skyWidth, skyHeight, clean);
  drawSmog(skyWidth, skyHeight);
  drawWind(skyWidth, skyHeight);
  updateAirChip();
}

// Анимационен цикъл: всеки кадър доближаваме clean до targetClean.
// Така преходът е плавен дори при рязък скрол.
function animateSky() {
  clean = lerp(clean, targetClean, 0.05);
  drawSky();
  requestAnimationFrame(animateSky);
}

window.addEventListener("resize", () => {
  resizeSky();
  updateTargetClean();
});
window.addEventListener("scroll", updateTargetClean, { passive: true });

resizeSky();
updateTargetClean();
clean = targetClean; // при презареждане по средата на страницата започваме от правилното място

// При изключени анимации рисуваме само при скрол и промяна на размера
if (reduceMotion) drawSky();
else animateSky();
