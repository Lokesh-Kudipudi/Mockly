# VAD Settings
SAPLING_RATE = 16000  # VAD model expects 16000Hz
CHUNK_SIZE = 512  # Number of audio frames per buffer
CHANNELS = 1
# How many consecutive non-speech chunks to consider as end of speech 30 = 1 second
SILENCE_THRESHOLD_CHUNKS = 60
# Probability threshold above which a chunk is considered speech
SPEECH_PROB_THRESHOLD = 0.5

SAPLING_RATE_TTS = 24000
