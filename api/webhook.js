import Stripe from 'stripe';
import { kv } from '@vercel/kv';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const sig = req.headers['stripe-signature'];
    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const email = session.customer_details?.email || 'unknown';
            const paymentDate = new Date(session.created * 1000).toISOString();
            const referralCode = Math.random().toString(36).substring(2, 10);
            const referralLink = `https://lead-zeppelin.club?ref=${referralCode}`;

            // Check if user was referred
            const referrerCode = session.client_reference_id || null;

            const userData = { email, paymentDate, referralLink, referrerCode, referrals: [] };
            await kv.set(`user:${email}`, JSON.stringify(userData));

            if (referrerCode) {
                const referrerData = await kv.get(`user:referrer:${referrerCode}`);
                if (referrerData) {
                    const referrer = JSON.parse(referrerData);
                    referrer.referrals.push({ email, earned: 20 });
                    await kv.set(`user:referrer:${referrerCode}`, JSON.stringify(referrer));
                }
            }

            console.log(`✅ New user registered: ${email}, Referral Link: ${referralLink}`);
        }
        res.status(200).end();
    } catch (err) {
        console.error(err);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
}

export const config = { api: { bodyParser: false } };
