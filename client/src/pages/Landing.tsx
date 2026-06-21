import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateRoomCode, formatRoomCode } from "../utils/room";
import Starfield from "../components/Starfield";
import GlowOrbs from "../components/GlowOrbs";

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
    <div className="h-screen bg-midnight flex flex-col relative font-body overflow-hidden">
      <Starfield animated />
      <GlowOrbs />

      <header className="relative z-10 flex items-center px-6 sm:px-10 pt-6 sm:pt-8 pb-2 min-h-[5.5rem] shrink-0 animate-fade-in">
        <a
          href="/"
          className="inline-flex items-center gap-2 group"
          aria-label="OurSpace home"
        >
          <span className="text-lavender text-xl transition-transform group-hover:scale-110">
            ✦
          </span>
          <span className="font-heading text-2xl sm:text-3xl text-text-primary tracking-wide">
            OurSpace
          </span>
        </a>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center pb-[120px]">
        {view === "home" ? (
          <div className="animate-fade-in-up">
            <div className="tagline-pill mb-8">
              <span className="text-lavender">✦</span>
              Just for us
            </div>

            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl text-text-primary text-center leading-tight max-w-3xl mb-6">
              Our little corner
              <br />
              of the internet
            </h1>

            <p className="text-text-muted text-sm mb-10">Hello Shivani 🌙</p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <button
                type="button"
                onClick={handleCreateRoom}
                className="btn-gradient min-w-[180px]"
              >
                Come Find Me
              </button>

              <button
                type="button"
                onClick={() => setView("join")}
                className="btn-ghost min-w-[180px]"
              >
                Join with Code
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-xs flex flex-col items-center animate-fade-in-up">
            <button
              type="button"
              onClick={() => {
                setView("home");
                setRoomCode("");
              }}
              className="self-start mb-8 text-text-muted hover:text-text-primary transition flex items-center gap-2"
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
              <span className="text-sm">Back</span>
            </button>

            <h2 className="font-heading text-3xl md:text-4xl text-text-primary mb-2">
              Enter room code
            </h2>
            <p className="text-text-muted text-sm mb-8">
              Share this code to connect together
            </p>

            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(formatRoomCode(e.target.value))}
              placeholder="XXXXXX"
              maxLength={6}
              autoComplete="off"
              spellCheck={false}
              className="room-code-input"
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={roomCode.length < 6}
              className="mt-6 btn-gradient px-10"
            >
              Join
            </button>
          </div>
        )}
      </main>

      <footer className="absolute bottom-6 left-0 right-0 text-center z-10">
        <p className="text-text-muted/60 text-xs tracking-wide">
          Made with ♥ by Pradip, for Shivani
        </p>
      </footer>
    </div>
  );
}
