
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// DATABASE
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Database connected"))
  .catch(err => console.error("Database error:", err.message));

// USER MODEL
const User = mongoose.model("User", new mongoose.Schema({
  username: { type: String, unique: true },
  phone: { type: String, unique: true },
  password: String,
  role: { type: String, default: "user" },
  wallet: { type: Number, default: 0 }
}));

// TRANSACTION MODEL
const Transaction = mongoose.model("Transaction", new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String,
  amount: Number,
  status: { type: String, default: "pending" },
  reference: String,
  createdAt: { type: Date, default: Date.now }
}));

// STAKE MODEL
const Stake = mongoose.model("Stake", new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  side: String,
  amount: Number,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now }
}));

// AUTHENTICATION
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Login required" });

    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid session" });
  }
};

// ADMIN CHECK
const admin = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admin access required" });
  next();
};

// REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { username, phone, password } = req.body;

    if (!username || !phone || !password || password.length < 8)
      return res.status(400).json({ error: "Enter valid details and an 8-character password" });

    const user = new User({
      username,
      phone,
      password: await bcrypt.hash(password, 12)
    });

    await user.save();
    res.status(201).json({ message: "Registration successful" });
  } catch {
    res.status(400).json({ error: "Username or phone already registered" });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { phone, password } = req.body;
  const user = await User.findOne({ phone });

  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: "Invalid login details" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.json({
    token,
    username: user.username,
    wallet: user.wallet,
    role: user.role
  });
});

// WALLET
app.get("/api/wallet", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("wallet");
  res.json(user);
});

// DEPOSIT REQUEST - WITH STK PUSH
app.post("/api/deposit", auth, async (req, res) => {
  const { amount, phone } = req.body;
  const numAmount = Number(amount);

  if (!Number.isFinite(numAmount) || numAmount < 100)
    return res.status(400).json({ error: "Minimum deposit is KSh 100" });

  if (!phone)
    return res.status(400).json({ error: "Phone number required" });

  let formattedPhone = phone.toString().trim();
  if (formattedPhone.startsWith("0")) formattedPhone = "254" + formattedPhone.slice(1);
  if (formattedPhone.startsWith("+")) formattedPhone = formattedPhone.slice(1);

  try {
    // 1. Get Daraja Token from Render Env Vars
    const authStr = Buffer.from(process.env.DARAJA_CONSUMER_KEY + ":" + process.env.DARAJA_CONSUMER_SECRET).toString("base64");
    const tokenRes = await axios.get("https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
      headers: { Authorization: "Basic " + authStr }
    });
    const token = tokenRes.data.access_token;

    // 2. Build STK Password
    const timestamp = new Date().toISOString().replace(/[-:T.]/g,"").slice(0,14);
    const password = Buffer.from(process.env.DARAJA_SHORTCODE + process.env.DARAJA_PASSKEY + timestamp).toString("base64");

    // 3. Send STK Push
    const stkRes = await axios.post("https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
      BusinessShortCode: process.env.DARAJA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: numAmount,
      PartyA: formattedPhone,
      PartyB: process.env.DARAJA_TILL_NUMBER,
      PhoneNumber: formattedPhone,
      CallBackURL: "https://flybet-ke.onrender.com/api/stk-callback",
      AccountReference: "FLYBET",
      TransactionDesc: "Flybet Deposit"
    }, { headers: { Authorization: "Bearer " + token } });

    // 4. Save transaction as PENDING
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: "deposit",
      amount: numAmount,
      reference: stkRes.data.CheckoutRequestID || "DEP-" + Date.now(),
      status: "pending"
    });

    res.json({
      message: "STK Push sent! Check your phone and enter M-Pesa PIN.",
      transactionId: transaction._id,
      checkoutId: stkRes.data.CheckoutRequestID
    });

  } catch (e) {
  console.log("STK FULL ERROR:", JSON.stringify(e.response?.data || e.message));
    res.status(500).json({ error: "STK failed. Check Daraja credentials on Render." });
  }
});

// STK CALLBACK - Safaricom calls this after payment
app.post("/api/stk-callback", async (req, res) => {
  try {
    console.log("STK Callback:", JSON.stringify(req.body));
    const callback = req.body.Body?.stkCallback;
    if (!callback) return res.json({ ResultCode: 0, ResultDesc: "Accepted" });

    if (callback.ResultCode === 0) {
      // Payment success - find transaction and credit wallet
      const checkoutId = callback.CheckoutRequestID;
      const transaction = await Transaction.findOne({ reference: checkoutId });
      if (transaction) {
        transaction.status = "completed";
        await transaction.save();
        const user = await User.findById(transaction.userId);
        if (user) {
          user.wallet += transaction.amount;
          await user.save();
        }
      }
    }
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (e) {
    console.log("Callback Error:", e.message);
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
});

// TWO STAKE SIDES
app.post("/api/stake", auth, async (req, res) => {
  const { side, amount } = req.body;
  const stakeAmount = Number(amount);

  if (!["left", "right"].includes(side))
    return res.status(400).json({ error: "Invalid stake side" });

  if (!Number.isFinite(stakeAmount) || stakeAmount < 50)
    return res.status(400).json({ error: "Minimum stake is KSh 50" });

  const user = await User.findById(req.user.id);

  if (user.wallet < stakeAmount)
    return res.status(400).json({ error: "Insufficient wallet balance" });

  user.wallet -= stakeAmount;
  await user.save();

  const stake = await Stake.create({
    userId: user._id,
    side,
    amount: stakeAmount
  });

  res.json({
    message: "Stake recorded",
    stakeId: stake._id,
    remainingWallet: user.wallet
  });
});

// USER HISTORY
app.get("/api/history", auth, async (req, res) => {
  const deposits = await Transaction.find({ userId: req.user.id });
  const stakes = await Stake.find({ userId: req.user.id });

  res.json({ deposits, stakes });
});

// ADMIN DASHBOARD DATA
app.get("/api/admin/dashboard", auth, admin, async (req, res) => {
  const users = await User.countDocuments();
  const deposits = await Transaction.find({ type: "deposit" });
  const stakes = await Stake.find();

  res.json({
    totalUsers: users,
    deposits,
    stakes
  });
});

// CREATE FIRST ADMIN
// Set ADMIN_SETUP_KEY in your private environment variables.
app.post("/api/admin/setup", async (req, res) => {
  if (!process.env.ADMIN_SETUP_KEY ||
      req.body.setupKey !== process.env.ADMIN_SETUP_KEY)
    return res.status(403).json({ error: "Not authorized" });

  const user = await User.findOne({ phone: req.body.phone });
  if (!user) return res.status(404).json({ error: "User not found" });

  user.role = "admin";
  await user.save();

  res.json({ message: "Admin role assigned" });
});

app.listen(PORT, () => {
  console.log(`FlyBet Kenya running on port ${PORT}`);
});
