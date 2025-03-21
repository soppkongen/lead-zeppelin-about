import express from "express";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-02-24" });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const app = express();

// Webhook handler clearly using express.raw() for Stripe
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
    console.log("🔗 Referral Metadata:", session.metadata);

    // You can handle successful payment logic here
  }

  res.json({ received: true });
});

// Other routes can safely use express.json()
app.use(express.json());

app.listen(3000, () => console.log("🚀 Server running on port 3000"));
