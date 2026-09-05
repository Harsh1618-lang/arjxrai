import { memo } from "react";

/**
 * Global fluid liquid glass background mesh.
 * Renders fixed, gently animating liquid glowing blobs across the viewport.
 * Tuned for both light and dark modes with high contrast and zero interaction interference.
 */
export const LiquidBackground = memo(function LiquidBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Ambient soft iridescent wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/45 via-white/20 to-sky-50/40 opacity-100 dark:opacity-0 transition-opacity duration-300" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950/80 to-black opacity-0 dark:opacity-100 transition-opacity duration-300" />

      {/* Global Liquid Blob 1: Top Right - Indigo/Violet */}
      <div
        className="liquid-blob-anim-1 absolute -top-28 -right-28 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-indigo-500/22 via-violet-500/18 to-purple-600/14 blur-[95px] dark:from-indigo-600/24 dark:via-violet-600/18 dark:to-purple-700/14"
      />

      {/* Global Liquid Blob 2: Bottom Left - Cyan/Sky/Blue */}
      <div
        className="liquid-blob-anim-2 absolute -bottom-32 -left-32 h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-cyan-400/24 via-sky-500/18 to-blue-600/14 blur-[100px] dark:from-cyan-600/20 dark:via-blue-600/16 dark:to-teal-500/14"
      />

      {/* Global Liquid Blob 3: Center Floating Accent - Fuchsia/Pink/Rose */}
      <div
        className="liquid-blob-anim-3 absolute top-1/3 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-gradient-to-r from-fuchsia-500/18 via-pink-500/15 to-rose-400/12 blur-[90px] dark:from-fuchsia-600/18 dark:to-rose-600/12"
      />

      {/* Global Liquid Blob 4: Lower Right Accent - Emerald/Teal/Sky */}
      <div
        className="liquid-blob-anim-1 absolute top-2/3 right-10 h-[380px] w-[380px] rounded-full bg-gradient-to-r from-emerald-400/16 via-teal-400/15 to-sky-400/14 blur-[85px] dark:from-emerald-600/14 dark:to-teal-600/12"
        style={{ animationDelay: "-6s" }}
      />
    </div>
  );
});
