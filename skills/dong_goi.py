"""Đóng gói skill Xử lý PDF SZL thành tệp .zip để tải lên Claude.

Cách dùng (từ gốc kho mã):
    python skills/dong_goi.py
Kết quả: skills/xu-ly-pdf-szl.zip, thư mục xu-ly-pdf-szl/ nằm ở gốc tệp nén.
"""
import re
import sys
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent


def referenced_files(skill_md_text: str) -> set:
    return set(re.findall(r"(?:references|scripts)/[\w.-]+", skill_md_text))


def build_zip(skill_dir: Path, out_zip: Path) -> list:
    skill_dir = Path(skill_dir)
    missing = sorted(r for r in referenced_files((skill_dir / "SKILL.md").read_text())
                     if not (skill_dir / r).exists())
    if missing:
        raise FileNotFoundError("SKILL.md nhắc tới tệp không tồn tại: " + ", ".join(missing))
    names = []
    with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as z:
        for path in sorted(skill_dir.rglob("*")):
            if path.is_dir() or "__pycache__" in path.parts or path.suffix == ".pyc":
                continue
            name = f"{skill_dir.name}/{path.relative_to(skill_dir).as_posix()}"
            z.write(path, name)
            names.append(name)
    return names


if __name__ == "__main__":
    out = HERE / "xu-ly-pdf-szl.zip"
    try:
        names = build_zip(HERE / "xu-ly-pdf-szl", out)
    except FileNotFoundError as e:
        print(f"Lỗi: {e}", file=sys.stderr)
        sys.exit(1)
    print(f"Đã đóng gói {len(names)} tệp vào {out}")
