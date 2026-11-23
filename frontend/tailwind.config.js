/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        rojo: {
          DEFAULT: "#E4492F",
          cta: "#C8371E",
          hover: "#AD2C16",
          soft: "#FDECE8",
        },
        verde: {
          DEFAULT: "#8AB544",
          text: "#426312",
          soft: "#EEF6DF",
        },
        mostaza: {
          DEFAULT: "#E8B93E",
          text: "#7A5600",
          soft: "#FDF4D7",
        },
        marron: {
          DEFAULT: "#4A2C25",
          muted: "#75564E",
        },
        crema: {
          DEFAULT: "#FFF8EC",
          elevated: "#FAF0DE",
        },
        blanco: "#FFFFFF",
        borde: "#EBDCCB",
        negro: "#1A1A1A",
      },
      fontFamily: {
        display: ['"Pacifico"', "cursive"],
        heading: ['"Baloo 2"', "system-ui", "sans-serif"],
        body: ['"Nunito"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1.5rem",
        sticker: "1.75rem",
      },
      boxShadow: {
        "sticker-sm": "0 0 0 3px #FFFFFF, 0 4px 12px rgba(74, 44, 37, 0.08)",
        "sticker-md": "0 0 0 4px #FFFFFF, 0 10px 24px rgba(74, 44, 37, 0.12)",
        "sticker-lg": "0 0 0 5px #FFFFFF, 0 18px 36px rgba(74, 44, 37, 0.16)",
        cta: "0 8px 20px -4px rgba(200, 55, 30, 0.36)",
        "cta-hover": "0 12px 24px -4px rgba(173, 44, 22, 0.44)",
      },
      transitionTimingFunction: {
        tactile: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
