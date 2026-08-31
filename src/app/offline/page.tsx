import "../globals.css";

export const metadata = { title: "오프라인 · BELAUK" };

// Standalone route (outside the [locale] segment) so the service worker can
// precache a stable /offline fallback. Renders its own html/body.
export default function OfflinePage() {
  return (
    <html lang="ko">
      <body>
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: 32,
            textAlign: "center",
            background: "#f6f4ef",
            color: "#16181b",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#169b8c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 26,
            }}
          >
            ˰
          </div>
          <p style={{ fontWeight: 700, fontSize: 16, margin: "12px 0 0" }}>
            인터넷 연결이 없어요
          </p>
          <p style={{ fontSize: 13, color: "#686d75", margin: 0 }}>
            연결되면 자동으로 다시 시도합니다.
          </p>
        </div>
      </body>
    </html>
  );
}
