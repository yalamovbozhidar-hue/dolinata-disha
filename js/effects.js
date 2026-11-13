/* =========================================
   ЕФЕКТИ ПРИ СКРОЛ
   Плавно появяване на елементите и броячи.
   ========================================= */

// Брояч, който „върти“ числото от 0 до data-target
function animateCounter(el) {
  const target = Number(el.dataset.target);

  // Без анимации – показваме крайното число веднага
  if (reduceMotion) {
    el.textContent = target;
    return;
  }

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

// Когато елемент с клас .reveal влезе в екрана, му добавяме .is-visible
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
