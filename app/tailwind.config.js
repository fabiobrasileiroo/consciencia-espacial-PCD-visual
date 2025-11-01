import { colors } from './src/styles/colors';
import {fontFamily} from "./src/styles/fonts"; 

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: colors,
      fontFamily: fontFamily,
    },
  },
  plugins: [],
}