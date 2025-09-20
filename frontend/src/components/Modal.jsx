import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { closeModal } from "../slices/uiSlice";

export const Modal = ({ children }) => {
	const dispatch = useDispatch();
	const { showModal, modalType } = useSelector((state) => state.ui);
	const isDark = useSelector((state) => state.ui.isDark);

	const handleBackdropClick = (e) => {
		if (e.target === e.currentTarget) {
			dispatch(closeModal());
		}
	};

	const handleClose = () => {
		dispatch(closeModal());
	};

	return (
		<AnimatePresence>
			{showModal && (
				<motion.div
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3 }}
					onClick={handleBackdropClick}
				>
					<motion.div
						className={`relative w-full max-w-md mx-auto rounded-2xl shadow-2xl ${
							isDark ? "bg-gray-800 border border-gray-700" : "bg-white"
						}`}
						initial={{ opacity: 0, scale: 0.8, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.8, y: 20 }}
						transition={{ duration: 0.4, ease: "easeOut" }}
						onClick={(e) => e.stopPropagation()}
					>
						<button
							onClick={handleClose}
							className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-10 ${
								isDark
									? "hover:bg-gray-700 text-gray-400"
									: "hover:bg-gray-100 text-gray-600"
							}`}
						>
							<X size={20} />
						</button>
						<div className="p-6">{children}</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default Modal;
