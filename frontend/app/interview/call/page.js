"use client";
import Image from "next/image";
import { useState } from "react";

export default function InterviewForm() {
  const [transcript, setTranscript] = useState({});

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
            Status: Recording
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
      <div className="md:w-2/3  rounded-xl overflow-y-scroll max-h-[80vh]">
        <h1 className="text-3xl font-bold text-white mb-5 pb-3 border-b border-gray-700">
          Interview Transcript
        </h1>
        <div className="space-y-6 text-gray-300">
          <div>
            <p className="font-bold text-white">Interviewer:</p>
            <p className="italic">
              Tell me about a time you failed and how you handled
              it.
            </p>
          </div>
          <div>
            <p className="font-bold text-white">Candidate:</p>
            <p>
              During a team project, I missed a critical deadline
              due to poor time management. I immediately informed
              my team, took responsibility, and worked extra
              hours to catch up. I learned the importance of
              better planning and communication
            </p>
          </div>
          <div>
            <p className="font-bold text-white">Interviewer:</p>
            <p className="italic">
              How do you handle stress and pressure
            </p>
          </div>
          <div>
            <p className="font-bold text-white">Candidate:</p>
            <p>
              I manage stress by prioritizing tasks, taking short
              breaks, and practicing mindfulness. I also find it
              helpful to discuss challenges with my team or
              supervisor to find solutions together.
            </p>
          </div>
          <div>
            <p className="font-bold text-white">Interviewer:</p>
            <p className="italic">
              Describe your ideal work environment.
            </p>
          </div>
          <div>
            <p className="font-bold text-white">Candidate:</p>
            <p>
              My ideal work environment is collaborative,
              supportive, and challenging. I thrive in a place
              where I can learn from others, contribute my
              skills, and have opportunities for growth.
            </p>
          </div>
          <div>
            <p className="font-bold text-white">Candidate:</p>
            <p>
              My ideal work environment is collaborative,
              supportive, and challenging. I thrive in a place
              where I can learn from others, contribute my
              skills, and have opportunities for growth.
            </p>
          </div>
          <div>
            <p className="font-bold text-white">Candidate:</p>
            <p>
              My ideal work environment is collaborative,
              supportive, and challenging. I thrive in a place
              where I can learn from others, contribute my
              skills, and have opportunities for growth.
            </p>
          </div>
          <div>
            <p className="font-bold text-white">Candidate:</p>
            <p>
              My ideal work environment is collaborative,
              supportive, and challenging. I thrive in a place
              where I can learn from others, contribute my
              skills, and have opportunities for growth.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
