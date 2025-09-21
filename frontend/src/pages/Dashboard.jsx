import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "motion/react";
import {
	BookOpen,
	Brain,
	Target,
	Flame,
	Trophy,
	TrendingUp,
	CalendarClock,
	CheckCircle2,
	AlertTriangle,
} from "lucide-react";

const DashboardPage = () => {
	const isDark = useSelector((state) => state.ui.isDark);
	const {
		quizResults = [],
		totalStudySessions = 0,
		totalQuizzesTaken = 0,
		averageQuizScore = 0,
		studyStreak = 0,
		studyTime, // optional: minutes or string
		weakAreas = [],
		strongAreas = [],
	} = useSelector((state) => state.study);

	const recentQuizzes = Array.isArray(quizResults)
		? quizResults.slice(0, 5)
		: [];

	const formatStudyTime = (val) => {
		if (typeof val === "number" && !Number.isNaN(val)) {
			const h = Math.floor(val / 60);
			const m = val % 60;
			if (h <= 0) return `${m}m`;
			if (m <= 0) return `${h}h`;
			return `${h}h ${m}m`;
		}
		if (typeof val === "string" && val.trim()) return val;
		return "—";
	};

	const scoreColor = (p) =>
		p >= 80 ? "text-green-500" : p >= 60 ? "text-yellow-500" : "text-red-500";
	const barColor = (p) =>
		p >= 80 ? "bg-green-500" : p >= 60 ? "bg-yellow-500" : "bg-red-500";
	const badgeClasses = (p, isDark) =>
		`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
			p >= 80
				? isDark
					? "bg-green-900/30 text-green-300"
					: "bg-green-50 text-green-700"
				: p >= 60
				? isDark
					? "bg-yellow-900/30 text-yellow-300"
					: "bg-yellow-50 text-yellow-700"
				: isDark
				? "bg-red-900/30 text-red-300"
				: "bg-red-50 text-red-700"
		}`;

	const statsCards = [
		{
			id: "sessions",
			title: "Study Sessions",
			value: totalStudySessions,
			Icon: BookOpen,
			gradient: "from-blue-500 to-indigo-600",
			sub: `Time: ${formatStudyTime(studyTime)}`,
		},
		{
			id: "quizzes",
			title: "Quizzes Taken",
			value: totalQuizzesTaken,
			Icon: Brain,
			gradient: "from-purple-500 to-fuchsia-600",
			sub: "Keep the streak going!",
		},
		{
			id: "avg",
			title: "Average Score",
			value: `${averageQuizScore}%`,
			Icon: Target,
			gradient: "from-emerald-500 to-teal-600",
			sub:
				averageQuizScore >= 80
					? "Great progress"
					: averageQuizScore >= 60
					? "Getting there"
					: "Practice more",
		},
		{
			id: "streak",
			title: "Study Streak",
			value: `${studyStreak} days`,
			Icon: Flame,
			gradient: "from-orange-500 to-rose-600",
			sub: studyStreak > 0 ? "Daily commitment" : "Start your streak",
		},
	];

	return (
		<motion.div
			className={`min-h-screen pt-20 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.6 }}
		>
			{/* Aurora effect (unchanged) */}
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

			<div className="container mx-auto px-6 py-12 max-w-7xl z-10 relative">
				{/* Header */}
				<motion.div
					className="text-center mb-10"
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7 }}
				>
					<h1 className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
						Dashboard
					</h1>
					<p
						className={`text-lg ${isDark ? "text-gray-300" : "text-gray-600"}`}
					>
						Track your learning progress and performance
					</p>
				</motion.div>

				{/* Quick actions */}
				<div className="flex flex-wrap items-center gap-3 mb-8 justify-center">
					<Link to="/quiz">
						<motion.button
							className="px-4 py-2.5 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 shadow"
							whileHover={{ y: -2, scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
						>
							Start a Quick Quiz
						</motion.button>
					</Link>
					<Link to="/upload">
						<motion.button
							className={`px-4 py-2.5 rounded-xl font-semibold border ${
								isDark
									? "border-gray-700 text-gray-200 hover:bg-gray-800"
									: "border-gray-300 text-gray-700 hover:bg-gray-100"
							} transition-colors`}
							whileHover={{ y: -2 }}
							whileTap={{ scale: 0.98 }}
						>
							Upload New Notes
						</motion.button>
					</Link>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
					{statsCards.map((stat, index) => (
						<motion.div
							key={stat.id}
							className={`p-6 rounded-2xl border ${
								isDark
									? "bg-gray-800/70 border-gray-700"
									: "bg-white border-gray-200 shadow-sm"
							}`}
							initial={{ opacity: 0, y: 16 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.08, duration: 0.4 }}
							whileHover={{ y: -4 }}
						>
							<div className="flex items-start justify-between">
								<div
									className={`w-11 h-11 rounded-xl bg-gradient-to-r ${stat.gradient} text-white flex items-center justify-center shadow`}
								>
									<stat.Icon size={20} />
								</div>

								{/* Average score ring */}
								{stat.id === "avg" ? (
									<div className="relative w-16 h-16">
										<div
											className="absolute inset-0 rounded-full"
											style={{
												background: `conic-gradient(#10b981 ${Math.min(
													100,
													Number(averageQuizScore) || 0,
												)}%, ${isDark ? "#1f2937" : "#e5e7eb"} 0)`,
											}}
										/>
										<div
											className={`absolute inset-1 rounded-full ${
												isDark ? "bg-gray-800" : "bg-white"
											}`}
										/>
										<div
											className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${scoreColor(
												Number(averageQuizScore) || 0,
											)}`}
										>
											{stat.value}
										</div>
									</div>
								) : (
									<div
										className={`text-2xl font-bold ${
											isDark ? "text-white" : "text-gray-900"
										}`}
									>
										{stat.value}
									</div>
								)}
							</div>

							<h3
								className={`mt-4 font-semibold ${
									isDark ? "text-white" : "text-gray-900"
								}`}
							>
								{stat.title}
							</h3>
							<p
								className={`text-sm mt-1 ${
									isDark ? "text-gray-400" : "text-gray-600"
								}`}
							>
								{stat.sub}
							</p>
						</motion.div>
					))}
				</div>

				{/* Recent Quiz Results */}
				<motion.div
					className={`p-7 rounded-2xl border mb-10 ${
						isDark
							? "bg-gray-800/70 border-gray-700"
							: "bg-white border-gray-200 shadow-sm"
					}`}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<div className="flex items-center justify-between mb-5">
						<h2
							className={`text-xl font-bold ${
								isDark ? "text-white" : "text-gray-900"
							}`}
						>
							Recent Quiz Results
						</h2>
						{recentQuizzes.length > 0 && (
							<Link
								to="/quiz"
								className={`text-sm font-medium ${
									isDark ? "text-blue-400" : "text-blue-600"
								} hover:underline`}
							>
								View all
							</Link>
						)}
					</div>

					{recentQuizzes.length > 0 ? (
						<div className="space-y-4">
							<AnimatePresence>
								{recentQuizzes.map((quiz, index) => {
									const p = Number(quiz.percentage) || 0;
									const status =
										p >= 80 ? "Excellent" : p >= 60 ? "Good" : "Practice";
									const date = quiz?.completedAt
										? new Date(quiz.completedAt)
										: null;

									return (
										<motion.div
											key={quiz.completedAt ?? index}
											className={`p-4 rounded-xl ${
												isDark ? "bg-gray-900/50" : "bg-gray-50"
											} border ${
												isDark ? "border-gray-700" : "border-gray-200"
											}`}
											initial={{ opacity: 0, x: -16 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: 16 }}
											transition={{ delay: index * 0.05 }}
										>
											<div className="flex items-center justify-between gap-4">
												<div className="min-w-0">
													<p
														className={`font-medium truncate ${
															isDark ? "text-white" : "text-gray-900"
														}`}
													>
														Quiz #{quizResults.length - index}
													</p>
													<div className="flex items-center gap-2 mt-1 text-xs">
														<CalendarClock
															className={`h-4 w-4 ${
																isDark ? "text-gray-400" : "text-gray-500"
															}`}
														/>
														<span
															className={`${
																isDark ? "text-gray-400" : "text-gray-600"
															}`}
														>
															{date ? date.toLocaleDateString() : "—"}
														</span>
													</div>
												</div>

												<div className="text-right">
													<div className={`text-lg font-bold ${scoreColor(p)}`}>
														{p}%
													</div>
													<div
														className={`text-xs mt-0.5 ${
															isDark ? "text-gray-400" : "text-gray-600"
														}`}
													>
														{quiz.score}/{quiz.total}
													</div>
													<span
														className={`${badgeClasses(
															p,
															isDark,
														)} mt-2 inline-block`}
													>
														{p >= 80 ? (
															<Trophy size={12} />
														) : p >= 60 ? (
															<TrendingUp size={12} />
														) : (
															<AlertTriangle size={12} />
														)}
														{status}
													</span>
												</div>
											</div>

											<div
												className={`mt-3 h-2 rounded-full overflow-hidden ${
													isDark ? "bg-gray-700" : "bg-gray-200"
												}`}
											>
												<div
													className={`h-full ${barColor(p)}`}
													style={{ width: `${Math.min(100, Math.max(0, p))}%` }}
												/>
											</div>
										</motion.div>
									);
								})}
							</AnimatePresence>
						</div>
					) : (
						<div className="text-center py-10">
							<p className={isDark ? "text-gray-400" : "text-gray-600"}>
								No quiz results yet. Take your first quiz to see your progress
								here!
							</p>
							<Link to="/quiz">
								<motion.button
									className="mt-4 px-4 py-2.5 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 shadow"
									whileHover={{ y: -2 }}
									whileTap={{ scale: 0.98 }}
								>
									Take a Quiz
								</motion.button>
							</Link>
						</div>
					)}
				</motion.div>

				{/* Performance Analysis */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Strong Areas */}
					<motion.div
						className={`p-7 rounded-2xl border ${
							isDark
								? "bg-gray-800/70 border-gray-700"
								: "bg-white border-gray-200 shadow-sm"
						}`}
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
					>
						<div className="flex items-center gap-2 mb-5">
							<CheckCircle2
								className={isDark ? "text-green-400" : "text-green-600"}
							/>
							<h3
								className={`text-lg font-bold ${
									isDark ? "text-white" : "text-gray-900"
								}`}
							>
								Strong Areas
							</h3>
						</div>

						{strongAreas.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{strongAreas.slice(0, 6).map((area, index) => (
									<motion.div
										key={`${area}-${index}`}
										className={`p-3 rounded-lg border ${
											isDark
												? "bg-green-950/30 border-green-900/40"
												: "bg-green-50 border-green-200"
										}`}
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
									>
										<p
											className={`text-sm ${
												isDark ? "text-green-200" : "text-green-800"
											}`}
										>
											{area.length > 100 ? `${area.substring(0, 100)}…` : area}
										</p>
									</motion.div>
								))}
							</div>
						) : (
							<p className={isDark ? "text-gray-400" : "text-gray-600"}>
								Complete more quizzes to identify your strong areas.
							</p>
						)}
					</motion.div>

					{/* Areas for Improvement */}
					<motion.div
						className={`p-7 rounded-2xl border ${
							isDark
								? "bg-gray-800/70 border-gray-700"
								: "bg-white border-gray-200 shadow-sm"
						}`}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5, delay: 0.15 }}
					>
						<div className="flex items-center gap-2 mb-5">
							<AlertTriangle
								className={isDark ? "text-yellow-400" : "text-yellow-600"}
							/>
							<h3
								className={`text-lg font-bold ${
									isDark ? "text-white" : "text-gray-900"
								}`}
							>
								Areas for Improvement
							</h3>
						</div>

						{weakAreas.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{weakAreas.slice(0, 6).map((area, index) => (
									<motion.div
										key={`${area}-${index}`}
										className={`p-3 rounded-lg border ${
											isDark
												? "bg-yellow-950/30 border-yellow-900/40"
												: "bg-yellow-50 border-yellow-200"
										}`}
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
									>
										<p
											className={`text-sm ${
												isDark ? "text-yellow-200" : "text-yellow-800"
											}`}
										>
											{area.length > 100 ? `${area.substring(0, 100)}…` : area}
										</p>
									</motion.div>
								))}
							</div>
						) : (
							<p className={isDark ? "text-gray-400" : "text-gray-600"}>
								Great job! No specific areas need improvement yet.
							</p>
						)}
					</motion.div>
				</div>
			</div>
		</motion.div>
	);
};

export default DashboardPage;
