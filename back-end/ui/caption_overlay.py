import cv2

def draw_caption(frame, word, sentence):
    cv2.rectangle(frame, (0, 0), (frame.shape[1], 90), (0, 0, 0), -1)

    cv2.putText(
        frame, f"Word: {word}",
        (20, 35),
        cv2.FONT_HERSHEY_SIMPLEX, 0.9,
        (0, 255, 0), 2
    )

    cv2.putText(
        frame, f"Sentence: {sentence}",
        (20, 75),
        cv2.FONT_HERSHEY_SIMPLEX, 0.7,
        (255, 255, 0), 2
    )

    return frame
