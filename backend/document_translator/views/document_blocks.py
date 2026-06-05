from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from document_translator.models import (
    DocumentBlock,
    DocumentBlockTranslation,
    DocumentPage,
)


def get_int_from_box(box, key, default=0):
    try:
        return int(round(float(box.get(key, default))))
    except (TypeError, ValueError):
        return default


def serialize_source_block(block):
    return {
        "id": block.id,
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


@api_view(["GET"])
def list_page_blocks(request, document_id, page_id):
    try:
        page = DocumentPage.objects.get(
            id=page_id,
            document_id=document_id,
        )
    except DocumentPage.DoesNotExist:
        return Response(
            {"detail": "Document page not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    blocks = (
        DocumentBlock.objects
        .filter(document_id=document_id, page=page)
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

    return Response(
        {
            "documentId": document_id,
            "pageId": page.id,
            "pageNumber": page.page_number,
            "imageWidth": page.width,
            "imageHeight": page.height,
            "sourceBlocks": source_blocks,
            "translationBlocks": translation_blocks,
        }
    )


def get_or_create_block(document_id, page, source_block):
    client_id = source_block.get("clientId", "")
    source_box = source_block.get("sourceBox", {})

    existing_block = None

    if client_id:
        existing_block = DocumentBlock.objects.filter(
            document_id=document_id,
            page=page,
            client_id=client_id,
        ).first()

    block_data = {
        "document_id": document_id,
        "page": page,
        "client_id": client_id,
        "block_type": source_block.get(
            "blockType",
            DocumentBlock.BlockType.UNKNOWN,
        ),
        "source": DocumentBlock.Source.AI,
        "source_text": source_block.get("sourceText", ""),
        "bbox_x": get_int_from_box(source_box, "x"),
        "bbox_y": get_int_from_box(source_box, "y"),
        "bbox_width": get_int_from_box(source_box, "width"),
        "bbox_height": get_int_from_box(source_box, "height"),
        "confidence": source_block.get("confidence"),
    }

    if existing_block:
        for field, value in block_data.items():
            setattr(existing_block, field, value)

        existing_block.save()
        return existing_block

    return DocumentBlock.objects.create(**block_data)


def get_or_create_translation(block, translation_block):
    client_id = translation_block.get("clientId", "")
    target_box = translation_block.get("targetBox", {})

    existing_translation = None

    if client_id:
        existing_translation = DocumentBlockTranslation.objects.filter(
            block=block,
            client_id=client_id,
        ).first()

    translation_data = {
        "block": block,
        "client_id": client_id,
        "target_language": translation_block.get("targetLanguage", ""),
        "translated_text": translation_block.get("translatedText", ""),
        "target_x": get_int_from_box(target_box, "x"),
        "target_y": get_int_from_box(target_box, "y"),
        "target_width": get_int_from_box(target_box, "width"),
        "target_height": get_int_from_box(target_box, "height"),
        "html": translation_block.get("html", ""),
        "css": translation_block.get("css", {}),
        "status": DocumentBlockTranslation.Status.DRAFT,
    }

    if existing_translation:
        for field, value in translation_data.items():
            setattr(existing_translation, field, value)

        existing_translation.save()
        return existing_translation

    return DocumentBlockTranslation.objects.create(**translation_data)


@api_view(["POST"])
def save_page_analysis_block(request, document_id, page_id):
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

    source_block = request.data.get("sourceBlock")
    translation_block = request.data.get("translationBlock")

    if not source_block or not translation_block:
        return Response(
            {"detail": "sourceBlock and translationBlock are required."},
            status=status.HTTP_400_BAD_REQUEST,
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
            "sourceBlockId": block.id,
            "translationBlockId": translation.id,
            "sourceClientId": block.client_id,
            "translationClientId": translation.client_id,
            "status": "saved",
        },
        status=status.HTTP_201_CREATED,
    )
