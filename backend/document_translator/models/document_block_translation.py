from django.db import models

from document_translator.models.document_block import DocumentBlock


class DocumentBlockTranslation(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        REVIEWED = "reviewed", "Reviewed"
        APPROVED = "approved", "Approved"

    block = models.ForeignKey(
        DocumentBlock,
        related_name="translations",
        on_delete=models.CASCADE,
    )

    target_language = models.CharField(max_length=10)
    translated_text = models.TextField(blank=True)

    target_x = models.PositiveIntegerField(default=0)
    target_y = models.PositiveIntegerField(default=0)
    target_width = models.PositiveIntegerField(default=0)
    target_height = models.PositiveIntegerField(default=0)

    html = models.TextField(blank=True)
    css = models.JSONField(default=dict, blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    client_id = models.CharField(max_length=100, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["block__page__page_number", "target_y", "target_x"]

    def __str__(self):
        return f"{self.block} - {self.target_language}"
