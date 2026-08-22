import { Router } from 'express';
import { roomController } from '../controllers/roomController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Guests may only view rooms that are currently available for sale.
router.get('/', roomController.getPublicRooms.bind(roomController));
router.get('/:id', roomController.getPublicRoomById.bind(roomController));
router.get('/:id/reviews', roomController.getRoomReviews.bind(roomController));
router.post('/:id/reviews', authenticate, roomController.addRoomReview.bind(roomController));

export default router;
