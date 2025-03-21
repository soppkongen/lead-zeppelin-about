// api/webhook.js
import stripe from 'stripe';

// Disable body parsing for Stripe webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to get raw body
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    console.error('Error reading raw body:', err.message);
    return res.status(400).json({ error: 'Failed to read request body' });
  }

  const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
  let event;
  try {
    event = stripeClient.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email || 'unknown';
    const paymentDate = new Date(session.created * 1000).toISOString();
    const referralCode = Math.random().toString(36).substring(2, 10);
    const referralLink = `https://lead-zeppelin.club?ref=${referralCode}`;

    // Log the user data instead of saving to KV
    console.log('User Data:', {
      email,
      paymentDate,
      referralLink,
      referrals: []
    });
  }

  res.status(200).json({ received: true });
}
