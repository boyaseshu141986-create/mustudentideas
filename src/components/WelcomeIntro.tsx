import { useEffect, useState } from "react";

const LINE_ONE = "WELCOME TO";
const LINE_TWO = "MU STUDENT IDEAS";

const STEP_MS = 110; // per letter
const HOLD_MS = 4000; // stay 4s after the animation finishes
const SESSION_KEY = "mu-welcome-shown";

export function WelcomeIntro() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  const total = LINE_ONE.length + LINE_TWO.length;

  useEffect(() => {
    // Only on a fresh visit to the site — not when navigating back to home.
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(true);

    const typingMs = total * STEP_MS;
    const fadeTimer = setTimeout(() => setFading(true), typingMs + HOLD_MS);
    const hideTimer = setTimeout(() => setVisible(false), typingMs + HOLD_MS + 700);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [total]);

  if (!visible) return null;

  const renderLine = (text: string, offset: number, className: string) => (
    <span className={className}>
      {text.split("").map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className="inline-block"
          style={{
            opacity: 0,
            animation: `mu-letter-in 0.45s ease-out forwards`,
            animationDelay: `${(offset + i) * STEP_MS}ms`,
          }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] grid place-items-center bg-sidebar transition-opacity duration-700 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <style>{`@keyframes mu-letter-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div className="px-6 text-center">
        {renderLine(
          LINE_ONE,
          0,
          "block text-sm font-semibold tracking-[0.5em] text-accent uppercase sm:text-lg",
        )}
        {renderLine(
          LINE_TWO,
          LINE_ONE.length,
          "mt-4 block text-3xl font-bold tracking-tight text-sidebar-foreground sm:text-5xl lg:text-6xl",
        )}
      </div>
    </div>
  );
}
