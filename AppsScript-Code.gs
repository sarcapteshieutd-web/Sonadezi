/*************************************************************
 * KCN LONG THÀNH — BACKEND GOOGLE SHEET
 * Công ty CP Sonadezi Long Thành (SZL) — Phòng KD-TH
 *
 * CÁCH DÙNG:
 *  1. Tạo Google Sheet mới, đặt tên tuỳ ý.
 *  2. Menu Tiện ích mở rộng (Extensions) > Apps Script.
 *  3. Xoá hết code mẫu, dán TOÀN BỘ file này vào.
 *  4. Bấm Lưu (💾).
 *  5. Chạy 1 lần hàm  taoSheet  (chọn hàm ở thanh trên > Chạy/Run).
 *     -> Cấp quyền khi Google hỏi. Sheet "DuLieu" sẽ được tạo với đủ cột.
 *  6. Bấm Triển khai (Deploy) > Tuỳ chọn triển khai mới (New deployment)
 *     - Loại: Ứng dụng web (Web app)
 *     - Thực thi với tư cách (Execute as): Tôi (Me)
 *     - Người có quyền truy cập (Who has access): Bất kỳ ai (Anyone)
 *     - Bấm Triển khai > SAO CHÉP ĐƯỜNG DẪN (URL kết thúc bằng /exec)
 *  7. Mở app > nút ⚙️ Sheet > dán URL đó vào > Lưu.
 *
 * LƯU Ý: mỗi lần sửa code phải Triển khai lại (chọn "Quản lý triển khai"
 * > sửa > Phiên bản mới) thì URL cũ mới cập nhật.
 *************************************************************/

var SHEET_NAME = 'DuLieu';

// Thứ tự cột — KHÔNG đổi thứ tự, chỉ thêm vào cuối nếu cần
var COLS = [
  'id',       // mã ô (không sửa)
  'ten',      // Tên công ty / lô
  'loai',     // dn | dat | nx
  'st',       // lease | avail | hold | (trống)
  'dt',       // Diện tích
  'nganh',    // Ngành nghề
  'gia',      // Giá thuê
  'hopdong',  // Thời hạn hợp đồng
  'lienhe',   // Người phụ trách
  'link',     // Link brochure (Google Drive)
  'ghichu',   // Ghi chú
  'cx',       // Toạ độ tâm X (%) — không sửa tay
  'cy',       // Toạ độ tâm Y (%) — không sửa tay
  'pts'       // Đường bao lô (JSON) — không sửa tay
];

var TIEUDE = [
  'Mã ô','Tên công ty / lô','Loại','Trạng thái','Diện tích','Ngành nghề',
  'Giá thuê','Thời hạn HĐ','Phụ trách','Link brochure','Ghi chú',
  'X (%)','Y (%)','Đường bao (JSON)'
];

/** Tạo sheet + tiêu đề + định dạng. Chạy 1 lần. */
function taoSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);

  sh.getRange(1, 1, 1, TIEUDE.length).setValues([TIEUDE])
    .setFontWeight('bold').setBackground('#0e7490').setFontColor('#ffffff')
    .setVerticalAlignment('middle');
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 70);
  sh.setColumnWidth(2, 220);
  sh.setColumnWidth(11, 240);
  // ẩn các cột kỹ thuật cho gọn
  sh.hideColumns(12, 3);

  // Danh sách chọn cho cột Loại và Trạng thái
  var last = Math.max(sh.getMaxRows(), 500);
  var dvLoai = SpreadsheetApp.newDataValidation()
    .requireValueInList(['dn', 'dat', 'nx'], true)
    .setHelpText('dn = Doanh nghiệp | dat = Lô đất | nx = Cụm nhà xưởng')
    .build();
  var dvSt = SpreadsheetApp.newDataValidation()
    .requireValueInList(['lease', 'avail', 'hold'], true)
    .setHelpText('lease = Đã cho thuê | avail = Còn trống | hold = Giữ chỗ')
    .build();
  sh.getRange(2, 3, last - 1, 1).setDataValidation(dvLoai);
  sh.getRange(2, 4, last - 1, 1).setDataValidation(dvSt);

  SpreadsheetApp.getUi().alert(
    'Đã tạo sheet "' + SHEET_NAME + '".\n\n' +
    'Bước tiếp theo: Triển khai (Deploy) > Ứng dụng web > ' +
    'Quyền truy cập: Bất kỳ ai > Sao chép URL /exec và dán vào app.');
}

/** APP ĐỌC DỮ LIỆU: GET .../exec */
function doGet(e) {
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sh) return _json({ ok: false, err: 'Chưa có sheet ' + SHEET_NAME });

    var n = sh.getLastRow();
    if (n < 2) return _json({ ok: true, cells: [] });

    var vals = sh.getRange(2, 1, n - 1, COLS.length).getValues();
    var out = [];
    for (var i = 0; i < vals.length; i++) {
      var r = vals[i];
      if (!r[0]) continue;                       // bỏ dòng trống
      var o = {};
      for (var j = 0; j < COLS.length; j++) o[COLS[j]] = r[j];
      o.cx = parseFloat(o.cx) || 0;
      o.cy = parseFloat(o.cy) || 0;
      try { o.pts = o.pts ? JSON.parse(o.pts) : null; } catch (err) { o.pts = null; }
      // ép mọi trường chữ về chuỗi
      ['ten','loai','st','dt','nganh','gia','hopdong','lienhe','link','ghichu'].forEach(function (k) {
        o[k] = (o[k] === null || o[k] === undefined) ? '' : String(o[k]).trim();
      });
      o.id = String(o.id).trim();
      out.push(o);
    }
    return _json({ ok: true, cells: out, n: out.length });
  } catch (err) {
    return _json({ ok: false, err: String(err) });
  }
}

/** APP ĐẨY DỮ LIỆU LÊN: POST .../exec  (body = JSON, Content-Type: text/plain) */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var cells = body.cells || [];
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.getRange(1,1,1,TIEUDE.length).setValues([TIEUDE]); }

    // ------- CHẾ ĐỘ AN TOÀN -------
    // Chỉ ghi đè TOẠ ĐỘ / ĐƯỜNG BAO và THÊM ô mới.
    // Không xoá và không đè lên thông tin đã nhập tay trên Sheet.
    var n = sh.getLastRow();
    var cur = n >= 2 ? sh.getRange(2, 1, n - 1, COLS.length).getValues() : [];
    var idx = {};
    for (var i = 0; i < cur.length; i++) if (cur[i][0]) idx[String(cur[i][0]).trim()] = i;

    var them = 0, capnhat = 0;
    var moi = [];
    cells.forEach(function (c) {
      var id = String(c.id).trim();
      var ptsStr = c.pts ? JSON.stringify(c.pts) : '';
      if (idx.hasOwnProperty(id)) {
        var r = idx[id];
        cur[r][11] = c.cx;         // cx
        cur[r][12] = c.cy;         // cy
        cur[r][13] = ptsStr;       // pts
        if (!cur[r][1] && c.ten) cur[r][1] = c.ten;   // chỉ điền tên nếu Sheet đang trống
        capnhat++;
      } else {
        var row = [];
        for (var j = 0; j < COLS.length; j++) {
          var k = COLS[j];
          if (k === 'pts') row.push(ptsStr);
          else if (k === 'cx') row.push(c.cx);
          else if (k === 'cy') row.push(c.cy);
          else row.push(c[k] === undefined || c[k] === null ? '' : c[k]);
        }
        moi.push(row);
        them++;
      }
    });

    if (cur.length) sh.getRange(2, 1, cur.length, COLS.length).setValues(cur);
    if (moi.length) sh.getRange(sh.getLastRow() + 1, 1, moi.length, COLS.length).setValues(moi);

    return _json({ ok: true, them: them, capnhat: capnhat });
  } catch (err) {
    return _json({ ok: false, err: String(err) });
  }
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
