import numpy as np
from joblib import load

model = load("sign_recognition/model.pkl")

def predict_sign(hand_landmarks):
    landmarks = []
    for lm in hand_landmarks.landmark:
        landmarks.extend([lm.x, lm.y])

    data = np.array(landmarks).reshape(1, -1)
    return model.predict(data)[0]
