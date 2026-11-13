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

// Облачетата смог – също в части от екрана
const smogPuffs = Array.from({ length: 48 }, (_, i) => ({
  x: Math.random(),
  y: 0.25 + Math.random() * 0.7,          // повече смог в ниската част
  radius: 0.12 + Math.random() * 0.2,     // спрямо по-голямата страна на екрана
  speed: 0.00004 + Math.random() * 0.0001,
  alpha: 0.25 + Math.random() * 0.35,
  // Праг: облачетата с по-нисък праг изчезват по-рано –
  // така смогът изтънява постепенно, а не наведнъж
  threshold: i / 48,
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

let skyWidth = 0;
let skyHeight = 0;
let targetClean = 0;  // колко чист трябва да е въздухът според скрола (0–1)
let clean = 0;        // колко чист е в момента (плавно гони targetClean)

// Настройва размера на canvas според екрана (и острите екрани на телефоните)
function resizeSky() {
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  skyWidth = window.innerWidth;
  skyHeight = window.innerHeight;
  skyCanvas.width = Math.round(skyWidth * ratio);
  skyCanvas.height = Math.round(skyHeight * ratio);
  skyCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
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

// Помощна функция: цвят от SKY_COLORS според текущата чистота
const skyColor = (name) => mixColor(SKY_COLORS[name][0], SKY_COLORS[name][1], clean);

function drawSkyGradient(w, h) {
  const gradient = skyCtx.createLinearGradient(0, 0, 0, h * 0.7);
  gradient.addColorStop(0, skyColor("top"));
  gradient.addColorStop(0.55, skyColor("middle"));
  gradient.addColorStop(1, skyColor("horizon"));
  skyCtx.fillStyle = gradient;
  skyCtx.fillRect(0, 0, w, h);
}

// Слънцето: бледо петно в смога, ярко и с ореол в чистия въздух
function drawSun(w, h) {
  const x = w * 0.78;
  const y = h * 0.22;
  const r = Math.min(w, h) * 0.05;

  const glow = skyCtx.createRadialGradient(x, y, r * 0.5, x, y, r * 5);
  glow.addColorStop(0, `rgba(255, 236, 170, ${0.05 + clean * 0.35})`);
  glow.addColorStop(1, "rgba(255, 236, 170, 0)");
  skyCtx.fillStyle = glow;
  skyCtx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);

  skyCtx.fillStyle = `rgba(255, 238, 180, ${0.15 + clean * 0.8})`;
  skyCtx.beginPath();
  skyCtx.arc(x, y, r, 0, Math.PI * 2);
  skyCtx.fill();
}

function drawBalkan(w, h) {
  skyCtx.fillStyle = skyColor("balkan");
  skyCtx.beginPath();
  skyCtx.moveTo(0, h);
  BALKAN_PEAKS.forEach(([x, y]) => skyCtx.lineTo(w * x, h * y));
  skyCtx.lineTo(w, h);
  skyCtx.fill();
}

// Дъното на долината с града и светлините в прозорците
function drawCity(w, h) {
  const groundY = h * 0.74;
  skyCtx.fillStyle = skyColor("valley");
  skyCtx.fillRect(0, groundY, w, h - groundY);

  buildings.forEach((b) => {
    skyCtx.fillRect(w * b.x, groundY - h * b.height, w * b.width, h * b.height + 1);
  });

  // Светлините се виждат през смога и избледняват на дневна светлина
  skyCtx.fillStyle = `rgba(255, 210, 122, ${0.25 + (1 - clean) * 0.45})`;
  buildings.forEach((b, i) => {
    if (i % 2 === 0) skyCtx.fillRect(w * (b.x + b.width / 3), groundY - h * b.height * 0.6, 2, 2);
  });
}

function drawSrednaGora(w, h) {
  skyCtx.fillStyle = skyColor("sredna");
  skyCtx.beginPath();
  skyCtx.moveTo(0, h * 0.88);
  skyCtx.quadraticCurveTo(w * 0.25, h * 0.81, w * 0.5, h * 0.87);
  skyCtx.quadraticCurveTo(w * 0.75, h * 0.93, w, h * 0.85);
  skyCtx.lineTo(w, h);
  skyCtx.lineTo(0, h);
  skyCtx.fill();
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
      skyCtx.drawImage(puffSprite, puff.x * w - r, puff.y * h - r, r * 2, r * 2);
    }
    // Облачето се носи надясно; когато излезе от екрана, се връща отляво
    if (!reduceMotion) {
      puff.x += puff.speed;
      if (puff.x > 1.4) puff.x = -0.4;
    }
  });
  skyCtx.globalAlpha = 1;

  // Похлупакът: инверсията държи мръсния въздух ниско над града
  const haze = skyCtx.createLinearGradient(0, h * 0.3, 0, h);
  haze.addColorStop(0, "rgba(130, 118, 96, 0)");
  haze.addColorStop(1, `rgba(130, 118, 96, ${smog * 0.55})`);
  skyCtx.fillStyle = haze;
  skyCtx.fillRect(0, 0, w, h);
}

// Рисува един кадър от небето
function drawSky() {
  drawSkyGradient(skyWidth, skyHeight);
  drawSun(skyWidth, skyHeight);
  drawBalkan(skyWidth, skyHeight);
  drawCity(skyWidth, skyHeight);
  drawSrednaGora(skyWidth, skyHeight);
  drawSmog(skyWidth, skyHeight);
}

// Анимационен цикъл: всеки кадър доближаваме clean до targetClean.
// Така преходът е плавен дори при рязък скрол.
function animateSky() {
  clean = lerp(clean, targetClean, 0.06);
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
