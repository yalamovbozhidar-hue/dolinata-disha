/* =========================================
   СМОГ В НАЧАЛНИЯ ЕКРАН
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
