from django.urls import path

from document_translator.views import (
    delete_document,
    health_check,
    list_documents,
    retrieve_document,
    translate_document,
    upload_document,
)


urlpatterns = [
    path("health/", health_check, name="health-check"),

    path("documents/", list_documents, name="document-list"),
    path("documents/upload/", upload_document, name="document-upload"),
    path("documents/<int:document_id>/", retrieve_document, name="document-detail"),
    path("documents/<int:document_id>/delete/", delete_document, name="document-delete"),
    path("documents/<int:document_id>/translate/", translate_document, name="document-translate"),
]