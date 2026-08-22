import express from 'express';
import cors from 'cors';
import passport from './config/passport';
import roomRoutes from './routes/roomRoutes';
import publicRoomRoutes from './routes/publicRoomRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import profileRoutes from './routes/profileRoutes';
import bookingRoutes from './routes/bookingRoutes';
import paymentsRoutes from './routes/paymentsRoutes';
import hotelSettingsRoutes from './routes/hotelSettingsRoutes';
import dealRoutes from './routes/dealRoutes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import eventRoutes from "./routes/eventRoutes";
import notificationRoutes from './routes/NotificationRoute';

const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use(logger);

app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Server is running' });
});

app.use('/auth', authRoutes);
app.use('/rooms', publicRoomRoutes);
app.use('/admin/rooms', roomRoutes);
app.use('/admin/users', userRoutes);
app.use('/users', profileRoutes);
app.use('/admin/deals', dealRoutes);
app.use('/deals', dealRoutes);
app.use('/bookings', bookingRoutes);
app.use('/payments', paymentsRoutes);
app.use('/settings', hotelSettingsRoutes);
app.use("/admin/events", eventRoutes);
app.use('/notifications', notificationRoutes);

app.use(errorHandler);

export default app;
