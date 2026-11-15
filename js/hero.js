/* =========================================
   НЕБЕТО НАД ДОЛИНАТА (фон на целия сайт)
   Canvas с position: fixed стои зад съдържанието.
   Долината: три пласта планини, град с комини, завод и редове рози.
   Скролът движи две неща:
   - clean: смогът над града се разсейва (колкото повече научаваш);
   - dayTime: денят минава – зора, ден, залез и звездна нощ в края.
   ========================================= */
const skyCanvas = document.getElementById("sky");
const skyCtx = skyCanvas.getContext("2d");

// Цветове: [в смог, в чист въздух]. Всеки цвят е [r, g, b].
// Небето е утринно (синьо горе, розово-прасковено над планините).
// Колкото по-далечна е планината, толкова по-синкава и бледа е – като в истински въздух.
const SKY_COLORS = {
  top: [[24, 40, 80], [18, 52, 108]],          // небето най-горе
  middle: [[82, 112, 160], [70, 136, 198]],    // небето в средата
  horizon: [[232, 180, 158], [255, 200, 168]], // зората над планините
  far: [[118, 128, 168], [132, 150, 196]],     // далечните върхове на Балкана
  ridge: [[72, 90, 118], [66, 104, 138]],      // главното било
  hills: [[56, 76, 76], [46, 94, 82]],         // предпланините
  valley: [[66, 74, 62], [62, 108, 72]],       // полето с града и розите
  sredna: [[28, 40, 36], [22, 56, 42]],        // Средна гора отпред
};

// Билата на планините: височина (в части от екрана) за 65 точки отляво надясно.
// Всяка точка по средата = средното на съседките + случайно отклонение,
// което с всяка стъпка намалява. Така върховете изглеждат естествено накъсани.
function makeRidge(base, height, roughness) {
  const n = 64;
  const ys = [];
  ys[0] = base - Math.random() * height;
  ys[n] = base - Math.random() * height;
  let spread = height;
  for (let step = n; step > 1; step /= 2) {
    for (let i = step / 2; i < n; i += step) {
      ys[i] = (ys[i - step / 2] + ys[i + step / 2]) / 2 + (Math.random() - 0.5) * spread;
    }
    spread *= roughness;
  }
  return ys;
}

// Три пласта планини – от най-далечния към най-близкия
const RIDGES = {
  far: makeRidge(0.47, 0.14, 0.55),
  ridge: makeRidge(0.57, 0.1, 0.55),
  hills: makeRidge(0.68, 0.05, 0.5),
};

// Сградите на града – създаваме ги веднъж, в части от екрана,
// за да не се „разбъркват“ при промяна на размера
const buildings = [];
for (let x = 0.03; x < 0.97; x += 0.018 + Math.random() * 0.02) {
  buildings.push({ x, width: 0.01 + Math.random() * 0.012, height: 0.012 + Math.random() * 0.035 });
}

// Редовете рози в полето: по-близките са по-ниско, с по-едри точки и по-нарядко
const ROSE_ROWS = [
  { y: 0.765, size: 1.5, gap: 6 },
  { y: 0.785, size: 2, gap: 8 },
  { y: 0.808, size: 2.5, gap: 10 },
  { y: 0.832, size: 3, gap: 12 },
];

// Часовете на деня. При всеки ключ: цветовете на небето, колко светло е
// и с какъв оттенък са оцветени планините (топъл при залез, син нощем).
const DAY_KEYS = [
  { t: 0, top: [24, 40, 80], middle: [82, 112, 160], horizon: [232, 180, 158], light: 0.95, tint: [255, 190, 170], tintAmount: 0.05 },
  { t: 0.32, top: [26, 86, 168], middle: [92, 156, 218], horizon: [196, 224, 240], light: 1, tint: [255, 255, 255], tintAmount: 0 },
  { t: 0.62, top: [30, 74, 146], middle: [118, 150, 204], horizon: [255, 210, 160], light: 0.95, tint: [255, 200, 140], tintAmount: 0.06 },
  { t: 0.84, top: [44, 40, 96], middle: [160, 84, 112], horizon: [255, 142, 92], light: 0.72, tint: [255, 120, 80], tintAmount: 0.12 },
  { t: 1, top: [6, 10, 30], middle: [16, 24, 56], horizon: [44, 44, 86], light: 0.3, tint: [30, 40, 90], tintAmount: 0.35 },
];

// Смесва два цвята [r, g, b] и връща пак масив (за по-нататъшни сметки)
const mixRgb = (a, b, t) => a.map((value, i) => Math.round(lerp(value, b[i], t)));
const rgb = (color, alpha = 1) => `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;

// Ключът за час t: намираме двата съседни ключа и смесваме между тях
function dayKey(t) {
  let i = 0;
  while (i < DAY_KEYS.length - 2 && t > DAY_KEYS[i + 1].t) i++;
  const a = DAY_KEYS[i];
  const b = DAY_KEYS[i + 1];
  const f = clamp((t - a.t) / (b.t - a.t), 0, 1);
  return {
    top: mixRgb(a.top, b.top, f),
    middle: mixRgb(a.middle, b.middle, f),
    horizon: mixRgb(a.horizon, b.horizon, f),
    light: lerp(a.light, b.light, f),
    tint: mixRgb(a.tint, b.tint, f),
    tintAmount: lerp(a.tintAmount, b.tintAmount, f),
  };
}

// Колко е нощ (0–1) и колко е залез (0–1) за час t
const nightAmount = (t) => clamp((t - 0.82) / 0.14, 0, 1);
const sunsetAmount = (t) => clamp(1 - Math.abs(t - 0.82) / 0.12, 0, 1);

const isPhone = window.innerWidth < 720;

// Звездите – само нощем, в горната част на небето
const stars = Array.from({ length: isPhone ? 70 : 140 }, () => ({
  x: Math.random(),
  y: Math.random() * 0.42,
  size: 0.6 + Math.random() * 1.2,
  phase: Math.random() * Math.PI * 2,   // за трептенето
}));

// Облаците: всеки е 4 меки петна. Появяват се в чистия въздух.
const clouds = Array.from({ length: isPhone ? 4 : 6 }, () => ({
  x: Math.random(),
  y: 0.06 + Math.random() * 0.2,
  scale: 0.6 + Math.random() * 0.6,
  speed: 0.00005 + Math.random() * 0.00008,
}));
const CLOUD_PUFFS = [[0, 0, 1], [0.7, 0.15, 0.8], [-0.7, 0.2, 0.75], [0.25, -0.35, 0.7]]; // [x, y, размер]

// Комините на къщите: всяка трета сграда има комин, от който излиза дим
const chimneyHouses = buildings.filter((_, i) => i % 3 === 1);
const chimneySmoke = [];   // { x, y, r, life, factory }
const SMOKE_MAX = isPhone ? 40 : 80;

// Заводът – вляво, в западната част на долината (там е и Горно Сахране)
const FACTORY = { x: 0.05, width: 0.1, stacks: [{ x: 0.075, height: 0.1 }, { x: 0.11, height: 0.08 }] };

// Листенца от рози, които вятърът носи в чистия въздух
const petals = [];
const PETAL_MAX = isPhone ? 6 : 12;

// Птиците се връщат, когато въздухът се изчисти
const birds = Array.from({ length: 6 }, () => ({
  x: Math.random(),
  y: 0.1 + Math.random() * 0.2,
  speed: 0.0003 + Math.random() * 0.0004,
  flap: Math.random() * Math.PI * 2,   // докъде е стигнал замахът с крилете
  size: 5 + Math.random() * 4,
}));

// Облачетата смог – също в части от екрана.
// На телефон са по-малко, за да върви плавно.
const PUFF_COUNT = window.innerWidth < 720 ? 28 : 44;
const smogPuffs = Array.from({ length: PUFF_COUNT }, (_, i) => ({
  x: Math.random(),
  y: 0.64 + Math.random() * 0.18,         // само в ивицата над града (инверсията)
  radius: 0.06 + Math.random() * 0.1,     // спрямо по-голямата страна на екрана
  speed: 0.00004 + Math.random() * 0.0001,
  alpha: 0.2 + Math.random() * 0.3,
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
puffGradient.addColorStop(0, "rgba(156, 144, 126, 1)");
puffGradient.addColorStop(1, "rgba(156, 144, 126, 0)");
puffCtx.fillStyle = puffGradient;
puffCtx.fillRect(0, 0, 128, 128);

// Същото петно в друг цвят – за облаците (бели и розово-оранжеви при залез)
function makeSprite(color) {
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 128;
  const ctx = sprite.getContext("2d");
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, rgb(color));
  gradient.addColorStop(0.5, rgb(color, 0.6));
  gradient.addColorStop(1, rgb(color, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return sprite;
}
const cloudWhite = makeSprite([255, 255, 255]);
const cloudWarm = makeSprite([255, 176, 150]);
const smokeSprite = makeSprite([120, 116, 110]);

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
let targetTime = 0;   // кой час трябва да е според скрола (0 = зора, 1 = нощ)
let dayTime = 0;      // кой час е в момента
let cleanViewTime = -1; // за кой час е нарисувана чистата долина за вятъра

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
  cleanViewTime = -1; // чистата долина ще се нарисува наново при нужда (виж drawWind)
  if (reduceMotion) drawSky();
}

// Прогресът на скрола (0 → 1) определя колко чист е въздухът
function updateTargetClean() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  // Въздухът става напълно чист малко преди края на страницата
  targetClean = clamp(progress / 0.85, 0, 1);
  // Денят минава през цялата страница: зора в началото, нощ във футъра
  targetTime = progress;

  if (reduceMotion) {
    clean = targetClean; // без плавен преход – рисуваме само при скрол
    dayTime = targetTime;
    drawSky();
  }
}

/* -----------------------------------------
   РИСУВАНЕ НА ДОЛИНАТА
   Всяка функция получава къде да рисува (ctx),
   размерите (w, h) и колко е чист въздухът (c: 0–1).
   ----------------------------------------- */

// Цвят на част от пейзажа: според чистотата c и според часа (светлина и оттенък)
function landColor(name, c, day) {
  const base = mixRgb(SKY_COLORS[name][0], SKY_COLORS[name][1], c);
  const lit = base.map((value) => value * day.light);
  return rgb(mixRgb(lit, day.tint, day.tintAmount));
}

// Небето зависи само от часа – над инверсията въздухът е чист
function drawSkyGradient(ctx, w, h, day) {
  const gradient = ctx.createLinearGradient(0, 0, 0, h * 0.6);
  gradient.addColorStop(0, rgb(day.top));
  gradient.addColorStop(0.55, rgb(day.middle));
  gradient.addColorStop(1, rgb(day.horizon));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

// Звездите трептят: всяка със свое темпо (phase)
function drawStars(ctx, w, h, t) {
  const night = nightAmount(t);
  if (night === 0) return;
  const now = performance.now() / 1000;
  ctx.fillStyle = "#fff";
  stars.forEach((star) => {
    ctx.globalAlpha = night * (0.55 + 0.45 * Math.sin(star.phase + now * 1.5));
    ctx.fillRect(star.x * w, star.y * h, star.size, star.size);
  });
  ctx.globalAlpha = 1;
}

// Луната изгрява вдясно, когато се стъмни
function drawMoon(ctx, w, h, t) {
  const visible = clamp((t - 0.86) / 0.1, 0, 1);
  if (visible === 0) return;
  const x = w * 0.8;
  const y = h * 0.18;
  const r = Math.min(w, h) * 0.032;
  const glow = ctx.createRadialGradient(x, y, r, x, y, r * 6);
  glow.addColorStop(0, `rgba(220, 230, 255, ${0.25 * visible})`);
  glow.addColorStop(1, "rgba(220, 230, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - r * 6, y - r * 6, r * 12, r * 12);
  ctx.fillStyle = `rgba(236, 240, 255, ${visible})`;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// Слънцето минава по дъга: изгрява вдясно, обед е високо, залязва вляво зад планините.
// Над инверсията то грее и при смог.
function drawSun(ctx, w, h, t) {
  const angle = lerp(0.15, 0.95, clamp(t / 0.9, 0, 1)) * Math.PI;
  const portrait = h > w; // на телефон дъгата е по-тясна и по-ниска – да не е зад заглавието
  const x = w * (0.5 + Math.cos(angle) * (portrait ? 0.32 : 0.38));
  const y = h * (0.55 - Math.sin(angle) * 0.45 + (portrait ? 0.06 : 0));
  const low = 1 - Math.sin(angle);                 // 0 по обед, ~1 ниско над хоризонта
  const r = Math.min(w, h) * (0.04 + low * 0.012);  // ниско слънце изглежда по-голямо
  const color = mixRgb([255, 246, 214], [255, 150, 90], clamp(low * 1.2, 0, 1));

  const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 7);
  glow.addColorStop(0, rgb(color, 0.5));
  glow.addColorStop(1, rgb(color, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(x - r * 7, y - r * 7, r * 14, r * 14);

  ctx.fillStyle = rgb(color, 0.95);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// Един пласт планини по точките от RIDGES
function drawRidge(ctx, w, h, c, day, name) {
  const ys = RIDGES[name];
  ctx.fillStyle = landColor(name, c, day);
  ctx.beginPath();
  ctx.moveTo(0, h);
  ys.forEach((y, i) => ctx.lineTo((w * i) / (ys.length - 1), h * y));
  ctx.lineTo(w, h);
  ctx.fill();
}

// Лека мъгла в подножието на планината – дава дълбочина (нощем почти я няма)
function drawMist(ctx, w, h, day, fromY, toY) {
  const mist = ctx.createLinearGradient(0, h * fromY, 0, h * toY);
  mist.addColorStop(0, rgb(day.horizon, 0));
  mist.addColorStop(1, rgb(day.horizon, 0.3 * day.light));
  ctx.fillStyle = mist;
  ctx.fillRect(0, h * fromY, w, h * (toY - fromY));
}

// Полето с града, завода, светлините в прозорците и редовете рози
function drawCity(ctx, w, h, c, day, t) {
  const groundY = h * 0.74;
  ctx.fillStyle = landColor("valley", c, day);
  ctx.fillRect(0, groundY, w, h - groundY);

  const silhouette = landColor("sredna", c, day); // сградите са тъмни силуети
  ctx.fillStyle = silhouette;
  buildings.forEach((b) => {
    ctx.fillRect(w * b.x, groundY - h * b.height, w * b.width, h * b.height + 1);
  });
  // Комините на къщите
  chimneyHouses.forEach((b) => {
    ctx.fillRect(w * (b.x + b.width * 0.65), groundY - h * b.height - 6, 3, 7);
  });

  // Заводът: ниска хала с назъбен покрив и два високи комина
  const fx = w * FACTORY.x;
  const fw = w * FACTORY.width;
  const fh = h * 0.035;
  ctx.beginPath();
  ctx.moveTo(fx, groundY);
  ctx.lineTo(fx, groundY - fh);
  for (let i = 0; i < 4; i++) {
    ctx.lineTo(fx + (fw * (i + 0.5)) / 4, groundY - fh - h * 0.012);
    ctx.lineTo(fx + (fw * (i + 1)) / 4, groundY - fh);
  }
  ctx.lineTo(fx + fw, groundY);
  ctx.fill();
  FACTORY.stacks.forEach((stack) => {
    ctx.fillRect(w * stack.x, groundY - h * stack.height, Math.max(4, w * 0.006), h * stack.height);
  });

  // Светлините се виждат през смога, избледняват денем и светват нощем
  const night = nightAmount(t);
  ctx.fillStyle = `rgba(255, 210, 122, ${clamp(0.3 + (1 - c) * 0.45 + night * 0.6, 0, 1)})`;
  buildings.forEach((b, i) => {
    if (i % 2 === 0 || night > 0.4) ctx.fillRect(w * (b.x + b.width / 3), groundY - h * b.height * 0.6, 2, 2);
  });

  // Розите: пунктирни редове – в чист въздух розовото се вижда по-ярко
  ctx.save();
  ctx.strokeStyle = `rgba(240, 122, 160, ${(0.25 + c * 0.55) * day.light})`;
  ROSE_ROWS.forEach((row) => {
    ctx.lineWidth = row.size;
    ctx.setLineDash([row.size, row.gap]);
    ctx.beginPath();
    ctx.moveTo(0, h * row.y);
    ctx.lineTo(w, h * row.y);
    ctx.stroke();
  });
  ctx.restore();
}

function drawSrednaGora(ctx, w, h, c, day) {
  ctx.fillStyle = landColor("sredna", c, day);
  ctx.beginPath();
  ctx.moveTo(0, h * 0.88);
  ctx.quadraticCurveTo(w * 0.25, h * 0.81, w * 0.5, h * 0.87);
  ctx.quadraticCurveTo(w * 0.75, h * 0.93, w, h * 0.85);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();
}

// Цялата долина без смога: небе, звезди, луна, слънце, три пласта планини,
// поле с града и Средна гора. c = колко е чист въздухът, t = часът на деня.
function drawValley(ctx, w, h, c, t) {
  const day = dayKey(t);
  drawSkyGradient(ctx, w, h, day);
  drawStars(ctx, w, h, t);
  drawMoon(ctx, w, h, t);
  drawSun(ctx, w, h, t);
  drawRidge(ctx, w, h, c, day, "far");
  drawMist(ctx, w, h, day, 0.4, 0.58);
  drawRidge(ctx, w, h, c, day, "ridge");
  drawMist(ctx, w, h, day, 0.55, 0.68);
  drawRidge(ctx, w, h, c, day, "hills");
  drawCity(ctx, w, h, c, day, t);
  drawSrednaGora(ctx, w, h, c, day);
}

/* -----------------------------------------
   ДИМЪТ ОТ КОМИНИТЕ И ОТ ЗАВОДА
   Нови облачета дим тръгват от комините – толкова по-често,
   колкото по-мръсен е въздухът. Издигат се, растат и изчезват.
   ----------------------------------------- */
function addSmoke(x, y, factory) {
  if (chimneySmoke.length >= SMOKE_MAX) return;
  chimneySmoke.push({ x, y, r: factory ? 6 : 3, life: 1, factory });
}

function drawChimneySmoke(w, h) {
  const smog = 1 - clean;
  const groundY = h * 0.74;

  if (!reduceMotion) {
    // Къщите: димът спира, когато въздухът се изчисти (чисто отопление)
    chimneyHouses.forEach((b) => {
      if (Math.random() < smog * 0.06) addSmoke(w * (b.x + b.width * 0.65) + 1, groundY - h * b.height - 6, false);
    });
    // Заводът: с добри филтри димът намалява, но не изчезва съвсем
    FACTORY.stacks.forEach((stack) => {
      if (Math.random() < 0.05 + smog * 0.1) addSmoke(w * stack.x + 2, groundY - h * stack.height, true);
    });
  }

  for (let i = chimneySmoke.length - 1; i >= 0; i--) {
    const puff = chimneySmoke[i];
    if (!reduceMotion) {
      puff.y -= puff.factory ? 0.5 : 0.35;
      puff.x += 0.25;                      // лек вятър надясно
      puff.r += puff.factory ? 0.22 : 0.12;
      puff.life -= puff.factory ? 0.006 : 0.008;
    }
    if (puff.life <= 0) {
      chimneySmoke.splice(i, 1);
      continue;
    }
    // Заводският дим е по-светъл, а с чист въздух – и по-прозрачен
    skyCtx.globalAlpha = puff.life * (puff.factory ? 0.25 + smog * 0.3 : 0.45);
    skyCtx.drawImage(puff.factory ? cloudWhite : smokeSprite, puff.x - puff.r, puff.y - puff.r, puff.r * 2, puff.r * 2);
  }
  skyCtx.globalAlpha = 1;
}

/* -----------------------------------------
   ОБЛАЦИ
   Бели облаци в чистия въздух, розово-оранжеви при залез,
   а нощем почти изчезват.
   ----------------------------------------- */
function drawClouds(w, h) {
  const visible = clamp((clean - 0.25) / 0.35, 0, 1) * (1 - nightAmount(dayTime) * 0.8) * 0.85;
  if (visible === 0) return;
  const warm = sunsetAmount(dayTime);
  const size = Math.min(w, h) * 0.12;

  clouds.forEach((cloud) => {
    if (!reduceMotion) {
      cloud.x += cloud.speed;
      if (cloud.x > 1.2) cloud.x = -0.2;
    }
    CLOUD_PUFFS.forEach(([dx, dy, scale]) => {
      const r = size * cloud.scale * scale;
      const x = cloud.x * w + dx * size * cloud.scale;
      const y = cloud.y * h + dy * size * cloud.scale * 0.6;
      skyCtx.globalAlpha = visible * (1 - warm);
      skyCtx.drawImage(cloudWhite, x - r, y - r * 0.6, r * 2, r * 1.2);
      if (warm > 0) {
        skyCtx.globalAlpha = visible * warm;
        skyCtx.drawImage(cloudWarm, x - r, y - r * 0.6, r * 2, r * 1.2);
      }
    });
  });
  skyCtx.globalAlpha = 1;
}

/* -----------------------------------------
   ЛИСТЕНЦА ОТ РОЗИ
   В чист въздух през деня вятърът понякога носи розови листенца.
   ----------------------------------------- */
function drawWindPetals(w, h) {
  const chance = clamp((clean - 0.65) / 0.35, 0, 1) * (1 - nightAmount(dayTime));
  if (!reduceMotion && petals.length < PETAL_MAX && Math.random() < chance * 0.03) {
    petals.push({
      x: -20,
      y: h * (0.15 + Math.random() * 0.55),
      speed: 1.2 + Math.random() * 1.2,
      sway: Math.random() * Math.PI * 2,
      angle: Math.random() * Math.PI,
      size: 4 + Math.random() * 3,
    });
  }

  skyCtx.fillStyle = "#f59ac0";
  for (let i = petals.length - 1; i >= 0; i--) {
    const petal = petals[i];
    if (!reduceMotion) {
      petal.x += petal.speed;
      petal.sway += 0.03;
      petal.y += Math.sin(petal.sway) * 0.6;
      petal.angle += 0.03;
    }
    if (petal.x > w + 20) {
      petals.splice(i, 1);
      continue;
    }
    skyCtx.save();
    skyCtx.translate(petal.x, petal.y);
    skyCtx.rotate(petal.angle);
    skyCtx.globalAlpha = 0.85;
    skyCtx.beginPath();
    skyCtx.ellipse(0, 0, petal.size, petal.size * 0.55, 0, 0, Math.PI * 2);
    skyCtx.fill();
    skyCtx.restore();
  }
}

// Птиците: малки извити черти, които размахват криле.
// Появяват се постепенно, когато въздухът е над 40% чист.
function drawBirds(w, h) {
  const visible = clamp((clean - 0.4) / 0.6, 0, 1) * (1 - nightAmount(dayTime));
  if (visible === 0) return;
  skyCtx.strokeStyle = `rgba(16, 26, 40, ${visible * 0.75})`;
  skyCtx.lineWidth = 1.6;
  birds.forEach((bird) => {
    const x = bird.x * w;
    const y = bird.y * h;
    const wing = Math.sin(bird.flap) * bird.size * 0.6;
    skyCtx.beginPath();
    skyCtx.moveTo(x - bird.size, y - wing);
    skyCtx.quadraticCurveTo(x - bird.size / 2, y - bird.size * 0.3, x, y);
    skyCtx.quadraticCurveTo(x + bird.size / 2, y - bird.size * 0.3, x + bird.size, y - wing);
    skyCtx.stroke();

    if (!reduceMotion) {
      bird.x += bird.speed;
      bird.flap += 0.15;
      if (bird.x > 1.1) bird.x = -0.1; // излетя вдясно – връща се отляво
    }
  });
}

// Смогът: облачета, които бавно се носят, плюс „похлупак“ – ивица над града
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

  // Похлупакът: при инверсия мръсният въздух стои ниско над града като ивица,
  // а над нея небето е чисто
  const band = skyCtx.createLinearGradient(0, h * 0.6, 0, h * 0.92);
  band.addColorStop(0, "rgba(150, 136, 116, 0)");
  band.addColorStop(0.35, `rgba(150, 136, 116, ${smog * 0.55})`);
  band.addColorStop(0.7, `rgba(138, 124, 104, ${smog * 0.5})`);
  band.addColorStop(1, "rgba(120, 108, 92, 0)");
  skyCtx.fillStyle = band;
  skyCtx.fillRect(0, h * 0.6, w, h * 0.32);
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
  // Чистата долина за вятъра – наново, само когато часът се е сменил
  if (Math.abs(dayTime - cleanViewTime) > 0.004) {
    drawValley(cleanCtx, w, h, 1, dayTime);
    cleanViewTime = dayTime;
  }
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
  drawValley(skyCtx, skyWidth, skyHeight, clean, dayTime);
  drawChimneySmoke(skyWidth, skyHeight);
  drawSmog(skyWidth, skyHeight);
  drawWind(skyWidth, skyHeight);
  drawClouds(skyWidth, skyHeight);
  drawBirds(skyWidth, skyHeight);
  drawWindPetals(skyWidth, skyHeight);
  updateAirChip();
}

// Анимационен цикъл: всеки кадър доближаваме clean до targetClean.
// Така преходът е плавен дори при рязък скрол.
function animateSky() {
  clean = lerp(clean, targetClean, 0.05);
  dayTime = lerp(dayTime, targetTime, 0.05);
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
dayTime = targetTime;

// При изключени анимации рисуваме само при скрол и промяна на размера
if (reduceMotion) drawSky();
else animateSky();
