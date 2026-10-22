"""Fixture tạo PDF mẫu cho kiểm thử skill Xử lý PDF SZL."""
import sys
from pathlib import Path

import pytest
from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Table, TableStyle

SKILL_DIR = Path(__file__).resolve().parents[1] / "xu-ly-pdf-szl"
sys.path.insert(0, str(SKILL_DIR / "scripts"))

FONT = "DejaVuSans"
pdfmetrics.registerFont(TTFont(FONT, "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))


@pytest.fixture
def pdf_chu(tmp_path):
    path = tmp_path / "bao-cao.pdf"
    style = ParagraphStyle("vn", fontName=FONT, fontSize=11, leading=15)
    doan = ("Báo cáo tình hình cho thuê nhà xưởng và đất công nghiệp trong quý III năm 2026. "
            "Nhu cầu thuê tiếp tục tăng từ các doanh nghiệp sản xuất điện tử và cơ khí chính xác, "
            "tỷ lệ lấp đầy được cải thiện so với cùng kỳ năm trước.")
    bang = Table([["Hạng mục", "Diện tích", "Giá thuê"],
                  ["Lô A1", "12.500 m²", "120 USD/m²"],
                  ["Lô B2", "8.000 m²", "115 USD/m²"]])
    bang.setStyle(TableStyle([("FONTNAME", (0, 0), (-1, -1), FONT),
                              ("GRID", (0, 0), (-1, -1), 1, colors.black)]))
    SimpleDocTemplate(str(path), pagesize=A4).build(
        [Paragraph("Khu công nghiệp Long Thành", style), Paragraph(doan, style), PageBreak(), bang])
    return str(path)


@pytest.fixture
def pdf_scan(tmp_path):
    path = tmp_path / "cong-van-scan.pdf"
    c = canvas.Canvas(str(path), pagesize=A4)
    c.rect(100, 400, 300, 200, fill=1)
    c.save()
    return str(path)


@pytest.fixture
def pdf_mat_khau(pdf_chu, tmp_path):
    path = tmp_path / "hop-dong-khoa.pdf"
    writer = PdfWriter()
    for page in PdfReader(pdf_chu).pages:
        writer.add_page(page)
    writer.encrypt("szl")
    with open(path, "wb") as f:
        writer.write(f)
    return str(path)


@pytest.fixture
def tep_khong_phai_pdf(tmp_path):
    path = tmp_path / "gia.pdf"
    path.write_text("khong phai pdf")
    return str(path)


@pytest.fixture
def pdf_khoa_quyen(pdf_chu, tmp_path):
    """PDF chỉ hạn chế quyền (mật khẩu mở rỗng)."""
    path = tmp_path / "han-che-quyen.pdf"
    writer = PdfWriter()
    for page in PdfReader(pdf_chu).pages:
        writer.add_page(page)
    writer.encrypt(user_password="", owner_password="chu-so-huu")
    with open(path, "wb") as f:
        writer.write(f)
    return str(path)


@pytest.fixture
def pdf_hon_hop(pdf_chu, pdf_scan, tmp_path):
    """Trang 1 có chữ, trang 2 là bản scan."""
    path = tmp_path / "hon-hop.pdf"
    writer = PdfWriter()
    writer.add_page(PdfReader(pdf_chu).pages[0])
    writer.add_page(PdfReader(pdf_scan).pages[0])
    with open(path, "wb") as f:
        writer.write(f)
    return str(path)
