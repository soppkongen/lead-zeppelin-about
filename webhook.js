// Replace express.json() with express.raw():
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("✅ Webhook Received:", event.type);

  if (event.type === "checkout.session.completed") {
    console.log("✅ Payment Successful:", event.data.object);
  }

  res.json({ received: true });
});
