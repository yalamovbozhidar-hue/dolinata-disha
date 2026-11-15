/* =========================================
   ЗВУКЪТ НА ДОЛИНАТА
   Няма звукови файлове – звукът се създава в браузъра (Web Audio API):
   - вятър: шум, пуснат през филтър, чиято честота бавно „диша“;
   - птици: кратки свирки с бързо плъзгаща се честота. Колкото по-чист
     е въздухът (clean от js/hero.js), толкова повече птици;
   - щурци: нощем, в края на страницата (dayTime от js/hero.js).
   Изключен е, докато човек не натисне бутона – браузърите и без това
   не пускат звук без действие от потребителя.
   ========================================= */
const soundButton = document.getElementById("sound-toggle");
const soundIcon = soundButton.querySelector(".nav__sound-icon");
let audio = null;        // AudioContext – създаваме го при първото натискане
let masterGain = null;   // общата сила на звука
let soundOn = false;
let natureTimer = 0;

// Вятър: 2 секунди „кафяв“ шум (по-мек от белия), повтарян безкрайно
function startWind() {
  const length = audio.sampleRate * 2;
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const noise = audio.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 500;

  // Бавно трептене на филтъра: вятърът се усилва и затихва
  const lfo = audio.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoDepth = audio.createGain();
  lfoDepth.gain.value = 300;
  lfo.connect(lfoDepth).connect(filter.frequency);

  const windGain = audio.createGain();
  windGain.gain.value = 0.35;
  noise.connect(filter).connect(windGain).connect(masterGain);
  noise.start();
  lfo.start();
}

// Един тон: честотата се плъзга от `from` към `to`, а силата бързо расте и затихва
function tone(start, from, to, length, volume, type = "sine") {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + length * 0.8);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(masterGain);
  osc.start(start);
  osc.stop(start + length + 0.02);
}

// Птица: 2–4 бързи свирки
function chirp() {
  const base = 2200 + Math.random() * 1800;
  const notes = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < notes; i++) {
    tone(audio.currentTime + i * 0.13, base, base * (1.3 + Math.random() * 0.4), 0.1, 0.05);
  }
}

// Щурец: няколко много кратки цвърчения около 4.5 kHz
function cricket() {
  for (let i = 0; i < 4; i++) {
    tone(audio.currentTime + i * 0.05, 4500, 4600, 0.03, 0.015, "triangle");
  }
}

// На всеки 0.4–2 секунди решаваме дали да се чуе птица или щурец
function scheduleNature() {
  if (!soundOn) return;
  const isNight = dayTime > 0.86;
  if (isNight) {
    if (Math.random() < 0.7) cricket();
  } else if (Math.random() < clean * 0.8) {
    chirp(); // в смога почти няма птици
  }
  natureTimer = setTimeout(scheduleNature, 400 + Math.random() * 1600);
}

soundButton.addEventListener("click", async () => {
  soundOn = !soundOn;
  if (!audio) {
    audio = new AudioContext();
    masterGain = audio.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audio.destination);
    startWind();
  }
  await audio.resume();
  // Плавно усилване или затихване вместо рязко прекъсване
  masterGain.gain.setTargetAtTime(soundOn ? 0.8 : 0, audio.currentTime, 0.4);

  clearTimeout(natureTimer);
  if (soundOn) scheduleNature();

  soundButton.setAttribute("aria-pressed", String(soundOn));
  soundIcon.textContent = soundOn ? "🔊" : "🔈";
});

// Друг раздел на браузъра – спираме звука; връщаме ли се – пускаме го пак
document.addEventListener("visibilitychange", () => {
  if (!audio) return;
  if (document.hidden) audio.suspend();
  else if (soundOn) audio.resume();
});
