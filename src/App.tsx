import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import './App.css';

import { LandingPage } from './Pages/Landing_Page/LandingPage';
import { AdminDashboard } from './Pages/admin_dashboard/AdminDashboard';
import { CustomerDashboard } from './Pages/Customer_Dashboard/CustomerDashboard';
import SignIn from './Pages/Auth/SignIn';
import SignUp from './Pages/Auth/SignUp';
import OAuthCallback from './Pages/Auth/OAuthCallback';
import { AuthProvider } from './contexts/AuthContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { PopiaProvider } from './contexts/PopiaContext';
import { ProtectedRoute } from './Components/ProtectedRoute/ProtectedRoute';
import { Navbar } from './Components/Navbar/Navbar';
import RoomDetails from "./Pages/Room_Details/RoomDetails";
import HotelDetails from "./Pages/HotelDetails/HotelDetails";
import ErrorBoundary from './Components/ErrorBoundary';

// Import BookingPage from the correct folder
import BookingPage from './Pages/Booking_Page/BookingPage';
import PaymentPage from './Pages/Payment/PaymentPage';
import BookingConfirmation from './Pages/BookingConfirmation/BookingConfirmation';
import UserProfile from './Pages/UserProfile/UserProfile';
import { Notifications } from './Pages/Notification/Notifications';
import PopiaRouteGuard from './Components/Popia/PopiaRouteGuard';


function AppContent() {
  const location = useLocation();
  
  // Handle GitHub Pages SPA routing (/?/path format from 404.html redirect)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const redirectPath = searchParams.get('/');
    if (redirectPath) {
      // If it's the callback route, we need to process it to extract the token
      if (redirectPath.includes('auth/callback')) {
        console.log('=== GitHub Pages redirect detected for auth/callback ===');
        console.log('Redirect path:', redirectPath);
        // Extract the path and query params
        const parts = redirectPath.split('~and~');
        const pathPart = parts[0];
        const queryParts = parts.slice(1);
        
        // Reconstruct the path
        const newPath = '/' + pathPart.replace(/~and~/g, '&');
        
        // Reconstruct query string from remaining parts
        let newSearch = '';
        if (queryParts.length > 0) {
          newSearch = '?' + queryParts.join('&').replace(/~and~/g, '&');
        }
        
        console.log('Reconstructed path:', newPath);
        console.log('Reconstructed search:', newSearch);
        
        // Update URL so React Router can match the route
        if (window.location.pathname !== newPath || window.location.search !== newSearch) {
          window.history.replaceState({}, '', newPath + newSearch + window.location.hash);
          console.log('URL updated to:', window.location.href);
        }
        return;
      }
      
      // The redirect path may contain both the path and query params (separated by ~and~)
      // Example: "auth/callback~and~token=abc123"
      const parts = redirectPath.split('~and~');
      const pathPart = parts[0];
      const queryParts = parts.slice(1);
      
      // Reconstruct the path
      const newPath = '/' + pathPart.replace(/~and~/g, '&');
      
      // Reconstruct query string from remaining parts
      let newSearch = '';
      if (queryParts.length > 0) {
        newSearch = '?' + queryParts.join('&').replace(/~and~/g, '&');
      }
      
      // Also preserve any other query params that might be in the URL
      const otherParams = new URLSearchParams(window.location.search);
      otherParams.delete('/');
      const otherQuery = otherParams.toString();
      if (otherQuery && !newSearch) {
        newSearch = '?' + otherQuery;
      } else if (otherQuery && newSearch) {
        newSearch += '&' + otherQuery;
      }
      
      // Only redirect if we're not already on the correct path
      if (window.location.pathname !== newPath || window.location.search !== newSearch) {
        window.history.replaceState({}, '', newPath + newSearch + window.location.hash);
      }
    }
  }, []);
  
  // Only show the public Navbar on the landing page
  const showNavbar = location.pathname === '/';

  return (
    <>
      {showNavbar && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/signin"
          element={
            <PopiaRouteGuard>
              <SignIn />
            </PopiaRouteGuard>
          }
        />
        <Route
          path="/signup"
          element={
            <PopiaRouteGuard>
              <SignUp />
            </PopiaRouteGuard>
          }
        />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/hotel-details" element={<HotelDetails />} />
        <Route path="/room-details/:id" element={<RoomDetails />} />
        <Route path="/notifications" element={<Notifications />} />

        {/* Protected Booking Flow */}
        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-confirmation"
          element={
            <ProtectedRoute>
              <BookingConfirmation />
            </ProtectedRoute>
          }
        />
        
        {/* User Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />

        {/* Customer Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/rooms" element={<CustomerDashboard />} />

        {/* Admin Dashboard */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PopiaProvider>
          <AuthProvider>
            <FavoritesProvider>
              <Router>
                <AppContent />
              </Router>
            </FavoritesProvider>
          </AuthProvider>
        </PopiaProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
