/**
 * TailorCraft Resume Extension - Service Worker (Manifest V3)
 */

const DEFAULT_API_URL = 'https://bioforge-xi.vercel.app';

// Register context menu on install or startup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'tailor-job-selection',
    title: '✨ Tailor Resume for Selected Job',
    contexts: ['selection']
  });
  console.log('TailorCraft context menu registered.');
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'tailor-job-selection') return;

  const selectedText = (info.selectionText || '').trim();
  if (!selectedText || selectedText.length < 10) {
    showNotification(
      'Invalid Selection',
      'Please highlight a longer portion of the job description before tailoring.'
    );
    return;
  }

  // Retrieve user session & settings from storage
  const storage = await chrome.storage.local.get(['userEmail', 'userName', 'apiUrl']);
  const userEmail = storage.userEmail;
  const apiUrl = storage.apiUrl || DEFAULT_API_URL;

  if (!userEmail) {
    showNotification(
      'Login Required',
      'Please click the TailorCraft extension icon in your browser toolbar to log in or connect your account.'
    );
    return;
  }

  showNotification(
    'TailorCraft AI Processing',
    'Analyzing job description & tailoring your resume from your saved profile...'
  );

  try {
    const response = await fetch(`${apiUrl}/api/extension/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': userEmail,
        'Authorization': `Bearer ${userEmail}`
      },
      body: JSON.stringify({
        email: userEmail,
        jobDescription: selectedText
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}: Failed to generate resume`);
    }

    const data = await response.json();
    if (!data.docxBase64) {
      throw new Error('API did not return a generated DOCX file.');
    }

    // Trigger one-click download of the generated resume
    const dataUrl = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${data.docxBase64}`;
    const filename = data.filename || 'Tailored_Resume.docx';

    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download error:', chrome.runtime.lastError);
        showNotification('Download Error', chrome.runtime.lastError.message);
      } else {
        showNotification(
          'Resume Downloaded!',
          `Successfully saved ${filename} directly to your Downloads folder.`
        );
      }
    });

  } catch (error) {
    console.error('Generation error:', error);
    showNotification('Generation Failed', error.message || 'Unable to tailor resume.');
  }
});

// Runtime message listener for content script floating button
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateResumeFromSelection') {
    handleGenerateFromMessage(request.jobDescription)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message || 'Error tailoring resume' }));
    return true; // Keep message channel open for async response
  }
});

async function handleGenerateFromMessage(jobDescription) {
  const storage = await chrome.storage.local.get(['userEmail', 'apiUrl']);
  const userEmail = storage.userEmail;
  const apiUrl = storage.apiUrl || DEFAULT_API_URL;

  if (!userEmail) {
    showNotification(
      'Login Required',
      'Please click the TailorCraft extension icon to log in and access your saved profile.'
    );
    throw new Error('Please log into TailorCraft first via the extension icon');
  }

  showNotification(
    'TailorCraft AI Processing',
    'Analyzing job description & tailoring your resume from your saved profile...'
  );

  const response = await fetch(`${apiUrl}/api/extension/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-email': userEmail,
      'Authorization': `Bearer ${userEmail}`
    },
    body: JSON.stringify({
      email: userEmail,
      jobDescription
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to generate resume (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (!data.docxBase64) {
    throw new Error('No DOCX file returned by server');
  }

  const dataUrl = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${data.docxBase64}`;
  const filename = data.filename || 'Tailored_Resume.docx';

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

  showNotification(
    'Resume Downloaded!',
    `Successfully saved ${filename} directly to your Downloads folder.`
  );

  return { success: true, filename };
}

function showNotification(title, message) {
  if (chrome.notifications && chrome.notifications.create) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: message,
      priority: 2
    });
  }
}
