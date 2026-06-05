from pathlib import Path

from django.conf import settings
from django.db import models


class Document(models.Model):
    class Status(models.TextChoices):
        UPLOADED = "uploaded", "Uploaded"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    name = models.CharField(max_length=255)
    original_file = models.FileField(upload_to="documents/originals/")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UPLOADED,
    )
    source_language = models.CharField(max_length=10, blank=True)
    target_language = models.CharField(max_length=10, blank=True)
    page_count = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.name

    def delete(self, *args, **kwargs):
        document_pages_folder = Path(settings.MEDIA_ROOT) / "documents" / "pages" / f"document_{self.id}"

        for page in self.pages.all():
            if page.image:
                page.image.delete(save=False)

        if document_pages_folder.exists():
            try:
                document_pages_folder.rmdir()
            except OSError:
                pass

        if self.original_file:
            self.original_file.delete(save=False)

        super().delete(*args, **kwargs)