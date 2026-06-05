from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from document_translator.models import DocumentPageAnalysis
from document_translator.services.page_analysis_service import (
    get_analysis_or_none,
    get_int_from_box,
    get_or_create_block,
    get_or_create_translation,
    get_page_or_none,
    serialize_analysis_result,
    serialize_empty_analysis_result,
)


@api_view(["GET"])
def list_page_blocks(request, document_id, page_id):
    page = get_page_or_none(document_id, page_id)

    if not page:
        return Response(
            {"detail": "Document page not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    analysis = (
        DocumentPageAnalysis.objects
        .filter(document_id=document_id, page=page)
        .order_by("-updated_at")
        .first()
    )

    if not analysis:
        return Response(
            serialize_empty_analysis_result(
                document_id=document_id,
                page=page,
            )
        )

    return Response(
        serialize_analysis_result(
            document_id=document_id,
            page=page,
            analysis=analysis,
        )
    )


@api_view(["POST"])
def save_page_analysis_block(request, document_id, page_id):
    page = get_page_or_none(document_id, page_id)

    if not page:
        return Response(
            {"detail": "Document page not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    source_block = request.data.get("sourceBlock")
    translation_block = request.data.get("translationBlock")

    if not source_block or not translation_block:
        return Response(
            {"detail": "sourceBlock and translationBlock are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    analysis_id = (
        source_block.get("analysisId")
        or translation_block.get("analysisId")
        or request.data.get("analysisId")
    )

    if not analysis_id:
        return Response(
            {"detail": "analysisId is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    analysis = get_analysis_or_none(
        document_id=document_id,
        page=page,
        analysis_id=analysis_id,
    )

    if not analysis:
        return Response(
            {"detail": "Document page analysis not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if source_block.get("clientId") != translation_block.get("sourceClientId"):
        return Response(
            {
                "detail": "sourceBlock.clientId must match translationBlock.sourceClientId."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    source_box = source_block.get("sourceBox", {})
    target_box = translation_block.get("targetBox", {})

    if (
        get_int_from_box(source_box, "width") <= 0
        or get_int_from_box(source_box, "height") <= 0
    ):
        return Response(
            {"detail": "Source block width and height must be greater than zero."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if (
        get_int_from_box(target_box, "width") <= 0
        or get_int_from_box(target_box, "height") <= 0
    ):
        return Response(
            {"detail": "Translation block width and height must be greater than zero."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        block = get_or_create_block(
            document_id=document_id,
            page=page,
            analysis=analysis,
            source_block=source_block,
        )
        translation = get_or_create_translation(
            block=block,
            translation_block=translation_block,
        )

    return Response(
        {
            "documentId": document_id,
            "pageId": page.id,
            "analysisId": analysis.id,
            "analysisName": analysis.name,
            "analysisStatus": analysis.status,
            "sourceBlockId": block.id,
            "translationBlockId": translation.id,
            "sourceClientId": block.client_id,
            "translationClientId": translation.client_id,
            "status": "saved",
        },
        status=status.HTTP_201_CREATED,
    )
