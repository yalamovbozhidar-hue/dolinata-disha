/* =========================================
   ГАЛЕРИЯ
   Натиснатата снимка се отваря в цял екран в <dialog>.
   Първо показваме вече заредената снимка, а голямата
   версия (до 4K) зареждаме отделно и я сменяме, щом е готова.
   ========================================= */
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxCaption = document.getElementById("lightbox-caption");
const lightboxClose = document.getElementById("lightbox-close");
let requestedPhoto = ""; // коя голяма снимка чакаме в момента

// Избира размер според екрана: 4K само ако екранът наистина е толкова голям
function bestPhotoSize() {
  const screenPixels = window.innerWidth * (window.devicePixelRatio || 1);
  return screenPixels > 1920 ? 3840 : 1920;
}

function openPhoto(button) {
  const thumb = button.querySelector("img");
  // Надписът без номера отпред („01“ е в отделен <span>, текстът е последният възел)
  const caption = button.closest("figure").querySelector("figcaption").lastChild.textContent.trim();

  // Веднага показваме снимката, която вече е заредена в страницата
  lightboxImg.src = thumb.currentSrc || thumb.src;
  lightboxImg.alt = thumb.alt;
  lightboxCaption.textContent = caption;
  lightbox.showModal(); // showModal пази фокуса вътре и се затваря с Esc

  // После зареждаме по-голямата версия
  requestedPhoto = `img/${button.dataset.photo}-${bestPhotoSize()}.jpg`;
  const bigPhoto = new Image();
  bigPhoto.addEventListener("load", () => {
    // Сменяме само ако прозорецът е отворен и още чакаме точно тази снимка
    if (lightbox.open && bigPhoto.src.endsWith(requestedPhoto)) lightboxImg.src = bigPhoto.src;
  });
  bigPhoto.src = requestedPhoto;
}

document.querySelectorAll(".gallery__open").forEach((button) => {
  button.addEventListener("click", () => openPhoto(button));
});

lightboxClose.addEventListener("click", () => lightbox.close());

// Клик извън снимката (върху тъмния фон) също затваря
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});

/* -----------------------------------------
   ЛЕНТАТА
   Плъзгането с пръст и стрелките ← → работят от самия браузър
   (scroll-snap). Тук добавяме бутоните, лентата за напредък,
   влаченето с мишка и отбелязваме снимката, която е отпред.
   ----------------------------------------- */
const stripTrack = document.getElementById("strip-track");
const stripSlides = Array.from(stripTrack.children);
const stripProgress = document.getElementById("strip-progress");
const [stripPrev, stripNext] = document.querySelectorAll(".strip__btn");
let stripQueued = false;

// Една стъпка = ширината на снимка + разстоянието до следващата
const slideStep = () => stripSlides[1].offsetLeft - stripSlides[0].offsetLeft;
const stripMaxScroll = () => stripTrack.scrollWidth - stripTrack.clientWidth;

function updateStrip() {
  stripQueued = false;
  const maxScroll = stripMaxScroll();
  const atEnd = stripTrack.scrollLeft >= maxScroll - 2;
  // Последната снимка не може да застане най-вляво, затова в края тя е текущата
  const current = atEnd
    ? stripSlides.length - 1
    : Math.round(stripTrack.scrollLeft / slideStep());

  stripSlides.forEach((slide, i) => slide.classList.toggle("is-current", i === current));
  stripProgress.style.width = `${((current + 1) / stripSlides.length) * 100}%`;
  stripPrev.disabled = stripTrack.scrollLeft <= 2;
  stripNext.disabled = atEnd;
}

stripTrack.addEventListener("scroll", () => {
  if (stripQueued) return;
  stripQueued = true;
  requestAnimationFrame(updateStrip);
}, { passive: true });
window.addEventListener("resize", updateStrip);

// Бутоните ← → местят с една снимка
[stripPrev, stripNext].forEach((button) => {
  button.addEventListener("click", () => {
    stripTrack.scrollBy({ left: Number(button.dataset.dir) * slideStep(), behavior: reduceMotion ? "auto" : "smooth" });
  });
});

// Влачене с мишка. Започва чак след 6 px движение,
// за да може обикновеното натискане да отваря снимката.
let dragStart = null;   // { x, scroll } при натискане на бутона на мишката
let wasDragged = false;

stripTrack.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "mouse" || event.button !== 0) return;
  dragStart = { x: event.clientX, scroll: stripTrack.scrollLeft };
  wasDragged = false;
});

stripTrack.addEventListener("pointermove", (event) => {
  if (!dragStart) return;
  const dx = event.clientX - dragStart.x;
  if (!wasDragged && Math.abs(dx) < 6) return;
  if (!wasDragged) {
    wasDragged = true;
    stripTrack.classList.add("is-dragging");
    stripTrack.setPointerCapture(event.pointerId);
  }
  stripTrack.scrollLeft = dragStart.scroll - dx;
});

function endStripDrag() {
  if (!dragStart) return;
  dragStart = null;
  if (!wasDragged) return;
  stripTrack.classList.remove("is-dragging");
  // Довършваме до най-близката снимка
  const nearest = Math.round(stripTrack.scrollLeft / slideStep());
  stripTrack.scrollTo({ left: Math.min(nearest * slideStep(), stripMaxScroll()), behavior: "smooth" });
}

stripTrack.addEventListener("pointerup", endStripDrag);
stripTrack.addEventListener("pointercancel", endStripDrag);

// След влачене пускането на мишката не бива да отваря снимката
stripTrack.addEventListener("click", (event) => {
  if (!wasDragged) return;
  event.stopPropagation();
  wasDragged = false;
}, true);

updateStrip();
