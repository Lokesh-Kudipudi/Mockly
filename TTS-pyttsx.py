import pyttsx3
import time

engine = pyttsx3.init()

voices = engine.getProperty('voices')
engine.setProperty('voice', voices[1].id)

engine.say("Without this playing with fantasy no creative work has ever yet come to birth. The debt we owe to the play of the imagination is incalculable.")
engine.runAndWait()
