"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = "http://localhost:3001";
let socket;
let audioContext, workletNode, mediaStream;

async function startRecording() {
  audioContext = new AudioContext({ sampleRate: 16000 }); // Match backend
  await audioContext.audioWorklet.addModule("/processor.js");

  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  const source =
    audioContext.createMediaStreamSource(mediaStream);

  workletNode = new AudioWorkletNode(
    audioContext,
    "pcm-processor"
  );

  workletNode.port.onmessage = (event) => {
    const audioBuffer = event.data;
    socket.emit("audioBytes", new Uint8Array(audioBuffer));
  };

  source.connect(workletNode).connect(audioContext.destination);
}

function stopRecording() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
  }
  if (audioContext) {
    audioContext.close();
  }
}

export default function InterviewForm() {
  const [transcript, setTranscript] = useState([]);
  const [status, setStatus] = useState("Listening"); // Listening, Recording, Processing
  const [mode, setMode] = useState("recording"); // idle, recording

  useEffect(() => {
    socket = io(BACKEND_URL);

    socket.on("set-status-client", (satus) => {
      console.log("Status: ", satus);
      setStatus(() => satus);
    });

    socket.on("audio-start-client", () => {
      setMode(() => "recording");
    });

    socket.on("audio-stop-client", () => {
      setMode(() => "idle");
      stopRecording();
    });

    socket.on("transcript-user-client", (data) => {
      setTranscript((prev) => [
        ...prev,
        { role: "Candidate", content: data },
      ]);
    });

    socket.on("transcript-interviewer-client", (data) => {
      setTranscript((prev) => [
        ...prev,
        { role: "Interviewer", content: data },
      ]);
    });

    socket.on("audio-stream-client", (data) => {
      const blob = new Blob([data], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        socket.emit("audio-stream-complete");
      };
      audio.play();
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (mode == "recording") {
      startRecording();
      setStatus(() => "Listening");
    }
  }, [mode]);

  return (
    <main className="flex-grow flex items-center justify-center">
      {/* Left Panel: Interviewer Info and Status */}
      <div className="flex flex-col md:w-1/3  px-6 rounded-xl">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/avatar.png"
            alt="Alex, Software Engineer"
            width={96}
            height={96}
            className="w-24 h-24 rounded-full border-2 border-blue-500 mb-4"
          />
          <h2 className="text-2xl font-bold text-white">
            Interview with Alex
          </h2>
          <p className="text-base text-gray-400">
            Software Engineer
          </p>
        </div>

        <div className="my-8">
          <div className="flex items-center justify-center bg-gray-700 text-gray-200 p-4 rounded-lg font-medium">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full mr-3 animate-pulse"></span>
            Status: {status}
          </div>
        </div>

        <button
          onClick={() => {
            window.location.href = "/interview/end";
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
        >
          End Call
        </button>
      </div>

      {/* Right Panel: Transcript */}
      <div className="md:w-2/3  rounded-xl max-h-[80vh] self-start overflow-auto scrollbar-none [&::-webkit-scrollbar]:hidden py-6 px-4">
        <h1 className="text-3xl font-bold text-white mb-5 pb-3 border-b border-gray-700">
          Interview Transcript
        </h1>
        <div className="space-y-6 text-gray-300">
          {transcript.map((item, index) => {
            return (
              <div key={index}>
                <p className="font-bold text-white">
                  {item.role}:
                </p>
                <p
                  className={
                    item.role == "Interviewer" ? "italic" : ""
                  }
                >
                  {item.content}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
