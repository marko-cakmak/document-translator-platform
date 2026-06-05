from django.contrib import admin

from document_translator.models import (
    Document,
    DocumentBlock,
    DocumentBlockTranslation,
    DocumentPage,
)


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


class DocumentBlockInline(admin.TabularInline):
    model = DocumentBlock
    extra = 0
    fields = (
        "page",
        "block_type",
        "source",
        "source_text",
        "bbox_x",
        "bbox_y",
        "bbox_width",
        "bbox_height",
        "confidence",
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
        DocumentBlockInline,
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


@admin.register(DocumentBlock)
class DocumentBlockAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "document",
        "page",
        "block_type",
        "source",
        "bbox_x",
        "bbox_y",
        "bbox_width",
        "bbox_height",
        "confidence",
        "created_at",
    )
    list_filter = (
        "block_type",
        "source",
        "created_at",
    )
    search_fields = (
        "document__name",
        "source_text",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )


@admin.register(DocumentBlockTranslation)
class DocumentBlockTranslationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "block",
        "target_language",
        "status",
        "target_x",
        "target_y",
        "target_width",
        "target_height",
        "created_at",
    )
    list_filter = (
        "target_language",
        "status",
        "created_at",
    )
    search_fields = (
        "block__document__name",
        "translated_text",
        "html",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
