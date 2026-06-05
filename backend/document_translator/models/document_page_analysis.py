from django.db import models

from document_translator.models.document import Document
from document_translator.models.document_page import DocumentPage


class DocumentPageAnalysis(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SAVED = "saved", "Saved"
        ARCHIVED = "archived", "Archived"
        DISCARDED = "discarded", "Discarded"
        ACCEPTED = "accepted", "Accepted legacy"

    class Source(models.TextChoices):
        AI = "ai", "AI"
        MANUAL = "manual", "Manual"
        INITIAL = "initial", "Initial"

    document = models.ForeignKey(
        Document,
        related_name="page_analyses",
        on_delete=models.CASCADE,
    )
    page = models.ForeignKey(
        DocumentPage,
        related_name="analyses",
        on_delete=models.CASCADE,
    )

    name = models.CharField(max_length=120)
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.AI,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["page__page_number", "created_at"]

    def __str__(self):
        return f"{self.document.name} - page {self.page.page_number} - {self.name}"
