require("dotenv").config();

const pool = require("../config/database");

const BASE_URL = process.env.VERIFY_BASE_URL || "http://localhost:5055";

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Keep plain text responses as-is.
  }
  if (!res.ok) {
    const detail = typeof body === "string" ? body : body?.error || body?.message || JSON.stringify(body);
    throw new Error(`${options.method || "GET"} ${path} failed: ${res.status} ${detail}`);
  }
  return body;
};

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

const pickData = (value) => value?.data || value;

async function getVerifierMember() {
  const result = await pool.query(`
    SELECT id, employee_id, name, email, department
    FROM team_members
    WHERE employee_id IS NOT NULL
    ORDER BY created_at DESC NULLS LAST
    LIMIT 1
  `);
  if (!result.rows.length) throw new Error("No team member found to verify assignment flows.");
  return result.rows[0];
}

async function cleanup({ ticketId, taskId }) {
  const queries = [];
  if (ticketId) {
    queries.push(pool.query("DELETE FROM notifications WHERE reference_type = 'ticket' AND reference_id = $1", [ticketId]));
    queries.push(pool.query("DELETE FROM tickets WHERE id = $1", [ticketId]));
  }
  if (taskId) {
    queries.push(pool.query("DELETE FROM notifications WHERE reference_type = 'task' AND reference_id::text = $1", [String(taskId)]));
    queries.push(pool.query("DELETE FROM tasks WHERE id = $1", [taskId]));
  }
  await Promise.allSettled(queries);
}

async function main() {
  let ticketId = null;
  let taskId = null;
  const member = await getVerifierMember();

  try {
    const root = await request("/");
    expect(String(root).includes("Backend running"), "Backend root did not respond as expected.");

    await request("/api/dashboard/stats");
    await request("/api/leads");
    await request("/api/customers");
    await request("/api/customers/stats/monthly");
    await request("/api/plans");
    await request("/api/team");
    await request(`/api/team/${member.id}`);
    await request("/api/tickets");
    await request(`/api/tasks?assigned_to=${encodeURIComponent(member.employee_id)}`);
    await request(`/api/notifications?employee_id=${encodeURIComponent(member.employee_id)}`);
    await request(`/api/notifications/count?employee_id=${encodeURIComponent(member.employee_id)}`);

    const loginProbe = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: member.email,
        password: "__verification_wrong_password__",
        department: member.department,
      }),
    });
    expect([400, 401].includes(loginProbe.status), `Login route returned unexpected status ${loginProbe.status}.`);

    const ticketCreate = await request("/api/tickets/create", {
      method: "POST",
      body: JSON.stringify({
        caller: "Merge Verification",
        opened_by: member.id,
        assigned_to: member.id,
        location: "Verification",
        contact_type: "Email",
        category: "Software",
        urgency: "Medium",
        state: "Open",
        department: member.department,
        short_description: "Temporary ticket created by merge verification",
        notes: "This row should be cleaned up automatically.",
        due_date: new Date().toISOString().slice(0, 10),
      }),
    });
    ticketId = ticketCreate.data.id;
    expect(ticketId, "Create ticket did not return an id.");

    const ticketEdit = await request(`/api/tickets/${ticketId}`, {
      method: "PUT",
      body: JSON.stringify({
        ...ticketCreate.data,
        assigned_to: member.employee_id,
        department: member.department,
        short_description: "Temporary ticket edited by merge verification",
      }),
    });
    expect(ticketEdit.data.short_description.includes("edited"), "Edit ticket did not persist description.");

    const ticketAssign = await request(`/api/tickets/${ticketId}/assign`, {
      method: "PUT",
      body: JSON.stringify({ assigned_to: member.employee_id, department: member.department }),
    });
    expect(String(ticketAssign.data.assigned_to) === String(member.id), "Assign ticket did not persist team member id.");

    const ticketStatus = await request(`/api/tickets/${ticketId}/status`, {
      method: "PUT",
      body: JSON.stringify({ state: "Resolved" }),
    });
    expect(ticketStatus.data.state === "Resolved", "Ticket status update failed.");

    const ticketList = pickData(await request(`/api/tickets?assigned_to=${encodeURIComponent(member.employee_id)}`));
    expect(ticketList.some((ticket) => String(ticket.id) === String(ticketId)), "Assigned ticket was not returned in workspace filter.");

    const ticketDetails = await request(`/api/tickets/${ticketId}`);
    expect(String(ticketDetails.data.id) === String(ticketId), "Ticket details did not return the requested ticket.");

    const taskCreate = await request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: "Merge verification task",
        description: "Temporary task created by merge verification",
        assigned_to: member.employee_id,
        employee_name: member.name,
        department: member.department,
        priority: "Medium",
        due_date: new Date().toISOString().slice(0, 10),
        status: "Open",
      }),
    });
    taskId = taskCreate.task.id;
    expect(taskId, "Create task did not return an id.");

    const taskStatus = await request(`/api/tasks/${taskId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "In Progress" }),
    });
    expect(taskStatus.task.status === "In Progress", "Task status update failed.");

    const taskList = await request(`/api/tasks?assigned_to=${encodeURIComponent(member.employee_id)}`);
    expect(taskList.some((task) => String(task.id) === String(taskId)), "Assigned task was not returned in workspace filter.");

    const notifications = pickData(await request(`/api/notifications?employee_id=${encodeURIComponent(member.employee_id)}`));
    const ticketNotification = notifications.find(
      (notification) => notification.related_type === "ticket" && String(notification.related_id) === String(ticketId)
    );
    const taskNotification = notifications.find(
      (notification) => notification.related_type === "task" && String(notification.related_id) === String(taskId)
    );
    expect(ticketNotification?.link?.includes(`ticket=${ticketId}`), "Ticket assignment notification/navigation was not created.");
    expect(taskNotification?.link?.includes(`task=${taskId}`), "Task assignment notification/navigation was not created.");

    const readNotification = await request(`/api/notifications/${ticketNotification.id}/read`, { method: "PUT" });
    expect(readNotification.data.is_read === true, "Notification read status did not update.");

    console.log("merge flow verification passed");
  } finally {
    await cleanup({ ticketId, taskId });
    await pool.end();
  }
}

main().catch(async (err) => {
  console.error(err.message);
  try {
    await pool.end();
  } catch {
    // ignore shutdown errors
  }
  process.exit(1);
});
