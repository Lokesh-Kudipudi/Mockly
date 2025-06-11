import torch
import pyaudio
import time
import numpy as np
from silero_vad import VADIterator
import constants
import whisper
import wave
import warnings

warnings.filterwarnings("ignore")

print("Loading Whisper Model")
whisper_model = whisper.load_model("tiny")

print("Loading VAD Model")
vad_model, _ = torch.hub.load(repo_or_dir="snakers4/silero-vad",
                              model="silero_vad",
                              trust_repo=True,
                              force_reload=False,
                              onnx=False)
vad_iterator = VADIterator(vad_model)


def save_audio_to_wav(audio_chunks, sample_rate, filename="output.wav"):
  with wave.open(filename, 'wb') as wf:
    wf.setnchannels(1)  # mono
    wf.setsampwidth(2)  # 2 bytes for int16
    wf.setframerate(sample_rate)
    wf.writeframes(b''.join(audio_chunks))


def transcribe_audio(audioChunkBytes, sample_rate):
  # save_audio_to_wav(audioChunkBytes, sample_rate)
  audio_bytes = b"".join(audioChunkBytes)
  audio_np = np.frombuffer(
      audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
  audio_np = whisper.pad_or_trim(audio_np)

  mel = whisper.log_mel_spectrogram(audio_np).to(whisper_model.device)
  options = whisper.DecodingOptions(language="en")
  result = whisper.decode(whisper_model, mel, options)

  print("Transcription:", result.text)
  pass


def start_vad_loop():
  # --- Audio Stream Configuration ---
  SAMPLING_RATE = constants.SAPLING_RATE  # VAD model expects 16000Hz
  CHUNK_SIZE = constants.CHUNK_SIZE       # Number of audio frames per buffer
  FORMAT = pyaudio.paInt16
  CHANNELS = 1

  # --- VAD Configuration ---
  # How many consecutive non-speech chunks to consider as end of speech
  SILENCE_THRESHOLD_CHUNKS = constants.SILENCE_THRESHOLD_CHUNKS
  # Probability threshold above which a chunk is considered speech
  SPEECH_PROB_THRESHOLD = constants.SPEECH_PROB_THRESHOLD

  # Initialize PyAudio
  p = pyaudio.PyAudio()
  stream = None

  try:
    # Open microphone stream
    stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=SAMPLING_RATE,
                    input=True,
                    frames_per_buffer=CHUNK_SIZE)

    print("\n--- Listening... ---")

    while True:  # Main loop to wait for speech and record
      is_recording = False
      silent_chunks_count = 0
      recorded_chunks = []

      # --- 1. Wait for speech to start ---
      while not is_recording:
        audio_chunk_bytes = stream.read(CHUNK_SIZE)
        recorded_chunks.append(audio_chunk_bytes)

        # Convert byte data to numpy array for VAD
        audio_chunk_np = np.frombuffer(audio_chunk_bytes, dtype=np.int16)

        # Convert to float32 tensor as expected by the model
        audio_float32 = audio_chunk_np.astype(np.float32) / 32768.0

        # Get speech probability
        speech_prob = vad_model(torch.from_numpy(
            audio_float32), SAMPLING_RATE).item()

        if speech_prob > SPEECH_PROB_THRESHOLD:
          print("Recording started.")
          is_recording = True

      # --- 2. Record while speech is detected, until silence ---
      while is_recording:
        audio_chunk_bytes = stream.read(CHUNK_SIZE)
        recorded_chunks.append(audio_chunk_bytes)
        audio_chunk_np = np.frombuffer(audio_chunk_bytes, dtype=np.int16)
        audio_float32 = audio_chunk_np.astype(np.float32) / 32768.0

        speech_dict = vad_iterator(torch.from_numpy(
            audio_float32), return_seconds=False)

        if speech_dict:
          # 'start' means speech was detected, 'end' means speech ended.
          if 'start' in speech_dict:
            # Reset silence counter if speech is detected again
            silent_chunks_count = 0
        elif vad_model(torch.from_numpy(audio_float32), SAMPLING_RATE).item() > SPEECH_PROB_THRESHOLD:
          silent_chunks_count = 0
        else:
          # This chunk is considered silence
          silent_chunks_count += 1
          if silent_chunks_count >= SILENCE_THRESHOLD_CHUNKS:
            print("Silence detected (threshold reached).")
            is_recording = False  # Stop recording

      # --- 3. Stop recording and process ---
      print("Recording stopped.")
      vad_iterator.reset_states()  # Reset model state for the next utterance

      print("Transcribing")
      transcribe_audio(recorded_chunks, SAMPLING_RATE)
      print("\n--- Listening again... ---")

  except KeyboardInterrupt:
    print("\nStopping script.")
  except Exception as e:
    print(f"An error occurred: {e}")
  finally:
    # Clean up
    if stream is not None:
      stream.stop_stream()
      stream.close()
    if p is not None:
      p.terminate()
    print("Resources released.")
  pass


def main():
  start_vad_loop()
  pass


if __name__ == '__main__':
  main()
