"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = "http://localhost:3001";
let socket;
let audioContext, workletNode, mediaStream;

export default function InterviewForm() {
  const [transcript, setTranscript] = useState([]);
  const [status, setStatus] = useState("Listening"); // Listening, Recording, Processing
  const [mode, setMode] = useState("recording"); // recording, monitoring
  const [isSpeaking, setIsSpeaking] = useState(false);
  const playbackContextRef = useRef(null);
  const playbackNodeRef = useRef(null);
  const playbackEndedRef = useRef(false);
  const lastInterviewerIndexRef = useRef(null);
  const modeRef = useRef(mode);
  const isSpeakingRef = useRef(isSpeaking);
  const bargeInStateRef = useRef({
    consecutive: 0,
    lastTriggeredAt: 0,
    triggered: false,
  });
  const AUTO_BARGE_IN_ENABLED = true;
  const AUTO_BARGE_IN_THRESHOLD = 0.02;
  const AUTO_BARGE_IN_FRAMES = 4;
  const AUTO_BARGE_IN_COOLDOWN_MS = 1200;

  const markLastInterviewerInterrupted = () => {
    const index = lastInterviewerIndexRef.current;
    if (index === null || index === undefined) {
      return;
    }

    setTranscript((prev) => {
      if (!prev[index] || prev[index].role !== "Interviewer") {
        return prev;
      }
      if (prev[index].interrupted) {
        return prev;
      }
      const next = [...prev];
      next[index] = { ...next[index], interrupted: true };
      return next;
    });
  };

  const handlePlaybackDrained = () => {
    if (!playbackEndedRef.current) {
      return;
    }

    playbackEndedRef.current = false;
    setIsSpeaking(false);
    socket.emit("audio-stream-complete");
  };

  const ensurePlaybackReady = async (sampleRate) => {
    const desiredSampleRate = sampleRate || 24000;
    const needsRebuild =
      !playbackContextRef.current ||
      playbackContextRef.current.sampleRate !== desiredSampleRate;

    if (needsRebuild) {
      if (playbackContextRef.current) {
        await playbackContextRef.current.close();
      }
      playbackContextRef.current = new AudioContext({
        sampleRate: desiredSampleRate,
      });
      await playbackContextRef.current.audioWorklet.addModule(
        "/player-processor.js",
      );
      const node = new AudioWorkletNode(
        playbackContextRef.current,
        "pcm-player",
      );
      node.port.onmessage = (event) => {
        if (event.data?.type === "drained") {
          handlePlaybackDrained();
        }
      };
      node.connect(playbackContextRef.current.destination);
      playbackNodeRef.current = node;
    } else if (playbackContextRef.current.state === "suspended") {
      await playbackContextRef.current.resume();
    }
  };

  const resetPlaybackBuffer = () => {
    playbackEndedRef.current = false;
    if (playbackNodeRef.current) {
      playbackNodeRef.current.port.postMessage({ type: "reset" });
    }
  };

  const stopPlayback = () => {
    resetPlaybackBuffer();
    setIsSpeaking(false);
    isSpeakingRef.current = false;
  };

  const resetBargeInState = () => {
    bargeInStateRef.current.consecutive = 0;
    bargeInStateRef.current.triggered = false;
  };

  const interruptPlayback = (source) => {
    if (!isSpeakingRef.current) {
      return;
    }

    const now = Date.now();
    bargeInStateRef.current.triggered = true;
    bargeInStateRef.current.lastTriggeredAt = now;
    bargeInStateRef.current.consecutive = 0;

    modeRef.current = "recording";
    setMode("recording");
    stopPlayback();
    socket?.emit("audio-stream-interrupt", { source });
  };

  const handleAutoBargeIn = (rms) => {
    if (!AUTO_BARGE_IN_ENABLED) {
      return;
    }
    if (!isSpeakingRef.current) {
      return;
    }

    const state = bargeInStateRef.current;
    const now = Date.now();
    if (
      state.triggered &&
      now - state.lastTriggeredAt < AUTO_BARGE_IN_COOLDOWN_MS
    ) {
      return;
    }

    if (rms >= AUTO_BARGE_IN_THRESHOLD) {
      state.consecutive += 1;
    } else {
      state.consecutive = 0;
    }

    if (state.consecutive >= AUTO_BARGE_IN_FRAMES) {
      interruptPlayback("auto");
    }
  };

  const handleInterrupt = () => {
    if (!isSpeaking) {
      return;
    }

    interruptPlayback("manual");
  };

  const setupAudioCapture = async () => {
    if (audioContext && mediaStream && workletNode) {
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      return;
    }

    audioContext = new AudioContext({ sampleRate: 16000 }); // Match backend
    await audioContext.audioWorklet.addModule("/processor.js");

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const source = audioContext.createMediaStreamSource(mediaStream);

    workletNode = new AudioWorkletNode(audioContext, "pcm-processor");

    workletNode.port.onmessage = (event) => {
      const data = event.data;
      if (!data || data.type !== "chunk") {
        return;
      }

      const audioBuffer = data.payload;
      const rms = data.rms ?? 0;

      if (modeRef.current === "recording") {
        if (audioBuffer) {
          socket?.emit("audioBytes", new Uint8Array(audioBuffer));
        }
        return;
      }

      if (isSpeakingRef.current) {
        handleAutoBargeIn(rms);
      }
    };

    source.connect(workletNode).connect(audioContext.destination);
  };

  const shutdownAudioCapture = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    workletNode = null;
  };

  useEffect(() => {
    modeRef.current = mode;
    if (mode === "recording" || mode === "monitoring") {
      setupAudioCapture();
      if (mode === "recording") {
        setStatus(() => "Listening");
      }
    }
  }, [mode]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
    if (!isSpeaking) {
      resetBargeInState();
    }
  }, [isSpeaking]);

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
      setMode(() => "monitoring");
    });

    socket.on("transcript-user-client", (data) => {
      setTranscript((prev) => [...prev, { role: "Candidate", content: data }]);
    });

    socket.on("transcript-interviewer-client", (data) => {
      setTranscript((prev) => {
        const next = [
          ...prev,
          { role: "Interviewer", content: data, interrupted: false },
        ];
        lastInterviewerIndexRef.current = next.length - 1;
        return next;
      });
    });

    socket.on("audio-stream-start", async (payload) => {
      await ensurePlaybackReady(payload?.sampleRate);
      resetPlaybackBuffer();
      resetBargeInState();
      setIsSpeaking(true);
    });

    socket.on("audio-stream-chunk", (data) => {
      if (!playbackNodeRef.current) {
        return;
      }

      if (data instanceof Blob) {
        data.arrayBuffer().then((buffer) => {
          playbackNodeRef.current?.port.postMessage(
            { type: "chunk", payload: buffer },
            [buffer],
          );
        });
        return;
      }

      let buffer = null;
      if (data instanceof ArrayBuffer) {
        buffer = data;
      } else if (ArrayBuffer.isView(data)) {
        buffer = data.buffer.slice(
          data.byteOffset,
          data.byteOffset + data.byteLength,
        );
      }

      if (!buffer) {
        return;
      }

      playbackNodeRef.current.port.postMessage(
        { type: "chunk", payload: buffer },
        [buffer],
      );
    });

    socket.on("audio-stream-end", () => {
      playbackEndedRef.current = true;
      if (playbackNodeRef.current) {
        playbackNodeRef.current.port.postMessage({ type: "end" });
      } else {
        handlePlaybackDrained();
      }
    });

    socket.on("audio-stream-interrupted", () => {
      stopPlayback();
      markLastInterviewerInterrupted();
    });

    return () => {
      stopPlayback();
      shutdownAudioCapture();
      if (playbackContextRef.current) {
        playbackContextRef.current.close();
      }
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

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
          <h2 className="text-2xl font-bold text-white">Interview with Alex</h2>
          <p className="text-base text-gray-400">Software Engineer</p>
        </div>

        <div className="my-8">
          <div className="flex items-center justify-center bg-gray-700 text-gray-200 p-4 rounded-lg font-medium">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full mr-3 animate-pulse"></span>
            Status: {status}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleInterrupt}
            disabled={!isSpeaking}
            className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors duration-300 ${
              isSpeaking
                ? "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                : "bg-gray-600 text-gray-300 cursor-not-allowed"
            }`}
          >
            Interrupt
          </button>

          <button
            onClick={() => {
              window.location.href = "/interview/end";
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
          >
            End Call
          </button>
        </div>
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
                <p className="font-bold text-white">{item.role}:</p>
                <p className={item.role == "Interviewer" ? "italic" : ""}>
                  {item.content}
                  {item.interrupted ? (
                    <span className="ml-2 text-yellow-400">(interrupted)</span>
                  ) : null}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
