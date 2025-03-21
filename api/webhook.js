import express from "express";
import Stripe from "stripe";
import axios from "axios";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-02-24" });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const sheetBestUrl = "https://api.sheetbest.com/sheets/5d9e52cb-96ef-40e0-9aaa-017c261350b6";
const app = express();

// Webhook handler using express.raw() for Stripe
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("✅ Webhook Received:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("✅ Payment successful:", session.customer_details.email);
    console.log("🔗 Referral ID:", session.client_reference_id || "none");
    
    const referralCode = 'ref-' + Math.random().toString(36).substring(2, 8);

    try {
      await axios.post(sheetBestUrl, {
        "Email": session.customer_details.email,
        "Referral Code": referralCode,
        "Referred By": session.client_reference_id || "none",
        "Date": new Date().toISOString()
      });
      console.log("✅ Referral saved successfully");
    } catch (error) {
      console.error("❌ Failed to save referral:", error.message);
    }
  }

  res.json({ received: true });
});

// Other routes can safely use express.json()
app.use(express.json());

app.listen(3000, () => console.log("🚀 Server running on port 3000"));
