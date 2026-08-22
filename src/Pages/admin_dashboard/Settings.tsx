import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Settings.module.css';
import { API_URL } from '../../config/api';

const DEFAULT_FAQS = [
  { question: 'What time is check-in and check-out?', answer: 'Check-in starts at 2:00 PM and check-out is before 10:00 AM.' },
  { question: 'Is the swimming pool heated?', answer: 'The pool is heated in winter when temperatures are low.' },
  { question: 'Is parking available?', answer: 'Yes, secure on-site parking is available for guests.' },
  { question: 'Is breakfast included in the price?', answer: 'Please confirm breakfast availability when making your booking.' },
  { question: 'Do you offer airport shuttle service?', answer: 'Please contact us in advance to arrange transport.' },
  { question: 'Are pets allowed at the hotel?', answer: 'Registered service animals are welcome; please contact us about other pets.' },
  { question: 'Is WiFi available throughout the hotel?', answer: 'Yes, complimentary WiFi is available for guests.' },
  { question: 'Do you offer room service?', answer: 'Please contact reception for available guest services.' },
  { question: 'Can I cancel or modify my reservation?', answer: 'Please contact us as early as possible for assistance with changes.' },
];

export const Settings: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    hotelName: '',
    tagline: '',
    description: '',
    email: '',
    phone: '084 229 8842 / 084 451 0707',
    website: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: 'South Africa',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    currency: 'ZAR',
    termsAndConditions: '',
    faqs: [] as Array<{ question: string; answer: string }>,
  });

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/settings/public`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load settings');
      
      const s = data.data;
      setForm({
        hotelName: !s.hotelName || /delta hotel/i.test(s.hotelName) ? 'Fumods Guesthouse' : s.hotelName,
        tagline: s.tagline || '',
        description: s.description || '',
        email: s.email || '',
        phone: !s.phone || /12 345 6789/.test(s.phone) ? '084 229 8842 / 084 451 0707' : s.phone,
        website: s.website || '',
        addressLine1: !s.addressLine1 || /mark shuttleworth/i.test(s.addressLine1) ? 'Fumods Guesthouse' : s.addressLine1,
        addressLine2: /lynwood/i.test(s.addressLine2 || '') ? '' : (s.addressLine2 || ''),
        city: s.city || '',
        stateProvince: s.stateProvince || '',
        postalCode: s.postalCode || '',
        country: s.country || 'South Africa',
        checkInTime: s.checkInTime || '14:00',
        checkOutTime: s.checkOutTime || '11:00',
        currency: s.currency || 'ZAR',
        termsAndConditions: s.termsAndConditions || '',
        faqs: Array.isArray(s.faqs) ? s.faqs : DEFAULT_FAQS,
      });
    } catch (e: any) {
      setError(e.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to save settings');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerBar}>
        <h1 className={styles.title}>Hotel Settings</h1>
        <button className={styles.saveTopBtn} form="settingsForm" type="submit" disabled={saving || loading}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {loading && <div className={styles.section}><p>Loading settings...</p></div>}
      {error && <div className={styles.errorAlert}>⚠️ {error}</div>}
      {success && <div className={styles.successAlert}>Settings saved successfully!</div>}

      {!loading && (
        <form id="settingsForm" className={styles.form} onSubmit={onSubmit}>
          <section className={styles.section}>
            <h3 className={styles.subtitle}>Frequently Asked Questions</h3>
            {form.faqs.map((faq, index) => (
              <div className={styles.grid} key={index} style={{ marginBottom: 12 }}>
                <div className={styles.formGroup}>
                  <label>Question</label>
                  <input value={faq.question} onChange={(e) => setForm(f => ({ ...f, faqs: f.faqs.map((item, i) => i === index ? { ...item, question: e.target.value } : item) }))} />
                </div>
                <div className={styles.formGroup}>
                  <label>Answer</label>
                  <textarea rows={2} value={faq.answer} onChange={(e) => setForm(f => ({ ...f, faqs: f.faqs.map((item, i) => i === index ? { ...item, answer: e.target.value } : item) }))} />
                </div>
                <button className={styles.cancelBtn} type="button" onClick={() => setForm(f => ({ ...f, faqs: f.faqs.filter((_, i) => i !== index) }))}>Remove</button>
              </div>
            ))}
            <button className={styles.cancelBtn} type="button" onClick={() => setForm(f => ({ ...f, faqs: [...f.faqs, { question: '', answer: '' }] }))}>+ Add FAQ</button>
          </section>

          <section className={styles.section}>
            <h3 className={styles.subtitle}>Basic Information</h3>
            <div className={styles.grid}>
              <div className={styles.formGroup}>
                <label>Hotel Name *</label>
                <input name="hotelName" value={form.hotelName} onChange={onChange} placeholder="Fumods Guesthouse" required />
              </div>
              <div className={styles.formGroup}>
                <label>Tagline</label>
                <input name="tagline" value={form.tagline} onChange={onChange} placeholder="Your Comfort, Our Priority" />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Description</label>
                <textarea name="description" rows={3} value={form.description} onChange={onChange} placeholder="Brief description of your hotel..." />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.subtitle}>Contact Information</h3>
            <div className={styles.grid}>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={onChange} placeholder="info@fumodsguesthouse.com" />
              </div>
              <div className={styles.formGroup}>
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={onChange} placeholder="+27 12 345 6789" />
              </div>
              <div className={styles.formGroup}>
                <label>Website</label>
                <input type="url" name="website" value={form.website} onChange={onChange} placeholder="https://www.fumodsguesthouse.com" />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.subtitle}>Address</h3>
            <div className={styles.grid}>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Address Line 1</label>
                <input name="addressLine1" value={form.addressLine1} onChange={onChange} placeholder="Fumods Guesthouse" />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Address Line 2</label>
                <input name="addressLine2" value={form.addressLine2} onChange={onChange} placeholder="Location details" />
              </div>
              <div className={styles.formGroup}>
                <label>City</label>
                <input name="city" value={form.city} onChange={onChange} placeholder="Pretoria" />
              </div>
              <div className={styles.formGroup}>
                <label>State/Province</label>
                <input name="stateProvince" value={form.stateProvince} onChange={onChange} placeholder="Gauteng" />
              </div>
              <div className={styles.formGroup}>
                <label>Postal Code</label>
                <input name="postalCode" value={form.postalCode} onChange={onChange} placeholder="0087" />
              </div>
              <div className={styles.formGroup}>
                <label>Country</label>
                <input name="country" value={form.country} onChange={onChange} placeholder="South Africa" />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.subtitle}>Stay Details</h3>
            <div className={styles.grid}>
              <div className={styles.formGroup}>
                <label>Check-in Time</label>
                <input type="time" name="checkInTime" value={form.checkInTime} onChange={onChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Check-out Time</label>
                <input type="time" name="checkOutTime" value={form.checkOutTime} onChange={onChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Currency</label>
                <select name="currency" value={form.currency} onChange={onChange}>
                  <option value="ZAR">ZAR (South African Rand)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="GBP">GBP (British Pound)</option>
                </select>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.subtitle}>Terms and Conditions</h3>
            <div className={styles.grid}>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Terms and Conditions</label>
                <textarea name="termsAndConditions" rows={12} value={form.termsAndConditions} onChange={onChange} placeholder="Enter your hotel's complete terms and conditions here. This will be displayed to users when they click 'Terms & Conditions' in the footer." />
              </div>
            </div>
          </section>

          <div className={styles.formActions}>
            <button className={styles.cancelBtn} type="button" onClick={loadSettings} disabled={saving || loading}>Reset</button>
            <button className={styles.submitBtn} type="submit" disabled={saving || loading}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
