import express from "express";
import { getAllEvents, createEvent, updateEvent, deleteEvent } from "../controllers/eventController";
import { authenticate, requireRole } from "../middleware/auth";
import { upload } from "../config/upload";

const router = express.Router();
router.use(authenticate, requireRole(['super_admin', 'hotel_manager']));

// Routes
router.get("/", getAllEvents);
router.post("/", upload.single("image"), createEvent);
router.put("/:id", upload.single("image"), updateEvent);
router.delete("/:id", deleteEvent);

export default router;