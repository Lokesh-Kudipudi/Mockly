import torch
from flask_socketio import SocketIO, emit, join_room
from flask import Flask, request
from faster_whisper import WhisperModel
from silero_vad import VADIterator
import numpy as np
import constants
import pyaudio
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()
FRONTEND_URL = "http://localhost:3000"

app = Flask(__name__)
CORS(app, origins=[FRONTEND_URL])
# app.config['CORS_HEADERS'] = 'Content-Type'

sio = SocketIO(app, cors_allowed_origins=FRONTEND_URL)

states = {
    "is_recording": False,
    "recorded_chunks": [],
    "silent_chunks_count": 0
}
client_chat_models = {}

print("Loading WhisperX Model")
whisper_model = WhisperModel("tiny.en", device="cpu")

print("Loading VAD Model")
vad_model, _ = torch.hub.load(repo_or_dir="snakers4/silero-vad",
                              model="silero_vad",
                              trust_repo=True,
                              force_reload=False,
                              onnx=False)
vad_iterator = VADIterator(vad_model)

system_prompt = """
You are an AI Interviewer. Conduct a mock interview for the following candidate:

Candidate Name: <<candidate_name>>
Role Applied For: <<role>>
Experience Level: <<experience_level>>
Round: <<round>>
Difficulty: <<difficulty>>
Number of Questions: <<candidate_name>>

Follow these rules:

1. Start with a short, polite greeting using the candidates name.
2. Ask one interview question at a time, relevant to the job role and candidates experience.
3. Use short, clear, natural language suitable for Text-to-Speech (TTS).
4. Keep each question concise—no more than 2 sentences.
5. Do not give feedback, explanations, or answers.
6. Pause after each question to allow the user to respond.
7. Maintain a professional but friendly tone.
8. Do not break character.

Begin the interview after this message.
"""


def initialize_chatmodel():
  client = genai.Client(
      api_key=os.environ.get("GEMINI_API_KEY"),
  )

  prompt = system_prompt
  prompt = prompt.replace("<<candidate_name>>",
                          states.get("candidate_name", ""))
  prompt = prompt.replace("<<experience_level>>",
                          states.get("experience_level", ""))
  prompt = prompt.replace("<<role>>", states.get("role", ""))
  prompt = prompt.replace("<<round>>", states.get("round", ""))
  prompt = prompt.replace("<<difficulty_level>>",
                          states.get("difficulty_level", ""))
  prompt = prompt.replace("<<number_of_questions>>", str(
      states.get("number_of_questions", "")))

  model = "gemini-2.0-flash-lite"

  generate_content_config = types.GenerateContentConfig(
      response_mime_type="text/plain",
      system_instruction=prompt
  )

  chat_model = client.chats.create(
      model=model, config=generate_content_config)

  return chat_model


def send_message(message):
  chat_model = client_chat_models.get(states["userId"])
  response = chat_model.send_message(message)
  return response.text


def transcribe_audio(audioChunkBytes):
  """
  Funtion to Transcribe Audio Bytes into Text
  """
  audio_bytes = b"".join(audioChunkBytes)
  audio_np = np.frombuffer(
      audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0

  segments, _ = whisper_model.transcribe(audio_np, language="en")
  return " ".join([segment.text for segment in segments])


@app.route("/api/initializeChatModel", methods=["POST"])
def handleInitializeChatModelRoute():
  try:
    data = request.get_json()
    states["candidate_name"] = data["name"]
    states["experience_level"] = data["experienceLevel"]
    states["role"] = data["role"]
    states["round"] = data["round"]
    states["difficulty_level"] = data["difficulty"]
    states["number_of_questions"] = data["noOfQuestions"]
    states["userId"] = data["userId"]

    chat_model = initialize_chatmodel()
    client_chat_models[states["userId"]] = chat_model
    return {"status": "success"}
  except Exception as e:
    print(e)
    return {"status": "fail", "message": "Error Occured"}


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


def processAudio():
  print("Processing Audio Bytes")
  vad_iterator.reset_states()

  print("Transcribing")
  audio_transcription = transcribe_audio(states["recorded_chunks"])
  print(f"Transcription :- {audio_transcription}")

  states["recorded_chunks"] = []
  states["is_recording"] = False
  return audio_transcription


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
          audio_transcription = processAudio()
          llm_reply = send_message(audio_transcription)
          print(llm_reply)
          emit("audio-start-client")
  except Exception as e:
    print(f"An Error occured: {e}")
  pass


@sio.on("disconnect")
def handleDisconnect():
  pass


if __name__ == '__main__':
  sio.run(app, host='localhost', port=3001, debug=True)
