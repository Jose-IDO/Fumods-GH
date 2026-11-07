import { Request, Response } from 'express';
import { bookingService } from '../services/bookingService';
import { bookingRepository } from '../repositories/bookingRepository';
import { roomRepository } from '../repositories/roomRepository';
import { getIO } from "../utils/socket";
import { notificationRepository } from "../repositories/notificationRepository";

export const bookingController = {
  create: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const result = await bookingService.createPending(userId, req.body);

      const booking: any = (result as any).booking || result;
      const bookingId = booking?.id;

      // Get room name for notification
      let roomName = "your room";
      try {
        if (booking?.roomId) {
          const room = await roomRepository.findById(booking.roomId);
          roomName = room?.roomName || "your room";
        }
      } catch (err) {
        console.error('Failed to fetch room name:', err);
      }

      // Create notification for the user based on booking status
      try {
        if (userId && bookingId) {
          const bookingStatus = booking?.status || 'pending';
          let notificationMessage: string;
          
          if (bookingStatus === 'pending') {
            notificationMessage = `Your booking for ${roomName} has been made and is pending approval.`;
          } else {
            notificationMessage = `Your booking for ${roomName} is complete and confirmed!`;
          }
          
          await notificationRepository.create(
            String(userId), 
            notificationMessage, 
            String(bookingId), 
            'booking_confirmation'
          );
        }
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }

      const io = getIO();
      io?.emit("newBooking", {
        message: `New booking created by user ${userId}`,
        booking,
      });

      res.status(201).json({ ok: true, data: booking });
    } catch (e: any) {
      res.status(400).json({ ok: false, error: e.message });
    }
  },

  myBookings: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const limit = Math.max(1, Math.min(parseInt(String(req.query.limit ?? '20'), 10), 100));
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
      const statusParam = (req.query.status as string | undefined) || undefined; 
      const status = statusParam ? (statusParam.split(',').map(s => s.trim()).filter(Boolean) as Array<'pending'|'confirmed'|'cancelled'>) : undefined;
      const start = (req.query.start as string | undefined) || undefined; // YYYY-MM-DD
      const end = (req.query.end as string | undefined) || undefined;   // YYYY-MM-DD

      const { rows, paging } = await bookingService.myBookings(userId, { limit, page, status, start, end });

      const enriched = await Promise.all(rows.map(async (b) => {
        const room = await roomRepository.findById(b.roomId);
        const ci = new Date(b.checkIn);
        const co = new Date(b.checkOut);
        const nights = Math.max(1, Math.ceil((co.getTime() - ci.getTime()) / (1000*60*60*24)));
        return {
          id: b.id,
          bookingId: b.id,
          hotelName: 'Fumods Guesthouse',
           roomType: room?.roomType || 'Room',
           roomName: room?.roomName || 'Room',
          roomId: b.roomId,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          nights,
          totalPrice: b.totalPrice,
          status: b.status,
          createdAt: b.createdAt,
          paymentReference: b.paymentReference,
        };
      }));

      res.json({ ok: true, data: enriched, paging });
    } catch (e: any) {
      res.status(400).json({ ok: false, error: e.message });
    }
  },

  getByReference: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { reference } = req.params;

      const booking = await bookingRepository.findByPaymentReference(reference);
      if (!booking) return res.status(404).json({ ok: false, error: 'Booking not found' });

      if (booking.userId !== userId)
        return res.status(403).json({ ok: false, error: 'Access denied' });

      const room = await roomRepository.findById(booking.roomId);

      res.json({
        ok: true,
        booking: {
          ...booking,
          roomType: room?.roomType || 'Room',
          hotelName: 'Fumods Guesthouse',
        },
      });
    } catch (e: any) {
      res.status(400).json({ ok: false, error: e.message });
    }
  },

  cancelBooking: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const cancelled = await bookingService.cancelBooking(id, userId);
      if (!cancelled)
        return res.status(404).json({ ok: false, error: 'Booking not found or cannot be cancelled' });
      
      // Delete notifications related to this booking
      try {
        await notificationRepository.deleteByBookingId(id);
      } catch (notifError) {
        console.error('Failed to delete notifications:', notifError);
      }
      
      res.json({ ok: true, data: cancelled });
    } catch (e: any) {
      res.status(400).json({ ok: false, error: e.message });
    }
  },

  listAll: async (_req: Request, res: Response) => {
    try {
      const bookings = await bookingService.listAll();
      res.json({ ok: true, data: bookings });
    } catch (e: any) {
      res.status(400).json({ ok: false, error: e.message });
    }
  },

  updateStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: 'pending' | 'confirmed' | 'cancelled' };
      const updated = await bookingService.updateStatus(id, status);
      if (!updated) return res.status(404).json({ ok: false, error: 'Not found' });
      
      // Notify user about status change
      const booking = await bookingRepository.findById(id);
      if (booking) {
        // Get room name for notification
        let roomName = "your room";
        try {
          if (booking.roomId) {
            const room = await roomRepository.findById(booking.roomId);
            roomName = room?.roomName || "your room";
          }
        } catch (err) {
          console.error('Failed to fetch room name:', err);
        }
        
        const statusMessages: Record<string, string> = {
          confirmed: `Your booking for ${roomName} has been approved and confirmed!`,
          cancelled: `Your booking for ${roomName} has been cancelled.`,
          pending: `Your booking for ${roomName} status has been updated to pending approval.`
        };
        await notificationRepository.create(
          String(booking.userId),
          statusMessages[status] || `Your booking status has been updated to ${status}.`,
          String(id),
          'booking_update'
        );
      }
      
      res.json({ ok: true, data: updated });
    } catch (e: any) {
      res.status(400).json({ ok: false, error: e.message });
    }
  },

  availability: async (req: Request, res: Response) => {
    try {
      const start = (req.query.start as string) || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
      const end = (req.query.end as string) || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);
      const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

      const rooms = await roomRepository.findAll('active');
      const roomUnits: Record<string, number> = {};
      rooms.forEach(r => { roomUnits[r.id] = r.units?.length || 0; });

      const bookings = await bookingRepository.findInRange(start, end);

      const dates: string[] = [];
      for (let d = new Date(start); d <= new Date(end); d.setDate(d.getDate() + 1)) {
        dates.push(fmt(d));
      }

      const result = rooms.map(r => ({
        roomId: r.id,
        roomName: r.roomName,
        roomType: r.roomType,
        totalUnits: roomUnits[r.id] || 0,
        dates: {} as Record<string,'available'|'booked'>
      }));

      const byRoom: Record<string, typeof result[number]> = Object.fromEntries(result.map(r => [r.roomId, r]));
      dates.forEach(date => result.forEach(r => { r.dates[date]='available'; }));

      const occ: Record<string, Record<string,number>> = {};
      bookings.forEach(b => {
        if(!occ[b.roomId]) occ[b.roomId]={};
        const ci = new Date(b.checkIn);
        const co = new Date(b.checkOut);
        for(let d=new Date(ci); d<co; d.setDate(d.getDate()+1)){
          const day = fmt(d);
          if(day<dates[0] || day>dates[dates.length-1]) continue;
          occ[b.roomId][day] = (occ[b.roomId][day]||0) + (b.roomCount||1);
        }
      });

      Object.entries(occ).forEach(([roomId,map])=>{
        const total = roomUnits[roomId]||0;
        const target = byRoom[roomId];
        if(!target) return;
        Object.entries(map).forEach(([day,count])=>{
          if(total>0 && count>=total) target.dates[day]='booked';
        });
      });

      return res.json({ ok: true, data: result, range: { start, end } });
    } catch(e: any) {
      return res.status(400).json({ ok:false, error:e.message });
    }
  },

  bookedDates: async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
      const defaultEnd = new Date(now.getFullYear(), now.getMonth()+1,0).toISOString().slice(0,10);

      const start = (req.query.start as string) || defaultStart;
      const end = (req.query.end as string) || defaultEnd;
      const roomId = (req.query.roomId as string) || undefined;

      const bookings = await bookingRepository.findInRange(start, end);
      const filtered = roomId ? bookings.filter(b => b.roomId===roomId) : bookings;

      return res.json({ ok:true, data:filtered, range:{start,end}, filter:{roomId} });
    } catch(e:any){
      return res.status(400).json({ ok:false, error:e.message });
    }
  }
};
