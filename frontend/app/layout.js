import "./globals.css";

export const metadata = {
  title: "AI Mock Interview Platform",
  description:
    "Prepare for interviews with AI-driven mock interviews.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
