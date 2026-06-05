from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from document_translator.models import DocumentPage
from document_translator.services.ocr_service import extract_text_from_page_selection


def get_int_value(data, key):
    try:
        return int(round(float(data.get(key))))
    except (TypeError, ValueError):
        return None


@api_view(["POST"])
def run_page_ocr(request, document_id, page_id):
    try:
        document_page = DocumentPage.objects.select_related("document").get(
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
    language = request.data.get("language") or document_page.document.source_language or "eng"

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

    if not document_page.image:
        return Response(
            {"detail": "Page image is missing."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        text = extract_text_from_page_selection(
            image_path=document_page.image.path,
            x=x,
            y=y,
            width=width,
            height=height,
            language=language,
        )
    except Exception as error:
        return Response(
            {
                "detail": "OCR failed.",
                "error": str(error),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {
            "text": text,
        }
    )