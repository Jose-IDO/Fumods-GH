import { Request, Response } from 'express';
import { roomService } from '../services/roomService';
import { validateRoomPayload } from '../utils/validators';
import { RoomPayload } from '../types/room.types';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';
import { roomRepository } from '../repositories/roomRepository';

export class RoomController {
  // Public room catalogue. Archived rooms must never be exposed to guests.
  async getPublicRooms(_req: Request, res: Response): Promise<void> {
    try {
      const rooms = await roomService.getAllRooms('active');
      res.json({ ok: true, data: rooms });
    } catch (error) {
      console.error('Error fetching public rooms:', error);
      res.status(500).json({ ok: false, error: 'Failed to fetch rooms' });
    }
  }

  async getPublicRoomById(req: Request, res: Response): Promise<void> {
    try {
      const room = await roomService.getRoomById(req.params.id);
      if (!room || room.status !== 'active') {
        res.status(404).json({ ok: false, error: 'Room not found' });
        return;
      }
      res.json({ ok: true, data: room });
    } catch (error) {
      console.error('Error fetching public room:', error);
      res.status(500).json({ ok: false, error: 'Failed to fetch room' });
    }
  }

  // Get all rooms, optionally filtered by status
  async getAllRooms(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as 'active' | 'archived' | undefined;
      const rooms = await roomService.getAllRooms(status);
      res.json({ ok: true, data: rooms });
    } catch (error) {
      console.error('Error fetching rooms:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch rooms';
      res.status(500).json({ ok: false, error: errorMessage });
    }
  }

  // Get a room by ID
  async getRoomById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const room = await roomService.getRoomById(id);

      if (!room) {
        res.status(404).json({ ok: false, error: 'Room not found' });
        return;
      }

      res.json({ ok: true, data: room });
    } catch (error) {
      res.status(500).json({ ok: false, error: 'Failed to fetch room' });
    }
  }

  // Create a new room
  async createRoom(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as Partial<RoomPayload>;

      const validation = validateRoomPayload(body);
      if (!validation.valid) {
        res.status(400).json({ ok: false, error: validation.error });
        return;
      }

      const newRoom = await roomService.createRoom(body as RoomPayload);
      res.status(201).json({ ok: true, data: newRoom });
    } catch (error) {
      res.status(500).json({ ok: false, error: 'Failed to create room' });
    }
  }

  // Update a room
  async updateRoom(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body as Partial<RoomPayload>;

      const updatedRoom = await roomService.updateRoom(id, updates);

      if (!updatedRoom) {
        res.status(404).json({ ok: false, error: 'Room not found' });
        return;
      }

      res.json({ ok: true, data: updatedRoom });
    } catch (error) {
      res.status(500).json({ ok: false, error: 'Failed to update room' });
    }
  }

  // Delete a room
  async deleteRoom(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await roomService.deleteRoom(id);

      if (!deleted) {
        res.status(404).json({ ok: false, error: 'Room not found' });
        return;
      }

      res.json({ ok: true, data: { message: 'Room deleted successfully' } });
    } catch (error) {
      res.status(500).json({ ok: false, error: 'Failed to delete room' });
    }
  }

  // Archive a room
  async archiveRoom(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const archived = await roomService.archiveRoom(id);

      if (!archived) {
        res.status(404).json({ ok: false, error: 'Room not found' });
        return;
      }

      res.json({ ok: true, data: archived });
    } catch (error) {
      res.status(500).json({ ok: false, error: 'Failed to archive room' });
    }
  }

  // Restore a room
  async restoreRoom(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const restored = await roomService.restoreRoom(id);

      if (!restored) {
        res.status(404).json({ ok: false, error: 'Room not found' });
        return;
      }

      res.json({ ok: true, data: restored });
    } catch (error) {
      res.status(500).json({ ok: false, error: 'Failed to restore room' });
    }
  }

  // Fetch reviews for a specific room
  async getRoomReviews(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const reviews = await roomService.getRoomReviews(id);

      if (!reviews) {
        res.status(404).json({ ok: false, error: 'No reviews found for this room' });
        return;
      }

      res.json({ ok: true, data: reviews });
    } catch (error) {
      res.status(500).json({ ok: false, error: 'Failed to fetch room reviews' });
    }
  }

  // Add a review to a room
  async addRoomReview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // room ID
      const { rating, comment } = req.body;
      const authenticatedUser = req.user as any;
      const name = `${authenticatedUser?.firstName || ''} ${authenticatedUser?.lastName || ''}`.trim()
        || authenticatedUser?.email
        || 'Guest';

      if (!rating || !comment || Number(rating) < 1 || Number(rating) > 5) {
        res.status(400).json({ ok: false, error: 'A rating from 1 to 5 and a comment are required' });
        return;
      }

      const newReview = await roomService.addRoomReview(id, { name, rating, comment });
      res.status(201).json({ ok: true, data: newReview });
    } catch (error) {
      console.error('Error adding room review:', error);
      res.status(500).json({ ok: false, error: 'Failed to add room review' });
    }
  }

  // Helper to upload buffer to Cloudinary
  private uploadToCloudinary(buffer: Buffer, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result!.secure_url);
          }
        }
      );
      Readable.from(buffer).pipe(stream);
    });
  }

  // Upload images for a room
  async uploadRoomImages(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ ok: false, error: 'No images provided' });
        return;
      }

      console.log(`Uploading ${files.length} image(s) for room ${id}`);

      // Upload all images to Cloudinary
      const uploadPromises = files.map((file) =>
        this.uploadToCloudinary(file.buffer, 'rooms')
      );

      const imageUrls = await Promise.all(uploadPromises);
      console.log(`Successfully uploaded ${imageUrls.length} image(s) to Cloudinary`);

      // Add image URLs to the room
      const updatedRoom = await roomRepository.addImages(id, imageUrls);

      if (!updatedRoom) {
        res.status(404).json({ ok: false, error: 'Room not found' });
        return;
      }

      res.json({ ok: true, data: updatedRoom });
    } catch (error) {
      console.error('Error uploading room images:', error);
      res.status(500).json({ 
        ok: false, 
        error: error instanceof Error ? error.message : 'Failed to upload images' 
      });
    }
  }

  // Delete an image from a room
  async deleteRoomImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;

      if (!imageUrl) {
        res.status(400).json({ ok: false, error: 'Image URL is required' });
        return;
      }

      // Remove image URL from the room
      const updatedRoom = await roomRepository.removeImage(id, imageUrl);

      if (!updatedRoom) {
        res.status(404).json({ ok: false, error: 'Room not found' });
        return;
      }

      // Optionally delete from Cloudinary (extract public_id from URL)
      try {
        const urlParts = imageUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = `rooms/${filename.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted image from Cloudinary: ${publicId}`);
      } catch (cloudinaryError) {
        console.warn('Failed to delete from Cloudinary (non-critical):', cloudinaryError);
        // Continue even if Cloudinary deletion fails
      }

      res.json({ ok: true, data: updatedRoom });
    } catch (error) {
      console.error('Error deleting room image:', error);
      res.status(500).json({ 
        ok: false, 
        error: error instanceof Error ? error.message : 'Failed to delete image' 
      });
    }
  }
}

export const roomController = new RoomController();
