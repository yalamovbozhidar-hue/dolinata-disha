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

/* -----------------------------------------
   Заглавия, които се появяват дума по дума.
   Разделяме текста на <span class="word">, като всяка
   дума получава пореден номер (--i) за закъснението в CSS.
   ----------------------------------------- */
function splitIntoWords(element) {
  let index = 0;

  // Обхождаме и вложените елементи (напр. <span> и <br> в заглавието)
  function walk(node) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
        return;
      }
      if (child.nodeType !== Node.TEXT_NODE || !child.textContent.trim()) return;

      // Делим по интервалите, но ги запазваме, за да не се слеят думите
      const fragment = document.createDocumentFragment();
      child.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.appendChild(document.createTextNode(part));
        } else {
          const word = document.createElement("span");
          word.className = "word";
          word.style.setProperty("--i", index++);
          word.textContent = part;
          fragment.appendChild(word);
        }
      });
      child.replaceWith(fragment);
    });
  }

  walk(element);
}

// При изключени анимации не разделяме – текстът си стои както е
if (!reduceMotion) {
  document.querySelectorAll(".split-words").forEach((title) => {
    splitIntoWords(title);
    revealObserver.observe(title);
  });
}

// Панелите на секциите също се появяват плавно при скрол.
// Отделен наблюдател с праг 0, защото на телефон панелът
// може да е по-висок от целия екран.
const panelObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      panelObserver.unobserve(entry.target);
    });
  },
  { rootMargin: "0px 0px -12% 0px" }
);
document.querySelectorAll(".section > .container").forEach((panel) => {
  panelObserver.observe(panel);
});
