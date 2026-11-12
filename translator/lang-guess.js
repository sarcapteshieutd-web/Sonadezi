/* Đoán ngôn ngữ của văn bản gõ và ước lượng hạn mức dịch miễn phí: hàm thuần, không phụ thuộc trình duyệt (kiểm thử bằng node --test) */
(function (root) {
  'use strict';
  // Chữ có dấu chỉ tiếng Việt dùng (ă â đ ê ô ơ ư và các dấu thanh trên nguyên âm)
  const VI_RE = /[ăâđêôơưĂÂĐÊÔƠƯàảãáạằẳẵắặầẩẫấậèẻẽéẹềểễếệìỉĩíịòỏõóọồổỗốộờởỡớợùủũúụừửữứựỳỷỹýỵ]/i;
  const EN_WORDS = new Set(('the a an is are was were be been am i you we they he she it this that these those and or but not no yes of to in on at for with from by as ' +
    'do does did have has had will would can could should may might must what when where which who how why please thank thanks hello hi ' +
    'our your their my me us them there here about price rent lease factory land area contract').split(' '));
  const count = (text, re) => (text.match(re) || []).length;

  // Trả về nhóm chữ viết/ngôn ngữ đoán được, hoặc '' nếu không đủ chắc chắn
  function guessLang(text) {
    const t = String(text || '').trim();
    if (!t) return '';
    const kana = count(t, /[぀-ヿ]/g), han = count(t, /[一-鿿]/g), hangul = count(t, /[가-힯]/g);
    const thai = count(t, /[฀-๿]/g), cyr = count(t, /[Ѐ-ӿ]/g), arab = count(t, /[؀-ۿ]/g), deva = count(t, /[ऀ-ॿ]/g);
    const letters = count(t, /\p{L}/gu);
    if (!letters) return '';
    if (kana >= 1) return 'ja';
    if (hangul * 2 >= letters) return 'ko';
    if (han * 2 >= letters) return 'han';
    if (thai * 2 >= letters) return 'th';
    if (cyr * 2 >= letters) return 'ru';
    if (arab * 2 >= letters) return 'ar';
    if (deva * 2 >= letters) return 'hi';
    if (VI_RE.test(t)) return 'vi';
    // Chữ Latin không dấu: chỉ nhận là tiếng Anh khi có ít nhất 2 từ tiếng Anh thông dụng (tránh nhầm tiếng Việt gõ không dấu)
    const words = t.toLowerCase().match(/[a-z']+/g) || [];
    const hits = words.filter(w => EN_WORDS.has(w)).length;
    if (words.length >= 2 && hits >= 2 && hits * 4 >= words.length) return 'en';
    return '';
  }
  // Nhóm đoán được có khớp với mã ngôn ngữ của ứng dụng không
  function matches(lang, cls) {
    if (!cls) return false;
    if (lang === 'zh' || lang === 'zht') return cls === 'han';
    if (lang === 'ja') return cls === 'ja' || cls === 'han';
    return lang === cls;
  }
  // Văn bản gõ rõ ràng thuộc ngôn ngữ ĐÍCH chứ không phải ngôn ngữ NGUỒN: nên đảo chiều dịch
  function shouldSwap(text, src, tgt) {
    if (String(text || '').trim().length < 6) return false; // quá ngắn: dễ đoán sai
    const cls = guessLang(text);
    return matches(tgt, cls) && !matches(src, cls);
  }
  // Mức dùng dịch miễn phí trong ngày (ước tính trên thiết bị): 'ok' | 'warn' (từ 80%) | 'over'
  function quotaLevel(used, limit) {
    if (!(limit > 0)) return 'ok';
    if (used >= limit) return 'over';
    return used >= limit * 0.8 ? 'warn' : 'ok';
  }

  const api = { guessLang, matches, shouldSwap, quotaLevel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.LangGuess = api;
})(typeof window !== 'undefined' ? window : globalThis);
