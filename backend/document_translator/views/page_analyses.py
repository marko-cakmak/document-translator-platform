from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from document_translator.models import (
    DocumentBlock,
    DocumentBlockTranslation,
    DocumentPage,
    DocumentPageAnalysis,
)


def get_page_or_404(document_id, page_id):
    try:
        return DocumentPage.objects.select_related("document").get(
            id=page_id,
            document_id=document_id,
        )
    except DocumentPage.DoesNotExist:
        return None


def serialize_analysis_summary(analysis):
    return {
        "id": analysis.id,
        "name": analysis.name,
        "source": analysis.source,
        "status": analysis.status,
        "createdAt": analysis.created_at.isoformat(),
        "updatedAt": analysis.updated_at.isoformat(),
        "blocksCount": analysis.blocks.count(),
    }


def serialize_source_block(block):
    return {
        "id": block.id,
        "analysisId": block.analysis_id,
        "clientId": block.client_id or f"source_saved_{block.id}",
        "blockType": block.block_type,
        "sourceText": block.source_text,
        "sourceBox": {
            "x": block.bbox_x,
            "y": block.bbox_y,
            "width": block.bbox_width,
            "height": block.bbox_height,
        },
        "confidence": block.confidence,
        "saved": True,
    }


def serialize_translation_block(translation):
    source_client_id = (
        translation.block.client_id
        or f"source_saved_{translation.block_id}"
    )

    return {
        "id": translation.id,
        "analysisId": translation.block.analysis_id,
        "clientId": translation.client_id or f"target_saved_{translation.id}",
        "sourceClientId": source_client_id,
        "targetLanguage": translation.target_language,
        "translatedText": translation.translated_text,
        "targetBox": {
            "x": translation.target_x,
            "y": translation.target_y,
            "width": translation.target_width,
            "height": translation.target_height,
        },
        "html": translation.html,
        "css": translation.css or {},
        "status": translation.status,
        "saved": True,
    }


def serialize_analysis_result(document_id, page, analysis):
    blocks = (
        DocumentBlock.objects
        .filter(
            document_id=document_id,
            page=page,
            analysis=analysis,
        )
        .prefetch_related("translations")
        .order_by("bbox_y", "bbox_x")
    )

    source_blocks = []
    translation_blocks = []

    for block in blocks:
        source_blocks.append(serialize_source_block(block))

        translation = block.translations.order_by("-updated_at").first()

        if translation:
            translation_blocks.append(
                serialize_translation_block(translation)
            )

    return {
        "documentId": document_id,
        "pageId": page.id,
        "pageNumber": page.page_number,
        "analysisId": analysis.id,
        "analysisName": analysis.name,
        "analysisSource": analysis.source,
        "analysisStatus": analysis.status,
        "imageWidth": page.width,
        "imageHeight": page.height,
        "sourceBlocks": source_blocks,
        "translationBlocks": translation_blocks,
    }


def get_analysis_or_404(document_id, page, analysis_id):
    try:
        return DocumentPageAnalysis.objects.get(
            id=analysis_id,
            document_id=document_id,
            page=page,
        )
    except DocumentPageAnalysis.DoesNotExist:
        return None


@api_view(["GET"])
def list_page_analyses(request, document_id, page_id):
    page = get_page_or_404(document_id, page_id)

    if not page:
        return Response(
            {"detail": "Document page not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    analyses = (
        DocumentPageAnalysis.objects
        .filter(
            document_id=document_id,
            page=page,
        )
        .exclude(status=DocumentPageAnalysis.Status.DISCARDED)
        .order_by("created_at")
    )

    return Response(
        {
            "documentId": document_id,
            "pageId": page.id,
            "pageNumber": page.page_number,
            "analyses": [
                serialize_analysis_summary(analysis)
                for analysis in analyses
            ],
        }
    )


@api_view(["GET"])
def retrieve_page_analysis(request, document_id, page_id, analysis_id):
    page = get_page_or_404(document_id, page_id)

    if not page:
        return Response(
            {"detail": "Document page not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    analysis = get_analysis_or_404(
        document_id=document_id,
        page=page,
        analysis_id=analysis_id,
    )

    if not analysis:
        return Response(
            {"detail": "Document page analysis not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(
        serialize_analysis_result(
            document_id=document_id,
            page=page,
            analysis=analysis,
        )
    )


@api_view(["POST"])
def save_page_analysis(request, document_id, page_id, analysis_id):
    page = get_page_or_404(document_id, page_id)

    if not page:
        return Response(
            {"detail": "Document page not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    analysis = get_analysis_or_404(
        document_id=document_id,
        page=page,
        analysis_id=analysis_id,
    )

    if not analysis:
        return Response(
            {"detail": "Document page analysis not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    translations = DocumentBlockTranslation.objects.filter(
        block__document_id=document_id,
        block__page=page,
        block__analysis=analysis,
    )

    total_count = translations.count()
    approved_count = translations.filter(
        status=DocumentBlockTranslation.Status.APPROVED,
    ).count()

    if total_count == 0:
        return Response(
            {"detail": "Analysis has no blocks to approve."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if approved_count != total_count:
        return Response(
            {
                "detail": "All blocks must be approved before saving analysis.",
                "approvedCount": approved_count,
                "totalCount": total_count,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    analysis.status = DocumentPageAnalysis.Status.SAVED
    analysis.save(update_fields=["status", "updated_at"])

    return Response(
        serialize_analysis_result(
            document_id=document_id,
            page=page,
            analysis=analysis,
        )
    )


@api_view(["POST"])
def approve_translation_block(request, document_id, page_id, analysis_id, translation_id):
    page = get_page_or_404(document_id, page_id)

    if not page:
        return Response(
            {"detail": "Document page not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    analysis = get_analysis_or_404(
        document_id=document_id,
        page=page,
        analysis_id=analysis_id,
    )

    if not analysis:
        return Response(
            {"detail": "Document page analysis not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        translation = DocumentBlockTranslation.objects.select_related("block").get(
            id=translation_id,
            block__document_id=document_id,
            block__page=page,
            block__analysis=analysis,
        )
    except DocumentBlockTranslation.DoesNotExist:
        return Response(
            {"detail": "Translation block not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    translation.status = DocumentBlockTranslation.Status.APPROVED
    translation.save(update_fields=["status", "updated_at"])

    if analysis.status == DocumentPageAnalysis.Status.SAVED:
        analysis.status = DocumentPageAnalysis.Status.DRAFT
        analysis.save(update_fields=["status", "updated_at"])

    return Response(
        serialize_analysis_result(
            document_id=document_id,
            page=page,
            analysis=analysis,
        )
    )


@api_view(["DELETE"])
def delete_page_analysis(request, document_id, page_id, analysis_id):
    page = get_page_or_404(document_id, page_id)

    if not page:
        return Response(
            {"detail": "Document page not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    analysis = get_analysis_or_404(
        document_id=document_id,
        page=page,
        analysis_id=analysis_id,
    )

    if not analysis:
        return Response(
            {"detail": "Document page analysis not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    analysis.delete()

    return Response(status=status.HTTP_204_NO_CONTENT)
