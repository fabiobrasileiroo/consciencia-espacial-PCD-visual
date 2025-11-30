#!/usr/bin/env python3
"""
merge_docs_to_pdf.py
Merge DOCS folder files into a single PDF (existing PDFs, images, short summaries of non-PDFs)
"""
import sys
from pathlib import Path
from typing import List

from PIL import Image
from pypdf import PdfReader, PdfWriter
import pandas as pd


def is_image(path: Path) -> bool:
    return path.suffix.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.bmp']


def is_pdf(path: Path) -> bool:
    return path.suffix.lower() == '.pdf'


def summarize_xlsx(path: Path) -> str:
    try:
        xls = pd.read_excel(path, sheet_name=None)
        out = []
        for sname, df in xls.items():
            out.append(f"Sheet: {sname}")
            out.append(df.head(5).to_csv(index=False))
            out.append('\n')
        return '\n'.join(out)
    except Exception as e:
        return f"(Failed to read xlsx: {e})"


def textpage_to_pdf(text: str, out: Path):
    # Create a simple PDF page from text using Pillow
    # Compute size
    lines = text.splitlines()
    width = 1200
    line_height = 20
    height = max(1200, line_height * (len(lines) + 5))
    img = Image.new('RGB', (width, height), color='white')
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype('DejaVuSans.ttf', 14)
    except Exception:
        font = ImageFont.load_default()
    y = 10
    for l in lines:
        draw.text((10, y), l[:2000], fill='black', font=font)
        y += line_height
    img.save(out, 'PDF')


def main():
    repo_root = Path(__file__).resolve().parent
    docs_dir = repo_root
    out_file = docs_dir / 'CONSOLIDATED_DOCS_FOR_AI.pdf'
    writer = PdfWriter()

    # Find pdfs and images
    all_files: List[Path] = sorted([p for p in docs_dir.iterdir() if p.is_file()], key=lambda p: p.name.lower())

    # merge pdfs first that already exist
    for f in all_files:
        if is_pdf(f):
            try:
                r = PdfReader(str(f))
                for page in r.pages:
                    writer.add_page(page)
                print('Appended PDF', f)
            except Exception as e:
                print('Failed append pdf', f, e)

    # then convert images into pdf and append
    tmp_dir = docs_dir / '.tmp_merge_pdf'
    tmp_dir.mkdir(exist_ok=True)
    for f in all_files:
        if is_image(f):
            # convert image to temporary PDF
            tmp_pdf = tmp_dir / (f.stem + '.pdf')
            try:
                Image.open(f).convert('RGB').save(tmp_pdf, 'PDF', resolution=100.0)
                r = PdfReader(str(tmp_pdf))
                for page in r.pages:
                    writer.add_page(page)
                print('Appended image as pdf', f)
            except Exception as e:
                print('Failed convert image', f, e)

    # non-pdf, non-image files: create summarized text pdfs (xlsx -> summary, md/txt -> include)
    for f in all_files:
        if not (is_pdf(f) or is_image(f)):
            if f.suffix.lower() in ['.md', '.txt']:
                text = f"File: {f.name}\n\n" + f.read_text(encoding='utf8')
            elif f.suffix.lower() in ['.xlsx', '.xls']:
                text = f"File: {f.name}\n\n" + summarize_xlsx(f)
            else:
                # other types: just show file name and size
                text = f"File: {f.name}\n\nType: {f.suffix}\nSize: {f.stat().st_size} bytes\nPath: {f}\n"
            tmp_pdf = tmp_dir / (f.stem + '_summary.pdf')
            try:
                textpage_to_pdf(text, tmp_pdf)
                r = PdfReader(str(tmp_pdf))
                for page in r.pages:
                    writer.add_page(page)
                print('Appended summary for', f)
            except Exception as e:
                print('Failed create textpdf', f, e)

    # write merged output
    try:
        with open(out_file, 'wb') as f:
            writer.write(f)
        print('Wrote consolidated PDF to', out_file)
    finally:
        # cleanup tmp files
        import shutil
        try:
            shutil.rmtree(tmp_dir)
        except Exception:
            pass


if __name__ == '__main__':
    main()
