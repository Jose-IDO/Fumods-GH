import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./DealSection.module.css";
import ShareModal from "../Shared/ShareModal";
import shareIcon from "../../assets/share-1-svgrepo-com.svg";
import { usePopia } from "../../contexts/PopiaContext"; 

type DealWithRoom = {
  id: number;
  roomId: string;
  title: string;
  description?: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  roomName: string;
  roomType: string;
  originalPrice: number;
  discountedPrice: number;
  images?: string[];
  maxGuests: number;
  bedType: string;
};

type DisplayDeal = {
  id: string;
  hotel: string;
  location: string;
  nights: string;
  rating: number; 
  views: number;
  oldPrice: string;
  newPrice: string;
  image?: string;
  roomId: string;
};

const STAR_SVG = ({ filled }: { filled: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill={filled ? "#FBBF24" : "none"}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M12 2.5l2.9 5.88 6.49.95-4.69 4.57 1.11 6.47L12 17.77l-5.81 3.6 1.11-6.47L2.6 9.33l6.49-.95L12 2.5z"
      stroke="#B79A1B"
      strokeWidth="0.4"
    />
  </svg>
);

const EYE_SVG = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
      stroke="#374151"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" fill="#374151" />
  </svg>
);

import hotelRoom1 from "../../assets/Hotel-Room-1.jpg";
import hotelRoom2 from "../../assets/Hotel-Room-2.jpg";
import hotelRoom3 from "../../assets/Hotel-Room-3.jpg";
import { API_URL } from "../../config/api";

const hotelImages = [hotelRoom1, hotelRoom2, hotelRoom3];

const DealsSection: React.FC = () => {
  const { isAccepted } = usePopia();
  const navigate = useNavigate();
  const [deals, setDeals] = useState<DisplayDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState<{ isOpen: boolean; dealId: string | null; dealName: string }>({
    isOpen: false,
    dealId: null,
    dealName: "",
  });

  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/deals/active`);
        const json = await response.json();

        if (!response.ok || !json.ok) {
          throw new Error(json.error || "Failed to fetch deals");
        }

        const dealsData: DealWithRoom[] = json.data || [];
        
        // Transform API data to display format
        const displayDeals: DisplayDeal[] = dealsData.map((deal, idx) => {
          // Calculate nights from date range
          const startDate = new Date(deal.startDate);
          const endDate = new Date(deal.endDate);
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const nights = diffDays === 1 ? "1 night" : `${diffDays} nights`;

          // Get image from deal images or use fallback
          let imageUrl: string | undefined;
          if (deal.images) {
            let imagesArray: string[] = [];
            
            // Handle different image formats
            if (Array.isArray(deal.images)) {
              imagesArray = deal.images;
            } else if (typeof deal.images === 'string') {
              try {
                // Try to parse as JSON if it's a string
                imagesArray = JSON.parse(deal.images);
              } catch {
                // If not JSON, treat as single image string
                imagesArray = [deal.images];
              }
            }
            
            if (imagesArray.length > 0) {
              const firstImage = imagesArray[0];
              imageUrl = firstImage.startsWith('http') 
                ? firstImage 
                : `${API_URL}/uploads/${firstImage}`;
            }
          }
          
          // Fallback to default images if no image found
          if (!imageUrl) {
            imageUrl = hotelImages[idx % hotelImages.length];
          }

          return {
            id: deal.id.toString(),
            hotel: deal.roomName || deal.title || "Fumods Guesthouse",
            location: "Fumods Guesthouse",
            nights,
            rating: 4, // Default rating, can be enhanced later
            views: Math.floor(Math.random() * 1000) + 100, // Placeholder views
            oldPrice: `R${Math.round(deal.originalPrice).toLocaleString()}`,
            newPrice: `R${Math.round(deal.discountedPrice).toLocaleString()}`,
            image: imageUrl,
            roomId: deal.roomId,
          };
        });

        setDeals(displayDeals);
      } catch (err: any) {
        console.error("Error fetching deals:", err);
        setError(err.message || "Failed to load deals");
        // Fallback to empty array on error
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  const handleCardClick = (roomId: string) => {
    if (!isAccepted) return;
    navigate(`/room-details/${roomId}`);
  };

  const handleShare = (e: React.MouseEvent, dealId: string, dealName: string) => {
    e.stopPropagation();
    if (!isAccepted) return;
    setShareModal({ isOpen: true, dealId, dealName });
  };

  const getShareUrl = (dealId: string | null) => {
    if (!dealId) return "";
    const baseUrl = window.location.origin;
    const basename = import.meta.env.PROD ? '/Mlab_Hotel_Team_Delta' : '';
    // Link to hotel-details page
    return `${baseUrl}${basename}/hotel-details`;
  };

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.headerRow}>
          <h2 className={styles.heading}>Deals For The Weekend</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading deals...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.section}>
        <div className={styles.headerRow}>
          <h2 className={styles.heading}>Deals For The Weekend</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#F93448' }}>
          <p>Error loading deals: {error}</p>
        </div>
      </section>
    );
  }

  if (deals.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.headerRow}>
          <h2 className={styles.heading}>Deals For The Weekend</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>There are no deals available currently.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>Deals For The Weekend</h2>
      </div>

      <div className={styles.grid}>
        {deals.map((deal, idx) => (
          <div 
            className={styles.card} 
            key={deal.id}
            onClick={() => handleCardClick(deal.roomId)}
            style={{ 
              opacity: isAccepted ? 1 : 0.5, 
              cursor: isAccepted ? 'pointer' : 'not-allowed',
              pointerEvents: isAccepted ? 'auto' : 'none'
            }}
          >
            <div className={styles.imageContainer}>
              <img
                src={deal.image || hotelImages[idx % hotelImages.length]}
                alt={deal.hotel}
                className={styles.hotelImage}
                style={{ objectFit: "cover", width: "100%", height: "175px" }}
                onError={(e) => {
                  // Fallback to default image on error
                  (e.target as HTMLImageElement).src = hotelImages[idx % hotelImages.length];
                }}
              />
              <button
                className={styles.shareButton}
                onClick={(e) => handleShare(e, deal.id, deal.hotel)}
                aria-label="Share deal"
                disabled={!isAccepted}
                style={{ 
                  opacity: isAccepted ? 1 : 0.5, 
                  cursor: isAccepted ? 'pointer' : 'not-allowed',
                  pointerEvents: isAccepted ? 'auto' : 'none'
                }}
              >
                <img src={shareIcon} alt="Share" className={styles.shareIcon} />
              </button>
            </div>

            <div className={styles.content}>
              <div className={styles.titleRow}>
                <h3 className={styles.hotelTitle}>{deal.hotel}</h3>
                <span className={styles.location}>{deal.location}</span>
              </div>

              <div className={styles.metaRow}>
                <div className={styles.stars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={styles.star}>
                      <STAR_SVG filled={i < deal.rating} />
                    </span>
                  ))}
                </div>
                <div className={styles.views}>
                  <span className={styles.eyeIcon}><EYE_SVG /></span>
                  <span className={styles.viewCount}>{deal.views}</span>
                </div>
              </div>

              <p className={styles.nights}>{deal.nights}</p>

              <div className={styles.pricing}>
                <span className={styles.oldPrice}>{deal.oldPrice}</span>
                <span className={styles.newPrice}>{deal.newPrice}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.buttonRow}>
        <button 
          className={styles.viewAllBtn}
          disabled={!isAccepted}
          style={{ 
            opacity: isAccepted ? 1 : 0.5, 
            cursor: isAccepted ? 'pointer' : 'not-allowed'
          }}
        >
          View All
        </button>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal({ isOpen: false, dealId: null, dealName: "" })}
        shareUrl={getShareUrl(shareModal.dealId)}
        roomName={shareModal.dealName}
      />
    </section>
  );
};

export default DealsSection;
