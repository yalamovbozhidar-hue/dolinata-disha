/* =========================================
   Долината диша – общи помощни функции
   Зарежда се първи, защото останалите файлове ги ползват.
   ========================================= */

// Ограничава число между min и max
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Линейна интерполация: връща стойност между a и b (t от 0 до 1)
const lerp = (a, b, t) => a + (b - a) * t;

// Смесва два RGB цвята, подадени като масиви [r, g, b] (t от 0 до 1)
function mixColor(a, b, t) {
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  return `rgb(${r}, ${g}, ${bl})`;
}

// Дали потребителят е изключил анимациите в системата си
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
