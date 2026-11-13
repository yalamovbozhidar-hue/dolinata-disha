/* =========================================
   ОБЕЩАНИЯ
   Запазват се в браузъра (localStorage), за да
   останат отметнати и след презареждане.
   ========================================= */
const pledgeBoxes = document.querySelectorAll("#pledge input");
const pledgeFill = document.getElementById("pledge-fill");
const pledgeText = document.getElementById("pledge-text");
const PLEDGE_STORAGE_KEY = "dolinata-pledges";

function loadPledges() {
  try {
    const saved = JSON.parse(localStorage.getItem(PLEDGE_STORAGE_KEY)) || [];
    pledgeBoxes.forEach((box, i) => { box.checked = Boolean(saved[i]); });
  } catch (error) {
    // Ако браузърът не позволява localStorage, просто продължаваме
  }
}

function updatePledges() {
  const states = Array.from(pledgeBoxes, (box) => box.checked);
  const done = states.filter(Boolean).length;
  const total = pledgeBoxes.length;

  pledgeFill.style.width = `${(done / total) * 100}%`;
  pledgeText.textContent = done === total
    ? "Супер! Изпълни всички 5 обещания 🌿"
    : `${done} от ${total} обещания`;

  try {
    localStorage.setItem(PLEDGE_STORAGE_KEY, JSON.stringify(states));
  } catch (error) {
    // Запазването не е задължително
  }
}

pledgeBoxes.forEach((box) => box.addEventListener("change", updatePledges));
loadPledges();
updatePledges();
