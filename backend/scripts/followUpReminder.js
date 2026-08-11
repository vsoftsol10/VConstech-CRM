const cron = require("node-cron");
const { runFollowUpReminderJob } = require("../services/followUpReminderService");

const scheduleFollowUpReminderJob = () => {
  const task = cron.schedule("5 0 * * *", async () => {
    try {
      await runFollowUpReminderJob();
    } catch (error) {
      console.error("[ReminderScheduler] Job failed:", error.message);
    }
  });

  console.log("[ReminderScheduler] Lead follow-up reminder job scheduled for 08:00 daily.");
  return task;
};

module.exports = scheduleFollowUpReminderJob();
