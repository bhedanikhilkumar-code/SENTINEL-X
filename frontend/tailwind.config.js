/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#070a13",
        card: {
          DEFAULT: "#0e1626",
          glass: "rgba(14, 22, 38, 0.7)",
        },
        cyan: {
          accent: "#00f0ff",
        },
        crimson: {
          threat: "#ff0055",
        },
        amber: {
          glow: "#ffaa00",
        },
        emerald: {
          matrix: "#00ff9d",
        },
        slate: {
          muted: "#94a3b8",
        },
        cyber: {
          bg: "#070a13",
          card: "#0e1626",
          border: "rgba(0, 240, 255, 0.18)",
          accent: "#00f0ff",
          threat: "#ff0055",
          crypto: "#ffaa00",
          verified: "#00ff9d",
        },
      },
      fontFamily: {
        sans: ["Inter", "Outfit", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      boxShadow: {
        "cyber-glow": "0 0 20px rgba(0, 240, 255, 0.25)",
        "threat-glow": "0 0 20px rgba(255, 0, 85, 0.35)",
        "amber-glow": "0 0 20px rgba(255, 170, 0, 0.3)",
        "emerald-glow": "0 0 20px rgba(0, 255, 157, 0.3)",
      },
      animation: {
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-line": "scanline 6s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.05)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
};
