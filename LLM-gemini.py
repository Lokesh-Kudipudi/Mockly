import os
from google import genai
from google.genai import types
import time


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
