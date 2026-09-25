/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
      },
      colors: {
        carbon: {
          'gray-100': '#161616', // Main Dark Canvas
          'gray-90': '#262626',  // Container / Tile Layer 1
          'gray-80': '#393939',  // Subtle Borders / Active Elements
          'gray-70': '#525252',  // Strong Borders / Divider Lines
          'gray-60': '#6f6f6f',  // Inactive / Disabled
          'gray-50': '#8d8d8d',  // Helper / Secondary labels
          'gray-30': '#c6c6c6',  // Readable Secondary Body
          'gray-10': '#f4f4f4',  // Primary Heading Text
          'blue-60': '#0f62fe',  // Carbon Interactive Blue
          'blue-70': '#0043ce',  // Hover / Active Blue
          'blue-80': '#002d9c',  // Deep Accent
          'green-50': '#24a148', // Status Normal / Safe
          'red-60': '#da1e28',   // Critical Alert / Deadlock
          'amber-40': '#ff832b', // Fallback / Attention
          'purple-60': '#8a3ffc' // Telemetry / Compute
        }
      },
      borderRadius: {
        'none': '0px',
        'sm': '2px',
        'DEFAULT': '0px',
        'md': '2px',
        'lg': '2px',
        'xl': '2px',
        '2xl': '2px',
      }
    },
  },
  plugins: [],
}