from django.urls import path

from document_translator.views.documents import (
    delete_document,
    list_documents,
    retrieve_document,
    upload_document,
)
from document_translator.views.health import health_check
from document_translator.views.ocr import run_page_ocr
from document_translator.views.translations import translate_document

urlpatterns = [
    path("health/", health_check),
    path("documents/", list_documents),
    path("documents/upload/", upload_document),
    path("documents/<int:document_id>/", retrieve_document),
    path("documents/<int:document_id>/delete/", delete_document),
    path("documents/<int:document_id>/translate/", translate_document),
    path(
        "documents/<int:document_id>/pages/<int:page_id>/ocr/",
        run_page_ocr,
    ),
]