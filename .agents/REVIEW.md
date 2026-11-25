PHÁN QUYẾT: ĐẠT
Người viết: Codex/GPT-6 | Người rà soát: Claude Code/claude-opus-5-5 | Commit: f3f7292..f3f7292

# REVIEW – Mức 1: cải thiện bắt chữ khi họp một ngôn ngữ (Web Speech)

- Phạm vi rà soát: commit `f3f7292` (dòng cuối `Agent: Codex/GPT-6`), đối chiếu `.agents/PLAN.md` (`895321c`, Claude/claude-opus-5-5) và `.agents/SURVEY.md` (`d088e22`, Antigravity/Gemini 4 Neon).
- Người rà soát dùng Claude Code/claude-opus-5-5, khác công cụ và mô hình với tác giả mã (Codex/GPT-6).
- Quyết định của anh Hiếu (24/11/2026): chỉ làm Mức 1; đồng ý `minConfidence` 0.3 → 0 (áp dụng cả chế độ Hội thoại). Không làm Mức 2/3, không chạm Google Cloud STT.

## 1. Kết quả kiểm tra thực tế

| Việc | Lệnh | Kết quả |
|---|---|---|
| Kiểm tra tổng hợp | `node cong-cu/kiem-tra-dich.js` | `KIEM TRA TU DONG: DAT`; `Kiểm thử đơn vị: 72/72 đạt (7 tệp)`; `CACHE: translator-v87 → translator-v88`. Ba cảnh báo: `[TAILWIND]` (không thêm lớp mới, không cần build), `[CONFIG]` (chỉ đổi `minConfidence`, không có khóa), `[PHAM VI]` (chỉ `.agents/PLAN.md`, `.agents/SURVEY.md`, hợp lệ) |
| Kiểm thử đơn vị | `node --test translator/tests/*.test.js` | `tests 72, pass 72, fail 0` (mốc trước khi sửa: 67) |
| Kiểm thử đơn vị (dạng thư mục) | `node --test translator/tests/` | Lỗi `Cannot find module '...\translator\tests'` trên Node v24.14.1/Windows. Đây là giới hạn môi trường của cú pháp thư mục, không do commit gây ra; dùng dạng glob ở trên |
| Danh sách tệp | `git diff --name-only claude/realtime-translation-app-68o1ik...HEAD` | Đúng 7 tệp danh sách đóng (`HUONG-DAN.md`, `app.js`, `config.js`, `index.html`, `service-worker.js`, `stt-browser.js`, `tests/stt-browser.test.js`) cộng `.agents/PLAN.md`, `.agents/SURVEY.md`. Không chạm `stt-cloud.js`, `src/room.js`, `room.bundle.js`, `firebase/*`, CSS hay ứng dụng ở thư mục gốc |
| Bí mật, XSS | Rà diff tìm `AIza`, khóa, `innerHTML` | Không có. Văn bản nhận diện chỉ vào `micEvents` (hiện bằng `textContent`, `app.js:2189`) và `el.src.value` |

## 2. Đối chiếu trọng tâm

| Điểm | Kết luận | Bằng chứng |
|---|---|---|
| G1 – `minConfidence` = 0, `heard()` không bỏ câu final có chữ | Đạt | `config.js:16`; `app.js:957` mặc định 0; với `minConf = 0`, điều kiện `confidence > 0 && confidence < 0` luôn sai nên `shouldDropFinal` chỉ bỏ chuỗi rỗng |
| `shouldDropFinal` thuần, đủ biên | Đạt | `stt-browser.js:8–13`; kiểm thử phủ: tắt lọc, điểm 0/`undefined`, đúng ngưỡng, 1–2 từ so với 3 từ, khoảng trắng lạ (`\t`), CJK theo ký tự kể cả ký tự ngoài BMP (`𠮷`), chuỗi rỗng/toàn khoảng trắng/`null` |
| Cờ `sp` ko/zh/ja | Đạt | `app.js:7–14`: `zh`, `zht`, `ja`, `th` là `sp:false`; `ko` là `sp:true` (tiếng Hàn có dấu cách), nên kiểm thử `'안녕 하세요'` đếm theo từ là đúng |
| G2 – `drainSpeech` chốt trước khi nghỉ micro | Đạt | `app.js:1416–1420`: gỡ `onend`/`onresult`, `forceCommit()`, rồi `abort()`; không gọi trùng vì phiên đã gỡ trình nghe. Nhánh Hội nghị vẫn dùng `refreshSession()` như cũ |
| G3 – `setLangs` chốt trước khi đổi hướng | Đạt | `app.js:235–239`: `forceCommit()` chạy trước `resetUtt()` và trước khi gán `state.src/tgt` (`app.js:241–242`); bỏ qua khi `cloudActive` |
| G4 – `rec.onend` chốt phần dở | Đạt | `app.js:1098–1101`: gỡ `onresult` của phiên cũ rồi `forceCommit()`; `beginSession()` xóa `utt.forced` cho phiên mới như kế hoạch |
| Không chốt trùng, không gọi hai lần | Đạt | Mỗi điểm chốt đều gỡ `onresult` của phiên cũ trước khi chốt, nên final muộn không tới; `forceCommit()` gọi `resetUtt()` nên điểm chốt sau thấy `lastText` rỗng; `queueMeeting` còn khử lặp 4 giây |
| Không mở lại micro khi đang đọc (rủi ro app.js:1094 cũ) | Đạt, đã vá | `app.js:1110–1113`: hẹn giờ mở lại kiểm `rec === session && session.onend && wantListening && !state.speaking && !state.cloudActive`; `drainSpeech` gỡ `onend` nên hẹn giờ cũ tự hủy. `app.js:1095` bỏ qua `onend` của phiên cũ. `app.js:1430` chỉ mở lại khi `wantListening` (không mở lại khi micro đã dừng thử) |
| Không lặp micLog ở Hội thoại | Đạt | `app.js:1060`: chỉ ghi log khi `i >= ev.resultIndex`; với ngưỡng mặc định 0 thì không có câu bị bỏ |
| `stt-browser.js` trong `CORE`, `CACHE` v88, nạp trước `app.js` | Đạt | `service-worker.js:5,7`; `index.html:696`, trước `app.js` ở dòng 701 |
| Hội thoại khi `minConfidence` = 0 | Không đổi hành vi | `app.js:1055–1056`: `confidence > 0 && confidence < 0` luôn sai |

## 3. Lỗi và điểm lưu ý

Không có lỗi mức Cao hoặc Trung bình.

**Thấp**

1. `translator/app.js:1460` – đổi `if (interim && !gotFinal)` thành `if (interim)`. Việc này nằm ngoài các bước 1–4 của PLAN nhưng trong hàm `onMeetingResult` được phép sửa. Hệ quả tốt: phần tạm đi sau một câu đã chốt trong cùng sự kiện không còn bị bỏ. Hệ quả phụ khi bật **Tự đổi lượt** (`app.js:1468`): phần tạm này giờ được `setLangs()` chốt theo hướng CŨ thay vì bị bỏ. Nếu đó là lời của người kế tiếp (ngôn ngữ khác), sẽ có thêm một tin nhận diện sai ngôn ngữ. Không chặn phát hành; cần xem ở bước 4 và 7 của kịch bản thử.
2. `translator/app.js:1454` – khi câu final bị lọc, `resetUtt()` cũng xóa `utt.forced`. Chỉ xảy ra khi người dùng tự bật lại `minConfidence` > 0 và đặt `cutMs` > 0; hành vi giống `commitFinal()` vốn cũng gọi `resetUtt()`. Không cần sửa.
3. `node --test translator/tests/` (cú pháp thư mục trong `CLAUDE.md` mục 3) không chạy trên Node 24/Windows; `cong-cu/kiem-tra-dich.js` vẫn chạy đúng. Không thuộc phạm vi commit này.

**Chưa kiểm được:** phiên rà soát không có micro hay thiết bị thật, nên T1–T6 của PLAN chưa chạy. Phán quyết ĐẠT dựa trên đọc mã và kiểm thử đơn vị.

## 4. Kịch bản thử trên bản chạy thử

Chạy trên `localhost` hoặc trang Pages của nhánh thử. Nền tảng: máy tính (Chrome), Android (Chrome), iPhone (Safari). Chế độ Họp không bật "Họp song ngữ". Mở Cài đặt → Nhật ký nghe/đọc để đối chiếu.

**Máy tính (Chrome) và Android (Chrome)**

1. Tải lại PWA, mở DevTools → Application → Cache Storage → thấy `translator-v88` và có `stt-browser.js` → bản mới đã nạp → [ ] Đạt / [ ] Không đạt
2. Bắt đầu Họp vi→en, nói 5 câu dài cách micro 1–2 m → cả 5 câu vào khung chat, không câu nào hiện rồi biến mất; nhật ký không có dòng "bỏ câu độ tin cậy thấp" → [ ] Đạt / [ ] Không đạt
3. Bật đọc bản dịch; người thứ hai bắt đầu nói ngay khi câu trước vừa chốt → phần nghe được trước khi đọc thành một tin riêng; trong lúc đọc micro tạm nghỉ; đọc xong micro mở lại đúng một phiên (nhật ký có đúng một dòng "mở phiên nghe" sau "đọc xong hàng đợi") → [ ] Đạt / [ ] Không đạt
4. Nói dở câu rồi bấm ⇄ → phần dở thành tin theo hướng cũ; câu tiếp theo theo hướng mới; không lặp tin → [ ] Đạt / [ ] Không đạt
5. Nói liên tục hơn 60 giây → ở chỗ nhật ký ghi "phiên nghe kết thúc, tự mở lại", đoạn cuối phiên cũ vẫn thành tin, không mất và không lặp → [ ] Đạt / [ ] Không đạt
6. Họp ja→vi (ngôn ngữ viết liền), nói vài câu ngắn "はい", "そうです" → câu vào khung chat bình thường → [ ] Đạt / [ ] Không đạt
7. Bật Tự đổi lượt, hai người nói luân phiên vi/en, người sau nói chen ngay khi người trước dừng → không có tin rác sai ngôn ngữ đáng kể (ghi lại nếu có, liên quan điểm Thấp 1) → [ ] Đạt / [ ] Không đạt
8. Chế độ Hội thoại: bấm micro, nói một câu ngắn "Vâng" → câu được giữ và dịch như trước → [ ] Đạt / [ ] Không đạt
9. Trường hợp báo lỗi: từ chối quyền micro rồi bắt đầu Họp → hiện thông báo cấp quyền micro, cuộc họp giữ nguyên, có nút "Mở lại micro" → [ ] Đạt / [ ] Không đạt
10. Ngắt mạng giữa cuộc họp → báo mạng chập chờn, thử lại có giãn cách; sau 6 lần lỗi hiện "Micro bị ngắt. Bấm Mở lại micro"; khi đó app đọc xong bản dịch KHÔNG tự mở micro → [ ] Đạt / [ ] Không đạt
11. Tùy chọn: đặt `minConfidence: 0.3` trong `config.js`, tạo tạp âm ngắn → nhật ký có "bỏ câu độ tin cậy thấp: …"; câu dài từ 3 từ trở lên vẫn được giữ → [ ] Đạt / [ ] Không đạt

**iPhone (Safari)**

12. Lặp lại bước 2–4 → không lặp câu, không kẹt micro, không phát âm thanh trước khi chạm → [ ] Đạt / [ ] Không đạt
13. Chế độ Hội nghị: nói trong lúc app đọc bản dịch → đọc xong phiên nghe được làm mới, người nói tiếp theo vẫn được nhận → [ ] Đạt / [ ] Không đạt

Không đổi `firestore.rules`, `room.js` hay phòng họp, nên không cần thử hai thiết bị và không cần dán lại quy tắc Firestore.

## 5. Việc anh Hiếu tự làm

- Chạy kịch bản mục 4 trên thiết bị thật, nhất là bước 3, 4, 5, 7.
- Nếu đạt: tự đẩy nhánh, tạo và gộp Pull Request vào `claude/realtime-translation-app-68o1ik`.
- Gửi danh sách từ bị nghe sai thực tế để bổ sung `recognition.glossary` (G6) nếu cần.
