// store/slices/uiSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
	// Theme
	isDark: false,

	// Navigation
	currentPage: "home",
	isMobileMenuOpen: false,

	// Loading states
	isLoading: false,
	loadingMessage: "",
	uploadProgress: 0,

	// Error handling
	error: null,
	errorType: null, // 'upload', 'processing', 'quiz', 'chat'

	// UI states
	isScrolled: false,

	// Modal states
	showModal: false,
	modalType: null,
	modalData: null,

	// Notifications
	notifications: [],

	// Page-specific states
	activeTab: "flashcards", // for study page
	showResults: false, // for quiz page
	currentQuestion: 0, // for quiz page
};

const uiSlice = createSlice({
	name: "ui",
	initialState,
	reducers: {
		// Theme actions
		toggleDarkMode: (state) => {
			state.isDark = !state.isDark;
			try {
				localStorage.setItem("darkMode", JSON.stringify(state.isDark));
			} catch (error) {
				console.warn("Could not save theme preference to localStorage");
			}
		},

		setDarkMode: (state, action) => {
			state.isDark = action.payload;
			try {
				localStorage.setItem("darkMode", JSON.stringify(state.isDark));
			} catch (error) {
				console.warn("Could not save theme preference to localStorage");
			}
		},

		initializeTheme: (state) => {
			try {
				const savedTheme = localStorage.getItem("darkMode");
				if (savedTheme !== null) {
					state.isDark = JSON.parse(savedTheme);
				} else {
					// Check system preference
					const prefersDark = window.matchMedia(
						"(prefers-color-scheme: dark)",
					).matches;
					state.isDark = prefersDark;
					localStorage.setItem("darkMode", JSON.stringify(prefersDark));
				}
			} catch (error) {
				state.isDark = false;
			}
		},

		// Navigation actions
		setCurrentPage: (state, action) => {
			state.currentPage = action.payload;
		},

		toggleMobileMenu: (state) => {
			state.isMobileMenuOpen = !state.isMobileMenuOpen;
		},

		closeMobileMenu: (state) => {
			state.isMobileMenuOpen = false;
		},

		setIsScrolled: (state, action) => {
			state.isScrolled = action.payload;
		},

		// Loading actions
		setLoading: (state, action) => {
			state.isLoading = action.payload.isLoading;
			state.loadingMessage = action.payload.message || "";
		},

		setUploadProgress: (state, action) => {
			state.uploadProgress = action.payload;
		},

		resetUploadProgress: (state) => {
			state.uploadProgress = 0;
		},

		// Error actions
		setError: (state, action) => {
			state.error = action.payload.message;
			state.errorType = action.payload.type || null;
		},

		clearError: (state) => {
			state.error = null;
			state.errorType = null;
		},

		// Modal actions
		openModal: (state, action) => {
			state.showModal = true;
			state.modalType = action.payload.type;
			state.modalData = action.payload.data || null;
		},

		closeModal: (state) => {
			state.showModal = false;
			state.modalType = null;
			state.modalData = null;
		},

		// Notification actions
		addNotification: (state, action) => {
			const notification = {
				id: Date.now(),
				type: action.payload.type || "info", // 'success', 'error', 'warning', 'info'
				title: action.payload.title,
				message: action.payload.message,
				duration: action.payload.duration || 5000,
				timestamp: new Date().toISOString(),
			};
			state.notifications.push(notification);
		},

		removeNotification: (state, action) => {
			state.notifications = state.notifications.filter(
				(notification) => notification.id !== action.payload,
			);
		},

		clearAllNotifications: (state) => {
			state.notifications = [];
		},

		// Page-specific actions
		setActiveTab: (state, action) => {
			state.activeTab = action.payload;
		},

		setShowResults: (state, action) => {
			state.showResults = action.payload;
		},

		setCurrentQuestion: (state, action) => {
			state.currentQuestion = action.payload;
		},

		resetQuizState: (state) => {
			state.showResults = false;
			state.currentQuestion = 0;
		},

		// Utility actions
		resetUIState: (state) => {
			// Reset all UI state except theme preference
			const theme = state.isDark;
			Object.assign(state, {
				...initialState,
				isDark: theme,
			});
		},
	},
});

export const {
	// Theme
	toggleDarkMode,
	setDarkMode,
	initializeTheme,

	// Navigation
	setCurrentPage,
	toggleMobileMenu,
	closeMobileMenu,
	setIsScrolled,

	// Loading
	setLoading,
	setUploadProgress,
	resetUploadProgress,

	// Error
	setError,
	clearError,

	// Modal
	openModal,
	closeModal,

	// Notifications
	addNotification,
	removeNotification,
	clearAllNotifications,

	// Page-specific
	setActiveTab,
	setShowResults,
	setCurrentQuestion,
	resetQuizState,

	// Utility
	resetUIState,
} = uiSlice.actions;

export default uiSlice.reducer;
