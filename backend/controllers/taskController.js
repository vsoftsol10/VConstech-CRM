const pool = require("../config/database");
const { createNotification, getTeamMember } = require("../utils/notifications");

const VALID_PRIORITIES = ["High", "Medium", "Low"];
const VALID_STATUSES = ["Open", "In Progress", "Completed", "Done", "Closed"];
const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 120;
const MIN_DESCRIPTION_LENGTH = 10;

const normalizeText = (value) => String(value || "").trim();
const todayInput = () => new Date().toISOString().split("T")[0];

const sendValidationError = (res, errors) =>
  res.status(400).json({ success: false, message: "Please fix the highlighted fields.", errors });

const validateTaskPayload = async (body = {}) => {
  const values = {
    title: normalizeText(body.title),
    description: normalizeText(body.description),
    assigned_to: normalizeText(body.assigned_to),
    employee_name: normalizeText(body.employee_name),
    department: normalizeText(body.department),
    priority: normalizeText(body.priority),
    due_date: normalizeText(body.due_date),
    status: normalizeText(body.status) || "Open",
  };
  const errors = {};

  if (!values.title) errors.title = "Task title is required.";
  else if (values.title.length < MIN_TITLE_LENGTH) errors.title = `Task title must be at least ${MIN_TITLE_LENGTH} characters.`;
  else if (values.title.length > MAX_TITLE_LENGTH) errors.title = `Task title must be ${MAX_TITLE_LENGTH} characters or less.`;

  if (!values.description) errors.description = "Task description is required.";
  else if (values.description.length < MIN_DESCRIPTION_LENGTH) errors.description = `Task description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`;

  if (!values.assigned_to) errors.assigned_to = "Employee is required.";

  if (!values.priority) errors.priority = "Please select a priority.";
  else if (!VALID_PRIORITIES.includes(values.priority)) errors.priority = "Invalid priority selected.";

  if (!values.due_date) errors.due_date = "Due date is required.";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.due_date) || Number.isNaN(new Date(values.due_date).getTime())) {
    errors.due_date = "Invalid due date.";
  } else if (values.due_date < todayInput()) {
    errors.due_date = "Due date cannot be in the past.";
  }

  if (!VALID_STATUSES.includes(values.status)) {
    errors.status = "Invalid status selected.";
  }

  const assignee = values.assigned_to ? await getTeamMember(values.assigned_to) : null;
  if (values.assigned_to && !assignee) {
    errors.assigned_to = "Assigned team member not found.";
  }

  return { values, errors, assignee };
};

// ── POST create task ────────────────────────────────────────────────────────
const createTask = async (req, res) => {
  try {
    const { values, errors, assignee } = await validateTaskPayload(req.body);
    if (Object.keys(errors).length > 0) return sendValidationError(res, errors);

    let result;
    try {
      result = await pool.query(
        `INSERT INTO tasks
         (title, description, assigned_to, employee_name, department, priority, due_date, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [
          values.title,
          values.description,
          assignee.employee_id,
          values.employee_name || assignee.name,
          values.department || assignee.department || null,
          values.priority,
          values.due_date,
          values.status,
        ]
      );
    } catch (err) {
      if (err.code !== "42703") throw err;
      result = await pool.query(
        `INSERT INTO tasks
         (title, description, assigned_to, employee_name, priority, due_date)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [
          values.title,
          values.description,
          assignee.employee_id,
          values.employee_name || assignee.name,
          values.priority,
          values.due_date,
        ]
      );
    }

    await createNotification({
      employeeId: assignee.employee_id,
      employeeName: values.employee_name || assignee.name,
      title: "Task assigned",
      message: `${values.title} has been assigned to you.`,
      type: "task_assignment",
      relatedType: "task",
      relatedId: result.rows[0].id,
      link: `/Tickets?task=${result.rows[0].id}`,
    });

    res.status(201).json({
      success: true,
      task: result.rows[0],
    });

  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── GET all tasks ───────────────────────────────────────────────────────────
const getAllTasks = async (req, res) => {
  try {
    const { assigned_to } = req.query;
    let query = "SELECT * FROM tasks";
    const params = [];

    if (assigned_to) {
      query += " WHERE assigned_to = $1";
      params.push(assigned_to);
    }
    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /tasks error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = normalizeText(req.body.status);

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }
    if (!VALID_STATUSES.includes(status)) {
      return sendValidationError(res, { status: "Invalid status selected." });
    }

    const result = await pool.query(
      "UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.json({ success: true, task: result.rows[0] });
  } catch (err) {
    console.error("PUT /tasks/:id/status error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTaskUpdates = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = normalizeText(req.query.employee_id);

    const taskResult = await pool.query("SELECT id, assigned_to FROM tasks WHERE id = $1", [id]);
    if (!taskResult.rows.length) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (employeeId && String(taskResult.rows[0].assigned_to) !== String(employeeId)) {
      return res.status(403).json({ success: false, message: "You are not authorized to view updates for this task." });
    }

    const result = await pool.query(
      `SELECT id, task_id, employee_id, employee_name, note AS work_note, status, created_at
       FROM task_updates
       WHERE task_id = $1
       ORDER BY created_at ASC, id ASC`,
      [id]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("GET /tasks/:id/updates error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const createTaskUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = normalizeText(req.body.employee_id);
    const employeeName = normalizeText(req.body.employee_name);
    const workNote = normalizeText(req.body.work_note || req.body.workNote || req.body.Worknotes);

    if (!employeeId) {
      return res.status(400).json({ success: false, message: "Employee ID is required." });
    }
    if (!workNote) {
      return res.status(400).json({ success: false, message: "Work note is required." });
    }

    const taskResult = await pool.query("SELECT id, assigned_to, employee_name, status FROM tasks WHERE id = $1", [id]);
    if (!taskResult.rows.length) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const task = taskResult.rows[0];
    if (String(task.assigned_to) !== String(employeeId)) {
      return res.status(403).json({ success: false, message: "You are not authorized to add updates for this task." });
    }

    const result = await pool.query(
      `INSERT INTO task_updates (task_id, employee_id, employee_name, note, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, task_id, employee_id, employee_name, note AS work_note, status, created_at`,
      [id, employeeId, employeeName || task.employee_name || null, workNote, task.status || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("POST /tasks/:id/updates error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { values, errors, assignee } = await validateTaskPayload(req.body);
    if (Object.keys(errors).length > 0) return sendValidationError(res, errors);

    let result;
    try {
      result = await pool.query(
        `UPDATE tasks
         SET title = $1,
             description = $2,
             assigned_to = $3,
             employee_name = $4,
             department = $5,
             priority = $6,
             due_date = $7,
             status = COALESCE($8, status),
             updated_at = NOW()
         WHERE id = $9
         RETURNING *`,
        [
          values.title,
          values.description,
          assignee.employee_id,
          values.employee_name || assignee.name,
          values.department || assignee.department || null,
          values.priority,
          values.due_date,
          values.status,
          id,
        ]
      );
    } catch (err) {
      if (err.code !== "42703") throw err;
      result = await pool.query(
        `UPDATE tasks
         SET title = $1,
             description = $2,
             assigned_to = $3,
             employee_name = $4,
             priority = $5,
             due_date = $6,
             status = COALESCE($7, status),
             updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [
          values.title,
          values.description,
          assignee.employee_id,
          values.employee_name || assignee.name,
          values.priority,
          values.due_date,
          values.status,
          id,
        ]
      );
    }

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.json({ success: true, task: result.rows[0] });
  } catch (err) {
    console.error("PUT /tasks/:id error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING *", [id]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.json({ success: true, task: result.rows[0] });
  } catch (err) {
    console.error("DELETE /tasks/:id error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskUpdates,
  createTaskUpdate,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
