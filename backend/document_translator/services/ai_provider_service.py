from django.conf import settings

from document_translator.services.ai_providers.mock_provider import (
    MockAIProvider,
)

AI_PROVIDERS = {
    "mock": MockAIProvider,
}


def get_ai_provider():
    provider_name = getattr(settings, "AI_PROVIDER", "mock").lower()
    provider_class = AI_PROVIDERS.get(provider_name)

    if not provider_class:
        supported_providers = ", ".join(sorted(AI_PROVIDERS.keys()))
        raise ValueError(
            f"Unsupported AI_PROVIDER '{provider_name}'. "
            f"Supported providers: {supported_providers}."
        )

    return provider_class()


def get_ai_analysis_blocks(*, target_language, page=None):
    provider = get_ai_provider()

    return provider.analyze_page(
        target_language=target_language,
        page=page,
    )
