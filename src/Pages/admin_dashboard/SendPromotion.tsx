import React, { useState } from 'react';
import styles from './SendPromotion.module.css';
import { API_URL } from '../../config/api';

export const SendPromotion: React.FC = () => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setErrorMessage('Please enter a message');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('hotel_token');
      const res = await fetch(`${API_URL}/notifications/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to send promotion');
      }

      setSuccessMessage(`Promotion sent to ${json.count} users!`);
      setTimeout(() => setSuccessMessage(null), 5000);
      setMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send promotion');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.container}>
      {successMessage && <div className={styles.successAlert}>✓ {successMessage}</div>}
      {errorMessage && <div className={styles.errorAlert}>⚠️ {errorMessage}</div>}

      <div className={styles.headerBar}>
        <h1 className={styles.title}>Send Promotional Notification</h1>
      </div>

      <div className={styles.formSection}>
        <p className={styles.description}>
          Send promotional notifications to all registered users. This will appear in their notification bell.
        </p>

        <form onSubmit={handleSend} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Promotion Message</label>
            <textarea
              className={styles.textarea}
              placeholder="e.g., Special Weekend Sale! Get 20% off all bookings this weekend. Book now!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={500}
            />
            <small className={styles.charCount}>{message.length}/500 characters</small>
          </div>

          <div className={styles.exampleBox}>
            <h4>Example Promotions:</h4>
            <ul>
              <li>🎉 Summer Sale! Get 25% off all luxury suites this month!</li>
              <li>🌟 New Event: Join us for our exclusive Wine Tasting evening on Friday!</li>
              <li>💝 Valentine's Special: Book a romantic getaway and get complimentary champagne!</li>
              <li>⚡ Flash Sale! 30% off bookings made in the next 24 hours!</li>
            </ul>
          </div>

          <button 
            type="submit" 
            className={styles.sendButton}
            disabled={sending || !message.trim()}
          >
            {sending ? 'Sending...' : 'Send to All Users'}
          </button>
        </form>
      </div>
    </div>
  );
};
