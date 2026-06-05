from document_translator.services.ai_providers.base import BaseAIProvider


class MockAIProvider(BaseAIProvider):
    def analyze_page(self, *, target_language, page=None):
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
