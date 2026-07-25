const express = require("express");
const router  = express.Router();

const {
  getDepartmentStats,
  getDepartmentPerformance,
  getDepartmentPerformanceYears,
  getDepartmentHealth,
  getAllDepartmentMembers,
  getDepartmentMemberById,
  createDepartmentMember,
  updateDepartmentMember,
  deleteDepartmentMember,
  getSalesDashboard,
  getSalesMemberTasksDueToday,
  getDepartmentSummary,
} = require("../controllers/departmentController");

// Summary — all data in one call
router.get("/summary",     getDepartmentSummary);

// Stats cards
router.get("/stats",       getDepartmentStats);

// Performance chart
router.get("/performance", getDepartmentPerformance);
router.get("/performance/years", getDepartmentPerformanceYears);

// Health overview
router.get("/health",      getDepartmentHealth);

// Sales department page
router.get("/sales/dashboard", getSalesDashboard);
router.get("/sales/members/:id/tasks-due-today", getSalesMemberTasksDueToday);

// Members CRUD
router.get("/members",           getAllDepartmentMembers);
router.get("/members/:id",       getDepartmentMemberById);
router.post("/members",          createDepartmentMember);
router.put("/members/:id",       updateDepartmentMember);
router.delete("/members/:id",    deleteDepartmentMember);

module.exports = router;
