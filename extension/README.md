# TailorCraft AI - Browser Extension

A Manifest V3 browser extension that turns any job posting on the web into a tailored, ATS-optimized DOCX resume in **1 click**, using your saved master work history, education, and template styling.

---

## Features

- **1-Click Generation & Direct Download**: Takes job descriptions from the web and immediately downloads an ATS-compliant Word (`.docx`) file to your Downloads folder.
- **Tab Selection Auto-Capture**: Automatically detects and extracts highlighted job descriptions from your active browser tab (LinkedIn, Indeed, Lever, Greenhouse, etc.).
- **Right-Click Context Menu**: Highlight any job post -> Right-click -> **✨ Tailor Resume for Selected Job**.
- **Dynamic Loading Feedback**: Real-time progress updates cycling through analysis, alignment, formatting, and file generation.
- **User Authentication & Profile Sync**: Syncs with your saved profile and template styling from the web app or demo user.

---

## How to Install in Google Chrome / Brave / Microsoft Edge

1. Open your browser and navigate to:
   - **Chrome**: `chrome://extensions`
   - **Brave**: `brave://extensions`
   - **Edge**: `edge://extensions`
2. Enable **Developer mode** (toggle switch in the top right or bottom left corner).
3. Click **Load unpacked** (or "Load unpacked extension").
4. Select the `extension` folder located inside this project:
   `c:\Users\devan\Documents\antigravity\silly-borg\extension`
5. The **TailorCraft AI** icon (`TC`) will now appear in your browser extension toolbar! Pin it for easy access.

---

## How to Use

### Method 1: Extension Popup (Recommended)
1. Highlight any job description on a webpage (e.g. LinkedIn, Indeed, company careers page).
2. Click the **TC** extension icon in your browser toolbar.
3. If not already logged in:
   - Click **1-Click Demo Login (Alex Chen)** or enter your email.
4. Your highlighted job description is **automatically grabbed** and loaded into the box!
5. Click **✨ Tailor & Download Resume (DOCX)**.
6. Watch the dynamic status messages as AI tailors your resume. Your customized Word document downloads automatically!

### Method 2: Right-Click Context Menu
1. Highlight any job posting text on any webpage.
2. Right-click the highlighted text.
3. Select **✨ Tailor Resume for Selected Job**.
4. The extension communicates with your local TailorCraft server in the background and downloads the tailored `.docx` file directly.

---

## Configuration

By default, the extension connects to `http://localhost:3000`. If you run your server on a custom port or domain:
1. Open the extension popup.
2. Click **⚙️ API Settings** at the bottom.
3. Update the **API Server URL** and click **Save Settings**.
