// pages/UploadPage.jsx
import React, { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
	Upload,
	CheckCircle,
	BookOpen,
	Brain,
	FileText,
	X,
	AlertCircle,
	Image,
	FileTextIcon,
	Database,
	Star,
	Lightbulb,
	CircleSmall,
	Sparkles,
	Zap,
	ArrowRight,
} from "lucide-react";
import {
	setLoading,
	setError,
	clearError,
	addNotification,
	setUploadProgress,
	resetUploadProgress,
} from "../store/slices/uiSlice";
import { uploadAndProcessFile } from "../store/slices/studySlice";

const UploadPage = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const fileInputRef = useRef(null);

	const isDark = useSelector((state) => state.ui.isDark);
	const { isLoading, uploadProgress } = useSelector((state) => state.ui);
	const { ocrResult, processedResult } = useSelector((state) => state.study);

	const [dragActive, setDragActive] = useState(false);
	const [selectedFile, setSelectedFile] = useState(null);

	const handleFileSelect = (file) => {
		if (!file) return;

		// Validate file type
		const allowedTypes = [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/gif",
			"image/bmp",
			"image/webp",
			"application/pdf",
		];

		if (!allowedTypes.includes(file.type)) {
			dispatch(
				setError({
					message:
						"Invalid file type. Please upload an image (JPG, PNG, GIF, BMP, WebP) or PDF file.",
					type: "upload",
				}),
			);
			return;
		}

		// Validate file size (50MB max)
		const maxSize = 50 * 1024 * 1024;
		if (file.size > maxSize) {
			dispatch(
				setError({
					message: "File size too large. Maximum size is 50MB.",
					type: "upload",
				}),
			);
			return;
		}

		setSelectedFile(file);
		dispatch(clearError());
	};

	const handleUpload = async () => {
		if (!selectedFile) return;

		dispatch(
			setLoading({
				isLoading: true,
				message: "Processing your file...",
			}),
		);

		dispatch(resetUploadProgress());

		try {
			const result = await dispatch(
				uploadAndProcessFile(selectedFile),
			).unwrap();

			dispatch(setLoading({ isLoading: false }));
			dispatch(
				addNotification({
					type: "success",
					title: "Upload Successful!",
					message:
						"Your file has been processed and study materials are ready.",
					duration: 5000,
				}),
			);

			// Clear selected file
			setSelectedFile(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		} catch (error) {
			dispatch(setLoading({ isLoading: false }));
			dispatch(
				setError({
					message: error.message || "Failed to process file. Please try again.",
					type: "upload",
				}),
			);
		}
	};

	const handleDrop = (e) => {
		e.preventDefault();
		setDragActive(false);
		const file = e.dataTransfer.files[0];
		handleFileSelect(file);
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		setDragActive(true);
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
		setDragActive(false);
	};

	const handleFileInput = (e) => {
		const file = e.target.files[0];
		handleFileSelect(file);
	};

	const removeSelectedFile = () => {
		setSelectedFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
		dispatch(clearError());
	};

	const getFileIcon = (fileType) => {
		if (fileType?.startsWith("image/")) {
			return <Image className="w-8 h-8 text-blue-500" />;
		} else if (fileType === "application/pdf") {
			return <FileTextIcon className="w-8 h-8 text-red-500" />;
		}
		return <FileText className="w-8 h-8 text-gray-500" />;
	};

	const formatFileSize = (bytes) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	return (
		<motion.div
			className={`min-h-screen pt-20 relative ${
				isDark ? "bg-gray-950" : "bg-white"
			}`}
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
			{/* Background decoration */}
			{/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div
					className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl ${
						isDark ? "bg-blue-900/20" : "bg-blue-200/30"
					}`}
				/>
				<div
					className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl ${
						isDark ? "bg-purple-900/20" : "bg-purple-200/30"
					}`}
				/>
			</div> */}

			<div className="container mx-auto px-6 py-12 relative z-10">
				<div className="max-w-7xl mx-auto">
					<motion.div
						className="text-center mb-12"
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, ease: "easeOut" }}
					>
						<motion.div
							className="inline-flex items-center justify-center mb-6"
							animate={{ rotate: [0, 5, -5, 0] }}
							transition={{ duration: 4, repeat: Infinity }}
						>
							<Sparkles className="w-12 h-12 text-yellow-500 mr-2" />
						</motion.div>
						<h1 className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
							Upload Your Notes
						</h1>
						<p
							className={`text-xl md:text-2xl ${
								isDark ? "text-gray-300" : "text-gray-700"
							} max-w-2xl mx-auto`}
						>
							Transform handwritten notes into interactive study materials with
							AI
						</p>
					</motion.div>

					{/* Upload Section */}
					<motion.div
						className={`p-8 md:p-10 rounded-3xl shadow-xl backdrop-blur-sm ${
							isDark
								? "bg-gray-800/90 border border-gray-700"
								: "bg-white/90 border border-gray-100"
						}`}
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.6, delay: 0.2 }}
					>
						<div className="text-center">
							<motion.div
								className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
									isDark
										? "bg-gradient-to-br from-blue-600 to-purple-600"
										: "bg-gradient-to-br from-blue-500 to-purple-500"
								} shadow-lg`}
								animate={{
									y: [0, -10, 0],
									boxShadow: [
										"0 10px 30px rgba(59, 130, 246, 0.3)",
										"0 15px 40px rgba(147, 51, 234, 0.4)",
										"0 10px 30px rgba(59, 130, 246, 0.3)",
									],
								}}
								transition={{
									duration: 3,
									repeat: Infinity,
									ease: "easeInOut",
								}}
							>
								<Upload
									size={48}
									className="text-white"
								/>
							</motion.div>

							<h2
								className={`text-3xl font-bold mb-4 ${
									isDark ? "text-white" : "text-gray-900"
								}`}
							>
								Choose Your Files
							</h2>
							<p
								className={`text-lg mb-8 ${
									isDark ? "text-gray-300" : "text-gray-600"
								}`}
							>
								Supports images and PDF files up to 50MB
							</p>

							{/* File Drop Zone */}
							<div className="relative">
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*,.pdf"
									onChange={handleFileInput}
									className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
									disabled={isLoading}
								/>
								<motion.div
									className={`border-3 border-dashed rounded-2xl p-16 transition-all duration-300 ${
										dragActive
											? isDark
												? "border-blue-400 bg-blue-900/30"
												: "border-blue-500 bg-blue-50"
											: isDark
											? "border-gray-600 hover:border-blue-400 bg-gray-700/30"
											: "border-gray-300 hover:border-blue-400 bg-gray-50/50"
									} ${isLoading ? "pointer-events-none opacity-50" : ""}`}
									onDragOver={handleDragOver}
									onDragLeave={handleDragLeave}
									onDrop={handleDrop}
									whileHover={{ scale: 1.02 }}
									animate={dragActive ? { scale: 1.05 } : {}}
								>
									<motion.div
										animate={{ y: [0, -5, 0] }}
										transition={{ duration: 2, repeat: Infinity }}
									>
										<Upload
											size={48}
											className={`mx-auto mb-4 ${
												isDark ? "text-gray-400" : "text-gray-500"
											}`}
										/>
									</motion.div>
									<p
										className={`text-lg font-medium ${
											isDark ? "text-gray-300" : "text-gray-700"
										}`}
									>
										{isLoading
											? "Processing your file..."
											: "Drop files here or click to browse"}
									</p>
									<p
										className={`text-sm mt-2 ${
											isDark ? "text-gray-500" : "text-gray-500"
										}`}
									>
										JPG, PNG, GIF, BMP, WebP, PDF
									</p>
								</motion.div>
							</div>

							{/* Selected File Display */}
							<AnimatePresence>
								{selectedFile && (
									<motion.div
										className={`mt-6 p-6 rounded-2xl ${
											isDark
												? "bg-gray-700/50 border border-gray-600"
												: "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200"
										}`}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
										transition={{ duration: 0.3 }}
									>
										<div className="flex items-center justify-between mb-4">
											<div className="flex items-center space-x-4">
												<div
													className={`p-3 rounded-xl ${
														isDark ? "bg-gray-600" : "bg-white"
													} shadow-md`}
												>
													{getFileIcon(selectedFile.type)}
												</div>
												<div className="text-left">
													<p
														className={`font-semibold text-lg ${
															isDark ? "text-white" : "text-gray-900"
														}`}
													>
														{selectedFile.name}
													</p>
													<p
														className={`text-sm ${
															isDark ? "text-gray-400" : "text-gray-600"
														}`}
													>
														{formatFileSize(selectedFile.size)}
													</p>
												</div>
											</div>
											<button
												onClick={removeSelectedFile}
												disabled={isLoading}
												className={`p-2 rounded-xl transition-all ${
													isDark
														? "hover:bg-gray-600 text-gray-400"
														: "hover:bg-red-100 text-gray-600 hover:text-red-600"
												} disabled:opacity-50`}
											>
												<X size={20} />
											</button>
										</div>

										<motion.button
											onClick={handleUpload}
											disabled={isLoading}
											className={`w-full px-6 py-4 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
												isDark
													? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
													: "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
											}`}
											whileHover={!isLoading ? { scale: 1.02, y: -2 } : {}}
											whileTap={!isLoading ? { scale: 0.98 } : {}}
										>
											<Zap size={20} />
											<span>
												{isLoading ? "Processing..." : "Process File"}
											</span>
										</motion.button>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</motion.div>

					{/* Results Section */}
					<AnimatePresence>
						{ocrResult && processedResult && !isLoading && (
							<motion.div
								className={`mt-8 p-8 md:p-10 rounded-3xl shadow-xl backdrop-blur-sm ${
									isDark
										? "bg-gray-800/90 border border-gray-700"
										: "bg-white/90 border border-gray-100"
								}`}
								initial={{ opacity: 0, y: 30, scale: 0.9 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: -30, scale: 0.9 }}
								transition={{ duration: 0.6, ease: "easeOut" }}
							>
								<motion.div
									className="flex items-center mb-6"
									initial={{ x: -20, opacity: 0 }}
									animate={{ x: 0, opacity: 1 }}
									transition={{ delay: 0.2, duration: 0.4 }}
								>
									<motion.div
										className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-4 shadow-lg"
										animate={{
											scale: [1, 1.2, 1],
											rotate: [0, 10, -10, 0],
										}}
										transition={{ duration: 0.6 }}
									>
										<CheckCircle
											size={24}
											className="text-white"
										/>
									</motion.div>
									<h3
										className={`text-2xl font-bold ${
											isDark ? "text-white" : "text-gray-900"
										}`}
									>
										Processing Complete!
									</h3>
								</motion.div>

								<motion.div
									className={`p-6 rounded-2xl mb-6 max-h-64 overflow-y-auto ${
										isDark
											? "bg-gray-700/50 border border-gray-600"
											: "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
									}`}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.4, duration: 0.4 }}
								>
									<h4
										className={`font-bold text-lg mb-3 flex items-center space-x-2 ${
											isDark ? "text-green-400" : "text-green-700"
										}`}
									>
										<FileText size={20} />
										<span>Extracted Text:</span>
									</h4>
									<motion.div
										className={`whitespace-pre-line leading-relaxed text-sm ${
											isDark ? "text-gray-200" : "text-gray-700"
										}`}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 0.6, duration: 0.6 }}
									>
										{ocrResult.corrected_text?.substring(0, 500)}
										{ocrResult.corrected_text?.length > 500 && "..."}
									</motion.div>
								</motion.div>

								<motion.div
									className="text-center"
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.8, duration: 0.4 }}
								>
									<p
										className={`text-lg mb-6 ${
											isDark ? "text-gray-300" : "text-gray-600"
										}`}
									>
										Your study materials are ready! Let's start learning.
									</p>
									<motion.div
										className="flex flex-col sm:flex-row gap-4 justify-center"
										initial="initial"
										animate="animate"
										variants={{
											initial: {},
											animate: { transition: { staggerChildren: 0.1 } },
										}}
									>
										<motion.button
											onClick={() => navigate("/study")}
											className={`px-8 py-4 rounded-xl font-semibold shadow-lg flex items-center justify-center space-x-3 transition-all ${
												isDark
													? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
													: "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
											}`}
											variants={{
												initial: { opacity: 0, y: 20 },
												animate: { opacity: 1, y: 0 },
											}}
											whileHover={{
												scale: 1.05,
												y: -2,
												boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)",
											}}
											whileTap={{ scale: 0.95 }}
										>
											<Brain size={20} />
											<span>Create Quiz</span>
											<ArrowRight size={16} />
										</motion.button>
									</motion.div>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* File Format Information */}
					<motion.div
						className={`mt-8 p-8 rounded-3xl backdrop-blur-sm ${
							isDark
								? "bg-gray-800/50 border border-gray-700"
								: "bg-white/80 border border-gray-200"
						}`}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.4 }}
					>
						<h3
							className={`text-2xl font-bold mb-6 text-center ${
								isDark ? "text-white" : "text-gray-900"
							}`}
						>
							Supported Formats
						</h3>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							{[
								{
									type: "Images",
									formats: "JPG, PNG, GIF, BMP, WebP",
									icon: <Image className="w-8 h-8" />,
									color: "from-green-400 to-emerald-500",
								},
								{
									type: "Documents",
									formats: "PDF files",
									icon: <FileTextIcon className="w-8 h-8" />,
									color: "from-orange-400 to-red-500",
								},
								{
									type: "Max Size",
									formats: "50MB per file",
									icon: <Database className="w-8 h-8" />,
									color: "from-blue-400 to-cyan-500",
								},
								{
									type: "Quality",
									formats: "High-res preferred",
									icon: <Star className="w-8 h-8" />,
									color: "from-yellow-400 to-orange-500",
								},
							].map((item, index) => (
								<motion.div
									key={index}
									className={`p-6 rounded-2xl text-center ${
										isDark
											? "bg-gray-700/50 hover:bg-gray-700"
											: "bg-white hover:bg-gray-50"
									} border ${
										isDark ? "border-gray-600" : "border-gray-200"
									} transition-all duration-300 group`}
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: 0.1 * index + 0.5, duration: 0.3 }}
									whileHover={{ scale: 1.05, y: -5 }}
								>
									<div
										className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow`}
									>
										{item.icon}
									</div>
									<h4
										className={`font-semibold text-lg mb-2 ${
											isDark ? "text-white" : "text-gray-900"
										}`}
									>
										{item.type}
									</h4>
									<p
										className={`text-sm ${
											isDark ? "text-gray-400" : "text-gray-600"
										}`}
									>
										{item.formats}
									</p>
								</motion.div>
							))}
						</div>
					</motion.div>

					{/* Tips Section */}
					<motion.div
						className={`mt-8 p-8 rounded-3xl backdrop-blur-sm ${
							isDark
								? "bg-gray-800/50 border border-gray-700"
								: "bg-white border border-gray-200 shadow-lg"
						}`}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.6 }}
					>
						<div className="text-center mb-8">
							<motion.div
								className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
									isDark
										? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20"
										: "bg-gradient-to-br from-yellow-400 to-orange-400"
								} shadow-lg`}
								animate={{ rotate: [0, -5, 5, 0] }}
								transition={{ duration: 4, repeat: Infinity }}
							>
								<Lightbulb
									className={`w-8 h-8 ${
										isDark ? "text-yellow-400" : "text-white"
									}`}
								/>
							</motion.div>
							<h3
								className={`text-2xl font-bold ${
									isDark ? "text-white" : "text-gray-900"
								}`}
							>
								Tips for Better Results
							</h3>
							<p
								className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
							>
								Follow these guidelines to get the most accurate text extraction
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{[
								{
									tip: "Use clear, high-resolution images",
									description:
										"Higher quality images produce better OCR results",
									icon: <Image className="w-5 h-5" />,
									color: "blue",
								},
								{
									tip: "Ensure good lighting",
									description:
										"Avoid dark or uneven lighting when capturing notes",
									icon: <Zap className="w-5 h-5" />,
									color: "yellow",
								},
								{
									tip: "Keep text horizontal",
									description: "Straight, aligned text is easier to process",
									icon: <FileText className="w-5 h-5" />,
									color: "green",
								},
								{
									tip: "Use dark ink on light paper",
									description: "High contrast improves text recognition",
									icon: <CircleSmall className="w-5 h-5" />,
									color: "purple",
								},
								{
									tip: "Avoid shadows and reflections",
									description: "Clear, evenly lit surfaces work best",
									icon: <Star className="w-5 h-5" />,
									color: "orange",
								},
								{
									tip: "Remove background clutter",
									description: "Crop to focus on the text content only",
									icon: <Database className="w-5 h-5" />,
									color: "pink",
								},
							].map((item, index) => {
								const colorClasses = {
									blue: {
										light: "from-blue-50 to-blue-100 border-blue-200",
										dark: "from-blue-900/20 to-blue-800/20 border-blue-700/50",
										iconLight: "bg-blue-500 text-white",
										iconDark: "bg-blue-500/20 text-blue-400",
									},
									yellow: {
										light: "from-yellow-50 to-amber-100 border-yellow-200",
										dark: "from-yellow-900/20 to-amber-800/20 border-yellow-700/50",
										iconLight: "bg-yellow-500 text-white",
										iconDark: "bg-yellow-500/20 text-yellow-400",
									},
									green: {
										light: "from-green-50 to-emerald-100 border-green-200",
										dark: "from-green-900/20 to-emerald-800/20 border-green-700/50",
										iconLight: "bg-green-500 text-white",
										iconDark: "bg-green-500/20 text-green-400",
									},
									purple: {
										light: "from-purple-50 to-violet-100 border-purple-200",
										dark: "from-purple-900/20 to-violet-800/20 border-purple-700/50",
										iconLight: "bg-purple-500 text-white",
										iconDark: "bg-purple-500/20 text-purple-400",
									},
									orange: {
										light: "from-orange-50 to-orange-100 border-orange-200",
										dark: "from-orange-900/20 to-orange-800/20 border-orange-700/50",
										iconLight: "bg-orange-500 text-white",
										iconDark: "bg-orange-500/20 text-orange-400",
									},
									pink: {
										light: "from-pink-50 to-rose-100 border-pink-200",
										dark: "from-pink-900/20 to-rose-800/20 border-pink-700/50",
										iconLight: "bg-pink-500 text-white",
										iconDark: "bg-pink-500/20 text-pink-400",
									},
								};

								const colors = colorClasses[item.color];

								return (
									<motion.div
										key={index}
										className={`relative p-5 rounded-2xl border bg-gradient-to-br ${
											isDark
												? `${colors.dark} hover:border-gray-600`
												: `${colors.light} hover:shadow-md`
										} transition-all duration-300 group cursor-default overflow-hidden`}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.1 * index + 0.7, duration: 0.3 }}
										whileHover={{ y: -2 }}
									>
										{/* Background decoration */}
										<div
											className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl ${
												isDark ? "bg-gray-700/20" : "bg-white/40"
											} group-hover:scale-150 transition-transform duration-500`}
										/>

										<div className="relative z-10">
											<div
												className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
													isDark ? colors.iconDark : colors.iconLight
												} shadow-md group-hover:scale-110 transition-transform`}
											>
												{item.icon}
											</div>
											<h4
												className={`font-semibold text-base mb-1 ${
													isDark ? "text-white" : "text-gray-900"
												}`}
											>
												{item.tip}
											</h4>
											<p
												className={`text-sm leading-relaxed ${
													isDark ? "text-gray-400" : "text-gray-600"
												}`}
											>
												{item.description}
											</p>
										</div>
									</motion.div>
								);
							})}
						</div>
					</motion.div>
				</div>
			</div>
		</motion.div>
	);
};

export default UploadPage;
