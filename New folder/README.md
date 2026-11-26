# TechBridge Task Management — Task 7

Task 7 extends the Task 6 Interactive TechBridge Intern Dashboard with a Node.js + Express REST API.

## Project structure

```text
techbridge-task-management/
├── frontend files (existing Task 6 website)
├── css/
├── js/
├── image/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── data/
│       └── tasks.json
└── README.md
```

## Run the project

1. Install Node.js.
2. Open a terminal in the `backend` folder.
3. Run:

```bash
npm install
npm start
```

4. Open:

`http://localhost:3000/dashboard.html`

The Express server also serves the existing frontend, so the dashboard can use `/api/tasks` without a separate frontend server.

## REST API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check whether the backend and task data are available |
| GET | `/api/tasks` | Get all TechBridge internship tasks |
| GET | `/api/tasks/:id` | Get one task by ID |
| PUT | `/api/tasks/:id` | Update an existing task's status |

### Update example

Send JSON to `PUT /api/tasks/4`:

```json
{
  "status": "Completed"
}
```

Valid statuses are `Completed`, `In Progress`, and `Not Started`.

## Frontend behaviour

The dashboard now:

- Fetches tasks from `GET /api/tasks`.
- Shows `Loading tasks...` while the request is pending.
- Shows a clear error message if the API cannot be reached.
- Shows Backend Status as Connected or Offline.
- Fetches the selected task from `GET /api/tasks/:id` when View Task is clicked.
- Sends `PUT /api/tasks/:id` when Mark as Completed is clicked.
- Re-renders task cards, filters and progress after an update.
- Keeps the Task 6 filters: All, Completed, In Progress and Not Started.
- Updates the completed/remaining counts and progress percentage from API data.
