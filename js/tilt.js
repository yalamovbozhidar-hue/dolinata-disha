/* =========================================
   3D КАРТИ И СВЕТЛИНА СЛЕД МИШКАТА
   Картите се накланят към мишката, а ръбът им светва.
   Върху панелите на секциите се движи меко петно светлина.
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
  // Панелите: петното светлина отива там, където е мишката
  document.querySelectorAll(".section > .container").forEach((panel) => {
    trackPointer(panel, (x, y) => {
      panel.style.setProperty("--mx", `${x}px`);
      panel.style.setProperty("--my", `${y}px`);
    });
  });

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
}
