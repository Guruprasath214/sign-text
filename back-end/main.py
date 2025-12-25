import cv2
import pyttsx3

from camera.hand_tracker import HandTracker
from sign_recognition.sign_predictor import predict_sign
from sentence.sentence_builder import SentenceBuilder
from ui.caption_overlay import draw_caption

def main():
    cap = cv2.VideoCapture(0)
    tracker = HandTracker()
    builder = SentenceBuilder()

    engine = pyttsx3.init()
    engine.setProperty('rate', 150)

    last_spoken = ""

    while True:
        success, frame = cap.read()
        if not success:
            break

        result = tracker.process(frame)
        frame = tracker.draw(frame, result)

        sign = "No Hand"

        if result.multi_hand_landmarks:
            for hand_landmarks in result.multi_hand_landmarks:
                sign = predict_sign(hand_landmarks)

        sentence = builder.update(sign)

        if sentence != last_spoken and len(sentence.split()) >= 2:
            engine.say(sentence)
            engine.runAndWait()
            last_spoken = sentence

        frame = draw_caption(frame, sign, sentence)
        cv2.imshow("Sign Language to Caption", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        if key == ord('c'):
            builder.clear()
            last_spoken = ""

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
