/* =========================================
   КАК СТАВА ИНВЕРСИЯТА
   Рисунката стои на място (position: sticky в CSS),
   а текстовете минават покрай нея. Стъпката, която пресича
   една невидима линия на екрана, казва на рисунката
   какво да покаже (data-step), а CSS прави прехода.
   Трите бутона под рисунката показват докъде си и водят към стъпката.
   ========================================= */
const storySvg = document.getElementById("story-svg");
const storySteps = document.querySelectorAll(".story__step");
const storyDots = document.querySelectorAll(".story__dot");
const storySticky = document.querySelector(".story__sticky");
// На тесен екран рисунката е над текста, а не до него (същата граница като в CSS)
const storyNarrow = window.matchMedia("(max-width: 860px)");

function showStoryStep(step) {
  storySvg.dataset.step = step.dataset.step;
  storySteps.forEach((other) => other.classList.toggle("is-active", other === step));
  storyDots.forEach((dot) => dot.setAttribute("aria-pressed", String(dot.dataset.step === step.dataset.step)));
}

// Тънка линия през екрана: стъпката, която я пресича, е активна.
// На компютър линията е на 60% от височината. На телефон текстът е под
// рисунката, затова линията е по-ниско (78%) – рисунката се сменя, щом
// заглавието на следващата стъпка се покаже отдолу.
let storyObserver = null;

function watchStorySteps() {
  if (storyObserver) storyObserver.disconnect();
  storyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) showStoryStep(entry.target);
      });
    },
    { rootMargin: storyNarrow.matches ? "-78% 0px -21% 0px" : "-60% 0px -39% 0px" }
  );
  storySteps.forEach((step) => storyObserver.observe(step));
}

watchStorySteps();
storyNarrow.addEventListener("change", watchStorySteps); // при завъртане на телефона
showStoryStep(storySteps[0]);

// Бутон → скролваме до неговата стъпка.
// На компютър стъпката идва в средата на екрана, на телефон – точно под рисунката.
storyDots.forEach((dot) => {
  dot.addEventListener("click", () => {
    const step = document.querySelector(`.story__step[data-step="${dot.dataset.step}"]`);
    const behavior = reduceMotion ? "auto" : "smooth";
    if (storyNarrow.matches) {
      const top = step.getBoundingClientRect().top + window.scrollY - storySticky.offsetHeight + 16;
      window.scrollTo({ top, behavior });
    } else {
      step.scrollIntoView({ block: "center", behavior });
    }
  });
});
