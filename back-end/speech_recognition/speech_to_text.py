import whisper

class SpeechRecognizer:
    def __init__(self):
        self.model = whisper.load_model("base")

    def transcribe(self, audio_path="audio.wav"):
        result = self.model.transcribe(audio_path)
        return result["text"]
