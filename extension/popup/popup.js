/**
 * TailorCraft Extension - Neo-Brutalist Popup Controller
 */

const DEFAULT_API_URL = 'http://localhost:3000';

const RESUME_STEPS = [
  '[01/04] ANALYZING REQUIREMENTS...',
  '[02/04] ALIGNING ATS KEYWORDS...',
  '[03/04] NORMALIZING ACHIEVEMENTS...',
  '[04/04] COMPILING WORD DOCX...'
];

const COVER_STEPS = [
  '[01/04] ANALYZING JOB POSTING...',
  '[02/04] MATCHING CAREER EXPERIENCE...',
  '[03/04] DRAFTING EDITORIAL LETTER...',
  '[04/04] COMPILING WORD DOCX...'
];

const PDF_STEPS = [
  '[01/04] ANALYZING JOB REQS...',
  '[02/04] ALIGNING ATS KEYWORDS...',
  '[03/04] NORMALIZING ACHIEVEMENTS...',
  '[04/04] COMPILING EDITORIAL PDF...'
];

// DOM Elements
const loggedOutView = document.getElementById('logged-out-view');
const loggedInView = document.getElementById('logged-in-view');
const alertContainer = document.getElementById('alert-container');
const connectionStatus = document.getElementById('connection-status');

const loginNameInput = document.getElementById('login-name');
const loginEmailInput = document.getElementById('login-email');
const btnLogin = document.getElementById('btn-login');
const btnDemoLogin = document.getElementById('btn-demo-login');

const userAvatar = document.getElementById('user-avatar');
const userDisplayName = document.getElementById('user-display-name');
const userDisplayEmail = document.getElementById('user-display-email');
const profileMetaText = document.getElementById('profile-meta-text');
const btnLogout = document.getElementById('btn-logout');
const btnRefreshProfile = document.getElementById('btn-refresh-profile');

const jobDescTextarea = document.getElementById('job-desc');
const charCount = document.getElementById('char-count');
const btnGrabSelection = document.getElementById('btn-grab-selection');

const btnGeneratePdf = document.getElementById('btn-generate-pdf');
const btnGenerateResume = document.getElementById('btn-generate-resume');
const btnGenerateCover = document.getElementById('btn-generate-cover');
const actionButtonsGroup = document.getElementById('action-buttons-group');
const progressBox = document.getElementById('progress-box');
const progressTickerText = document.getElementById('progress-ticker-text');


const toggleSettings = document.getElementById('toggle-settings');
const settingsPanel = document.getElementById('settings-panel');
const apiUrlInput = document.getElementById('api-url');
const btnSaveSettings = document.getElementById('btn-save-settings');

let isGenerating = false;
let stepTimer = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadSettings();
  await checkAuth();
  await grabSelectionFromActiveTab();
});

function showAlert(message, type = 'error') {
  const isSuccess = type === 'success';
  alertContainer.innerHTML = `
    <div class="neo-alert ${isSuccess ? 'neo-alert-success' : 'neo-alert-error'}">
      <span>${isSuccess ? '✓' : '⚠️'}</span>
      <div>${message}</div>
    </div>
  `;
}

function clearAlert() {
  alertContainer.innerHTML = '';
}

async function loadSettings() {
  const { apiUrl } = await chrome.storage.local.get(['apiUrl']);
  apiUrlInput.value = apiUrl || DEFAULT_API_URL;
}

async function getApiUrl() {
  const { apiUrl } = await chrome.storage.local.get(['apiUrl']);
  return apiUrl || DEFAULT_API_URL;
}

// Check user login state
async function checkAuth() {
  const { userEmail, userName } = await chrome.storage.local.get(['userEmail', 'userName']);
  
  if (userEmail) {
    loggedOutView.style.display = 'none';
    loggedInView.style.display = 'block';

    const displayName = userName || userEmail.split('@')[0];
    userAvatar.textContent = displayName.charAt(0).toUpperCase();
    userDisplayName.textContent = displayName;
    userDisplayEmail.textContent = userEmail;

    syncProfileFromServer(userEmail);
  } else {
    loggedInView.style.display = 'none';
    loggedOutView.style.display = 'block';
    connectionStatus.textContent = 'Disconnected';
  }
}

async function syncProfileFromServer(email) {
  try {
    const apiUrl = await getApiUrl();
    connectionStatus.textContent = 'Syncing...';

    const response = await fetch(`${apiUrl}/api/user/profile?email=${encodeURIComponent(email)}`);
    if (response.ok) {
      const data = await response.json();
      const expCount = data?.savedProfile?.resumeData?.work_experience?.length || 0;
      profileMetaText.textContent = `✓ SQLite Profile Synced (${expCount} jobs)`;
      connectionStatus.textContent = 'Synced';
    } else {
      profileMetaText.textContent = '⚠️ Using Local Fallback Profile';
      connectionStatus.textContent = 'Local';
    }
  } catch (err) {
    console.warn('Sync profile error:', err);
    profileMetaText.textContent = '✓ Offline Profile Mode';
    connectionStatus.textContent = 'Offline';
  }
}

// Grab selected text from active tab
async function grabSelectionFromActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('edge://') || tab.url?.startsWith('about:')) {
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() || ''
    });

    if (results && results[0] && results[0].result) {
      const selected = results[0].result.trim();
      if (selected.length > 0) {
        jobDescTextarea.value = selected;
        updateCharCount();
        showAlert('Auto-captured selected text from active tab!', 'success');
      }
    }
  } catch (err) {
    console.warn('Could not grab selection from active tab:', err);
  }
}

function updateCharCount() {
  const len = (jobDescTextarea.value || '').length;
  charCount.textContent = `${len} chars`;
}

function startGenerationProgress(type) {
  isGenerating = true;
  if (btnGeneratePdf) btnGeneratePdf.disabled = true;
  btnGenerateResume.disabled = true;
  btnGenerateCover.disabled = true;
  progressBox.style.display = 'flex';

  const steps = type === 'cover-letter' ? COVER_STEPS : (type === 'pdf' ? PDF_STEPS : RESUME_STEPS);
  let stepIdx = 0;
  progressTickerText.textContent = steps[0];

  stepTimer = setInterval(() => {
    stepIdx = (stepIdx + 1) % steps.length;
    progressTickerText.textContent = steps[stepIdx];
  }, 1800);
}

function stopGenerationProgress() {
  isGenerating = false;
  if (btnGeneratePdf) btnGeneratePdf.disabled = false;
  btnGenerateResume.disabled = false;
  btnGenerateCover.disabled = false;
  progressBox.style.display = 'none';

  if (stepTimer) {
    clearInterval(stepTimer);
    stepTimer = null;
  }
}

// Generate & Download Resume (DOCX/PDF) or Cover Letter
async function handleGenerate(type = 'resume') {
  clearAlert();
  const text = (jobDescTextarea.value || '').trim();

  if (!text || text.length < 10) {
    showAlert('Please highlight or paste a job posting (at least 10 characters).');
    return;
  }

  const { userEmail } = await chrome.storage.local.get(['userEmail']);
  if (!userEmail) {
    showAlert('Please log in first to sync your profile.');
    checkAuth();
    return;
  }

  startGenerationProgress(type);

  try {
    const apiUrl = await getApiUrl();
    const isPdf = type === 'pdf';

    const response = await fetch(`${apiUrl}/api/extension/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': userEmail,
        'Authorization': `Bearer ${userEmail}`
      },
      body: JSON.stringify({
        email: userEmail,
        jobDescription: text,
        type: isPdf ? 'pdf' : type,
        format: isPdf ? 'pdf' : 'docx'
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}: Failed to generate document`);
    }

    const data = await response.json();
    let dataUrl = '';
    let filename = data.filename;

    if (data.pdfBase64) {
      dataUrl = `data:application/pdf;base64,${data.pdfBase64}`;
      if (!filename) filename = 'Tailored_Resume.pdf';
    } else if (data.docxBase64) {
      dataUrl = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${data.docxBase64}`;
      if (!filename) filename = type === 'cover-letter' ? 'Tailored_Cover_Letter.docx' : 'Tailored_Resume.docx';
    } else {
      throw new Error('Server did not return a generated file.');
    }

    progressTickerText.textContent = 'DOWNLOADING FILE...';

    await new Promise((resolve, reject) => {
      chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(downloadId);
        }
      });
    });

    showAlert(`✓ Downloaded <strong>${filename}</strong> to Downloads!`, 'success');

  } catch (error) {
    console.error('Generation failed:', error);
    showAlert(error.message || 'Generation failed. Verify API server is running.');
  } finally {
    stopGenerationProgress();
  }
}


function setupEventListeners() {
  // Login
  btnLogin.addEventListener('click', async () => {
    const name = loginNameInput.value.trim() || 'User';
    const email = loginEmailInput.value.trim().toLowerCase();

    if (!email) {
      showAlert('Please provide an email address.');
      return;
    }

    await chrome.storage.local.set({ userEmail: email, userName: name });
    clearAlert();
    await checkAuth();
  });

  // Demo Login
  btnDemoLogin.addEventListener('click', async () => {
    await chrome.storage.local.set({
      userEmail: 'alex.chen@example.com',
      userName: 'Alex Chen'
    });
    clearAlert();
    await checkAuth();
  });

  // Logout
  btnLogout.addEventListener('click', async () => {
    await chrome.storage.local.remove(['userEmail', 'userName']);
    clearAlert();
    await checkAuth();
  });

  // Refresh profile
  btnRefreshProfile.addEventListener('click', async () => {
    const { userEmail } = await chrome.storage.local.get(['userEmail']);
    if (userEmail) {
      clearAlert();
      await syncProfileFromServer(userEmail);
    }
  });

  // Grab selection
  btnGrabSelection.addEventListener('click', async () => {
    await grabSelectionFromActiveTab();
  });

  jobDescTextarea.addEventListener('input', updateCharCount);

  // Generate Resume (PDF)
  if (btnGeneratePdf) {
    btnGeneratePdf.addEventListener('click', () => handleGenerate('pdf'));
  }

  // Generate Resume (DOCX)
  btnGenerateResume.addEventListener('click', () => handleGenerate('resume'));

  // Generate Cover Letter
  btnGenerateCover.addEventListener('click', () => handleGenerate('cover-letter'));

  // Settings Toggle
  toggleSettings.addEventListener('click', () => {
    settingsPanel.classList.toggle('open');
  });

  // Save Settings
  btnSaveSettings.addEventListener('click', async () => {
    const url = apiUrlInput.value.trim().replace(/\/+$/, '');
    await chrome.storage.local.set({ apiUrl: url });
    settingsPanel.classList.remove('open');
    showAlert('Server URL updated.', 'success');
  });
}
