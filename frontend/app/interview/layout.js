"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function InterviewLayout({ children }) {
  const pathName = usePathname();

  return (
    <>
      <div className=" min-h-screen flex flex-col text-white">
        <header className="flex justify-between items-center p-4 border-b border-gray-700/50">
          <div className="text-xl font-bold">
            MockInterviewAI
          </div>
          {pathName != "/interview/call" && (
            <nav className="flex items-center space-x-6">
              {/* <a href="#" className="text-gray-300 hover:text-white">
            Product
            </a> */}
              <Link
                href="/"
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-[10px]"
              >
                Home
              </Link>
            </nav>
          )}
        </header>
        {children}
      </div>
    </>
  );
}
