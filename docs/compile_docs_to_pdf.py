#!/usr/bin/env python3
"""
compile_docs_to_pdf.py
Recursively percorre `docs/` e converte todos os arquivos para PDF e mescla em um único PDF (Project_Documentation.pdf).
Suporta: .md, .txt, .pdf, .xlsx, imagens (.png, .jpg).
"""
import argparse
import io
import os
import re
import sys
import tempfile
from pathlib import Path
from datetime import datetime
import pandas as pd
from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import utils
from reportlab.pdfgen import canvas
from PIL import Image
import markdown as md


PAGE_WIDTH, PAGE_HEIGHT = A4


def convert_text_to_pdf(text: str, out_path: Path, title: str = None):
    c = canvas.Canvas(str(out_path), pagesize=A4)
    margin = 15 * mm
    x = margin
    y = PAGE_HEIGHT - margin
    if title:
        c.setFont('Helvetica-Bold', 14)
        c.drawString(x, y, title)
        y -= 14 + 6
    c.setFont('Helvetica', 10)
    lines = text.splitlines()
    for line in lines:
        # Simple wrap
        if not line:
            y -= 10
            if y < margin:
                c.showPage()
                y = PAGE_HEIGHT - margin
            continue
        while line:
            # fit in width
            max_chars = 100
            part = line[:max_chars]
            c.drawString(x, y, part)
            line = line[max_chars:]
            y -= 10
            if y < margin:
                c.showPage()
                y = PAGE_HEIGHT - margin
    c.save()


def convert_df_to_pdf(df: pd.DataFrame, out_path: Path, title: str = None):
    text = ''
    if title:
        text += f'{title}\n\n'
    text += df.to_string(index=False)
    return convert_text_to_pdf(text, out_path)


def convert_image_to_pdf(img_path: Path, out_path: Path):
    image = Image.open(img_path)
    image = image.convert('RGB')
    # Fit to A4
    width, height = image.size
    ratio = min(PAGE_WIDTH / width, PAGE_HEIGHT / height)
    new_w = int(width * ratio)
    new_h = int(height * ratio)
    image = image.resize((new_w, new_h), Image.Resampling.LANCZOS)
    image.save(out_path, format='PDF')


def convert_md_to_pdf(md_path: Path, out_path: Path):
    text = md.markdown(md_path.read_text(encoding='utf8'))
    # Strip HTML to plaintext (simple)
    plain = re.sub(r'<[^>]+>', '', text)
    return convert_text_to_pdf(plain, out_path, title=md_path.name)


def convert_xlsx_to_pdf(xlsx_path: Path, out_path: Path):
    # read all sheets and write each as a string
    xls = pd.read_excel(xlsx_path, sheet_name=None)
    # write a temporary multi-page pdf
    c = canvas.Canvas(str(out_path), pagesize=A4)
    margin = 15 * mm
    x = margin
    y = PAGE_HEIGHT - margin
    for sheet_name, df in xls.items():
        c.setFont('Helvetica-Bold', 12)
        c.drawString(x, y, f'{xlsx_path.name} - {sheet_name}')
        y -= 16
        c.setFont('Helvetica', 9)
        table_text = df.to_string(index=False)
        for line in table_text.splitlines():
            # Basic wrapping
            c.drawString(x, y, line[:150])
            y -= 11
            if y < margin:
                c.showPage()
                y = PAGE_HEIGHT - margin
        # Spacer between sheets
        y -= 10
        if y < margin:
            c.showPage()
            y = PAGE_HEIGHT - margin
    c.save()


def collect_docs(root: Path):
    files = []
    ignore_dirs = {'node_modules', '.venv', 'venv', '.git'}
    for p in root.rglob('*'):
        if any(x in p.parts for x in ignore_dirs):
            continue
        if p.is_file():
            files.append(p)
    # sort for stable order
    files.sort()
    return files


def build_project_pdf(docs_root: Path, out_file: Path, temp_dir: Path):
    files = collect_docs(docs_root)
    print('Found', len(files), 'files under', docs_root)
    tmp_pdfs = []
    for p in files:
        ext = p.suffix.lower()
        tmp_pdf = temp_dir / (p.name + '.pdf')
        try:
            if ext == '.pdf':
                # copy directly
                import shutil
                shutil.copy2(p, tmp_pdf)
            elif ext in ['.md']:
                convert_md_to_pdf(p, tmp_pdf)
            elif ext in ['.txt']:
                convert_text_to_pdf(p.read_text(encoding='utf8'), tmp_pdf, title=p.name)
            elif ext in ['.png', '.jpg', '.jpeg']:
                convert_image_to_pdf(p, tmp_pdf)
            elif ext in ['.xlsx', '.xls']:
                convert_xlsx_to_pdf(p, tmp_pdf)
            else:
                # fallback: plain text
                try:
                    text = p.read_text(encoding='utf8')
                    convert_text_to_pdf(text, tmp_pdf, title=p.name)
                except Exception:
                    print('Unsupported file type for', p)
                    continue
            tmp_pdfs.append(tmp_pdf)
            print('Converted', p, '->', tmp_pdf)
        except Exception as e:
            print('Failed to convert', p, e)

    # Merge all temp pdfs
    writer = PdfWriter()
    for t in tmp_pdfs:
        try:
            reader = PdfReader(str(t))
            for page in reader.pages:
                writer.add_page(page)
        except Exception as e:
            print('Failed to append', t, e)
    with open(out_file, 'wb') as f:
        writer.write(f)
    print('Wrote merged PDF to', out_file)


def main():
    parser = argparse.ArgumentParser(description='Compile docs/ files into a single PDF')
    parser.add_argument('--out', '-o', default='PROJECT_DOCUMENTATION.pdf')
    parser.add_argument('--docs-root', default='docs')
    args = parser.parse_args()
    docs_root = Path(args.docs_root).resolve()
    out_file = Path(args.out).resolve()
    temp_dir = Path(tempfile.mkdtemp(prefix='docs_pdf_'))
    build_project_pdf(docs_root, out_file, temp_dir)


if __name__ == '__main__':
    main()
