from django.db import models

from document_translator.models.document import Document
from document_translator.models.document_page import DocumentPage
from document_translator.models.document_page_analysis import DocumentPageAnalysis


class DocumentBlock(models.Model):
    class BlockType(models.TextChoices):
        TITLE = "title", "Title"
        PARAGRAPH = "paragraph", "Paragraph"
        LIST = "list", "List"
        TABLE = "table", "Table"
        HEADER = "header", "Header"
        FOOTER = "footer", "Footer"
        SIGNATURE = "signature", "Signature"
        UNKNOWN = "unknown", "Unknown"

    class Source(models.TextChoices):
        AI = "ai", "AI"
        MANUAL = "manual", "Manual"
        OCR = "ocr", "OCR"

    analysis = models.ForeignKey(
        DocumentPageAnalysis,
        related_name="blocks",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    document = models.ForeignKey(
        Document,
        related_name="blocks",
        on_delete=models.CASCADE,
    )
    page = models.ForeignKey(
        DocumentPage,
        related_name="blocks",
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
        default=Source.AI,
    )

    source_text = models.TextField(blank=True)

    bbox_x = models.PositiveIntegerField()
    bbox_y = models.PositiveIntegerField()
    bbox_width = models.PositiveIntegerField()
    bbox_height = models.PositiveIntegerField()

    confidence = models.FloatField(null=True, blank=True)

    client_id = models.CharField(max_length=100, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["page__page_number", "bbox_y", "bbox_x"]

    def __str__(self):
        return f"{self.document.name} - page {self.page.page_number} - block {self.id}"