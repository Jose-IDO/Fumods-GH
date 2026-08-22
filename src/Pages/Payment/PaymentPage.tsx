import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LoggedInNavbar } from "../../Components/LoggedInNavbar/LoggedInNavbar";
import styles from "./PaymentPage.module.css";
import { API_URL } from "../../config/api";

const PaymentPage: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const {
    bookingId,
    hotelName = "Fumods Guesthouse",
    roomType = "Luxury Suite",
    roomImage,
    checkIn,
    checkOut,
    nights = 3,
    adults = 2,
    children = 0,
    pricePerNight = 1200,
    totalPrice = 3600, // This should be the subtotal (without tax)
    subtotal: passedSubtotal,
    taxAmount: passedTaxAmount,
  } = state || {};

  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState<number>(15); // Default 15% tax
  const [cancellationPolicy, setCancellationPolicy] = useState<string>("");

  // Fetch tax rate and cancellation policy from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings/public`);
        const json = await res.json();
        if (res.ok && json.ok && json.data) {
          if (json.data.taxRate) {
            setTaxRate(json.data.taxRate);
          }
          if (json.data.cancellationPolicy) {
            setCancellationPolicy(json.data.cancellationPolicy);
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        // Keep defaults
      }
    };

    fetchSettings();
  }, []);

  // Calculate tax and grand total
  // Use passed values if available (from booking page), otherwise calculate
  const subtotal = passedSubtotal !== undefined ? passedSubtotal : totalPrice;
  const taxAmount = passedTaxAmount !== undefined ? passedTaxAmount : (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const handlePayment = async () => {
    setLoading(true);
    setPaymentError(null);

    try {
      if (!bookingId) throw new Error('Missing booking ID');
      if (!token) throw new Error('You must be logged in');

      // Start Paystack transaction
      const res = await fetch(`${API_URL}/payments/paystack/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ bookingId })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || errData?.message || 'Failed to start payment');
      }

      const data = await res.json();
      const checkoutUrl = data?.data?.checkoutUrl || data?.checkoutUrl;
      if (!checkoutUrl) throw new Error('No checkout URL received');

      // Redirect to Paystack hosted checkout
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setPaymentError(err.message || 'Payment error');
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingId) {
      setCancelError('No booking ID found');
      return;
    }

    setCancelling(true);
    setCancelError(null);
    setShowCancelModal(false);

    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errorMsg = 'Failed to cancel booking';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      navigate('/hotel-details');
    } catch (err) {
      console.error('Cancel error:', err);
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <LoggedInNavbar />
      <main className={styles.main}>
        <div className={styles.container}>
          {/* LEFT: Booking Summary */}
          <aside className={styles.bookingSummary}>
            {roomImage && (
              <img src={roomImage} alt={hotelName} className={styles.hotelImg} />
            )}
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
                <span className={styles.value}>{adults} Adult{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} Child${children > 1 ? 'ren' : ''}` : ''}</span>
              </div>

              <div className={styles.summaryRow}>
                <span className={styles.label}>Nights:</span>
                <span className={styles.value}>{nights}</span>
              </div>

              <div className={styles.divider}></div>

              <div className={styles.priceRow}>
                <span>R{pricePerNight.toLocaleString()} × {nights} night{nights > 1 ? 's' : ''}</span>
                <span>R{subtotal.toLocaleString()}</span>
              </div>

              <div className={styles.priceRow}>
                <span>Tax ({taxRate}%)</span>
                <span>R{taxAmount.toFixed(2)}</span>
              </div>

              <div className={styles.totalRow}>
                <span>Grand Total</span>
                <span className={styles.totalPrice}>R{grandTotal.toFixed(2)}</span>
              </div>

              {cancellationPolicy && (
                <p className={styles.cancellation}>{cancellationPolicy}</p>
              )}
            </div>
          </aside>

          {/* RIGHT: Payment Section */}
          <section className={styles.paymentSection}>
            <h2 className={styles.sectionTitle}>Complete Payment</h2>

            <div className={styles.formCard}>
              <h3 className={styles.cardTitle}>Secure Payment via Paystack</h3>
              <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                You will be redirected to Paystack's secure checkout to complete your payment safely.
                All major cards accepted.
              </p>

              {/* Error Messages */}
              {paymentError && (
                <div style={{ 
                  background: '#fee2e2', 
                  border: '1px solid #ef4444', 
                  borderRadius: '6px',
                  padding: '1rem', 
                  marginBottom: '1rem',
                  color: '#991b1b' 
                }}>
                  ⚠️ {paymentError}
                </div>
              )}

              {cancelError && (
                <div style={{ 
                  background: '#fee2e2', 
                  border: '1px solid #ef4444', 
                  borderRadius: '6px',
                  padding: '1rem', 
                  marginBottom: '1rem',
                  color: '#991b1b' 
                }}>
                  ⚠️ {cancelError}
                </div>
              )}

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={loading || cancelling || !bookingId}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: loading ? '#ccc' : '#0A74DA',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: loading || !bookingId ? 'not-allowed' : 'pointer',
                  marginBottom: '1rem',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#095bb5')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0A74DA')}
              >
                {loading ? 'Redirecting to Paystack...' : `Pay R${grandTotal.toFixed(2)} with Paystack`}
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                disabled={cancelling || loading || !bookingId}
                className={styles.cancelButton}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>

              <div style={{ 
                marginTop: '1.5rem', 
                fontSize: '0.85rem', 
                color: '#888',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                🔒 Secured by Paystack • PCI DSS Compliant
              </div>
            </div>
          </section>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className={styles.modalOverlay} onClick={() => setShowCancelModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.modalTitle}>Cancel Booking?</h3>
              <p className={styles.modalText}>
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
              <div className={styles.modalButtons}>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className={styles.modalButtonSecondary}
                  disabled={cancelling}
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCancelBooking}
                  className={styles.modalButtonDanger}
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default PaymentPage;

