type Recipient = { email: string; name?: string };

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const apiKey = () => process.env.BREVO_API_KEY;
const sender = () => ({
  email: process.env.BREVO_SENDER_EMAIL || '',
  name: process.env.BREVO_SENDER_NAME || 'Fumods Hotel',
});

const escapeHtml = (value: string | number) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

class EmailService {
  private isConfigured() {
    return Boolean(apiKey() && sender().email);
  }

  private async send(to: Recipient, subject: string, htmlContent: string, tag: string) {
    if (!this.isConfigured()) {
      console.warn('Brevo email is not configured; skipping email delivery.');
      return false;
    }

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey()!,
      },
      body: JSON.stringify({ sender: sender(), to: [to], subject, htmlContent, tags: [tag] }),
    });

    if (!response.ok) {
      throw new Error(`Brevo email failed: ${await response.text()}`);
    }

    return true;
  }

  sendWelcomeEmail(user: Recipient & { firstName: string }) {
    const firstName = escapeHtml(user.firstName);
    return this.send(user, 'Welcome to Fumods Hotel',
      `<p>Hi ${firstName},</p><p>Welcome to Fumods Hotel. Your account has been created successfully.</p>`,
      'welcome');
  }

  sendBookingConfirmationEmail(input: Recipient & {
    firstName: string; bookingId: string; roomName: string; checkIn: string; checkOut: string; totalPrice: number;
  }) {
    const firstName = escapeHtml(input.firstName);
    const roomName = escapeHtml(input.roomName);
    const bookingId = escapeHtml(input.bookingId);
    const checkIn = escapeHtml(input.checkIn);
    const checkOut = escapeHtml(input.checkOut);
    const totalPrice = escapeHtml(input.totalPrice.toFixed(2));
    return this.send(input, 'Your Fumods Hotel booking is confirmed',
      `<p>Hi ${firstName},</p><p>Your booking has been confirmed.</p><ul><li>Booking reference: ${bookingId}</li><li>Room: ${roomName}</li><li>Check-in: ${checkIn}</li><li>Check-out: ${checkOut}</li><li>Total: R${totalPrice}</li></ul>`,
      'booking-confirmation');
  }
}

export const emailService = new EmailService();
