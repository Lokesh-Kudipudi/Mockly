"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const userAvatar = "/avatar.png";

export default function LandingPage() {
  const [user, setUser] = useState(null);

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-5 border-b border-gray-700/50">
        <div className="text-xl font-bold">MockInterviewAI</div>
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/signIn"
            className="text-gray-300 hover:text-white"
          >
            Login
          </Link>
        </nav>
        {user && (
          <div className="flex items-center space-x-4">
            <div className="w-9 h-9 rounded-full overflow-hidden">
              <Image
                src={userAvatar}
                alt="User Avatar"
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>
          </div>
        )}
      </header>

      <main className="p-8 md:p-12 lg:p-20">
        {/* Inner content box */}
        <div className="pt-10">
          <h1 className="text-4xl md:text-5xl font-bold max-w-3xl mx-auto">
            Ace Your Next Interview with AI-Powered Mock
            Interviews
          </h1>
          <p className="mt-4 text-gray-300 max-w-2xl mx-auto">
            Practice with realistic interview simulations, get
            instant feedback, and improve your performance
          </p>
        </div>

        {/* Welcome Message */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={() =>
              (window.location.href = "/interview/start")
            }
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-lg text-lg"
          >
            Get Started
          </button>
        </div>
      </main>
    </div>
  );
}
