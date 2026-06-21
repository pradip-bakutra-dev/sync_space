export default function GlowOrbs() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div
        className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full opacity-30 blur-[100px]"
        style={{ background: "radial-gradient(circle, #c084fc 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-1/3 -right-24 w-[400px] h-[400px] rounded-full opacity-20 blur-[90px]"
        style={{ background: "radial-gradient(circle, #f9a8d4 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-24 left-1/3 w-[360px] h-[360px] rounded-full opacity-[0.15] blur-[80px]"
        style={{ background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)" }}
      />
    </div>
  );
}
