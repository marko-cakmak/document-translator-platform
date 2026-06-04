from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from document_translator.models import Document, DocumentPage, TranslationBlock
from document_translator.serializers import TranslationBlockSerializer


def get_int_value(data, key):
    try:
        return int(round(float(data.get(key))))
    except (TypeError, ValueError):
        return None


@api_view(["GET"])
def list_document_blocks(request, document_id):
    blocks = TranslationBlock.objects.filter(
        document_id=document_id,
    ).select_related("document", "page")

    serializer = TranslationBlockSerializer(blocks, many=True)

    return Response(serializer.data)


@api_view(["POST"])
def create_page_block(request, document_id, page_id):
    try:
        document = Document.objects.get(id=document_id)
    except Document.DoesNotExist:
        return Response(
            {"detail": "Document not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

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

    x = get_int_value(request.data, "x")
    y = get_int_value(request.data, "y")
    width = get_int_value(request.data, "width")
    height = get_int_value(request.data, "height")

    if x is None or y is None or width is None or height is None:
        return Response(
            {"detail": "x, y, width and height are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if width <= 0 or height <= 0:
        return Response(
            {"detail": "Selection width and height must be greater than zero."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    block = TranslationBlock.objects.create(
        document=document,
        page=page,
        bbox_x=x,
        bbox_y=y,
        bbox_width=width,
        bbox_height=height,
        block_type=request.data.get("block_type", TranslationBlock.BlockType.UNKNOWN),
        source=request.data.get("source", TranslationBlock.Source.MANUAL),
        source_text=request.data.get("source_text", ""),
        translated_text=request.data.get("translated_text", ""),
        confidence=request.data.get("confidence"),
    )

    serializer = TranslationBlockSerializer(block)

    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
def update_or_delete_block(request, document_id, block_id):
    try:
        block = TranslationBlock.objects.get(
            id=block_id,
            document_id=document_id,
        )
    except TranslationBlock.DoesNotExist:
        return Response(
            {"detail": "Translation block not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "DELETE":
        block.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    for field in [
        "block_type",
        "source",
        "source_text",
        "translated_text",
        "confidence",
    ]:
        if field in request.data:
            setattr(block, field, request.data[field])

    coordinate_fields = {
        "x": "bbox_x",
        "y": "bbox_y",
        "width": "bbox_width",
        "height": "bbox_height",
        "bbox_x": "bbox_x",
        "bbox_y": "bbox_y",
        "bbox_width": "bbox_width",
        "bbox_height": "bbox_height",
    }

    for input_field, model_field in coordinate_fields.items():
        if input_field in request.data:
            value = get_int_value(request.data, input_field)

            if value is not None:
                setattr(block, model_field, value)

    if block.bbox_width <= 0 or block.bbox_height <= 0:
        return Response(
            {"detail": "Block width and height must be greater than zero."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    block.save()

    serializer = TranslationBlockSerializer(block)

    return Response(serializer.data)
