import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          coral: "#ff6a3d",
          flame: "#ff3b2f",
          teal: "#11b5b8",
          lagoon: "#0c8bd6"
        }
      },
      fontFamily: {
        display: ["ClashDisplay", "ui-sans-serif", "system-ui"],
        body: ["Manrope", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        glow: "0 20px 60px rgba(255, 106, 61, 0.22)",
        soft: "0 18px 40px rgba(15, 23, 42, 0.12)"
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        }
      },
      animation: {
        marquee: "marquee 60s linear infinite"
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at top left, rgba(12, 139, 214, 0.15), transparent 45%), radial-gradient(circle at top right, rgba(255, 106, 61, 0.22), transparent 40%)",
        "tech-glow": "linear-gradient(135deg, rgba(17, 181, 184, 0.18), rgba(255, 106, 61, 0.18))"
      }
    }
  },
  plugins: []
};

export default config;
