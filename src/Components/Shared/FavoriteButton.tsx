import React from "react";
import styles from "./FavoriteButton.module.css";

interface FavoriteButtonProps {
  /** Unique id – "hotel" for the hotel, room.id for a room */
  id: string;
  /** true = filled heart */
  isFavorite: boolean;
  /** Called when the user clicks */
  onToggle: (id: string, next: boolean) => void;
}

/**
 * Heart button that matches Fumods Guesthouse styling.
 * Uses the Fumods Guesthouse red gradient (#F93448).
 */
const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  id,
  isFavorite,
  onToggle,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent navigation when clicking the heart
    onToggle(id, !isFavorite);
  };

  return (
    <button
      type="button"
      className={`${styles.favBtn} ${isFavorite ? styles.filled : ""}`}
      onClick={handleClick}
      aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
};

export default FavoriteButton;


