from kokoro import KPipeline
import numpy as np
import sounddevice as sd
import warnings
import time

warnings.filterwarnings("ignore")

# Initialize the pipeline with your language code (e.g., 'a' for American English)
pipeline = KPipeline(lang_code='a', repo_id='hexgrad/Kokoro-82M', trf=True)

# Your input text
text = "Without this playing with fantasy no creative work has ever yet come to birth. The debt we owe to the play of the imagination is incalculable."

# Generate audio using a specific voice (e.g., 'af_heart')
generator = pipeline(text, voice='af_heart', speed=1)

audio_list = []
start = time.time()
for _, _, audio in generator:
  audio_list.append(audio)
end = time.time()
print(f"Time taken: {end - start:.4f} seconds")

# Concatenate all audio arrays into one
full_audio = np.concatenate(audio_list)

with sd.OutputStream(samplerate=24000, channels=1, dtype='float32') as stream:
  if full_audio.dtype != np.float32:
    full_audio = full_audio.astype(np.float32) / np.iinfo(full_audio.dtype).max
  stream.write(full_audio)
