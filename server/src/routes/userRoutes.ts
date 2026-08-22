import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// POST /admin/users
router.post('/', authenticate, requireRole(['super_admin', 'hotel_manager']), (req, res) => userController.createAdmin(req, res));

// GET /admin/users
router.get('/', authenticate, requireRole(['super_admin', 'hotel_manager']), (req, res) => userController.list(req, res));

// GET /admin/users/admins
router.get('/admins', authenticate, requireRole(['super_admin', 'hotel_manager']), (req, res) => userController.listAdmins(req, res));

// PATCH /admin/users/:id/deactivate
router.patch('/:id/deactivate', authenticate, requireRole(['super_admin', 'hotel_manager']), (req, res) => userController.deactivate(req, res));

// PATCH /admin/users/:id/activate
router.patch('/:id/activate', authenticate, requireRole(['super_admin', 'hotel_manager']), (req, res) => userController.activate(req, res));

export default router;
