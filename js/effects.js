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
    else el.classList.add("is-done"); // числото „подскача“, щом стигне целта (CSS)
  }
  requestAnimationFrame(step);
}

// Иконите в картите се „рисуват“ линия по линия.
// pathLength = 1 казва, че всяка линия е дълга 1 – тогава CSS
// може да я крие и показва с stroke-dashoffset от 1 до 0.
// Пунктирните линии (с stroke-dasharray) оставяме както са.
document.querySelectorAll(".card__icon path:not([stroke-dasharray])").forEach((path) => {
  path.setAttribute("pathLength", "1");
  path.classList.add("draw");
});

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

/* -----------------------------------------
   Снимките се показват плавно, щом се заредят
   (CSS ги държи невидими дотогава).
   ----------------------------------------- */
document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
  const showImage = () => img.classList.add("is-loaded");

  // naturalWidth > 0 значи, че снимката вече е заредена (напр. от кеша)
  if (img.complete && img.naturalWidth > 0) showImage();
  else {
    img.addEventListener("load", showImage, { once: true });
    img.addEventListener("error", showImage, { once: true }); // да не остане празно място
  }
});

/* -----------------------------------------
   PARALLAX
   Текстът в началото се отдалечава и избледнява,
   а снимката на долината се движи по-бавно от страницата.
   Изчисляваме само веднъж на кадър (requestAnimationFrame).
   ----------------------------------------- */
const heroContent = document.querySelector(".hero__content");
const parallaxPhotos = document.querySelectorAll(".statement__bg");
let parallaxQueued = false;

function updateParallax() {
  parallaxQueued = false;
  const viewHeight = window.innerHeight;
  const scrolled = window.scrollY;

  // Началният текст: движи се по-бавно и избледнява, докато излезе от екрана
  if (scrolled < viewHeight) {
    heroContent.style.transform = `translateY(${scrolled * 0.35}px)`;
    heroContent.style.opacity = clamp(1 - scrolled / (viewHeight * 0.85), 0, 1);
  }

  // Снимката на долината: от +8% до -8%, докато секцията минава през екрана
  parallaxPhotos.forEach((photo) => {
    const rect = photo.parentElement.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > viewHeight) return; // извън екрана – не правим нищо
    const progress = (rect.top + rect.height / 2 - viewHeight / 2) / (viewHeight / 2 + rect.height / 2);
    photo.style.transform = `translateY(${progress * 8}%)`;
  });
}

if (!reduceMotion) {
  window.addEventListener("scroll", () => {
    if (parallaxQueued) return;
    parallaxQueued = true;
    requestAnimationFrame(updateParallax);
  }, { passive: true });
  updateParallax();
}

/* -----------------------------------------
   ЛЕНТАТА С ПРИЗИВИ
   Повтаряме текста веднъж: докато първото копие излиза
   отляво, второто вече е влязло отдясно – няма празно място.
   ----------------------------------------- */
document.querySelectorAll(".marquee__track").forEach((track) => {
  track.append(...Array.from(track.children, (item) => item.cloneNode(true)));
});
