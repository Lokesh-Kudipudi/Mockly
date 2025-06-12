import torch
import pyaudio
import numpy as np
from silero_vad import VADIterator
import constants
from faster_whisper import WhisperModel
# import whisper
import wave
import warnings
import os
from google import genai
from google.genai import types
import pyttsx3

warnings.filterwarnings("ignore")

print("Loading Whisper Model")
# whisper_model = whisper.load_model("tiny")
whisper_model = WhisperModel("tiny.en", device="cpu")

print("Loading VAD Model")
vad_model, _ = torch.hub.load(repo_or_dir="snakers4/silero-vad",
                              model="silero_vad",
                              trust_repo=True,
                              force_reload=False,
                              onnx=False)
vad_iterator = VADIterator(vad_model)

print("Initializing Chat Model")


def initialize_chatmodel():
  client = genai.Client(
      api_key=os.environ.get("GEMINI_API_KEY"),
  )

  model = "gemini-2.0-flash-lite"

  generate_content_config = types.GenerateContentConfig(
      response_mime_type="text/plain",
      system_instruction="You are a conversational assistant whose output will be read by a Text-to-Speech (TTS) system. Your responses must be clear, natural, and free from any special formatting. Output Rules: Do not use Markdown formatting like **bold**, *italics*, backticks, or code blocks. Avoid symbols like dashes (--), underscores (_), emojis, or bullet points. Speak naturally. Use complete sentences and conversational phrasing. If you list items, format them using natural speech: for example, 'First, … Second, … Finally, …' If you need to emphasize something, use words like important, note that, or keep in mind, not formatting. No special characters unless needed for pronunciation (like apostrophes or punctuation for clarity). Example:  Don't say: 'Here are some tips: Practice, Pause, and Pace.' Say: 'Here are some tips. First, practice regularly. Second, remember to pause between ideas. And third, keep a steady pace.'"
  )

  chat_model = client.chats.create(
      model=model, config=generate_content_config)
  return chat_model


chat_model = initialize_chatmodel()

print("Iinitializing TTS Model")
tts_engine = pyttsx3.init()
voices = tts_engine.getProperty('voices')
tts_engine.setProperty('voice', voices[1].id)


def send_message(chat_model, message):
  response = chat_model.send_message(message)
  return response


def get_chat_history(chat_model):
  chat_history = chat_model.get_history()
  return chat_history


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

  # audio_np = whisper.pad_or_trim(audio_np)
  # mel = whisper.log_mel_spectrogram(audio_np).to(whisper_model.device)
  # options = whisper.DecodingOptions(language="en")
  # result = whisper.decode(whisper_model, mel, options)
  # print("Transcription:", result.text)

  segments, _ = whisper_model.transcribe(audio_np, language="en")
  return " ".join([segment.text for segment in segments])


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
      audio_transcription = transcribe_audio(recorded_chunks, SAMPLING_RATE)
      print(f"Transcription:- {audio_transcription}")

      llm_response = send_message(chat_model, audio_transcription)
      print(llm_response.text)

      tts_engine.say(llm_response.text)
      tts_engine.runAndWait()
      chat_history = get_chat_history(chat_model)

      print(chat_history)

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
