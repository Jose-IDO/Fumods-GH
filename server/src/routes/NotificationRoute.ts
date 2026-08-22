import { Router } from "express";
import { notificationRepository } from "../repositories/notificationRepository";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(400).json({ ok: false, error: 'User ID not found' });
    }

    const notifications = await notificationRepository.getUserNotifications(userId);
    res.json({ ok: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.put("/:id/read", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Not authenticated' });
    }

    const { id } = req.params;
    const updated = await notificationRepository.markAsRead(id, userId);

    if (!updated) {
      return res.status(404).json({ ok: false, error: 'Notification not found or access denied' });
    }

    res.json({ ok: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Admin route to send promotional notifications
router.post("/broadcast", authenticate, requireRole(['super_admin', 'hotel_manager']), async (req, res) => {
  try {
    const { message, userIds } = req.body;

    if (!message) {
      return res.status(400).json({ ok: false, error: 'Message is required' });
    }

    let notifications;
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Send to specific users
      notifications = await notificationRepository.createBulk(userIds, message, 'promotion');
    } else {
      // Send to all users who have the customer role
      const usersSnapshot = await notificationRepository.getAllCustomerIds();
      notifications = await notificationRepository.createBulk(usersSnapshot, message, 'promotion');
    }

    res.json({ ok: true, data: notifications, count: notifications.length });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
