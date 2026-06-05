from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from document_translator.models import Document
from document_translator.serializers import (
    DocumentDetailSerializer,
    DocumentListSerializer,
)
from document_translator.services.pdf_service import convert_pdf_to_page_images


@api_view(["GET"])
def list_documents(request):
    documents = Document.objects.all()
    serializer = DocumentListSerializer(
        documents,
        many=True,
        context={"request": request},
    )

    return Response(serializer.data)


@api_view(["GET"])
def retrieve_document(request, document_id):
    document = get_object_or_404(
        Document.objects.prefetch_related("pages"),
        id=document_id,
    )

    serializer = DocumentDetailSerializer(
        document,
        context={"request": request},
    )

    return Response(serializer.data)


@api_view(["DELETE"])
def delete_document(request, document_id):
    document = get_object_or_404(Document, id=document_id)
    document.delete()

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def upload_document(request):
    uploaded_file = request.FILES.get("file")

    if uploaded_file is None:
        return Response(
            {"detail": "File is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if uploaded_file.content_type != "application/pdf":
        return Response(
            {"detail": "Only PDF files are supported."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    document = Document.objects.create(
        name=uploaded_file.name,
        original_file=uploaded_file,
        status=Document.Status.PROCESSING,
        source_language=request.data.get("sourceLanguage", ""),
        target_language=request.data.get("targetLanguage", ""),
        page_count=0,
    )

    try:
        convert_pdf_to_page_images(document)

        document.status = Document.Status.COMPLETED
        document.error_message = ""
        document.save(update_fields=["status", "error_message", "updated_at"])

    except Exception as error:
        document.status = Document.Status.FAILED
        document.error_message = str(error)
        document.save(update_fields=["status", "error_message", "updated_at"])

        return Response(
            {
                "detail": "Failed to process PDF file.",
                "error": str(error),
                "documentId": document.id,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    serializer = DocumentDetailSerializer(
        document,
        context={"request": request},
    )

    return Response(
        serializer.data,
        status=status.HTTP_201_CREATED,
    )