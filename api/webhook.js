export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const event = req.body;
        console.log('Received webhook event:', event);

        // ✅ If a payment is completed, log it
        if (event.object?.payment_status === 'paid') {
            console.log(`💰 Payment received: ${event.object.amount_total / 100} ${event.object.currency.toUpperCase()}`);
        }

        res.status(200).json({ received: true });
    } catch (err) {
        console.error('❌ Webhook Error:', err);
        res.status(400).json({ error: 'Webhook handler failed' });
    }
}
