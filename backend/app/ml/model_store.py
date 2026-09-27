"""
Model Store — persist and load trained model artifacts.
Models are stored as pickle files in the MODEL_DIR directory.
"""
import os
import pickle
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.core.config import settings


class ModelStore:
    def __init__(self):
        self.model_dir = settings.MODEL_DIR
        os.makedirs(self.model_dir, exist_ok=True)
        self.model_path = os.path.join(self.model_dir, "model_bundle.pkl")
        self.metadata_path = os.path.join(self.model_dir, "metadata.json")
        self.versions_path = os.path.join(self.model_dir, "versions.json")

    def save_model(self, model_bundle: dict, metadata: dict):
        """Save the trained model bundle and update metadata."""
        with open(self.model_path, "wb") as f:
            pickle.dump(model_bundle, f, protocol=pickle.HIGHEST_PROTOCOL)

        metadata["saved_at"] = datetime.utcnow().isoformat()
        with open(self.metadata_path, "w") as f:
            json.dump(metadata, f, indent=2, default=str)

        # Append to version history
        versions = self.list_versions()
        versions.append(metadata)
        # Keep last 10 versions
        versions = versions[-10:]
        with open(self.versions_path, "w") as f:
            json.dump(versions, f, indent=2, default=str)

        print(f"[ModelStore] Model saved: version={metadata.get('version')}")

    def load_model(self) -> Optional[dict]:
        """Load the latest trained model bundle. Returns None if no model exists."""
        if not os.path.exists(self.model_path):
            return None
        try:
            with open(self.model_path, "rb") as f:
                return pickle.load(f)
        except Exception as e:
            print(f"[ModelStore] Failed to load model: {e}")
            return None

    def load_metadata(self) -> Optional[Dict[str, Any]]:
        """Load model metadata. Returns None if not available."""
        if not os.path.exists(self.metadata_path):
            return None
        try:
            with open(self.metadata_path, "r") as f:
                return json.load(f)
        except Exception:
            return None

    def list_versions(self) -> List[Dict[str, Any]]:
        """List all stored model versions."""
        if not os.path.exists(self.versions_path):
            return []
        try:
            with open(self.versions_path, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def model_exists(self) -> bool:
        return os.path.exists(self.model_path)

    def delete_model(self):
        """Remove model files (for testing)."""
        for path in [self.model_path, self.metadata_path]:
            if os.path.exists(path):
                os.remove(path)
