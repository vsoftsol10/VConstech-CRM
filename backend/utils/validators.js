const crypto = require("crypto");

// ── Generate Random Password ────────────────────────────────────────────────
const generatePassword = () => {
  return crypto.randomBytes(12).toString("base64url").slice(0, 12);
};

// ── Validate Email ──────────────────────────────────────────────────────────
const isValidEmail = (email) => {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
};

// ── Validate Phone ──────────────────────────────────────────────────────────
const isValidPhone = (phone) => {
  return /^[0-9]{10}$/.test(phone);
};

// ── Generate Employee ID ────────────────────────────────────────────────────
const generateEmployeeId = async (pool, department) => {
  const deptCode = department.substring(0, 3).toUpperCase();
  
  const lastMember = await pool.query(
    `SELECT employee_id FROM team_members
     WHERE employee_id ILIKE $1
     ORDER BY created_at DESC LIMIT 1`,
    [`EMP-${deptCode}-%`]
  );

  let nextNumber = 1;
  if (lastMember.rows.length > 0) {
    const match = lastMember.rows[0].employee_id.match(/-(\d+)$/);
    if (match) nextNumber = Number(match[1]) + 1;
  }

  return `EMP-${deptCode}-${String(nextNumber).padStart(2, "0")}`;
};

// ── Format Date ─────────────────────────────────────────────────────────────
const formatDate = (date) => {
  if (!date) return null;
  if (typeof date === "string") return date;
  return date.toISOString().split("T")[0];
};

module.exports = {
  generatePassword,
  isValidEmail,
  isValidPhone,
  generateEmployeeId,
  formatDate,
};
