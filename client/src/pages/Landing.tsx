import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateRoomCode, formatRoomCode } from "../utils/room";

type View = "home" | "join";

export default function Landing() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("home");
  const [roomCode, setRoomCode] = useState("");

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    navigate(`/lobby/${code}`);
  };

  const handleJoin = () => {
    if (roomCode.length === 6) {
      navigate(`/lobby/${roomCode}`);
    }
  };

  return (
    <div className="h-screen bg-[#0d0f14] flex flex-col relative font-sans overflow-hidden">
      <header className="flex items-center px-6 sm:px-10 pt-6 sm:pt-8 pb-2 min-h-[5.5rem] shrink-0">
        <a
          href="/"
          className="inline-flex items-center"
          aria-label="SyncSpace home"
        >
          <img
            src="/logo.png"
            alt="SyncSpace"
            className="h-12 sm:h-14 md:h-16 w-auto max-w-[min(280px,70vw)] object-contain object-left"
          />
        </a>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center pb-[120px]">
        {view === "home" ? (
          <>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#1e2029] bg-[#111318] text-white/50 text-xs mb-6">
              <svg
                className="w-3 h-3 text-brand"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
              For Friends
            </div>

            <h1 className="font-sans font-bold text-5xl md:text-6xl lg:text-7xl text-center leading-tight tracking-tight max-w-3xl">
              <span className="text-white">Meet, collaborate, and </span>
              <span className="bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">
                stay in sync
              </span>
            </h1>

            <div className="flex gap-4 mt-10">
              <button
                type="button"
                onClick={handleCreateRoom}
                className="flex flex-col items-center justify-center gap-1 w-44 h-24 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] transition text-white"
              >
                <span className="text-xl font-light">+</span>
                <span className="font-semibold text-sm">New Meeting</span>
              </button>

              <button
                type="button"
                onClick={() => setView("join")}
                className="flex flex-col items-center justify-center gap-1 w-44 h-24 rounded-2xl bg-[#1a1d24] hover:bg-[#1e2229] border border-[#1e2029] transition text-white"
              >
                <span className="text-xl font-light">→</span>
                <span className="font-semibold text-sm">Join Meeting</span>
              </button>
            </div>
          </>
        ) : (
          <div className="w-full max-w-xs flex flex-col items-center">
            <button
              type="button"
              onClick={() => {
                setView("home");
                setRoomCode("");
              }}
              className="self-start mb-8 text-white/60 hover:text-white transition flex items-center gap-2"
              aria-label="Back to home"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>

            <h2 className="font-sans font-bold text-3xl md:text-4xl text-white mb-8 tracking-tight">
              Enter room code
            </h2>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(formatRoomCode(e.target.value))}
              placeholder="XXXXXX"
              maxLength={6}
              autoComplete="off"
              spellCheck={false}
              className="landing-room-input"
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={roomCode.length < 6}
              className="mt-6 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium px-8 py-3 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Join
            </button>
            <p className="mt-4 text-sm text-white/40 text-center">
              Ask the host for the 6-letter room code
            </p>
          </div>
        )}
      </main>

      <footer className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-[#656565] text-xs tracking-wide">Developed by PSB</p>
      </footer>
    </div>
  );
}
