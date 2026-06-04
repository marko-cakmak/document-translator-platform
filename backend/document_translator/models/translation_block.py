from django.db import models

from document_translator.models.document import Document
from document_translator.models.document_page import DocumentPage


class TranslationBlock(models.Model):
    class BlockType(models.TextChoices):
        PARAGRAPH = "paragraph", "Paragraph"
        TITLE = "title", "Title"
        TABLE = "table", "Table"
        LIST = "list", "List"
        FOOTER = "footer", "Footer"
        HEADER = "header", "Header"
        UNKNOWN = "unknown", "Unknown"

    class Source(models.TextChoices):
        MANUAL = "manual", "Manual"
        AI = "ai", "AI"
        OCR = "ocr", "OCR"

    document = models.ForeignKey(
        Document,
        related_name="translation_blocks",
        on_delete=models.CASCADE,
    )
    page = models.ForeignKey(
        DocumentPage,
        related_name="translation_blocks",
        on_delete=models.CASCADE,
    )

    block_type = models.CharField(
        max_length=30,
        choices=BlockType.choices,
        default=BlockType.UNKNOWN,
    )
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.MANUAL,
    )

    source_text = models.TextField(blank=True)
    translated_text = models.TextField(blank=True)

    bbox_x = models.PositiveIntegerField()
    bbox_y = models.PositiveIntegerField()
    bbox_width = models.PositiveIntegerField()
    bbox_height = models.PositiveIntegerField()

    confidence = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["page__page_number", "bbox_y", "bbox_x"]

    def __str__(self):
        return f"{self.document.name} - page {self.page.page_number} - block {self.id}"
