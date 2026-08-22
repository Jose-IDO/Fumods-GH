import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import styles from "./HotelRoomsGrid.module.css";
import Displayroom1 from "../../assets/Displayroom 1.jpg";
import Displayroom2 from "../../assets/Displayroom 2.jpg";
import Displayroom3 from "../../assets/Displayroom 3.jpg";
import Displayroom4 from "../../assets/Displayroom 4.jpg";
import Displayroom5 from "../../assets/Displayroom 5.jpg";
import Displayroom6 from "../../assets/Displayroom 6.jpg";
import Displayroom7 from "../../assets/Displayroom 7.jpg";
import Displayroom8 from "../../assets/Displayroom 8.webp";
import Displayroom9 from "../../assets/Displayroom 9.jpg";
import BedroomIcon from "../../assets/bedroom-hotel-svgrepo-com.svg";
import BathroomIcon from "../../assets/bathroom-svgrepo-com.svg";
import GuestsIcon from "../../assets/people-svgrepo-com.svg";

const AMENITY_BADGE = ({ text }: { text: string }) => (
  <svg width="80" height="28" viewBox="0 0 107 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25 0.5H82C95.531 0.5 106.5 11.469 106.5 25C106.5 38.531 95.531 49.5 82 49.5H25C11.469 49.5 0.5 38.531 0.5 25C0.5 11.469 11.469 0.5 25 0.5Z" fill="white" stroke="black"/>
    <text x="53.5" y="28" textAnchor="middle" fill="black" fontSize="12" fontWeight="500">
      {text}
    </text>
  </svg>
);


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

export const HotelRoomsGrid = () => {
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  const roomImages = [
    Displayroom1,
    Displayroom2,
    Displayroom3,
    Displayroom4,
    Displayroom5,
    Displayroom6,
    Displayroom7,
    Displayroom8,
    Displayroom9
  ];

  const hotelData = [
    { name: "Fumods Guesthouse Durban", rating: 3.5, amenities: ["WiFi", "Pool", "Parking"], bedrooms: 2, bathrooms: 1, guests: 4, price: 1200 },
    { name: "Fumods Guesthouse Cape Town", rating: 5, amenities: ["WiFi", "Spa", "Beach Access"], bedrooms: 3, bathrooms: 2, guests: 6, price: 1500 },
    { name: "Fumods Guesthouse Sandton", rating: 4, amenities: ["WiFi", "Gym", "Business Center"], bedrooms: 1, bathrooms: 1, guests: 2, price: 800 },
    { name: "Fumods Guesthouse Waterkloof", rating: 3, amenities: ["WiFi", "Parking", "Restaurant"], bedrooms: 2, bathrooms: 1, guests: 4, price: 1000 },
    { name: "Fumods Guesthouse Stellenbosch", rating: 4.5, amenities: ["WiFi", "Spa", "Mountain View"], bedrooms: 3, bathrooms: 3, guests: 6, price: 1500 },
    { name: "Fumods Guesthouse Durban", rating: 3.5, amenities: ["WiFi", "Pool", "Room Service"], bedrooms: 1, bathrooms: 1, guests: 2, price: 750 },
    { name: "Fumods Guesthouse Cape Town", rating: 4.5, amenities: ["WiFi", "Pool", "Bar"], bedrooms: 2, bathrooms: 1, guests: 4, price: 1500 },
    { name: "Fumods Guesthouse Sandton", rating: 3, amenities: ["WiFi", "Parking", "Concierge"], bedrooms: 3, bathrooms: 2, guests: 6, price: 1500 },
    { name: "Fumods Guesthouse Waterkloof", rating: 4, amenities: ["WiFi", "Gym", "Laundry"], bedrooms: 2, bathrooms: 1, guests: 3, price: 950 }
  ];

  const numberOfRooms = showAll ? 9 : 6;

  return (
    <div className={styles.hotelGridWrapper}>
      <div className={styles.hotelGrid}>
{Array.from({ length: numberOfRooms }).map((_, index) => (
  <div
    key={index}
    className={styles.hotelCard}
    style={{ cursor: 'pointer' }}
    onClick={() => navigate(`/hotel-details/${index + 1}`)}
  >
    <img 
      src={roomImages[index]} 
      alt={`Room ${index + 1}`}
      className={styles.hotelImage}
    />

            <div className={styles.amenitiesContainer}>
              {hotelData[index].amenities.map((amenity, i) => (
                <AMENITY_BADGE key={i} text={amenity} />
              ))}
            </div>
            <div className={styles.hotelNameContainer}>
              <h4 className={styles.hotelName}>{hotelData[index].name}</h4>
              <div className={styles.stars}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const rating = hotelData[index].rating;
                  if (i + 1 <= rating) {
                    return <span key={i}><STAR_SVG filled={true} /></span>;
                  } else if (i < rating && i + 1 > rating) {
                    return <span key={i}><STAR_SVG filled={true} /></span>;
                  } else {
                    return <span key={i}><STAR_SVG filled={false} /></span>;
                  }
                })}
              </div>
            </div>
            <div className={styles.roomDetailsContainer}>
              <div className={styles.roomDetail}>
                <img src={BedroomIcon} alt="Bedrooms" className={styles.roomIcon} />
                <span>{hotelData[index].bedrooms}</span>
              </div>
              <div className={styles.roomDetail}>
                <img src={BathroomIcon} alt="Bathrooms" className={styles.roomIcon} />
                <span>{hotelData[index].bathrooms}</span>
              </div>
              <div className={styles.roomDetail}>
                <img src={GuestsIcon} alt="Guests" className={styles.roomIcon} />
                <span>{hotelData[index].guests}</span>
              </div>
            </div>
            <div className={styles.price}>
              R{hotelData[index].price}/day
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowAll(!showAll)}
        className={styles.viewAllBtn}
      >
        {showAll ? "Show Less" : "View All"}
      </button>
    </div>
  );
};
