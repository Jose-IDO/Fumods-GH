# Delta Hotel Booking & Management System

A comprehensive hotel booking and management web application built with React, TypeScript, Node.js, and Firebase Firestore. This full-stack system allows customers to browse and book hotel rooms while providing administrators with complete hotel management capabilities.

## 🏨 Customer Interface Features

- **Landing Page**: Hero section with rotating image carousel, search functionality, and deals showcase
- **Room Browsing**: Browse available rooms with filtering, search, and detailed information
- **Hotel Details**: View hotel information, room galleries, filtering system, and FAQ section
- **Room Details**: Detailed room information, amenities, policies, and booking interface
- **Booking System**: Complete booking flow with guest information, date selection, and payment integration
- **Payment Processing**: Integrated Paystack payment gateway with tax calculation
- **User Profile**: View and manage bookings, profile information, and booking history
- **Notifications**: Real-time notification system for booking confirmations, updates, and promotions
- **Authentication**: Email/password and Google OAuth authentication with role-based access
- **Favorites**: Save favorite rooms and hotels
- **Responsive Design**: Mobile-friendly interface with modern UI/UX

## 🛠️ Admin Dashboard Features

- **Booking Management**: View, approve, cancel, and manage all bookings with status tracking
- **Room Management**: Add, edit, archive, and restore rooms with image uploads
- **Deal Management**: Create and manage promotional deals with status toggling
- **Event Management**: Create and manage hotel events
- **Guest Management**: View and manage guest accounts
- **Administrator Management**: Manage admin user accounts and roles
- **Promotional Notifications**: Send broadcast notifications to all users
- **Hotel Settings**: Configure hotel information, tax rates, and public settings
- **Statistics & Reports**: View booking and performance data
- **Role-Based Access**: Secure admin-only routes with role verification

## 🏗️ Technical Architecture

### Frontend
- **Framework**: React 19.1.1 with TypeScript 5.9.3
- **Build Tool**: Vite 7.1.7
- **Routing**: React Router DOM 7.9.4
- **State Management**: React Context API
- **Styling**: CSS Modules
- **Real-time**: Socket.io client for live updates

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: Firebase Firestore via `firebase-admin`
- **Authentication**: JWT tokens with Passport.js
- **Payment Gateway**: Paystack integration
- **File Storage**: Cloudinary for image uploads
- **Real-time**: Socket.io server for live notifications
- **API**: RESTful API with TypeScript

### Database
- Firebase Firestore document store
- Role-based access control (RBAC)
- Booking management with status tracking
- Payment tracking and references
- Notification system
- User favorites and preferences

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Firestore enabled
- Cloudinary account (for image uploads)
- Paystack account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mlcab-hotel
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

4. **Set up environment variables**

   Frontend `.env`:
   ```bash
   VITE_API_URL=http://localhost:4000
   ```

   Backend `.env`:
   ```bash
   FIREBASE_PROJECT_ID=your-firestore-project-id
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=7d
   ENABLE_FALLBACK_AUTH=false
   PAYSTACK_SECRET_KEY=sk_test_your-secret-key
   PUBLIC_BASE_URL=http://localhost:5173
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   PORT=4000
   ```

5. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```

6. **Start the development servers**

   Backend:
   ```bash
   cd server
   npm run dev
   ```

   Frontend:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
mlcab-hotel/
├── src/                          # Frontend source code
│   ├── Components/              # React components
│   ├── Pages/                   # Page components
│   ├── contexts/               # React contexts
│   ├── config/                 # Configuration files
│   └── utils/                  # Utility functions
├── server/                      # Backend source code
│   ├── src/
│   │   ├── config/             # Firebase, auth, upload configs
│   │   ├── controllers/        # Request handlers
│   │   ├── routes/             # API routes
│   │   ├── repositories/       # Firestore access layer
│   │   ├── services/           # Business logic
│   │   ├── middleware/         # Express middleware
│   │   ├── types/              # TypeScript types
│   └── package.json
├── public/                      # Static assets
└── README.md
```

## 🔧 Features

### ✅ Completed Features

- **Full Authentication System**: Email/password and Google OAuth
- **Role-Based Access Control**: Customer, admin, and super admin roles
- **Room Management**: CRUD operations with image uploads
- **Booking System**: Complete booking flow with payment integration
- **Payment Processing**: Paystack integration with tax calculation
- **Notification System**: Real-time notifications for bookings and promotions
- **Admin Dashboard**: Complete admin interface for hotel management
- **User Profile**: Profile management and booking history
- **Deal Management**: Create and manage promotional deals
- **Event Management**: Create and manage hotel events
- **Search & Filtering**: Advanced search and filter capabilities
- **Responsive Design**: Mobile-friendly interface
- **Database Integration**: Firebase Firestore integration
- **Image Upload**: Cloudinary integration for room and event images

### 🚧 Future Enhancements

- Email notifications
- SMS notifications
- Advanced analytics dashboard
- Map integration
- Multi-language support
- Booking calendar view
- Automated booking reminders

## 🛠️ Technologies Used

### Frontend
- React 19.1.1
- TypeScript 5.9.3
- Vite 7.1.7
- React Router DOM 7.9.4
- Socket.io Client

### Backend
- Node.js
- Express.js
- TypeScript
- Firebase Firestore via `firebase-admin`
- Passport.js (JWT & OAuth)
- Socket.io
- Cloudinary SDK
- Paystack API

## 📝 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `GET /auth/google` - Google OAuth initiation
- `GET /auth/google/callback` - Google OAuth callback

### Bookings
- `GET /bookings` - Get user bookings
- `POST /bookings` - Create new booking
- `PUT /bookings/:id` - Update booking
- `DELETE /bookings/:id` - Cancel booking

### Rooms
- `GET /admin/rooms` - Get all rooms (admin)
- `POST /admin/rooms` - Create room (admin)
- `PUT /admin/rooms/:id` - Update room (admin)
- `DELETE /admin/rooms/:id` - Delete room (admin)

### Payments
- `POST /payments/paystack/initialize` - Initialize payment
- `POST /payments/paystack/webhook` - Payment webhook
- `GET /payments/paystack/verify` - Verify payment

### Notifications
- `GET /notifications` - Get user notifications
- `PUT /notifications/:id/read` - Mark as read
- `POST /notifications/broadcast` - Send promotion (admin)

## 🚀 Deployment

### Backend (Railway)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Frontend (GitHub Pages)
1. Build production bundle
2. Deploy to GitHub Pages
3. Update API URL in environment variables

## 🤝 Contributing

This is a collaborative project for the Mlab codetribe 2025 cohort (Team Delta).

## 📄 License

This project is for educational/demo purposes.
