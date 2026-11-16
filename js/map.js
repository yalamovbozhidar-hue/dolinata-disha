/* =========================================
   КАРТА НА ДОЛИНАТА
   Точките на картата са бутони. Избраната точка се
   отбелязва (aria-pressed), а описанието ѝ се показва до картата.
   Под картата има същите места като списък – удобен за пръст.
   ========================================= */
const mapPins = document.querySelectorAll(".map-pin");
const mapChips = document.querySelectorAll(".map-chip");
const mapInfo = document.getElementById("map-info");
const mapInfoKind = document.getElementById("map-info-kind");
const mapInfoTitle = document.getElementById("map-info-title");
const mapInfoText = document.getElementById("map-info-text");
const mapInfoLink = document.getElementById("map-info-link");

// Описанията на местата. Числа има само там, където имаме източник (пожарът).
// link = секцията от сайта, в която има повече за това място.
const PLACES = {
  kazanlak: {
    kind: "Град",
    title: "Казанлък",
    text: "Градът е на дъното на котловината между двете планини. Зиме студеният въздух остава долу и димът от комините се събира над него.",
    link: { href: "#inversion", text: "Как става инверсията" },
  },
  "shipka-peak": {
    kind: "Връх в Стара планина",
    title: "Връх Шипка",
    text: "Над Шипченския проход. Оттук се вижда цялата долина – а в зимните утрини и сивата ивица смог над града.",
    link: { href: "#gallery", text: "Снимки от върха" },
  },
  buzludzha: {
    kind: "Връх в Стара планина",
    title: "Бузлуджа",
    text: "Връх в Балкана северно от Казанлък. Планината пази долината от северните ветрове, но и не пуска мръсния въздух да излезе.",
  },
  koprinka: {
    kind: "Язовир на р. Тунджа",
    title: "Язовир „Копринка“",
    text: "Язовирът западно от Казанлък, по течението на река Тунджа. На голямата снимка по-горе го виждаш от връх Шипка.",
  },
  maglizh: {
    kind: "Град",
    title: "Мъглиж",
    text: "Град на изток от Казанлък в същата долина.",
  },
  kastamonu: {
    kind: "Завод за плочи от дървесина",
    title: "„Кастамону България“",
    text: "В с. Горно Сахране, община Павел баня – в западната част на долината. Около разширяването на завода през 2023 г. имаше протести и спор за въздуха.",
    link: { href: "#industry", text: "Заводите в долината" },
  },
  fire: {
    kind: "Август 2023 г.",
    title: "Пожарът между Казанлък и Мъглиж",
    text: "Обхвана 500 дка храсти и гори и заради него беше обявено частично бедствено положение. Мястото на картата е приблизително – между двата града.",
    link: { href: "#fire", text: "Пожарите край Казанлък" },
  },
};

// animate = false при зареждането: тогава няма нужда от „примигване“
function selectPlace(name, animate = true) {
  const place = PLACES[name];
  mapPins.forEach((pin) => pin.setAttribute("aria-pressed", String(pin.dataset.place === name)));
  mapChips.forEach((chip) => chip.classList.toggle("is-active", chip.dataset.place === name));
  mapInfoKind.textContent = place.kind;
  mapInfoTitle.textContent = place.title;
  mapInfoText.textContent = place.text;

  // Линкът към секцията се вижда само за местата, които имат такава
  mapInfoLink.hidden = !place.link;
  if (place.link) {
    mapInfoLink.href = place.link.href;
    mapInfoLink.firstChild.textContent = `${place.link.text} `;
  }

  // Кратко „примигване“ на описанието, за да се види, че се е сменило (CSS анимация)
  if (!animate) return;
  mapInfo.classList.remove("is-changed");
  void mapInfo.offsetWidth; // рестартира анимацията
  mapInfo.classList.add("is-changed");
}

[...mapPins, ...mapChips].forEach((button) => {
  button.addEventListener("click", () => selectPlace(button.dataset.place));
});

// В началото е избран Казанлък
selectPlace("kazanlak", false);
