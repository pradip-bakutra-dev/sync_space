import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Mic, MicOff, Video, VideoOff } from "lucide-react";
import VideoPreview from "../components/VideoPreview";
import Starfield from "../components/Starfield";
import GlowOrbs from "../components/GlowOrbs";
import { useMedia } from "../hooks/useMedia";

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed[0].toUpperCase();
}

export default function Lobby() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    stream,
    videoEnabled,
    audioEnabled,
    error,
    loading,
    toggleVideo,
    toggleAudio,
  } = useMedia();

  const [displayName, setDisplayName] = useState("");
  const [copied, setCopied] = useState(false);

  const initial = getInitial(displayName);
  const canJoin = displayName.trim().length >= 2 && !loading && !error;

  async function handleCopy() {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function handleJoin() {
    if (!canJoin || !roomId) return;

    const name = displayName.trim();
    sessionStorage.setItem("syncspace_name", name);
    sessionStorage.setItem("syncspace_room", roomId);

    navigate(`/room/${roomId}`);
    stream?.getTracks().forEach((t) => t.stop());
  }

  const mediaToggleBase =
    "rounded-full w-12 h-12 border flex items-center justify-center transition-all hover:scale-105";
  const mediaToggleOn =
    "border-border bg-card/60 text-lavender hover:shadow-[0_0_15px_rgba(192,132,252,0.3)]";
  const mediaToggleOff = "bg-blush/10 text-blush border-blush/30";

  return (
    <div className="min-h-screen bg-midnight font-body text-text-primary relative">
      <Starfield animated />
      <GlowOrbs />

      <div className="relative z-10 flex flex-col lg:flex-row gap-8 w-full max-w-4xl mx-auto px-4 py-8 lg:py-12 animate-fade-in">
        <div className="w-full lg:w-1/2">
          <h2 className="font-heading text-2xl sm:text-3xl text-text-primary mb-4 text-center lg:text-left">
            Ready to connect?
          </h2>

          <div className="glass-card relative aspect-video rounded-2xl overflow-hidden flex items-center justify-center shadow-[0_0_30px_rgba(192,132,252,0.15)] border-lavender/20">
            {loading && (
              <div
                className="w-10 h-10 rounded-full border-2 border-white/20 border-t-lavender animate-spin"
                role="status"
                aria-label="Loading camera"
              />
            )}

            {!loading && error && (
              <div className="flex flex-col items-center gap-4 px-6 text-center">
                <VideoOff className="w-10 h-10 text-text-muted/50" strokeWidth={1.5} />
                <p className="text-sm text-text-muted max-w-xs">{error}</p>
              </div>
            )}

            {!loading && !error && !videoEnabled && (
              <div className="flex flex-col items-center justify-center gap-3">
                {initial ? (
                  <div className="initial-avatar">
                    <span>{initial}</span>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-card/80 flex items-center justify-center">
                    <span className="text-text-muted/40 text-2xl">✦</span>
                  </div>
                )}
              </div>
            )}

            {!loading && !error && videoEnabled && stream && (
              <VideoPreview
                stream={stream}
                className="w-full h-full object-cover scale-x-[-1]"
              />
            )}
          </div>

          {!loading && !error && (
            <div className="mt-4 flex justify-center gap-4">
              <button
                type="button"
                onClick={toggleAudio}
                aria-label={
                  audioEnabled ? "Mute microphone" : "Unmute microphone"
                }
                className={`${mediaToggleBase} ${audioEnabled ? mediaToggleOn : mediaToggleOff}`}
              >
                {audioEnabled ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
              </button>
              <button
                type="button"
                onClick={toggleVideo}
                aria-label={videoEnabled ? "Turn off camera" : "Turn on camera"}
                className={`${mediaToggleBase} ${videoEnabled ? mediaToggleOn : mediaToggleOff}`}
              >
                {videoEnabled ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </button>
            </div>
          )}
        </div>

        <div className="w-full lg:w-1/2 flex flex-col justify-center">
          <div className="glass-card rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-lavender">✦</span>
              <span className="font-heading text-xl text-text-primary">OurSpace</span>
            </div>

            <div className="mb-6">
              <label htmlFor="displayName" className="lobby-label">
                Your name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name..."
                maxLength={24}
                className="lobby-input"
              />
            </div>

            <div className="mb-8">
              <span className="lobby-label">Room code</span>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="code-badge">
                  <span>✦</span>
                  {roomId}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn-ghost text-sm py-2 px-4 flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-lavender" />
                      Copied!
                    </>
                  ) : (
                    "Copy Code"
                  )}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleJoin}
              disabled={!canJoin}
              className="btn-gradient w-full"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
