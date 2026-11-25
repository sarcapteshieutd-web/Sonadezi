/* Lọc kết quả đã chốt của Web Speech trong chế độ Họp. */
(function (root) {
  'use strict';

  function shouldDropFinal(text, confidence, minConf, spaced) {
    const words = typeof text === 'string' ? text.trim() : '';
    if (!words) return true;
    if (!(confidence > 0 && confidence < minConf)) return false;
    return spaced ? words.split(/\s+/).length < 3 : [...words.replace(/\s/g, '')].length < 4;
  }

  const api = { shouldDropFinal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BrowserSTT = api;
})(typeof window !== 'undefined' ? window : globalThis);
