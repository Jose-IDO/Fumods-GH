import React, { useEffect, useState } from "react";
import styles from "./RoomDetails.module.css";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { LoggedInNavbar } from "../../Components/LoggedInNavbar/LoggedInNavbar";
import { useAuth } from "../../contexts/AuthContext";
import FavoriteButton from "../../Components/Shared/FavoriteButton";
import { useFavorites } from "../../contexts/FavoritesContext";
import { API_URL } from "../../config/api";
import {
  Wifi, Wind, Tv, Wine, Palmtree, ConciergeBell, Waves,
  CircleSlash2, PawPrint, Clock, Volume2, AlertCircle,
  Sparkles, Coffee, Bath, AirVent
} from "lucide-react";

// Room images
import room1 from "../../assets/room1.jpg";
import room2 from "../../assets/room1B.jpg";
import room3 from "../../assets/room1c.jpg";
import room4 from "../../assets/room1d.jpg";
import room5 from "../../assets/room1E.jpg";

// Types
type ApiRoom = {
  id: string;
  roomName: string;
  roomType: string;
  price: number;
  maxGuests?: number;
  bedType?: string;
  numberOfBeds?: number;
  roomSizeSqm?: number;
  amenities?: string[];
  description?: string;
  images?: string[];
};

type UiRoom = {
  id: string;
  name: string;
  image: string;
  price: number;
  adults: number;
  kids: number;
  bedType: string;
  numberOfBeds: number;
  roomSize: number;
  amenities: string[];
  description?: string;
  images: string[];
};

type ApiReview = {
  id: string;
  author: string;
  comment: string;
  rating: number;
  timestamp: string;
};

type UiReview = {
  id: string;
  author: string;
  comment: string;
  rating: number;
  date: string;
};

// type AvailabilitySlot = {
//   date: string;
//   available: boolean;
// };

const RoomDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user, token } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<UiRoom | null>(null);

  // Deal information
  const [activeDeal, setActiveDeal] = useState<{
    discountPercentage: number;
    originalPrice: number;
    discountedPrice: number;
  } | null>(null);

  // Reviews
  const [reviews, setReviews] = useState<UiReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // Availability (currently unused but kept for future use)
  // const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  // const [availabilityLoading, setAvailabilityLoading] = useState(false);
  // const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // New review
  const [reviewName, setReviewName] = useState(
    user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''
  );
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Helper: pick image
  const pickImage = (type?: string, name?: string) => {
    const t = (type || name || '').toLowerCase();
    if (t.includes('presidential') || t.includes('suite')) return room5;
    if (t.includes('family')) return room4;
    if (t.includes('superior')) return room3;
    if (t.includes('double')) return room2;
    return room1;
  };

  // Helper: amenity icons
  const getAmenityIcon = (amenity: string) => {
    const a = amenity.toLowerCase();
    if (a.includes('wifi')) return <Wifi size={32} />;
    if (a.includes('hairdryer') || a.includes('hair dryer') || a.includes('dryer')) return <AirVent size={32} />;
    if (a.includes('air') || a.includes('conditioning')) return <Wind size={32} />;
    if (a.includes('tv') || a.includes('netflix')) return <Tv size={32} />;
    if (a.includes('bar') || a.includes('mini')) return <Wine size={32} />;
    if (a.includes('balcony') || a.includes('view')) return <Palmtree size={32} />;
    if (a.includes('room service') || a.includes('service')) return <ConciergeBell size={32} />;
    if (a.includes('spa')) return <Palmtree size={32} />;
    if (a.includes('pool') || a.includes('swimming')) return <Waves size={32} />;
    if (a.includes('toiletries')) return <Sparkles size={32} />;
    if (a.includes('kettle') || a.includes('coffee')) return <Coffee size={32} />;
    if (a.includes('bathtub') || a.includes('bath')) return <Bath size={32} />;
    return <ConciergeBell size={32} />;
  };

  // Helper: rule icons
  const getRuleIcon = (rule: string) => {
    const r = rule.toLowerCase();
    if (r.includes('smoking')) return <CircleSlash2 size={32} />;
    if (r.includes('pet')) return <PawPrint size={32} />;
    if (r.includes('check')) return <Clock size={32} />;
    if (r.includes('quiet')) return <Volume2 size={32} />;
    if (r.includes('damage')) return <AlertCircle size={32} />;
    return <AlertCircle size={32} />;
  };

  // Scroll to top on room change
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  // Fetch room and deal
  useEffect(() => {
    if (!id) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch room details
        const res = await fetch(`${API_URL}/rooms/${id}`);
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to fetch room');
        const r = json.data as ApiRoom;
        const uploadedImages = Array.isArray(r.images) && r.images.length > 0
          ? r.images
          : [pickImage(r.roomType, r.roomName)];
        const mapped: UiRoom = {
          id: r.id,
          name: r.roomName,
          image: uploadedImages[0],
          price: Number(r.price) || 0,
          adults: r.maxGuests ?? 2,
          kids: 0,
          bedType: r.bedType || 'Queen Bed',
          numberOfBeds: r.numberOfBeds || 1,
          roomSize: r.roomSizeSqm || 25,
          amenities: Array.isArray(r.amenities) ? r.amenities : [],
          description: r.description,
          images: uploadedImages,
        };
        setRoom(mapped);
        setSelectedImage(mapped.image);

        // Fetch active deals for this room
        try {
          const dealsRes = await fetch(`${API_URL}/deals/active`);
          const dealsJson = await dealsRes.json();
          if (dealsRes.ok && dealsJson.ok) {
            const roomDeal = dealsJson.data.find((deal: any) => deal.roomId === id);
            if (roomDeal) {
              setActiveDeal({
                discountPercentage: roomDeal.discountPercentage,
                originalPrice: roomDeal.originalPrice,
                discountedPrice: roomDeal.discountedPrice
              });
            }
          }
        } catch (dealError) {
          // Silently fail if deals can't be fetched
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load room');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    if (!id) return;

    const fetchReviews = async () => {
      setReviewsLoading(true);
      setReviewsError(null);
      try {
        const res = await fetch(`${API_URL}/rooms/${id}/reviews`);
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to fetch reviews');

        const mapped: UiReview[] = (json.data as ApiReview[]).map(r => ({
          id: r.id,
          author: r.author || 'Anonymous',
          comment: r.comment,
          rating: r.rating,
          date: new Date(r.timestamp).toLocaleDateString(),
        }));

        setReviews(mapped);
      } catch (e: any) {
        setReviewsError(e.message || 'Failed to load reviews');
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  // Fetch availability (currently unused but kept for future use)
  // useEffect(() => {
  //   if (!id) return;
  //   const API_URL = (import.meta as any).env.VITE_API_URL as string;

  //   const fetchAvailability = async () => {
  //     setAvailabilityLoading(true);
  //     setAvailabilityError(null);
  //     try {
  //       const res = await fetch(`${API_URL}/admin/rooms/${id}/availability`);
  //       const json = await res.json();
  //       if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to fetch availability');

  //       setAvailability(json.data as AvailabilitySlot[]);
  //     } catch (e: any) {
  //       setAvailabilityError(e.message || 'Failed to load availability');
  //     } finally {
  //       setAvailabilityLoading(false);
  //     }
  //   };

  //   fetchAvailability();
  // }, [id]);

  // Submit review
  const submitReview = async () => {
    if (!id || !isAuthenticated) {
      setSubmitError("You must be logged in to submit a review.");
      return;
    }

    const rating = Number(newReview.rating);
    const comment = newReview.comment.trim();
    if (!comment || !(rating >= 1 && rating <= 5)) {
      setSubmitError("A rating and comment are required");
      return;
    }

    setSubmittingReview(true);
    setSubmitError(null);

    try {
      const res = await fetch(`${API_URL}/rooms/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, comment }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to submit review');
      }

      setReviews([{
        id: json.data.id,
        author: json.data.author,
        comment: json.data.comment,
        rating: json.data.rating,
        date: new Date(json.data.timestamp).toLocaleDateString(),
      }, ...reviews]);

      setNewReview({ rating: 5, comment: '' });
      setReviewName('');
    } catch (e: any) {
      setSubmitError(e.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleBookNow = () => {
    if (!room) return;

    // Get dates and guests from URL params (from search)
    const checkIn = searchParams.get('checkIn') || '';
    const checkOut = searchParams.get('checkOut') || '';
    const guests = searchParams.get('guests') || '';

    const bookingData = {
      hotelName: "Fumods Guesthouse",
      roomId: room.id || id,
      roomType: room.name,
      roomImage: room.image,
      pricePerNight: activeDeal ? activeDeal.discountedPrice : room.price,
      checkIn,
      checkOut,
      guests: guests ? parseInt(guests) : undefined,
    };

    if (!isAuthenticated) {
      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
      navigate('/signup');
    } else {
      navigate('/booking', { state: bookingData });
    }
  };

  return (
    <>
      <LoggedInNavbar />
      <div className={styles.container}>
        {loading && <div style={{ padding: 12 }}>Loading room…</div>}
        {error && !loading && <div style={{ padding: 12, color: '#b00020' }}>{error}</div>}

        {!loading && !error && room && (
          <>
            {/* Gallery */}
            <div className={styles.gallery}>
              <div className={styles.mainImage} onClick={() => setSelectedImage(room.image)}>
                <img src={room.image} alt={room.name} />
              </div>
              <div className={styles.sideImages}>
                {room.images.slice(1, 5).map((image, index) => (
                  <img
                    key={image}
                    src={image}
                    alt={`${room.name} ${index + 2}`}
                    onClick={() => setSelectedImage(image)}
                  />
                ))}
              </div>
            </div>

            {/* Info & Book */}
            <div className={styles.infoSection}>
              <div className={styles.roomType}>
                <h2>{room.name}</h2>
                {activeDeal ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <p className={styles.price} style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.9em' }}>
                        R {activeDeal.originalPrice.toLocaleString()}
                      </p>
                      <span style={{ 
                        background: 'linear-gradient(135deg, #F93448, #d62639)', 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        fontSize: '0.85em', 
                        fontWeight: '600' 
                      }}>
                        {activeDeal.discountPercentage}% OFF
                      </span>
                    </div>
                    <p className={styles.price} style={{ color: '#F93448', fontWeight: '700', fontSize: '1.3em' }}>
                      R {activeDeal.discountedPrice.toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className={styles.price}>R {room.price.toLocaleString()}</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <FavoriteButton
                  id={room.id}
                  isFavorite={isFavorite(room.id)}
                  onToggle={(id) => {
                    toggleFavorite({
                      id,
                      type: "room",
                      name: room.name,
                      price: room.price,
                      image: room.image,
                    });
                  }}
                />
                <button className={styles.bookNowBtn} onClick={handleBookNow}>
                  {isAuthenticated ? 'Book Now' : 'Sign Up to Book'}
                </button>
              </div>
            </div>

            {/* Room details */}
            <div className={styles.roomDetailsSection}>
              <h2>Room Details</h2>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </span>
                  <div className={styles.detailContent}>
                    <span className={styles.detailLabel}>Max Guests</span>
                    <span className={styles.detailValue}>{room.adults} Adults, {room.kids} Children</span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 4v16"></path>
                      <path d="M2 8h18a2 2 0 0 1 2 2v10"></path>
                      <path d="M2 17h20"></path>
                      <path d="M6 8v9"></path>
                    </svg>
                  </span>
                  <div className={styles.detailContent}>
                    <span className={styles.detailLabel}>Bed Type</span>
                    <span className={styles.detailValue}>{room.numberOfBeds} × {room.bedType}</span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                      <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                      <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                  </span>
                  <div className={styles.detailContent}>
                    <span className={styles.detailLabel}>Room Size</span>
                    <span className={styles.detailValue}>{room.roomSize} m²</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className={styles.amenitiesSection}>
              <h2>Amenities</h2>
              <div className={styles.amenitiesContainer}>
                {(room.amenities && room.amenities.length > 0 ? room.amenities : [
                  'Free WiFi', 'Air Conditioning', 'TV/Netflix', 'Mini Bar', 'Balcony View', 'Room Service', 'Spa Access', 'Swimming Pool'
                ]).map(a => (
                  <div key={a} className={styles.amenity}>
                    {getAmenityIcon(a)}
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div className={styles.rulesSection}>
              <h2>Hotel Rules</h2>
              <div className={styles.rulesContainer}>
                {['No Smoking', 'No Pets Allowed', 'Check-in: 2:00pm | Check-out: 10:00pm', 'Quiet hours after 10pm', 'Damage to property will incur a fee'].map(r => (
                  <div key={r} className={styles.rule}>
                    {getRuleIcon(r)}
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className={styles.reviewsSection}>
              <h2>Guest Reviews</h2>
              {reviewsLoading && <div>Loading reviews…</div>}
              {reviewsError && <div style={{ color: 'red' }}>{reviewsError}</div>}
              {!reviewsLoading && reviews.length === 0 && <div>No reviews yet for this room.</div>}
              {reviews.length > 0 && (
                <div className={styles.reviewsContainer}>
                  {reviews.map(r => (
                    <div key={r.id} className={styles.review}>
                      <div className={styles.reviewHeader}>
                        <strong>{r.author}</strong>
                        <span className={styles.reviewRating}>⭐ {r.rating}/5</span>
                      </div>
                      <div className={styles.reviewComment}>{r.comment}</div>
                      <div className={styles.reviewDate}>{r.date}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add review */}
              <div className={styles.addReviewSection}>
                <h3>Add Your Review</h3>
                <div className={styles.reviewForm}>
                  <input
                    type="text"
                    disabled
                    hidden
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                  />
                  <select
                    value={newReview.rating}
                    onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                  >
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                  </select>
                  <textarea
                    placeholder="Your comment"
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  />
                  <button
                    onClick={submitReview}
                    disabled={submittingReview || !newReview.comment.trim() || !reviewName.trim()}
                  >
                    {submittingReview ? 'Submitting…' : 'Submit Review'}
                  </button>
                  {submitError && <div style={{ color: 'red' }}>{submitError}</div>}
                </div>
              </div>
            </div>

            {/* Image overlay */}
            {selectedImage && (
              <div className={styles.imageOverlay} onClick={() => setSelectedImage(null)}>
                <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
                  <button className={styles.closeButton} onClick={() => setSelectedImage(null)}>✕</button>
                  <img src={selectedImage} alt="Full size view" className={styles.fullImage} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};
export default RoomDetails;
