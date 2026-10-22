import sys

import yaml

from conftest import SKILL_DIR

sys.path.insert(0, str(SKILL_DIR.parent))
from dong_goi import referenced_files  # noqa: E402

REF = SKILL_DIR / "references"


def test_mau_tom_tat_has_three_templates():
    t = (REF / "mau-tom-tat.md").read_text()
    for h in ["Mẫu 1 – Cho lãnh đạo", "Mẫu 2 – Chi tiết", "Mẫu 3 – Hợp đồng/MOU", "Hàm ý cho KCN Long Thành"]:
        assert h in t
    for f in ["Các bên", "Diện tích", "Đơn giá", "Phí quản lý", "Thời hạn", "Thanh toán", "Phạt", "Chấm dứt", "Tranh chấp"]:
        assert f in t
    assert "(tr. " in t and "[CẦN KIỂM TRA]" in t and "nhận định của AI" in t


def test_chuyen_word_has_commands_and_naming():
    t = (REF / "chuyen-word.md").read_text()
    assert "scripts/pdf_to_docx.py" in t and "--check" in t and "_word.docx" in t and "[CẦN KIỂM TRA]" in t


def test_quy_tac_dich_rules():
    t = (REF / "quy-tac-dich.md").read_text()
    for s in ["thuat-ngu-kcn.md", "30 trang", "_vi.docx", "en", "zh", "ko", "ja", "song ngữ", "không quy đổi"]:
        assert s in t


def test_giong_van_is_exact_copy():
    assert (REF / "giong-van-szl.md").read_bytes() == (SKILL_DIR.parents[1] / "giong-van-szl.md").read_bytes()


def test_glossary_table():
    t = (REF / "thuat-ngu-kcn.md").read_text()
    assert "bản khởi tạo do AI soạn, cần Phòng KD-TH rà soát" in t
    rows = [l for l in t.splitlines() if l.startswith("|") and not set(l) <= set("|-: ")][1:]
    assert len(rows) >= 40
    for r in rows:
        cells = [c.strip() for c in r.strip("|").split("|")]
        assert len(cells) == 6 and all(cells[:5]), r
    vi = {r.split("|")[1].strip() for r in rows}
    assert {"Nhà xưởng xây sẵn", "Phí quản lý", "Tỷ lệ lấp đầy", "Thuê lại đất", "Hạ tầng kỹ thuật"} <= vi


def test_frontmatter():
    fm = yaml.safe_load((SKILL_DIR / "SKILL.md").read_text().split("---")[1])
    assert fm["name"] == "xu-ly-pdf-szl"
    for kw in ["tóm tắt", "Word", "dịch", "PDF"]:
        assert kw in fm["description"]
    assert len(fm["description"]) <= 1024


def test_skill_md_links_resolve():
    refs = referenced_files((SKILL_DIR / "SKILL.md").read_text())
    assert {"references/mau-tom-tat.md", "references/chuyen-word.md", "references/quy-tac-dich.md",
            "references/thuat-ngu-kcn.md", "references/giong-van-szl.md", "scripts/pdf_to_docx.py"} <= refs
    for r in refs:
        assert (SKILL_DIR / r).exists(), r


def test_skill_md_rules_and_errors():
    t = (SKILL_DIR / "SKILL.md").read_text()
    for s in ["[CẦN KIỂM TRA]", "(tr. ", "Cho lãnh đạo", "mật khẩu", "tách", "không bẻ khóa"]:
        assert s in t


def test_huong_dan_examples():
    t = (SKILL_DIR / "HUONG-DAN.md").read_text()
    assert t.count("> ") >= 3 and "[CẦN KIỂM TRA]" in t and "thuat-ngu-kcn.md" in t


def test_word_workflow_writable_output_and_mixed_scan():
    for t in [(REF / "chuyen-word.md").read_text(), (SKILL_DIR / "SKILL.md").read_text()]:
        assert "<thư mục ghi được>" in t and "scan_pages" in t
