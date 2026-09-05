/**
 * TailorCraft AI - Content Script
 * Displays a floating action button above the mouse / selection when text is highlighted on any webpage.
 */

(function() {
  let floatingBtn = null;
  let activeSelectionText = '';
  let isGenerating = false;

  function createFloatingButton() {
    if (floatingBtn) return floatingBtn;

    floatingBtn = document.createElement('div');
    floatingBtn.id = 'tailorcraft-floating-action-pill';
    floatingBtn.style.position = 'absolute';
    floatingBtn.style.zIndex = '2147483647';
    floatingBtn.style.display = 'none';
    floatingBtn.style.alignItems = 'center';
    floatingBtn.style.gap = '8px';
    floatingBtn.style.padding = '8px 14px';
    floatingBtn.style.backgroundColor = '#2563eb';
    floatingBtn.style.color = '#ffffff';
    floatingBtn.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    floatingBtn.style.fontSize = '13px';
    floatingBtn.style.fontWeight = '600';
    floatingBtn.style.lineHeight = '1.3';
    floatingBtn.style.borderRadius = '9999px';
    floatingBtn.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.45), 0 2px 6px rgba(0,0,0,0.15)';
    floatingBtn.style.cursor = 'pointer';
    floatingBtn.style.userSelect = 'none';
    floatingBtn.style.transition = 'transform 0.15s ease, opacity 0.15s ease, background-color 0.2s';
    floatingBtn.style.transform = 'scale(0.95)';
    floatingBtn.style.opacity = '0';
    floatingBtn.innerHTML = `
      <span style="font-size: 15px;">✨</span>
      <span id="tailorcraft-btn-label">Generate Tailored Resume</span>
    `;

    floatingBtn.addEventListener('mouseenter', () => {
      if (!isGenerating) {
        floatingBtn.style.backgroundColor = '#1d4ed8';
        floatingBtn.style.transform = 'scale(1.03)';
      }
    });

    floatingBtn.addEventListener('mouseleave', () => {
      if (!isGenerating) {
        floatingBtn.style.backgroundColor = '#2563eb';
        floatingBtn.style.transform = 'scale(1)';
      }
    });

    floatingBtn.addEventListener('mousedown', (e) => {
      e.stopPropagation(); // prevent clearing selection before click completes
    });

    floatingBtn.addEventListener('click', handleFloatingButtonClick);

    document.body.appendChild(floatingBtn);
    return floatingBtn;
  }

  function showFloatingButton(rect) {
    const btn = createFloatingButton();
    const btnWidth = 210;
    const btnHeight = 36;

    let top = rect.top + window.scrollY - btnHeight - 10;
    // If not enough space above selection, show directly below
    if (top < window.scrollY + 10) {
      top = rect.bottom + window.scrollY + 10;
    }

    let left = rect.left + window.scrollX + (rect.width / 2) - (btnWidth / 2);
    // Keep inside viewport horizontally
    left = Math.max(10, Math.min(left, window.innerWidth + window.scrollX - btnWidth - 15));

    btn.style.top = `${top}px`;
    btn.style.left = `${left}px`;
    btn.style.display = 'flex';

    // Trigger smooth fade-in
    requestAnimationFrame(() => {
      btn.style.opacity = '1';
      btn.style.transform = 'scale(1)';
    });
  }

  function hideFloatingButton() {
    if (!floatingBtn || isGenerating) return;
    floatingBtn.style.opacity = '0';
    floatingBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      if (floatingBtn && !isGenerating) {
        floatingBtn.style.display = 'none';
      }
    }, 150);
  }

  async function handleFloatingButtonClick(e) {
    e.stopPropagation();
    if (isGenerating || !activeSelectionText) return;

    isGenerating = true;
    const label = floatingBtn.querySelector('#tailorcraft-btn-label');
    floatingBtn.style.backgroundColor = '#1e40af';

    const steps = [
      'Analyzing Job...',
      'Matching Skills...',
      'Aligning ATS Keywords...',
      'Building DOCX...',
      'Downloading...'
    ];

    let stepIndex = 0;
    label.textContent = steps[0];

    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      label.textContent = steps[stepIndex];
    }, 1800);

    try {
      // Send message to background service worker to perform generation and download
      const response = await chrome.runtime.sendMessage({
        action: 'generateResumeFromSelection',
        jobDescription: activeSelectionText
      });

      clearInterval(interval);

      if (response && response.success) {
        label.textContent = '✓ Resume Downloaded!';
        floatingBtn.style.backgroundColor = '#16a34a'; // Green success
        setTimeout(() => {
          isGenerating = false;
          hideFloatingButton();
          label.textContent = 'Generate Tailored Resume';
          floatingBtn.style.backgroundColor = '#2563eb';
        }, 2200);
      } else {
        throw new Error(response?.error || 'Generation failed');
      }
    } catch (err) {
      clearInterval(interval);
      label.textContent = err.message?.includes('log in') ? '⚠️ Please Log In' : '⚠️ Generation Failed';
      floatingBtn.style.backgroundColor = '#dc2626'; // Error red
      setTimeout(() => {
        isGenerating = false;
        hideFloatingButton();
        label.textContent = 'Generate Tailored Resume';
        floatingBtn.style.backgroundColor = '#2563eb';
      }, 3000);
    }
  }

  // Listen for mouseup selection
  document.addEventListener('mouseup', (e) => {
    // If click inside the floating button, ignore
    if (floatingBtn && floatingBtn.contains(e.target)) return;

    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        hideFloatingButton();
        activeSelectionText = '';
        return;
      }

      const text = selection.toString().trim();
      // Only show if user highlighted meaningful text (e.g. at least 15 chars)
      if (text.length >= 15) {
        activeSelectionText = text;
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          showFloatingButton(rect);
        }
      } else {
        hideFloatingButton();
        activeSelectionText = '';
      }
    }, 80);
  });

  // Hide on scroll or clicking elsewhere
  document.addEventListener('mousedown', (e) => {
    if (floatingBtn && !floatingBtn.contains(e.target) && !isGenerating) {
      hideFloatingButton();
    }
  });

})();
