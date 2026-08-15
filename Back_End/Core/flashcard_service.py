from __future__ import annotations

from typing import Any, Dict, List, Optional


class FlashcardService:
    """Small service for the Flashcard read path.

    It keeps the existing business logic intact and reduces the payload to only the
    fields the Flashcard UI actually renders.
    """

    @staticmethod
    def build_flashcard_page(vocab_items: List[Dict[str, Any]], progress_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        progress = progress_data or {}
        srs_map = progress.get("srs_items", {}) if isinstance(progress.get("srs_items", {}), dict) else {}

        vocabularies: List[Dict[str, Any]] = []
        for vocab in vocab_items:
            vocab_id = vocab.get("vocabId")
            srs_data = srs_map.get(vocab_id) if isinstance(srs_map, dict) else None
            vocabularies.append(
                {
                    "vocabId": vocab.get("vocabId"),
                    "word": vocab.get("word"),
                    "partOfSpeech": vocab.get("partOfSpeech"),
                    "phonetic": vocab.get("phonetic"),
                    "meaningVi": vocab.get("meaningVi"),
                    "exampleSentence": vocab.get("exampleSentence"),
                    "srs": FlashcardService._to_flashcard_srs(srs_data),
                }
            )

        return {
            "vocabularies": vocabularies,
            "flashcardCurrentIndex": int(progress.get("flashcardCurrentIndex", 0) or 0),
            "flashcardViewedCards": list(progress.get("flashcardViewedCards", []) or []),
        }

    @staticmethod
    def _to_flashcard_srs(srs_data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not isinstance(srs_data, dict):
            return None

        return {
            "ef": srs_data.get("ef"),
            "repetitions": srs_data.get("repetitions"),
            "interval": srs_data.get("interval"),
            "nextReviewDate": srs_data.get("nextReviewDate"),
            "lastReviewedAt": srs_data.get("lastReviewedAt"),
            "quality": srs_data.get("quality"),
        }
