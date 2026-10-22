import shutil
import sys
from pathlib import Path

import pytest

from conftest import SKILL_DIR

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dong_goi import build_zip  # noqa: E402


def test_zip_layout(tmp_path):
    names = build_zip(SKILL_DIR, tmp_path / "s.zip")
    assert "xu-ly-pdf-szl/SKILL.md" in names and "xu-ly-pdf-szl/scripts/pdf_to_docx.py" in names
    assert all(n.startswith("xu-ly-pdf-szl/") for n in names)
    assert not any("__pycache__" in n or n.endswith(".pyc") for n in names)


def test_zip_rejects_broken_link(tmp_path):
    bad = tmp_path / "xu-ly-pdf-szl"
    shutil.copytree(SKILL_DIR, bad)
    (bad / "references/quy-tac-dich.md").unlink()
    with pytest.raises(FileNotFoundError, match="quy-tac-dich.md"):
        build_zip(bad, tmp_path / "s.zip")


def test_committed_zip_is_up_to_date(tmp_path):
    import zipfile
    committed = SKILL_DIR.parent / "xu-ly-pdf-szl.zip"
    with zipfile.ZipFile(committed) as z:
        for name in z.namelist():
            assert z.read(name) == (SKILL_DIR.parent / name).read_bytes(), f"{name} cũ — chạy lại python skills/dong_goi.py"
        assert set(z.namelist()) == set(build_zip(SKILL_DIR, tmp_path / "x.zip"))
