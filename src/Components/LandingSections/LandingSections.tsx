// src/Components/LandingSections/LandingSections.tsx
import React, { useEffect, useState } from "react";
import styles from "./LandingSections.module.css";
import { API_URL } from "../../config/api";
type Event = {
  id: number;
  title: string;
  date: string;
  description: string;
  imageUrl?: string; // frontend-friendly URL
};

type LinkType = 'about' | 'contact' | 'privacy' | null;

const LandingSections: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<LinkType>(null);
  const [openModal, setOpenModal] = useState<LinkType>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/admin/events`);
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to fetch events");
      }

      // Events now use Cloudinary URLs directly (no mapping needed)
      setEvents(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className={styles.landingSections}>
      {/* ---------- UPCOMING EVENTS ---------- */}
      <section className={styles.upcomingSection}>
        <h2 className={styles.sectionTitle}>Upcoming Events</h2>

        {loading && <div>Loading events…</div>}
        {error && <div style={{ color: "red" }}>{error}</div>}

        <div className={styles.eventsGrid}>
          {!loading && events.length === 0 && <div>No upcoming events.</div>}

          {events.map((event) => (
            <div key={event.id} className={styles.eventCard}>
              {event.imageUrl && (
                <div className={styles.eventImagePlaceholder}>
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className={styles.eventImage}
                  />
                </div>
              )}

              <div className={styles.eventDetails}>
                <h3 className={styles.eventTitle}>{event.title}</h3>
                <p className={styles.eventDate}>
                  {new Date(event.date).toLocaleDateString()}
                </p>
                <p className={styles.eventDescription}>{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* ---------- ADDRESS SECTION ---------- */}
      <section className={styles.addressSection}>
        <h2 className={styles.sectionTitle}>Our Address</h2>
        <div className={styles.addressCard}>
          <div className={styles.mapPlaceholder}>
            <iframe
              title="Fumods Guesthouse location"
              src="https://maps.google.com/maps?q=Fumods%20Guesthouse&hl=en&z=15&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
            />
          </div>
          <div className={styles.addressDetails}>
            <p>Fumods Guesthouse</p>
            <a
              href="https://maps.app.goo.gl/yTHAxD6AntoTAtgPA"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mapLink}
            >
              View on Google Maps
            </a>
          </div>
        </div>
      </section>

      {/* ---------- FOOTER SECTION ---------- */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerColumn}>
            <h4>Useful Links</h4>
            <ul>
              <li
                className={styles.footerLink}
                onMouseEnter={() => setHoveredLink('about')}
                onMouseLeave={() => setHoveredLink(null)}
                onClick={() => setOpenModal('about')}
              >
                About Us
                {hoveredLink === 'about' && (
                  <div className={styles.linkOverlay}>
                    <h5 className={styles.overlayTitle}>About Us</h5>
                    <p className={styles.overlayContent}>
                      Fumods Guesthouse offers welcoming accommodation, thoughtful service, and memorable stays for both business and leisure travellers...more
                    </p>
                  </div>
                )}
              </li>
              <li
                className={styles.footerLink}
                onMouseEnter={() => setHoveredLink('contact')}
                onMouseLeave={() => setHoveredLink(null)}
                onClick={() => setOpenModal('contact')}
              >
                Contact Us
                {hoveredLink === 'contact' && (
                  <div className={styles.linkOverlay}>
                    <h5 className={styles.overlayTitle}>Contact Us</h5>
                    <p className={styles.overlayContent}>
                      Get in touch with our friendly team. We're here to assist you with reservations, inquiries, or any special requests. Reach us via phone, email, or visit us at our location in Pretoria...more
                    </p>
                  </div>
                )}
              </li>
              <li className={styles.footerLinkNoHover}>Terms & Conditions</li>
              <li
                className={styles.footerLink}
                onMouseEnter={() => setHoveredLink('privacy')}
                onMouseLeave={() => setHoveredLink(null)}
                onClick={() => setOpenModal('privacy')}
              >
                Privacy & Cookies
                {hoveredLink === 'privacy' && (
                  <div className={styles.linkOverlay}>
                    <h5 className={styles.overlayTitle}>Privacy & Cookies</h5>
                    <p className={styles.overlayContent}>
                      We are committed to protecting your privacy in accordance with POPIA. Our privacy policy explains how we collect, use, and safeguard your personal information. We use cookies to enhance your browsing experience...more
                    </p>
                  </div>
                )}
              </li>
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h4>Address</h4>
            <p>Fumods Guesthouse</p>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© 2025 Fumods Guesthouse. All rights reserved.</p>
        </div>
      </footer>

      {/* Modal Overlays */}
      {openModal === 'about' && (
        <div className={styles.modalBackdrop} onClick={() => setOpenModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseButton} onClick={() => setOpenModal(null)}>✕</button>
            <h2 className={styles.modalTitle}>About Us</h2>
            <div className={styles.modalBody}>
              <p>Fumods Guesthouse offers welcoming accommodation, thoughtful service, and memorable stays for both business and leisure travellers.</p>
              <p>Our hotel features elegantly designed rooms and suites, state-of-the-art facilities, and a commitment to excellence that has made us a trusted name in the hospitality industry.</p>
              <p>At Fumods Guesthouse, we believe in creating memorable experiences for our guests. Whether you're visiting for business or pleasure, our dedicated team is here to ensure your stay is comfortable and enjoyable.</p>
              <p>We pride ourselves on our attention to detail, personalized service, and commitment to sustainability. Our hotel combines modern amenities with warm hospitality, creating the perfect environment for relaxation and productivity.</p>
            </div>
          </div>
        </div>
      )}

      {openModal === 'contact' && (
        <div className={styles.modalBackdrop} onClick={() => setOpenModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseButton} onClick={() => setOpenModal(null)}>✕</button>
            <h2 className={styles.modalTitle}>Contact Us</h2>
            <div className={styles.modalBody}>
              <p>We're here to help! Get in touch with our friendly team for reservations, inquiries, or any special requests.</p>
              <div style={{ marginTop: '1.5rem' }}>
                <p><strong>Address:</strong></p>
                <p>Fumods Guesthouse<br /><a href="https://maps.app.goo.gl/yTHAxD6AntoTAtgPA" target="_blank" rel="noopener noreferrer">View on Google Maps</a></p>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <p><strong>Phone:</strong></p>
                <p>084 229 8842<br />084 451 0707</p>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <p><strong>Email:</strong></p>
                <p>info@deltahotel.co.za</p>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <p><strong>Business Hours:</strong></p>
                <p>Monday - Sunday: 24/7<br />Reception: 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {openModal === 'privacy' && (
        <div className={styles.modalBackdrop} onClick={() => setOpenModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseButton} onClick={() => setOpenModal(null)}>✕</button>
            <h2 className={styles.modalTitle}>Privacy & Cookies</h2>
            <div className={styles.modalBody}>
              <p>We are committed to protecting your privacy in accordance with the Protection of Personal Information Act (POPIA) of South Africa.</p>
              <p><strong>How We Use Your Information:</strong></p>
              <p>We collect and use your personal information to provide our services, process bookings, communicate with you, and improve your experience. We do not sell your personal information to third parties.</p>
              <p><strong>Cookies:</strong></p>
              <p>We use cookies and similar technologies to enhance your browsing experience, analyze site usage, and assist in our marketing efforts. You can control cookie preferences through your browser settings.</p>
              <p><strong>Your Rights:</strong></p>
              <p>Under POPIA, you have the right to access, correct, or delete your personal information. You can also object to processing or withdraw consent at any time.</p>
              <p>For more detailed information, please refer to our full Privacy Policy available in the POPIA consent overlay.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingSections;
