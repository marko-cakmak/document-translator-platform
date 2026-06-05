from document_translator.services.ai_providers.mock_provider import (
    build_mock_ai_blocks,
)


def get_ai_analysis_blocks(target_language):
    return build_mock_ai_blocks(target_language)
