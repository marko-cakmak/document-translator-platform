from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from document_translator.services.page_analysis_generation_service import (
    create_ai_page_analysis,
)
from document_translator.services.page_analysis_service import (
    get_page_or_none,
)


@api_view(["POST"])
def analyze_document_page(request, document_id, page_id):
    page = get_page_or_none(document_id, page_id)

    if not page:
        return Response(
            {"detail": "Document page not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    target_language = request.data.get(
        "targetLanguage",
        page.document.target_language or "sr",
    )

    analysis_result = create_ai_page_analysis(
        document_id=document_id,
        page=page,
        target_language=target_language,
    )

    return Response(
        analysis_result,
        status=status.HTTP_201_CREATED,
    )
