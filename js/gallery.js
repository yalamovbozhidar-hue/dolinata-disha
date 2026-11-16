/* =========================================
   ГАЛЕРИЯ
   Натиснатата снимка се отваря в цял екран в <dialog>.
   Първо показваме вече заредената снимка, а голямата
   версия (до 4K) зареждаме отделно и я сменяме, щом е готова.
   В големия изглед снимките се сменят със стрелките или с пръст.
   ========================================= */
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxCaption = document.getElementById("lightbox-caption");
const lightboxCount = document.getElementById("lightbox-count");
const lightboxClose = document.getElementById("lightbox-close");
const lightboxPrev = document.getElementById("lightbox-prev");
const lightboxNext = document.getElementById("lightbox-next");
const photoButtons = Array.from(document.querySelectorAll(".gallery__open"));
let requestedPhoto = ""; // коя голяма снимка чакаме в момента
let currentPhoto = 0;    // номерът на снимката, която е отворена
let openedPhoto = 0;     // с коя снимка е отворен изгледът

// Избира размер според екрана: 4K само ако екранът наистина е толкова голям
function bestPhotoSize() {
  const screenPixels = window.innerWidth * (window.devicePixelRatio || 1);
  return screenPixels > 1920 ? 3840 : 1920;
}

// Показва снимка номер index в големия изглед (номерата се въртят в кръг)
function showPhoto(index) {
  currentPhoto = (index + photoButtons.length) % photoButtons.length;
  const button = photoButtons[currentPhoto];
  const thumb = button.querySelector("img");
  // Надписът без номера отпред („01“ е в отделен <span>, текстът е последният възел)
  const caption = button.closest("figure").querySelector("figcaption").lastChild.textContent.trim();

  // Веднага показваме снимката от лентата. Ако още не е заредена там
  // (браузърът зарежда само близките до екрана), взимаме малката версия.
  const loaded = thumb.complete && thumb.naturalWidth > 0;
  lightboxImg.src = loaded ? (thumb.currentSrc || thumb.src) : `img/${button.dataset.photo}-960.jpg`;
  lightboxImg.alt = thumb.alt;
  lightboxCaption.textContent = caption;
  lightboxCount.textContent = `${currentPhoto + 1} / ${photoButtons.length}`;

  // После зареждаме по-голямата версия
  requestedPhoto = `img/${button.dataset.photo}-${bestPhotoSize()}.jpg`;
  const bigPhoto = new Image();
  bigPhoto.addEventListener("load", () => {
    // Сменяме само ако прозорецът е отворен и още чакаме точно тази снимка
    if (lightbox.open && bigPhoto.src.endsWith(requestedPhoto)) lightboxImg.src = bigPhoto.src;
  });
  bigPhoto.src = requestedPhoto;
}

photoButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    openedPhoto = index;
    showPhoto(index);
    lightbox.showModal(); // showModal пази фокуса вътре и се затваря с Esc
  });
});

lightboxClose.addEventListener("click", () => lightbox.close());
lightboxPrev.addEventListener("click", () => showPhoto(currentPhoto - 1));
lightboxNext.addEventListener("click", () => showPhoto(currentPhoto + 1));

// Стрелките ← → на клавиатурата сменят снимката
lightbox.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") showPhoto(currentPhoto - 1);
  else if (event.key === "ArrowRight") showPhoto(currentPhoto + 1);
});

// Клик извън снимката (върху тъмния фон) също затваря
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});

// На телефон: плъзгане с пръст наляво/надясно сменя снимката
let swipeStartX = null;
lightbox.addEventListener("pointerdown", (event) => {
  swipeStartX = event.pointerType === "touch" ? event.clientX : null;
});
lightbox.addEventListener("pointerup", (event) => {
  if (swipeStartX === null) return;
  const dx = event.clientX - swipeStartX;
  swipeStartX = null;
  if (Math.abs(dx) > 50) showPhoto(currentPhoto + (dx < 0 ? 1 : -1));
});
lightbox.addEventListener("pointercancel", () => { swipeStartX = null; });

// При затваряне лентата отива на снимката, която гледахме последно
lightbox.addEventListener("close", () => {
  if (currentPhoto === openedPhoto) return; // не сме сменяли – лентата си остава на място
  const slide = photoButtons[currentPhoto].closest(".strip__slide");
  stripTrack.scrollTo({ left: slide.offsetLeft - stripTrack.firstElementChild.offsetLeft, behavior: "auto" });
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

// Първото отбелязване чак когато лентата наближи екрана – иначе още при
// зареждането браузърът ще трябва да пресметне целия ѝ размер
new IntersectionObserver((entries, observer) => {
  if (!entries[0].isIntersecting) return;
  observer.disconnect();
  updateStrip();
}, { rootMargin: "300px 0px" }).observe(stripTrack);
