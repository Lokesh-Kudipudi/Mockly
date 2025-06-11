import whisper
import warnings

warnings.filterwarnings("ignore")

model = whisper.load_model("small.en")
result = model.transcribe("test.m4a")

print(result["text"])
