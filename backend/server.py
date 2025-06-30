import torch
from flask_socketio import SocketIO, emit, join_room
from flask import Flask, request
from faster_whisper import WhisperModel
from silero_vad import VADIterator
import numpy as np
import constants
import pyaudio


app = Flask(__name__)
app.config['CORS_HEADERS'] = 'Content-Type'

print("Loading WhisperX Model")
whisper_model = WhisperModel("tiny.en", device="cpu")

print("Loading VAD Model")
vad_model, _ = torch.hub.load(repo_or_dir="snakers4/silero-vad",
                              model="silero_vad",
                              trust_repo=True,
                              force_reload=False,
                              onnx=False)
vad_iterator = VADIterator(vad_model)

FRONTEND_URL = "http://localhost:3000"

sio = SocketIO(app, cors_allowed_origins=FRONTEND_URL)


def transcribe_audio(audioChunkBytes):
  """
  Funtion to Transcribe Audio Bytes into Text
  """
  audio_bytes = b"".join(audioChunkBytes)
  audio_np = np.frombuffer(
      audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0

  segments, _ = whisper_model.transcribe(audio_np, language="en")
  return " ".join([segment.text for segment in segments])


@sio.on('connect')
def handleConnect():
  pass


# --- Audio Stream Configuration ---
SAMPLING_RATE = constants.SAPLING_RATE  # VAD model expects 16000Hz
CHUNK_SIZE = constants.CHUNK_SIZE       # Number of audio frames per buffer
FORMAT = pyaudio.paInt16
CHANNELS = constants.CHANNELS

# --- VAD Configuration ---
# How many consecutive non-speech chunks to consider as end of speech
SILENCE_THRESHOLD_CHUNKS = constants.SILENCE_THRESHOLD_CHUNKS
# Probability threshold above which a chunk is considered speech
SPEECH_PROB_THRESHOLD = constants.SPEECH_PROB_THRESHOLD

states = {
    "is_recording": False,
    "recorded_chunks": [],
    "silent_chunks_count": 0
}


def processAudio():
  print("Processing Audio Bytes")
  vad_iterator.reset_states()

  print("Transcribing")
  audio_transcription = transcribe_audio(states["recorded_chunks"])
  print(f"Transcription :- {audio_transcription}")

  states["recorded_chunks"] = []
  states["is_recording"] = False
  pass


@sio.on('audioBytes')
def handleAudioBytes(audioChunkBytes):
  try:
    if not states['is_recording']:
      audio_chunk_np = np.frombuffer(audioChunkBytes, dtype=np.int16)
      audio_float32 = audio_chunk_np.astype(np.float32) / 32768.0
      speech_prob = vad_model(torch.from_numpy(
          audio_float32), SAMPLING_RATE).item()

      if speech_prob > SPEECH_PROB_THRESHOLD:
        states['is_recording'] = True

    if states["is_recording"]:
      emit("set-status-client", "Recording")
      states["recorded_chunks"].append(audioChunkBytes)
      audio_chunk_np = np.frombuffer(audioChunkBytes, dtype=np.int16)
      audio_float32 = audio_chunk_np.astype(np.float32) / 32768.0

      speech_dict = vad_iterator(torch.from_numpy(
          audio_float32), return_seconds=False)

      if speech_dict:
        if 'start' in speech_dict:
          states["silent_chunks_count"] = 0
      elif vad_model(torch.from_numpy(audio_float32), SAMPLING_RATE).item() > SPEECH_PROB_THRESHOLD:
        states["silent_chunks_count"] = 0
      else:
        states["silent_chunks_count"] += 1
        if states["silent_chunks_count"] >= SILENCE_THRESHOLD_CHUNKS:
          emit("audio-stop-client")
          emit("set-status-client", "Processing")
          processAudio()
          emit("audio-start-client")
  except Exception as e:
    print(f"An Error occured: {e}")
  pass


@sio.on("disconnect")
def handleDisconnect():
  pass


if __name__ == '__main__':
  sio.run(app, host='localhost', port=3001, debug=True)
