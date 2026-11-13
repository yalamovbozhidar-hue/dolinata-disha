/* =========================================
   НАВИГАЦИЯ
   Лепкаво меню, бургер за телефон, активна секция
   и прогрес бар за прочетеното.
   ========================================= */
const header = document.querySelector(".header");
const navToggle = document.querySelector(".nav__toggle");
const navMenu = document.querySelector(".nav__menu");
const navLinks = document.querySelectorAll(".nav__link");
const readProgress = document.getElementById("read-progress");

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

// ----- Маркираме активния линк според секцията на екрана -----
const navSections = document.querySelectorAll("main section[id]");
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${entry.target.id}`;
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
