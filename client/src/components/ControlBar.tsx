import type { ReactNode } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
} from "lucide-react";

interface Props {
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
}

interface IconBtnProps {
  onClick: () => void;
  active: boolean;
  label: string;
  children: ReactNode;
}

function IconBtn({ onClick, active, label, children }: IconBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={[
        "w-12 h-12 rounded-full flex items-center justify-center transition-all border",
        "hover:scale-105",
        active
          ? "bg-white/5 border-white/10 text-lavender shadow-[0_0_12px_rgba(192,132,252,0.35)]"
          : "bg-blush/10 border-blush/25 text-blush hover:shadow-[0_0_12px_rgba(249,168,212,0.25)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function ControlBar({
  audioEnabled,
  videoEnabled,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onLeave,
}: Props) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pb-safe">
      <div className="glass-control-bar flex items-center gap-3 px-5 py-3 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <IconBtn
          onClick={onToggleAudio}
          active={audioEnabled}
          label={audioEnabled ? "Mute mic" : "Unmute mic"}
        >
          {audioEnabled ? (
            <Mic className="w-5 h-5" />
          ) : (
            <MicOff className="w-5 h-5" />
          )}
        </IconBtn>

        <IconBtn
          onClick={onToggleVideo}
          active={videoEnabled}
          label={videoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {videoEnabled ? (
            <Video className="w-5 h-5" />
          ) : (
            <VideoOff className="w-5 h-5" />
          )}
        </IconBtn>

        <IconBtn
          onClick={onToggleScreenShare}
          active={!isScreenSharing}
          label={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          <MonitorUp className="w-5 h-5" />
        </IconBtn>

        <button
          type="button"
          onClick={onLeave}
          title="End call"
          aria-label="End call"
          className="w-14 h-14 rounded-full bg-[#f87171]/90 hover:bg-[#f87171] transition-all flex items-center justify-center text-white hover:scale-105 shadow-[0_0_16px_rgba(248,113,113,0.35)] ml-1"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
