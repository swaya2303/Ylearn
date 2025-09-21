// pages/StudyPage.jsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
	Brain,
	BookOpen,
	Eye,
	Upload,
	RotateCcw,
	CheckCircle,
} from "lucide-react";

// Animation variants
const fadeInUp = {
	initial: { opacity: 0, y: 60 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -60 },
};

const fadeInLeft = {
	initial: { opacity: 0, x: -60 },
	animate: { opacity: 1, x: 0 },
	exit: { opacity: 0, x: 60 },
};

const staggerContainer = {
	initial: {},
	animate: {
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const StudyPage = () => {
	const navigate = useNavigate();
	const isDark = useSelector((state) => state.ui.isDark);
	const { processedResult, flashcards, mindmap, bullets, formattedText } =
		useSelector((state) => state.study);

	const [activeTab, setActiveTab] = useState("flashcards");
	const [flippedCards, setFlippedCards] = useState({});

	const toggleCard = (index) => {
		setFlippedCards((prev) => ({
			...prev,
			[index]: !prev[index],
		}));
	};

	// Use data from Redux store
	const studyFlashcards = flashcards || [];
	const studyMindmap = mindmap || {
		central_topic: "Study Material",
		branches: [],
	};
	const studyBullets = bullets || [];

	const hasStudyData =
		processedResult || studyFlashcards.length > 0 || studyBullets.length > 0;

	return (
		<motion.div
			className={`min-h-screen pt-20 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.6 }}
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
			<div className="container max-w-7xl mx-auto px-6 py-12 relative z-10">
				<motion.div
					className="text-center mb-12"
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					<h1 className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
						Study Materials
					</h1>
					<p
						className={`text-xl ${isDark ? "text-gray-300" : "text-gray-600"}`}
					>
						AI-generated study aids from your notes
					</p>
				</motion.div>

				{/* Show message if no study data */}
				{!hasStudyData && (
					<motion.div
						className={`text-center p-12 rounded-3xl ${
							isDark
								? "bg-gray-800 text-gray-300 border border-gray-700"
								: "bg-white text-gray-600 shadow-lg"
						}`}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<motion.div
							className="mb-6"
							animate={{
								y: [0, -10, 0],
								rotate: [0, 5, -5, 0],
							}}
							transition={{
								duration: 3,
								repeat: Infinity,
								ease: "easeInOut",
							}}
						>
							<Upload
								size={64}
								className="mx-auto opacity-50"
							/>
						</motion.div>
						<h3 className="text-2xl font-semibold mb-4">
							No Study Materials Yet
						</h3>
						<p className="text-lg mb-6">
							Upload and process a file first to generate study materials.
						</p>
						<motion.button
							onClick={() => navigate("/upload")}
							className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold shadow-lg"
							whileHover={{ scale: 1.05, y: -2 }}
							whileTap={{ scale: 0.95 }}
						>
							Upload Now
						</motion.button>
					</motion.div>
				)}

				{/* Tab Navigation */}
				{hasStudyData && (
					<>
						<motion.div
							className="flex justify-center mb-12"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.2 }}
						>
							<div
								className={`flex p-2 rounded-2xl shadow-lg ${
									isDark ? "bg-gray-800" : "bg-white"
								}`}
							>
								{["flashcards", "mindmap", "summary"].map((tab, index) => (
									<motion.button
										key={tab}
										onClick={() => setActiveTab(tab)}
										className={`px-6 py-3 rounded-xl font-semibold capitalize transition-colors duration-300 flex items-center space-x-2 ${
											activeTab === tab
												? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
												: isDark
												? "text-gray-400 hover:text-white hover:bg-gray-700"
												: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
										}`}
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.1 }}
									>
										{tab === "flashcards" && <Brain size={18} />}
										{tab === "mindmap" && <Eye size={18} />}
										{tab === "summary" && <BookOpen size={18} />}
										<span>{tab === "mindmap" ? "Mind Map" : tab}</span>
									</motion.button>
								))}
							</div>
						</motion.div>

						{/* Tab Content */}
						<AnimatePresence mode="wait">
							{/* Flashcards Tab */}
							{activeTab === "flashcards" && (
								<motion.div
									key="flashcards"
									className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									transition={{ duration: 0.4 }}
								>
									{studyFlashcards.length > 0 ? (
										studyFlashcards.map((card, index) => (
											<motion.div
												key={index}
												className="relative h-64 cursor-pointer"
												style={{ perspective: "1000px" }}
												onClick={() => toggleCard(index)}
												initial={{ opacity: 0, scale: 0.8 }}
												animate={{ opacity: 1, scale: 1 }}
												transition={{ delay: index * 0.1, duration: 0.4 }}
												whileHover={{ scale: 1.05, y: -5 }}
											>
												<motion.div
													className="relative w-full h-full"
													style={{ transformStyle: "preserve-3d" }}
													animate={{ rotateY: flippedCards[index] ? 180 : 0 }}
													transition={{ duration: 0.6, ease: "easeInOut" }}
												>
													{/* Front of card */}
													<div
														className={`absolute inset-0 w-full h-full rounded-2xl p-6 shadow-2xl border-l-4 border-blue-500 ${
															isDark
																? "bg-gradient-to-br from-blue-800 to-purple-800"
																: "bg-gradient-to-br from-blue-100 to-purple-100"
														}`}
														style={{ backfaceVisibility: "hidden" }}
													>
														<div className="h-full flex flex-col justify-center">
															<h3
																className={`font-bold text-lg mb-4 flex items-center space-x-2 ${
																	isDark ? "text-blue-200" : "text-blue-800"
																}`}
															>
																<Brain size={20} />
																<span>Question {index + 1}</span>
															</h3>
															<p
																className={`text-lg leading-relaxed flex-1 flex items-center ${
																	isDark ? "text-white" : "text-gray-800"
																}`}
															>
																{card.question}
															</p>
															<div className="mt-4 text-center">
																<span
																	className={`text-sm flex items-center justify-center space-x-1 ${
																		isDark ? "text-blue-300" : "text-blue-600"
																	}`}
																>
																	<RotateCcw size={16} />
																	<span>Click to reveal answer</span>
																</span>
															</div>
														</div>
													</div>

													{/* Back of card */}
													<div
														className={`absolute inset-0 w-full h-full rounded-2xl p-6 shadow-2xl border-l-4 border-green-500 ${
															isDark
																? "bg-gradient-to-br from-green-800 to-emerald-800"
																: "bg-gradient-to-br from-green-100 to-emerald-100"
														}`}
														style={{
															backfaceVisibility: "hidden",
															transform: "rotateY(180deg)",
														}}
													>
														<div className="h-full flex flex-col justify-center">
															<h3
																className={`font-bold text-lg mb-4 flex items-center space-x-2 ${
																	isDark ? "text-green-200" : "text-green-800"
																}`}
															>
																<CheckCircle size={20} />
																<span>Answer</span>
															</h3>
															<p
																className={`text-lg leading-relaxed flex-1 flex items-center ${
																	isDark ? "text-white" : "text-gray-800"
																}`}
															>
																{card.answer}
															</p>
															<div className="mt-4 text-center">
																<span
																	className={`text-sm flex items-center justify-center space-x-1 ${
																		isDark ? "text-green-300" : "text-green-600"
																	}`}
																>
																	<RotateCcw size={16} />
																	<span>Click to flip back</span>
																</span>
															</div>
														</div>
													</div>
												</motion.div>
											</motion.div>
										))
									) : (
										<div className="col-span-full text-center p-12">
											<Brain
												size={48}
												className="mx-auto mb-4 opacity-50"
											/>
											<p className={isDark ? "text-gray-400" : "text-gray-600"}>
												No flashcards generated yet. Try uploading study
												material first.
											</p>
										</div>
									)}
								</motion.div>
							)}

							{/* Mind Map Tab */}
							{activeTab === "mindmap" && (
								<motion.div
									key="mindmap"
									className={`p-8 rounded-3xl shadow-2xl ${
										isDark ? "bg-gray-800" : "bg-white"
									}`}
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.9 }}
									transition={{ duration: 0.4 }}
								>
									<h2
										className={`text-3xl font-bold mb-8 text-center flex items-center justify-center space-x-3 ${
											isDark ? "text-white" : "text-gray-900"
										}`}
									>
										<Eye size={32} />
										<span>Mind Map Visualization</span>
									</h2>
									<div className="text-center">
										<motion.div
											className={`p-8 rounded-2xl mb-8 inline-block text-white shadow-2xl ${
												isDark
													? "bg-gradient-to-r from-purple-600 to-blue-600"
													: "bg-gradient-to-r from-purple-500 to-blue-500"
											}`}
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{ delay: 0.2, duration: 0.6 }}
											whileHover={{ scale: 1.05, rotateY: 5 }}
										>
											<h3 className="text-2xl font-bold">
												{studyMindmap.central_topic}
											</h3>
										</motion.div>

										<motion.div
											className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8"
											variants={staggerContainer}
											initial="initial"
											animate="animate"
										>
											{studyMindmap.branches &&
											studyMindmap.branches.length > 0 ? (
												studyMindmap.branches.map((branch, index) => (
													<motion.div
														key={index}
														className={`p-6 rounded-2xl shadow-lg ${
															isDark ? "bg-gray-700" : "bg-gray-50"
														}`}
														variants={fadeInUp}
														transition={{ delay: index * 0.1 }}
														whileHover={{
															scale: 1.05,
															y: -5,
															rotateX: 5,
															boxShadow: isDark
																? "0 15px 35px rgba(59, 130, 246, 0.1)"
																: "0 15px 35px rgba(0, 0, 0, 0.1)",
														}}
													>
														<h4
															className={`font-bold text-lg mb-4 ${
																isDark ? "text-blue-400" : "text-blue-600"
															}`}
														>
															{branch.name}
														</h4>
														<div className="space-y-2">
															{branch.sub_branches &&
																branch.sub_branches
																	.slice(0, 4)
																	.map((item, i) => (
																		<motion.div
																			key={i}
																			className={`p-2 rounded-lg text-sm transition-colors duration-200 ${
																				isDark
																					? "bg-gray-600 text-gray-200 hover:bg-gray-500"
																					: "bg-white text-gray-700 shadow-sm hover:bg-blue-50"
																			}`}
																			initial={{ opacity: 0, x: -10 }}
																			animate={{ opacity: 1, x: 0 }}
																			transition={{
																				delay: index * 0.1 + i * 0.05,
																			}}
																			whileHover={{ scale: 1.05, x: 5 }}
																		>
																			{item}
																		</motion.div>
																	))}
														</div>
													</motion.div>
												))
											) : (
												<div className="col-span-full text-center p-12">
													<Eye
														size={48}
														className="mx-auto mb-4 opacity-50"
													/>
													<p
														className={
															isDark ? "text-gray-400" : "text-gray-600"
														}
													>
														No mind map data available. Upload study material to
														generate one.
													</p>
												</div>
											)}
										</motion.div>
									</div>
								</motion.div>
							)}

							{/* Summary Tab */}
							{activeTab === "summary" && (
								<motion.div
									key="summary"
									className={`p-8 rounded-3xl shadow-2xl ${
										isDark ? "bg-gray-800" : "bg-white"
									}`}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									transition={{ duration: 0.4 }}
								>
									<h2
										className={`text-3xl font-bold mb-8 flex items-center space-x-3 ${
											isDark ? "text-white" : "text-gray-900"
										}`}
									>
										<BookOpen size={32} />
										<span>Study Summary</span>
									</h2>
									<motion.div
										className="space-y-6"
										variants={staggerContainer}
										initial="initial"
										animate="animate"
									>
										{studyBullets.length > 0 ? (
											studyBullets.map((point, index) => (
												<motion.div
													key={index}
													className={`p-6 rounded-2xl border-l-4 border-blue-500 ${
														isDark ? "bg-gray-700" : "bg-blue-50"
													}`}
													variants={fadeInLeft}
													transition={{ delay: index * 0.1 }}
													whileHover={{
														x: 10,
														scale: 1.02,
														boxShadow: isDark
															? "0 10px 30px rgba(59, 130, 246, 0.1)"
															: "0 10px 30px rgba(59, 130, 246, 0.2)",
													}}
												>
													<p
														className={`text-lg leading-relaxed ${
															isDark ? "text-gray-200" : "text-gray-800"
														}`}
													>
														{point.replace("• ", "")}
													</p>
												</motion.div>
											))
										) : (
											<div className="text-center p-12">
												<BookOpen
													size={48}
													className="mx-auto mb-4 opacity-50"
												/>
												<p
													className={isDark ? "text-gray-400" : "text-gray-600"}
												>
													No summary points available. Upload study material to
													generate them.
												</p>
											</div>
										)}
									</motion.div>
								</motion.div>
							)}
						</AnimatePresence>
					</>
				)}
			</div>
		</motion.div>
	);
};

export default StudyPage;
