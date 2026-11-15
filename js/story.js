/* =========================================
   КАК СТАВА ИНВЕРСИЯТА
   Рисунката стои на място (position: sticky в CSS),
   а текстовете минават покрай нея. Стъпката, която е
   на около 60% от височината на екрана, казва на рисунката
   какво да покаже (data-step), а CSS прави прехода.
   ========================================= */
const storySvg = document.getElementById("story-svg");
const storySteps = document.querySelectorAll(".story__step");

function showStoryStep(step) {
  storySvg.dataset.step = step.dataset.step;
  storySteps.forEach((other) => other.classList.toggle("is-active", other === step));
}

const storyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) showStoryStep(entry.target);
    });
  },
  // Тънка линия на 60% от височината: стъпката, която я пресича, е активна
  { rootMargin: "-60% 0px -39% 0px" }
);
storySteps.forEach((step) => storyObserver.observe(step));
showStoryStep(storySteps[0]);
