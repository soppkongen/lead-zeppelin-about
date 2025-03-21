// api/webhook.js
import stripe from 'stripe';
import { kv } from '@vercel/kv';

// Initialize Stripe with your secret key (set in Vercel environment variables)
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Only allow POST requests (Stripe webhooks are POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the Stripe signature from the headers
  const sig = req.headers['stripe-signature'];

  // Buffer the request body (Vercel might not provide it as a raw buffer)
  let event;
  try {
    // Construct the event using the raw body and webhook secret
    event = stripeClient.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Extract user email and payment date
    const email = session.customer_details?.email || 'unknown';
    const paymentDate = new Date(session.created * 1000).toISOString();

    // Generate a unique referral code and link
    const referralCode = Math.random().toString(36).substring(2, 10);
    const referralLink = `https://lead-zeppelin.club?ref=${referralCode}`;

    // Store the user data in Vercel KV
    try {
      await kv.set(`user:${email}`, JSON.stringify({
        email,
        paymentDate,
        referralLink,
        referrals: []
      }));
    } catch (err) {
      console.error('Error saving to Vercel KV:', err.message);
      return res.status(500).json({ error: 'Failed to save user data' });
    }

    // Check if this payment came from a referral
    const referralCodeFromSession = session.client_reference_id;
    if (referralCodeFromSession) {
      try {
        const referrerData = await kv.get(`user:referrer:${referralCodeFromSession}`);
        if (referrerData) {
          const referrer = JSON.parse(referrerData);
          const updatedReferrals = [...referrer.referrals, { email, commission: 20 }];
          await kv.set(`user:referrer:${referralCodeFromSession}`, JSON.stringify({
            ...referrer,
            referrals: updatedReferrals
          }));
          console.log(`Referral attributed to ${referrer.email}: $20 commission`);
        }
      } catch (err) {
        console.error('Error handling referral:', err.message);
      }
    }
  }

  // Respond to Stripe to acknowledge receipt of the webhook
  res.status(200).json({ received: true });
}
