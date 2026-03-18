setDefaultResultOrder("ipv4first");
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Message from "./models/Message.js";
import { setDefaultResultOrder } from "dns";

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

// ── MongoDB Connection ───────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ── Nodemailer Transporter ───────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use Gmail App Password
  },
});

// ── Routes ───────────────────────────────────────────────

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Fahad Portfolio API is running" });
});

// POST /api/contact — save message + send email
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  // Validation
  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ success: false, error: "All fields are required." });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res
      .status(400)
      .json({ success: false, error: "Please enter a valid email." });
  }
  if (message.length > 2000) {
    return res
      .status(400)
      .json({ success: false, error: "Message too long (max 2000 chars)." });
  }

  try {
    // 1. Save to MongoDB
    const newMessage = await Message.create({ name, email, message });

    // 2. Send notification email to Fahad
    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `📩 New message from ${name} — Portfolio`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0A0A0F; padding: 24px; border-radius: 8px 8px 0 0;">
            <h2 style="color: #C9A84C; margin: 0; font-size: 20px;">New Portfolio Message</h2>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #eee;">
            <table style="width:100%; border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0; color:#555; font-weight:bold; width:100px;">From</td>
                <td style="padding:8px 0; color:#111;">${name}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#555; font-weight:bold;">Email</td>
                <td style="padding:8px 0;"><a href="mailto:${email}" style="color:#C9A84C;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#555; font-weight:bold; vertical-align:top;">Message</td>
                <td style="padding:8px 0; color:#111; line-height:1.6;">${message.replace(/\n/g, "<br>")}</td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
            <p style="color:#888; font-size:13px; margin:0;">
              Received: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST<br>
              Stored in MongoDB ID: ${newMessage._id}
            </p>
          </div>
        </div>
      `,
    });

    // 3. Send auto-reply to the sender
    await transporter.sendMail({
      from: `"Md Fahad" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Thanks for reaching out, ${name.split(" ")[0]}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0A0A0F; padding: 24px; border-radius: 8px 8px 0 0;">
            <h2 style="color: #C9A84C; margin: 0;">Thanks for getting in touch!</h2>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #eee;">
            <p style="color:#333; line-height:1.7;">Hi ${name.split(" ")[0]},</p>
            <p style="color:#333; line-height:1.7;">
              Thank you for reaching out through my portfolio. I've received your message and will get back to you within <strong>24 hours</strong>.
            </p>
            <p style="color:#333; line-height:1.7;">
              Looking forward to connecting!
            </p>
            <p style="color:#333; line-height:1.7; margin-bottom:4px;">Best regards,</p>
            <p style="color:#C9A84C; font-weight:bold; margin:0;">Md Fahad</p>
            <p style="color:#888; font-size:13px; margin:4px 0 0;">MERN Stack Developer · GITA Autonomous College</p>
            <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
            <p style="color:#aaa; font-size:12px;">
              GitHub: <a href="https://github.com/FAHAD786-stack" style="color:#C9A84C;">github.com/FAHAD786-stack</a><br>
              LinkedIn: <a href="https://www.linkedin.com/in/md-fahad-18981a2b1" style="color:#C9A84C;">linkedin.com/in/md-fahad-18981a2b1</a>
            </p>
          </div>
        </div>
      `,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully! Check your inbox.",
      id: newMessage._id,
    });
  } catch (error) {
    console.error("Contact error:", error);
    res.status(500).json({
      success: false,
      error: "Something went wrong. Please email mf3534537@gmail.com directly.",
    });
  }
});

// GET /api/messages — view all messages (optional admin route)
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch messages." });
  }
});

// ── Start Server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
