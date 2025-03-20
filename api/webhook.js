export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const event = req.body;
        console.log('✅ Webhook Event Received:', event);

        if (event.object === 'checkout.session' && event.object.payment_status === 'paid') {
            console.log(`💰 Payment received: ${event.object.amount_total / 100} ${event.object.currency.toUpperCase()}`);
            // Process the payment logic here (e.g., store data, trigger referral payout, etc.)
        }

        if (event.object === 'charge' && event.object.status === 'succeeded') {
            console.log(`💸 Charge Succeeded: ${event.object.amount / 100} ${event.object.currency.toUpperCase()}`);
            // Handle charge success (e.g., confirm funds, update user status)
        }

        res.status(200).json({ received: true });
    } catch (err) {
        console.error('❌ Webhook Error:', err);
        res.status(400).json({ error: 'Webhook handler failed' });
    }
}
