import React from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";

const LoadingSpinner = () => {
	const { isLoading, loadingMessage, uploadProgress } = useSelector(
		(state) => state.ui,
	);
	const isDark = useSelector((state) => state.ui.isDark);

	return (
		<AnimatePresence>
			{isLoading && (
				<motion.div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3 }}
				>
					<motion.div
						className={`p-8 rounded-3xl text-center shadow-2xl max-w-md w-full mx-4 ${
							isDark ? "bg-gray-800 border border-gray-700" : "bg-white"
						}`}
						initial={{ opacity: 0, scale: 0.8, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.8, y: -20 }}
						transition={{ duration: 0.4, ease: "easeOut" }}
					>
						<div className="flex items-center justify-center mb-6">
							<motion.div
								animate={{ rotate: 360 }}
								transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
							>
								<Loader2
									size={48}
									className="text-blue-500"
								/>
							</motion.div>
						</div>

						{uploadProgress > 0 && (
							<div
								className={`w-full rounded-full h-3 mb-4 overflow-hidden ${
									isDark ? "bg-gray-700" : "bg-gray-200"
								}`}
							>
								<motion.div
									className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
									initial={{ width: 0 }}
									animate={{ width: `${uploadProgress}%` }}
									transition={{ duration: 0.3, ease: "easeOut" }}
								/>
							</div>
						)}

						<motion.p
							className={`text-xl font-medium ${
								isDark ? "text-gray-300" : "text-gray-700"
							}`}
							animate={{ opacity: [0.7, 1, 0.7] }}
							transition={{ duration: 1.5, repeat: Infinity }}
						>
							{loadingMessage || "Processing..."}
							{uploadProgress > 0 && ` ${uploadProgress}%`}
						</motion.p>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
export default LoadingSpinner;