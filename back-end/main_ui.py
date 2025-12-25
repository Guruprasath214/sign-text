import sys
import cv2
import threading
import pyttsx3
from PyQt5.QtWidgets import (
    QApplication, QLabel, QPushButton, QVBoxLayout, QWidget
)
from PyQt5.QtGui import QImage, QPixmap
from PyQt5.QtCore import Qt

from camera.hand_tracker import HandTracker
from sign_recognition.sign_predictor import predict_sign
from sentence.sentence_builder import SentenceBuilder
from ui.caption_overlay import draw_caption

class SignLanguageApp(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Sign Language to Caption (PyQt)")
        self.setGeometry(100, 100, 800, 600)

        self.video_label = QLabel()
        self.start_btn = QPushButton("Start Camera")
        self.stop_btn = QPushButton("Stop Camera")
        self.clear_btn = QPushButton("Clear Sentence")

        layout = QVBoxLayout()
        layout.addWidget(self.video_label)
        layout.addWidget(self.start_btn)
        layout.addWidget(self.stop_btn)
        layout.addWidget(self.clear_btn)
        self.setLayout(layout)

        self.start_btn.clicked.connect(self.start_camera)
        self.stop_btn.clicked.connect(self.stop_camera)
        self.clear_btn.clicked.connect(self.clear_sentence)

        self.cap = None
        self.tracker = HandTracker()
        self.builder = SentenceBuilder()
        self.engine = pyttsx3.init()
        self.engine.setProperty('rate', 150)
        self.running = False
        self.last_spoken = ""

    def start_camera(self):
        if self.running:
            return
        self.cap = cv2.VideoCapture(0)
        self.running = True
        self.thread = threading.Thread(target=self.update_frame)
        self.thread.start()

    def stop_camera(self):
        self.running = False
        if self.cap:
            self.cap.release()

    def clear_sentence(self):
        self.builder.clear()
        self.last_spoken = ""

    def update_frame(self):
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                continue

            result = self.tracker.process(frame)
            frame = self.tracker.draw(frame, result)

            sign = "No Hand"
            if result.multi_hand_landmarks:
                for hand_landmarks in result.multi_hand_landmarks:
                    sign = predict_sign(hand_landmarks)

            sentence = self.builder.update(sign)

            if sentence != self.last_spoken and len(sentence.split()) >= 2:
                self.engine.say(sentence)
                self.engine.runAndWait()
                self.last_spoken = sentence

            frame = draw_caption(frame, sign, sentence)

            # Convert to Qt image and display
            rgb_image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            h, w, ch = rgb_image.shape
            bytes_per_line = ch * w
            qt_image = QImage(rgb_image.data, w, h, bytes_per_line, QImage.Format_RGB888)
            pix = QPixmap.fromImage(qt_image)
            self.video_label.setPixmap(pix)

        self.cap.release()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = SignLanguageApp()
    window.show()
    sys.exit(app.exec_())
