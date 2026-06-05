from pathlib import Path
from uuid import uuid4

import fitz
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from document_translator.models import DocumentPage


def convert_pdf_to_page_images(document):
    pdf_path = document.original_file.path
    document_folder = f"document_{document.id}"

    with fitz.open(pdf_path) as pdf_document:
        document_pages = []

        for page_index in range(pdf_document.page_count):
            page = pdf_document.load_page(page_index)

            pixmap = page.get_pixmap(
                matrix=fitz.Matrix(2, 2),
                alpha=False,
            )

            image_name = f"page_{page_index + 1}_{uuid4().hex}.png"
            image_path = Path("documents/pages") / document_folder / image_name

            image_bytes = pixmap.tobytes("png")
            saved_path = default_storage.save(
                str(image_path),
                ContentFile(image_bytes),
            )

            document_page = DocumentPage.objects.create(
                document=document,
                page_number=page_index + 1,
                image=saved_path,
                width=pixmap.width,
                height=pixmap.height,
            )

            document_pages.append(document_page)

        document.page_count = len(document_pages)
        document.save(update_fields=["page_count", "updated_at"])

        return document_pages