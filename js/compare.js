/* =========================================
   СРАВНЕНИЕ „ЗИМЕН СМОГ / ЧИСТ ВЪЗДУХ“
   Две еднакви снимки една върху друга. Горната е със
   „смог“ (CSS филтри) и се изрязва до позицията на
   плъзгача. Плъзгачът е обикновен <input type="range">,
   затова работи с мишка, пръст и стрелките на клавиатурата.
   ========================================= */
const compareFrame = document.getElementById("compare");
const compareRange = document.getElementById("compare-range");
let compareTouched = false; // дали потребителят вече е мръднал плъзгача

// Позицията на плъзгача (0–100) става CSS променлива --pos
function setComparePosition(percent) {
  compareFrame.style.setProperty("--pos", `${percent}%`);
}

compareRange.addEventListener("input", () => {
  compareTouched = true;
  setComparePosition(compareRange.value);
});

// Подсказка: когато сравнението се появи, чертата веднъж
// „поклаща“ надясно и обратно – да се види, че може да се мести.
function hintCompare() {
  const start = performance.now();
  const duration = 1800;

  function step(now) {
    if (compareTouched) return; // потребителят го е хванал – спираме
    const t = clamp((now - start) / duration, 0, 1);
    const value = 50 + Math.sin(t * Math.PI) * 25; // 50 → 75 → 50
    compareRange.value = value;
    setComparePosition(value);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

setComparePosition(compareRange.value);

if (!reduceMotion) {
  const compareObserver = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    compareObserver.disconnect(); // само веднъж
    setTimeout(hintCompare, 600);
  }, { threshold: 0.6 });
  compareObserver.observe(compareFrame);
}
