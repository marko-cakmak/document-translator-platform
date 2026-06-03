from django.contrib import admin

from document_translator.models import Document, DocumentPage


class DocumentPageInline(admin.TabularInline):
    model = DocumentPage
    extra = 0
    fields = (
        "page_number",
        "image",
        "width",
        "height",
        "created_at",
    )
    readonly_fields = (
        "created_at",
    )


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "status",
        "source_language",
        "target_language",
        "page_count",
        "uploaded_at",
    )
    list_filter = (
        "status",
        "source_language",
        "target_language",
        "uploaded_at",
    )
    search_fields = (
        "name",
        "original_file",
    )
    readonly_fields = (
        "uploaded_at",
        "updated_at",
    )
    inlines = [
        DocumentPageInline,
    ]


@admin.register(DocumentPage)
class DocumentPageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "document",
        "page_number",
        "width",
        "height",
        "created_at",
    )
    list_filter = (
        "created_at",
    )
    search_fields = (
        "document__name",
    )