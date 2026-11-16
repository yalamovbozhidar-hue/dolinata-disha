/* =========================================
   НАВИГАЦИЯ
   Плаващо меню-„хапче“, меню на цял екран за телефон,
   активна секция с плъзгащо се „хапче“ и прогрес бар.
   Точките вдясно (само на широк екран) отбелязват текущата секция.
   ========================================= */
const header = document.querySelector(".header");
const navToggle = document.querySelector(".nav__toggle");
const navMenu = document.querySelector(".nav__menu");
const navLinks = document.querySelectorAll(".nav__link");
const readProgress = document.getElementById("read-progress");
const navDots = document.querySelectorAll(".dots__link");

// ----- Фон на менюто и прогрес бар при скрол -----
function updateHeaderOnScroll() {
  header.classList.toggle("is-scrolled", window.scrollY > 40);

  // Колко от страницата е прочетено: от 0 до 1
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  readProgress.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
}

window.addEventListener("scroll", updateHeaderOnScroll, { passive: true });
window.addEventListener("resize", updateHeaderOnScroll);
updateHeaderOnScroll();

// ----- Бургер меню на телефон -----
function setMenuOpen(isOpen) {
  navMenu.classList.toggle("is-open", isOpen);
  // Докато менюто на цял екран е отворено, страницата отдолу не се скролва
  document.documentElement.classList.toggle("menu-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Затвори менюто" : "Отвори менюто");
}

navToggle.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  setMenuOpen(!isOpen);
  // При отваряне местим фокуса на първия линк – удобно за клавиатура
  if (!isOpen) navLinks[0].focus();
});

// Затваряме менюто при избор на линк
navLinks.forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

// Esc затваря менюто и връща фокуса на бутона
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navMenu.classList.contains("is-open")) {
    setMenuOpen(false);
    navToggle.focus();
  }
});

// Клик извън менюто също го затваря
document.addEventListener("click", (event) => {
  if (navMenu.classList.contains("is-open") && !event.target.closest(".nav")) {
    setMenuOpen(false);
  }
});

// ----- „Хапчето“ под активния линк (само на компютър) -----
// Плъзга се към линка под мишката и се връща на активния, когато мишката излезе.
const wideScreen = window.matchMedia("(min-width: 1001px)");
let activeLink = null;

function movePill(link) {
  if (!wideScreen.matches || !link || link.classList.contains("nav__link--cta")) {
    navMenu.style.setProperty("--pill-o", "0");
    return;
  }
  navMenu.style.setProperty("--pill-x", `${link.offsetLeft}px`);
  navMenu.style.setProperty("--pill-w", `${link.offsetWidth}px`);
  navMenu.style.setProperty("--pill-o", "1");
}

navLinks.forEach((link) => link.addEventListener("pointerenter", () => movePill(link)));
navMenu.addEventListener("pointerleave", () => movePill(activeLink));
window.addEventListener("resize", () => movePill(activeLink));

// Секциите без собствен линк в менюто отбелязват най-близкия
const SECTION_LINK = { inversion: "problem", map: "problem", industry: "fire" };

// ----- Маркираме активния линк според секцията на екрана -----
const navSections = document.querySelectorAll("main section[id]");
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      // Точките вдясно: всяка секция си има своя
      navDots.forEach((dot) => {
        const isCurrent = dot.getAttribute("href") === `#${entry.target.id}`;
        dot.classList.toggle("is-active", isCurrent);
        if (isCurrent) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });

      const id = SECTION_LINK[entry.target.id] || entry.target.id;
      activeLink = Array.from(navLinks).find((link) => link.getAttribute("href") === `#${id}`) || null;
      movePill(activeLink);
      navLinks.forEach((link) => {
        const isActive = link === activeLink;
        link.classList.toggle("is-active", isActive);
        // aria-current казва на екранния четец коя е текущата секция
        if (isActive) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
navSections.forEach((section) => sectionObserver.observe(section));

// ----- Точно попадение при скок към секция -----
// На телефон секциите далеч от екрана имат приблизителна височина, докато не се
// покажат (content-visibility в CSS). Затова при дълъг скок браузърът може да
// спре малко преди или след секцията. Щом превъртането свърши, проверяваме
// и при нужда донагласяме (до 3 пъти).
function settleOn(target, triesLeft = 3) {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    window.removeEventListener("scrollend", finish);
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchstart", cancel);
    clearTimeout(timer);
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const miss = target.getBoundingClientRect().top - padding;
    if (Math.abs(miss) > 4 && triesLeft > 0) {
      target.scrollIntoView();
      settleOn(target, triesLeft - 1);
    }
  };
  // Ако човекът сам започне да скролва – не му пречим
  const cancel = () => { done = true; window.removeEventListener("scrollend", finish); clearTimeout(timer); };
  window.addEventListener("scrollend", finish, { once: true });
  window.addEventListener("wheel", cancel, { once: true, passive: true });
  window.addEventListener("touchstart", cancel, { once: true, passive: true });
  const timer = setTimeout(finish, 2500); // за браузъри без събитието scrollend
}

document.addEventListener("click", (event) => {
  const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
  const target = link && link.hash.length > 1 ? document.getElementById(link.hash.slice(1)) : null;
  if (target) settleOn(target);
});
