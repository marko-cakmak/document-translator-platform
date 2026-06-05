from PIL import Image, ImageFilter, ImageOps
import pytesseract


LANGUAGE_MAP = {
    "en": "eng",
    "de": "deu",
    "sr": "srp",
    "fr": "eng",
    "es": "eng",
}


def normalize_ocr_language(language: str) -> str:
    if not language:
        return "eng"

    return LANGUAGE_MAP.get(language.lower(), "eng")


def preprocess_image_for_ocr(image: Image.Image) -> Image.Image:
    image = image.convert("L")
    image = ImageOps.autocontrast(image)

    width, height = image.size
    image = image.resize((width * 2, height * 2))

    image = image.filter(ImageFilter.SHARPEN)

    image = image.point(lambda pixel: 255 if pixel > 180 else 0)

    return image


def extract_text_from_page_selection(
    image_path: str,
    x: int,
    y: int,
    width: int,
    height: int,
    language: str = "eng",
) -> str:
    with Image.open(image_path) as image:
        image_width, image_height = image.size

        crop_x = max(0, min(x, image_width))
        crop_y = max(0, min(y, image_height))
        crop_width = max(1, min(width, image_width - crop_x))
        crop_height = max(1, min(height, image_height - crop_y))

        cropped_image = image.crop(
            (
                crop_x,
                crop_y,
                crop_x + crop_width,
                crop_y + crop_height,
            )
        )

        processed_image = preprocess_image_for_ocr(cropped_image)

        ocr_language = normalize_ocr_language(language)

        text = pytesseract.image_to_string(
            processed_image,
            lang=ocr_language,
            config="--oem 3 --psm 6",
        )

        return text.strip()