const body = document.getElementById("focus-body");

// -----------------------------
// TIMER
// -----------------------------
let timerInterval = null;
let timeLeft = 25 * 60;
let initialTime = 25 * 60;
let isRunning = false;
let isPaused = false;

const timerDisplay = document.getElementById("timer-display");
const timerProgressBar = document.getElementById("timer-progress-bar");
const sessionStatus = document.getElementById("session-status");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const presetBtns = document.querySelectorAll(".preset-btn");

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const elapsed = initialTime - timeLeft;
  const percent = initialTime ? (elapsed / initialTime) * 100 : 0;
  timerProgressBar.style.width = `${Math.min(percent, 100)}%`;
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  isPaused = false;
  startBtn.textContent = "Running…";
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  sessionStatus.textContent = "In progress";

  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimerDisplay();
    } else {
      timerComplete();
    }
  }, 1000);

  startQuoteInterval();
}

function pauseTimer() {
  if (!isRunning) return;

  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  isPaused = true;
  startBtn.textContent = "Resume";
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  sessionStatus.textContent = "Paused";
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  isPaused = false;
  timeLeft = initialTime;
  startBtn.textContent = "Start session";
  startBtn.disabled = false;
  pauseBtn.disabled = false;
  sessionStatus.textContent = "Ready";
  updateTimerDisplay();
}

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const minutes = Number(btn.dataset.minutes);
    initialTime = minutes * 60;
    timeLeft = initialTime;
    resetTimer();

    presetBtns.forEach((item) => item.classList.remove("active"));
    btn.classList.add("active");
  });
});

function timerComplete() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  isPaused = false;

  updateProgress(Math.floor(initialTime / 60));
  showCompletionModal();
  playNotificationSound();
  resetTimer();
}

function playNotificationSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.frequency.value = 800;
  oscillator.type = "sine";
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.5);
}

updateTimerDisplay();

// -----------------------------
// THEMES
// -----------------------------
const themeBtns = document.querySelectorAll(".theme-btn");
const savedTheme = localStorage.getItem("studyTheme") || "default";

function applyTheme(theme) {
  body.dataset.theme = theme;

  themeBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });

  localStorage.setItem("studyTheme", theme);
}

themeBtns.forEach((btn) => {
  btn.addEventListener("click", () => applyTheme(btn.dataset.theme));
});

applyTheme(savedTheme);

// -----------------------------
// BACKGROUND SOUNDS
// -----------------------------
const soundBtns = document.querySelectorAll(".sound-btn");
const backgroundAudio = document.getElementById("background-audio");
const volumeControl = document.getElementById("volume-control");

const soundSources = {
  rain: "sounds/rain.mp3",
  birds: "sounds/birds.mp3",
  guitar: "sounds/guitar.mp3",
  soft: "sounds/soft.mp3"
};

let currentSound = null;
backgroundAudio.volume = Number(volumeControl.value);

soundBtns.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const sound = btn.dataset.sound;

    soundBtns.forEach((item) => item.classList.remove("active"));

    if (sound === "none") {
      backgroundAudio.pause();
      backgroundAudio.removeAttribute("src");
      backgroundAudio.load();
      currentSound = null;
      btn.classList.add("active");
      return;
    }

    const source = soundSources[sound];
    if (!source) return;

    try {
      backgroundAudio.src = source;
      backgroundAudio.load();
      await backgroundAudio.play();
      currentSound = sound;
      btn.classList.add("active");
    } catch (error) {
      console.error(`Could not play ${source}. Make sure the file exists inside the sounds folder.`, error);
      alert(`The ${sound} sound file was not found. Put ${sound}.mp3 inside the sounds folder and try again.`);
    }
  });
});

volumeControl.addEventListener("input", () => {
  backgroundAudio.volume = Number(volumeControl.value);
});

// -----------------------------
// QUOTES
// -----------------------------
const quotes = [
  "Start before you feel ready.",
  "Make the next small move.",
  "You only need to focus on this moment.",
  "Done is better than endlessly preparing.",
  "Small progress is still progress.",
  "Give one task your full attention.",
  "You do not need a perfect session.",
  "Keep going, one page at a time.",
  "Let the timer hold the boundary for you.",
  "Begin. The motivation can catch up later."
];

const quoteDisplay = document.getElementById("quote-display");
const newQuoteBtn = document.getElementById("new-quote-btn");

function updateQuote() {
  const current = quoteDisplay.textContent;
  let next = current;

  while (quotes.length > 1 && next === current) {
    next = quotes[Math.floor(Math.random() * quotes.length)];
  }

  quoteDisplay.textContent = `“${next}”`;
}

newQuoteBtn.addEventListener("click", updateQuote);

let quoteInterval = null;

function startQuoteInterval() {
  if (quoteInterval) clearInterval(quoteInterval);

  quoteInterval = setInterval(() => {
    if (isRunning) updateQuote();
  }, 5 * 60 * 1000);
}

// -----------------------------
// TASK PLANNER
// -----------------------------
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const taskCount = document.getElementById("task-count");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTask(text) {
  tasks.push({
    id: Date.now(),
    text,
    completed: false
  });

  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );

  saveTasks();
  renderTasks();
}

function renderTasks() {
  taskList.innerHTML = "";

  const remaining = tasks.filter((task) => !task.completed).length;
  taskCount.textContent = `${remaining} ${remaining === 1 ? "task" : "tasks"}`;

  if (tasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-task";
    empty.textContent = "Nothing here yet. Add the first thing you want to finish.";
    taskList.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item${task.completed ? " completed" : ""}`;

    const check = document.createElement("button");
    check.type = "button";
    check.className = "task-check";
    check.setAttribute("aria-label", task.completed ? "Mark task incomplete" : "Mark task complete");
    check.addEventListener("click", () => toggleTask(task.id));

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-task";
    deleteBtn.textContent = "DELETE";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.append(check, text, deleteBtn);
    taskList.appendChild(li);
  });
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = taskInput.value.trim();
  if (!text) return;

  addTask(text);
  taskInput.value = "";
  taskInput.focus();
});

renderTasks();

// -----------------------------
// PROGRESS
// -----------------------------
let progress = JSON.parse(localStorage.getItem("progress")) || {
  sessions: 0,
  totalMinutes: 0
};

const sessionsCount = document.getElementById("sessions-count");
const totalTime = document.getElementById("total-time");
const resetProgressBtn = document.getElementById("reset-progress-btn");

function saveProgress() {
  localStorage.setItem("progress", JSON.stringify(progress));
}

function displayProgress() {
  sessionsCount.textContent = progress.sessions;
  totalTime.textContent = progress.totalMinutes;
}

function updateProgress(minutesStudied) {
  progress.sessions += 1;
  progress.totalMinutes += minutesStudied;
  saveProgress();
  displayProgress();
}

resetProgressBtn.addEventListener("click", () => {
  if (!confirm("Reset all saved study progress?")) return;

  progress = { sessions: 0, totalMinutes: 0 };
  saveProgress();
  displayProgress();
});

displayProgress();

// -----------------------------
// COMPLETION MODAL
// -----------------------------
const modal = document.getElementById("quote-modal");
const modalQuote = document.getElementById("modal-quote");
const closeModalBtn = document.getElementById("close-modal-btn");
const closeModalX = document.getElementById("close-modal-x");

function showCompletionModal() {
  modalQuote.textContent = `“${quotes[Math.floor(Math.random() * quotes.length)]}”`;
  modal.hidden = false;
  closeModalBtn.focus();
}

function closeModal() {
  modal.hidden = true;
}

closeModalBtn.addEventListener("click", closeModal);
closeModalX.addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
});
