import React from 'react';
import styles from './ReadMoreOverlay.module.css';

interface ReadMoreOverlayProps {
  onClose: () => void;
}

const ReadMoreOverlay: React.FC<ReadMoreOverlayProps> = ({ onClose }) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          ✕
        </button>
        
        <div className={styles.header}>
          <h2 className={styles.title}>Understanding Your Privacy Rights</h2>
          <p className={styles.subtitle}>POPIA Compliance Information</p>
        </div>

        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>What is POPIA?</h3>
            <p className={styles.text}>
              The Protection of Personal Information Act (POPIA) is South Africa's data protection law that came into effect on July 1, 2021. It regulates how organizations collect, use, store, and share personal information, giving you greater control over your data.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>What Information Do We Collect?</h3>
            <p className={styles.text}>
              When you use Fumods Guesthouse's services, we may collect:
            </p>
            <ul className={styles.list}>
              <li><strong>Identity Information:</strong> Name, ID number, date of birth</li>
              <li><strong>Contact Information:</strong> Email address, phone number, physical address</li>
              <li><strong>Booking Information:</strong> Check-in/check-out dates, room preferences, special requests</li>
              <li><strong>Payment Information:</strong> Credit card details (processed securely through third-party providers)</li>
              <li><strong>Technical Information:</strong> IP address, browser type, device information, cookies</li>
              <li><strong>Usage Data:</strong> How you interact with our website and services</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>How Do We Use Your Information?</h3>
            <p className={styles.text}>
              We use your personal information to:
            </p>
            <ul className={styles.list}>
              <li>Process and confirm your hotel reservations</li>
              <li>Communicate with you about your bookings and provide customer support</li>
              <li>Send you important updates about your stay</li>
              <li>Improve our services and website functionality</li>
              <li>Send marketing communications (only with your consent)</li>
              <li>Comply with legal obligations and prevent fraud</li>
              <li>Analyze website usage to enhance user experience</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>How Do We Protect Your Information?</h3>
            <p className={styles.text}>
              We implement robust security measures to protect your personal information:
            </p>
            <ul className={styles.list}>
              <li>Encryption of data in transit and at rest</li>
              <li>Secure payment processing through certified payment gateways</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and staff training on data protection</li>
              <li>Compliance with industry security standards</li>
            </ul>
            <p className={styles.text}>
              However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Who Do We Share Your Information With?</h3>
            <p className={styles.text}>
              We may share your information with:
            </p>
            <ul className={styles.list}>
              <li><strong>Service Providers:</strong> Companies that help us operate our business (e.g., payment processors, email services)</li>
              <li><strong>Business Partners:</strong> Only with your explicit consent</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
              <li><strong>Emergency Services:</strong> In case of emergencies during your stay</li>
            </ul>
            <p className={styles.text}>
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Your Rights Under POPIA</h3>
            <p className={styles.text}>
              You have the following rights regarding your personal information:
            </p>
            <ul className={styles.list}>
              <li><strong>Right to Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Right to Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
              <li><strong>Right to Object:</strong> Object to processing of your personal information</li>
              <li><strong>Right to Restrict Processing:</strong> Request limitation of how we use your information</li>
              <li><strong>Right to Data Portability:</strong> Request transfer of your data to another service provider</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent</li>
              <li><strong>Right to Lodge a Complaint:</strong> File a complaint with the Information Regulator of South Africa</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Cookies and Tracking</h3>
            <p className={styles.text}>
              We use cookies and similar technologies to:
            </p>
            <ul className={styles.list}>
              <li>Remember your preferences and settings</li>
              <li>Analyze how you use our website</li>
              <li>Provide personalized content and advertisements</li>
              <li>Improve website performance and security</li>
            </ul>
            <p className={styles.text}>
              You can control cookies through your browser settings, but this may affect website functionality.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Data Retention</h3>
            <p className={styles.text}>
              We retain your personal information only for as long as necessary to:
            </p>
            <ul className={styles.list}>
              <li>Fulfill the purposes for which it was collected</li>
              <li>Comply with legal, accounting, or reporting requirements</li>
              <li>Resolve disputes and enforce our agreements</li>
            </ul>
            <p className={styles.text}>
              When information is no longer needed, we securely delete or anonymize it.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>International Transfers</h3>
            <p className={styles.text}>
              Your information may be transferred to and processed in countries outside South Africa. We ensure appropriate safeguards are in place to protect your information in accordance with POPIA requirements.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Contact Us</h3>
            <p className={styles.text}>
              If you have questions about how we handle your personal information or wish to exercise your rights, please contact our Data Protection Officer:
            </p>
            <p className={styles.contact}>
              <strong>Fumods Guesthouse - Data Protection Officer</strong><br />
              Email: privacy@deltahotel.co.za<br />
              Phone: +27 (0) 12 345 6789<br />
              Address: Fumods Guesthouse<br />
              <br />
              <strong>Information Regulator of South Africa</strong><br />
              Website: www.justice.gov.za/inforeg<br />
              Email: inforeg@justice.gov.za
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReadMoreOverlay;

