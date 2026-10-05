import "./globals.css";

export const metadata = {
  title: "Agent Office Ring",
  description: "Operator dashboard for the agent ring",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
