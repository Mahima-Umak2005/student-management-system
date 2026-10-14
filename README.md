# Deployment of a Three-Tier Web Application Using Netlify, Render, and MongoDB Atlas

**Project: Student Information Management System** — Cloud Computing CA2

A web application where college staff can add, view, search, edit and delete student records.
Every record is stored permanently in a cloud database.

> **Status honesty note:** this repository contains the complete source code. The live links
> (Render URL, Netlify URL, Atlas cluster) only exist **after you** create those accounts and
> deploy. Section 20 is a checklist for proving, with screenshots, that each step really worked.

---

## Table of contents

1. [Problem statement](#1-problem-statement)
2. [Project objectives](#2-project-objectives)
3. [Three-tier architecture](#3-three-tier-architecture)
4. [Technology stack](#4-technology-stack)
5. [Features](#5-features)
6. [Folder structure](#6-folder-structure)
7. [Prerequisites](#7-prerequisites)
8. [Installation](#8-installation)
9. [Environment variables](#9-environment-variables)
10. [MongoDB Atlas setup](#10-mongodb-atlas-setup)
11. [Run locally on Windows](#11-run-locally-on-windows)
12. [API documentation](#12-api-documentation)
13. [Deploy the backend to Render](#13-deploy-the-backend-to-render)
14. [Deploy the frontend to Netlify](#14-deploy-the-frontend-to-netlify)
15. [Testing procedure](#15-testing-procedure)
16. [Security considerations](#16-security-considerations)
17. [Common errors and solutions](#17-common-errors-and-solutions)
18. [Screenshots checklist](#18-screenshots-checklist)
19. [Presentation and viva material](#19-presentation-and-viva-material)
20. [Final project verification checklist](#20-final-project-verification-checklist)

---

## 1. Problem statement

Colleges often keep student details in paper registers or scattered spreadsheets. These are hard to
search, easy to lose, and cannot be reached from different places. A cloud-hosted system solves this:
the data lives in one secure database, and authorised staff can use it from any browser.

## 2. Project objectives

- Build a complete **three-tier** web application (presentation, application, data).
- Create a **REST API** with full CRUD (Create, Read, Update, Delete) operations.
- Store data persistently in **MongoDB Atlas** using **Mongoose**.
- Deploy each tier on a different cloud service: **Netlify**, **Render**, **MongoDB Atlas**.
- Keep secrets safe using **environment variables**.
- Validate data in both the browser and the server.

## 3. Three-tier architecture

```text
 ┌─────────────────────────┐      ┌──────────────────────────┐      ┌──────────────────────────┐
 │  TIER 1: PRESENTATION   │      │  TIER 2: APPLICATION     │      │  TIER 3: DATA            │
 │  React + Vite           │      │  Node.js + Express       │      │  MongoDB Atlas           │
 │  Hosted on NETLIFY      │      │  Hosted on RENDER        │      │  (cloud database)        │
 │                         │      │                          │      │                          │
 │  Forms, table, search   │ ───► │  Validates the request   │ ───► │  Stores student records  │
 │  (what the user sees)   │ HTTPS│  Business logic, CORS    │Mongoose│ Unique index on         │
 │                         │ JSON │  Talks to the database   │      │  studentId               │
 │                         │ ◄─── │                          │ ◄─── │                          │
 └─────────────────────────┘      └──────────────────────────┘      └──────────────────────────┘
        Browser only talks to Netlify and Render.  The browser NEVER talks to MongoDB directly.
```

The same flow as a Mermaid diagram (GitHub renders this automatically):

```mermaid
flowchart LR
    U[Browser] -->|1. opens site| N[Netlify<br/>React frontend]
    N -->|2. fetch JSON over HTTPS| R[Render<br/>Express API]
    R -->|3. Mongoose query| M[(MongoDB Atlas)]
    M -->|4. documents| R
    R -->|5. JSON response| N
    N -->|6. updates the screen| U
```

### The request flow in simple words

**Browser → Netlify frontend → Render API → MongoDB Atlas, and back again.**

1. You open the Netlify website. Netlify sends your browser the React app (HTML, CSS, JavaScript).
2. When you click **Add student**, the React app sends a `POST` request with the student's details
   (as JSON) to the Render API address.
3. The Express API checks the data. If it is wrong it replies with an error and stops.
4. If the data is fine, Express asks MongoDB Atlas (through Mongoose) to save it.
5. Atlas confirms, Express sends a success response back, and React refreshes the table.

**Why three tiers?** Each part has one job, can be changed or scaled on its own, and the database
password stays on the server where users can never see it.

## 4. Technology stack

| Tier | Technology | Hosting |
|------|-----------|---------|
| Frontend | React 18, JavaScript, HTML, CSS, Vite | Netlify |
| Backend | Node.js, Express.js, Helmet, CORS, dotenv | Render |
| Database | MongoDB with Mongoose | MongoDB Atlas |
| Tools | Git, GitHub, VS Code | — |
| Communication | REST API, JSON, HTTP(S) | — |

## 5. Features

1. Add a new student
2. View all students in a table
3. Search by student ID, name, email or department
4. Edit a student (opens in a dialog)
5. Delete with a confirmation dialog
6. Live count of registered students
7. Success messages after every change
8. Clear validation and error messages (browser **and** server)
9. Loading indicators while fetching or saving
10. Friendly "no students yet" message
11. List and count refresh automatically after add / edit / delete
12. Responsive layout: table on desktop, labelled cards on phones
13. Duplicate student IDs are blocked (unique database index)
14. Accessible forms (labels, keyboard focus, screen-reader messages)

## 6. Folder structure

```text
student-management-system/
├── README.md
├── .gitignore
├── docs/
│   └── PRESENTATION.md            <- professor explanation, 2-minute script, viva Q&A
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   ├── src/
│   │   ├── server.js              <- starts the server, connects to MongoDB
│   │   ├── app.js                 <- Express setup: Helmet, CORS, routes, health check
│   │   ├── models/Student.js      <- Mongoose schema + unique index
│   │   ├── routes/studentRoutes.js
│   │   ├── controllers/studentController.js
│   │   ├── middleware/
│   │   │   ├── errorHandler.js    <- one place that formats every error
│   │   │   └── requireDatabase.js <- returns 503 if the DB is not connected
│   │   └── utils/                 <- validation, logger (hides passwords), AppError
│   └── test/validateStudent.test.js
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── netlify.toml               <- build settings + single-page-app redirect
    ├── index.html
    ├── .env.example
    ├── .gitignore
    ├── public/favicon.svg
    └── src/
        ├── main.jsx
        ├── App.jsx                <- state + all CRUD logic
        ├── index.css
        ├── services/api.js        <- the ONLY file that calls the backend
        ├── utils/validation.js
        └── components/            <- Layout, Dashboard, AddStudent, EditStudent,
                                      StudentForm, SearchBar, StudentTable,
                                      ConfirmDialog, Modal, Loader, Notification
```

## 7. Prerequisites

| Need | How to check (in the VS Code terminal) | If missing |
|------|----------------------------------------|-----------|
| Node.js 18 or newer (LTS recommended) | `node -v` | Install the LTS version from <https://nodejs.org> |
| npm (comes with Node) | `npm -v` | Re-install Node.js |
| Git | `git --version` | Install from <https://git-scm.com> |
| VS Code | — | <https://code.visualstudio.com> |
| GitHub account | — | <https://github.com> |
| MongoDB Atlas, Render, Netlify accounts | — | Free sign-ups (see sections 10, 13, 14) |

## 8. Installation

Open the project in VS Code: **File → Open Folder →** select `student-management-system`.
Open the terminal with **Terminal → New Terminal** (PowerShell is fine). Then:

```powershell
# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

## 9. Environment variables

Environment variables keep settings and secrets **outside** the code.
The `.env.example` files are safe templates with placeholders. You create real `.env` files
from them. Real `.env` files are listed in `.gitignore`, so Git never uploads them.

**Create the backend `.env`** (PowerShell, from the project root):

```powershell
Copy-Item backend\.env.example backend\.env
notepad backend\.env
```

```env
PORT=5000
MONGODB_URI=YOUR_MONGODB_ATLAS_CONNECTION_STRING     # replace after section 10
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Create the frontend `.env`:**

```powershell
Copy-Item frontend\.env.example frontend\.env
```

```env
VITE_API_BASE_URL=http://localhost:5000
```

| Variable | Where | Meaning |
|----------|-------|---------|
| `PORT` | backend | Port the API listens on locally. (Render sets its own automatically.) |
| `MONGODB_URI` | backend | Atlas connection string. **Secret.** |
| `FRONTEND_URL` | backend | The exact origin of the website allowed to call the API (CORS). Several origins can be separated with commas. |
| `NODE_ENV` | backend | `development` locally, `production` on Render. |
| `VITE_API_BASE_URL` | frontend | Address of the backend API. **Public** — it is baked into the built website. |

> **Important:** variables starting with `VITE_` are copied into the browser code, so anyone can read
> them. Never put passwords or keys in them. The database string lives only in the backend.

## 10. MongoDB Atlas setup

Atlas menus change from time to time; if a label differs slightly, look for the closest match.

1. **Create an account:** go to <https://www.mongodb.com/cloud/atlas/register> and sign up.
2. **Create a free cluster:** choose the **Free** (M0) option, any cloud provider, and the region
   nearest to you (for India, a Mumbai or Singapore region if offered). Click **Create**.
3. **Create a database user:** *Security → Database Access → Add New Database User*.
   Choose **Password** authentication, pick a username (for example `studentapp`), and click
   **Autogenerate Secure Password**. **Copy the password somewhere private now** (you cannot read it
   again later). Give it the role **Read and write to any database**.
   Keep the password free of special characters if you can, to avoid encoding problems.
4. **Allow network access:** *Security → Network Access → Add IP Address*.
   - For local testing, **Add Current IP Address**.
   - For Render's free plan, the outgoing IP address is not fixed, so the simplest option is
     **Allow Access from Anywhere** (`0.0.0.0/0`). This is acceptable for a college project
     **only because** the database is still protected by a long random password, and the
     connection is encrypted. For a real company system you would use a paid fixed-IP setup or
     private networking instead. Explain this trade-off to your professor.
5. **Get the connection string:** *Database → Connect → Drivers* (choose Node.js). Copy the string. It looks like:
   ```text
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Replace the placeholders correctly:**
   - Replace `<username>` with your database username.
   - Replace `<password>` with your password (without the `<` `>` brackets).
   - Add the database name `studentdb` between `.net/` and `?`:
   ```text
   mongodb+srv://studentapp:YourPassword@cluster0.abcde.mongodb.net/studentdb?retryWrites=true&w=majority
   ```
   If your password contains characters such as `@ : / ? # %`, they must be URL-encoded
   (`@` becomes `%40`, `:` becomes `%3A`, `/` becomes `%2F`). Using an autogenerated
   password without special characters avoids this.
7. **Configure the backend:** paste the full string into `backend\.env` as `MONGODB_URI=...`
   (no quotes, no spaces). Never paste it into chat, GitHub, or the frontend.
8. **Verify the connection:** start the backend (section 11). The terminal must print
   `MongoDB connection established.`, and <http://localhost:5000/api/health> must show
   `"database": "connected"`.
9. **Confirm records appear in Atlas:** after adding a student in the website, open
   *Database → Browse Collections* in Atlas. You will see database `studentdb`,
   collection `students`, and your record as a document. Take a screenshot.

## 11. Run locally on Windows

You need **two terminals** open at the same time.

**Terminal 1 — backend** (*Terminal → New Terminal*):

```powershell
cd backend
npm run dev
```

Expected output (times will differ):

```text
[...] INFO  API listening on port 5000 (development).
[...] INFO  MongoDB connection established.
```

**Terminal 2 — frontend** (click the **+** in the terminal panel to open a second one):

```powershell
cd frontend
npm run dev
```

Open <http://localhost:5173> in your browser.

Then try every feature: add a student, see it in the table, search for it, edit it, delete it.
Check Atlas after each step.

> The frontend must run on port **5173** because the backend's `FRONTEND_URL` expects exactly
> `http://localhost:5173`. Vite is configured to stop with an error instead of silently choosing
> another port.

## 12. API documentation

Base URL locally: `http://localhost:5000`. All bodies are JSON.

| Method | Endpoint | Purpose | Success |
|--------|----------|---------|---------|
| GET | `/api/health` | Server and database status | `200` (or `503` if DB down) |
| GET | `/api/students` | List all students (newest first) | `200` |
| GET | `/api/students/:id` | One student by MongoDB `_id` | `200` |
| POST | `/api/students` | Create a student | `201` |
| PUT | `/api/students/:id` | Replace a student's details | `200` |
| DELETE | `/api/students/:id` | Delete a student | `200` |

**Student fields**

| Field | Required | Rule |
|-------|----------|------|
| `studentId` | yes | 2–20 characters; letters, numbers, `-`, `_`; **unique** |
| `name` | yes | 2–100 characters |
| `email` | yes | valid email; stored in lower case |
| `department` | yes | 2–100 characters |
| `semester` | yes | whole number 1–12 |
| `contact` | no | 7–15 characters: digits, spaces, `+`, `-`, `(`, `)` |

**Example request** `POST /api/students`

```json
{
  "studentId": "CS2024001",
  "name": "Asha Patil",
  "email": "asha@college.edu",
  "department": "Computer Science",
  "semester": 4,
  "contact": "9876543210"
}
```

**Success response** `201 Created`

```json
{
  "success": true,
  "message": "Student added successfully.",
  "data": {
    "_id": "665f1c2e9b1d4a0012ab34cd",
    "studentId": "CS2024001",
    "name": "Asha Patil",
    "email": "asha@college.edu",
    "department": "Computer Science",
    "semester": 4,
    "contact": "9876543210",
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-01T10:00:00.000Z"
  }
}
```

**Error responses** always have `success: false` and a `message`; field problems also have `errors`:

| Situation | Status | Example body |
|-----------|--------|--------------|
| Validation failed | 400 | `{"success":false,"message":"Validation failed...","errors":{"email":"Please enter a valid email address..."}}` |
| Invalid MongoDB ID | 400 | `{"success":false,"message":"Invalid student ID format..."}` |
| Student not found | 404 | `{"success":false,"message":"Student not found."}` |
| Duplicate `studentId` | 409 | `{"success":false,"message":"A student with this Student ID already exists.","errors":{"studentId":"..."}}` |
| Origin blocked by CORS | 403 | `{"success":false,"message":"This origin is not allowed by CORS."}` |
| Database not connected | 503 | `{"success":false,"message":"The database is not connected right now..."}` |
| Unexpected server error | 500 | generic message only — details stay in the server log |

> Searching is done in the browser on the list that the API returned, so the search box reacts
> instantly while you type.

## 13. Deploy the backend to Render

**A. Put the project on GitHub**

1. On <https://github.com> click **New repository**. Name it `student-management-system`, keep it
   **Public** or **Private**, and do **not** add a README (we already have one).
2. In the VS Code terminal, from the project root:
   ```powershell
   git init
   git add .
   git status
   ```
   **Read the `git status` list.** It must **not** show any `.env` file (only `.env.example` is
   allowed). If a `.env` appears, stop and fix `.gitignore` first.
   ```powershell
   git commit -m "Student Information Management System"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/student-management-system.git
   git push -u origin main
   ```
   (Replace `YOUR-USERNAME`. Git may ask you to sign in to GitHub in a browser window.)

**B. Create the Render web service**

1. Sign in at <https://render.com> (you can use your GitHub account).
2. Click **New + → Web Service** and connect your GitHub repository.
3. Fill in the settings:

   | Setting | Value |
   |---------|-------|
   | Name | `student-management-api` (or any name) |
   | Root Directory | `backend` |
   | Runtime / Language | Node |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Instance type | Free |

4. Open **Environment** (environment variables) and add:

   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | your Atlas connection string from section 10 |
   | `FRONTEND_URL` | `http://localhost:5173` for now (you will change it in section 14) |
   | `NODE_ENV` | `production` |

   Do **not** set `PORT` — Render provides it automatically.
5. Click **Create Web Service** and wait for the deploy log to say the service is live.
6. Copy your real service URL from the top of the Render page. It looks like
   `https://student-management-api-xxxx.onrender.com` (yours will differ).
7. **Test it** in a browser:
   - `https://YOUR-RENDER-URL/api/health` → should show `"status":"ok"` and `"database":"connected"`.
   - `https://YOUR-RENDER-URL/api/students` → should show `{"success":true,"count":0,"data":[]}`.

   If health shows `"degraded"`, the database is not connected: see [section 17](#17-common-errors-and-solutions).

> **Free plan note:** Render's free web services go to sleep after a period of no traffic. The first
> request afterwards can take about a minute. Before your demonstration, open the health URL once
> to wake the service. The app waits up to 60 seconds for the first response.

## 14. Deploy the frontend to Netlify

1. Sign in at <https://www.netlify.com> (GitHub login is easiest).
2. **Add new site → Import an existing project → GitHub** and choose your repository.
3. Fill in the build settings:

   | Setting | Value |
   |---------|-------|
   | Base directory | `frontend` |
   | Build command | `npm run build` |
   | Publish directory | `dist` |

   (`frontend/netlify.toml` already contains these values and the redirect rule that makes the
   single-page app work when you refresh. If Netlify says it cannot find the publish directory, try `frontend/dist`.)
4. Open **Environment variables** (before deploying) and add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE_URL` | your real Render URL, e.g. `https://student-management-api-xxxx.onrender.com` |

   No slash at the end. No secrets here — this value becomes public in the built site.
5. Click **Deploy** and wait for success.
6. Copy your real Netlify address, e.g. `https://your-site-name.netlify.app`.
   (Optional: *Site configuration → Change site name* gives a nicer address.)
7. **Tell the backend about the frontend (CORS):** go back to Render → your service →
   **Environment**, change `FRONTEND_URL` to the exact Netlify origin:
   ```text
   https://your-site-name.netlify.app
   ```
   Origin means: `https://` + domain, **no path and no trailing slash**. Save. Render redeploys
   automatically; if not, click **Manual Deploy → Deploy latest commit**.
8. Open the Netlify site and test the live application (section 15).

> If you ever change `VITE_API_BASE_URL`, you must **redeploy** the Netlify site, because the value
> is written into the build. Use **Deploys → Trigger deploy → Clear cache and deploy site**.

## 15. Testing procedure

### 15.1 Manual user test (local and live)

| # | Action | Expected result |
|---|--------|-----------------|
| 1 | Open the site with an empty database | "No students registered yet", count is 0 |
| 2 | Click **Add student** with an empty form | Red messages under all five required fields |
| 3 | Enter email `abc` | "Enter a valid email" |
| 4 | Choose no semester / only 1–12 are offered | "Semester is required" |
| 5 | Fill the form correctly and add | Green "Student added successfully", new row, count +1 |
| 6 | Add the same Student ID again | "A student with this Student ID already exists." |
| 7 | Type part of a name / ID / email / department in search | Table filters; "Showing x of y" |
| 8 | Click **Edit**, change the name, **Save changes** | Success message, table shows the new name |
| 9 | Click **Delete**, then **Cancel** | Nothing is deleted |
| 10 | Click **Delete**, then **Delete student** | Success message, row gone, count −1 |
| 11 | Stop the backend, reload the page | "Could not load students" with a **Try again** button |
| 12 | Resize the browser narrow (or use a phone) | Rows become cards; no sideways scrolling |

### 15.2 API tests with curl (Windows PowerShell)

Use `curl.exe` (with the `.exe`) because plain `curl` in PowerShell is a different command.
Replace the first line with your Render URL when testing the live backend.

```powershell
$API = "http://localhost:5000"

# 1. Health
curl.exe -i "$API/api/health"

# 2. Fetch all students
curl.exe -i "$API/api/students"

# 3. Add a student (JSON saved to a temporary file first)
@'
{"studentId":"CS2024001","name":"Asha Patil","email":"asha@college.edu","department":"Computer Science","semester":4,"contact":"9876543210"}
'@ | Set-Content -Encoding ascii tmp-student.json
curl.exe -i -X POST "$API/api/students" -H "Content-Type: application/json" --data "@tmp-student.json"
# Copy the "_id" value from the response, then:
$ID = "PASTE_THE_ID_HERE"

# 4. Fetch one student
curl.exe -i "$API/api/students/$ID"

# 5. Update the student
@'
{"studentId":"CS2024001","name":"Asha R. Patil","email":"asha@college.edu","department":"Computer Science","semester":5,"contact":"9876543210"}
'@ | Set-Content -Encoding ascii tmp-update.json
curl.exe -i -X PUT "$API/api/students/$ID" -H "Content-Type: application/json" --data "@tmp-update.json"

# 6. Duplicate student ID (run step 3 again)  -> expect 409
curl.exe -i -X POST "$API/api/students" -H "Content-Type: application/json" --data "@tmp-student.json"

# 7. Missing required fields -> expect 400
'{}' | Set-Content -Encoding ascii tmp-empty.json
curl.exe -i -X POST "$API/api/students" -H "Content-Type: application/json" --data "@tmp-empty.json"

# 8. Invalid email -> expect 400
@'
{"studentId":"CS2024002","name":"Bad Email","email":"not-an-email","department":"IT","semester":2}
'@ | Set-Content -Encoding ascii tmp-bademail.json
curl.exe -i -X POST "$API/api/students" -H "Content-Type: application/json" --data "@tmp-bademail.json"

# 9. Invalid semester -> expect 400
@'
{"studentId":"CS2024003","name":"Bad Semester","email":"b@college.edu","department":"IT","semester":99}
'@ | Set-Content -Encoding ascii tmp-badsem.json
curl.exe -i -X POST "$API/api/students" -H "Content-Type: application/json" --data "@tmp-badsem.json"

# 10. Invalid MongoDB ID -> expect 400
curl.exe -i "$API/api/students/abc"

# 11. Valid-looking ID that does not exist -> expect 404
curl.exe -i "$API/api/students/000000000000000000000000"

# 12. CORS: an allowed origin gets an Access-Control-Allow-Origin header
curl.exe -i -H "Origin: http://localhost:5173" "$API/api/students"
#     a disallowed origin gets 403 and no CORS header
curl.exe -i -H "Origin: https://evil.example.com" "$API/api/students"

# 13. Delete the student -> expect 200, then 404 when repeated
curl.exe -i -X DELETE "$API/api/students/$ID"
curl.exe -i -X DELETE "$API/api/students/$ID"

# Clean up the temporary files
Remove-Item tmp-*.json
```

**Postman alternative:** create a request for each row of the API table in section 12, set the
method and URL, choose **Body → raw → JSON** for POST and PUT, and paste the example JSON.

### 15.3 Failure tests

| Test | How | Expected |
|------|-----|----------|
| **Backend unavailable** | Stop the backend (`Ctrl + C`), reload the website | Friendly "Cannot reach the server..." message with **Try again** |
| **Database connection failure** | In `backend\.env` break the password, restart the backend | Log shows `Could not connect to MongoDB` and retries; `/api/health` → `503 degraded`; `/api/students` → `503`; the website shows the database message. Fix the password and restart to recover. |
| **CORS misconfiguration** | Set `FRONTEND_URL` on Render to a wrong address | Browser console shows a CORS error; curl test 12 shows `403` |

### 15.4 Automated tests included

```powershell
cd backend
npm test
```

This runs 16 unit tests of the validation rules and the error handler (no database needed).

### 15.5 End-to-end proof with the live site

1. Add a student on the **Netlify** site → in Atlas *Browse Collections* the document appears.
2. Edit it on the site → refresh Atlas → the fields have changed.
3. Delete it on the site → refresh Atlas → the document is gone.

Screenshot each step (section 18).

## 16. Security considerations

- **Secrets stay on the server.** `MONGODB_URI` exists only in `backend/.env` (ignored by Git) and in Render's
  environment settings. The browser never receives it.
- **`.env` is in `.gitignore`;** only placeholder `.env.example` files are committed.
- **Helmet** adds security headers; `x-powered-by` is disabled.
- **CORS allow-list:** only the origin in `FRONTEND_URL` may call the API from a browser.
- **Request size limit** of 10 KB for JSON bodies.
- **Validation twice:** browser (fast feedback) and server (real protection). The server accepts only the
  six known fields, so extra fields cannot be injected.
- **No leakage:** error responses never include stack traces or database details; those are logged privately.
  The logger masks any `mongodb://user:password@` text.
- **Atlas:** strong generated password, a database user with only the permissions needed, encrypted (TLS) connection.
- **Honest limitations:** this demo has no login, so anyone with the website address can edit data. A real system
  would add authentication (for example, JSON Web Tokens) and role-based access, rate limiting, and a fixed-IP or
  private link to the database instead of `0.0.0.0/0`.

## 17. Common errors and solutions

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| `npm : File ...npm.ps1 cannot be loaded because running scripts is disabled` | PowerShell policy | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, reopen the terminal |
| `MONGODB_URI is missing or still a placeholder` | `.env` missing or not edited | Create `backend\.env` (section 9) and paste your string |
| `bad auth : Authentication failed` | Wrong username or password in the URI | Re-check; reset the password in *Database Access*; encode special characters |
| `ENOTFOUND` / `querySrv` / timeout / "Could not connect" | Network Access blocks you, no internet, or cluster paused | Add your IP (or `0.0.0.0/0` for Render) in Atlas *Network Access*; make sure the cluster is running |
| `Port 5173 is already in use` | Another Vite window is open | Close the other terminal, then run `npm run dev` again |
| `EADDRINUSE :::5000` | Backend already running | Close the other backend terminal |
| Website shows "Cannot reach the server" locally | Backend not running, or `VITE_API_BASE_URL` wrong | Start the backend; check `frontend\.env`; restart Vite after editing `.env` |
| Browser console: "blocked by CORS policy" | `FRONTEND_URL` does not match the site's exact origin | Fix it (no trailing slash, correct `https`), save, let Render redeploy |
| Live site still calls `localhost` | `VITE_API_BASE_URL` not set in Netlify before the build | Set it and **Clear cache and deploy site** |
| Live site works, then the first request is slow | Render free plan was asleep | Wait up to a minute; open `/api/health` before demonstrating |
| Netlify: "Publish directory not found" | Base directory not set | Base directory `frontend`; publish `dist` (or `frontend/dist`) |
| Netlify page not found after refresh | Missing redirect | `frontend/netlify.toml` provides it; make sure it was pushed |
| Render build fails: `Cannot find package.json` | Root directory not set | Set Root Directory to `backend` |
| `git push` rejected / asks for login | GitHub authentication | Sign in via the browser prompt, or use GitHub Desktop |
| Changes to `.env` have no effect | Server not restarted | Stop (`Ctrl + C`) and start again |

## 18. Screenshots checklist

Take these for your report:

- [ ] Atlas cluster overview (hide the connection string and password)
- [ ] Atlas *Database Access* (user list only) and *Network Access*
- [ ] Backend terminal showing `MongoDB connection established.`
- [ ] Browser: `http://localhost:5000/api/health`
- [ ] Local website with several students
- [ ] Validation error messages on the form
- [ ] Duplicate Student ID error
- [ ] Search results
- [ ] Edit dialog and the updated row
- [ ] Delete confirmation dialog
- [ ] Atlas *Browse Collections* showing the `students` documents
- [ ] GitHub repository page (no `.env` file visible)
- [ ] Render service "Live" status and environment-variable **names** (hide values)
- [ ] Render health URL in the browser
- [ ] Netlify deploy "Published" status
- [ ] Live Netlify website performing add, edit, delete
- [ ] Atlas collection before and after a change made from the live site
- [ ] Phone-size (responsive) view

## 19. Presentation and viva material

See **[`docs/PRESENTATION.md`](docs/PRESENTATION.md)** for: a short explanation for your professor,
a two-minute presentation script, a demonstration sequence, and likely viva questions with short answers.

## 20. Final project verification checklist

Tick each box only after you have seen it work yourself.

**Local**
- [ ] `npm install` completed in `backend` and `frontend` without errors
- [ ] `npm test` in `backend` shows 16 passing tests
- [ ] Backend prints `MongoDB connection established.`
- [ ] `/api/health` shows `"database": "connected"`
- [ ] Add, view, search, edit, delete all work on `http://localhost:5173`
- [ ] Records appear, change and disappear in Atlas

**Cloud**
- [ ] Code pushed to GitHub; no `.env` file in the repository
- [ ] Render shows "Live"; `https://<render-url>/api/health` is OK
- [ ] Netlify shows "Published"
- [ ] `VITE_API_BASE_URL` in Netlify = Render URL
- [ ] `FRONTEND_URL` in Render = Netlify origin
- [ ] Live site: add, edit, search, delete all work
- [ ] The same changes are visible in Atlas
- [ ] Browser developer tools (Network tab) show requests going to the Render URL, **not** `localhost`

**Report**
- [ ] All screenshots collected
- [ ] Architecture diagram and flow explained
- [ ] Presentation script practised
