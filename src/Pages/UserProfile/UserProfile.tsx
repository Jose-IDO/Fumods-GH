import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LoggedInNavbar } from "../../Components/LoggedInNavbar/LoggedInNavbar";
import { useFavorites } from "../../contexts/FavoritesContext";
import styles from "./UserProfile.module.css";
import { API_URL } from "../../config/api";

interface Booking {
  id: string;
  bookingId?: string;
  hotelName: string;
  roomType: string;
    roomName?: string;
  roomId?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  status: string;
  guests?: number;
  adults?: number;
  children?: number;
  guestDetails?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
  };
  createdAt?: string;
  paymentReference?: string;
}

const UserProfile: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { favorites, toggleFavorite } = useFavorites();
  
  // Get tab and highlight from URL params
  const tabParam = searchParams.get('tab') as 'personal' | 'bookings' | 'favourites' | null;
  const highlightBookingId = searchParams.get('highlight');
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'personal' | 'bookings' | 'favourites'>(tabParam || 'personal');
  
  // Personal details state
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState("");
  
  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all'|'pending'|'confirmed'|'cancelled'>('all');
  const [dateFrom, setDateFrom] = useState<string>(''); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState<string>('');     // YYYY-MM-DD
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [reviewingBookingId, setReviewingBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) {
      navigate('/signin');
      return;
    }
    
    // Update active tab from URL params
    if (tabParam) {
      setActiveTab(tabParam);
    }
    
    // Fetch user bookings when bookings tab is active
    if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [user, token, navigate, activeTab, tabParam]);

  // Scroll to highlighted booking after bookings are loaded
  useEffect(() => {
    if (highlightBookingId && bookings.length > 0 && !loadingBookings) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`booking-${highlightBookingId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300); // Small delay to ensure rendering is complete
      return () => clearTimeout(timer);
    }
  }, [highlightBookingId, bookings, loadingBookings]);

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (dateFrom) params.set('start', dateFrom);
      if (dateTo) params.set('end', dateTo);

      const response = await fetch(`${API_URL}/bookings/my-bookings?${params.toString()}` , {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const items: Booking[] = Array.isArray(data.data) ? data.data : [];
        items.sort((a, b) => {
          const aTs = new Date(a.createdAt || a.checkIn).getTime();
          const bTs = new Date(b.createdAt || b.checkIn).getTime();
          return bTs - aTs; // most recent first
        });
        setBookings(items);
        if (data.paging) {
          setTotalPages(data.paging.totalPages || 1);
        } else {
          setTotalPages(1);
        }
      } else {
        console.error('Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const submitBookingReview = async (booking: Booking) => {
    if (!booking.roomId || !reviewComment.trim()) {
      setError('Please write a review before submitting.');
      return;
    }

    setSubmittingReview(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/rooms/${booking.roomId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Unable to submit review');
      setSuccess('Thank you — your review has been published.');
      setReviewingBookingId(null);
      setReviewComment('');
      setReviewRating(5);
    } catch (err: any) {
      setError(err.message || 'Unable to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          address
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update local storage
      const updatedUser = { ...user, firstName, lastName, phone };
      localStorage.setItem('hotel_user', JSON.stringify(updatedUser));
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Refresh page to update navbar
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully!');
      setShowPasswordChange(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return styles.statusConfirmed;
      case 'pending':
        return styles.statusPending;
      case 'cancelled':
        return styles.statusCancelled;
      case 'completed':
        return styles.statusCompleted;
      default:
        return '';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <LoggedInNavbar />
      <div className={styles.container}>
        <div className={styles.profileWrapper}>
          
          {/* Profile Header */}
          <div className={styles.profileHeader}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>
                <span className={styles.avatarInitials}>
                  {user.firstName?.charAt(0).toUpperCase()}{user.lastName?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className={styles.headerInfo}>
                <h1 className={styles.userName}>{user.firstName} {user.lastName}</h1>
                <p className={styles.userEmail}>{user.email}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'personal' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Personal Details
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'bookings' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Booking History
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'favourites' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('favourites')}
            >
              <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              Favourites
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className={styles.errorMessage}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className={styles.successMessage}>
              ✓ {success}
            </div>
          )}

          {/* Tab Content */}
          <div className={styles.tabContent}>
            
            {/* Personal Details Tab */}
            {activeTab === 'personal' && (
              <div className={styles.personalSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Personal Information</h2>
                  {!isEditing && !showPasswordChange && (
                    <button className={styles.editButton} onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </button>
                  )}
                </div>

                {/* Profile Form */}
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>First Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Last Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email Address</label>
                    <input
                      type="email"
                      className={styles.input}
                      value={user.email}
                      disabled
                    />
                    <span className={styles.helperText}>Email cannot be changed</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Phone Number</label>
                    <input
                      type="tel"
                      className={styles.input}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={!isEditing}
                      placeholder="+27 00 000 0000"
                    />
                  </div>

                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.label}>Address</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={!isEditing}
                      placeholder="123 Main Street, City, Province"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className={styles.formActions}>
                    <button
                      className={styles.cancelButton}
                      onClick={() => {
                        setIsEditing(false);
                        setFirstName(user.firstName || "");
                        setLastName(user.lastName || "");
                        setPhone(user.phone || "");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.saveButton}
                      onClick={handleUpdateProfile}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}

                {/* Password Section */}
                <div className={styles.passwordSection}>
                  <div className={styles.passwordHeader}>
                    <div>
                      <h3 className={styles.passwordTitle}>Password</h3>
                      <p className={styles.passwordDescription}>
                        Change your password to keep your account secure
                      </p>
                    </div>
                    {!showPasswordChange && !isEditing && (
                      <button
                        className={styles.changePasswordButton}
                        onClick={() => setShowPasswordChange(true)}
                      >
                        Change Password
                      </button>
                    )}
                  </div>

                  {showPasswordChange && (
                    <div className={styles.passwordForm}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Current Password</label>
                        <input
                          type="password"
                          className={styles.input}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>New Password</label>
                        <input
                          type="password"
                          className={styles.input}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password (min 8 characters)"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Confirm New Password</label>
                        <input
                          type="password"
                          className={styles.input}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                        />
                      </div>

                      <div className={styles.formActions}>
                        <button
                          className={styles.cancelButton}
                          onClick={() => {
                            setShowPasswordChange(false);
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className={styles.saveButton}
                          onClick={handleChangePassword}
                          disabled={loading}
                        >
                          {loading ? 'Changing...' : 'Change Password'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Booking History Tab */}
            {activeTab === 'bookings' && (
              <div className={styles.bookingsSection}>
                <h2 className={styles.sectionTitle}>My Bookings</h2>
                {/* Filters */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', margin: '12px 0 16px' }}>
                  <div>
                    <label className={styles.label}>Status </label>
                    <select
                      className={styles.input}
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className={styles.label}>From </label>
                    <input
                      type="date"
                      className={styles.input}
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    />
                  </div>
                  <div>
                    <label className={styles.label}>To </label>
                    <input
                      type="date"
                      className={styles.input}
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    />
                  </div>
                  <div>
                    <label className={styles.label}>Page size </label>
                    <select
                      className={styles.input}
                      value={limit}
                      onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className={styles.saveButton}
                      onClick={() => { setPage(1); fetchBookings(); }}
                    >
                      Apply
                    </button>
                    <button
                      className={styles.cancelButton}
                      onClick={() => { setStatusFilter('all'); setDateFrom(''); setDateTo(''); setLimit(10); setPage(1); fetchBookings(); }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                
                {loadingBookings ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading your bookings...</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📅</div>
                    <h3>No Bookings Yet</h3>
                    <p>You haven't made any bookings. Start exploring our rooms!</p>
                    <button className={styles.browseButton} onClick={() => navigate('/hotel-details')}>
                      Browse Rooms
                    </button>
                  </div>
                ) : (
                  <div className={styles.bookingsList}>
                    {bookings.map((booking) => {
                      const bookingIdentifier = booking.id || booking.bookingId;
                      const isHighlighted = highlightBookingId && bookingIdentifier === highlightBookingId;
                      
                      return (
                        <div 
                          key={bookingIdentifier}
                          id={`booking-${bookingIdentifier}`}
                          className={`${styles.bookingCard} ${isHighlighted ? styles.highlightedBooking : ''}`}
                        >
                        <div className={styles.bookingHeader}>
                          <div>
                            <h3 className={styles.bookingHotel}>{booking.hotelName}</h3>
                                                         {booking.roomName && (
                                                           <p className={styles.bookingRoomName}>{booking.roomName}</p>
                                                         )}
                            <p className={styles.bookingRoom}>{booking.roomType}</p>
                          </div>
                          <span className={`${styles.bookingStatus} ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        
                        <div className={styles.bookingDetails}>
                          <div className={styles.bookingDetail}>
                            <span className={styles.detailLabel}>Booking ID:</span>
                            <span className={styles.detailValue}>{booking.bookingId || booking.id}</span>
                          </div>
                          <div className={styles.bookingDetail}>
                            <span className={styles.detailLabel}>Check-in:</span>
                            <span className={styles.detailValue}>{formatDate(booking.checkIn)}</span>
                          </div>
                          <div className={styles.bookingDetail}>
                            <span className={styles.detailLabel}>Check-out:</span>
                            <span className={styles.detailValue}>{formatDate(booking.checkOut)}</span>
                          </div>
                          <div className={styles.bookingDetail}>
                            <span className={styles.detailLabel}>Nights:</span>
                            <span className={styles.detailValue}>{booking.nights}</span>
                          </div>
                          <div className={styles.bookingDetail}>
                            <span className={styles.detailLabel}>Total Price:</span>
                            <span className={styles.detailPrice}>R{booking.totalPrice.toLocaleString()}</span>
                          </div>
                          {booking.createdAt && (
                            <div className={styles.bookingDetail}>
                              <span className={styles.detailLabel}>Booked on:</span>
                              <span className={styles.detailValue}>{formatDate(booking.createdAt)}</span>
                            </div>
                          )}
                        </div>

                        {booking.roomId && ['confirmed', 'completed'].includes(booking.status.toLowerCase()) && (
                          <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 16 }}>
                            {reviewingBookingId === bookingIdentifier ? (
                              <div style={{ display: 'grid', gap: 10 }}>
                                <strong>Review {booking.roomName || booking.roomType}</strong>
                                <label className={styles.label}>
                                  Rating
                                  <select
                                    className={styles.input}
                                    value={reviewRating}
                                    onChange={(e) => setReviewRating(Number(e.target.value))}
                                  >
                                    {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? '' : 's'}</option>)}
                                  </select>
                                </label>
                                <label className={styles.label}>
                                  Your review
                                  <textarea
                                    className={styles.input}
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Tell future guests about your stay"
                                    rows={3}
                                  />
                                </label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button className={styles.saveButton} disabled={submittingReview} onClick={() => submitBookingReview(booking)}>
                                    {submittingReview ? 'Publishing...' : 'Publish review'}
                                  </button>
                                  <button className={styles.cancelButton} onClick={() => { setReviewingBookingId(null); setReviewComment(''); }}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button className={styles.saveButton} onClick={() => setReviewingBookingId(bookingIdentifier || null)}>
                                Leave a review
                              </button>
                            )}
                          </div>
                        )}

                      </div>
                    );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {!loadingBookings && bookings.length > 0 && (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end', marginTop: 12 }}>
                    <button
                      className={styles.cancelButton}
                      disabled={page <= 1}
                      onClick={() => { setPage(p => Math.max(1, p - 1)); setTimeout(fetchBookings, 0); }}
                    >
                      Previous
                    </button>
                    <span style={{ color: '#666' }}>Page {page} of {totalPages}</span>
                    <button
                      className={styles.saveButton}
                      disabled={page >= totalPages}
                      onClick={() => { setPage(p => Math.min(totalPages, p + 1)); setTimeout(fetchBookings, 0); }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Favourites Tab */}
            {activeTab === 'favourites' && (
              <div className={styles.favouritesSection}>
                <h2 className={styles.sectionTitle}>My Favourites</h2>

                {favorites.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>❤️</div>
                    <h3>No favourites yet</h3>
                    <p>Start adding hotels or rooms you love!</p>
                    <button
                      className={styles.browseButton}
                      onClick={() => navigate("/hotel-details")}
                    >
                      Browse Rooms
                    </button>
                  </div>
                ) : (
                  <div className={styles.favouritesGrid}>
                    {favorites.map((fav) => (
                      <div
                        key={fav.id}
                        className={styles.favCard}
                        style={{ cursor: fav.type === 'room' ? 'pointer' : 'default' }}
                        onClick={() => fav.type === 'room' && navigate(`/room-details/${fav.id}`)}
                      >
                        {fav.image && (
                          <img src={fav.image} alt={fav.name} className={styles.favImg} />
                        )}
                        <div className={styles.favInfo}>
                          <h4>{fav.name}</h4>
                          {fav.type === "room" && fav.price && (
                            <p className={styles.favPrice}>
                              R {fav.price.toLocaleString()} / night
                            </p>
                          )}
                        </div>

                        <button
                          className={styles.removeFavBtn}
                          onClick={(event) => { event.stopPropagation(); toggleFavorite(fav); }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;

