/* =========================================
   МИНИ ИГРА „СОРТИРАЙ ОТПАДЪЦИТЕ“
   Отпадъци падат отгоре. Играчът ги пуска в правилния
   контейнер с влачене (мишка/пръст), с натискане на
   контейнер или с клавиатурата.
   ========================================= */
const gameField = document.getElementById("game-field");
const gameOverlay = document.getElementById("game-overlay");
const gameOverlayTitle = document.getElementById("game-overlay-title");
const gameOverlayText = document.getElementById("game-overlay-text");
const gameStartButton = document.getElementById("game-start");
const gameScoreEl = document.getElementById("game-score");
const gameTimeEl = document.getElementById("game-time");
const gameBestEl = document.getElementById("game-best");
const gameHint = document.getElementById("game-hint");
const binButtons = Array.from(document.querySelectorAll(".bin"));
const binsRow = document.querySelector(".game__bins");

// ----- Настройки на играта -----
const GAME_DURATION = 60;     // секунди
const POINTS_CORRECT = 10;
const POINTS_WRONG = 5;       // толкова точки губиш при грешка
const BEST_STORAGE_KEY = "dolinata-game-best";

// Видовете отпадъци и в кой контейнер отиват
const WASTE_TYPES = [
  { emoji: "🧴", name: "Пластмасова бутилка", bin: "yellow" },
  { emoji: "🥫", name: "Метално кенче", bin: "yellow" },
  { emoji: "📰", name: "Вестник", bin: "blue" },
  { emoji: "📦", name: "Кашон", bin: "blue" },
  { emoji: "📄", name: "Лист хартия", bin: "blue" },
  { emoji: "🍾", name: "Стъклена бутилка", bin: "green" },
  { emoji: "🫙", name: "Стъклен буркан", bin: "green" },
  { emoji: "🔋", name: "Батерия", bin: "battery" },
];

// Имената на контейнерите, за да съставяме подсказките
const BIN_NAMES = {
  yellow: "жълтия контейнер",
  blue: "синия контейнер",
  green: "зеления контейнер",
  battery: "кутията за батерии",
};

// Какво пише в контейнера – за подсказката след грешка
const BIN_CONTENTS = {
  yellow: "пластмаса и метал",
  blue: "хартия и картон",
  green: "стъкло",
};

// ----- Състояние на играта -----
let isPlaying = false;
let score = 0;
let bestScore = 0;
let elapsed = 0;          // изминали секунди
let spawnTimer = 0;       // кога да падне следващият отпадък
let lastFrameTime = 0;
let fallingItems = [];    // отпадъците на екрана
let selectedBin = 0;      // кой контейнер е избран с клавиатурата
let draggedItem = null;   // отпадъкът, който влачим в момента
let dragOffsetX = 0;
let dragOffsetY = 0;

// ----- Рекорд (localStorage може да е забранен, затова try/catch) -----
function loadBestScore() {
  try {
    bestScore = Number(localStorage.getItem(BEST_STORAGE_KEY)) || 0;
  } catch (error) {
    bestScore = 0;
  }
  gameBestEl.textContent = bestScore;
}

function saveBestScore() {
  try {
    localStorage.setItem(BEST_STORAGE_KEY, String(bestScore));
  } catch (error) {
    // Ако не може да се запише, рекордът важи само до презареждане
  }
}

// ----- Помощни функции за размерите -----
// Докъде падат отпадъците – горният ръб на контейнерите
const groundLevel = () => binsRow.offsetTop;
const fieldWidth = () => gameField.clientWidth;

// ----- Създаване на нов падащ отпадък -----
function spawnItem() {
  const type = WASTE_TYPES[Math.floor(Math.random() * WASTE_TYPES.length)];

  const el = document.createElement("div");
  el.className = "game__item";
  el.innerHTML = `<span class="game__item-emoji" aria-hidden="true">${type.emoji}</span>
    <span class="game__item-name">${type.name}</span>`;
  gameField.appendChild(el);

  const size = el.offsetWidth;
  fallingItems.push({
    el,
    type,
    size,
    x: Math.random() * (fieldWidth() - size),
    y: -size,
  });
}

// Премахва отпадък от полето и от списъка
function removeItem(item) {
  item.el.remove();
  fallingItems = fallingItems.filter((other) => other !== item);
  if (draggedItem === item) draggedItem = null;
}

// Най-ниският отпадък – него местим с клавиатурата или с натискане на контейнер
function getLowestItem() {
  let lowest = null;
  fallingItems.forEach((item) => {
    if (item !== draggedItem && (!lowest || item.y > lowest.y)) lowest = item;
  });
  return lowest;
}

// ----- Точки и подсказки -----
function changeScore(points) {
  score = Math.max(0, score + points);
  gameScoreEl.textContent = score;
}

function showHint(text) {
  gameHint.textContent = text;
}

// Съставя обяснение защо изборът е грешен
function wrongBinHint(type, chosenBin) {
  if (type.bin === "battery") {
    return `Батериите не са за ${BIN_NAMES[chosenBin]} – има специални кутии в магазините.`;
  }
  return `„${type.name}“ отива в ${BIN_NAMES[type.bin]} – той е за ${BIN_CONTENTS[type.bin]}.`;
}

// Кратко оцветяване на контейнера: зелено за вярно, червено за грешно
function flashBin(binName, isCorrect) {
  const button = binButtons.find((b) => b.dataset.bin === binName);
  const className = isCorrect ? "is-correct" : "is-wrong";
  button.classList.add(className);
  setTimeout(() => button.classList.remove(className), 400);
}

// Пуска отпадъка в избрания контейнер и проверява дали е вярно
function sortItem(item, binName) {
  const isCorrect = item.type.bin === binName;
  if (isCorrect) {
    changeScore(POINTS_CORRECT);
    showHint("");
  } else {
    changeScore(-POINTS_WRONG);
    showHint(wrongBinHint(item.type, binName));
  }
  flashBin(binName, isCorrect);
  removeItem(item);
}

// ----- Влачене с мишка и пръст (Pointer Events работят и за двете) -----
// Намира контейнера под точката (x, y) на екрана
function binAtPoint(x, y) {
  return binButtons.find((button) => {
    const r = button.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  });
}

gameField.addEventListener("pointerdown", (event) => {
  const el = event.target.closest(".game__item");
  if (!isPlaying || !el) return;

  draggedItem = fallingItems.find((item) => item.el === el);
  const fieldRect = gameField.getBoundingClientRect();
  dragOffsetX = event.clientX - fieldRect.left - draggedItem.x;
  dragOffsetY = event.clientY - fieldRect.top - draggedItem.y;

  // Всички следващи движения на този пръст/мишка идват към отпадъка
  el.setPointerCapture(event.pointerId);
  el.classList.add("is-dragging");
});

gameField.addEventListener("pointermove", (event) => {
  if (!draggedItem) return;
  const fieldRect = gameField.getBoundingClientRect();
  draggedItem.x = clamp(event.clientX - fieldRect.left - dragOffsetX, 0, fieldWidth() - draggedItem.size);
  draggedItem.y = clamp(event.clientY - fieldRect.top - dragOffsetY, 0, gameField.clientHeight - draggedItem.size);
});

function endDrag(event) {
  if (!draggedItem) return;
  const item = draggedItem;
  item.el.classList.remove("is-dragging");
  draggedItem = null;

  // Пуснат върху контейнер → проверяваме. Иначе продължава да пада.
  const bin = binAtPoint(event.clientX, event.clientY);
  if (bin) sortItem(item, bin.dataset.bin);
}

gameField.addEventListener("pointerup", endDrag);
gameField.addEventListener("pointercancel", endDrag);

// ----- Натискане на контейнер: в него отива най-ниският отпадък -----
binButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    if (!isPlaying) return;
    selectBin(index);
    const item = getLowestItem();
    if (item) sortItem(item, button.dataset.bin);
  });
});

// ----- Клавиатура: стрелки за избор, Enter или ↓ за пускане -----
function selectBin(index) {
  selectedBin = (index + binButtons.length) % binButtons.length; // въртим се в кръг
  binButtons.forEach((button, i) => button.classList.toggle("is-selected", i === selectedBin));
}

gameField.addEventListener("keydown", (event) => {
  if (!isPlaying) return;

  // Enter/интервал върху самия бутон-контейнер вече работи като клик
  const isOnBinButton = event.target.classList.contains("bin");

  if (event.key === "ArrowLeft") {
    selectBin(selectedBin - 1);
  } else if (event.key === "ArrowRight") {
    selectBin(selectedBin + 1);
  } else if (event.key === "ArrowDown" || (!isOnBinButton && (event.key === "Enter" || event.key === " "))) {
    const item = getLowestItem();
    if (item) sortItem(item, binButtons[selectedBin].dataset.bin);
  } else {
    return; // други клавиши не ни интересуват
  }
  event.preventDefault(); // стрелките да не скролват страницата
});

// ----- Главният цикъл на играта -----
function gameLoop(now) {
  if (!isPlaying) return;

  // dt = колко секунди са минали от предишния кадър (ограничено,
  // за да няма скок, ако разделът е бил скрит)
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;
  elapsed += dt;

  // progress расте от 0 до 1 за 60 секунди – от него зависи скоростта
  const progress = clamp(elapsed / GAME_DURATION, 0, 1);
  const fallSpeed = gameField.clientHeight * lerp(0.16, 0.42, progress); // пиксели в секунда

  // Нов отпадък – все по-често с времето
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnItem();
    spawnTimer = lerp(1.6, 0.65, progress);
  }

  // Движим отпадъците надолу (без този, който влачим)
  const ground = groundLevel();
  fallingItems.forEach((item) => {
    if (item !== draggedItem) item.y += fallSpeed * dt;

    if (item.y + item.size >= ground && item !== draggedItem) {
      changeScore(-POINTS_WRONG);
      showHint(`„${item.type.name}“ падна на земята. Отпадъците не бива да остават в природата!`);
      removeItem(item);
    }
  });

  // Рисуваме: местим всеки елемент и отбелязваме най-ниския
  const lowest = getLowestItem();
  fallingItems.forEach((item) => {
    item.el.style.transform = `translate(${item.x}px, ${item.y}px)`;
    item.el.classList.toggle("is-active", item === lowest);
  });

  // Таймер
  const timeLeft = Math.ceil(GAME_DURATION - elapsed);
  gameTimeEl.textContent = Math.max(timeLeft, 0);

  if (elapsed >= GAME_DURATION) endGame();
  else requestAnimationFrame(gameLoop);
}

// ----- Старт и край -----
function startGame() {
  // Изчистваме останалото от предишната игра
  fallingItems.forEach((item) => item.el.remove());
  fallingItems = [];
  draggedItem = null;

  score = 0;
  elapsed = 0;
  spawnTimer = 0;
  gameScoreEl.textContent = 0;
  gameTimeEl.textContent = GAME_DURATION;
  showHint("");
  selectBin(0);

  isPlaying = true;
  gameOverlay.hidden = true;
  gameField.classList.add("is-playing");
  gameField.focus({ preventScroll: true }); // за да работят стрелките веднага

  lastFrameTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function endGame() {
  isPlaying = false;
  gameField.classList.remove("is-playing");
  binButtons.forEach((button) => button.classList.remove("is-selected"));

  const isNewRecord = score > bestScore;
  if (isNewRecord) {
    bestScore = score;
    gameBestEl.textContent = bestScore;
    saveBestScore();
  }

  gameOverlayTitle.textContent = isNewRecord ? "Нов рекорд! 🏆" : "Край на играта!";
  gameOverlayText.textContent = `Събра ${score} точки. Най-добър резултат: ${bestScore}.`;
  gameStartButton.textContent = "Играй пак";
  gameOverlay.hidden = false;
  gameStartButton.focus({ preventScroll: true });
}

gameStartButton.addEventListener("click", startGame);
loadBestScore();
