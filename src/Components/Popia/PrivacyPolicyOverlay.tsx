import React from 'react';
import styles from './PrivacyPolicyOverlay.module.css';

interface PrivacyPolicyOverlayProps {
  onClose: () => void;
}

const PrivacyPolicyOverlay: React.FC<PrivacyPolicyOverlayProps> = ({ onClose }) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          ✕
        </button>
        
        <div className={styles.header}>
          <h2 className={styles.title}>Privacy Policy</h2>
          <p className={styles.subtitle}>Fumods Guesthouse - Protection of Personal Information</p>
        </div>

        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>1. Introduction</h3>
            <p className={styles.text}>
              Fumods Guesthouse ("we," "our," or "us") is committed to protecting your personal information in accordance with the Protection of Personal Information Act (POPIA) of South Africa. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>2. Information We Collect</h3>
            <p className={styles.text}>
              We collect information that you provide directly to us, including:
            </p>
            <ul className={styles.list}>
              <li>Personal identification information (name, email address, phone number, ID number)</li>
              <li>Booking and reservation details</li>
              <li>Payment information (processed securely through third-party payment processors)</li>
              <li>Account credentials and preferences</li>
              <li>Communication records and correspondence</li>
            </ul>
            <p className={styles.text}>
              We also automatically collect certain information when you visit our website, such as IP address, browser type, device information, and usage patterns through cookies and similar technologies.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>3. How We Use Your Information</h3>
            <p className={styles.text}>
              We use your personal information for the following purposes:
            </p>
            <ul className={styles.list}>
              <li>To process and manage your bookings and reservations</li>
              <li>To communicate with you about your bookings and provide customer support</li>
              <li>To send you marketing communications (with your consent)</li>
              <li>To improve our services and website functionality</li>
              <li>To comply with legal obligations and protect our rights</li>
              <li>To prevent fraud and ensure security</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>4. Information Sharing and Disclosure</h3>
            <p className={styles.text}>
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className={styles.list}>
              <li>Service providers who assist us in operating our website and conducting our business</li>
              <li>Payment processors to handle transactions</li>
              <li>Legal authorities when required by law or to protect our rights</li>
              <li>Business partners with your explicit consent</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>5. Data Security</h3>
            <p className={styles.text}>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>6. Your Rights Under POPIA</h3>
            <p className={styles.text}>
              You have the right to:
            </p>
            <ul className={styles.list}>
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to processing of your personal information</li>
              <li>Withdraw consent at any time</li>
              <li>Lodge a complaint with the Information Regulator</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>7. Cookies and Tracking Technologies</h3>
            <p className={styles.text}>
              We use cookies and similar technologies to enhance your experience, analyze site usage, and assist in our marketing efforts. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>8. Data Retention</h3>
            <p className={styles.text}>
              We retain your personal information only for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>9. Children's Privacy</h3>
            <p className={styles.text}>
              Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>10. Changes to This Policy</h3>
            <p className={styles.text}>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>11. Contact Us</h3>
            <p className={styles.text}>
              If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us at:
            </p>
            <p className={styles.contact}>
              <strong>Fumods Guesthouse</strong><br />
              Email: privacy@deltahotel.co.za<br />
              Phone: +27 (0) 12 345 6789<br />
              Address: Fumods Guesthouse — see our Google Maps location.
            </p>
          </section>

          <p className={styles.lastUpdated}>
            Last Updated: {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyOverlay;

