# **Stripe Testing & Webhook Setup Guide**

This guide explains how to test Stripe payments locally using **ngrok** and Stripe CLI, and how to configure your webhook secret.

## **1. Start a Local Tunnel with ngrok**

Run the following command to expose your local server to the internet:

```bash
ngrok http 5050 --url https://saved-toad-lenient.ngrok-free.app
```

- **5050** → your local server port.
- **URL** → the public HTTPS URL ngrok provides (`https://saved-toad-lenient.ngrok-free.app`).

> This allows Stripe to send webhook events to your local server.

## **2. Listen to Stripe Webhooks Locally**

Forward Stripe webhook events to your local endpoint:

```bash
stripe listen --forward-to https://saved-toad-lenient.ngrok-free.app/api/subscription/webhook/stripe
```

- Stripe CLI will output a **webhook signing secret** (`whsec_...`).
- Copy this secret into your environment variables.

## **3. Configure Webhook Secret**

In your `.env` file or environment configuration:

```env
STRIPE_WEBHOOK_SECRET='whsec_d57a3fc722883eb95809cc8c28c5f6ac2aec809e504e3c99ddc736d44194b9ac'
```

> **Note:** Do not commit the secret to a public repository.

## **4. Confirm a Payment Intent**

To test a payment, confirm a payment intent using a test payment method:

```bash
stripe payment_intents confirm pi_3SIFXQQNJ9V9C9o50yWs8QKp --payment-method pm_card_visa
```

- `pi_3SIFXQQNJ9V9C9o50yWs8QKp` → replace with your **PaymentIntent ID**.
- `pm_card_visa` → Stripe test card payment method.