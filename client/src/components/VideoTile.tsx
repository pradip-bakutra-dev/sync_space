import { useEffect, useRef } from "react";
import { MicOff } from "lucide-react";

interface Props {
  stream: MediaStream | null;
  displayName: string;
  muted?: boolean;
  mirrored?: boolean;
  isLocal?: boolean;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  connectionState?: string;
}

function getInitial(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed[0].toUpperCase();
}

export default function VideoTile({
  stream,
  displayName,
  muted = false,
  mirrored = false,
  isLocal = false,
  audioEnabled = true,
  videoEnabled = true,
  connectionState = "connected",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) {
      video.srcObject = stream;
      video.play().catch(() => {
        // Autoplay blocked — will play on user interaction
      });
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  const hasActiveVideo =
    !!stream &&
    stream.getVideoTracks().some((t) => t.enabled && t.readyState === "live");
  const showVideo = hasActiveVideo && videoEnabled;
  const isConnecting = connectionState === "connecting";
  const isFailed = connectionState === "failed";
  const showGlow = audioEnabled;

  return (
    <div
      className={[
        "relative w-full h-full bg-card rounded-2xl overflow-hidden flex items-center justify-center",
        "video-tile-glow",
        showGlow ? "video-tile-glow-active" : "",
      ].join(" ")}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={[
          "w-full h-full object-cover absolute inset-0 transition-opacity duration-300",
          showVideo ? "opacity-100" : "opacity-0",
          mirrored ? "scale-x-[-1]" : "",
        ].join(" ")}
      />

      {!showVideo && (
        <div className="flex flex-col items-center gap-3 z-10">
          <div className="initial-avatar">
            <span>{getInitial(displayName)}</span>
          </div>
          {isConnecting && (
            <span className="text-text-muted text-xs animate-pulse">
              Connecting...
            </span>
          )}
          {isFailed && (
            <span className="text-blush text-xs">Connection failed</span>
          )}
        </div>
      )}

      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
        <span className="name-badge">
          {displayName}
          {isLocal ? " (You)" : ""}
        </span>
        {!audioEnabled && (
          <span className="name-badge text-blush">
            <MicOff className="w-3 h-3" />
          </span>
        )}
      </div>

      {!isLocal && (
        <div
          className={[
            "absolute top-3 right-3 w-2 h-2 rounded-full z-20",
            connectionState === "connected"
              ? "bg-lavender/80 shadow-[0_0_6px_rgba(192,132,252,0.6)]"
              : connectionState === "failed"
                ? "bg-[#f87171]"
                : "bg-gold animate-pulse",
          ].join(" ")}
        />
      )}
    </div>
  );
}
