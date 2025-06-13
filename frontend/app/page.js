import Image from "next/image";

// As we don't have the exact illustration, we'll use a placeholder.
// Replace this with the actual path to your illustration.
const interviewIllustration = "/heroSection.png";
// Placeholder for the user's avatar
const userAvatar = "/avatar.png";

export default function LandingPage() {
  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-5 border-b border-gray-700/50">
        <div className="text-xl font-bold">MockInterviewAI</div>
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#" className="text-gray-300 hover:text-white">
            Home
          </a>
          <a href="#" className="text-gray-300 hover:text-white">
            Practice
          </a>
          <a href="#" className="text-gray-300 hover:text-white">
            Learn
          </a>
          <a href="#" className="text-gray-300 hover:text-white">
            Resources
          </a>
        </nav>
        <div className="flex items-center space-x-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
            Upgrade
          </button>
          <div className="w-9 h-9 rounded-full overflow-hidden">
            {/* Using a div as a placeholder for the avatar image */}
            <Image
              src={userAvatar}
              alt="User Avatar"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
        </div>
      </header>

      <main className="p-8 md:p-12 lg:p-20">
        {/* Inner content box */}

        <div className="relative w-full max-w-3xl aspect-video mb-[-20%] sm:mb-[-15%] md:mb-[-10%]">
          {/* Illustration Image */}
          <Image
            src={interviewIllustration}
            alt="Mock interview illustration"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
          />
        </div>
        <div className="relative z-10 bg-gradient-to-t from-gray-800/80 via-gray-800/60 to-transparent pt-10">
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
        <div className="mt-12">
          <h2 className="text-3xl font-semibold">
            Welcome back, Amelia
          </h2>
        </div>
      </main>
    </div>
  );
}
