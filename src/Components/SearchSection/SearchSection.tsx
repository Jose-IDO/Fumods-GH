import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SearchSection.module.css";
import { usePopia } from "../../contexts/PopiaContext";
import { ROOM_TYPES } from "../../utils/roomTypes";

const SearchSection: React.FC = () => {
  const navigate = useNavigate();
  const { isAccepted } = usePopia();
  const [selectedRoomType, setSelectedRoomType] = useState<string>("all");
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [guests, setGuests] = useState<string>("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAccepted) return;
    
    // Navigate to hotel details page with search params
    const searchParams = new URLSearchParams();
    if (selectedRoomType !== "all") searchParams.set("roomType", selectedRoomType);
    if (checkIn) searchParams.set("checkIn", checkIn);
    if (checkOut) searchParams.set("checkOut", checkOut);
    if (guests) searchParams.set("guests", guests);

    const queryString = searchParams.toString();
    navigate(`/hotel-details${queryString ? `?${queryString}` : ""}`);
  };

  // Set minimum dates (today for check-in, tomorrow for check-out)
  const today = new Date().toISOString().split('T')[0];
  const minCheckOut = checkIn || today;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <form className={styles.form} onSubmit={handleSearch}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Room Type</label>
            <select 
              className={styles.select}
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
              disabled={!isAccepted}
            >
              <option value="all">All Room Types</option>
              {ROOM_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Check-in</label>
            <input 
              className={styles.input}
              type="date" 
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={today}
              disabled={!isAccepted}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Check-out</label>
            <input 
              className={styles.input}
              type="date" 
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={minCheckOut}
              disabled={!isAccepted}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Guests</label>
            <input 
              className={styles.input}
              type="number" 
              placeholder="Number of guests" 
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              min="1"
              disabled={!isAccepted}
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.searchButton}
            disabled={!isAccepted}
            style={{ opacity: isAccepted ? 1 : 0.5, cursor: isAccepted ? 'pointer' : 'not-allowed' }}
          >
            Search Rooms
          </button>
        </form>
      </div>
    </section>
  );
};

export default SearchSection;
