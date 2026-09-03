/**
 * Subtle animated site background — faint graph-paper grid plus slow-breathing
 * warm & brand glows. Light and dark variants crossfade when the theme flips.
 * Purely decorative: pointer-events off, aria-hidden, behind all content.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* graph grid — light mode */}
      <div
        className="absolute inset-0 transition-opacity duration-700 dark:opacity-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,23,42,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.055) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      {/* graph grid — dark mode */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-700 dark:opacity-100"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* warm centre glow — slowly breathes */}
      <div
        className="animate-glow-a absolute left-1/2 top-[42%] h-[85vmin] w-[85vmin] rounded-full blur-[90px]"
        style={{ background: "radial-gradient(circle at center, rgba(245,158,11,0.16), rgba(245,158,11,0.05) 45%, transparent 70%)" }}
      />
      {/* brand tint — top left, drifts on its own clock */}
      <div
        className="animate-glow-b absolute -left-40 -top-40 h-[65vmin] w-[65vmin] rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle at center, rgba(79,70,229,0.10), transparent 65%)" }}
      />
      {/* cool tint — bottom right, dark mode only */}
      <div
        className="animate-glow-b absolute -bottom-48 -right-40 h-[70vmin] w-[70vmin] rounded-full opacity-0 blur-[110px] transition-opacity duration-700 dark:opacity-100"
        style={{ background: "radial-gradient(circle at center, rgba(14,165,233,0.10), transparent 65%)" }}
      />
    </div>
  );
}
