from conftest import SKILL_DIR

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
