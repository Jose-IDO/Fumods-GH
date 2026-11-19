import { useEffect, useState } from 'react';
import { API_URL } from '../config/api';

export function HotelFaqs() {
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`${API_URL}/settings/public`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error('Unable to load FAQs');
        const saved = Array.isArray(result.data?.faqs) ? result.data.faqs : [];
        setFaqs(saved.filter((faq: { question?: unknown; answer?: unknown }) => typeof faq.question === 'string' && typeof faq.answer === 'string' && faq.question.trim() && faq.answer.trim()));
        setError(false);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    window.addEventListener('focus', load);
    return () => { controller.abort(); window.removeEventListener('focus', load); };
  }, []);
  return <section aria-label="Frequently Asked Questions" aria-busy={loading} style={{ marginTop: '3rem' }}>
    <h2>Frequently Asked Questions</h2>
    {error && <p>FAQs are temporarily unavailable. Please refresh to try again.</p>}
    {loading && <p>Loading FAQs...</p>}
    {!loading && !error && !faqs.length && <p>No FAQs have been published yet.</p>}
    {faqs.map((faq, index) => <details key={`${index}-${faq.question}`} style={{ background: 'white', borderRadius: 10, padding: '1rem', marginTop: '0.75rem' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{faq.question}</summary>
      <p style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap' }}>{faq.answer}</p>
    </details>)}
  </section>;
}
