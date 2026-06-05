from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from document_translator.models import DocumentPageAnalysis
from document_translator.services.page_analysis_service import (
    get_analysis_or_none,
    get_page_or_none,
    serialize_analysis_result,
    serialize_analysis_summary,
)
from document_translator.services.page_analysis_workflow_service import (
    PageAnalysisWorkflowError,
    approve_translation_for_analysis,
    delete_analysis,
    save_analysis_if_all_blocks_approved,
)


def build_workflow_error_response(error):
    return Response(
        {
            "detail": error.detail,
            **error.extra,
        },
        status=error.status_code,
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

    try:
        save_analysis_if_all_blocks_approved(
            document_id=document_id,
            page=page,
            analysis=analysis,
        )
    except PageAnalysisWorkflowError as error:
        return build_workflow_error_response(error)

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
        approve_translation_for_analysis(
            document_id=document_id,
            page=page,
            analysis=analysis,
            translation_id=translation_id,
        )
    except PageAnalysisWorkflowError as error:
        return build_workflow_error_response(error)

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

    delete_analysis(analysis)

    return Response(status=status.HTTP_204_NO_CONTENT)
