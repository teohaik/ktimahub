import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.06,
            backgroundImage:
              "repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 0, transparent 60px), repeating-linear-gradient(90deg, #fff 0, #fff 1px, transparent 0, transparent 60px)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
              }}
            >
              🌾
            </div>
          </div>

          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-3px",
              lineHeight: 1,
              marginBottom: 24,
            }}
          >
            KtimaHub
          </div>

          <div
            style={{
              fontSize: 36,
              color: "#86efac",
              fontWeight: 500,
              marginBottom: 16,
              textAlign: "center",
              maxWidth: 800,
            }}
          >
            Διαχείριση αγροτεμαχίων · Land management
          </div>

          <div
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.5)",
              marginTop: 8,
            }}
          >
            ktimahub.gr
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "linear-gradient(90deg, #4ade80, #22c55e, #16a34a)",
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
