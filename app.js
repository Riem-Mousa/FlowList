const STORAGE_KEY = "todo-list-tasks";
const RING_CIRCUMFERENCE = 327;

const CELEBRATION_MESSAGES = [
  "You crushed it — every single task is complete!",
  "Zero tasks left. You're officially unstoppable today.",
  "Look at you go! Your list is 100% done.",
  "All checked off. That's the kind of focus that changes days.",
  "You showed up and finished. Be proud of that.",
  "Mission accomplished. Time to celebrate you!",
];

const BANNER_MESSAGES = [
  "Everything on your list is done. Nice work!",
  "100% complete — you're on fire today.",
  "All tasks finished. Keep riding this momentum!",
];

const PRIORITY_LABELS = {
  low: { icon: "🌿", label: "Low" },
  medium: { icon: "⚡", label: "Medium" },
  high: { icon: "🔴", label: "High" },
};

const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const countEl = document.getElementById("task-count");
const emptyState = document.getElementById("empty-state");
const filterEmpty = document.getElementById("filter-empty");
const statTotal = document.getElementById("stat-total");
const statActive = document.getElementById("stat-active");
const statDone = document.getElementById("stat-done");
const progressPercent = document.getElementById("progress-percent");
const progressBar = document.getElementById("progress-bar");
const progressRing = document.getElementById("progress-ring");
const clearCompletedBtn = document.getElementById("clear-completed");
const allDoneBanner = document.getElementById("all-done-banner");
const bannerMessage = document.getElementById("banner-message");
const celebrationOverlay = document.getElementById("celebration-overlay");
const celebrationMessage = document.getElementById("celebration-message");
const dismissCelebration = document.getElementById("dismiss-celebration");
const confettiCanvas = document.getElementById("confetti-canvas");
const filterTabs = document.querySelectorAll(".filter-tab");

let tasks = loadTasks();
let currentFilter = "all";
let wasAllComplete = areAllComplete();
let confettiFrame = null;

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return parsed.map((task) => ({
      id: task.id,
      text: task.text,
      completed: Boolean(task.completed),
      priority: task.priority || "medium",
    }));
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function areAllComplete() {
  return tasks.length > 0 && tasks.every((t) => t.completed);
}

function getFilteredTasks() {
  if (currentFilter === "active") return tasks.filter((t) => !t.completed);
  if (currentFilter === "completed") return tasks.filter((t) => t.completed);
  return tasks;
}

function pickRandom(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}

function updateStats() {
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const active = total - done;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const offset = RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE;

  statTotal.textContent = total;
  statActive.textContent = active;
  statDone.textContent = done;
  progressPercent.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;
  progressRing.style.strokeDashoffset = offset;

  countEl.textContent =
    total === 0
      ? "Add tasks to track your progress"
      : active === 0
        ? "🎉 All tasks complete!"
        : `${active} of ${total} task${total === 1 ? "" : "s"} remaining`;

  clearCompletedBtn.disabled = done === 0;

  const allComplete = areAllComplete();
  allDoneBanner.classList.toggle("hidden", !allComplete);
  if (allComplete) {
    bannerMessage.textContent = pickRandom(BANNER_MESSAGES);
  }

  if (allComplete && !wasAllComplete) {
    showCelebration();
  }
  wasAllComplete = allComplete;
}

function renderTasks() {
  const filtered = getFilteredTasks();
  list.innerHTML = "";

  filtered.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " completed" : "");
    li.dataset.id = task.id;
    li.style.animationDelay = `${index * 0.05}s`;

    const priority = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS.medium;

    li.innerHTML = `
      <label class="task-check">
        <input type="checkbox" ${task.completed ? "checked" : ""} aria-label="Mark task as ${task.completed ? "incomplete" : "complete"}" />
        <span class="check-visual" aria-hidden="true">${task.completed ? "✓" : ""}</span>
      </label>
      <div class="task-body">
        <div class="task-meta">
          <span class="priority-badge ${task.priority}">${priority.icon} ${priority.label}</span>
        </div>
        <span class="task-text">${escapeHtml(task.text)}</span>
      </div>
      <div class="task-actions">
        <button type="button" class="edit-btn" aria-label="Edit task">✏️ Edit</button>
        <button type="button" class="delete-btn" aria-label="Delete task">🗑️ Delete</button>
      </div>
    `;

    list.appendChild(li);
  });

  const hasTasks = tasks.length > 0;
  const hasFiltered = filtered.length > 0;

  emptyState.classList.toggle("hidden", hasTasks);
  filterEmpty.classList.toggle("hidden", !hasTasks || hasFiltered);
  list.classList.toggle("hidden", !hasFiltered);

  updateStats();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function addTask(text, priority) {
  const trimmed = text.trim();
  if (!trimmed) return;

  tasks.unshift({
    id: crypto.randomUUID(),
    text: trimmed,
    completed: false,
    priority: priority || "medium",
  });

  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
}

function editTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const newText = prompt("Edit task:", task.text);
  if (newText === null) return;

  const trimmed = newText.trim();
  if (!trimmed) return;

  task.text = trimmed;
  saveTasks();
  renderTasks();
}

function clearCompleted() {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  renderTasks();
}

function showCelebration() {
  celebrationMessage.textContent = pickRandom(CELEBRATION_MESSAGES);
  celebrationOverlay.classList.remove("hidden");
  celebrationOverlay.setAttribute("aria-hidden", "false");
  startConfetti();
}

function hideCelebration() {
  celebrationOverlay.classList.add("hidden");
  celebrationOverlay.setAttribute("aria-hidden", "true");
  stopConfetti();
}

function startConfetti() {
  const ctx = confettiCanvas.getContext("2d");
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  const colors = ["#818cf8", "#f472b6", "#34d399", "#fbbf24", "#22d3ee", "#fb7185"];
  const pieces = Array.from({ length: 160 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: Math.random() * confettiCanvas.height - confettiCanvas.height,
    size: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedY: Math.random() * 3 + 2,
    speedX: Math.random() * 2 - 1,
    rotation: Math.random() * 360,
    spin: Math.random() * 8 - 4,
  }));

  function draw() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    pieces.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.spin;

      if (p.y > confettiCanvas.height + 20) {
        p.y = -20;
        p.x = Math.random() * confettiCanvas.width;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    confettiFrame = requestAnimationFrame(draw);
  }

  stopConfetti();
  draw();
}

function stopConfetti() {
  if (confettiFrame) {
    cancelAnimationFrame(confettiFrame);
    confettiFrame = null;
  }
  const ctx = confettiCanvas.getContext("2d");
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const priority = form.querySelector('input[name="priority"]:checked')?.value || "medium";
  addTask(input.value, priority);
  input.value = "";
  input.focus();
});

list.addEventListener("click", (e) => {
  const item = e.target.closest(".task-item");
  if (!item) return;

  const id = item.dataset.id;

  if (e.target.matches('input[type="checkbox"]')) {
    toggleTask(id);
  } else if (e.target.closest(".delete-btn")) {
    deleteTask(id);
  } else if (e.target.closest(".edit-btn")) {
    editTask(id);
  }
});

filterTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    filterTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentFilter = tab.dataset.filter;
    renderTasks();
  });
});

clearCompletedBtn.addEventListener("click", clearCompleted);
dismissCelebration.addEventListener("click", hideCelebration);

celebrationOverlay.addEventListener("click", (e) => {
  if (e.target === celebrationOverlay) hideCelebration();
});

window.addEventListener("resize", () => {
  if (!celebrationOverlay.classList.contains("hidden")) {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
});

if (areAllComplete()) {
  wasAllComplete = true;
}

renderTasks();
