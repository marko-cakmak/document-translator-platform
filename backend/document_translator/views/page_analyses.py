from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from document_translator.models import (
    DocumentBlockTranslation,
    DocumentPageAnalysis,
)
from document_translator.services.page_analysis_service import (
    get_analysis_or_none,
    get_page_or_none,
    serialize_analysis_result,
    serialize_analysis_summary,
)


@api_view(["GET"])
def list_page_analyses(request, document_id, page_id):
    page = get_page_or_none(document_id, page_id)

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
    page = get_page_or_none(document_id, page_id)

    if not page:
        return Response(
            {"detail": "Document page not found."},
            status=status.HTTP_404_NOT_FOUND,
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

    return Response(
        serialize_analysis_result(
            document_id=document_id,
            page=page,
            analysis=analysis,
        )
    )


@api_view(["POST"])
def save_page_analysis(request, document_id, page_id, analysis_id):
    page = get_page_or_none(document_id, page_id)

    if not page:
        return Response(
            {"detail": "Document page not found."},
            status=status.HTTP_404_NOT_FOUND,
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
def approve_translation_block(
    request,
    document_id,
    page_id,
    analysis_id,
    translation_id,
):
    page = get_page_or_none(document_id, page_id)

    if not page:
        return Response(
            {"detail": "Document page not found."},
            status=status.HTTP_404_NOT_FOUND,
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

    try:
        translation = DocumentBlockTranslation.objects.select_related(
            "block",
        ).get(
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
    page = get_page_or_none(document_id, page_id)

    if not page:
        return Response(
            {"detail": "Document page not found."},
            status=status.HTTP_404_NOT_FOUND,
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

    analysis.delete()

    return Response(status=status.HTTP_204_NO_CONTENT)
