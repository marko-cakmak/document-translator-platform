from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from document_translator.models import DocumentPageAnalysis
from document_translator.services.ai_provider_service import (
    get_ai_analysis_blocks,
)
from document_translator.services.page_analysis_service import (
    create_block_for_analysis,
    create_translation_for_block,
    get_next_ai_analysis_name,
    get_page_or_none,
    serialize_analysis_result,
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

    source_blocks, translation_blocks = get_ai_analysis_blocks(
        target_language=target_language,
        page=page,
    )

    translations_by_source_id = {
        block.get("sourceClientId"): block
        for block in translation_blocks
    }

    with transaction.atomic():
        analysis = DocumentPageAnalysis.objects.create(
            document_id=document_id,
            page=page,
            name=get_next_ai_analysis_name(
                document_id=document_id,
                page=page,
            ),
            source=DocumentPageAnalysis.Source.AI,
            status=DocumentPageAnalysis.Status.DRAFT,
        )

        for source_block in source_blocks:
            source_client_id = source_block.get("clientId")
            translation_block = translations_by_source_id.get(source_client_id)

            if not translation_block:
                continue

            block = create_block_for_analysis(
                document_id=document_id,
                page=page,
                analysis=analysis,
                source_block=source_block,
            )

            create_translation_for_block(
                block=block,
                translation_block=translation_block,
            )

    return Response(
        serialize_analysis_result(
            document_id=document_id,
            page=page,
            analysis=analysis,
        ),
        status=status.HTTP_201_CREATED,
    )
