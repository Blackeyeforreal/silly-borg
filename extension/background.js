/**
 * TailorCraft Resume & Career Extension - Service Worker (Manifest V3)
 */

const DEFAULT_API_URL = 'http://localhost:3000';

// Register context menus on install or startup
chrome.runtime.onInstalled.addListener(() => {
  // Context Menu 1: Tailor Resume (PDF)
  chrome.contextMenus.create({
    id: 'tailor-job-resume-pdf',
    title: '📄 Tailor Resume (PDF)',
    contexts: ['selection']
  });

  // Context Menu 2: Tailor Resume (DOCX)
  chrome.contextMenus.create({
    id: 'tailor-job-resume-docx',
    title: '⚡ Tailor Resume (DOCX)',
    contexts: ['selection']
  });

  // Context Menu 3: Tailor Cover Letter (DOCX)
  chrome.contextMenus.create({
    id: 'tailor-job-cover-letter',
    title: '📝 Tailor Cover Letter (DOCX)',
    contexts: ['selection']
  });

  console.log('TailorCraft context menus registered.');
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const allowed = ['tailor-job-resume-pdf', 'tailor-job-resume-docx', 'tailor-job-cover-letter'];
  if (!allowed.includes(info.menuItemId)) return;

  let type = 'resume';
  let format = 'docx';

  if (info.menuItemId === 'tailor-job-resume-pdf') {
    type = 'resume';
    format = 'pdf';
  } else if (info.menuItemId === 'tailor-job-cover-letter') {
    type = 'cover-letter';
    format = 'docx';
  }

  const selectedText = (info.selectionText || '').trim();

  if (!selectedText || selectedText.length < 10) {
    showNotification(
      'Selection Too Short',
      'Please highlight a longer portion of the job posting text before tailoring.'
    );
    return;
  }

  try {
    await handleGenerateFromMessage(selectedText, type, format);
  } catch (err) {
    console.error('Context menu generation error:', err);
  }
});

// Runtime message listener for content script floating buttons & popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateResumeFromSelection' || request.action === 'generate') {
    const type = request.type || (request.action === 'generateCoverLetterFromSelection' ? 'cover-letter' : 'resume');
    const format = request.format || (type === 'pdf' ? 'pdf' : 'docx');
    handleGenerateFromMessage(request.jobDescription, type, format)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message || 'Error generating document' }));
    return true; // Keep message channel open for async response
  }
});

async function handleGenerateFromMessage(jobDescription, type = 'resume', format = 'docx') {
  const storage = await chrome.storage.local.get(['userEmail', 'apiUrl']);
  const userEmail = storage.userEmail;
  const apiUrl = storage.apiUrl || DEFAULT_API_URL;

  if (!userEmail) {
    showNotification(
      'Login Required',
      'Please click the TailorCraft extension icon to log in and sync your master profile.'
    );
    throw new Error('Please log into TailorCraft first via the extension icon');
  }

  const isCoverLetter = type === 'cover-letter';
  const isPdf = format === 'pdf' || type === 'pdf';

  showNotification(
    isCoverLetter ? 'TailorCraft: Writing Cover Letter' : (isPdf ? 'TailorCraft: Generating PDF Resume' : 'TailorCraft: Tailoring Resume'),
    isCoverLetter 
      ? 'Drafting tailored 1-page cover letter matching job requirements...'
      : (isPdf ? 'Typesetting crisp editorial PDF resume with clickable hyperlinks...' : 'Normalizing work history & tailoring executive resume...')
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
      jobDescription,
      type: isPdf ? 'pdf' : type,
      format: isPdf ? 'pdf' : format
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to generate document (HTTP ${response.status})`);
  }

  const data = await response.json();
  let dataUrl = '';
  let filename = data.filename;

  if (data.pdfBase64) {
    dataUrl = `data:application/pdf;base64,${data.pdfBase64}`;
    if (!filename) filename = 'Tailored_Resume.pdf';
  } else if (data.docxBase64) {
    dataUrl = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${data.docxBase64}`;
    if (!filename) filename = isCoverLetter ? 'Tailored_Cover_Letter.docx' : 'Tailored_Resume.docx';
  } else {
    throw new Error('No document file returned by server');
  }

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
    'Document Downloaded!',
    `Successfully saved ${filename} directly to your Downloads folder.`
  );

  return { success: true, filename, type: isPdf ? 'pdf' : type };
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

