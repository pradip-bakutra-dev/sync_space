import { useCallback, useEffect, useRef, useState } from "react";
import { Minimize2 } from "lucide-react";
import VideoTile from "./VideoTile";

interface LocalUser {
  stream: MediaStream | null;
  displayName: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  mirrorLocal?: boolean;
}

interface Props {
  localUser: LocalUser;
  containerRef: React.RefObject<HTMLElement | null>;
}

const POPOUT_W = 112;
const POPOUT_H = 148;
const COLLAPSED = 44;
const EDGE = 12;

function getInitial(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed[0].toUpperCase();
}

export default function LocalVideoPopout({ localUser, containerRef }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const clampPosition = useCallback(
    (x: number, y: number, expanded: boolean) => {
      const container = containerRef.current;
      const w = expanded ? POPOUT_W : COLLAPSED;
      const h = expanded ? POPOUT_H : COLLAPSED;
      if (!container) return { x, y };

      const maxX = Math.max(EDGE, container.clientWidth - w - EDGE);
      const maxY = Math.max(EDGE, container.clientHeight - h - EDGE);
      return {
        x: Math.min(Math.max(EDGE, x), maxX),
        y: Math.min(Math.max(EDGE, y), maxY),
      };
    },
    [containerRef],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || pos !== null) return;

    const defaultX = container.clientWidth - POPOUT_W - EDGE;
    const defaultY = container.clientHeight - POPOUT_H - EDGE;
    setPos(clampPosition(defaultX, defaultY, true));
  }, [containerRef, pos, clampPosition]);

  useEffect(() => {
    if (!pos) return;
    setPos((current) =>
      current ? clampPosition(current.x, current.y, !collapsed) : current,
    );
  }, [collapsed, clampPosition]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!pos) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 6) drag.moved = true;
    setPos(clampPosition(drag.originX + dx, drag.originY + dy, !collapsed));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (drag?.pointerId === e.pointerId) {
      if (collapsed && !drag.moved) setCollapsed(false);
      dragRef.current = null;
    }
  };

  if (!pos) return null;

  if (collapsed) {
    return (
      <button
        type="button"
        aria-label="Expand your video"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="absolute z-30 touch-none rounded-full bg-card/90 border border-lavender/30 shadow-[0_4px_24px_rgba(0,0,0,0.45)] flex items-center justify-center backdrop-blur-sm"
        style={{
          width: COLLAPSED,
          height: COLLAPSED,
          left: pos.x,
          top: pos.y,
        }}
      >
        <span className="font-heading text-lg text-lavender leading-none">
          {getInitial(localUser.displayName)}
        </span>
      </button>
    );
  }

  return (
    <div
      className="absolute z-30 touch-none rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.45)] border border-lavender/25"
      style={{
        width: POPOUT_W,
        height: POPOUT_H,
        left: pos.x,
        top: pos.y,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-8 z-40 cursor-grab active:cursor-grabbing bg-gradient-to-b from-black/50 to-transparent flex items-center justify-end px-1.5 gap-0.5"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <button
          type="button"
          aria-label="Collapse your video"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(true);
          }}
          className="w-6 h-6 rounded-full bg-black/40 text-white/80 hover:text-white flex items-center justify-center"
        >
          <Minimize2 className="w-3 h-3" />
        </button>
      </div>

      <VideoTile
        stream={localUser.stream}
        displayName={localUser.displayName}
        muted
        mirrored={localUser.mirrorLocal ?? true}
        isLocal
        compact
        audioEnabled={localUser.audioEnabled}
        videoEnabled={localUser.videoEnabled}
        connectionState="connected"
      />
    </div>
  );
}
