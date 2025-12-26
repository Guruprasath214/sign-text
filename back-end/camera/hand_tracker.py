import cv2
# Use legacy import for mediapipe 0.10.30+
try:
    from mediapipe.python.solutions import hands as mp_hands
    from mediapipe.python.solutions import drawing_utils as mp_drawing
except ImportError:
    # Fallback for older mediapipe versions
    import mediapipe as mp
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils

class HandTracker:
    def __init__(self):
        self.mp_hands = mp_hands
        self.hands = mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        self.drawer = mp_drawing

    def process(self, frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        return self.hands.process(rgb)

    def draw(self, frame, result):
        if result.multi_hand_landmarks:
            for hand_landmarks in result.multi_hand_landmarks:
                self.drawer.draw_landmarks(
                    frame,
                    hand_landmarks,
                    self.mp_hands.HAND_CONNECTIONS
                )
        return frame
