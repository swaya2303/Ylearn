import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Components
import Navigation from "./components/Navigation";
import LandingPage from "./pages/Landing";
import UploadPage from "./pages/Upload";
import StudyPage from "./pages/Study";
import QuizPage from "./pages/Quiz";
import TutorPage from "./pages/Tutor";
import DashboardPage from "./pages/Dashboard";
import LoadingSpinner from "./components/Loading";
import ErrorAlert from "./components/Error";

// Hooks
import { useSelector, useDispatch } from "react-redux";
import { initializeTheme } from "./store/slices/uiSlice";
import Footer from "./components/Footer";

// App Content Component (inside Provider)
const AppContent = () => {
	const dispatch = useDispatch();
	const { isDark, currentPage } = useSelector((state) => state.ui);

	useEffect(() => {
		dispatch(initializeTheme());
	}, [dispatch]);

	useEffect(() => {
		if (isDark) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [isDark]);

	return (
		<div
			className={`min-h-screen transition-colors duration-500 ${
				isDark ? "dark bg-gray-900" : "bg-gray-50"
			}`}
		>
			<Router>
				<Navigation />
				<main className="relative">
					<AnimatePresence mode="wait">
						<Routes>
							<Route
								path="/"
								element={
									<motion.div
										key="home"
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
										transition={{ duration: 0.3 }}
									>
										<LandingPage />
									</motion.div>
								}
							/>
							<Route
								path="/upload"
								element={
									<motion.div
										key="upload"
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
										transition={{ duration: 0.3 }}
									>
										<UploadPage />
									</motion.div>
								}
							/>
							<Route
								path="/study"
								element={
									<motion.div
										key="study"
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
										transition={{ duration: 0.3 }}
									>
										<StudyPage />
									</motion.div>
								}
							/>
							<Route
								path="/quiz"
								element={
									<motion.div
										key="quiz"
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
										transition={{ duration: 0.3 }}
									>
										<QuizPage />
									</motion.div>
								}
							/>
							<Route
								path="/tutor"
								element={
									<motion.div
										key="tutor"
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
										transition={{ duration: 0.3 }}
									>
										<TutorPage />
									</motion.div>
								}
							/>
							<Route
								path="/dashboard"
								element={
									<motion.div
										key="dashboard"
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
										transition={{ duration: 0.3 }}
									>
										<DashboardPage />
									</motion.div>
								}
							/>
						</Routes>
					</AnimatePresence>
				</main>

				{/* Global Components */}
				<LoadingSpinner />
				<ErrorAlert />
				<Footer />
			</Router>
		</div>
	);
};

// Main App Component
const App = () => {
	return (
		<Provider store={store}>
			<AppContent />
		</Provider>
	);
};

export default App;
