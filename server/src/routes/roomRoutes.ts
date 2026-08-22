import { Router } from 'express';
import { roomController } from '../controllers/roomController';
import { authenticate, requireRole } from '../middleware/auth';
import { upload } from '../config/upload';

const router = Router();
router.use(authenticate, requireRole(['super_admin', 'hotel_manager']));

router.get('/:id/reviews', roomController.getRoomReviews.bind(roomController));
router.post('/:id/reviews', roomController.addRoomReview.bind(roomController));
router.get('/', roomController.getAllRooms.bind(roomController));
router.get('/:id', roomController.getRoomById.bind(roomController));
router.post('/', roomController.createRoom.bind(roomController));
router.put('/:id', roomController.updateRoom.bind(roomController));
router.patch('/:id/archive', roomController.archiveRoom.bind(roomController));
router.patch('/:id/restore', roomController.restoreRoom.bind(roomController));
router.delete('/:id', roomController.deleteRoom.bind(roomController));

// Image upload routes
router.post('/:id/images', upload.array('images', 10), roomController.uploadRoomImages.bind(roomController));
router.delete('/:id/images', roomController.deleteRoomImage.bind(roomController));

export default router;