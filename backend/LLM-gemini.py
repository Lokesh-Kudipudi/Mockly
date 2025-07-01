import os
from google import genai
from google.genai import types
import time

system_prompt = """
You are an AI Interviewer. Conduct a mock interview for the following candidate:

Candidate Name: {{CANDIDATE\_NAME}}
Role Applied For: {{JOB\_ROLE}}
Experience Level: {{EXPERIENCE\_LEVEL}}
Key Skills: {{SKILLS\_LIST}}

Follow these rules:

1. Start with a short, polite greeting using the candidate's name.
2. Ask one interview question at a time, relevant to the job role and candidate's experience.
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

  model = "gemini-2.0-flash-lite"

  generate_content_config = types.GenerateContentConfig(
      response_mime_type="text/plain",
  )

  chat_model = client.chats.create(
      model=model, config=generate_content_config)
  return chat_model


def send_message(chat_model, message):
  response = chat_model.send_message(message)
  return response


def get_chat_history(chat_model):
  chat_history = chat_model.get_history()
  return chat_history


def main():
  chat_model = initialize_chatmodel()
  while True:
    try:
      x = input("Enter your Message: ")
      if x == '-1':
        chat_history = get_chat_history(chat_model)
        print(chat_history)
      else:
        start = time.time()
        response = send_message(chat_model, x)
        end = time.time()
        print(response.text)
        print(f"Latency - {end - start:.2f}")
    except KeyboardInterrupt as e:
      break


if __name__ == "__main__":
  main()
