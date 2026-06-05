from django.urls import path

from document_translator.views.analysis import analyze_document_page
from document_translator.views.document_blocks import (
    list_page_blocks,
    save_page_analysis_block,
)
from document_translator.views.documents import (
    delete_document,
    list_documents,
    retrieve_document,
    upload_document,
)
from document_translator.views.health import health_check
from document_translator.views.ocr import run_page_ocr
from document_translator.views.page_analyses import (
    approve_translation_block,
    delete_page_analysis,
    list_page_analyses,
    retrieve_page_analysis,
    save_page_analysis,
)
from document_translator.views.translations import translate_document

urlpatterns = [
    path("health/", health_check),

    # Documents
    path("documents/", list_documents),
    path("documents/upload/", upload_document),
    path("documents/<int:document_id>/", retrieve_document),
    path("documents/<int:document_id>/delete/", delete_document),

    # OCR
    path(
        "documents/<int:document_id>/pages/<int:page_id>/ocr/",
        run_page_ocr,
    ),

    # AI analysis
    path(
        "documents/<int:document_id>/pages/<int:page_id>/analyze/",
        analyze_document_page,
    ),

    # Page analyses / versions
    path(
        "documents/<int:document_id>/pages/<int:page_id>/analyses/",
        list_page_analyses,
    ),
    path(
        "documents/<int:document_id>/pages/<int:page_id>/analyses/<int:analysis_id>/",
        retrieve_page_analysis,
    ),
    path(
        "documents/<int:document_id>/pages/<int:page_id>/analyses/<int:analysis_id>/save/",
        save_page_analysis,
    ),
    path(
        "documents/<int:document_id>/pages/<int:page_id>/analyses/<int:analysis_id>/translations/<int:translation_id>/approve/",
        approve_translation_block,
    ),
    path(
        "documents/<int:document_id>/pages/<int:page_id>/analyses/<int:analysis_id>/delete/",
        delete_page_analysis,
    ),

    # Block save
    path(
        "documents/<int:document_id>/pages/<int:page_id>/blocks/",
        list_page_blocks,
    ),
    path(
        "documents/<int:document_id>/pages/<int:page_id>/blocks/save/",
        save_page_analysis_block,
    ),

    # Translation
    path("documents/<int:document_id>/translate/", translate_document),
]
