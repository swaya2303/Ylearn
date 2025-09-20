import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
	Brain,
	Upload,
	CheckCircle,
	XCircle,
	RotateCcw,
	ChevronRight,
	ChevronLeft,
	Trophy,
	Target,
} from "lucide-react";
import {
	setError,
	addNotification,
	setCurrentQuestion,
	resetQuizState,
} from "../store/slices/uiSlice";
import {
	generateQuiz,
	setQuizSettings,
	setSelectedAnswer,
	submitQuizResults,
	resetQuiz,
} from "../store/slices/studySlice";

const QuizPage = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const isDark = useSelector((state) => state.ui.isDark);
	const { isLoading } = useSelector((state) => state.ui);
	const {
		ocrResult,
		currentQuiz,
		selectedAnswers,
		currentQuestion,
		quizSettings,
		quizResults,
	} = useSelector((state) => state.study);

	const [showResults, setShowResults] = useState(false);
	const [quizResult, setQuizResult] = useState(null);

	const handleGenerateQuiz = async () => {
		if (!ocrResult || !ocrResult.corrected_text) {
			dispatch(
				setError({
					message:
						"No study material available. Please upload and process a file first.",
					type: "quiz",
				}),
			);
			return;
		}

		try {
			await dispatch(
				generateQuiz({
					context: ocrResult.corrected_text,
					quizType: quizSettings.type,
					numQuestions: quizSettings.numQuestions,
				}),
			).unwrap();

			dispatch(
				addNotification({
					type: "success",
					title: "Quiz Generated!",
					message: `Created ${quizSettings.numQuestions} questions for you.`,
					duration: 3000,
				}),
			);
		} catch (error) {
			dispatch(
				setError({
					message:
						error.message || "Failed to generate quiz. Please try again.",
					type: "quiz",
				}),
			);
		}
	};

	const handleAnswerSelect = (answer) => {
		dispatch(
			setSelectedAnswer({
				questionIndex: currentQuestion,
				answer,
			}),
		);
	};

	const nextQuestion = () => {
		if (currentQuestion < currentQuiz.questions.length - 1) {
			dispatch(setCurrentQuestion(currentQuestion + 1));
		} else {
			handleSubmitQuiz();
		}
	};

	const previousQuestion = () => {
		if (currentQuestion > 0) {
			dispatch(setCurrentQuestion(currentQuestion - 1));
		}
	};

	const handleSubmitQuiz = () => {
		const results = [];
		let correctCount = 0;

		currentQuiz.questions.forEach((question, index) => {
			const userAnswer = selectedAnswers[index];
			const correctAnswer = question.correct_answer;
			const isCorrect = userAnswer === correctAnswer;

			if (isCorrect) correctCount++;

			results.push({
				question: question.question,
				userAnswer,
				correctAnswer,
				isCorrect,
				explanation: question.explanation,
			});
		});

		const result = {
			score: correctCount,
			total: currentQuiz.questions.length,
			percentage: Math.round(
				(correctCount / currentQuiz.questions.length) * 100,
			),
			results,
			completedAt: new Date().toISOString(),
		};

		dispatch(submitQuizResults(result));
		setQuizResult(result);
		setShowResults(true);

		dispatch(
			addNotification({
				type: result.percentage >= 70 ? "success" : "warning",
				title: "Quiz Complete!",
				message: `You scored ${result.percentage}% (${result.score}/${result.total})`,
				duration: 5000,
			}),
		);
	};

	const handleStartNewQuiz = () => {
		dispatch(resetQuiz());
		setShowResults(false);
		setQuizResult(null);
		dispatch(resetQuizState());
	};

	const currentQuestionData = currentQuiz?.questions[currentQuestion];
	const progress = currentQuiz
		? ((currentQuestion + 1) / currentQuiz.questions.length) * 100
		: 0;

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
						Interactive Quiz
					</h1>
					<p
						className={`text-xl ${isDark ? "text-gray-300" : "text-gray-600"}`}
					>
						Test your knowledge with AI-generated questions
					</p>
				</motion.div>

				{/* Quiz Settings */}
				{!currentQuiz && !showResults && (
					<motion.div
						className={`max-w-2xl mx-auto p-8 rounded-3xl shadow-2xl mb-8 ${
							isDark ? "bg-gray-800" : "bg-white"
						}`}
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.6 }}
					>
						<h2
							className={`text-2xl font-bold mb-6 ${
								isDark ? "text-white" : "text-gray-900"
							}`}
						>
							Quiz Settings
						</h2>

						<div className="space-y-6">
							<div>
								<label
									className={`block text-sm font-medium mb-2 ${
										isDark ? "text-gray-300" : "text-gray-700"
									}`}
								>
									Quiz Type
								</label>
								<select
									value={quizSettings.type}
									onChange={(e) =>
										dispatch(setQuizSettings({ type: e.target.value }))
									}
									className={`w-full p-3 rounded-xl border ${
										isDark
											? "bg-gray-700 border-gray-600 text-white"
											: "bg-white border-gray-300 text-gray-900"
									} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
								>
									<option value="mixed">Mixed (MCQ + True/False)</option>
									<option value="mcq">Multiple Choice</option>
									<option value="true_false">True/False</option>
								</select>
							</div>

							<div>
								<label
									className={`block text-sm font-medium mb-2 ${
										isDark ? "text-gray-300" : "text-gray-700"
									}`}
								>
									Number of Questions: {quizSettings.numQuestions}
								</label>
								<input
									type="range"
									min="5"
									max="15"
									value={quizSettings.numQuestions}
									onChange={(e) =>
										dispatch(
											setQuizSettings({
												numQuestions: parseInt(e.target.value),
											}),
										)
									}
									className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
								/>
								<div className="flex justify-between text-sm text-gray-500 mt-1">
									<span>5</span>
									<span>15</span>
								</div>
							</div>

							<motion.button
								onClick={handleGenerateQuiz}
								disabled={isLoading || !ocrResult}
								className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
								whileHover={!isLoading ? { scale: 1.02, y: -2 } : {}}
								whileTap={!isLoading ? { scale: 0.98 } : {}}
							>
								{isLoading ? "Generating Quiz..." : "Generate Quiz"}
							</motion.button>

							{!ocrResult && (
								<div
									className={`text-center p-6 rounded-xl ${
										isDark ? "bg-gray-700" : "bg-gray-100"
									}`}
								>
									<Upload
										size={32}
										className="mx-auto mb-3 opacity-50"
									/>
									<p className={isDark ? "text-gray-400" : "text-gray-600"}>
										No study material available. Upload a file first.
									</p>
									<motion.button
										onClick={() => navigate("/upload")}
										className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
										whileHover={{ scale: 1.05 }}
									>
										Upload Now
									</motion.button>
								</div>
							)}
						</div>
					</motion.div>
				)}

				{/* Quiz Progress */}
				{currentQuiz && !showResults && (
					<motion.div
						className={`max-w-4xl mx-auto mb-6 p-4 rounded-2xl ${
							isDark ? "bg-gray-800" : "bg-white"
						} shadow-lg`}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<div className="flex items-center justify-between mb-4">
							<span
								className={`font-medium ${
									isDark ? "text-white" : "text-gray-900"
								}`}
							>
								Question {currentQuestion + 1} of {currentQuiz.questions.length}
							</span>
							<span
								className={`text-sm ${
									isDark ? "text-gray-400" : "text-gray-600"
								}`}
							>
								{Math.round(progress)}% Complete
							</span>
						</div>
						<div
							className={`w-full bg-gray-200 rounded-full h-3 ${
								isDark ? "bg-gray-700" : ""
							}`}
						>
							<motion.div
								className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
								initial={{ width: 0 }}
								animate={{ width: `${progress}%` }}
								transition={{ duration: 0.5, ease: "easeOut" }}
							/>
						</div>
					</motion.div>
				)}

				{/* Quiz Question */}
				{currentQuiz && !showResults && currentQuestionData && (
					<motion.div
						className={`max-w-4xl mx-auto p-8 rounded-3xl shadow-2xl ${
							isDark ? "bg-gray-800" : "bg-white"
						}`}
						key={currentQuestion}
						initial={{ opacity: 0, x: 50 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -50 }}
						transition={{ duration: 0.4 }}
					>
						<div className="mb-8">
							<h3
								className={`text-2xl font-bold mb-6 ${
									isDark ? "text-white" : "text-gray-900"
								}`}
							>
								{currentQuestionData.question}
							</h3>

							<div className="space-y-3">
								{currentQuestionData.options
									? // Multiple Choice
									  currentQuestionData.options.map((option, index) => (
											<motion.button
												key={index}
												onClick={() => handleAnswerSelect(option.charAt(0))}
												className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
													selectedAnswers[currentQuestion] === option.charAt(0)
														? isDark
															? "border-blue-500 bg-blue-900/20"
															: "border-blue-500 bg-blue-50"
														: isDark
														? "border-gray-600 hover:border-gray-500 bg-gray-700"
														: "border-gray-200 hover:border-gray-300 bg-gray-50"
												}`}
												whileHover={{ scale: 1.02 }}
												whileTap={{ scale: 0.98 }}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: index * 0.1 }}
											>
												<span
													className={`font-medium ${
														isDark ? "text-white" : "text-gray-900"
													}`}
												>
													{option}
												</span>
											</motion.button>
									  ))
									: // True/False
									  ["True", "False"].map((option) => (
											<motion.button
												key={option}
												onClick={() => handleAnswerSelect(option)}
												className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
													selectedAnswers[currentQuestion] === option
														? isDark
															? "border-blue-500 bg-blue-900/20"
															: "border-blue-500 bg-blue-50"
														: isDark
														? "border-gray-600 hover:border-gray-500 bg-gray-700"
														: "border-gray-200 hover:border-gray-300 bg-gray-50"
												}`}
												whileHover={{ scale: 1.02 }}
												whileTap={{ scale: 0.98 }}
											>
												<span
													className={`font-medium ${
														isDark ? "text-white" : "text-gray-900"
													}`}
												>
													{option}
												</span>
											</motion.button>
									  ))}
							</div>
						</div>

						{/* Navigation */}
						<div className="flex justify-between">
							<motion.button
								onClick={previousQuestion}
								disabled={currentQuestion === 0}
								className={`px-6 py-3 rounded-xl font-medium flex items-center space-x-2 ${
									currentQuestion === 0
										? "opacity-50 cursor-not-allowed"
										: isDark
										? "bg-gray-700 text-white hover:bg-gray-600"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								} disabled:opacity-50`}
								whileHover={currentQuestion > 0 ? { scale: 1.05 } : {}}
								whileTap={currentQuestion > 0 ? { scale: 0.95 } : {}}
							>
								<ChevronLeft size={20} />
								<span>Previous</span>
							</motion.button>

							<motion.button
								onClick={nextQuestion}
								disabled={!selectedAnswers[currentQuestion]}
								className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
								whileHover={
									selectedAnswers[currentQuestion] ? { scale: 1.05 } : {}
								}
								whileTap={
									selectedAnswers[currentQuestion] ? { scale: 0.95 } : {}
								}
							>
								<span>
									{currentQuestion === currentQuiz.questions.length - 1
										? "Finish"
										: "Next"}
								</span>
								{currentQuestion === currentQuiz.questions.length - 1 ? (
									<Trophy size={20} />
								) : (
									<ChevronRight size={20} />
								)}
							</motion.button>
						</div>
					</motion.div>
				)}

				{/* Quiz Results */}
				{showResults && quizResult && (
					<motion.div
						className={`max-w-4xl mx-auto p-8 rounded-3xl shadow-2xl ${
							isDark ? "bg-gray-800" : "bg-white"
						}`}
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.6 }}
					>
						<div className="text-center mb-8">
							<motion.div
								className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
									quizResult.percentage >= 70
										? "bg-green-100 text-green-600"
										: "bg-yellow-100 text-yellow-600"
								}`}
								animate={{ scale: [1, 1.2, 1] }}
								transition={{ duration: 0.6 }}
							>
								{quizResult.percentage >= 70 ? (
									<Trophy size={48} />
								) : (
									<Target size={48} />
								)}
							</motion.div>

							<h3
								className={`text-3xl font-bold mb-4 ${
									isDark ? "text-white" : "text-gray-900"
								}`}
							>
								Quiz Complete!
							</h3>

							<div className="grid grid-cols-3 gap-6 mb-8">
								<div className="text-center">
									<div className="text-3xl font-bold text-blue-500 mb-2">
										{quizResult.score}
									</div>
									<div
										className={`text-sm ${
											isDark ? "text-gray-400" : "text-gray-600"
										}`}
									>
										Correct
									</div>
								</div>
								<div className="text-center">
									<div className="text-3xl font-bold text-purple-500 mb-2">
										{quizResult.total}
									</div>
									<div
										className={`text-sm ${
											isDark ? "text-gray-400" : "text-gray-600"
										}`}
									>
										Total
									</div>
								</div>
								<div className="text-center">
									<div className="text-3xl font-bold text-green-500 mb-2">
										{quizResult.percentage}%
									</div>
									<div
										className={`text-sm ${
											isDark ? "text-gray-400" : "text-gray-600"
										}`}
									>
										Score
									</div>
								</div>
							</div>
						</div>

						{/* Detailed Results */}
						<div className="space-y-4 mb-8">
							<h4
								className={`text-xl font-bold ${
									isDark ? "text-white" : "text-gray-900"
								}`}
							>
								Review Your Answers
							</h4>
							{quizResult.results.map((result, index) => (
								<motion.div
									key={index}
									className={`p-6 rounded-xl border-l-4 ${
										result.isCorrect
											? isDark
												? "border-green-500 bg-green-900/20"
												: "border-green-500 bg-green-50"
											: isDark
											? "border-red-500 bg-red-900/20"
											: "border-red-500 bg-red-50"
									}`}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
								>
									<div className="flex items-start space-x-3">
										{result.isCorrect ? (
											<CheckCircle
												size={24}
												className="text-green-500 flex-shrink-0 mt-1"
											/>
										) : (
											<XCircle
												size={24}
												className="text-red-500 flex-shrink-0 mt-1"
											/>
										)}
										<div className="flex-1">
											<p
												className={`font-medium mb-2 ${
													isDark ? "text-white" : "text-gray-900"
												}`}
											>
												{result.question}
											</p>
											<p
												className={`text-sm mb-1 ${
													isDark ? "text-gray-300" : "text-gray-700"
												}`}
											>
												Your answer:{" "}
												<span
													className={
														result.isCorrect ? "text-green-600" : "text-red-600"
													}
												>
													{result.userAnswer}
												</span>
											</p>
											{!result.isCorrect && (
												<p
													className={`text-sm mb-2 ${
														isDark ? "text-gray-300" : "text-gray-700"
													}`}
												>
													Correct answer:{" "}
													<span className="text-green-600">
														{result.correctAnswer}
													</span>
												</p>
											)}
											{result.explanation && (
												<p
													className={`text-sm ${
														isDark ? "text-gray-400" : "text-gray-600"
													}`}
												>
													{result.explanation}
												</p>
											)}
										</div>
									</div>
								</motion.div>
							))}
						</div>

						{/* Action Buttons */}
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<motion.button
								onClick={handleStartNewQuiz}
								className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center space-x-2"
								whileHover={{ scale: 1.05, y: -2 }}
								whileTap={{ scale: 0.95 }}
							>
								<RotateCcw size={20} />
								<span>Take Another Quiz</span>
							</motion.button>

							<motion.button
								onClick={() => navigate("/study")}
								className={`px-8 py-3 border-2 rounded-xl font-semibold flex items-center justify-center space-x-2 ${
									isDark
										? "border-gray-600 text-gray-300 hover:bg-gray-700"
										: "border-gray-300 text-gray-700 hover:bg-gray-50"
								}`}
								whileHover={{ scale: 1.05, y: -2 }}
								whileTap={{ scale: 0.95 }}
							>
								<Brain size={20} />
								<span>Review Study Materials</span>
							</motion.button>
						</div>
					</motion.div>
				)}
			</div>
		</motion.div>
	);
};

export default QuizPage;
