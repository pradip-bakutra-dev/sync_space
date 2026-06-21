import { useState, useCallback } from "react";

export interface ToastMessage {
  id: string;
  text: string;
  type: "join" | "leave" | "info";
}

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

function formatToastText(text: string, type: ToastMessage["type"]): string {
  if (type === "join") {
    const name = text.replace(/\s+joined$/i, "").trim();
    return `✦ ${name} joined the call 🌙`;
  }
  if (type === "leave") {
    const name = text.replace(/\s+left$/i, "").trim();
    return `${name} left the call`;
  }
  return text;
}

export default function Toast({ toasts }: Props) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            "glass-card px-5 py-2.5 rounded-full text-sm font-body text-text-primary",
            "shadow-[0_8px_24px_rgba(0,0,0,0.3)]",
            "animate-[fadeInDown_0.35s_ease-out]",
            t.type === "join"
              ? "border-lavender/30 shadow-[0_0_20px_rgba(192,132,252,0.15)]"
              : t.type === "leave"
                ? "border-blush/20"
                : "",
          ].join(" ")}
        >
          {formatToastText(t.text, t.type)}
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (text: string, type: ToastMessage["type"] = "info") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    [],
  );

  return { toasts, addToast };
}
