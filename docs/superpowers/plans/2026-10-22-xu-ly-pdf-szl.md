# Skill "Xử lý PDF SZL" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây skill Claude Team/Cowork giúp Phòng KD-TH tóm tắt PDF, chuyển PDF sang Word và dịch tài liệu theo mẫu chuẩn SZL, đóng gói `.zip` để quản trị viên tải lên.

**Architecture:** Skill là thư mục `skills/xu-ly-pdf-szl/` gồm `SKILL.md` (điều phối), các tệp `references/*.md` (mẫu, quy tắc, thuật ngữ, giọng văn) và một tập lệnh Python `scripts/pdf_to_docx.py` (chuyển Word, có nhánh dự phòng). Kiểm thử tự động bằng pytest cho tập lệnh, cấu trúc skill và gói nén; chất lượng nội dung được nghiệm thu thủ công theo phiếu đánh giá.

**Tech Stack:** Python 3.10+, `pdfplumber`, `python-docx`, `pypdf`, `pdf2docx` (tùy chọn), `reportlab` (chỉ để tạo PDF mẫu trong kiểm thử), `pyyaml`, `pytest`.

**Spec:** `docs/superpowers/specs/2026-10-22-xu-ly-pdf-szl-design.md`

## Global Constraints

- Toàn bộ nội dung người dùng đọc (SKILL.md, references, hướng dẫn, thông báo lỗi của tập lệnh) viết bằng tiếng Việt, văn phong hành chính.
- Dấu đánh dấu chỗ không chắc chắn dùng đúng chuỗi: `[CẦN KIỂM TRA]`.
- Trang nguồn trong tóm tắt ghi đúng dạng: `(tr. 12)`.
- Tên tệp đầu ra: `<tên-gốc>_word.docx` (chuyển Word); `<tên-gốc>_<mã>.docx` với mã ∈ {vi, en, zh, ko, ja} (dịch).
- Mẫu tóm tắt mặc định: "Cho lãnh đạo", tối đa 1 trang.
- Ngưỡng tài liệu dài khi dịch: khoảng 30 trang → dịch theo từng phần.
- `pdf2docx` là tùy chọn; thiếu thì tập lệnh tự chạy nhánh dự phòng `pdfplumber` + `python-docx`, không báo lỗi.
- Không bẻ khóa PDF có mật khẩu.
- Gói nén: `skills/xu-ly-pdf-szl.zip`, thư mục `xu-ly-pdf-szl/` nằm ở gốc tệp nén.
- Bảng thuật ngữ ghi rõ "bản khởi tạo do AI soạn, cần Phòng KD-TH rà soát".

## Review Focus

1. **PDF có mật khẩu** → tập lệnh thoát mã 2, in thông báo tiếng Việt đề nghị gỡ mật khẩu, không tạo tệp .docx (test ở Task 1).
2. **PDF scan không có lớp chữ** → `has_text_layer` trả `False`, CLI in `"is_scan": true` để Claude chuyển sang đọc ảnh (test ở Task 1).
3. **Tiếng Việt có dấu** qua nhánh dự phòng → chữ "Khu công nghiệp Long Thành" giữ nguyên dấu trong .docx (test ở Task 1).
4. **Đường dẫn không tồn tại hoặc tệp không phải PDF** → thoát mã 1, thông báo tiếng Việt, không traceback (test ở Task 1).
5. **SKILL.md nhắc tới tệp tham chiếu không có trong gói** → kiểm thử cấu trúc phát hiện liên kết gãy trước khi đóng gói (test ở Task 2 và Task 5).

---

## File Structure

| Tệp | Trách nhiệm |
|---|---|
| `skills/xu-ly-pdf-szl/scripts/pdf_to_docx.py` | Phát hiện lớp chữ; chuyển PDF dạng chữ sang .docx; CLI in JSON kết quả |
| `skills/xu-ly-pdf-szl/references/mau-tom-tat.md` | Ba mẫu tóm tắt + mục "Hàm ý cho KCN Long Thành" |
| `skills/xu-ly-pdf-szl/references/chuyen-word.md` | Quy trình chuyển Word (dạng chữ, scan, kiểm tra, giao tệp) |
| `skills/xu-ly-pdf-szl/references/quy-tac-dich.md` | Quy tắc dịch |
| `skills/xu-ly-pdf-szl/references/thuat-ngu-kcn.md` | Bảng thuật ngữ 5 ngôn ngữ |
| `skills/xu-ly-pdf-szl/references/giong-van-szl.md` | Bản sao `giong-van-szl.md` ở gốc kho mã |
| `skills/xu-ly-pdf-szl/SKILL.md` | Frontmatter kích hoạt; quy tắc chung; điều phối ba chức năng; xử lý lỗi |
| `skills/xu-ly-pdf-szl/HUONG-DAN.md` | Hướng dẫn sử dụng 1 trang |
| `skills/dong_goi.py` | Kiểm tra cấu trúc rồi tạo `skills/xu-ly-pdf-szl.zip` |
| `skills/PHIEU-DANH-GIA.md` | Phiếu nghiệm thu thủ công |
| `skills/tests/conftest.py` | Fixture tạo PDF mẫu (chữ tiếng Việt, có bảng, scan, có mật khẩu) |
| `skills/tests/test_pdf_to_docx.py` | Kiểm thử tập lệnh |
| `skills/tests/test_skill_structure.py` | Kiểm thử cấu trúc skill và nội dung bắt buộc |
| `skills/tests/test_dong_goi.py` | Kiểm thử gói nén |
| `skills/requirements-dev.txt` | `pdfplumber`, `python-docx`, `pypdf`, `reportlab`, `pyyaml`, `pytest` |

---

### Task 1: Tập lệnh chuyển PDF sang Word

**Files:**
- Create: `skills/xu-ly-pdf-szl/scripts/pdf_to_docx.py`
- Create: `skills/tests/conftest.py`, `skills/tests/test_pdf_to_docx.py`, `skills/requirements-dev.txt`

**Interfaces:**
- Produces:
  - `class PdfPasswordError(Exception)`
  - `has_text_layer(pdf_path: str, min_chars_per_page: int = 20) -> bool` — trung bình số ký tự trích được mỗi trang ≥ ngưỡng.
  - `convert(pdf_path: str, out_path: str, force_fallback: bool = False) -> dict` — trả `{"method": "pdf2docx" | "fallback", "pages": int, "tables": int, "out_path": str}`; ném `PdfPasswordError` khi PDF mã hóa; ném `ValueError` khi tệp không phải PDF.
  - CLI: `python pdf_to_docx.py <vao.pdf> [<ra.docx>] [--fallback] [--check]`. Mặc định đầu ra là `<tên-gốc>_word.docx` cạnh tệp vào. `--check` chỉ in `{"is_scan": bool, "pages": int}`. Thành công in JSON của `convert` cộng `"is_scan"`, mã thoát 0; lỗi tệp/không phải PDF mã 1; mật khẩu mã 2. Lỗi in tiếng Việt ra stderr, không traceback.

- [ ] **Step 1: Cài phụ thuộc kiểm thử**

Ghi `skills/requirements-dev.txt` (6 gói ở bảng File Structure). Run: `pip install -r skills/requirements-dev.txt` — Expected: cài xong không lỗi.

- [ ] **Step 2: Viết fixture trong `conftest.py`**

Dùng `reportlab` + font `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf` (đăng ký TTF để có dấu tiếng Việt). Fixture (`tmp_path`):
- `pdf_chu` — 2 trang; trang 1 có dòng "Khu công nghiệp Long Thành" và đoạn văn ≥ 200 ký tự; trang 2 có bảng 3×3 (`reportlab.platypus.Table` có đường kẻ) với ô "Diện tích", "Giá thuê", "12.500 m²".
- `pdf_scan` — 1 trang chỉ có hình chữ nhật vẽ (không chữ).
- `pdf_mat_khau` — `pdf_chu` mã hóa bằng `pypdf.PdfWriter.encrypt("szl")`.
- `tep_khong_phai_pdf` — tệp `.pdf` chứa văn bản thường "khong phai pdf".

- [ ] **Step 3: Viết test (fail)**

```python
def test_has_text_layer_true_for_text_pdf(pdf_chu): assert has_text_layer(pdf_chu) is True
def test_has_text_layer_false_for_scan(pdf_scan): assert has_text_layer(pdf_scan) is False
def test_fallback_keeps_vietnamese(pdf_chu, tmp_path):
    r = convert(pdf_chu, str(tmp_path/"o.docx"), force_fallback=True)
    assert r["method"] == "fallback" and r["pages"] == 2 and r["tables"] >= 1
    text = "\n".join(p.text for p in docx.Document(r["out_path"]).paragraphs)
    assert "Khu công nghiệp Long Thành" in text
def test_fallback_table_cells(pdf_chu, tmp_path):
    d = docx.Document(convert(pdf_chu, str(tmp_path/"o.docx"), force_fallback=True)["out_path"])
    cells = {c.text.strip() for t in d.tables for row in t.rows for c in row.cells}
    assert {"Diện tích", "12.500 m²"} <= cells
def test_pdf2docx_branch(pdf_chu, tmp_path):
    pytest.importorskip("pdf2docx")
    assert convert(pdf_chu, str(tmp_path/"o.docx"))["method"] == "pdf2docx"
def test_auto_fallback_when_pdf2docx_missing(pdf_chu, tmp_path, monkeypatch):
    monkeypatch.setitem(sys.modules, "pdf2docx", None)
    assert convert(pdf_chu, str(tmp_path/"o.docx"))["method"] == "fallback"
def test_password_raises(pdf_mat_khau, tmp_path):
    with pytest.raises(PdfPasswordError): convert(pdf_mat_khau, str(tmp_path/"o.docx"))
def test_cli_default_output_name(pdf_chu):  # subprocess, returncode 0, tệp <tên>_word.docx tồn tại, JSON có "is_scan": false
def test_cli_check_scan(pdf_scan):          # --check → JSON {"is_scan": true, "pages": 1}
def test_cli_password_exit_2(pdf_mat_khau): # returncode 2, "mật khẩu" in stderr, "Traceback" not in stderr, không tạo .docx
def test_cli_missing_file_exit_1(tmp_path): # đường dẫn không tồn tại → returncode 1, "Traceback" not in stderr
def test_cli_not_pdf_exit_1(tep_khong_phai_pdf)  # returncode 1, "không phải PDF" in stderr
```

Run: `pytest skills/tests/test_pdf_to_docx.py -v` — Expected: FAIL (module chưa có).

- [ ] **Step 4: Cài đặt `pdf_to_docx.py`**

Nhập `pdf2docx` bên trong `convert` (để monkeypatch `sys.modules[...] = None` gây `ImportError`). Kiểm tra mã hóa bằng `pypdf.PdfReader(...).is_encrypted` trước mọi xử lý; nhận diện "không phải PDF" khi 5 byte đầu khác `%PDF-`. Nhánh dự phòng: duyệt từng trang `pdfplumber`, `page.extract_tables()` → bảng `python-docx` (style "Table Grid"); chữ ngoài vùng bảng (`page.filter` loại bbox bảng) → đoạn văn theo dòng; thêm ngắt trang giữa các trang PDF. `tables` = tổng số bảng đã ghi.

- [ ] **Step 5: Chạy test**

Run: `pytest skills/tests/test_pdf_to_docx.py -v` — Expected: tất cả PASS (`test_pdf2docx_branch` SKIPPED nếu môi trường không có `pdf2docx`).

- [ ] **Step 6: Commit**

```bash
git add skills/requirements-dev.txt skills/tests/conftest.py skills/tests/test_pdf_to_docx.py skills/xu-ly-pdf-szl/scripts/pdf_to_docx.py
git commit -m "Thêm tập lệnh chuyển PDF sang Word có nhánh dự phòng và kiểm thử"
```

---

### Task 2: Tệp tham chiếu mẫu, quy trình, quy tắc, giọng văn

**Files:**
- Create: `skills/xu-ly-pdf-szl/references/mau-tom-tat.md`, `chuyen-word.md`, `quy-tac-dich.md`, `giong-van-szl.md`
- Create: `skills/tests/test_skill_structure.py`

**Interfaces:**
- Consumes: CLI của Task 1 (`chuyen-word.md` dẫn đúng lệnh `python scripts/pdf_to_docx.py <vao.pdf> --check` và `python scripts/pdf_to_docx.py <vao.pdf>`).
- Produces: `SKILL_DIR = Path(__file__).parents[1] / "xu-ly-pdf-szl"` trong `test_skill_structure.py`; Task 3, 4 thêm test vào tệp này.

- [ ] **Step 1: Viết test (fail)**

```python
REF = SKILL_DIR / "references"
def test_mau_tom_tat_has_three_templates():
    t = (REF/"mau-tom-tat.md").read_text()
    for h in ["Mẫu 1 – Cho lãnh đạo", "Mẫu 2 – Chi tiết", "Mẫu 3 – Hợp đồng/MOU", "Hàm ý cho KCN Long Thành"]: assert h in t
    for f in ["Các bên", "Diện tích", "Đơn giá", "Phí quản lý", "Thời hạn", "Thanh toán", "Phạt", "Chấm dứt", "Tranh chấp"]: assert f in t
    assert "(tr. " in t and "[CẦN KIỂM TRA]" in t and "nhận định của AI" in t
def test_chuyen_word_has_commands_and_naming():
    t = (REF/"chuyen-word.md").read_text()
    assert "scripts/pdf_to_docx.py" in t and "--check" in t and "_word.docx" in t and "[CẦN KIỂM TRA]" in t
def test_quy_tac_dich_rules():
    t = (REF/"quy-tac-dich.md").read_text()
    for s in ["thuat-ngu-kcn.md", "30 trang", "_vi.docx", "en", "zh", "ko", "ja", "song ngữ", "không quy đổi"]: assert s in t
def test_giong_van_is_exact_copy():
    assert (REF/"giong-van-szl.md").read_bytes() == (SKILL_DIR.parents[1]/"giong-van-szl.md").read_bytes()
```

Run: `pytest skills/tests/test_skill_structure.py -v` — Expected: FAIL (tệp chưa có).

- [ ] **Step 2: Viết bốn tệp tham chiếu**

Nội dung lấy nguyên từ spec mục 5, 6.1, 6.2, 6.3, 7: mỗi mẫu tóm tắt là một khung Markdown điền sẵn tiêu đề mục (Mẫu 1 đúng thứ tự: Tài liệu gì/ai ban hành/ngày → 5 ý chính → Số liệu quan trọng → Đề xuất/việc cần làm cho SZL → Điểm cần lưu ý). `giong-van-szl.md`: `cp giong-van-szl.md skills/xu-ly-pdf-szl/references/`.

- [ ] **Step 3: Chạy test** — Run: `pytest skills/tests/test_skill_structure.py -v` — Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add skills/xu-ly-pdf-szl/references skills/tests/test_skill_structure.py
git commit -m "Thêm mẫu tóm tắt, quy trình chuyển Word, quy tắc dịch và giọng văn SZL"
```

---

### Task 3: Bảng thuật ngữ BĐS KCN năm ngôn ngữ

**Files:**
- Create: `skills/xu-ly-pdf-szl/references/thuat-ngu-kcn.md`
- Modify: `skills/tests/test_skill_structure.py`

**Interfaces:**
- Produces: bảng Markdown cột đúng thứ tự `| Tiếng Việt | English | 中文 | 한국어 | 日本語 | Ghi chú |`.

- [ ] **Step 1: Viết test (fail)**

```python
def test_glossary_table():
    t = (REF/"thuat-ngu-kcn.md").read_text()
    assert "bản khởi tạo do AI soạn, cần Phòng KD-TH rà soát" in t
    rows = [l for l in t.splitlines() if l.startswith("|") and not set(l) <= set("|-: ")][1:]
    assert len(rows) >= 40
    for r in rows:
        cells = [c.strip() for c in r.strip("|").split("|")]
        assert len(cells) == 6 and all(cells[:5]), r
    vi = {r.split("|")[1].strip() for r in rows}
    assert {"Nhà xưởng xây sẵn", "Phí quản lý", "Tỷ lệ lấp đầy", "Thuê lại đất", "Hạ tầng kỹ thuật"} <= vi
```

Run — Expected: FAIL.

- [ ] **Step 2: Soạn bảng ≥ 40 thuật ngữ**

Nhóm: loại hình (KCN, lô đất, nhà xưởng xây sẵn RBF, kho xây sẵn RBW, nhà xưởng xây theo yêu cầu BTS), hợp đồng (thuê lại đất, hợp đồng nguyên tắc, MOU, đặt cọc, thời hạn thuê, gia hạn), chi phí (đơn giá thuê, phí quản lý, phí xử lý nước thải, phí sử dụng hạ tầng), hạ tầng (hạ tầng kỹ thuật, trạm biến áp, nhà máy xử lý nước thải, PCCC), thủ tục (giấy chứng nhận đầu tư IRC, ĐKDN ERC, ĐTM/EIA, giấy phép xây dựng), thị trường (tỷ lệ lấp đầy, nguồn cung, giá chào thuê, FDI). Thuật ngữ AI không chắc ở ngôn ngữ nào thì vẫn điền và ghi `[CẦN KIỂM TRA]` ở cột Ghi chú.

- [ ] **Step 3: Chạy test** — Expected: PASS.

- [ ] **Step 4: Commit** — `git commit -m "Thêm bảng thuật ngữ BĐS KCN Việt–Anh–Trung–Hàn–Nhật"`

---

### Task 4: SKILL.md và hướng dẫn sử dụng

**Files:**
- Create: `skills/xu-ly-pdf-szl/SKILL.md`, `skills/xu-ly-pdf-szl/HUONG-DAN.md`
- Modify: `skills/tests/test_skill_structure.py`

**Interfaces:**
- Consumes: tên tệp references (Task 2, 3); CLI (Task 1).
- Produces: `referenced_files(skill_md_text: str) -> set[str]` trong test — mọi chuỗi khớp `(references|scripts)/[\w.-]+` trong SKILL.md; Task 5 dùng lại.

- [ ] **Step 1: Viết test (fail)**

```python
def test_frontmatter():
    fm = yaml.safe_load((SKILL_DIR/"SKILL.md").read_text().split("---")[1])
    assert fm["name"] == "xu-ly-pdf-szl"
    for kw in ["tóm tắt", "Word", "dịch", "PDF"]: assert kw in fm["description"]
    assert len(fm["description"]) <= 1024
def test_skill_md_links_resolve():
    refs = referenced_files((SKILL_DIR/"SKILL.md").read_text())
    assert {"references/mau-tom-tat.md", "references/chuyen-word.md", "references/quy-tac-dich.md",
            "references/thuat-ngu-kcn.md", "references/giong-van-szl.md", "scripts/pdf_to_docx.py"} <= refs
    for r in refs: assert (SKILL_DIR/r).exists(), r
def test_skill_md_rules_and_errors():
    t = (SKILL_DIR/"SKILL.md").read_text()
    for s in ["[CẦN KIỂM TRA]", "(tr. ", "Cho lãnh đạo", "mật khẩu", "tách", "không bẻ khóa"]: assert s in t
def test_huong_dan_examples():
    t = (SKILL_DIR/"HUONG-DAN.md").read_text()
    assert t.count("> ") >= 3 and "[CẦN KIỂM TRA]" in t and "thuat-ngu-kcn.md" in t
```

Run — Expected: FAIL.

- [ ] **Step 2: Viết SKILL.md**

Frontmatter `name`, `description` (spec mục 4, các cách nói kích hoạt). Thân: quy tắc chung (spec mục 5, 6 điều) → chọn chức năng theo yêu cầu → mỗi chức năng một mục ngắn trỏ tới tệp tham chiếu tương ứng → bảng xử lý lỗi (spec mục 7, 5 dòng). Giữ SKILL.md dưới 200 dòng; chi tiết nằm ở references.

- [ ] **Step 3: Viết HUONG-DAN.md**

Một trang: 3 câu lệnh mẫu dạng trích dẫn `> ` (mỗi chức năng một câu), cách đọc `[CẦN KIỂM TRA]`, cách đề xuất bổ sung thuật ngữ vào `thuat-ngu-kcn.md`.

- [ ] **Step 4: Chạy test** — Run: `pytest skills/tests -v` — Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "Thêm SKILL.md điều phối ba chức năng và hướng dẫn sử dụng"`

---

### Task 5: Đóng gói và phiếu nghiệm thu

**Files:**
- Create: `skills/dong_goi.py`, `skills/tests/test_dong_goi.py`, `skills/PHIEU-DANH-GIA.md`
- Modify: `.gitignore` (bỏ qua `skills/xu-ly-pdf-szl.zip`, `__pycache__/`, `.pytest_cache/`)

**Interfaces:**
- Consumes: `referenced_files` (Task 4).
- Produces: `build_zip(skill_dir: Path, out_zip: Path) -> list[str]` — kiểm tra mọi tệp SKILL.md nhắc tới đều tồn tại (thiếu → `FileNotFoundError` nêu tên tệp), bỏ `__pycache__`/`*.pyc`, trả danh sách tên trong zip. CLI: `python skills/dong_goi.py` → tạo `skills/xu-ly-pdf-szl.zip`, in số tệp.

- [ ] **Step 1: Viết test (fail)**

```python
def test_zip_layout(tmp_path):
    names = build_zip(SKILL_DIR, tmp_path/"s.zip")
    assert "xu-ly-pdf-szl/SKILL.md" in names and "xu-ly-pdf-szl/scripts/pdf_to_docx.py" in names
    assert all(n.startswith("xu-ly-pdf-szl/") for n in names)
    assert not any("__pycache__" in n or n.endswith(".pyc") for n in names)
def test_zip_rejects_broken_link(tmp_path):
    bad = tmp_path/"xu-ly-pdf-szl"; shutil.copytree(SKILL_DIR, bad); (bad/"references/quy-tac-dich.md").unlink()
    with pytest.raises(FileNotFoundError, match="quy-tac-dich.md"): build_zip(bad, tmp_path/"s.zip")
```

Run — Expected: FAIL.

- [ ] **Step 2: Cài đặt `dong_goi.py`** (dùng `zipfile`, `ZIP_DEFLATED`).

- [ ] **Step 3: Viết `PHIEU-DANH-GIA.md`**

Bảng 8 tài liệu mẫu (spec mục 8.1) × 3 chức năng, cột Đạt / Cần sửa / Không đạt / Ghi chú; tiêu chí chấm nguyên văn spec mục 8.3; dòng tổng kết với ngưỡng "≥ 80% Đạt, không có lỗi sai số liệu trong tóm tắt"; mục ghi kết quả kiểm chứng 4 điểm chưa chắc chắn ở spec mục 10.

- [ ] **Step 4: Chạy toàn bộ test và đóng gói**

Run: `pytest skills/tests -v && python skills/dong_goi.py` — Expected: tất cả PASS; in số tệp; `skills/xu-ly-pdf-szl.zip` tồn tại.

- [ ] **Step 5: Commit và đẩy**

```bash
git add skills/dong_goi.py skills/tests/test_dong_goi.py skills/PHIEU-DANH-GIA.md .gitignore
git commit -m "Thêm công cụ đóng gói skill và phiếu nghiệm thu"
git push -u origin claude/xu-ly-pdf-skill
```

---

### Task 6 (thủ công, Phòng KD-TH thực hiện): Thử nghiệm trong Claude Team/Cowork

- [ ] Quản trị viên tải `skills/xu-ly-pdf-szl.zip` lên mục quản lý Skills của tổ chức.
- [ ] Chạy 8 tài liệu mẫu × 3 chức năng; 2–3 người chấm theo `skills/PHIEU-DANH-GIA.md`.
- [ ] Ghi kết quả 4 điểm chưa chắc chắn (có `pdf2docx` không, chất lượng bản scan, giới hạn tải tệp, rà soát thuật ngữ).
- [ ] Gửi phiếu đã chấm để điều chỉnh mẫu/quy tắc; nghiệm thu khi đạt ngưỡng.
