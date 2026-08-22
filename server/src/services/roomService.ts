import { Review, Room, RoomPayload } from '../types/room.types';
import { roomRepository } from '../repositories/roomRepository';
import { reviewRepository } from '../repositories/reviewReposotory';

export class RoomService {
  async getAllRooms(status?: 'active' | 'archived'): Promise<Room[]> {
    return roomRepository.findAll(status);
  }

  async getRoomById(id: string): Promise<Room | null> {
    return roomRepository.findById(id);
  }

  async createRoom(payload: RoomPayload): Promise<Room> {
    return roomRepository.create(payload);
  }

  async updateRoom(id: string, updates: Partial<RoomPayload>): Promise<Room | null> {
    return roomRepository.update(id, updates);
  }

  async deleteRoom(id: string): Promise<boolean> {
    return roomRepository.delete(id);
  }

  async archiveRoom(id: string): Promise<Room | null> {
    return roomRepository.archive(id);
  }

  async restoreRoom(id: string): Promise<Room | null> {
    return roomRepository.restore(id);
  }

  async getRoomReviews(roomId: string): Promise<Review[]> {
    return reviewRepository.findByRoomId(roomId);
  }

  async addRoomReview(
    roomId: string,
    review: { name: string; rating: number; comment: string } // <- use "name"
  ): Promise<Review> {
    return reviewRepository.create({
      roomId,
      name: review.name,          // must match repository
      rating: review.rating,
      comment: review.comment,
      createdAt: new Date(),      // required for timestamp
    });
  }
}

export const roomService = new RoomService();