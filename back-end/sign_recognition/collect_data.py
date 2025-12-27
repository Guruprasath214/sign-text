import cv2
import mediapipe as mp
import numpy as np
import os

SIGN_NAME = "Clock"   # Change this for each sign
SAMPLES = 200

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1)
cap = cv2.VideoCapture(0)

data = []
count = 0

os.makedirs("dataset", exist_ok=True)

while count < SAMPLES:
    ret, frame = cap.read()
    if not ret:
        break

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb)

    if result.multi_hand_landmarks:
        for hand in result.multi_hand_landmarks:
            landmarks = []
            for lm in hand.landmark:
                landmarks.extend([lm.x, lm.y])
            data.append(landmarks)
            count += 1

    cv2.putText(frame, f"Collecting {SIGN_NAME}: {count}/{SAMPLES}",
                (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
    cv2.imshow("Collect Data", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

np.save(f"dataset/{SIGN_NAME}.npy", np.array(data))
cap.release()
cv2.destroyAllWindows()
