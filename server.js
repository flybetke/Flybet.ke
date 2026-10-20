const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// === PAYBILL 323458 DETAILS ===
const CONSUMER_KEY = 'PASTE_YOUR_CONSUMER_KEY_HERE';      // From Daraja App - Flybet till
const CONSUMER_SECRET = 'PASTE_YOUR_CONSUMER_SECRET_HERE'; // From Daraja
const PASSKEY = 'PASTE_YOUR_PASSKEY_HERE';                // From Daraja
const BUSINESS_SHORTCODE = '323458';       // Your Paybill - VISIBLE TO SAFARICOM ONLY
const ACCOUNT_NUMBER = '333974921';        // Your Account - HIDDEN FROM PLAYERS
// Player will NOT see these numbers - only sees Deposit button
// =================================

async function getToken() {
  const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  // When Production approved, change to: https://api.safaricom.co.ke/...
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const res = await axios.get(url, { headers: { Authorization: `Basic ${auth}` } });
  return res.data.access_token;
}

app.post('/api/deposit', async (req, res) => {
  let { phone, amount } = req.body;
  // Format: 07xx -> 2547xx
  let formattedPhone = phone.toString().replace(/^0/, '254').replace(/[^0-9]/g, '');
  if(formattedPhone.length === 9) formattedPhone = '254' + formattedPhone;
  
  try {
    const token = await getToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0,14);
    const password = Buffer.from(`${BUSINESS_SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

    console.log(`STK Push: ${formattedPhone} - ${amount} to Paybill ${BUSINESS_SHORTCODE}`);

    const stkRes = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      BusinessShortCode: BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline', // For Paybill
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: BUSINESS_SHORTCODE,              // 323458
      PhoneNumber: formattedPhone,
      CallBackURL: 'https://aviator-kenya-co-ke-1.onrender.com/api/callback',
      AccountReference: ACCOUNT_NUMBER,        // 333974921 - Hidden
      TransactionDesc: 'Flybet Deposit'
    }, { headers: { Authorization: `Bearer ${token}` } });

    res.json({ success: true, message: 'Check your phone for M-Pesa prompt', data: stkRes.data });
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ success: false, error: e.response?.data || e.message });
  }
});

app.post('/api/callback', (req, res) => {
  console.log('M-Pesa Callback:', JSON.stringify(req.body, null, 2));
  // Here you credit user balance
  // For Paybill 323458 + Account 333974921
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

app.get('/', (req, res) => res.send('Flybet M-Pesa Paybill 323458 Running'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on ${PORT} - Paybill ${BUSINESS_SHORTCODE}`));