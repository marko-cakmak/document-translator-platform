from abc import ABC, abstractmethod


class BaseAIProvider(ABC):
    @abstractmethod
    def analyze_page(self, *, target_language, page=None):
        raise NotImplementedError
