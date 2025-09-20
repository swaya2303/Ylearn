import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, X } from "lucide-react";
import { clearError } from "../store/slices/uiSlice";

const ErrorAlert = () => {
	const dispatch = useDispatch();
	const { error, errorType } = useSelector((state) => state.ui);
	const isDark = useSelector((state) => state.ui.isDark);

	const handleDismiss = () => {
		dispatch(clearError());
	};

	return (
		<AnimatePresence>
			{error && (
				<motion.div
					className="fixed top-20 right-4 z-40 max-w-md"
					initial={{ opacity: 0, x: 100, scale: 0.8 }}
					animate={{ opacity: 1, x: 0, scale: 1 }}
					exit={{ opacity: 0, x: 100, scale: 0.8 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					<div
						className={`p-6 rounded-2xl border-l-4 border-red-500 shadow-2xl ${
							isDark
								? "bg-red-900/20 text-red-200 border border-red-800"
								: "bg-red-50 text-red-800"
						}`}
					>
						<div className="flex items-start space-x-3">
							<AlertCircle
								size={24}
								className="text-red-500 flex-shrink-0 mt-0.5"
							/>
							<div className="flex-1">
								<h3 className="font-semibold mb-1">
									{errorType === "upload" && "Upload Error"}
									{errorType === "processing" && "Processing Error"}
									{errorType === "quiz" && "Quiz Error"}
									{errorType === "chat" && "Chat Error"}
									{!errorType && "Error"}
								</h3>
								<p className="text-sm leading-relaxed">{error}</p>
							</div>
							<button
								onClick={handleDismiss}
								className={`p-1 rounded-full transition-colors ${
									isDark ? "hover:bg-red-800" : "hover:bg-red-200"
								}`}
							>
								<X size={20} />
							</button>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
export default ErrorAlert;