import express from "express";
import Stripe from "stripe";

const stripe = new Stripe("your_stripe_secret_key", { apiVersion: "2024-02-24" });
const app = express();

app.use(express.json());

// Webhook route
app.post("/api/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = "your_webhook_secret"; // Found in Stripe Dashboard

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("✅ Webhook Received:", event.type);

  if (event.type === "checkout.session.completed") {
    console.log("✅ Payment Successful:", event.data.object);
  }

  res.json({ received: true });
});

app.listen(3000, () => console.log("✅ Server running on port 3000"));
