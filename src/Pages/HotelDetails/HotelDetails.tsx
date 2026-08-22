import React, { useEffect, useMemo, useState } from "react";
import styles from "./HotelDetails.module.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LoggedInNavbar } from "../../Components/LoggedInNavbar/LoggedInNavbar";
import FavoriteButton from "../../Components/Shared/FavoriteButton";
import { useFavorites } from "../../contexts/FavoritesContext";
import ShareModal from "../../Components/Shared/ShareModal";
import shareIcon from "../../assets/share-1-svgrepo-com.svg";
import { API_URL } from "../../config/api";

// Star rating component
const STAR_SVG = ({ filled }: { filled: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
    <rect width="25" height="25" fill={filled ? "url(#pattern0_280_19)" : "none"}/>
    <defs>
      <pattern id="pattern0_280_19" patternContentUnits="objectBoundingBox" width="1" height="1">
        <use xlinkHref="#image0_280_19" transform="scale(0.0078125)"/>
      </pattern>
      <image id="image0_280_19" width="128" height="128" preserveAspectRatio="none" xlinkHref="data:image/png;base64,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"/>
    </defs>
  </svg>
);

// Import room images - matching RoomDetails page images
import room1 from "../../assets/room1.jpg";
import room2 from "../../assets/room1B.jpg";
import room3 from "../../assets/room1c.jpg";
import room4 from "../../assets/room1d.jpg";
import room5 from "../../assets/room1E.jpg";

// Import hotel images for gallery
import hotelMain from "../../assets/Hotel-Room-1.jpg";
import hotelImage1 from "../../assets/Hotel-Room-2.jpg";
import hotelImage2 from "../../assets/Hotel-Room-3.jpg";
import hotelImage3 from "../../assets/Santorini_1.jpeg";

const HotelDetails: React.FC = () => {
  // const { id } = useParams<{ id: string }>();
  // const hotelId = Number(id); // Will be used for API calls later

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toggleFavorite, isFavorite } = useFavorites();
  //const hotelFavoriteId = "hotel";
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [shareModal, setShareModal] = useState<{ isOpen: boolean; roomId: string | null; roomName: string }>({
    isOpen: false,
    roomId: null,
    roomName: "",
  });
  const [selectedRoomType, setSelectedRoomType] = useState<string>("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const [checkedAmenities, setCheckedAmenities] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [roomsData, setRoomsData] = useState<Array<{
    id: string;
    name: string;
    type: string;
    image: string;
    adults: number;
    kids: number;
    price: number;
    rating: number;
    amenities: string[];
    totalUnits?: number; // Add total units for availability check
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookedDates, setBookedDates] = useState<Array<{
    roomId: string;
    checkIn: string;
    checkOut: string;
    roomCount: number;
  }>>([]);
  const [hotelSettings, setHotelSettings] = useState<{
    hotelName: string;
    tagline: string;
    description: string;
    email: string;
    phone: string;
    website: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateProvince: string;
    postalCode: string;
    country: string;
    checkInTime: string;
    checkOutTime: string;
    faqs?: Array<{ question: string; answer: string }>;
  } | null>(null);

  // Apply search parameters from URL on mount
  useEffect(() => {
    const roomType = searchParams.get("roomType");
    const guests = searchParams.get("guests");
    
    if (roomType) {
      setSelectedRoomType(roomType);
    }
    
    // If guests are specified, we could filter based on maxGuests
    // For now, we'll just acknowledge them (could add to state if needed)
    if (guests) {
    }

    // Scroll to rooms section if coming from search
    if (roomType || guests) {
      setTimeout(() => {
        const roomsSection = document.querySelector(`.${styles.roomsSection}`);
        if (roomsSection) {
          roomsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [searchParams]);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleRoomClick = (roomId: string) => {
    // Preserve search params when navigating to room details
    const params = new URLSearchParams(searchParams);
    const queryString = params.toString();
    navigate(`/room-details/${roomId}${queryString ? `?${queryString}` : ''}`);
    window.scrollTo(0, 0);
  };

  const handleShare = (e: React.MouseEvent, roomId: string, roomName: string) => {
    e.stopPropagation();
    setShareModal({ isOpen: true, roomId, roomName });
  };

  const getShareUrl = (roomId: string | null) => {
    if (!roomId) return "";
    const baseUrl = window.location.origin;
    const basename = import.meta.env.PROD ? '/Mlab_Hotel_Team_Delta' : '';
    return `${baseUrl}${basename}/room-details/${roomId}`;
  };

  const scrollToMap = () => {
    const el = document.getElementById('hotel-map');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setCheckedAmenities(prev => {
      if (prev.includes(amenity)) {
        return prev.filter(a => a !== amenity);
      } else {
        return [...prev, amenity];
      }
    });
  };

  const clearAllFilters = () => {
    setSelectedRoomType("all");
    setSelectedPriceRange("all");
    setSelectedRating("all");
    setCheckedAmenities([]);
  };

  const hasActiveFilters = selectedRoomType !== "all" || 
                          selectedPriceRange !== "all" || 
                          selectedRating !== "all" || 
                          checkedAmenities.length > 0;

  // Hotel data from API or defaults
  const hotelData = {
    name: "Fumods Guesthouse",
    address: "Fumods Guesthouse",
    mainImage: hotelMain,
    galleryImages: [hotelImage1, hotelImage2, hotelImage3],
  };

  // Fetch hotel settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings/public`);
        const json = await res.json();
        if (res.ok && json.ok) {
          setHotelSettings(json.data);
        }
      } catch (e) {
        console.error('Failed to fetch hotel settings:', e);
      }
    };

    fetchSettings();
  }, []);

  // Fetch rooms from API and map to UI structure
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/rooms`);
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to fetch rooms');
        const rooms = json.data as Array<{
          id: string;
          roomName: string;
          roomType: string;
          price: number;
          maxGuests: number;
          amenities: string[];
          images?: string[]; // Add images from Cloudinary
          units?: Array<any>; // Add units array
        }>;

        const pickImage = (type: string, name: string) => {
          const t = (type || name || '').toLowerCase();
          if (t.includes('presidential')) return room5;
          if (t.includes('suite')) return room5;
          if (t.includes('family')) return room4;
          if (t.includes('superior')) return room3;
          if (t.includes('double')) return room2;
          return room1;
        };

        const mapped = rooms.map(r => {
          // Use Cloudinary images if available, otherwise fallback to hardcoded images
          const cloudinaryImages = Array.isArray(r.images) && r.images.length > 0 ? r.images : [];
          const fallbackImage = pickImage(r.roomType, r.roomName);
          
          return {
            id: r.id,
            name: r.roomName,
            type: r.roomType,
            image: cloudinaryImages.length > 0 ? cloudinaryImages[0] : fallbackImage,
            adults: r.maxGuests ?? 2,
            kids: 0,
            price: Number(r.price) || 0,
            rating: 4,
            amenities: Array.isArray(r.amenities) ? r.amenities : [],
            totalUnits: Array.isArray(r.units) ? r.units.length : 1 // Count active units
          };
        });
        setRoomsData(mapped);
      } catch (e: any) {
        setError(e.message || 'Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // Fetch booked dates when check-in/check-out dates are provided
  useEffect(() => {
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    
    if (!checkIn || !checkOut) {
      setBookedDates([]);
      return;
    }

    const fetchBookedDates = async () => {
      try {
        const res = await fetch(`${API_URL}/bookings/booked-dates?start=${checkIn}&end=${checkOut}`);
        const json = await res.json();
        if (res.ok && json.ok) {
          setBookedDates(json.data);
        }
      } catch (e) {
        console.error('Failed to fetch booked dates:', e);
      }
    };

    fetchBookedDates();
  }, [searchParams]);

  // List of all amenities - dynamically extracted from rooms
  const allAmenities = useMemo(() => {
    const amenitySet = new Set<string>();
    roomsData.forEach(room => {
      room.amenities.forEach(a => amenitySet.add(a));
    });
    return Array.from(amenitySet).sort();
  }, [roomsData]);

  // Extract unique room types from fetched data
  const uniqueRoomTypes = useMemo(() => {
    const types = new Set(roomsData.map(r => r.type).filter(Boolean));
    return Array.from(types).sort();
  }, [roomsData]);

  // Extract price ranges dynamically
  const priceRanges = useMemo(() => {
    if (roomsData.length === 0) return [];
    const prices = roomsData.map(r => r.price).sort((a, b) => a - b);
    const min = prices[0];
    const max = prices[prices.length - 1];
    
    // Create ranges
    if (max <= 1500) return [{ label: `R${min} - R${max}`, value: `${min}-${max}` }];
    
    const ranges = [];
    if (min < 1500) ranges.push({ label: 'R0 - R1500', value: '0-1500' });
    if (max > 1500 && min < 2000) ranges.push({ label: 'R1501 - R2000', value: '1501-2000' });
    if (max > 2000) ranges.push({ label: 'R2001+', value: '2001-99999' });
    return ranges;
  }, [roomsData]);

  // Filter rooms based on selected criteria
  const filteredRooms = useMemo(() => {
    const guestsParam = searchParams.get("guests");
    const minGuests = guestsParam ? parseInt(guestsParam, 10) : 0;
    const checkInParam = searchParams.get("checkIn");
    const checkOutParam = searchParams.get("checkOut");
    
    return roomsData.filter(room => {
      // Room Type filter
      if (selectedRoomType !== "all" && room.type !== selectedRoomType) {
        return false;
      }

      // Guest capacity filter (from search)
      if (minGuests > 0 && room.adults < minGuests) {
        return false;
      }

      // Date availability filter - only apply if both dates are provided
      if (checkInParam && checkOutParam && bookedDates.length > 0) {
        // Count how many rooms of this type are booked for the selected date range
        const bookedUnitsForRoom = bookedDates
          .filter(booking => booking.roomId === room.id)
          .reduce((total, booking) => {
            // Check if booking overlaps with search dates
            // Overlap occurs if: (booking.checkIn < searchCheckOut) AND (searchCheckIn < booking.checkOut)
            const overlaps = booking.checkIn < checkOutParam && checkInParam < booking.checkOut;
            return overlaps ? total + booking.roomCount : total;
          }, 0);

        // If all units are booked, filter out this room
        const totalUnits = room.totalUnits || 1;
        if (bookedUnitsForRoom >= totalUnits) {
          return false;
        }
      }

      // Price Range filter
      if (selectedPriceRange !== "all") {
        const [min, max] = selectedPriceRange.split("-").map(Number);
        if (max) {
          if (room.price < min || room.price > max) return false;
        } else {
          if (room.price < min) return false;
        }
      }

      // Rating filter
      if (selectedRating !== "all" && room.rating !== Number(selectedRating)) {
        return false;
      }

      // Amenities filter - room must have ALL checked amenities
      if (checkedAmenities.length > 0) {
        const hasAllCheckedAmenities = checkedAmenities.every(amenity => 
          room.amenities.includes(amenity)
        );
        if (!hasAllCheckedAmenities) {
          return false;
        }
      }

      return true;
    });
  }, [roomsData, selectedRoomType, selectedPriceRange, selectedRating, checkedAmenities, searchParams, bookedDates]);

  // FAQ data - dynamically including check-in/check-out times from settings
  const defaultFaqData = [
    {
      question: "What time is check-in and check-out?",
      answer: hotelSettings 
        ? `Check-in starts at ${hotelSettings.checkInTime} and check-out is before ${hotelSettings.checkOutTime}. Early check-in and late check-out may be available upon request, subject to availability.`
        : "Check-in starts at 2:00 PM and check-out is before 10:00 AM. Early check-in and late check-out may be available upon request, subject to availability."
    },
    {
      question: "Is the swimming pool heated?",
      answer: "We only heat our pools in the winter when temperatures are low. The pool is heated from May to September to ensure year-round comfort for our guests."
    },
    {
      question: "Is parking available?",
      answer: "Yes, secure on-site parking is available for all guests. We offer complimentary valet parking service, and our parking area is monitored 24/7 for your security."
    },
    {
      question: "Is breakfast included in the price?",
      answer: "Yes, a complimentary breakfast is included for all guests. We serve a buffet-style breakfast with continental and hot meal options from 6:30 AM to 10:30 AM daily."
    },
    {
      question: "Do you offer airport shuttle service?",
      answer: "Yes, we provide airport shuttle service for a nominal fee. Please contact our concierge at least 24 hours in advance to arrange pickup and drop-off times."
    },
    {
      question: "Are pets allowed at the hotel?",
      answer: "Unfortunately, we do not allow pets in our hotel rooms, with the exception of registered service animals. We can recommend nearby pet-friendly accommodations if needed."
    },
    {
      question: "Is there a gym or fitness center?",
      answer: "Yes, our fully equipped fitness center is open 24/7 for all guests. It features cardio equipment, free weights, and yoga mats. Personal training sessions can be arranged upon request."
    },
    {
      question: "Do you have conference or meeting rooms?",
      answer: "Yes, we have three conference rooms that can accommodate 10 to 100 people. All rooms are equipped with projectors, whiteboards, and high-speed WiFi. Catering services are also available."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and cash payments. Payment is required at check-in or can be processed online when booking."
    },
    {
      question: "Is WiFi available throughout the hotel?",
      answer: "Yes, complimentary high-speed WiFi is available in all rooms, public areas, and conference facilities. The network name and password will be provided upon check-in."
    },
    {
      question: "Do you offer room service?",
      answer: "Yes, 24-hour room service is available. Our menu offers a variety of meals, snacks, and beverages. Please call the front desk or use the in-room phone to place your order."
    },
    {
      question: "Can I cancel or modify my reservation?",
      answer: "Cancellations made at least 48 hours before check-in are eligible for a full refund. Modifications can be made up to 24 hours before arrival, subject to availability."
    }
  ];
  const faqData = hotelSettings?.faqs !== undefined
    ? hotelSettings.faqs.filter((faq) => faq.question.trim() && faq.answer.trim())
    : defaultFaqData;

  return (
    <>
      <LoggedInNavbar />
      <div className={styles.detailsPage}>
        {/* ---------- FILTERS SECTION ---------- */}
        <div className={styles.filterContainer}>
          {/* New Amenities Filter */}
          <div className={styles.newAmenitiesFilter}>
            <button 
              className={styles.amenitiesButton}
              onClick={() => setAmenitiesOpen(!amenitiesOpen)}
              type="button"
            >
              <span className={styles.amenitiesLabel}>Amenities</span>
              {checkedAmenities.length > 0 && (
                <span className={styles.amenitiesCount}>({checkedAmenities.length})</span>
              )}
              <span className={styles.dropdownArrow}>{amenitiesOpen ? '▲' : '▼'}</span>
            </button>
            
            {amenitiesOpen && (
              <div className={styles.amenitiesDropdownMenu}>
                {allAmenities.length > 0 ? allAmenities.map((amenity) => (
                  <label key={amenity} className={styles.amenityOption}>
                    <input
                      type="checkbox"
                      checked={checkedAmenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                      className={styles.amenityCheckboxInput}
                    />
                    <span className={styles.amenityText}>{amenity}</span>
                  </label>
                )) : (
                  <div className={styles.amenityOption}>No amenities available</div>
                )}
              </div>
            )}
          </div>

          <select 
            className={styles.filterSelect}
            value={selectedRoomType}
            onChange={(e) => setSelectedRoomType(e.target.value)}
            disabled={roomsData.length === 0}
          >
            <option value="all">All Room Types</option>
            {uniqueRoomTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select 
            className={styles.filterSelect}
            value={selectedPriceRange}
            onChange={(e) => setSelectedPriceRange(e.target.value)}
            disabled={roomsData.length === 0}
          >
            <option value="all">All Prices</option>
            {priceRanges.map((range) => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>

          <select 
            className={styles.filterSelect}
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            disabled={roomsData.length === 0}
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
          </select>

          {hasActiveFilters && (
            <button 
              className={styles.clearFiltersBtn}
              onClick={clearAllFilters}
              type="button"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* ---------- HEADER SECTION ---------- */}
        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.hotelName}>{hotelData.name}</h1>
            <p className={styles.hotelAddress}>{hotelData.address}</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.mapBtn} onClick={scrollToMap}>View on Map</button>
          </div>
        </header>

        {/* ---------- IMAGE GALLERY ---------- */}
        <section className={styles.imageGallery}>
          <div className={styles.imagePlaceholder} onClick={() => setSelectedImage(hotelData.mainImage)}>
            <img src={hotelData.mainImage} alt="Main Hotel View" />
          </div>
          <div className={styles.imageRow}>
            {hotelData.galleryImages.map((img, index) => (
              <div key={index} className={styles.smallImagePlaceholder} onClick={() => setSelectedImage(img)}>
                <img src={img} alt={`Hotel view ${index + 1}`} />
              </div>
            ))}
          </div>
        </section>

        {/* ---------- ROOMS GRID ---------- */}
        <section className={styles.roomsSection}>
          <h2 className={styles.sectionTitle}>
            Available Rooms {roomsData.length > 0 && filteredRooms.length < roomsData.length && `(${filteredRooms.length} of ${roomsData.length})`}
          </h2>
          {loading && <div style={{padding: 12}}>Loading rooms…</div>}
          {error && !loading && <div style={{padding: 12, color:'#b00020'}}>{error}</div>}
          <div className={styles.roomsGrid}>
            {filteredRooms.length > 0 ? filteredRooms.map((room) => (
              <div 
                key={room.id} 
                className={styles.roomCard}
                onClick={() => handleRoomClick(room.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.roomImagePlaceholder}>
                  <img src={room.image} alt={room.name} />
                  <div className={styles.roomActions}>
                    <button
                      className={styles.shareButton}
                      onClick={(e) => handleShare(e, room.id, room.name)}
                      aria-label="Share room"
                    >
                      <img src={shareIcon} alt="Share" className={styles.shareIcon} />
                    </button>
                    <div className={styles.roomFavWrapper}>
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
                    </div>
                  </div>
                </div>
                <div className={styles.roomDetails}>
                  <h3 className={styles.roomName}>{room.name}</h3>
                  <div className={styles.starRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <STAR_SVG key={star} filled={star <= room.rating} />
                    ))}
                  </div>
                  <p>{room.adults} guests</p>
                  <p className={styles.price}>Price per night: R {room.price.toLocaleString()}</p>
                </div>
              </div>
            )) : (
              <div className={styles.noResults}>
                <p>No rooms match your selected filters. Try adjusting your criteria.</p>
              </div>
            )}
          </div>
        </section>

        {/* ---------- FAQ + MAP SIDE-BY-SIDE ---------- */}
        <section className={styles.infoSplitSection}>
          {/* FAQ */}
          <section className={styles.faqSection}>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <div className={styles.faqList}>
              {faqData.map((faq, index) => (
                <div key={index} className={styles.faqItem}>
                  <div 
                    className={styles.faqHeader}
                    onClick={() => toggleFaq(index)}
                  >
                    <h4>{faq.question}</h4>
                    <button 
                      className={`${styles.faqToggle} ${expandedFaq === index ? styles.expanded : ''}`}
                      aria-label="Toggle answer"
                    >
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 16 16" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        className={styles.arrow}
                      >
                        <path 
                          d="M4 6L8 10L12 6" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  {expandedFaq === index && (
                    <p className={styles.faqAnswer}>{faq.answer}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* MAP */}
          <section id="hotel-map" className={styles.mapSection}>
            <h2 className={styles.sectionTitle}>Location</h2>
            <div className={styles.mapContainer}>
              <iframe
                title={`${hotelData.name} location`}
                src="https://maps.google.com/maps?q=Fumods%20Guesthouse&hl=en&z=16&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <div className={styles.mapActions}>
              <a
                className={styles.mapLinkBtn}
                href="https://maps.app.goo.gl/yTHAxD6AntoTAtgPA"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Google Maps
              </a>
            </div>
          </section>
        </section>

        {/* ---------- IMAGE OVERLAY MODAL ---------- */}
        {selectedImage && (
          <div className={styles.imageOverlay} onClick={() => setSelectedImage(null)}>
            <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
              <button 
                className={styles.closeButton} 
                onClick={() => setSelectedImage(null)}
                aria-label="Close image"
              >
                ✕
              </button>
              <img src={selectedImage} alt="Full size view" className={styles.fullImage} />
            </div>
          </div>
        )}

        {/* ---------- SHARE MODAL ---------- */}
        <ShareModal
          isOpen={shareModal.isOpen}
          onClose={() => setShareModal({ isOpen: false, roomId: null, roomName: "" })}
          shareUrl={getShareUrl(shareModal.roomId)}
          roomName={shareModal.roomName}
        />
      </div>
    </>
  );
};

export default HotelDetails;

