import os
import pickle
import numpy as np

# Resolve model path relative to this file
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_MODEL_PATH = os.path.join(_SCRIPT_DIR, "model.pkl")

_MODEL = None

def _load_model():
    global _MODEL
    if _MODEL is None:
        if not os.path.isfile(_MODEL_PATH):
            raise FileNotFoundError(
                f"Model file not found at {_MODEL_PATH}. "
                "Train a model via train_collected_npy.py, train_from_dataset.py, or train_conversation_signs.py."
            )
        with open(_MODEL_PATH, "rb") as f:
            _MODEL = pickle.load(f)
    return _MODEL

def predict_sign(hand_landmarks):
    """
    Predict a sign from MediaPipe hand_landmarks.

    Supports models trained with:
      - 42 features: 21 landmarks * (x, y)
      - 63 features: 21 landmarks * (x, y, z)
      - 126 features: 2 hands * 21 landmarks * (x, y, z) (second hand zero-padded)
    """
    model = _load_model()

    # Build feature vectors
    vec_xy = []
    vec_xyz = []
    # Only the first hand's landmarks are passed in this function
    # MediaPipe hand has 21 landmarks
    for lm in hand_landmarks.landmark[:21]:
        vec_xy.extend([lm.x, lm.y])
        # Some pipelines may not have z; default to 0.0 if missing
        z = getattr(lm, "z", 0.0)
        vec_xyz.extend([lm.x, lm.y, z])

    expected = getattr(model, "n_features_in_", None)

    if expected == 63:
        vec = vec_xyz
    elif expected == 126:
        # Pad a second hand (zeros) to reach 126 if only one hand provided
        vec = vec_xyz + [0.0] * (126 - len(vec_xyz))
    else:
        # Default to 42 (x, y) if model doesn't expose n_features_in_
        expected = 42 if expected is None else expected
        vec = vec_xy

    # Ensure correct length via pad/truncate
    if len(vec) < expected:
        vec = vec + [0.0] * (expected - len(vec))
    elif len(vec) > expected:
        vec = vec[:expected]

    data = np.array(vec, dtype=np.float32).reshape(1, -1)
    return model.predict(data)[0]
