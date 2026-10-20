
require("dotenv").config();

const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(__dirname, "public")));

const {
  MPESA_ENV = "sandbox",
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_TILL_NUMBER = "1833074",
  MPESA_PASSKEY,
  MPESA_CALLBACK_URL,
  PORT = 3000
} = process.env;

const baseURL = MPESA_ENV === "production"
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

function validateConfig() {
  const required = [
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET,
    MPESA_SHORTCODE,
    MPESA_TILL_NUMBER,
    MPESA_PASSKEY,
    MPESA_CALLBACK_URL
  ];

  if (required.some(value => !value)) {
    throw new Error("Missing Daraja configuration in .env");
  }

  if (!MPESA_CALLBACK_URL.startsWith("https://")) {
    throw new Error("A public HTTPS callback URL is required.");
  }
}

async function getAccessToken() {
  validateConfig();

  const credentials = Buffer.from(
    `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const response = await axios.get(
    `${baseURL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${credentials}`
      }
    }
  );

  return response.data.access_token;
}

function timestamp() {
  const d = new Date();
  return d.getFullYear().toString()
    + String(d.getMonth() + 1).padStart(2, "0")
    + String(d.getDate()).padStart(2, "0")
    + String(d.getHours()).padStart(2, "0")
    + String(d.getMinutes()).padStart(2, "0")
    + String(d.getSeconds()).padStart(2, "0");
}

app.get("/api/health", (req, res) => {
  res.json({
    service: "FlyBet Kenya",
    paymentIntegration: "Configuration required"
  });
});

app.post("/api/deposit", async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const phone = String(req.body.phone || "").replace(/\s/g, "");

    if (!Number.isSafeInteger(amount) || amount < 100) {
      return res.status(400).json({
        error: "Minimum deposit is KSh 100."
      });
    }

    const normalizedPhone = phone.startsWith("+")
      ? phone.slice(1)
      : phone.startsWith("0")
        ? "254" + phone.slice(1)
        : phone;

    if (!/^2547\d{8}$/.test(normalizedPhone)) {
      return res.status(400).json({
        error: "Enter a valid Kenyan M-PESA phone number."
      });
    }

    const accessToken = await getAccessToken();
    const time = timestamp();

    const password = Buffer.from(
      MPESA_SHORTCODE + MPESA_PASSKEY + time
    ).toString("base64");

    const response = await axios.post(
      `${baseURL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: time,
        TransactionType: "CustomerBuyGoodsOnline",
        Amount: amount,
        PartyA: normalizedPhone,
        PartyB: MPESA_TILL_NUMBER,
        PhoneNumber: normalizedPhone,
        CallBackURL: MPESA_CALLBACK_URL,
        AccountReference: "FlyBet",
        TransactionDesc: "FlyBet deposit"
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    // A request being accepted is NOT proof of payment.
    // Save and reconcile the CheckoutRequestID in a database
    // before enabling balance credits.
    res.json({
      message: "Payment request submitted; await confirmation.",
      checkoutRequestID: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode
    });
  } catch (error) {
    console.error(
      "Daraja request error:",
      error.response?.data || error.message
    );

    res.status(502).json({
      error: "M-PESA request failed. Check Daraja configuration."
    });
  }
});

// This callback deliberately does not credit player balances.
// Implement verified callback processing, transaction matching,
// duplicate-event protection and persistent storage before launch.
app.post("/api/mpesa/callback", (req, res) => {
  console.log("Payment callback received for reconciliation.");

  res.json({
    ResultCode: 0,
    ResultDesc: "Received"
  });
});

app.listen(PORT, () => {
  console.log(`FlyBet server listening on port ${PORT}`);
});
