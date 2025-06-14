"use client";
export default function InterviewForm() {
  return (
    <main className="flex-grow flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8">
          Tell Us About Yourself
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = "/interview/call";
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300"
              >
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Lokesh Kudipudi"
              />
            </div>
            <div>
              <label
                htmlFor="experienceLevel"
                className="block text-sm font-medium text-gray-300"
              >
                Experience Level
              </label>
              <input
                type="text"
                name="experienceLevel"
                id="experienceLevel"
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Fresher, Junior, Mid-level, Senior"
              />
            </div>
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-300"
              >
                Role
              </label>
              <input
                type="text"
                name="role"
                id="role"
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Software Engineer, Data Scientist, etc."
              />
            </div>
            <div>
              <label
                htmlFor="round"
                className="block text-sm font-medium text-gray-300"
              >
                Round
              </label>
              <input
                type="text"
                name="round"
                id="round"
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Technical, HR, Managerial, etc."
              />
            </div>
            <div>
              <label
                htmlFor="difficulty"
                className="block text-sm font-medium text-gray-300"
              >
                Difficulty Level
              </label>
              <input
                type="text"
                name="difficulty"
                id="difficulty"
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Easy, Medium, Hard"
              />
            </div>
            <div>
              <label
                htmlFor="noOfQuestions"
                className="block text-sm font-medium text-gray-300"
              >
                Number of Questions
              </label>
              <input
                type="text"
                name="noOfQuestions"
                id="noOfQuestions"
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter the number of questions you want to practice"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Get Started
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
