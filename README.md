# GritinAI Connect 2.0 — Post-Conference Feedback & Certificate Portal

A production-ready, dark cyber-luxe web application designed for **GritinAI Connect 2.0** to collect post-conference feedback and immediately generate/download verified certificates for attendees and volunteers.

---

## 🌟 Key Features

### 1. Attendee Feedback & Certificate Portal (`/`)
- **Attendee Feedback Form**: 
  - Collects full name, email, career background/track.
  - Interactive 5-star ratings for Overall Experience, Speakers/Content, and Venue/Logistics.
  - Qualitative open-ended questions for key takeaways and suggestions.
  - Net Promoter Score (NPS 1-10) recommendation rating.
- **Dynamic Certificate Studio**:
  - Live real-time canvas preview of their verified Certificate of Participation.
  - High-Resolution (2400 x 1700 landscape) **PNG download**.
  - Vector-sharp **PDF download** (via client-side jsPDF).
  - Social sharing links (LinkedIn, X, WhatsApp).

### 2. Volunteer Appreciation Portal (`/volunteer`)
- **Dual Credential Issuance**:
  - Automatically unlocks and prepares **TWO separate certificates**:
    1. **Certificate of Attendance & Participation**
    2. **Certificate of Volunteer Service & Leadership** (highlighting their specific department/team!).
  - Dual preview tab switcher.
  - "Download Both Certificates (Package)" one-click downloader, plus individual PNG and PDF downloads for both certificates.

### 3. Organizer Feedback & Analytics Dashboard (`/admin`)
- **Passkey Protected**: Secure PIN gate (Default passkey: `gritinai2026`).
- **Live KPI Analytics**:
  - Total Submissions
  - Attendee Submissions vs Volunteer Debriefs
  - Average Event Rating (/5.0)
  - Net Promoter Score (NPS %)
- **Live Search & Filter**:
  - Instant filtering by role (All, Attendees, Volunteers).
  - Search by name, email, volunteer department, or certificate code.
- **Detailed Response Modal**: Inspect any attendee or volunteer's full answers.
- **One-Click CSV Export**: Download a formatted `.csv` file directly compatible with Microsoft Excel, Google Sheets, or data tools.

### 4. Public Credential Verification Portal (`/verify`)
- Verifies certificate authenticity via unique alphanumeric code (e.g. `GAC2-ATT-12345` or `GAC2-VOL-54321`).
- Displays recipient name, credential tier, department, and issue timestamp.

---

## 🚀 How to Run Locally

### Zero Dependencies Required (Native Node.js):
1. Navigate to the project folder:
   ```bash
   cd c:\Users\speed\Desktop\gritinai-feedback-certificate
   ```
2. Start the server:
   ```bash
   npm start
   ```
   *(or `node server.js`)*

3. Open your browser:
   - **Attendee Portal:** [http://localhost:3001/](http://localhost:3001/)
   - **Volunteer Portal:** [http://localhost:3001/volunteer](http://localhost:3001/volunteer)
   - **Organizer Dashboard:** [http://localhost:3001/admin](http://localhost:3001/admin) *(Passkey: `gritinai2026`)*
   - **Certificate Verification:** [http://localhost:3001/verify](http://localhost:3001/verify)

---

## 🎨 Design System & Palette

Inherited directly from the GritinAI Connect 2.0 design tokens:
- **Backgrounds:** Deep Obsidian `#0e0e0c`, Slate Surfaces `#141412`, Elevated `#1a1a18`
- **Brand Colors:** Bright Blue `#0088ff`, Bright Cyan `#437EF7`, Emerald `#10B981`, Amber Gold `#F59E0B`
- **Typography:** Google Fonts `Space Grotesk` & `Space Mono`

---

## 📂 Project Structure

```
gritinai-feedback-certificate/
├── data/
│   └── feedback.json          # Persistent JSON store for submissions
├── public/
│   ├── assets/
│   │   └── connect2.png       # Official GritinAI Connect 2.0 logo
│   ├── css/
│   │   └── style.css          # Design system & responsive styles
│   ├── js/
│   │   ├── certificate.js     # Canvas certificate rendering engine
│   │   ├── app.js             # Attendee portal logic
│   │   ├── volunteer.js       # Volunteer dual credential logic
│   │   └── admin.js           # Admin dashboard & analytics logic
│   ├── index.html             # Attendee feedback & certificate
│   ├── volunteer.html         # Volunteer portal
│   ├── admin.html             # Organizer analytics dashboard
│   └── verify.html            # Credential verification
├── server.js                  # Lightweight Node HTTP REST server & static host
├── package.json
└── README.md
```

---

## 🔒 Environment Configuration

You can customize the port and admin passkey via environment variables:
```bash
PORT=3001
ADMIN_KEY=gritinai2026
```
