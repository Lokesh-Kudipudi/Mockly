import Head from "next/head";
import Link from "next/link";

export default function CreateAccount() {
  return (
    <div className="bg-[#0b0c0e] min-h-screen flex flex-col text-white">
      <Head>
        <title>SignIn to your account</title>
      </Head>

      <header className="flex justify-between items-center p-6">
        <div className="text-xl font-bold">MockInterviewAI</div>
        <nav className="flex items-center space-x-6">
          <a href="#" className="text-gray-300 hover:text-white">
            Product
          </a>
          <a href="#" className="text-gray-300 hover:text-white">
            Pricing
          </a>
          <a href="#" className="text-gray-300 hover:text-white">
            Resources
          </a>
          <a
            href="#"
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-[10px]"
          >
            Home
          </a>
        </nav>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8">
            Sign In to your account
          </h1>
          <form className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300"
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Email"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Password"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </button>
            </div>
          </form>
          <p className="mt-6 text-center text-gray-400">
            Dont have an account?{" "}
            <Link
              href="signUp"
              className="font-medium text-blue-500 hover:text-blue-400"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
