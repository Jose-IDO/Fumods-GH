import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LoggedInNavbar } from "../../Components/LoggedInNavbar/LoggedInNavbar";
import Button from "../../Components/Shared/Button";
import Input from "../../Components/Shared/Input";
import styles from "./BookingPage.module.css";
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
    roomType = "Guest room",
    roomImage = "",
    pricePerNight: initialPricePerNight = 1200,
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
  type RoomSelection = { bedType: 'double' | 'twin'; adults: number; babies: number };
  const [roomSelections, setRoomSelections] = useState<RoomSelection[]>([{ bedType: state?.bedType === 'twin' ? 'twin' : 'double', adults: 2, babies: 0 }]);
  const roomCount = roomSelections.length;
  const guests = roomSelections.reduce((sum, r) => sum + r.adults, 0);
  const babies = roomSelections.reduce((sum, r) => sum + r.babies, 0);
  const [availability, setAvailability] = useState<number | null>(null);
  const [availabilityError, setAvailabilityError] = useState('');
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [catalogue, setCatalogue] = useState<any>(null);
  const requestId = useRef(crypto.randomUUID());
  const selectedRoomId = roomId || catalogue?.id;
  const pricePerNight = catalogue ? Number(catalogue.price) : initialPricePerNight;
  const photo = catalogue ? catalogue.images?.[0] || '' : roomImage;
  const updateRoom = (index: number, change: Partial<RoomSelection>) => setRoomSelections(previous => previous.map((r, i) => i === index ? { ...r, ...change } : r));
  const setRoomCount = (count: number) => setRoomSelections(previous => Array.from({ length: count }, (_, i) => previous[i] || { bedType: 'double', adults: 2, babies: 0 }));

  useEffect(() => {
    const controller = new AbortController();
    fetch(roomId ? API_URL + '/rooms/' + roomId : API_URL + '/rooms', { signal: controller.signal })
      .then(res => res.json()).then(result => { if (result.ok) setCatalogue(roomId ? result.data : result.data?.[0]); })
      .catch(() => {});
    return () => controller.abort();
  }, [roomId]);

  useEffect(() => {
    requestId.current = crypto.randomUUID();
  }, [checkIn, checkOut, selectedRoomId, roomSelections]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setAvailabilityLoading(true);
      try {
        const res = await fetch(API_URL + '/bookings/availability?checkIn=' + encodeURIComponent(checkIn) + '&checkOut=' + encodeURIComponent(checkOut), { signal: controller.signal, cache: 'no-store' });
        const result = await res.json();
        if (!res.ok || !result.ok) throw new Error(result.error || 'Unable to check availability');
        setAvailability(result.data.availableRooms);
        setAvailabilityError('');
      } catch (e) {
        if (!controller.signal.aborted) { setAvailability(null); setAvailabilityError(e instanceof Error ? e.message : 'Unable to check availability'); }
      } finally { if (!controller.signal.aborted) setAvailabilityLoading(false); }
    };
    void load();
    const timer = window.setInterval(load, 30000);
    window.addEventListener('focus', load);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener('focus', load); };
  }, [checkIn, checkOut]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const totalPrice = pricePerNight * nights * roomCount;

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

      if (!selectedRoomId) {
        setError('Room information is missing. Please go back and select a room.');
        setIsSubmitting(false);
        return;
      }

      if (availability === null || roomCount > availability) throw new Error('Please select available dates and room count.');

      // Create booking payload
      const bookingPayload = {
        roomId: selectedRoomId,
        requestId: requestId.current,
        roomSelections,
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

      const paymentData = {
        bookingId: bookingData.id,
        paymentReference: bookingData.paymentReference || paymentInfo?.reference,
        hotelName,
        roomType,
        roomImage: photo,
        checkIn,
        checkOut,
        nights,
        guests, adults: guests, babies, children: babies, roomCount, roomSelections,
        pricePerNight,
        totalPrice: bookingData.totalPrice,
        subtotal: bookingData.totalPrice,
        taxAmount: 0,
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
            {photo && <img src={photo} alt={hotelName} className={styles.hotelImg} />}
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
                <span className={styles.value}>{guests} adult(s){babies ? ` and ${babies} baby/babies` : ''}</span>
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
                <span>R{pricePerNight.toLocaleString()} × {nights} night{nights > 1 ? 's' : ''}</span>
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

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="room-count">Number of rooms</label>
                <select id="room-count" value={roomCount} onChange={e => setRoomCount(Number(e.target.value))} className={styles.selectInput}>
                  {[1,2,3,4,5].map(num => <option key={num} value={num} disabled={availability !== null && num > availability}>{num}</option>)}
                </select>
                <p role="status">{availabilityLoading ? 'Checking availability...' : availabilityError || (availability + ' of 5 rooms available for these dates.')}</p>
                {availability !== null && roomCount > availability && <p role="alert">Please reduce the number of rooms or choose other dates.</p>}
              </div>
              {roomSelections.map((selection, index) => <fieldset key={index} className={styles.guestCard}>
                <legend>Room {index + 1}</legend>
                <div className={styles.formGroup}>
                  <label htmlFor={'bed-' + index} className={styles.formLabel}>Bed setup</label>
                  <select id={'bed-' + index} value={selection.bedType} onChange={e => updateRoom(index, { bedType: e.target.value as 'double' | 'twin' })} className={styles.selectInput}>
                    <option value="double">Double bed</option><option value="twin">Two single beds</option>
                  </select>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor={'adults-' + index} className={styles.formLabel}>Adults</label>
                    <select id={'adults-' + index} value={selection.adults} onChange={e => updateRoom(index, { adults: Number(e.target.value) })} className={styles.selectInput}>
                      <option value={1}>1 adult</option><option value={2}>2 adults</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor={'babies-' + index} className={styles.formLabel}>Baby</label>
                    <select id={'babies-' + index} value={selection.babies} onChange={e => updateRoom(index, { babies: Number(e.target.value) })} className={styles.selectInput}>
                      <option value={0}>No baby</option><option value={1}>1 baby</option>
                    </select>
                  </div>
                </div>
                <small>Maximum 2 adults and 1 baby per room. Either bed setup is available in every room.</small>
              </fieldset>)}
              <p>Your rooms are held for 48 hours pending admin confirmation. Unconfirmed bookings expire automatically.</p>

              <div className={styles.priceBreakdown}>
                <div className={styles.priceRow}>
                  <span>R{pricePerNight.toLocaleString()} × {nights} night{nights > 1 ? 's' : ''} × {roomCount} room{roomCount > 1 ? 's' : ''}</span>
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
              disabled={isSubmitting || availabilityLoading || availability === null || roomCount > availability || !selectedRoomId}
            />
          </section>
        </div>
      </main>
    </>
  );
};

export default BookingPage;
