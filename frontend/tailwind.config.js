
export default {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	darkMode: "class",
	theme: {
		extend: {
			colors: {
				primary: {
					50: "#eff6ff",
					100: "#dbeafe",
					200: "#bfdbfe",
					300: "#93c5fd",
					400: "#60a5fa",
					500: "#3b82f6",
					600: "#2563eb",
					700: "#1d4ed8",
					800: "#1e40af",
					900: "#1e3a8a",
				},
			},
			animation: {
				"bounce-slow": "bounce 2s infinite",
				"pulse-slow": "pulse 3s infinite",
				"spin-slow": "spin 3s linear infinite",
			},
			boxShadow: {
				glow: "0 0 20px rgba(59, 130, 246, 0.3)",
				"glow-lg": "0 0 40px rgba(59, 130, 246, 0.2)",
			},
			backdropBlur: {
				xs: "2px",
			},
			scale: {
				102: "1.02",
				103: "1.03",
			},
		},
	},
	plugins: [],
};
