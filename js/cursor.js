/* =========================================
   СВЕТЕЩ КУРСОР
   Меко светещо кръгче следва мишката малко по-бавно (lerp)
   и се уголемява над бутони и линкове. Обикновеният курсор остава.
   Само за мишка и само ако анимациите са включени.
   ========================================= */
if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduceMotion) {
  const cursorGlow = document.createElement("div");
  cursorGlow.className = "cursor-glow";
  cursorGlow.setAttribute("aria-hidden", "true");
  cursorGlow.innerHTML = "<span></span>";
  document.body.appendChild(cursorGlow);

  const cursorTarget = { x: -100, y: -100 }; // къде е мишката
  const cursorPos = { x: -100, y: -100 };    // къде е кръгчето
  let cursorMoving = false;

  // Кръгчето гони мишката; спираме цикъла, щом я стигне – пести батерия
  function followCursor() {
    cursorPos.x = lerp(cursorPos.x, cursorTarget.x, 0.22);
    cursorPos.y = lerp(cursorPos.y, cursorTarget.y, 0.22);
    cursorGlow.style.transform = `translate(${cursorPos.x}px, ${cursorPos.y}px)`;
    if (Math.abs(cursorPos.x - cursorTarget.x) + Math.abs(cursorPos.y - cursorTarget.y) > 0.5) {
      requestAnimationFrame(followCursor);
    } else {
      cursorMoving = false;
    }
  }

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    cursorTarget.x = event.clientX;
    cursorTarget.y = event.clientY;
    cursorGlow.classList.add("is-visible");
    // Над нещо, което може да се натисне – по-голямо кръгче
    const clickable = event.target instanceof Element && event.target.closest("a, button, label, input, .game__item");
    cursorGlow.classList.toggle("is-big", Boolean(clickable));
    if (!cursorMoving) {
      cursorMoving = true;
      requestAnimationFrame(followCursor);
    }
  }, { passive: true });

  // Мишката излезе от прозореца – кръгчето изчезва
  document.documentElement.addEventListener("pointerleave", () => cursorGlow.classList.remove("is-visible"));
}
