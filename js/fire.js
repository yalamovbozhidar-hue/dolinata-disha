/* =========================================
   ОГЪН
   1) Искри, които се издигат над пожара (canvas).
   2) 500 дка, показани като 70 футболни игрища, които „изгарят“.
   ========================================= */

/* -----------------------------------------
   ИСКРИ
   Една светеща точка се рисува веднъж в малък скрит canvas,
   а после само се копира – много по-бързо от градиент всеки кадър.
   ----------------------------------------- */
const emberSprite = document.createElement("canvas");
emberSprite.width = emberSprite.height = 32;
const emberSpriteCtx = emberSprite.getContext("2d");
const emberGlow = emberSpriteCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
emberGlow.addColorStop(0, "rgba(255, 244, 214, 1)");    // бяло-жълто в центъра
emberGlow.addColorStop(0.25, "rgba(255, 170, 70, 0.9)"); // оранжево
emberGlow.addColorStop(1, "rgba(255, 70, 20, 0)");       // червено, което изчезва
emberSpriteCtx.fillStyle = emberGlow;
emberSpriteCtx.fillRect(0, 0, 32, 32);

function startEmbers(canvas) {
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let sparks = [];
  let visible = false;
  let looping = false;

  // Нова искра: в началото – навсякъде, после – отдолу
  function newSpark(anywhere) {
    return {
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : height + 10,
      speed: 0.4 + Math.random() * 1.3,
      size: 4 + Math.random() * 10,
      sway: Math.random() * Math.PI * 2,   // искрите леко се люлеят наляво-надясно
      life: anywhere ? Math.random() : 1,
      fade: 0.002 + Math.random() * 0.004,
    };
  }

  function resize() {
    width = canvas.width = canvas.clientWidth;
    height = canvas.height = canvas.clientHeight;
    // Колкото по-голям е canvas-ът, толкова повече искри (но не прекалено)
    const count = Math.round(clamp((width * height) / 9000, 20, 90));
    sparks = Array.from({ length: count }, () => newSpark(true));
  }

  function frame() {
    if (!visible) {
      looping = false; // извън екрана – спираме, за да пестим батерия
      return;
    }
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter"; // припокритите искри светят по-силно

    sparks.forEach((spark, i) => {
      spark.y -= spark.speed;
      spark.sway += 0.03;
      spark.x += Math.sin(spark.sway) * 0.5;
      spark.life -= spark.fade;
      if (spark.life <= 0 || spark.y < -20) {
        sparks[i] = newSpark(false);
        return;
      }
      ctx.globalAlpha = spark.life * (0.7 + Math.random() * 0.3); // трептене
      ctx.drawImage(emberSprite, spark.x - spark.size / 2, spark.y - spark.size / 2, spark.size, spark.size);
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  // Анимираме само докато canvas-ът се вижда
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible || looping) return;
    if (!width) resize();
    looping = true;
    requestAnimationFrame(frame);
  }).observe(canvas);

  window.addEventListener("resize", () => {
    if (width) resize();
  });
}

// При изключени анимации остава само оранжевото сияние от CSS
if (!reduceMotion) document.querySelectorAll(".embers").forEach(startEmbers);

/* -----------------------------------------
   70 ФУТБОЛНИ ИГРИЩА
   Игрище 105 × 68 м = 7 140 м² = 7,14 дка.
   500 дка : 7,14 дка ≈ 70 игрища.
   Огънят тръгва от едно игрище и се разпространява към съседните.
   ----------------------------------------- */
const burnGrid = document.getElementById("burn-grid");
const PITCH_COUNT = 70;
const PITCH_COLUMNS = 14;    // 14 × 5 = 70
const FIRE_START = { col: 2, row: 2 };

for (let i = 0; i < PITCH_COUNT; i++) {
  const col = i % PITCH_COLUMNS;
  const row = Math.floor(i / PITCH_COLUMNS);
  // Колкото по-далеч от началото на пожара, толкова по-късно пламва
  const distance = Math.hypot(col - FIRE_START.col, (row - FIRE_START.row) * 1.5);
  const pitch = document.createElement("span");
  pitch.className = "burn__pitch";
  pitch.style.setProperty("--delay", `${Math.round(distance * 120 + Math.random() * 180)}ms`);
  burnGrid.appendChild(pitch);
}

new IntersectionObserver(([entry], observer) => {
  if (!entry.isIntersecting) return;
  burnGrid.classList.add("is-burning");
  observer.disconnect(); // гори само веднъж
}, { threshold: 0.6 }).observe(burnGrid);
