# 🏢 Lineage Properties CRM

Internal All-in-One Real Estate Intelligence & CRM software designed specifically for real estate developers and agencies in **Kanpur, India**. Replaces scattered spreadsheets, manual call logs, and separate booking calendars with a unified, role-enforced workspace.

---

## 🚀 Tech Stack (Free-Tier Friendly)

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4. Fully responsive on mobile phones.
- **Backend/Database/Auth:** Supabase (PostgreSQL, Supabase Auth, Row Level Security, Edge Functions).
- **AI Intelligence:** Google Gemini API (`gemini-2.5-flash-lite` or Flash models) called **strictly from Supabase Edge Functions** with secret `GEMINI_API_KEY` (no API key in frontend code).
- **Excel Module:** SheetJS (`xlsx`) for automated column-mapped import, +91 phone deduplication, and customized exports.
- **Hosting:** Vercel or Netlify (Free Tier).

---

## 📁 Project Structure

```text
real-estate-crm/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx             # Brand header, Live/Sandbox badge, Role switcher (Admin/Agent)
│   │   ├── Sidebar.tsx            # Navigation drawer, counter badges, quick AI button
│   │   └── AiAssistantModal.tsx   # Gemini natural language database assistant
│   ├── context/
│   │   └── CrmContext.tsx         # Central state, RLS enforcement, activity logger, AI client
│   ├── lib/
│   │   ├── excel.ts               # SheetJS export (.xlsx) & import deduplication wizard
│   │   ├── mockData.ts            # Realistic Kanpur demo data (Ganga Heights, Civil Lines, etc.)
│   │   ├── supabase.ts            # Safe Supabase client initialization
│   │   ├── utils.ts               # +91 phone normalization, collision detector, currency formatter
│   │   └── webhookSignature.ts    # Meta HMAC SHA-256 signature verifier (Phase 2 ready)
│   ├── pages/
│   │   ├── DashboardPage.tsx      # Funnel chart (New → Won), Hot lead counters, upcoming visits
│   │   ├── LeadsPage.tsx          # Filterable table, quick-edit, Excel Import/Export, Add Lead
│   │   ├── LeadDetailPage.tsx     # Full profile, multi-channel chat, Gemini scoring & Hindi draft
│   │   ├── AppointmentsPage.tsx   # Calendar & list view, 40-min collision warning, reschedule
│   │   ├── PropertiesPage.tsx     # Kanpur projects catalog (AI source of truth), RERA, pricing
│   │   ├── FollowupsPage.tsx      # Overdue/today tasks, 1-click WhatsApp, snooze (1d/3d/1w)
│   │   ├── SettingsPage.tsx       # Working hours (10am-6pm IST), team RLS management, AI tone
│   │   └── PublicBookingPage.tsx  # Client-facing portal (no login), hides booked slots, DPDP consent
│   ├── tests/
│   │   ├── lead-dedupe.test.ts
│   │   ├── slot-booking-conflicts.test.ts
│   │   ├── excel-import-export.test.ts
│   │   ├── lead-scoring-parsing.test.ts
│   │   ├── webhook-signature.test.ts
│   │   └── rls-role-permissions.test.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── migrations/
│   │   ├── 20261120000001_phase1_core_crm.sql    # Full PostgreSQL schema, RLS policies & RPC
│   │   └── 20261120000002_seed_demo_data.sql     # Realistic Kanpur demo properties & leads
│   └── functions/
│       └── gemini-ai/
│           └── index.ts                          # Deno Edge Function calling Gemini API
├── .env.example
├── README.md
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🛠️ Non-Programmer Setup Guide (Step-by-Step)

### Step 1: Run Locally on Your Computer

1. Open your terminal and navigate to the project directory:
   ```bash
   cd /Users/vanshjakhodia/.gemini/antigravity/scratch/real-estate-crm
   ```
2. Start the local server:
   ```bash
   npm run dev
   ```
3. Open your browser and go to:
   ```text
   http://localhost:5173
   ```
   *The app starts 100% clean with zero dummy data. Only real leads, properties, and appointments that you add or import will exist.*

---

### Step 2: Connect Free Supabase Backend (5 Minutes)

1. Create a free account at [Supabase.com](https://supabase.com) and click **"New Project"**.
2. Give your project a name (e.g., `kanpur-prime-realty`) and set a secure database password. Select the **South Asia (Mumbai)** region for lowest latency in India.
3. Open the **SQL Editor** tab on the left sidebar:
   - Copy the contents of [`supabase/migrations/20261120000001_phase1_core_crm.sql`](file:///Users/vanshjakhodia/.gemini/antigravity/scratch/real-estate-crm/supabase/migrations/20261120000001_phase1_core_crm.sql) and paste it into the SQL Editor. Click **Run** to create your clean tables, RLS policies, and functions.
   - If you ever need to reset or wipe all records in Supabase, execute [`supabase/migrations/20261120000003_clean_slate.sql`](file:///Users/vanshjakhodia/.gemini/antigravity/scratch/real-estate-crm/supabase/migrations/20261120000003_clean_slate.sql).
4. Get your API credentials:
   - Go to **Project Settings** → **API**.
   - Copy your **Project URL** and **anon public key**.
5. Create a `.env` file in the root of your project:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
   VITE_COMPANY_NAME="Lineage Properties Pvt Ltd"
   VITE_CITY="Kanpur"
   ```

---

### Step 3: Configure Gemini AI Edge Function

1. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com).
2. In your Supabase Dashboard, go to **Edge Functions** → **Secrets**.
3. Add two secrets:
   - `GEMINI_API_KEY`: Paste your Google AI Studio API key.
   - `GEMINI_MODEL`: `gemini-2.5-flash-lite` (or `gemini-1.5-flash`).
4. Deploy the Edge Function using the Supabase CLI:
   ```bash
   npx supabase functions deploy gemini-ai --no-verify-jwt
   ```

---

### Step 4: Deploy Frontend to Vercel or Netlify (Free)

#### Deploying to Vercel:
1. Push your code to a GitHub repository or use Vercel CLI.
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Select this repository.
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**. Your app will be live on a custom `.vercel.app` URL with free HTTPS and mobile optimization.

---

## 🧪 Exact Verification & Testing Steps (Phase 1)

Follow these steps to test every single Phase 1 requirement:

### 1. Test Row Level Security (RLS) & Role Switching
- Look at the top right of the navigation bar. You will see the active user selector (default: **Vansh Jakhodia - Admin**).
- As **Admin**: Go to the **Leads** tab. You will see all 5 leads across the business.
- Click the user dropdown in the navbar and switch to **Rahul Sharma (Agent)**.
- Notice the view immediately updates under RLS: Rahul only sees the leads assigned to him (**Dr. Alok Mishra** and **Pooja Gupta**). He cannot see Vikramaditya Singhania or Ramesh Chandra Awasthi!
- Switch to **Neha Verma (Agent)**: She only sees Vikramaditya Singhania.

### 2. Test Public Booking Page (No Login Required)
- Click the **"Public Booking"** button in the top navigation bar.
- Notice the client-facing booking portal opens at `/book`.
- Select **Ganga Heights Luxury Towers**, pick tomorrow's date.
- Notice only slots between 10:00 AM and 6:00 PM IST appear, and conflicting times are automatically hidden.
- Enter a name, valid Indian phone (`9839012345`), tick the DPDP consent checkbox, and click **Confirm Appointment**.
- Switch back to the CRM dashboard: The appointment appears under **Upcoming Visits** and the lead is marked **Hot** with `site_visit_booked` status!

### 3. Test Double-Booking & Conflict Detection
- Go to the **Appointments** tab and click **"Book Visit"**.
- Try booking an appointment for the exact same property within 20 minutes of an existing booking.
- Notice the system immediately displays a prominent yellow warning: *"⚠️ Another appointment is already scheduled within 40 minutes of this time!"*

### 4. Test Excel Export & Import with Deduplication
- Go to the **Leads** tab.
- Click **"Export to Excel"**: Downloads a clean `.xlsx` file containing the exact required columns: `Date | IG Handle | Full Name | Phone | Email | Intent | Property Type | Location | Budget | Timeline | Lead Score | Status | Appointment Date | AI Summary | Assigned To`.
- Click **"Import Excel/CSV"**: Upload any spreadsheet. Map the columns. The wizard automatically normalizes phone numbers to `+91`, checks against existing database records, and shows an import summary report of added, skipped duplicates, and invalid rows!

### 5. Test Gemini AI Integration
- **Database Assistant:** Click **"Ask Gemini AI"** in the top bar. Click the suggestion chip *"Which hot leads haven't been contacted in 3 days?"* or ask in Hindi: *"Civil Lines me kya options hain?"*. Notice it responds accurately from the real properties and leads database.
- **Hindi / Hinglish Message Generator:** Open **Dr. Alok Mishra** in the Leads table. Click **"Generate Draft"** in the AI Follow-up box. Select **Hinglish** or **Hindi**. Gemini generates a polite, personalized follow-up in under 60 words ready to copy or open in WhatsApp!
- **Auto Lead Scoring:** On the lead detail page, click **"Auto-Score"**. The AI evaluates the lead profile and recent messages, updating the lead score to **Hot**, along with a clear reason and updated executive summary.

### 6. Run Automated Test Suite
- In terminal, execute:
  ```bash
  npm test
  ```
- All 20 unit and integration tests will run and pass:
  - `lead-dedupe.test.ts` (Phone normalization & duplicate detection)
  - `slot-booking-conflicts.test.ts` (Collision window & slot generator)
  - `excel-import-export.test.ts` (Column mapping & import validation)
  - `lead-scoring-parsing.test.ts` (Gemini scoring JSON rules)
  - `webhook-signature.test.ts` (Meta HMAC SHA-256 signature verification)
  - `rls-role-permissions.test.ts` (Admin vs Agent visibility)
