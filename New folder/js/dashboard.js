const API_BASE = '/api';

const taskGrid = document.getElementById('taskGrid');
const completedCount = document.getElementById('completedCount');
const remainingCount = document.getElementById('remainingCount');
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');
const emptyState = document.getElementById('emptyState');
const apiMessage = document.getElementById('apiMessage');
const apiStatusText = document.getElementById('apiStatusText');
const apiStatusDot = document.getElementById('apiStatusDot');
const modal = document.getElementById('taskModal');

let tasks = [];
let currentFilter = 'All';

const statusClass = (status) =>
  status === 'Completed' ? 'completed' : status === 'In Progress' ? 'progress' : 'not-started';

function setApiStatus(connected) {
  if (!apiStatusText || !apiStatusDot) return;
  apiStatusText.textContent = connected ? 'Connected' : 'Offline';
  apiStatusDot.classList.toggle('offline', !connected);
  apiStatusDot.setAttribute('aria-label', connected ? 'Backend connected' : 'Backend offline');
}

function showMessage(message, type = 'loading') {
  if (!apiMessage) return;
  apiMessage.hidden = false;
  apiMessage.className = `api-message ${type}`;
  apiMessage.textContent = message;
  if (type === 'loading') taskGrid.hidden = true;
}

function hideMessage() {
  if (!apiMessage) return;
  apiMessage.hidden = true;
  taskGrid.hidden = false;
}

function updateProgress() {
  const done = tasks.filter((task) => task.status === 'Completed').length;
  const total = tasks.length;
  const pct = total ? (done / total) * 100 : 0;

  completedCount.textContent = done;
  remainingCount.textContent = Math.max(total - done, 0);
  progressText.textContent = `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
  progressBar.style.width = `${pct}%`;

  const totalElement = document.getElementById('totalTaskCount');
  if (totalElement) totalElement.textContent = total;
}

function renderTasks() {
  const filtered = tasks.filter((task) => currentFilter === 'All' || task.status === currentFilter);
  taskGrid.innerHTML = '';
  emptyState.hidden = filtered.length > 0;

  filtered.forEach((task) => {
    const card = document.createElement('article');
    card.className = 'task-card';
    card.innerHTML = `
      <div class="task-top">
        <span class="task-number">TASK ${task.id}</span>
        <span class="badge ${statusClass(task.status)}">${task.status}</span>
      </div>
      <h3>${escapeHtml(task.title)}</h3>
      <p>${escapeHtml(task.description)}</p>
      <div class="task-actions">
        <button class="button secondary view-btn" data-id="${task.id}" type="button">View Task</button>
        ${task.status !== 'Completed'
          ? `<button class="button complete-btn" data-id="${task.id}" type="button">Mark as Completed</button>`
          : '<button class="button" disabled type="button">Completed ✓</button>'}
      </div>`;
    taskGrid.appendChild(card);
  });

  updateProgress();
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  let data = null;
  try {
    data = await response.json();
  } catch (_error) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}.`);
  }

  return data;
}

async function loadTasks() {
  showMessage('Loading tasks...', 'loading');
  setApiStatus(false);

  try {
    tasks = await fetchJson(`${API_BASE}/tasks`);
    setApiStatus(true);
    hideMessage();
    renderTasks();
  } catch (error) {
    console.error(error);
    setApiStatus(false);
    showMessage('Unable to load tasks. Please check your connection or try again.', 'error');
    taskGrid.innerHTML = '';
    emptyState.hidden = true;
    updateProgress();
  }
}

async function loadTask(id) {
  try {
    return await fetchJson(`${API_BASE}/tasks/${id}`);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function updateTaskStatus(id, status) {
  return fetchJson(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
}

function openModal(task) {
  document.getElementById('modalNumber').textContent = `TASK ${task.id} · ${task.status.toUpperCase()}`;
  document.getElementById('modalTitle').textContent = task.title;
  document.getElementById('modalDescription').textContent = task.description;
  document.getElementById('modalDetails').innerHTML = `<strong>What to focus on</strong><p>${escapeHtml(task.details)}</p>`;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('.filter').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    currentFilter = button.dataset.filter;
    renderTasks();
  });
});

taskGrid.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-id]');
  if (!button) return;

  const id = Number(button.dataset.id);

  if (button.classList.contains('complete-btn')) {
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Updating...';

    try {
      const updatedTask = await updateTaskStatus(id, 'Completed');
      const index = tasks.findIndex((task) => task.id === id);
      if (index !== -1) tasks[index] = updatedTask;
      setApiStatus(true);
      renderTasks();
    } catch (error) {
      console.error(error);
      setApiStatus(false);
      button.disabled = false;
      button.textContent = originalText;
      alert('Unable to update this task. Please check that the backend is running and try again.');
    }
    return;
  }

  if (button.classList.contains('view-btn')) {
    button.disabled = true;
    button.textContent = 'Loading...';

    try {
      const task = await loadTask(id);
      setApiStatus(true);
      openModal(task);
    } catch (error) {
      setApiStatus(false);
      alert('Unable to load this task. Please check that the backend is running and try again.');
    } finally {
      button.disabled = false;
      button.textContent = 'View Task';
    }
  }
});

document.querySelectorAll('[data-close]').forEach((element) => element.addEventListener('click', closeModal));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
});

const tech = {
  next: { title: 'Next.js', body: 'Next.js is a React framework used for building modern web applications. It adds features such as routing, server-side rendering, static generation and other production-ready tools around React, making it useful for websites and applications that need strong performance and structure.' },
  vue: { title: 'Vue.js', body: 'Vue.js is a progressive JavaScript framework for building user interfaces. Developers use it to create interactive interfaces and single-page applications, and it can be adopted gradually from a small component to a larger application.' },
  angular: { title: 'Angular', body: 'Angular is a full-featured framework for building web applications. It provides a structured approach to components, routing, forms, dependency injection and application architecture, and is commonly used for larger business applications.' },
  backend: { title: 'Backend Development', body: 'Backend development is the part of a web platform that runs behind the interface. It can manage business logic, authentication, databases, APIs and data processing, then communicate with the frontend so users can interact with real information.' }
};

function renderTech(key) {
  const technology = tech[key];
  document.getElementById('techPanel').innerHTML = `<p class="eyebrow">TECHNOLOGY EXPLORER</p><h3>${technology.title}</h3><p>${technology.body}</p><span class="learn">Explore how it fits into a complete web platform →</span>`;
  document.querySelectorAll('.tech-tab').forEach((button) => button.classList.toggle('active', button.dataset.tech === key));
}

document.querySelectorAll('.tech-tab').forEach((button) => button.addEventListener('click', () => renderTech(button.dataset.tech)));

const menuBtn = document.getElementById('menuBtn');
const dashboardNav = document.getElementById('dashboardNav');

if (menuBtn && dashboardNav) {
  menuBtn.addEventListener('click', () => {
    const isOpen = !dashboardNav.classList.contains('open');
    dashboardNav.classList.toggle('open', isOpen);
    dashboardNav.classList.toggle('active', isOpen);
    menuBtn.setAttribute('aria-expanded', String(isOpen));
    menuBtn.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });

  dashboardNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      dashboardNav.classList.remove('open', 'active');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open navigation');
    });
  });
}

const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
if (dashboardNav) {
  dashboardNav.querySelectorAll('a').forEach((link) => {
    if (link.getAttribute('href') === currentPage) link.classList.add('active');
  });
}

document.getElementById('totalTaskCount')?.replaceChildren(String(tasks.length));
renderTech('next');
loadTasks();
