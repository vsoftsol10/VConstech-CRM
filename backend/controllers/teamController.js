// const bcrypt = require("bcrypt");
const bcrypt = require('bcryptjs');

const fs = require("fs");
const path = require("path");
const pool = require("../config/database");
const { sendWelcomeEmail } = require("../utils/emailUtil");
const { generatePassword, generateEmployeeId, isValidEmail, isValidPhone } = require("../utils/validators");

// ── GET all team members ────────────────────────────────────────────────────
const getAllTeamMembers = async (req, res) => {
  try {
    const result = await pool.query(`
      WITH lead_counts AS (
        SELECT tm.id AS member_id, COUNT(l.id)::int AS lead_count
        FROM team_members tm
        LEFT JOIN leads l
          ON l.assigned_to::text = tm.id::text
          OR l.assigned_to::text = tm.employee_id::text
        GROUP BY tm.id
      ),
      task_counts AS (
        SELECT tm.id AS member_id, COUNT(t.id)::int AS task_count
        FROM team_members tm
        LEFT JOIN tasks t
          ON t.assigned_to::text = tm.employee_id::text
          OR t.assigned_to::text = tm.id::text
        GROUP BY tm.id
      ),
      ticket_counts AS (
        SELECT tm.id AS member_id, COUNT(tk.id)::int AS ticket_count
        FROM team_members tm
        LEFT JOIN tickets tk
          ON tk.assigned_to::text = tm.id::text
          OR tk.assigned_to::text = tm.employee_id::text
        GROUP BY tm.id
      )
      SELECT 
        tm.id,
        tm.name,
        tm.phone,
        tm.email,
        tm.department,
        tm.role,
        tm.designation,
        tm.employee_id,
        tm.date_joined,
        tm.profile_image,
        tm.created_at,
        COALESCE(lc.lead_count, 0)::int AS lead_count,
        COALESCE(tc.task_count, 0)::int AS task_count,
        COALESCE(tkc.ticket_count, 0)::int AS ticket_count
      FROM team_members tm
      LEFT JOIN lead_counts lc ON lc.member_id = tm.id
      LEFT JOIN task_counts tc ON tc.member_id = tm.id
      LEFT JOIN ticket_counts tkc ON tkc.member_id = tm.id
      ORDER BY tm.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /team error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── GET single team member ──────────────────────────────────────────────────
const getTeamMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        id, name, phone, email, department, role,
        designation, employee_id, date_joined,
        profile_image, created_at
       FROM team_members
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /team/:id error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST add team member ────────────────────────────────────────────────────
const addTeamMember = async (req, res) => {
  try {
    const { name, phone, email, department, role, designation, dateJoined } = req.body;
    const profileImage = req.file?.filename || null;

    if (!name || !phone || !email || !department || !role || !designation || !dateJoined) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ success: false, message: "Phone number must contain 10 digits" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Email must be a valid @gmail.com address" });
    }

    const emailCheck = await pool.query("SELECT id FROM team_members WHERE email = $1", [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const phoneCheck = await pool.query("SELECT id FROM team_members WHERE phone = $1", [phone]);
    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Phone number already exists" });
    }

    const employeeId = await generateEmployeeId(pool, department);
    const autoPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(autoPassword, 10);

    const result = await pool.query(
      `INSERT INTO team_members
       (name, phone, email, department, role, designation, employee_id, date_joined, profile_image, password)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [name, phone, email, department, role, designation, employeeId, dateJoined || null, profileImage, hashedPassword]
    );

    await sendWelcomeEmail(name, email, employeeId, autoPassword);

    res.status(201).json({
      success: true,
      message: "Team member added successfully",
      member: result.rows[0],
      employeeId,
    });

  } catch (err) {
    console.error("POST /team error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT update team member ──────────────────────────────────────────────────
const updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, department, role, designation, dateJoined } = req.body;

    if (!name || !phone || !email || !department || !role || !designation || !dateJoined) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ success: false, message: "Phone number must contain 10 digits" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Email must be a valid @gmail.com address" });
    }

    const emailCheck = await pool.query(
      "SELECT id FROM team_members WHERE email = $1 AND id != $2",
      [email, id]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const phoneCheck = await pool.query(
      "SELECT id FROM team_members WHERE phone = $1 AND id != $2",
      [phone, id]
    );
    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Phone number already exists" });
    }

    let imageUpdate = "";
    const values = [name, phone, email, department, role, designation, dateJoined || null];

    if (req.file) {
      const old = await pool.query("SELECT profile_image FROM team_members WHERE id = $1", [id]);
      const oldFile = old.rows[0]?.profile_image;
      if (oldFile) {
        const oldPath = path.join(__dirname, "../uploads", oldFile);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      imageUpdate = ", profile_image = $8";
      values.push(req.file.filename);
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE team_members
       SET name=$1, phone=$2, email=$3, department=$4,
           role=$5, designation=$6, date_joined=$7${imageUpdate}
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    res.json({
      success: true,
      message: "Team member updated successfully",
      member: result.rows[0],
      employeeId: result.rows[0].employee_id,
    });

  } catch (err) {
    console.error("PUT /team/:id error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE team member ──────────────────────────────────────────────────────
const deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;

    const old = await pool.query("SELECT profile_image FROM team_members WHERE id = $1", [id]);
    const oldFile = old.rows[0]?.profile_image;
    if (oldFile) {
      const oldPath = path.join(__dirname, "../uploads", oldFile);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const result = await pool.query(
      "DELETE FROM team_members WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    res.json({ success: true, message: "Team member deleted" });

  } catch (err) {
    console.error("DELETE /team/:id error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getRoles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT TRIM(role) AS role
      FROM team_members
      WHERE role IS NOT NULL AND TRIM(role) <> ''
      ORDER BY role ASC
    `);

    res.json(result.rows.map((row) => row.role));
  } catch (err) {
    console.error("GET /team/roles error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch roles",
    });
  }
};

const getDepartments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT TRIM(department) AS department
      FROM team_members
      WHERE department IS NOT NULL AND TRIM(department) <> ''
      ORDER BY department ASC
    `);

    res.json(result.rows.map((row) => row.department));
  } catch (err) {
    console.error("GET /team/departments error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
    });
  }
};

module.exports = {
  getAllTeamMembers,
  getTeamMemberById,
  getRoles,
  getDepartments,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
};
