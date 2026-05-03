import express from "express";
import * as supervisorInternshipController from "../../controllers/v2/supervisorInternshipController.js";
import * as acceptanceWorkflowController from "../../controllers/v2/acceptanceWorkflowController.js";
import * as weeklyFollowUpController from "../../controllers/v2/weeklyFollowUpController.js";
import * as dashboardStatsController from "../../controllers/v2/dashboardStatsController.js";
import * as notificationController from "../../controllers/v2/notificationController.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { uploadCV } from "../../middlewares/uploadMiddleware.js";

const router = express.Router();

// Supervisor internship management
router.get("/supervisors/internships", authenticate, supervisorInternshipController.getSupervisorInternships);
router.post("/supervisors/internships", authenticate, supervisorInternshipController.createInternshipForSupervisor);
router.get("/supervisors/internships/:internshipId/students", authenticate, supervisorInternshipController.getSupervisorStudents);
router.post(
	"/supervisors/internships/:internshipId/students",
	authenticate,
	uploadCV.single("cv"),
	supervisorInternshipController.addStudentToInternship
);
router.post("/supervisors/students/accept", authenticate, supervisorInternshipController.acceptStudent);
router.delete(
	"/supervisors/internships/:internshipId/students/:internId",
	authenticate,
	supervisorInternshipController.deleteStudentFromInternship
);

// Student acceptance workflows
router.get("/students/acceptance-workflows", authenticate, acceptanceWorkflowController.getStudentAcceptanceWorkflows);
router.post("/students/acceptance/confirm", authenticate, acceptanceWorkflowController.confirmAcceptance);

// Weekly follow-ups
router.get("/students/interns/:internId/follow-ups", authenticate, weeklyFollowUpController.getStudentWeeklyFollowUps);
router.post("/students/interns/follow-up", authenticate, weeklyFollowUpController.submitWeeklyFollowUp);
router.get("/supervisors/internships/:internshipId/follow-ups", authenticate, weeklyFollowUpController.getSupervisorFollowUps);

// Dashboard stats
router.get("/dashboard/supervisor", authenticate, dashboardStatsController.getSupervisorDashboardStats);
router.get("/dashboard/student", authenticate, dashboardStatsController.getStudentDashboardStats);
router.get("/dashboard/admin", authenticate, dashboardStatsController.getAdminDashboardStats);

// Notifications
router.get("/notifications/unread-count", authenticate, notificationController.getUnreadNotificationCount);
router.get("/notifications", authenticate, notificationController.getNotifications);
router.patch("/notifications/:notificationId/read", authenticate, notificationController.markNotificationAsRead);
router.patch("/notifications/mark-all-read", authenticate, notificationController.markAllNotificationsAsRead);

// n8n webhook for CV parsing (optionally protected by x-webhook-token)
router.post("/webhooks/cv-parsed", supervisorInternshipController.n8nCvParsedWebhook);

export default router;
