import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";
import Logo from "../../assets/Logo.png";
import { FaBell } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { usePopia } from "../../contexts/PopiaContext";
import { API_URL } from "../../config/api";

interface Notification {
  id: number;
  user_id: number;
  message: string;
  read: boolean;
  created_at: string;
  booking_id?: number;
  type?: 'booking_confirmation' | 'booking_update' | 'promotion' | 'general';
}

export const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLLIElement>(null);
  const { user, logout, isAuthenticated } = useAuth();
  const { isAccepted, setShowOverlay } = usePopia();
  const navigate = useNavigate();

  const handleLoginClick = () => {
    if (!isAccepted) {
      setShowOverlay(true);
      return;
    }
    navigate("/signin");
  };

  const handleSignupClick = () => {
    if (!isAccepted) {
      setShowOverlay(true);
      return;
    }
    navigate("/signup");
  };
  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  const handleRoomsClick = () => {
    if (!isAccepted) return;
    navigate("/hotel-details");
  };

  const fetchNotifications = async () => {
    if (!isAuthenticated || !user) return;
    
    const token = localStorage.getItem('hotel_token');
    if (!token) return;
    
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) return;
      
      const json = await res.json();
      if (json.ok) {
        setNotifications(json.data);
        const unread = json.data.filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('hotel_token');
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'booking_confirmation' || notification.type === 'booking_update') {
      if (notification.booking_id) {
        navigate(`/profile?tab=bookings&highlight=${notification.booking_id}`);
      }
    }
    
    setShowNotifications(false);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <div className={styles.SubnavContainer1} onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <div className={styles.LogoCard}>
            <img src={Logo} alt="Logo" style={{ width: "50px", height: "50px" }} />
          </div>
          <div className={styles.logo}>Fumods Hotel</div>
        </div>

        <div className={styles.SubnavContainer2}>
          <ul className={`${styles.navLinks} ${menuOpen ? styles.showMenu : ""}`}>
            {isAuthenticated ? (
              <>
                <li onClick={handleRoomsClick}>Rooms</li>
                {/* Home button removed when logged in as requested */}

                {/* Notification Bell with Dropdown */}
                <li className={styles.notificationWrapper} ref={notificationRef}>
                  <div style={{ position: 'relative' }}>
                    <FaBell
                      size={22}
                      style={{ cursor: "pointer" }}
                      onClick={() => setShowNotifications(!showNotifications)}
                    />
                    {unreadCount > 0 && (
                      <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                    
                    {showNotifications && (
                      <div className={styles.notificationDropdown}>
                        <div className={styles.notificationHeader}>
                          <h3>Notifications</h3>
                          {unreadCount > 0 && <span className={styles.unreadCount}>{unreadCount} new</span>}
                        </div>
                        <div className={styles.notificationList}>
                          {notifications.length === 0 ? (
                            <div className={styles.noNotifications}>No notifications yet</div>
                          ) : (
                            notifications.slice(0, 10).map(notification => (
                              <div 
                                key={notification.id}
                                className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                              >
                                <div className={styles.notificationContent}>
                                  <p className={styles.notificationMessage}>{notification.message}</p>
                                  <span className={styles.notificationTime}>
                                    {new Date(notification.created_at).toLocaleString()}
                                  </span>
                                </div>
                                {!notification.read && <div className={styles.unreadDot}></div>}
                              </div>
                            ))
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <div className={styles.notificationFooter}>
                            <button onClick={() => { navigate('/notifications'); setShowNotifications(false); }}>
                              View all notifications
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>

                <li 
                  onClick={() => navigate('/profile')} 
                  style={{ cursor: 'pointer' }}
                >
                  {user ? `${user.firstName} ${user.lastName}` : ""}
                </li>
                <li className={styles.redButton} onClick={handleLogout}>Logout</li>
              </>
            ) : (
              <>
                <li 
                  onClick={handleRoomsClick}
                  style={{ 
                    opacity: isAccepted ? 1 : 0.5, 
                    cursor: isAccepted ? 'pointer' : 'not-allowed'
                  }}
                >
                  Rooms
                </li>
                <li className={styles.redButton} onClick={handleLoginClick}>Sign In</li>
                <li className={styles.redButton} onClick={handleSignupClick}>Sign Up</li>
              </>
            )}
          </ul>

          <button className={styles.hamburger} onClick={() => setMenuOpen((prev) => !prev)}>
            <span className={styles.bar}></span>
            <span className={styles.bar}></span>
            <span className={styles.bar}></span>
          </button>
        </div>
      </div>
    </nav>
  );
};
