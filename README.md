# AI Mock Interview Platform

This project is an AI-powered mock interview platform designed to simulate real interview scenarios using advanced speech-to-text (STT), text-to-speech (TTS), and large language model (LLM) technologies. It features a Python backend for audio processing and AI logic, and a Next.js frontend for user interaction.

## Features

- Real-time mock interview simulation
- Speech-to-text and text-to-speech integration
- Audio comparison and processing
- Modern, responsive frontend UI

## Project Structure

```
backend/   # Python backend for AI, audio, and server logic
frontend/  # Next.js frontend for the web interface
```

### Backend

- `main.py`, `server.py`: Main server and API endpoints
- `LLM-gemini.py`: LLM integration (Gemini)
- `TTS-*.py`, `STT-compare.py`, `vad-loop.py`: Audio processing modules
- `constants.py`, `pyproject.toml`: Config and dependencies

### Frontend

- `app/`: Next.js app directory (pages, layouts, interview flows)
- `public/`: Static assets
- `package.json`: Frontend dependencies

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+

### Backend Setup

1. Navigate to `backend/`:
   ```powershell
   cd backend
   ```
2. (Optional) Create and activate a virtual environment.
3. Install dependencies:
   ```powershell
   uv sync
   ```
4. Run the backend server:
   ```powershell
   uv run main.py
   ```

**NOTE** :- You need to install ffmpeg which is required by whisper model.

### Frontend Setup

1. Navigate to `frontend/`:
   ```powershell
   cd frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the development server:
   ```powershell
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- Start a new interview session.
- Interact with the AI interviewer using your microphone.

## License

[MIT](LICENSE)
