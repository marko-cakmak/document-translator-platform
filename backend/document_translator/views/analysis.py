from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from document_translator.models import (
    DocumentBlock,
    DocumentBlockTranslation,
    DocumentPage,
    DocumentPageAnalysis,
)


def get_int_from_box(box, key, default=0):
    try:
        return int(round(float(box.get(key, default))))
    except (TypeError, ValueError):
        return default


def get_next_ai_analysis_name(document_id, page):
    current_ai_count = DocumentPageAnalysis.objects.filter(
        document_id=document_id,
        page=page,
        source=DocumentPageAnalysis.Source.AI,
    ).count()

    return f"AI analysis {current_ai_count + 1}"


def create_block_for_analysis(document_id, page, analysis, source_block):
    source_box = source_block.get("sourceBox", {})

    return DocumentBlock.objects.create(
        document_id=document_id,
        page=page,
        analysis=analysis,
        client_id=source_block.get("clientId", ""),
        block_type=source_block.get(
            "blockType",
            DocumentBlock.BlockType.UNKNOWN,
        ),
        source=DocumentBlock.Source.AI,
        source_text=source_block.get("sourceText", ""),
        bbox_x=get_int_from_box(source_box, "x"),
        bbox_y=get_int_from_box(source_box, "y"),
        bbox_width=get_int_from_box(source_box, "width"),
        bbox_height=get_int_from_box(source_box, "height"),
        confidence=source_block.get("confidence"),
    )


def create_translation_for_block(block, translation_block):
    target_box = translation_block.get("targetBox", {})

    return DocumentBlockTranslation.objects.create(
        block=block,
        client_id=translation_block.get("clientId", ""),
        target_language=translation_block.get("targetLanguage", ""),
        translated_text=translation_block.get("translatedText", ""),
        target_x=get_int_from_box(target_box, "x"),
        target_y=get_int_from_box(target_box, "y"),
        target_width=get_int_from_box(target_box, "width"),
        target_height=get_int_from_box(target_box, "height"),
        html=translation_block.get("html", ""),
        css=translation_block.get("css", {}),
        status=DocumentBlockTranslation.Status.DRAFT,
    )


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
    try:
        page = DocumentPage.objects.select_related("document").get(
            id=page_id,
            document_id=document_id,
        )
    except DocumentPage.DoesNotExist:
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
            name=get_next_ai_analysis_name(document_id=document_id, page=page),
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
