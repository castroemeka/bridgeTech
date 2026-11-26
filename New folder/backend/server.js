const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');
const FRONTEND_DIR = path.join(__dirname, '..');
const VALID_STATUSES = ['Completed', 'In Progress', 'Not Started'];

app.use(express.json());

async function readTasks() {
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeTasks(tasks) {
  await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2) + '\n', 'utf8');
}

app.get('/api/health', async (_req, res) => {
  try {
    await fs.access(DATA_FILE);
    res.json({ status: 'Connected', message: 'TechBridge API is running.' });
  } catch (error) {
    res.status(500).json({ status: 'Offline', message: 'Task data is unavailable.' });
  }
});

app.get('/api/tasks', async (_req, res) => {
  try {
    const tasks = await readTasks();
    res.json(tasks);
  } catch (error) {
    console.error('GET /api/tasks failed:', error);
    res.status(500).json({ message: 'Unable to load tasks.' });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Task ID must be a number.' });
    }

    const tasks = await readTasks();
    const task = tasks.find((item) => item.id === id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    res.json(task);
  } catch (error) {
    console.error(`GET /api/tasks/${req.params.id} failed:`, error);
    res.status(500).json({ message: 'Unable to load the task.' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Task ID must be a number.' });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Use one of: ${VALID_STATUSES.join(', ')}.`
      });
    }

    const tasks = await readTasks();
    const taskIndex = tasks.findIndex((item) => item.id === id);

    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    tasks[taskIndex].status = status;
    await writeTasks(tasks);

    res.json(tasks[taskIndex]);
  } catch (error) {
    console.error(`PUT /api/tasks/${req.params.id} failed:`, error);
    res.status(500).json({ message: 'Unable to update the task.' });
  }
});

// Serve the existing TechBridge frontend from the project root.
app.use(express.static(FRONTEND_DIR));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`TechBridge server running at http://localhost:${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard.html`);
});
