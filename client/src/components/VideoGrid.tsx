import { useRef } from "react";
import VideoTile from "./VideoTile";
import LocalVideoPopout from "./LocalVideoPopout";
import type { RemotePeer } from "../hooks/useWebRTC";

interface LocalUser {
  stream: MediaStream | null;
  displayName: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  mirrorLocal?: boolean;
}

interface Props {
  localUser: LocalUser;
  remotePeers: RemotePeer[];
}

function LocalTile({ localUser, edgeToEdge = false }: { localUser: LocalUser; edgeToEdge?: boolean }) {
  return (
    <VideoTile
      stream={localUser.stream}
      displayName={localUser.displayName}
      muted
      mirrored={localUser.mirrorLocal ?? true}
      isLocal
      edgeToEdge={edgeToEdge}
      audioEnabled={localUser.audioEnabled}
      videoEnabled={localUser.videoEnabled}
      connectionState="connected"
    />
  );
}

function RemoteTile({ peer, edgeToEdge = false }: { peer: RemotePeer; edgeToEdge?: boolean }) {
  return (
    <VideoTile
      stream={peer.stream}
      displayName={peer.displayName}
      muted={false}
      mirrored={false}
      isLocal={false}
      edgeToEdge={edgeToEdge}
      audioEnabled={peer.audioEnabled}
      videoEnabled={peer.videoEnabled}
      connectionState={peer.connectionState}
    />
  );
}

/** 1-on-1: remote fullscreen + draggable local popout. Solo: local fullscreen. */
function FocusLayout({
  localUser,
  remotePeers,
}: {
  localUser: LocalUser;
  remotePeers: RemotePeer[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const primary = remotePeers[0];

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-0">
      <div className="absolute inset-0">
        {primary ? (
          <RemoteTile peer={primary} edgeToEdge />
        ) : (
          <LocalTile localUser={localUser} edgeToEdge />
        )}
      </div>

      {primary && (
        <LocalVideoPopout localUser={localUser} containerRef={containerRef} />
      )}
    </div>
  );
}

/** 3 participants: two tiles on top, one centered below. */
function ThreeLayout({
  localUser,
  remotePeers,
}: {
  localUser: LocalUser;
  remotePeers: RemotePeer[];
}) {
  const topPeers = remotePeers.slice(0, 2);
  const bottomIsLocal = remotePeers.length < 3;

  return (
    <div className="flex flex-col gap-2 w-full h-full min-h-0 p-2">
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-2">
        {topPeers.map((peer) => (
          <RemoteTile key={peer.socketId} peer={peer} />
        ))}
      </div>
      <div className="flex-1 min-h-0 flex justify-center">
        <div className="w-full max-w-[calc(50%-0.25rem)] h-full min-h-0">
          {bottomIsLocal ? (
            <LocalTile localUser={localUser} />
          ) : (
            <RemoteTile peer={remotePeers[2]} />
          )}
        </div>
      </div>
    </div>
  );
}

/** 4 participants: equal 2×2 grid. */
function FourLayout({
  localUser,
  remotePeers,
}: {
  localUser: LocalUser;
  remotePeers: RemotePeer[];
}) {
  const tiles = [
    ...remotePeers.slice(0, 3).map((peer) => (
      <RemoteTile key={peer.socketId} peer={peer} />
    )),
    <LocalTile key="local" localUser={localUser} />,
  ];

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full min-h-0 p-2">
      {tiles}
    </div>
  );
}

export default function VideoGrid({ localUser, remotePeers }: Props) {
  const total = remotePeers.length + 1;

  if (total <= 2) {
    return <FocusLayout localUser={localUser} remotePeers={remotePeers} />;
  }

  if (total === 3) {
    return <ThreeLayout localUser={localUser} remotePeers={remotePeers} />;
  }

  return <FourLayout localUser={localUser} remotePeers={remotePeers} />;
}
