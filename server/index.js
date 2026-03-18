import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Message from './models/Message.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.options('*', cors());

// ── MongoDB Connection ───────────────────────────────────
let mongoConnected = false;

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4
})
  .then(() => {
    console.log('✅ MongoDB connected');
    mongoConnected = true;
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    mongoConnected = false;
  });

// ── Nodemailer Transporter ───────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ── Routes ───────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Fahad Portfolio API is running',
    mongodb: mongoConnected ? 'connected' : 'disconnected'
  });
});

// POST /api/contact
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  // Validation
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email.' });
  }

  try {
    // 1. Save to MongoDB (if connected)
    let savedId = 'not-saved';
    if (mongoConnected) {
      const newMessage = await Message.create({ name, email, message });
      savedId = newMessage._id;
    }

    // 2. Send notification email to Fahad
    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New message from ${name} — Portfolio`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;">
          <div style="background:#0A0A0F;padding:24px;border-radius:8px 8px 0 0;">
            <h2 style="color:#C9A84C;margin:0;">New Portfolio Message</h2>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #eee;">
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Message:</strong></p>
            <p style="line-height:1.7;">${message.replace(/\n/g, '<br>')}</p>
            <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;">
            <p style="color:#888;font-size:12px;">Received: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
          </div>
        </div>
      `
    });

    // 3. Auto-reply to sender
    await transporter.sendMail({
      from: `"Md Fahad" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Thanks for reaching out, ${name.split(' ')[0]}!`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;">
          <div style="background:#0A0A0F;padding:24px;border-radius:8px 8px 0 0;">
            <h2 style="color:#C9A84C;margin:0;">Thanks for getting in touch!</h2>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #eee;">
            <p>Hi ${name.split(' ')[0]},</p>
            <p>Thank you for reaching out! I've received your message and will reply within <strong>24 hours</strong>.</p>
            <p style="margin-bottom:4px;">Best regards,</p>
            <p style="color:#C9A84C;font-weight:bold;margin:0;">Md Fahad</p>
            <p style="color:#888;font-size:13px;">MERN Stack Developer · GITA Autonomous College</p>
          </div>
        </div>
      `
    });

    res.status(201).json({ success: true, message: 'Message sent!', id: savedId });

  } catch (error) {
    console.error('Contact error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to send. Please try again.' });
  }
});

// GET /api/messages
app.get('/api/messages', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.json({ success: false, error: 'MongoDB not connected', messages: [] });
    }
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch messages.' });
  }
});

// ── Start Server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
