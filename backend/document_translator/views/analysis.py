from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from document_translator.models import DocumentPageAnalysis
from document_translator.services.page_analysis_service import (
    create_block_for_analysis,
    create_translation_for_block,
    get_next_ai_analysis_name,
    get_page_or_none,
    serialize_analysis_result,
)


def build_mock_ai_blocks(target_language):
    source_blocks = [
        {
            "clientId": "source_1",
            "blockType": "title",
            "sourceText": "Sport und Sprache",
            "sourceBox": {
                "x": 80,
                "y": 110,
                "width": 520,
                "height": 70,
            },
            "confidence": 0.94,
        },
        {
            "clientId": "source_2",
            "blockType": "paragraph",
            "sourceText": "Sport und Sprache - darüber gab es bislang wenig Aufregendes zu sagen.",
            "sourceBox": {
                "x": 80,
                "y": 210,
                "width": 720,
                "height": 130,
            },
            "confidence": 0.91,
        },
        {
            "clientId": "source_3",
            "blockType": "paragraph",
            "sourceText": "Es gab Sportreportagen, Interviews, Kommentare und vieles mehr.",
            "sourceBox": {
                "x": 80,
                "y": 360,
                "width": 760,
                "height": 120,
            },
            "confidence": 0.88,
        },
    ]

    translation_blocks = [
        {
            "clientId": "target_1",
            "sourceClientId": "source_1",
            "targetLanguage": target_language,
            "translatedText": "Sport i jezik",
            "targetBox": {
                "x": 80,
                "y": 110,
                "width": 520,
                "height": 80,
            },
            "html": "<p><strong>Sport i jezik</strong></p>",
            "css": {
                "fontSize": "24px",
                "fontWeight": "700",
                "lineHeight": "1.2",
                "textAlign": "left",
            },
        },
        {
            "clientId": "target_2",
            "sourceClientId": "source_2",
            "targetLanguage": target_language,
            "translatedText": "Sport i jezik - o tome se do sada nije imalo mnogo uzbudljivog reći.",
            "targetBox": {
                "x": 80,
                "y": 210,
                "width": 720,
                "height": 150,
            },
            "html": "<p>Sport i jezik - o tome se do sada nije imalo mnogo uzbudljivog reći.</p>",
            "css": {
                "fontSize": "14px",
                "fontWeight": "400",
                "lineHeight": "1.5",
                "textAlign": "left",
            },
        },
        {
            "clientId": "target_3",
            "sourceClientId": "source_3",
            "targetLanguage": target_language,
            "translatedText": "Postojale su sportske reportaže, intervjui, komentari i još mnogo toga.",
            "targetBox": {
                "x": 80,
                "y": 380,
                "width": 760,
                "height": 140,
            },
            "html": "<p>Postojale su sportske reportaže, intervjui, komentari i još mnogo toga.</p>",
            "css": {
                "fontSize": "14px",
                "fontWeight": "400",
                "lineHeight": "1.5",
                "textAlign": "left",
            },
        },
    ]

    return source_blocks, translation_blocks


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

    source_blocks, translation_blocks = build_mock_ai_blocks(target_language)

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
