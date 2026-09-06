# TailorCraft AI - Browser Extension (Manifest V3)

A Manifest V3 browser extension built with **Neo-Brutalist Swiss Editorial UI** that turns any job posting on the web into a tailored, ATS-optimized **Resume** or **Matched Cover Letter** in **1 click**, using your saved SQLite master profile and typography styling.

---

## Features

- **Multi-Format 1-Click Generation**:
  - **📄 Tailor Resume (PDF)**: Typesets an editorial letter PDF resume directly with active, clickable OpenXML/PDF link annotations.
  - **⚡ Tailor Resume (DOCX)**: Normalizes your work history, extracts semantic hyperlinks, eliminates duplicate roles/prefixes, and aligns ATS keywords to the job description.
  - **📝 Tailor Cover Letter (DOCX)**: Drafts an executive 1-page cover letter referencing verified metrics and candidate achievements.
- **Smart Standardized Filename**:
  - Automatically names files using the standard convention: `{Name}_resume_{role}.pdf` or `{Name}_resume_{role}.docx` (e.g. `Devang_Srivastava_resume_Senior_Software_Engineer.pdf`).
- **Reliable Hovering Floating Widget**:
  - Automatically positions right above your text selection on any job board or webpage with quick-action buttons for `[📄 TAILOR PDF]`, `[⚡ DOCX]`, and `[📝 COVER]`.
- **Right-Click Context Menus**:
  - Highlight any text -> Right-click -> **📄 Tailor Resume (PDF)**
  - Highlight any text -> Right-click -> **⚡ Tailor Resume (DOCX)**
  - Highlight any text -> Right-click -> **📝 Tailor Cover Letter (DOCX)**
- **Direct-to-Downloads Export**: Downloads high-fidelity PDF and Word (`.docx`) documents automatically without tedious file picker dialogs.
- **SQLite Database Profile Sync**: Seamlessly syncs with your saved profile and template preferences from the local database.

---

## Installation Guide (Chrome / Brave / Edge)

1. Open your browser and navigate to:
   - **Chrome**: `chrome://extensions`
   - **Brave**: `brave://extensions`
   - **Edge**: `edge://extensions`
2. Enable **Developer mode** (toggle in the top right or bottom left corner).
3. Click **Load unpacked** (or click the reload icon if already loaded).
4. Select the `extension` directory inside this repository:
   `c:\Users\devan\Documents\antigravity\silly-borg\extension`
5. The **TailorCraft** icon (`TC`) will appear in your browser extensions toolbar. Pin it for quick access!

---

## How to Use

### 1. Hovering Action Widget
1. Highlight any job posting text on any website (LinkedIn, Indeed, Greenhouse, Lever, etc.).
2. The hovering Neo-Brutalist toolbar immediately displays right above your selection:
   - Click **📄 TAILOR PDF** to generate an editorial PDF resume.
   - Click **⚡ DOCX** to generate an ATS-tailored Word resume.
   - Click **📝 COVER** to generate a matched cover letter.
3. Watch the progress ticker as AI normalizes and formats your document, then automatically downloads it with the format `{Name}_resume_{role}`.

### 2. Extension Popup
1. Highlight text on a job posting (or open popup directly and paste text).
2. Click the **TC** icon in your browser toolbar.
3. The selected text is **automatically captured** into the job description box.
4. Click either **📄 Tailor & Download Resume (PDF)**, **⚡ Tailor & Download Resume (DOCX)**, or **📝 Generate Matched Cover Letter (DOCX)**.

### 3. Right-Click Context Menu
1. Highlight any job posting text.
2. Right-click and choose **📄 Tailor Resume (PDF)**, **⚡ Tailor Resume (DOCX)**, or **📝 Tailor Cover Letter (DOCX)**.
3. Your document downloads automatically in the background with desktop notification confirmations.


---

## Configuration

By default, the extension connects to `http://localhost:3000`.
To use a different local port or hosted domain:
1. Open the extension popup.
2. Click **⚙️ API SETTINGS** at the bottom.
3. Enter your server URL and click **Save Settings**.
