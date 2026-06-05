from django.db import models

from document_translator.models.document import Document


class DocumentPage(models.Model):
    document = models.ForeignKey(
        Document,
        related_name="pages",
        on_delete=models.CASCADE,
    )
    page_number = models.PositiveIntegerField()
    image = models.FileField(upload_to="documents/pages/")
    width = models.PositiveIntegerField(default=0)
    height = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["page_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["document", "page_number"],
                name="unique_document_page_number",
            ),
        ]

    def __str__(self):
        return f"{self.document.name} - page {self.page_number}"

    def delete(self, *args, **kwargs):
        if self.image:
            self.image.delete(save=False)

        super().delete(*args, **kwargs)