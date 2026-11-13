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
  const caption = button.closest("figure").querySelector("figcaption").textContent;

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
