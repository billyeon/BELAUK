import Link from "next/link";
import "./globals.css";

export default function NotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 40 }}>
        <h1>404</h1>
        <p>
          <Link href="/my">BELAUK home</Link>
        </p>
      </body>
    </html>
  );
}
