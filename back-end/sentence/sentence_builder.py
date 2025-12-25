import time

class SentenceBuilder:
    def __init__(self):
        self.sentence = []
        self.last_sign = ""
        self.last_time = time.time()

    def update(self, sign):
        now = time.time()

        if sign != self.last_sign and sign != "UNKNOWN":
            if now - self.last_time > 1.2:
                self.sentence.append(sign)
                self.last_sign = sign
                self.last_time = now

        return " ".join(self.sentence)

    def clear(self):
        self.sentence = []
