/* =========================================
   3D КАРТИ И МАГНИТНИ БУТОНИ
   Картите се накланят към мишката, а ръбът им светва.
   Бутоните леко се притеглят към мишката, когато е над тях.
   Само за мишка (на телефон няма „hover“) и само ако анимациите са включени.
   ========================================= */
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const MAX_TILT = 7; // най-големият наклон в градуси

// Следи мишката върху елемента и вика onMove най-много веднъж на кадър
function trackPointer(element, onMove) {
  let lastEvent = null;

  element.addEventListener("pointermove", (event) => {
    if (!lastEvent) {
      requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        onMove(lastEvent.clientX - rect.left, lastEvent.clientY - rect.top, rect);
        lastEvent = null;
      });
    }
    lastEvent = event;
  });
}

if (canHover && !reduceMotion) {
  // Картите: наклон по двете оси според мястото на мишката
  document.querySelectorAll(".card, .threat").forEach((card) => {
    card.classList.add("tilt");

    trackPointer(card, (x, y, rect) => {
      const dx = x / rect.width - 0.5;   // от -0.5 (ляво) до 0.5 (дясно)
      const dy = y / rect.height - 0.5;  // от -0.5 (горе) до 0.5 (долу)
      card.style.setProperty("--mx", `${x}px`);
      card.style.setProperty("--my", `${y}px`);
      card.style.transform =
        `perspective(900px) rotateX(${(-dy * MAX_TILT).toFixed(2)}deg) ` +
        `rotateY(${(dx * MAX_TILT).toFixed(2)}deg) translateY(-6px)`;
    });

    // Мишката излезе – картата плавно се изправя (transition в CSS)
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });

  // Магнитни бутони: изминават част от разстоянието до мишката (най-много 10 px).
  // Центърът се запомня при влизане на мишката, за да не „бяга“, докато бутонът се мести.
  const MAGNET = 0.3;
  document.querySelectorAll(".btn, .nav__link--cta, .strip__btn, .nav__sound, .action-btn").forEach((button) => {
    let center = null;
    button.addEventListener("pointerenter", () => {
      const rect = button.getBoundingClientRect();
      center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
    button.addEventListener("pointermove", (event) => {
      if (!center) return;
      const dx = clamp((event.clientX - center.x) * MAGNET, -10, 10);
      const dy = clamp((event.clientY - center.y) * MAGNET, -10, 10);
      button.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
    });
    button.addEventListener("pointerleave", () => {
      center = null;
      button.style.translate = "";
    });
  });
}
