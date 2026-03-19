# Md Fahad — Portfolio with Backend

A professional portfolio with a **real Node.js + MongoDB backend** that:
- Stores contact form messages in MongoDB Atlas
- Sends email notification to Fahad when someone submits the form
- Sends an auto-reply to the person who contacted

## Project Structure

```
fahad-portfolio/
├── public/
│   └── index.html          ← Your portfolio frontend
└── server/
    ├── index.js             ← Express server (main file)
    ├── models/
    │   └── Message.js       ← MongoDB message schema
    ├── package.json
    └── .env.example         ← Copy this to .env and fill in your values
```

---

## Setup Instructions

### Step 1 — Install dependencies
```bash
cd server
npm install
```

### Step 2 — Create your .env file
```bash
cp .env.example .env
```
Now open `.env` and fill in:

**MongoDB Atlas URI:**
1. Go to https://cloud.mongodb.com
2. Create a free cluster (M0 is free)
3. Click Connect → Drivers → copy the URI
4. Replace `<username>` and `<password>` with your credentials

**Gmail App Password:**
1. Go to your Google Account → Security
2. Enable 2-Step Verification (required)
3. Go to App Passwords → Select app: Mail → Generate
4. Copy the 16-character password into `EMAIL_PASS`
5. Do NOT use your real Gmail password — it won't work

### Step 3 — Run the backend server
```bash
cd server
npm run dev
```
Server starts at: http://localhost:5000

### Step 4 — Open your portfolio
Open `public/index.html` in your browser directly, OR serve it:
```bash
# Simple static server (install once)
npm install -g serve
serve public
```

---

## Deploy for Free

### Backend → Render.com
1. Push this project to GitHub
2. Go to https://render.com → New Web Service
3. Connect your GitHub repo
4. Set Root Directory: `server`
5. Build Command: `npm install`
6. Start Command: `node index.js`
7. Add all your `.env` variables in Render's Environment tab
8. Deploy → copy your Render URL (e.g. `https://fahad-portfolio.onrender.com`)

### Frontend → Vercel.com
1. Update `API_URL` in `public/index.html` to your Render URL
2. Go to https://vercel.com → New Project
3. Import your GitHub repo
4. Set Output Directory: `public`
5. Deploy → share your live portfolio link!

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/contact` | Submit contact form (saves to MongoDB + sends email) |
| GET | `/api/messages` | View all messages received |

### POST /api/contact — Request body
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "message": "I have an internship opportunity for you!"
}
```

### Success Response
```json
{
  "success": true,
  "message": "Message sent successfully! Check your inbox.",
  "id": "507f1f77bcf86cd799439011"
}
```

---

Built with: React (portfolio UI) · Node.js · Express.js · MongoDB · Mongoose · Nodemailer
Deployed link -:https://fahad-portfolio-teal.vercel.app
