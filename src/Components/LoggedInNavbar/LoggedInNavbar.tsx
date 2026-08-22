import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import styles from "./LoggedInNavbar.module.css";
import Logo from '../../assets/Logo.png';
import SouthAfricaFlag from '../../assets/south-africa-svgrepo-com.svg';
import { API_URL } from '../../config/api';

interface Notification {
  id: number;
  user_id: number;
  message: string;
  read: boolean;
  created_at: string;
  booking_id?: number;
  type?: 'booking_confirmation' | 'booking_update' | 'promotion' | 'general';
}

export const LoggedInNavbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated || !user) {
      return;
    }
    
    const token = localStorage.getItem('hotel_token');
    if (!token) {
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        return;
      }
      
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
      const interval = setInterval(fetchNotifications, 30000);
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLoginClick = () => {
    navigate('/signin');
  };

  const handleSignupClick = () => {
    navigate('/signup');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logoSection} onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
        <img src={Logo} alt="Fumods Guesthouse logo" style={{width: '40px', height: '40px'}} />
        <h2 className={styles.brandName}>Fumods Guesthouse</h2>
      </div>


      <div className={styles.searchBar}>
        <input 
          type="text" 
          placeholder="Search..." 
          className={styles.searchInput}
        />
        <button className={styles.searchButton}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button>
      </div>

      <div className={styles.profileSection}>
        {isAuthenticated ? (
          <>
            <div className={styles.notificationWrapper} ref={notificationRef}>
              <button 
                className={styles.notificationBell}
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                  <span className={styles.notificationBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              
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

            <div className={styles.userInfo} onClick={() => navigate('/profile')} style={{cursor: 'pointer'}}>
              <div className={styles.profileIcon}>
                <span className={styles.profileInitials}>
                  {user?.firstName?.charAt(0).toUpperCase()}{user?.lastName?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span 
                className={styles.userName}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/profile');
                }}
                style={{cursor: 'pointer'}}
              >
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </span>
              <img src={SouthAfricaFlag} alt="South Africa" className={styles.flagIcon} />
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <div className={styles.authButtons}>
            <button className={styles.signInBtn} onClick={handleLoginClick}>
              Sign In
            </button>
            <button className={styles.signUpBtn} onClick={handleSignupClick}>
              Sign Up
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
