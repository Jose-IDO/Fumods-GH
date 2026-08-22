import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./BookingConfirmation.module.css";
import { API_URL } from "../../config/api";

interface BookingData {
  bookingId: string;
  hotelName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    country: string;
    phone: string;
  };
  paymentMethod: string;
  cardholderName: string;
  paymentReference?: string;
}

const BookingConfirmation: React.FC = () => {
  const { state } = useLocation();
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        // Check if we have a payment reference in the URL (from Paystack redirect)
        const searchParams = new URLSearchParams(location.search);
        const reference = searchParams.get('reference') || searchParams.get('trxref') || searchParams.get('ref');

        if (reference) {
          // Try to verify payment (fallback if webhook hasn't fired)
          try {
            await fetch(`${API_URL}/payments/paystack/verify?reference=${encodeURIComponent(reference)}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
          } catch {}

          // Fetch booking by payment reference - retry if needed
          let booking = null;
          let retries = 3;
          while (retries > 0 && !booking) {
            try {
              const response = await fetch(`${API_URL}/bookings/by-reference/${reference}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (response.ok) {
                const data = await response.json();
                booking = data.booking || data.data || data;
                break;
              } else if (retries === 1) {
                throw new Error('Failed to fetch booking details');
              }
            } catch (err) {
              if (retries === 1) throw err;
              // Wait 1 second before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            retries--;
          }

          if (booking) {
            setBookingData({
              bookingId: booking.id || booking.bookingId,
              hotelName: booking.hotelName || "Fumods Guesthouse",
              roomType: booking.roomType || booking.room_type || "Room",
              checkIn: booking.checkIn || booking.check_in,
              checkOut: booking.checkOut || booking.check_out,
              nights: booking.nights || calculateNights(booking.check_in || booking.checkIn, booking.check_out || booking.checkOut),
              totalPrice: booking.totalPrice || booking.total_price,
              guest: {
                firstName: booking.firstName || user?.firstName || "",
                lastName: booking.lastName || user?.lastName || "",
                email: booking.email || user?.email || "",
                country: booking.country || "",
                phone: booking.phone || user?.phone || ""
              },
              paymentMethod: "Paystack",
              cardholderName: `${user?.firstName || ""} ${user?.lastName || ""}`,
              paymentReference: reference
            });
          }
        } else if (state) {
          // Use data from navigation state (direct navigation from payment page)
          setBookingData({
            bookingId: state.bookingId || "UNKNOWN",
            hotelName: state.hotelName || "Fumods Guesthouse",
            roomType: state.roomType || "Luxury Suite",
            checkIn: state.checkIn,
            checkOut: state.checkOut,
            nights: state.nights || 3,
            totalPrice: state.totalPrice || 3600,
            guest: state.guest || { firstName: "", lastName: "", email: "", country: "", phone: "" },
            paymentMethod: state.paymentMethod || "Paystack",
            cardholderName: state.cardholderName || "Guest"
          });
        } else {
          throw new Error('No booking information available');
        }

        // Always set loading to false after a delay to show the confirmation
        setTimeout(() => setIsLoading(false), 1200);
      } catch (err: any) {
        console.error('Booking confirmation error:', err);
        setError(err.message || 'Failed to load booking details');
        setIsLoading(false);
      }
    };

    if (token) {
      fetchBookingDetails();
    } else {
      setIsLoading(false);
      setError('You must be logged in to view booking confirmation');
    }
  }, [location.search, state, token, user]);

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const downloadReceipt = () => {
    if (!bookingData) return;

    // Create a simple text receipt
    const receiptContent = `
===========================================
        FUMODS GUESTHOUSE BOOKING RECEIPT
===========================================

Booking ID: ${bookingData.bookingId}
Date: ${new Date().toLocaleString()}

-------------------------------------------
BOOKING DETAILS
-------------------------------------------
Hotel: ${bookingData.hotelName}
Room Type: ${bookingData.roomType}
Check-in: ${formatDate(bookingData.checkIn)}
Check-out: ${formatDate(bookingData.checkOut)}
Nights: ${bookingData.nights}

-------------------------------------------
GUEST INFORMATION
-------------------------------------------
Primary Guest: ${bookingData.guest.firstName} ${bookingData.guest.lastName}
Email: ${bookingData.guest.email}
Phone: ${bookingData.guest.phone}
Country: ${bookingData.guest.country}

-------------------------------------------
PAYMENT INFORMATION
-------------------------------------------
Amount Paid: R${bookingData.totalPrice.toLocaleString()}
Payment Method: ${bookingData.paymentMethod}
${bookingData.paymentReference ? `Payment Reference: ${bookingData.paymentReference}` : ''}

-------------------------------------------
Thank you for choosing Fumods Guesthouse!
For questions, contact: support@deltahotel.com
===========================================
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${bookingData.bookingId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBackToDashboard = () => {
    navigate('/hotel-details');
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoSection}>
          <span className={styles.companyName}>Fumods Guesthouse</span>
        </div>
        <div className={styles.userSection}>
          <div className={styles.userAvatar}>
            {user?.firstName?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      <div className={styles.content}>
        {error ? (
          /* Error State */
          <div className={`${styles.card} ${styles.fadeIn}`}>
            <div className={styles.iconWrapper}>
              <div className={styles.errorIcon}>❌</div>
            </div>
            <h1 className={styles.title}>Error Loading Booking</h1>
            <p className={styles.subtitle}>{error}</p>
            <button
              className={styles.dashboardBtn}
              onClick={handleBackToDashboard}
            >
              Go to Dashboard
            </button>
          </div>
        ) : isLoading || !bookingData ? (
          /* Loading State */
          <div className={`${styles.card} ${styles.fadeIn}`}>
            <div className={styles.iconWrapper}>
              <div className={styles.successIcon}>
                <svg className={styles.checkmark} viewBox="0 0 52 52">
                  <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none"/>
                  <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
            </div>
            <h1 className={styles.title}>Payment Successful</h1>
            <p className={styles.subtitle}>Loading booking confirmation...</p>
            <div className={styles.loader}></div>
          </div>
        ) : (
          /* Booking Confirmed State */
          <div className={`${styles.card} ${styles.fadeIn}`}>
            <div className={styles.iconWrapper}>
              <div className={styles.successIcon}>
                <svg className={styles.checkmark} viewBox="0 0 52 52">
                  <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none"/>
                  <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
            </div>

            <h1 className={styles.titleLarge}>Booking Confirmed</h1>
            <p className={styles.bookingId}>
              ID# <span className={styles.bookingIdValue}>{bookingData.bookingId}</span>
            </p>
            <p className={styles.confirmationText}>
              A confirmation email will be sent to {bookingData.guest.email} shortly.
            </p>

            <div className={styles.actions}>
              <button
                className={styles.downloadBtn}
                onClick={downloadReceipt}
              >
                <svg className={styles.downloadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download Receipt
              </button>

              <button
                className={styles.dashboardBtn}
                onClick={handleBackToDashboard}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingConfirmation;

