import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "motion/react";
import {
	Home,
	Upload,
	BookOpen,
	Brain,
	MessageCircle,
	BarChart3,
	Sun,
	Moon,
	Menu,
	X,
} from "lucide-react";
import {
	toggleDarkMode,
	toggleMobileMenu,
	closeMobileMenu,
	setIsScrolled,
	setCurrentPage,
} from "../store/slices/uiSlice";

const Navigation = () => {
	const dispatch = useDispatch();
	const location = useLocation();
	const { isDark, isMobileMenuOpen, isScrolled } = useSelector(
		(state) => state.ui,
	);

	const navItems = [
		{ id: "home", label: "Home", icon: Home, path: "/" },
		{ id: "upload", label: "Upload", icon: Upload, path: "/upload" },
		{ id: "study", label: "Study", icon: BookOpen, path: "/study" },
		{ id: "quiz", label: "Quiz", icon: Brain, path: "/quiz" },
		{ id: "tutor", label: "AI Tutor", icon: MessageCircle, path: "/tutor" },
		{
			id: "dashboard",
			label: "Dashboard",
			icon: BarChart3,
			path: "/dashboard",
		},
	];

	// Handle scroll detection
	useEffect(() => {
		const handleScroll = () => {
			dispatch(setIsScrolled(window.scrollY > 20));
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [dispatch]);

	// Update current page based on location
	useEffect(() => {
		const currentPath = location.pathname;
		const currentItem = navItems.find((item) => item.path === currentPath);
		if (currentItem) {
			dispatch(setCurrentPage(currentItem.id));
		}
	}, [location.pathname, dispatch]);

	// Close mobile menu when route changes
	useEffect(() => {
		dispatch(closeMobileMenu());
	}, [location.pathname, dispatch]);

	const handleMobileMenuToggle = () => {
		dispatch(toggleMobileMenu());
	};

	const handleThemeToggle = () => {
		dispatch(toggleDarkMode());
	};

	const getCurrentPageId = () => {
		const currentPath = location.pathname;
		const currentItem = navItems.find((item) => item.path === currentPath);
		return currentItem ? currentItem.id : "home";
	};

	const currentPageId = getCurrentPageId();

	return (
		<>
			<title>Ylearn | Home</title>
			<motion.nav
				initial={{ y: -100 }}
				animate={{ y: 0 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
				className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
					isScrolled ? "py-2" : "py-4"
				} ${
					isDark
						? "bg-gray-900/95 border-gray-700"
						: "bg-white/95 border-gray-200"
				} border-b backdrop-blur-lg`}
			>
				<div className="max-w-7xl mx-auto px-4">
					<div className="flex justify-between items-center">
						{/* Logo */}
						<Link to="/">
							<motion.div
								className="flex items-center space-x-3 cursor-pointer"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<motion.img
									src="ylearn.png"
									className="w-10 h-10 rounded-lg flex items-center justify-center"
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{
					          type: "tween",
										ease: "easeInOut",
										duration: 0.5,
										delay: 0.8,
									}}
								/>
								<motion.span
									className={`font-bold text-xl ${
										isDark ? "text-white" : "text-gray-900"
									}`}
									whileHover={{ color: isDark ? "#60A5FA" : "#2563EB" }}
								>
									YLearn
								</motion.span>
							</motion.div>
						</Link>

						{/* Desktop Navigation */}
						<div className="hidden md:flex items-center space-x-1">
							{navItems.map((item, index) => {
								const Icon = item.icon;
								const isActive = currentPageId === item.id;

								return (
									<Link
										key={item.id}
										to={item.path}
									>
										<motion.div
											className={`px-4 py-2 rounded-lg font-medium transition-colors duration-300 flex items-center space-x-2 ${
												isActive
													? isDark
														? "bg-blue-600 text-white"
														: "bg-blue-100 text-blue-700"
													: isDark
													? "text-gray-300 hover:text-white hover:bg-gray-800"
													: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
											}`}
											whileHover={{ scale: 1.05, y: -2 }}
											whileTap={{ scale: 0.95 }}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.1 }}
										>
											<Icon size={18} />
											<span>{item.label}</span>
										</motion.div>
									</Link>
								);
							})}
						</div>

						{/* Mobile Menu Button & Dark Mode Toggle */}
						<div className="flex items-center space-x-2">
							<motion.button
								onClick={handleThemeToggle}
								className={`p-3 rounded-full transition-colors duration-500 ${
									isDark
										? "bg-gray-800 text-yellow-400"
										: "bg-amber-100 text-amber-900"
								}`}
								whileHover={{ scale: 1.1, rotate: 12 }}
								whileTap={{ scale: 0.9 }}
							>
								<motion.div
									animate={{ rotate: isDark ? 180 : 0 }}
									transition={{ duration: 0.5, ease: "easeInOut" }}
								>
									{isDark ? <Sun size={20} /> : <Moon size={20} />}
								</motion.div>
							</motion.button>

							<motion.button
								onClick={handleMobileMenuToggle}
								className={`md:hidden p-2 rounded-lg ${
									isDark ? "text-gray-300" : "text-gray-600"
								}`}
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.9 }}
							>
								{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
							</motion.button>
						</div>
					</div>

					{/* Mobile Navigation */}
					<AnimatePresence>
						{isMobileMenuOpen && (
							<motion.div
								className="md:hidden py-3 border-t border-gray-200 dark:border-gray-700 mt-4"
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								transition={{ duration: 0.3 }}
							>
								<div className="space-y-2">
									{navItems.map((item, index) => {
										const Icon = item.icon;
										const isActive = currentPageId === item.id;

										return (
											<Link
												key={item.id}
												to={item.path}
											>
												<motion.div
													className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-300 ${
														isActive
															? isDark
																? "bg-blue-600 text-white"
																: "bg-blue-100 text-blue-700"
															: isDark
															? "text-gray-400 hover:text-white hover:bg-gray-800"
															: "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
													}`}
													initial={{ opacity: 0, x: -20 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ delay: index * 0.1 }}
													whileHover={{ x: 5 }}
												>
													<Icon size={20} />
													<span>{item.label}</span>
												</motion.div>
											</Link>
										);
									})}
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</motion.nav>
		</>
	);
};

export default Navigation;
