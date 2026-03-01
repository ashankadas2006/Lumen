/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4 — scan all component and screen files
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Core palette
        background: "#0A0A0B",   // Obsidian Night
        card:       "#161618",   // Card backgrounds
        primary:    "#D4AF37",   // Venetian Gold
        gold:       "#D4AF37",   // Alias
        ai:         "#6366F1",   // Ethereal Violet
        violet:     "#6366F1",   // Alias
      },
      fontFamily: {
        playfair:  ["PlayfairDisplay_700Bold"],
        inter:     ["Inter_400Regular"],
        "inter-medium": ["Inter_500Medium"],
        "inter-bold":   ["Inter_700Bold"],
      },
    },
  },
  plugins: [],
};
