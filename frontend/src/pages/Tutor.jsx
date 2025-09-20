// pages/TutorPage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, Send, Bot, User, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
	chatWithTutor,
	addChatMessage,
	clearChatHistory,
} from "../store/slices/studySlice";
import { setError, addNotification } from "../store/slices/uiSlice";

const TutorPage = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const messagesEndRef = useRef(null);
	const inputRef = useRef(null);

	const isDark = useSelector((state) => state.ui.isDark);
	const { chatHistory, ocrResult } = useSelector((state) => state.study);
	const [currentMessage, setCurrentMessage] = useState("");
	const [isTyping, setIsTyping] = useState(false);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(scrollToBottom, [chatHistory]);

	const handleSendMessage = async () => {
		if (!currentMessage.trim()) return;

		if (!ocrResult || !ocrResult.corrected_text) {
			dispatch(
				setError({
					message:
						"No study material available. Please upload and process a file first.",
					type: "chat",
				}),
			);
			return;
		}

		const userMessage = currentMessage;
		setCurrentMessage("");
		setIsTyping(true);

		// Add user message to chat
		dispatch(
			addChatMessage({
				type: "user",
				message: userMessage,
			}),
		);

		try {
			const result = await dispatch(
				chatWithTutor({
					question: userMessage,
					context: ocrResult.corrected_text,
				}),
			).unwrap();

			setIsTyping(false);
		} catch (error) {
			setIsTyping(false);
			dispatch(
				setError({
					message:
						error.message || "Failed to get tutor response. Please try again.",
					type: "chat",
				}),
			);
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const suggestedQuestions = [
		"Can you explain the main concepts from my notes?",
		"What are the key points I should remember?",
		"Can you create practice questions from this material?",
		"How can I better understand this topic?",
		"What are some real-world applications of these concepts?",
	];

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
			<div className="container mx-auto px-6 py-12 max-w-7xl relative z-10">
				<motion.div
					className="text-center mb-8"
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					<h1 className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
						AI Tutor
					</h1>
					<p
						className={`text-xl ${isDark ? "text-gray-300" : "text-gray-600"}`}
					>
						Ask questions about your study material
					</p>
				</motion.div>

				{/* Chat Container */}
				<motion.div
					className={`rounded-3xl shadow-2xl overflow-hidden ${
						isDark ? "bg-gray-800 border border-gray-700" : "bg-white"
					}`}
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.6 }}
				>
					{/* Chat Messages */}
					<div className="h-96 overflow-y-auto p-6 space-y-4">
						{!ocrResult ? (
							<div className="text-center py-12">
								<Upload
									size={48}
									className="mx-auto mb-4 opacity-50"
								/>
								<p className={isDark ? "text-gray-400" : "text-gray-600"}>
									No study material available. Upload a file to start chatting
									with your AI tutor.
								</p>
								<motion.button
									onClick={() => navigate("/upload")}
									className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg"
									whileHover={{ scale: 1.05 }}
								>
									Upload Now
								</motion.button>
							</div>
						) : chatHistory.length === 0 ? (
							<div className="text-center py-8">
								<Bot
									size={48}
									className="mx-auto mb-4 text-blue-500"
								/>
								<p
									className={`text-lg font-medium mb-4 ${
										isDark ? "text-white" : "text-gray-900"
									}`}
								>
									Hi! I'm your AI tutor. Ask me anything about your study
									material.
								</p>
								<div className="grid grid-cols-1 gap-2">
									{suggestedQuestions.slice(0, 3).map((question, index) => (
										<motion.button
											key={index}
											onClick={() => setCurrentMessage(question)}
											className={`p-3 rounded-lg text-sm transition-colors ${
												isDark
													? "bg-gray-700 text-gray-300 hover:bg-gray-600"
													: "bg-gray-100 text-gray-700 hover:bg-gray-200"
											}`}
											whileHover={{ scale: 1.02 }}
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.1 }}
										>
											{question}
										</motion.button>
									))}
								</div>
							</div>
						) : (
							<AnimatePresence>
								{chatHistory.map((message, index) => (
									<motion.div
										key={index}
										className={`flex ${
											message.type === "user" ? "justify-end" : "justify-start"
										}`}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3 }}
									>
										<div
											className={`flex max-w-[80%] ${
												message.type === "user" ? "flex-row-reverse" : ""
											}`}
										>
											<div
												className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
													message.type === "user"
														? "bg-blue-500 ml-3"
														: "bg-purple-500 mr-3"
												}`}
											>
												{message.type === "user" ? (
													<User
														size={16}
														className="text-white"
													/>
												) : (
													<Bot
														size={16}
														className="text-white"
													/>
												)}
											</div>
											<div
												className={`p-4 rounded-2xl ${
													message.type === "user"
														? "bg-blue-500 text-white rounded-br-none"
														: isDark
														? "bg-gray-700 text-gray-100 rounded-bl-none"
														: "bg-gray-100 text-gray-900 rounded-bl-none"
												}`}
											>
												<p className="whitespace-pre-wrap">
													{message.question || message.answer}
												</p>
											</div>
										</div>
									</motion.div>
								))}
							</AnimatePresence>
						)}

						{isTyping && (
							<motion.div
								className="flex justify-start"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
							>
								<div className="flex">
									<div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 mr-3 flex items-center justify-center">
										<Bot
											size={16}
											className="text-white"
										/>
									</div>
									<div
										className={`p-4 rounded-2xl rounded-bl-none ${
											isDark ? "bg-gray-700" : "bg-gray-100"
										}`}
									>
										<div className="flex space-x-1">
											<div
												className={`w-2 h-2 rounded-full ${
													isDark ? "bg-gray-400" : "bg-gray-600"
												} animate-bounce`}
											/>
											<div
												className={`w-2 h-2 rounded-full ${
													isDark ? "bg-gray-400" : "bg-gray-600"
												} animate-bounce`}
												style={{ animationDelay: "0.1s" }}
											/>
											<div
												className={`w-2 h-2 rounded-full ${
													isDark ? "bg-gray-400" : "bg-gray-600"
												} animate-bounce`}
												style={{ animationDelay: "0.2s" }}
											/>
										</div>
									</div>
								</div>
							</motion.div>
						)}
						<div ref={messagesEndRef} />
					</div>

					{/* Message Input */}
					<div
						className={`p-4 border-t ${
							isDark ? "border-gray-700" : "border-gray-200"
						}`}
					>
						<div className="flex space-x-3">
							<textarea
								ref={inputRef}
								value={currentMessage}
								onChange={(e) => setCurrentMessage(e.target.value)}
								onKeyPress={handleKeyPress}
								placeholder="Ask me anything about your study material..."
								className={`flex-1 p-3 rounded-xl border resize-none ${
									isDark
										? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
										: "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
								} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
								rows={1}
								disabled={!ocrResult}
							/>
							<motion.button
								onClick={handleSendMessage}
								disabled={!currentMessage.trim() || !ocrResult}
								className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
								whileHover={
									currentMessage.trim() && ocrResult ? { scale: 1.05 } : {}
								}
								whileTap={
									currentMessage.trim() && ocrResult ? { scale: 0.95 } : {}
								}
							>
								<Send size={20} />
							</motion.button>
						</div>
					</div>
				</motion.div>
			</div>
		</motion.div>
	);
};
export default TutorPage;
