/**
 * PassVault Secure Clipboard Manager
 * Copies text and schedules automatic clipboard wipe after specified timeout (e.g. 30s)
 */

const ClipboardUtil = (function() {
  let wipeTimeout = null;

  async function copyToClipboard(text, label = 'Password', clearSeconds = 30) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-HTTPS or older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      Toast.show(`${label} copied to clipboard! Clearing in ${clearSeconds}s`, 'success');

      if (wipeTimeout) clearTimeout(wipeTimeout);

      wipeTimeout = setTimeout(async () => {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText('');
          }
          Toast.show(`Clipboard cleared for security.`, 'info');
        } catch (e) {
          // Clipboard clear ignored if window un-focused
        }
      }, clearSeconds * 1000);

      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      Toast.show('Failed to copy to clipboard', 'error');
      return false;
    }
  }

  return {
    copyToClipboard
  };
})();
