/* =========================================
   КАРТА НА ДОЛИНАТА
   Точките на картата са бутони. Избраната точка се
   отбелязва (aria-pressed), а описанието ѝ се показва до картата.
   ========================================= */
const mapPins = document.querySelectorAll(".map-pin");
const mapInfoKind = document.getElementById("map-info-kind");
const mapInfoTitle = document.getElementById("map-info-title");
const mapInfoText = document.getElementById("map-info-text");

// Описанията на местата. Числа има само там, където имаме източник (пожарът).
const PLACES = {
  kazanlak: {
    kind: "Град",
    title: "Казанлък",
    text: "Градът е на дъното на котловината между двете планини. Зиме студеният въздух остава долу и димът от комините се събира над него.",
  },
  "shipka-peak": {
    kind: "Връх в Стара планина",
    title: "Връх Шипка",
    text: "Над Шипченския проход. Оттук се вижда цялата долина – а в зимните утрини и сивата ивица смог над града.",
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
  fire: {
    kind: "Август 2023 г.",
    title: "Пожарът между Казанлък и Мъглиж",
    text: "Обхвана 500 дка храсти и гори и заради него беше обявено частично бедствено положение. Мястото на картата е приблизително – между двата града.",
  },
};

function selectPlace(pin) {
  const place = PLACES[pin.dataset.place];
  mapPins.forEach((other) => other.setAttribute("aria-pressed", String(other === pin)));
  mapInfoKind.textContent = place.kind;
  mapInfoTitle.textContent = place.title;
  mapInfoText.textContent = place.text;
}

mapPins.forEach((pin) => {
  pin.addEventListener("click", () => selectPlace(pin));
});

// В началото е избран Казанлък
selectPlace(document.querySelector('.map-pin[data-place="kazanlak"]'));
