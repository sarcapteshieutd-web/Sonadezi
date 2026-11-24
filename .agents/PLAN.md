# PLAN – Áp dụng quy trình A1–A5 và điều phối tự động cho app dịch Live

- Người lập: A1 – Claude/claude-opus-5-5
- Repo: `sarcapteshieutd-web/Sonadezi`; nhánh làm việc: `chore/agents-setup` (worktree Orca `Sonadezi/agents-setup`, đang ở ee6ea37). Nhánh phát hành / đích PR: `claude/realtime-translation-app-68o1ik` (GitHub Pages). KHÔNG PR vào `main`.
- Quyết định của anh Hiếu (24/11/2026): (1) GIỮ SONG SONG dây chuyền cũ `.claude/agents/*` + `/kehoach` `/tiep` `/ship` + `.bangiao/` làm phương án dự phòng; (2) làm tiếp trên nhánh `chore/agents-setup`, gộp chung một PR; (3) bật Branch protection cho nhánh phát hành SAU khi gộp (anh Hiếu tự làm bằng tài khoản sarcapteshieutd-web).
- Phương án điều phối: Phương án 3. Thứ tự: A2 (Antigravity) khảo sát TRƯỚC → A3 (Codex) viết → A4 không áp dụng → A5 (Claude Code) rà soát.

## 1. Mục tiêu
Đưa sang repo app dịch đúng bộ quy trình đã chạy ở repo Bản đồ KCN: 5 tệp vai trò `.agents/roles/A1.md`–`A5.md`, tệp điều phối `.agents/roles/DIEU-PHOI.md`, bổ sung AGENTS.md, và bổ sung danh sách lệnh cấm – nhưng thay toàn bộ quy tắc Apps Script/clasp bằng quy tắc của app dịch (Firebase, CACHE, `room.bundle.js`, `styles.css`, `node cong-cu/kiem-tra-dich.js`, nhánh phát hành).

## 2. Tệp bị ảnh hưởng (danh sách ĐÓNG)
| Tệp | Ai | Thao tác |
|---|---|---|
| `.agents/SURVEY.md` | A2 | Ghi đè |
| `.agents/roles/A1.md` … `A5.md` | A3 | Tạo mới |
| `.agents/roles/DIEU-PHOI.md` | A3 | Tạo mới |
| `AGENTS.md` | A3 | Chỉ THÊM mục mới `## 7. Vai trò agent và phương án điều phối` ở cuối tệp |
| `.claude/settings.json` | A3 | Chỉ THÊM mục vào `permissions.deny`; không xóa/sửa mục cũ, không đổi `allow` |
| `.agents/PLAN.md` | A3 | Chỉ mục 6 nếu có câu hỏi |
| `.agents/REVIEW.md` | A5 | Ghi đè |

KHÔNG ĐỔI: toàn bộ `translator/`, ứng dụng ở thư mục gốc, `CLAUDE.md`, `.claude/agents/*`, `.claude/commands/*`, `cong-cu/*`, `.gitignore`, `docs/`.

## 3. Nguồn mẫu (chỉ ĐỌC, không sửa repo khác)
- 5 tệp vai trò: `C:\SZL-Apps\SonadeziLongThanh\.agents\roles\A1.md` … `A5.md` (nhánh `main` của repo Bản đồ KCN).
- Tệp điều phối và khảo sát Orca: `git -C C:\SZL-Apps\SonadeziLongThanh show feat/dieu-phoi:.agents/roles/DIEU-PHOI.md` và `... show feat/dieu-phoi:.agents/SURVEY.md` (đã qua A5 – ĐẠT, commit 6cad969).

## 4. Các bước

### Bước A2 (Antigravity) – Khảo sát
Chỉ đọc; được chạy `node cong-cu/kiem-tra-dich.js`, `node --test translator/tests/`, `orca orchestration <lệnh con> --help`. Ghi `.agents/SURVEY.md`:
1. Quy tắc kỹ thuật app dịch mà tệp vai trò phải mang theo (kèm số dòng `CLAUDE.md`, `service-worker.js` danh sách CORE và biến CACHE, `cong-cu/kiem-tra-dich.js` kiểm tra những gì).
2. Đối chiếu dây chuyền cũ (`.claude/agents/planner|coder|tester|reviewer.md`, `.claude/commands/*`, `.bangiao/`) với A1/A3/A5: điểm trùng, điểm phải giữ (ví dụ kịch bản kiểm thử trên thiết bị của tester), nguy cơ xung đột khi hai cơ chế cùng tồn tại (`.agents/` và `.bangiao/`).
3. Lệnh deny còn thiếu trong `.claude/settings.json` so với quy tắc chung (git rebase, gh pr create vào main…) – chỉ đề xuất.
4. Khác biệt điều phối so với repo Bản đồ KCN: worktree yêu cầu phải tạo từ nhánh phát hành (không phải `main`), `--base-branch` cho worktree con của Antigravity, đích PR.
5. Mục "Ghi chú cho A3".
Commit riêng SURVEY.md, dòng cuối `Agent: Antigravity/<mô hình>`.

### Bước A3 (Codex) – Viết tệp
A3-1. Tạo `.agents/roles/A1.md`–`A5.md` theo đúng cấu trúc 4 phần của mẫu (tiêu đề, Nhiệm vụ, Đầu ra bàn giao, Quy tắc chung bắt buộc). Thay nội dung Apps Script bằng nội dung app dịch theo SURVEY.md, trong đó:
- A3: chạy `node cong-cu/kiem-tra-dich.js` trước khi bàn giao; tăng CACHE khi sửa tệp CORE; build lại `room.bundle.js` / `styles.css` khi cần; sửa `firestore.rules` thì bổ sung phép thử và ghi chú `docs/FIREBASE-SETUP.md`.
- A4: phạm vi `translator/index.html`, `styles.css`/`input.css`/`tailwind.config.js`, biểu tượng; kiểm tra máy tính, Android Chrome, iPhone Safari.
- A5: ngoài rà soát chéo, soạn kịch bản kiểm thử trên thiết bị (Thao tác → Kết quả mong đợi → [ ] Đạt/[ ] Không đạt) như tester cũ; kiểm tra XSS (`innerHTML`), quy tắc Firestore bị nới, khóa bị lộ, quên CACHE/bundle.
- Khối **Quy tắc chung bắt buộc** (giống hệt nhau ở 5 tệp): giữ các ý của mẫu nhưng thay: "không sửa thư mục chính `C:\SZL-Apps\Sonadezi`"; "KHÔNG push lên `main` hoặc nhánh phát hành `claude/realtime-translation-app-68o1ik`, KHÔNG tạo PR vào `main`"; "KHÔNG chạy `firebase deploy`/`npx firebase-tools deploy`"; bỏ mọi ý về clasp/xoaCache. Giữ: không gộp PR, không push/PR khi chưa được yêu cầu, dòng `Agent:`, không Co-Authored-By, không ghi bí mật, báo cáo tiếng Việt.
A3-2. Tạo `.agents/roles/DIEU-PHOI.md` từ mẫu DIEU-PHOI.md (bản 67b7bba/6cad969), giữ nguyên các lệnh `orca orchestration` đã xác minh, thay: nhánh gốc = `claude/realtime-translation-app-68o1ik`; Bước 0 kiểm tra nhánh hiện tại là `feat/…` hoặc `fix/…` tạo từ nhánh phát hành (không phải `main`, không phải chính nhánh phát hành); `--base-branch` cho worktree con lấy nhánh yêu cầu hiện tại; cổng dừng (b) thêm: thay đổi `firestore.rules`, dịch vụ tốn phí Google Cloud, hạn mức VIP; khối Quy tắc chung giống A1.md của repo này. Bổ sung luôn ghi nhận Thấp của A5 bên Bản đồ KCN: "Commit thiếu dòng `Agent:` thì dừng và báo anh Hiếu."
A3-3. Thêm vào CUỐI `AGENTS.md` mục `## 7. Vai trò agent và phương án điều phối`: bảng A1–A5 (công cụ, tệp vai trò); câu Phương án 3; câu mở phiên thủ công; câu điều phối tự động ("mở một phiên Codex trong worktree của yêu cầu và gõ: Đọc `.agents/roles/DIEU-PHOI.md` và AGENTS.md rồi điều phối việc sau: …"); câu "Worktree của yêu cầu tạo từ nhánh phát hành `claude/realtime-translation-app-68o1ik`, không tạo từ `main`"; câu "Dây chuyền cũ `/kehoach`, `/tiep`, `/ship` (chỉ dùng Claude) vẫn giữ làm phương án dự phòng."
A3-4. Thêm vào `permissions.deny` của `.claude/settings.json` các mục còn thiếu theo SURVEY mục 3, tối thiểu: `Bash(git rebase:*)`, `Bash(gh pr create --base main:*)`. JSON phải hợp lệ.
A3-5. Tự kiểm tra: `git diff --stat claude/realtime-translation-app-68o1ik...HEAD` chỉ gồm tệp ở mục 2 (cộng các tệp đã có từ commit aeb23e6/4d4c81f/ee6ea37); `node cong-cu/kiem-tra-dich.js` không phát sinh lỗi mới; khối Quy tắc chung giống hệt giữa A1–A5 và DIEU-PHOI.md. Commit riêng A3-1, A3-2, A3-3, A3-4, dòng cuối `Agent: Codex/<mô hình>`.

### Bước A4 – Không áp dụng.

### Bước A5 (Claude Code) – Rà soát
Đối chiếu mục 5; xác nhận không còn sót quy tắc Apps Script/clasp; lệnh `orca` khớp SURVEY của repo Bản đồ KCN; ghi REVIEW.md theo mẫu A5.md.

## 5. Tiêu chí nghiệm thu
1. SURVEY.md đủ 5 mục bước A2.
2. Đủ 5 tệp vai trò + DIEU-PHOI.md; khối Quy tắc chung giống hệt nhau ở 6 tệp; không còn chữ "clasp", "xoaCache", "Apps Script", "GAS".
3. A3.md có các nghĩa vụ CACHE / bundle / styles / firestore.rules / kiem-tra-dich.js; A5.md có kịch bản kiểm thử trên thiết bị và các mục rủi ro riêng của app dịch.
4. DIEU-PHOI.md dùng nhánh phát hành làm gốc, chặn chạy trên `main` và nhánh phát hành, có cổng dừng cho `firestore.rules`/dịch vụ tốn phí, có quy tắc chọn A5 khác mọi tác giả, có quy tắc thiếu dòng `Agent:`.
5. AGENTS.md chỉ thêm mục 7; `.claude/settings.json` chỉ thêm deny, JSON hợp lệ; dây chuyền cũ không bị sửa.
6. Mọi commit có dòng `Agent:`, không Co-Authored-By; không push nhánh phát hành / main.

## 6. Câu hỏi còn bỏ ngỏ
(A2/A3 ghi vào đây nếu có; nếu trống thì thực hiện.)
