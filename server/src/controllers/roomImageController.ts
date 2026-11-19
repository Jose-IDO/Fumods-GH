import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import cloudinary from '../config/cloudinary';
import { roomRepository } from '../repositories/roomRepository';

export const roomImageController = {
  sign: async (req: Request, res: Response) => {
    try {
      const room = await roomRepository.findById(req.params.id);
      if (!room) return res.status(404).json({ ok: false, error: 'Room not found' });
      if ((room.images || []).length >= 20) return res.status(400).json({ ok: false, error: 'Room can have maximum 20 images' });
      const config = cloudinary.config();
      if (!config.api_key || !config.api_secret || !config.cloud_name) return res.status(503).json({ ok: false, error: 'Image storage is not configured' });
      const params = { timestamp: Math.floor(Date.now() / 1000), public_id: `rooms/${room.id}/${randomUUID()}` };
      const signature = cloudinary.utils.api_sign_request(params, config.api_secret);
      return res.json({ ok: true, data: { cloudName: config.cloud_name, apiKey: config.api_key, signature, params } });
    } catch {
      return res.status(500).json({ ok: false, error: 'Unable to prepare image upload' });
    }
  },
  complete: async (req: Request, res: Response) => {
    try {
      const publicId = req.body?.publicId;
      if (typeof publicId !== 'string' || !publicId.startsWith(`rooms/${req.params.id}/`) || publicId.length > 300) {
        return res.status(400).json({ ok: false, error: 'Invalid room image' });
      }
      const resource = await cloudinary.api.resource(publicId, { resource_type: 'image', type: 'upload' });
      if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(resource.format) || resource.bytes > 10 * 1024 * 1024 || typeof resource.secure_url !== 'string') {
        return res.status(400).json({ ok: false, error: 'Only JPEG, PNG, WEBP or GIF images up to 10MB are allowed' });
      }
      const room = await roomRepository.addImages(req.params.id, [resource.secure_url]);
      if (!room) return res.status(404).json({ ok: false, error: 'Room not found' });
      return res.json({ ok: true, data: room });
    } catch (error) {
      return res.status(400).json({ ok: false, error: error instanceof Error ? error.message : 'Unable to save uploaded image' });
    }
  },
};
