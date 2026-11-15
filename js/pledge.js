/* =========================================
   ОБЕЩАНИЯ
   Запазват се в браузъра (localStorage), за да
   останат отметнати и след презареждане.
   С всяко обещание в розовото поле цъфтят още рози.
   ========================================= */
const pledgeBoxes = document.querySelectorAll("#pledge input");
const pledgeFill = document.getElementById("pledge-fill");
const pledgeText = document.getElementById("pledge-text");
const PLEDGE_STORAGE_KEY = "dolinata-pledges";

/* -----------------------------------------
   РОЗОВОТО ПОЛЕ
   По 6 рози за всяко обещание. Създаваме ги веднъж,
   а после само им слагаме/махаме класа .is-bloomed.
   ----------------------------------------- */
const roseField = document.getElementById("rose-field");
const roseFieldBox = document.getElementById("rose-field-box");
const ROSES_PER_PLEDGE = 6;
const SVG_NS = "http://www.w3.org/2000/svg";

// Създава една роза: стрък, две листа и цвят.
// Външната група я слага на мястото ѝ, вътрешната (.rose) расте с CSS.
function createRose(x, y, size) {
  const place = document.createElementNS(SVG_NS, "g");
  place.setAttribute("transform", `translate(${x} ${y}) scale(${size})`);
  place.innerHTML = `
    <g class="rose">
      <path class="rose__stem" d="M0 0 C3 -12 -3 -22 0 -34"/>
      <path class="rose__leaf" d="M0 -14 q9 -7 14 -1 q-7 5 -14 1 Z"/>
      <path class="rose__leaf" d="M0 -22 q-9 -6 -13 0 q6 4 13 0 Z"/>
      <g transform="translate(0 -38)">
        <circle class="rose__petal" r="8"/>
        <circle class="rose__petal rose__petal--inner" r="5" cx="1" cy="-1"/>
        <path class="rose__swirl" d="M-2 -1 a3 3 0 1 1 3 3"/>
      </g>
    </g>`;
  return place;
}

const roseCount = pledgeBoxes.length * ROSES_PER_PLEDGE;
const roseSpots = [];
for (let i = 0; i < roseCount; i++) {
  roseSpots.push({
    x: 20 + (i + 0.5) * (760 / roseCount) + (Math.random() - 0.5) * 16, // равномерно, с малко случайност
    y: 158 + Math.random() * 34,                                          // по-ниско = по-близо до нас
  });
}

// Рисуваме първо далечните (по-високо), после близките – да са отпред
const roses = roseSpots
  .slice()
  .sort((a, b) => a.y - b.y)
  .map((spot) => {
    const size = 0.75 + ((spot.y - 158) / 34) * 0.45; // близките рози са по-големи
    const place = createRose(spot.x, spot.y, size);
    roseField.appendChild(place);
    return place.firstElementChild;
  });

// Разбъркваме реда на цъфтене, за да не цъфтят само отляво надясно
const bloomOrder = roses.slice().sort(() => Math.random() - 0.5);

function bloomRoses(done) {
  bloomOrder.forEach((rose, i) => {
    const shouldBloom = i < done * ROSES_PER_PLEDGE;
    // Розите от едно обещание цъфтят една след друга (по 90 ms)
    rose.style.setProperty("--delay", `${(i % ROSES_PER_PLEDGE) * 90}ms`);
    rose.classList.toggle("is-bloomed", shouldBloom);
  });
  roseFieldBox.classList.toggle("is-full", done === pledgeBoxes.length);
}

/* -----------------------------------------
   ЛИСТЕНЦА
   Щом отметнеш и петото обещание, по целия екран
   за няколко секунди падат розови листенца.
   ----------------------------------------- */
const PETAL_COLORS = ["#f07aa0", "#d6457a", "#f59ac0", "#ffc2d6"];
const PETAL_DURATION = 6000; // ms; последната секунда избледняват

function rainPetals() {
  const canvas = document.createElement("canvas");
  canvas.className = "petals";
  canvas.setAttribute("aria-hidden", "true");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const petals = Array.from({ length: window.innerWidth < 720 ? 40 : 80 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.7,   // започват над екрана, на различна височина
    size: 6 + Math.random() * 8,
    speed: 1.2 + Math.random() * 1.8,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.08,
    sway: Math.random() * Math.PI * 2,
    color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
  }));

  // Едно листенце: две извивки, които се срещат в двата края
  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, -p.size);
    ctx.quadraticCurveTo(p.size, -p.size * 0.2, 0, p.size);
    ctx.quadraticCurveTo(-p.size, -p.size * 0.2, 0, -p.size);
    ctx.fill();
    ctx.restore();
  }

  const start = performance.now();
  function frame(now) {
    const fade = clamp((PETAL_DURATION - (now - start)) / 1000, 0, 1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = fade;
    petals.forEach((p) => {
      p.y += p.speed;
      p.sway += 0.02;
      p.x += Math.sin(p.sway) * 1.2;   // люлеят се като истински листенца
      p.angle += p.spin;
      drawPetal(p);
    });
    if (fade > 0) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}

/* -----------------------------------------
   Отметките
   ----------------------------------------- */
function loadPledges() {
  try {
    const saved = JSON.parse(localStorage.getItem(PLEDGE_STORAGE_KEY)) || [];
    pledgeBoxes.forEach((box, i) => { box.checked = Boolean(saved[i]); });
  } catch (error) {
    // Ако браузърът не позволява localStorage, просто продължаваме
  }
}

// byUser = true, когато човекът сам е сменил отметка (а не при зареждане)
function updatePledges(byUser) {
  const states = Array.from(pledgeBoxes, (box) => box.checked);
  const done = states.filter(Boolean).length;
  const total = pledgeBoxes.length;

  // Листенцата падат само в момента, в който стане 5 от 5
  const wasFull = roseFieldBox.classList.contains("is-full");
  if (byUser === true && done === total && !wasFull && !reduceMotion) rainPetals();

  pledgeFill.style.width = `${(done / total) * 100}%`;
  pledgeText.textContent = done === total
    ? "Долината цъфна! Изпълни всички 5 обещания 🌹"
    : `${done} от ${total} обещания`;
  bloomRoses(done);

  try {
    localStorage.setItem(PLEDGE_STORAGE_KEY, JSON.stringify(states));
  } catch (error) {
    // Запазването не е задължително
  }
}

pledgeBoxes.forEach((box) => box.addEventListener("change", () => updatePledges(true)));
loadPledges();
updatePledges();
