import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "motion/react";
import {
	Upload,
	Brain,
	MessageCircle,
	BookOpen,
	BarChart3,
	ChevronRight,
} from "lucide-react";
import RoadmapSection from "../components/RoadmapSection";
import DemoShowcase from "../components/DemoShowcase";
import HowItWorksSection from "../components/HowItWorksSection";

// Animation variants
const fadeInUp = {
	initial: { opacity: 0, y: 60 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.8, ease: "easeOut" },
};

const staggerContainer = {
	initial: {},
	animate: {
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const scaleIn = {
	initial: { opacity: 0, scale: 0.8 },
	animate: { opacity: 1, scale: 1 },
	exit: { opacity: 0, scale: 0.8 },
};

const LandingPage = () => {
	const isDark = useSelector((state) => state.ui.isDark);

	const features = [
		{
			icon: Upload,
			title: "Smart OCR",
			description:
				"Convert handwritten notes to digital text with AI-powered correction",
		},
		{
			icon: Brain,
			title: "Interactive Quizzes",
			description: "Auto-generated quizzes with detailed explanations",
		},
		{
			icon: MessageCircle,
			title: "AI Tutor",
			description:
				"Chat with AI about your notes, ask questions, get explanations",
		},
		{
			icon: BookOpen,
			title: "Study Materials",
			description:
				"Visual mind maps and study materials generated from your content",
		},
		{
			icon: BarChart3,
			title: "Progress Tracking",
			description:
				"Track your learning progress and quiz performance over time",
		},
	];

	return (
		<motion.div
			className={`min-h-screen pt-16 overflow-hidden ${
				isDark
					? "bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900"
					: "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
			}`}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.8 }}
		>
			{/* Aurora effect */}
			<div
				className={`absolute inset-0 ${
					isDark
						? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-900 to-gray-900"
						: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100 via-white to-white"
				}`}
			>
				<div
					className={`absolute top-0 left-1/4 right-1/4 h-[500px] ${
						isDark
							? "bg-gradient-to-b from-cyan-500/20 via-blue-500/20 to-transparent"
							: "bg-gradient-to-b from-blue-200/40 via-cyan-200/30 to-transparent"
					} blur-3xl`}
				/>
				<div
					className={`absolute top-0 left-1/3 right-1/3 h-[400px] ${
						isDark
							? "bg-gradient-to-b from-purple-500/20 via-pink-500/20 to-transparent"
							: "bg-gradient-to-b from-purple-200/40 via-pink-200/30 to-transparent"
					} blur-3xl animate-pulse`}
				/>
			</div>

			<div className="container max-w-7xl mx-auto px-6 py-20 relative z-10">
				{/* Hero Section */}
				<motion.div
					className="text-center flex items-center flex-col justify-center mb-16"
					variants={staggerContainer}
					initial="initial"
					animate="animate"
				>
					<motion.h1
						className={`text-6xl md:text-7xl font-bold mb-6 tracking-tighter ${
							isDark ? "text-white" : "text-gray-900"
						}`}
						variants={fadeInUp}
					>
						Transform Your
					</motion.h1>

					<motion.span
						className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent text-6xl md:text-7xl font-bold block mb-8 tracking-tight drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] dark:drop-shadow-[0_10px_20px_rgba(0,0,0,0.7)]"
						variants={fadeInUp}
						transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
					>
						Study Experience
					</motion.span>

					<motion.p
						className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed ${
							isDark ? "text-gray-300" : "text-gray-600"
						}`}
						variants={fadeInUp}
						transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
					>
						Upload handwritten notes, get AI-powered study materials, take
						interactive quizzes, and chat with your personal AI tutor.
					</motion.p>

					<motion.div
						className="flex flex-col sm:flex-row gap-6 justify-center"
						variants={fadeInUp}
						transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
					>
						<Link to="/upload">
							<motion.button
								className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-2xl flex items-center justify-center space-x-2"
								whileHover={{
									scale: 1.05,
									y: -5,
									boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)",
								}}
								whileTap={{ scale: 0.95 }}
							>
								<span>Get Started Now</span>
								<ChevronRight size={20} />
							</motion.button>
						</Link>
						<Link to="/dashboard">
							<motion.button
								className={`px-8 py-4 border-2 rounded-2xl font-semibold text-lg flex items-center justify-center space-x-2 ${
									isDark
										? "border-gray-600 text-gray-300 hover:bg-gray-800"
										: "border-gray-300 text-gray-700 hover:bg-white"
								}`}
								whileHover={{
									scale: 1.05,
									y: -5,
									borderColor: isDark ? "#60A5FA" : "#3B82F6",
								}}
								whileTap={{ scale: 0.95 }}
							>
								<BarChart3 size={20} />
								<span>View Dashboard</span>
							</motion.button>
						</Link>
					</motion.div>
				</motion.div>

				{/* Features Grid */}
				<motion.div
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
					variants={staggerContainer}
					initial="initial"
					animate="animate"
				>
					{features.map((feature, index) => {
						const Icon = feature.icon;
						return (
							<motion.div
								key={index}
								className={`p-8 rounded-3xl transition-colors duration-500 cursor-pointer ${
									isDark
										? "bg-gray-800/50 backdrop-blur-lg border border-gray-700"
										: "bg-gray-100/70 backdrop-blur-lg border border-gray-300"
								}`}
								variants={scaleIn}
								transition={{ delay: index * 0.1 }}
								whileHover={{
									scale: 1.05,
									y: -10,
									rotateY: 5,
									boxShadow: isDark
										? "0 20px 40px rgba(59, 130, 246, 0.1)"
										: "0 20px 40px rgba(0, 0, 0, 0.1)",
								}}
								style={{ transformStyle: "preserve-3d" }}
							>
								<motion.div
									className={`mb-6 ${
										isDark ? "text-blue-400" : "text-blue-600"
									}`}
									whileHover={{
										scale: 1.2,
										rotate: [0, -10, 10, 0],
										transition: { duration: 0.5 },
									}}
								>
									<Icon size={48} />
								</motion.div>
								<h3
									className={`text-2xl font-bold mb-4 ${
										isDark ? "text-white" : "text-gray-900"
									}`}
								>
									{feature.title}
								</h3>
								<p
									className={`text-lg leading-relaxed ${
										isDark ? "text-gray-300" : "text-gray-600"
									}`}
								>
									{feature.description}
								</p>
							</motion.div>
						);
					})}
				</motion.div>

				{/* Stats Section */}
				{/* <motion.div
					className={`text-center py-16 rounded-3xl ${
						isDark
							? "bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-lg"
							: "bg-gradient-to-r from-blue-100/80 to-purple-100/80 backdrop-blur-lg"
					}`}
					initial={{ opacity: 0, y: 50 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, ease: "easeOut" }}
					viewport={{ once: true }}
					whileHover={{ scale: 1.02 }}
				>
					<motion.h2
						className={`text-4xl font-bold mb-12 ${
							isDark ? "text-white" : "text-gray-900"
						}`}
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.2 }}
						viewport={{ once: true }}
					>
						Trusted by Students Worldwide
					</motion.h2>
					<motion.div
						className="grid grid-cols-1 md:grid-cols-3 gap-8"
						variants={staggerContainer}
						initial="initial"
						whileInView="animate"
						viewport={{ once: true }}
					>
						{[
							{ number: "10K+", label: "Notes Processed" },
							{ number: "50K+", label: "Quizzes Generated" },
							{ number: "95%", label: "Accuracy Rate" },
						].map((stat, index) => (
							<motion.div
								key={index}
								className="text-center"
								variants={fadeInUp}
								transition={{ delay: index * 0.1 }}
								whileHover={{ scale: 1.1 }}
							>
								<motion.div
									className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2"
									animate={{ scale: [1, 1.05, 1] }}
									transition={{ duration: 2, repeat: Infinity }}
								>
									{stat.number}
								</motion.div>
								<div
									className={`text-xl ${
										isDark ? "text-gray-300" : "text-gray-600"
									}`}
								>
									{stat.label}
								</div>
							</motion.div>
						))}
					</motion.div>
				</motion.div> */}
				{/* Roadmap Section */}
				{/* <RoadmapSection /> */}
        {/* Demo Section */}
				{/* <DemoShowcase /> */}
				{/* How It Works Section */}
				<HowItWorksSection />
			</div>
		</motion.div>
	);
};

export default LandingPage;
