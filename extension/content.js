/**
 * TailorCraft AI - Content Script
 * Displays a hovering quick-action icon and expandable Neo-Brutalist toolbar
 * above text selections on any webpage.
 */

(function() {
  // Prevent duplicate injection
  if (window.__tailorcraft_injected__) return;
  window.__tailorcraft_injected__ = true;

  let floatingContainer = null;
  let activeSelectionText = '';
  let isGenerating = false;
  let lastSelectionRect = null;

  function createFloatingContainer() {
    if (floatingContainer && document.body.contains(floatingContainer)) {
      return floatingContainer;
    }

    if (floatingContainer) {
      floatingContainer.remove();
    }

    floatingContainer = document.createElement('div');
    floatingContainer.id = 'tailorcraft-neo-floating-widget';
    floatingContainer.style.cssText = `
      position: absolute !important;
      z-index: 2147483647 !important;
      display: none;
      align-items: center !important;
      background: #141413 !important;
      border: 2px solid #141413 !important;
      box-shadow: 3px 3px 0px #141413 !important;
      padding: 3px !important;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
      font-size: 11px !important;
      font-weight: 800 !important;
      line-height: 1 !important;
      color: #ffffff !important;
      user-select: none !important;
      box-sizing: border-box !important;
      transition: transform 0.12s ease, opacity 0.12s ease !important;
      transform: scale(0.96) !important;
      opacity: 0 !important;
      pointer-events: auto !important;
    `;

    floatingContainer.innerHTML = `
      <div id="tc-button-row" style="display: flex; align-items: center; gap: 3px;">
        <button id="tc-btn-pdf" type="button" title="Download tailored PDF resume" style="
          background: #D4FF00;
          color: #141413;
          border: 1px solid #141413;
          padding: 6px 10px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: background 0.1s ease;
        ">
          <span>📄</span>
          <span>TAILOR PDF</span>
        </button>

        <button id="tc-btn-resume" type="button" title="Download tailored DOCX resume" style="
          background: #EAE6DD;
          color: #141413;
          border: 1px solid #141413;
          padding: 6px 9px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: background 0.1s ease;
        ">
          <span>⚡</span>
          <span>DOCX</span>
        </button>

        <button id="tc-btn-cover" type="button" title="Draft tailored Cover Letter" style="
          background: #FFFFFF;
          color: #141413;
          border: 1px solid #141413;
          padding: 6px 9px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: background 0.1s ease;
        ">
          <span>📝</span>
          <span>COVER</span>
        </button>
      </div>

      <div id="tc-status-row" style="
        display: none;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: #141413;
        color: #D4FF00;
        font-family: inherit;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      ">
        <span id="tc-status-indicator" style="display: inline-block;">⚙️</span>
        <span id="tc-status-text">ANALYZING JOB...</span>
      </div>
    `;

    const btnPdf = floatingContainer.querySelector('#tc-btn-pdf');
    const btnResume = floatingContainer.querySelector('#tc-btn-resume');
    const btnCover = floatingContainer.querySelector('#tc-btn-cover');

    btnPdf.addEventListener('mouseenter', () => { btnPdf.style.background = '#bbee00'; });
    btnPdf.addEventListener('mouseleave', () => { btnPdf.style.background = '#D4FF00'; });

    btnResume.addEventListener('mouseenter', () => { btnResume.style.background = '#ded9cd'; });
    btnResume.addEventListener('mouseleave', () => { btnResume.style.background = '#EAE6DD'; });

    btnCover.addEventListener('mouseenter', () => { btnCover.style.background = '#f2efe9'; });
    btnCover.addEventListener('mouseleave', () => { btnCover.style.background = '#FFFFFF'; });

    btnPdf.addEventListener('mousedown', (e) => e.stopPropagation());
    btnResume.addEventListener('mousedown', (e) => e.stopPropagation());
    btnCover.addEventListener('mousedown', (e) => e.stopPropagation());

    btnPdf.addEventListener('click', (e) => {
      e.stopPropagation();
      executeGeneration('pdf', 'pdf');
    });

    btnResume.addEventListener('click', (e) => {
      e.stopPropagation();
      executeGeneration('resume', 'docx');
    });

    btnCover.addEventListener('click', (e) => {
      e.stopPropagation();
      executeGeneration('cover-letter', 'docx');
    });

    document.documentElement.appendChild(floatingContainer);
    return floatingContainer;
  }

  function showFloatingWidget(rect) {
    lastSelectionRect = rect;
    const widget = createFloatingContainer();
    const btnRow = widget.querySelector('#tc-button-row');
    const statusRow = widget.querySelector('#tc-status-row');

    btnRow.style.display = 'flex';
    statusRow.style.display = 'none';

    const widgetWidth = 280;
    const widgetHeight = 36;

    // Use pageXOffset/pageYOffset with fallback to scrollX/scrollY
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft || window.scrollX || 0;

    let top = rect.top + scrollY - widgetHeight - 12;
    if (top < scrollY + 8) {
      top = rect.bottom + scrollY + 10;
    }

    let left = rect.left + scrollX + (rect.width / 2) - (widgetWidth / 2);
    left = Math.max(10, Math.min(left, (window.innerWidth || 1000) + scrollX - widgetWidth - 15));

    widget.style.top = `${Math.round(top)}px`;
    widget.style.left = `${Math.round(left)}px`;
    widget.style.display = 'flex';

    requestAnimationFrame(() => {
      widget.style.opacity = '1';
      widget.style.transform = 'scale(1)';
    });
  }

  function hideFloatingWidget() {
    if (!floatingContainer || isGenerating) return;
    floatingContainer.style.opacity = '0';
    floatingContainer.style.transform = 'scale(0.96)';
    setTimeout(() => {
      if (floatingContainer && !isGenerating) {
        floatingContainer.style.display = 'none';
      }
    }, 120);
  }

  async function executeGeneration(type, format = 'docx') {
    if (isGenerating || !activeSelectionText) return;
    isGenerating = true;

    const widget = createFloatingContainer();
    const btnRow = widget.querySelector('#tc-button-row');
    const statusRow = widget.querySelector('#tc-status-row');
    const statusText = widget.querySelector('#tc-status-text');

    btnRow.style.display = 'none';
    statusRow.style.display = 'flex';
    statusRow.style.background = '#141413';
    statusRow.style.color = '#D4FF00';

    const steps = type === 'cover-letter' ? [
      '[01/04] ANALYZING JOB REQS...',
      '[02/04] MATCHING EXPERIENCE...',
      '[03/04] DRAFTING EDITORIAL LETTER...',
      '[04/04] COMPILING DOCX...'
    ] : (format === 'pdf' ? [
      '[01/04] ANALYZING JOB REQS...',
      '[02/04] ALIGNING ATS KEYWORDS...',
      '[03/04] NORMALIZING ACHIEVEMENTS...',
      '[04/04] TYPESETTING PDF...'
    ] : [
      '[01/04] ANALYZING JOB REQS...',
      '[02/04] ALIGNING ATS KEYWORDS...',
      '[03/04] NORMALIZING ACHIEVEMENTS...',
      '[04/04] COMPILING DOCX...'
    ]);

    let stepIdx = 0;
    statusText.textContent = steps[0];

    const timer = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      statusText.textContent = steps[stepIdx];
    }, 1700);

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'generate',
        type,
        format,
        jobDescription: activeSelectionText
      });

      clearInterval(timer);

      if (response && response.success) {
        statusRow.style.background = '#D4FF00';
        statusRow.style.color = '#141413';
        const docLabel = type === 'cover-letter' ? 'COVER LETTER' : (format === 'pdf' ? 'PDF RESUME' : 'DOCX RESUME');
        statusText.textContent = `✓ ${docLabel} DOWNLOADED!`;

        setTimeout(() => {
          isGenerating = false;
          hideFloatingWidget();
        }, 2200);
      } else {
        throw new Error(response?.error || 'Generation failed');
      }
    } catch (err) {
      clearInterval(timer);
      const isLoginError = err.message?.toLowerCase().includes('log in') || err.message?.toLowerCase().includes('login');
      
      statusRow.style.background = '#FF6B4A';
      statusRow.style.color = '#141413';
      statusText.textContent = isLoginError ? '⚠️ LOG IN VIA EXTENSION ICON' : '⚠️ GENERATION FAILED';

      setTimeout(() => {
        isGenerating = false;
        hideFloatingWidget();
      }, 3500);
    }
  }

  function checkSelection() {
    if (isGenerating) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      if (!isGenerating) {
        hideFloatingWidget();
        activeSelectionText = '';
      }
      return;
    }

    const text = selection.toString().trim();
    if (text.length >= 10) {
      activeSelectionText = text;
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect && (rect.width > 0 || rect.height > 0)) {
          showFloatingWidget(rect);
        }
      } catch (err) {
        console.warn('Could not compute range bounding rect:', err);
      }
    } else {
      hideFloatingWidget();
      activeSelectionText = '';
    }
  }

  // Handle selection triggering on mouseup and keyup (e.g. shift+arrow selection)
  document.addEventListener('mouseup', (e) => {
    if (floatingContainer && floatingContainer.contains(e.target)) return;
    setTimeout(checkSelection, 40);
  });

  document.addEventListener('keyup', (e) => {
    if (floatingContainer && floatingContainer.contains(e.target)) return;
    setTimeout(checkSelection, 40);
  });

  // Reposition floating widget on window scroll/resize if visible
  window.addEventListener('scroll', () => {
    if (floatingContainer && floatingContainer.style.display !== 'none' && lastSelectionRect && !isGenerating) {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          showFloatingWidget(rect);
        }
      }
    }
  }, { passive: true });

  document.addEventListener('mousedown', (e) => {
    if (floatingContainer && !floatingContainer.contains(e.target) && !isGenerating) {
      hideFloatingWidget();
    }
  });

})();


