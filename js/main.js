/* =========================================
   Долината диша – логика на сайта
   Без външни библиотеки, чист JavaScript.
   ========================================= */

// Помощна функция: ограничава число между min и max
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Помощна функция: смесва два RGB цвята (t от 0 до 1)
function mixColor(a, b, t) {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

// Дали потребителят е изключил анимациите в системата си
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =========================================
   1. НАВИГАЦИЯ
   ========================================= */
const header = document.querySelector(".header");
const navToggle = document.querySelector(".nav__toggle");
const navMenu = document.querySelector(".nav__menu");
const navLinks = document.querySelectorAll(".nav__link");

// Фон на менюто, след като скролнем надолу
window.addEventListener("scroll", () => {
  header.classList.toggle("is-scrolled", window.scrollY > 40);
});

// Бургер меню на телефон
navToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", isOpen);
  navToggle.setAttribute("aria-label", isOpen ? "Затвори менюто" : "Отвори менюто");
});

// Затваряме менюто при избор на линк
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

// Маркираме активния линк според секцията на екрана
const sections = document.querySelectorAll("main section[id]");
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
sections.forEach((section) => sectionObserver.observe(section));

/* =========================================
   2. ПОЯВЯВАНЕ ПРИ СКРОЛ + БРОЯЧИ
   ========================================= */
function animateCounter(el) {
  const target = Number(el.dataset.target);
  const duration = 1500;
  const start = performance.now();

  function step(now) {
    const progress = clamp((now - start) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // плавно забавяне в края
    el.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      entry.target.querySelectorAll(".counter").forEach(animateCounter);
      revealObserver.unobserve(entry.target); // анимираме само веднъж
    });
  },
  { threshold: 0.2 }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* =========================================
   3. СМОГ В НАЧАЛНИЯ ЕКРАН
   Полупрозрачни „облачета“, които бавно се носят.
   ========================================= */
const heroCanvas = document.getElementById("hero-smog");
const heroCtx = heroCanvas.getContext("2d");
let heroClouds = [];

function resizeHero() {
  heroCanvas.width = heroCanvas.offsetWidth;
  heroCanvas.height = heroCanvas.offsetHeight;

  // Създаваме облачетата наново според размера на екрана
  const count = Math.round(heroCanvas.width / 40);
  heroClouds = Array.from({ length: count }, () => ({
    x: Math.random() * heroCanvas.width,
    y: heroCanvas.height * (0.35 + Math.random() * 0.5),
    radius: 60 + Math.random() * 140,
    speed: 0.15 + Math.random() * 0.35,
    alpha: 0.05 + Math.random() * 0.08,
  }));
}

function drawHero() {
  heroCtx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);

  heroClouds.forEach((cloud) => {
    const gradient = heroCtx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.radius);
    gradient.addColorStop(0, `rgba(150, 140, 120, ${cloud.alpha})`);
    gradient.addColorStop(1, "rgba(150, 140, 120, 0)");
    heroCtx.fillStyle = gradient;
    heroCtx.beginPath();
    heroCtx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
    heroCtx.fill();

    // Движение надясно; когато излезе от екрана, се връща отляво
    cloud.x += cloud.speed;
    if (cloud.x - cloud.radius > heroCanvas.width) cloud.x = -cloud.radius;
  });

  if (!reduceMotion) requestAnimationFrame(drawHero);
}

window.addEventListener("resize", resizeHero);
resizeHero();
drawHero();

/* =========================================
   4. СИМУЛАТОР „ИЗЧИСТИ НЕБЕТО“
   ========================================= */
const simCanvas = document.getElementById("sim-canvas");
const simCtx = simCanvas.getContext("2d");
const slider = document.getElementById("clean-heating");
const sliderValue = document.getElementById("clean-heating-value");
const checkboxes = document.querySelectorAll(".sim__options input");
const statusText = document.getElementById("sim-status");
const meterBar = document.getElementById("meter-bar");

// pollution: 1 = много замърсено, 0 = напълно чисто
let pollution = 0.9;        // текуща стойност (плавно се мени)
let targetPollution = 0.9;  // към коя стойност отиваме
let smokeParticles = [];

// Цветове на небето: [мръсно, чисто]
const SKY_TOP = [[70, 66, 60], [74, 144, 226]];
const SKY_BOTTOM = [[140, 128, 108], [190, 225, 250]];

// Комини на къщите (в проценти от ширината)
const chimneys = [0.12, 0.22, 0.31, 0.43, 0.52, 0.61, 0.72, 0.83, 0.91];

function resizeSim() {
  simCanvas.width = simCanvas.offsetWidth;
  simCanvas.height = simCanvas.offsetHeight;
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

// Добавя нови частици дим от комините според замърсяването
function spawnSmoke(w, h) {
  chimneys.forEach((cx) => {
    if (Math.random() < pollution * 0.35) {
      smokeParticles.push({
        x: w * cx + w * 0.02,
        y: h * 0.82 - h * 0.17,
        radius: 4 + Math.random() * 6,
        vx: 0.2 + Math.random() * 0.4,
        vy: -0.3 - Math.random() * 0.4,
        life: 1,
      });
    }
  });
}

function drawSim() {
  const w = simCanvas.width;
  const h = simCanvas.height;

  // Плавно доближаване до целевата стойност
  pollution += (targetPollution - pollution) * 0.04;

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
  spawnSmoke(w, h);
  smokeParticles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.radius += 0.15;
    p.life -= 0.006;
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

  requestAnimationFrame(drawSim);
}

slider.addEventListener("input", calculatePollution);
checkboxes.forEach((box) => box.addEventListener("change", calculatePollution));
window.addEventListener("resize", resizeSim);

resizeSim();
calculatePollution();
pollution = targetPollution; // започваме директно от началното състояние
drawSim();

/* =========================================
   5. ОБЕЩАНИЯ
   Запазват се в браузъра (localStorage), за да
   останат отметнати и след презареждане.
   ========================================= */
const pledgeBoxes = document.querySelectorAll("#pledge input");
const pledgeFill = document.getElementById("pledge-fill");
const pledgeText = document.getElementById("pledge-text");
const STORAGE_KEY = "dolinata-pledges";

function loadPledges() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    pledgeBoxes.forEach((box, i) => { box.checked = Boolean(saved[i]); });
  } catch (error) {
    // Ако браузърът не позволява localStorage, просто продължаваме
  }
}

function updatePledges() {
  const states = Array.from(pledgeBoxes, (box) => box.checked);
  const done = states.filter(Boolean).length;
  const total = pledgeBoxes.length;

  pledgeFill.style.width = `${(done / total) * 100}%`;
  pledgeText.textContent = done === total
    ? "Супер! Изпълни всички 5 обещания 🌿"
    : `${done} от ${total} обещания`;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  } catch (error) {
    // Запазването не е задължително
  }
}

pledgeBoxes.forEach((box) => box.addEventListener("change", updatePledges));
loadPledges();
updatePledges();
