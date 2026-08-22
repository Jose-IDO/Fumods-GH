import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LoggedInNavbar } from "../../Components/LoggedInNavbar/LoggedInNavbar";
import Button from "../../Components/Shared/Button";
import Input from "../../Components/Shared/Input";
import styles from "./BookingPage.module.css";
import hotelImage from "../../assets/Santorini_4.jpg";   // ← Your image
import { API_URL } from "../../config/api";

interface Guest {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  phone: string;
}

const BookingPage: React.FC = () => {
  // --- Auth context ---
  const { token, isAuthenticated, user } = useAuth();
  
  // --- Read data from RoomDetails ---
  const { state } = useLocation();
  const navigate = useNavigate();
  const {
    roomId,
    hotelName = "Fumods Guesthouse",
    roomType = "Luxury Deluxe Suite",
    roomImage = hotelImage,
    pricePerNight: initialPricePerNight = 1200,
    maxGuests = 2,
  } = state || {};

  // --- Booking form state (dates and guests count) ---
  // Support pre-filled data from "Book Again" or start with defaults
  const [checkIn, setCheckIn] = useState(() => {
    if (state?.checkIn) return state.checkIn;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState(() => {
    if (state?.checkOut) return state.checkOut;
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 4);
    return nextWeek.toISOString().split('T')[0];
  });
  const [guests, setGuests] = useState(state?.guests || state?.adults || 2);
  const [roomCount, setRoomCount] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-adjust guests if they exceed the new maximum when room count changes
  useEffect(() => {
    const maxAllowed = maxGuests * roomCount;
    if (guests > maxAllowed) {
      setGuests(maxAllowed);
    }
  }, [roomCount, maxGuests, guests]);

  // Calculate nights and total price
  const calculateNights = () => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const nights = calculateNights();
  const totalGuests = guests;
  const maxAllowedGuests = maxGuests * roomCount;
  const totalPrice = initialPricePerNight * nights * roomCount;

  const subtotal = totalPrice;
  const grandTotal = subtotal;

  // --- Format stay string ---
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  // --- Primary guest details state (only one guest form) ---
  // Support pre-filled data from "Book Again" or start with user data
  const [guest, setGuest] = useState<Guest>({
    firstName: state?.guestDetails?.firstName || user?.firstName || "",
    lastName: state?.guestDetails?.lastName || user?.lastName || "",
    email: state?.guestDetails?.email || user?.email || "",
    country: state?.guestDetails?.country || "South Africa",
    phone: state?.guestDetails?.phone || user?.phone || "",
  });

  const updateGuest = (field: keyof Guest, value: string) => {
    setGuest((prev) => ({ ...prev, [field]: value }));
  };

  const handleContinue = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Check authentication
      if (!isAuthenticated || !token) {
        setError('You must be logged in to make a booking');
        navigate('/signin');
        return;
      }

      // Validate required fields
      if (!guest.firstName || !guest.lastName || !guest.email || !guest.phone) {
        setError('Please fill in all guest details');
        setIsSubmitting(false);
        return;
      }

      if (!roomId) {
        setError('Room information is missing. Please go back and select a room.');
        setIsSubmitting(false);
        return;
      }

      if (totalGuests > maxAllowedGuests) {
        setError(`Too many guests! This room allows up to ${maxGuests} guests per room. You selected ${roomCount} room${roomCount > 1 ? 's' : ''}, so the maximum is ${maxAllowedGuests} guests.`);
        setIsSubmitting(false);
        return;
      }

      // Create booking payload
      const bookingPayload = {
        roomId,
        checkIn,
        checkOut,
        guests: totalGuests,
        roomCount,
        guestDetails: {
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          country: guest.country,
          phone: guest.phone,
        }
      };

      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingPayload)
      });

      if (!response.ok) {
        let errorMsg = 'Failed to create booking';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const result = await response.json();
      
      const bookingData = result.data?.booking || result.booking || result.data || result;
      const paymentInfo = result.data?.payment || result.payment;

      const subtotal = totalPrice;
      const grandTotal = subtotal;

      const paymentData = {
        bookingId: bookingData.id,
        paymentReference: bookingData.paymentReference || paymentInfo?.reference,
        hotelName,
        roomType,
        roomImage,
        checkIn,
        checkOut,
        nights,
        guests,
        pricePerNight: initialPricePerNight,
        totalPrice: grandTotal,
        subtotal,
        guest,
        expiresAt: bookingData.expiresAt,
      };

      navigate('/payment', { state: paymentData });
    } catch (err) {
      console.error('Booking error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <LoggedInNavbar />
      <main className={styles.main}>
        <div className={styles.container}>
          {/* LEFT: Hotel Info */}
          <aside className={styles.hotelInfo}>
            <img src={roomImage} alt={hotelName} className={styles.hotelImg} />
            <div className={styles.infoBlock}>
              <h2 className={styles.summaryTitle}>Booking Summary</h2>
              
              <div className={styles.summaryRow}>
                <span className={styles.label}>Hotel:</span>
                <span className={styles.value}>{hotelName}</span>
              </div>

              <div className={styles.summaryRow}>
                <span className={styles.label}>Room:</span>
                <span className={styles.value}>{roomType}</span>
              </div>

              <div className={styles.summaryRow}>
                <span className={styles.label}>Check-in:</span>
                <span className={styles.value}>{formatDate(checkIn)}</span>
              </div>

              <div className={styles.summaryRow}>
                <span className={styles.label}>Check-out:</span>
                <span className={styles.value}>{formatDate(checkOut)}</span>
              </div>

              <div className={styles.summaryRow}>
                <span className={styles.label}>Guests:</span>
                <span className={styles.value}>{guests} Guest{guests > 1 ? 's' : ''}</span>
              </div>

              <div className={styles.summaryRow}>
                <span className={styles.label}>Nights:</span>
                <span className={styles.value}>{nights}</span>
              </div>

              <div className={styles.summaryRow}>
                <span className={styles.label}>Rooms:</span>
                <span className={styles.value}>{roomCount}</span>
              </div>

              <div className={styles.divider}></div>

              <div className={styles.priceRow}>
                <span>R{initialPricePerNight.toLocaleString()} × {nights} night{nights > 1 ? 's' : ''}</span>
                <span>R{subtotal.toLocaleString()}</span>
              </div>

              <div className={styles.totalRow}>
                <span>Grand Total</span>
                <span className={styles.totalPrice}>R{grandTotal.toFixed(2)}</span>
              </div>

            </div>
          </aside>

          {/* RIGHT: Booking & Guest Form */}
          <section className={styles.guestSection}>
            {/* Booking Details Form */}
            <div className={styles.bookingFormCard}>
              <h2 className={styles.sectionTitle}>Booking Details</h2>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={styles.dateInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Check-out</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn}
                    className={styles.dateInput}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Guests</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className={styles.selectInput}
                  >
                    {Array.from({ length: maxAllowedGuests }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                  <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Max {maxGuests} guest{maxGuests > 1 ? 's' : ''} per room
                  </small>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Number of rooms</label>
                  <select
                    value={roomCount}
                    onChange={(e) => setRoomCount(Number(e.target.value))}
                    className={styles.selectInput}
                  >
                    {[1,2,3,4,5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.priceBreakdown}>
                <div className={styles.priceRow}>
                  <span>R{initialPricePerNight.toLocaleString()} × {nights} night{nights > 1 ? 's' : ''} × {roomCount} room{roomCount > 1 ? 's' : ''}</span>
                  <span>R{subtotal.toLocaleString()}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Grand Total</span>
                  <span className={styles.totalPrice}>R{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Guest Details Form */}
            <h2 className={styles.sectionTitle} style={{marginTop: '2rem'}}>Primary Guest Details</h2>

            <div className={styles.guestCard}>
              <h3 className={styles.guestHeader}>Contact Person</h3>

              {/* First & Last Name */}
              <div className={styles.row}>
                <Input
                  label="First Name"
                  placeholder="First Name"
                  value={guest.firstName}
                  onChange={(v) => updateGuest("firstName", v)}
                />
                <Input
                  label="Last Name"
                  placeholder="Last Name"
                  value={guest.lastName}
                  onChange={(v) => updateGuest("lastName", v)}
                />
              </div>

              {/* Email */}
              <Input
                label="E-mail"
                placeholder="example@domain.com"
                type="email"
                value={guest.email}
                onChange={(v) => updateGuest("email", v)}
              />

              {/* Country (Styled Select) + Phone */}
              <div className={styles.row}>
                {/* Country Dropdown */}
                <div className={styles.inputWrapper}>
                  <label className={styles.inputLabel}>Country</label>
                  <select
                    className={styles.countrySelect}
                    value={guest.country}
                    onChange={(e) => updateGuest("country", e.target.value)}
                  >
                    <option value="">Select country</option>
                    <option value="South Africa">South Africa</option>
                    <option value="Namibia">Namibia</option>
                    <option value="Botswana">Botswana</option>
                    <option value="Zimbabwe">Zimbabwe</option>
                    <option value="Lesotho">Lesotho</option>
                    <option value="Eswatini">Eswatini</option>
                    <option value="Mozambique">Mozambique</option>
                  </select>
                </div>

                {/* Phone */}
                <Input
                  label="Phone number"
                  placeholder="+27 00 000 0000"
                  value={guest.phone}
                  onChange={(v) => updateGuest("phone", v)}
                />
              </div>
            </div>

            {/* Info Message */}
            <p className={styles.guestInfo}>
              💡 This information will be used for booking confirmation and communication.
            </p>

            {/* Error Message */}
            {error && (
              <div className={styles.errorMessage}>
                ⚠️ {error}
              </div>
            )}

            {/* Continue Button */}
            <Button 
              text={isSubmitting ? "Creating booking..." : "Continue to payment"} 
              onClick={handleContinue} 
              type="button"
              disabled={isSubmitting}
            />
          </section>
        </div>
      </main>
    </>
  );
};

export default BookingPage;
