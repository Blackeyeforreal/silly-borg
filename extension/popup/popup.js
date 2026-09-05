/**
 * TailorCraft Extension - Popup Logic
 */

const DEFAULT_API_URL = 'http://localhost:3000';

const DYNAMIC_STEPS = [
  'Analyzing job requirements & tech stack...',
  'Matching core competencies & achievements...',
  'Highlighting high-impact quantifiable metrics...',
  'Aligning resume keywords for ATS scoring...',
  'Drafting role-tailored bullet points...',
  'Formatting executive layout & typography...',
  'Building Word DOCX document...',
  'Downloading tailored resume...'
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

const btnGenerate = document.getElementById('btn-generate');
const btnSpinner = document.getElementById('btn-spinner');
const btnText = document.getElementById('btn-text');

const toggleSettings = document.getElementById('toggle-settings');
const settingsPanel = document.getElementById('settings-panel');
const apiUrlInput = document.getElementById('api-url');
const btnSaveSettings = document.getElementById('btn-save-settings');

let isGenerating = false;
let stepTimer = null;

// Initialize on popup load
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadSettings();
  await checkAuth();
  await grabSelectionFromActiveTab();
});

function showAlert(message, type = 'error') {
  alertContainer.innerHTML = `
    <div class="alert alert-${type}">
      <span>${type === 'success' ? '✓' : '⚠️'}</span>
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

    // Check profile on server
    syncProfileFromServer(userEmail);
  } else {
    loggedInView.style.display = 'none';
    loggedOutView.style.display = 'block';
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
      profileMetaText.textContent = `✓ Master Profile Synced (${expCount} jobs)`;
      connectionStatus.textContent = 'Connected';
    } else {
      profileMetaText.textContent = '⚠️ Master profile not found on server';
      connectionStatus.textContent = 'Ready';
    }
  } catch (err) {
    console.warn('Sync profile error:', err);
    profileMetaText.textContent = '✓ Offline / Local Mode';
    connectionStatus.textContent = 'Offline';
  }
}

// Grab selected text from active tab
async function grabSelectionFromActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    // Avoid injecting into chrome:// or extension pages
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
  charCount.textContent = `${len} characters`;
}

function startEngagingLoading() {
  isGenerating = true;
  btnGenerate.disabled = true;
  btnSpinner.style.display = 'inline-block';

  let stepIdx = 0;
  btnText.textContent = DYNAMIC_STEPS[0];

  stepTimer = setInterval(() => {
    stepIdx = (stepIdx + 1) % DYNAMIC_STEPS.length;
    btnText.textContent = DYNAMIC_STEPS[stepIdx];
  }, 2000);
}

function stopEngagingLoading() {
  isGenerating = false;
  btnGenerate.disabled = false;
  btnSpinner.style.display = 'none';
  btnText.textContent = '✨ Tailor & Download Resume (DOCX)';

  if (stepTimer) {
    clearInterval(stepTimer);
    stepTimer = null;
  }
}

// Generate & Download Resume
async function handleGenerateResume() {
  clearAlert();
  const text = (jobDescTextarea.value || '').trim();

  if (!text || text.length < 10) {
    showAlert('Please highlight or paste a job description (at least 10 characters).');
    return;
  }

  const { userEmail } = await chrome.storage.local.get(['userEmail']);
  if (!userEmail) {
    showAlert('Please log in first to use your master profile.');
    checkAuth();
    return;
  }

  startEngagingLoading();

  try {
    const apiUrl = await getApiUrl();

    const response = await fetch(`${apiUrl}/api/extension/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': userEmail,
        'Authorization': `Bearer ${userEmail}`
      },
      body: JSON.stringify({
        email: userEmail,
        jobDescription: text
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}: Failed to generate resume`);
    }

    const data = await response.json();
    if (!data.docxBase64) {
      throw new Error('Server did not return a generated DOCX file.');
    }

    btnText.textContent = 'Downloading resume...';

    const dataUrl = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${data.docxBase64}`;
    const filename = data.filename || 'Tailored_Resume.docx';

    // Trigger download in browser
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

    showAlert(`🎉 Successfully downloaded <strong>${filename}</strong> to your Downloads folder!`, 'success');

  } catch (error) {
    console.error('Generation failed:', error);
    showAlert(error.message || 'Failed to tailor resume. Please check your API server.');
  } finally {
    stopEngagingLoading();
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

  // Generate button
  btnGenerate.addEventListener('click', handleGenerateResume);

  // Settings
  toggleSettings.addEventListener('click', () => {
    settingsPanel.classList.toggle('open');
  });

  btnSaveSettings.addEventListener('click', async () => {
    const url = apiUrlInput.value.trim().replace(/\/+$/, '');
    await chrome.storage.local.set({ apiUrl: url });
    settingsPanel.classList.remove('open');
    showAlert('API Server settings saved.', 'success');
  });
}
