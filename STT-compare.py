from faster_whisper import WhisperModel
import whisper
import warnings
import time


warnings.filterwarnings("ignore")

faster_whisper_model = WhisperModel(
    "tiny.en", device="CPU", compute_type="int8")
whisper_model = whisper.load_model("tiny.en")

print("Transcribing using faster whisper tiny")
start = time.time()
segments, _ = faster_whisper_model.transcribe("audio-compare.m4a")
end = time.time()
print(f"Time taken: {end - start:.4f} seconds")

print("Transcribing using Whisper tiny")
start = time.time()
results = whisper_model.transcribe("audio-compare.m4a")
end = time.time()
print(f"Time taken: {end - start:.4f} seconds")


for segment in segments:
  print(segment.text, end=" ")
print()

print(results["text"])
