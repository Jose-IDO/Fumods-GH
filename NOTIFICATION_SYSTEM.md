# Notification System Documentation

> NOTE: This document contains legacy PostgreSQL/Supabase examples. The current backend runtime has been migrated to Firebase Firestore and no longer uses SQL-based persistence.

## Overview
The notification bell system allows users to receive real-time notifications for booking confirmations, booking updates, and promotional messages from the hotel.

## Features

### 1. **Notification Bell in Navbar**
- Located in the LoggedInNavbar component
- Shows unread notification count badge
- Click to open dropdown with recent notifications
- Auto-refreshes every 30 seconds

### 2. **Notification Types**
- `booking_confirmation` - Sent when a new booking is created
- `booking_update` - Sent when booking status changes (confirmed/cancelled)
- `promotion` - Promotional messages sent by admin
- `general` - Other general notifications

### 3. **Admin Promotional Notifications**
- Admins can send promotional notifications to all users
- Accessible via Admin Dashboard → Promotions
- Broadcasts to all registered guest users
- Examples: Sales, events, special offers

## Backend Implementation

### Database Schema
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'general',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Note:** The schema was updated to use UUID types for `user_id` and `booking_id` to match the users and bookings tables.

### API Endpoints

#### Get User Notifications
```
GET /notifications
Authorization: Bearer <token>
Response: { ok: true, data: [...notifications] }
```

#### Mark Notification as Read
```
PUT /notifications/:id/read
Authorization: Bearer <token>
Response: { ok: true, data: {...updated} }
```

#### Send Promotional Notification (Admin Only)
```
POST /notifications/broadcast
Authorization: Bearer <token>
Body: { 
  message: "Promotion text",
  userIds: ["uuid1", "uuid2"] // optional, if not provided sends to all customer role users
}
Response: { ok: true, count: 150, data: [...notifications] }
```

**Authorization:** Requires `admin` or `super_admin` role. The endpoint checks user roles array for authorization.

### Automatic Notifications

#### Booking Creation
When a user creates a booking:
```typescript
// Fetch room name from database
const room = await roomRepository.findById(booking.roomId);
const roomName = room?.roomName || "your room";

await notificationRepository.create(
  String(userId), 
  `New booking created for ${roomName}`, 
  String(bookingId), 
  'booking_confirmation'
);
```

**Note:** Room name is fetched dynamically from the database to provide meaningful notifications.

#### Booking Status Update
When admin updates booking status:
```typescript
const statusMessages: Record<string, string> = {
  confirmed: `Your booking has been confirmed!`,
  cancelled: `Your booking has been cancelled.`,
  pending: `Your booking status has been updated to pending.`
};

await notificationRepository.create(
  String(booking.userId),
  statusMessages[status] || `Your booking status has been updated to ${status}.`,
  String(bookingId),
  'booking_update'
);
```

#### Booking Cancellation
When a user cancels a booking, associated notifications are automatically deleted:
```typescript
await notificationRepository.deleteByBookingId(bookingId);
```

## Frontend Implementation

### Notification Bell Component
Located in: 
- `src/Components/LoggedInNavbar/LoggedInNavbar.tsx` - For logged-in dashboard navbar
- `src/Components/Navbar/Navbar.tsx` - For public/landing page navbar (when user is authenticated)

Features:
- Polls for new notifications every 30 seconds
- Shows unread count badge (displays "9+" for 10+ notifications)
- Dropdown with recent 10 notifications
- Click notification to mark as read and navigate to relevant page
- Click "View all notifications" to see full list
- Click outside dropdown to close it
- Uses `hotel_token` from localStorage for authentication

#### Smart Navigation
- **Booking Confirmation/Update notifications:** Navigate to `/profile?tab=bookings&highlight={bookingId}`
  - Automatically switches to Bookings tab
  - Highlights the specific booking with animated border
  - Scrolls to center the booking on screen
- **Promotion notifications:** Stay on current page (informational only)
- **General notifications:** Just mark as read

### Admin Promotion Sender
Located in: `src/Pages/admin_dashboard/SendPromotion.tsx`

Features:
- Text area for promotion message (500 char limit)
- Character counter
- Example promotions for reference
- Sends to all users with `customer` role
- Success/error feedback with count
- Accessible via Admin Sidebar → "Send Promotions"

**Access:** Available to users with `admin` or `super_admin` role.

## Setup Instructions

### 1. Database Migrations

#### Add Type Column
Run the migration script to add the `type` column:

```bash
cd server
node src/scripts/addNotificationTypeColumn.js
```

#### Fix UUID Types (REQUIRED)
Run this migration to change `user_id` and `booking_id` from INT to UUID:

**Option 1: Via API Endpoint**
```bash
curl -X POST http://localhost:3000/admin/migrations/run-uuid-migration
```

**Option 2: Via SQL**
Execute `server/src/sql/013_fix_notification_uuid_types.sql` in your database client.

**Note:** This migration will truncate existing notifications as INT values cannot be converted to UUID.

### 2. Environment Variables
Ensure your `.env` has:
```
DATABASE_URL=postgresql://user:password@localhost:5432/hotel_db
JWT_SECRET=your_jwt_secret
```

### 3. Test the System

#### As User:
1. Log in as a guest user
2. Create a booking
3. Check notification bell - should show booking confirmation
4. Admin updates booking status
5. Check bell again - should show update notification

#### As Admin:
1. Log in as admin
2. Navigate to Admin Dashboard → Promotions
3. Enter promotional message
4. Click "Send to All Users"
5. Users will receive the promotion in their notification bell

## Styling
Notification components use modern design:
- Clean white dropdown with shadows
- Pink gradient header (`#F93448` to `#d62639`)
- Smooth slide-down animations
- Hover effects on notification items
- Unread indicator (red dot)
- Pink accent colors matching brand
- Mobile responsive design

## Future Enhancements
- [ ] Real-time WebSocket notifications (instead of polling)
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Notification preferences (opt-in/opt-out)
- [ ] Notification history page
- [ ] Push notifications for mobile
- [ ] Mark all as read functionality
- [ ] Delete individual notifications
- [ ] Notification categories/filters
- [ ] Automatic promotions on new deal creation
- [ ] Targeted promotions (by user segment, booking history, etc.)
- [ ] Scheduled promotions
- [ ] Notification sound effects

## Troubleshooting

### Notifications not appearing
1. Check user is authenticated (`isAuthenticated` is true)
2. Verify `hotel_token` exists in localStorage (not just `token`)
3. Check browser console for errors
4. Ensure backend server is running on port 3000
5. Check database notifications table has data with correct UUID types
6. Verify notification polling is active (check Network tab for `/notifications` requests every 30s)

### Promotion sending fails
1. Verify user has `admin` or `super_admin` role (check user.roles array)
2. Check network tab for API errors (401 = auth issue, 403 = permission issue)
3. Ensure database connection is active
4. Verify users with `customer` role exist in database
5. Check that `hotel_token` is being sent in Authorization header
6. Ensure user_roles and roles tables are properly configured

### Badge count incorrect
1. Clear local storage and refresh
2. Check if marking as read is working (PUT /notifications/:id/read)
3. Verify database `read` column updates correctly
4. Ensure unread count calculation filters correctly: `notifications.filter(n => !n.read).length`

### "Column role does not exist" error
This error occurs when the SQL query tries to use a `role` column that doesn't exist. The system uses a roles relationship table instead:
- Users have roles through `user_roles` join table
- Query should join `users` → `user_roles` → `roles` tables
- Filter by `roles.name = 'customer'` for guest users

## Code References

### Backend Files
- `server/src/repositories/notificationRepository.ts` - Database operations (create, createBulk, getUserNotifications, markAsRead, deleteByBookingId)
- `server/src/routes/NotificationRoute.ts` - API routes with authentication and role checks
- `server/src/controllers/bookingController.ts` - Auto-notifications on booking create/update/cancel
- `server/src/middleware/auth.ts` - JWT authentication middleware
- `server/src/routes/migrationRoutes.ts` - Database migration endpoint
- `server/src/scripts/addNotificationTypeColumn.js` - Type column migration
- `server/src/scripts/fixNotificationUuidTypes.js` - UUID type migration
- `server/src/sql/012_add_notification_type.sql` - Type column SQL
- `server/src/sql/013_fix_notification_uuid_types.sql` - UUID migration SQL

### Frontend Files
- `src/Components/LoggedInNavbar/LoggedInNavbar.tsx` - Notification bell for dashboard
- `src/Components/LoggedInNavbar/LoggedInNavbar.module.css` - Dashboard bell styling
- `src/Components/Navbar/Navbar.tsx` - Notification bell for public pages
- `src/Components/Navbar/Navbar.module.css` - Public navbar bell styling
- `src/Pages/admin_dashboard/SendPromotion.tsx` - Admin promo sender
- `src/Pages/admin_dashboard/SendPromotion.module.css` - Promo sender styling
- `src/Components/AdminSidebar/AdminSidebar.tsx` - Admin navigation with promotions link
- `src/Pages/UserProfile/UserProfile.tsx` - Booking highlight and scroll functionality
- `src/Pages/UserProfile/UserProfile.module.css` - Highlighted booking styles
