from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from document_translator.models import DocumentPageAnalysis
from document_translator.services.page_analysis_block_service import (
    PageAnalysisBlockError,
    save_analysis_block_from_payload,
)
from document_translator.services.page_analysis_service import (
    get_page_or_none,
    serialize_analysis_result,
    serialize_empty_analysis_result,
)


def build_block_error_response(error):
    return Response(
        {"detail": error.detail},
        status=error.status_code,
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

    try:
        result = save_analysis_block_from_payload(
            document_id=document_id,
            page=page,
            request_data=request.data,
        )
    except PageAnalysisBlockError as error:
        return build_block_error_response(error)

    return Response(
        result,
        status=status.HTTP_201_CREATED,
    )
