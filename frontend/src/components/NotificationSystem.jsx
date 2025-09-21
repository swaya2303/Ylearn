import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { removeNotification } from "../slices/uiSlice";

const NotificationItem = ({ notification, isDark }) => {
	const dispatch = useDispatch();

	useEffect(() => {
		if (notification.duration > 0) {
			const timer = setTimeout(() => {
				dispatch(removeNotification(notification.id));
			}, notification.duration);

			return () => clearTimeout(timer);
		}
	}, [notification, dispatch]);

	const handleDismiss = () => {
		dispatch(removeNotification(notification.id));
	};

	const getIcon = () => {
		switch (notification.type) {
			case "success":
				return (
					<CheckCircle
						size={20}
						className="text-green-500"
					/>
				);
			case "error":
				return (
					<AlertCircle
						size={20}
						className="text-red-500"
					/>
				);
			case "warning":
				return (
					<AlertTriangle
						size={20}
						className="text-yellow-500"
					/>
				);
			default:
				return (
					<Info
						size={20}
						className="text-blue-500"
					/>
				);
		}
	};

	const getStyles = () => {
		const baseStyles = isDark
			? "border border-gray-700 shadow-2xl"
			: "shadow-2xl";

		switch (notification.type) {
			case "success":
				return `${baseStyles} ${
					isDark
						? "bg-green-900/20 text-green-200"
						: "bg-green-50 text-green-800"
				} border-l-4 border-l-green-500`;
			case "error":
				return `${baseStyles} ${
					isDark ? "bg-red-900/20 text-red-200" : "bg-red-50 text-red-800"
				} border-l-4 border-l-red-500`;
			case "warning":
				return `${baseStyles} ${
					isDark
						? "bg-yellow-900/20 text-yellow-200"
						: "bg-yellow-50 text-yellow-800"
				} border-l-4 border-l-yellow-500`;
			default:
				return `${baseStyles} ${
					isDark ? "bg-blue-900/20 text-blue-200" : "bg-blue-50 text-blue-800"
				} border-l-4 border-l-blue-500`;
		}
	};

	return (
		<motion.div
			className={`p-4 rounded-xl mb-3 ${getStyles()}`}
			initial={{ opacity: 0, x: 100, scale: 0.8 }}
			animate={{ opacity: 1, x: 0, scale: 1 }}
			exit={{ opacity: 0, x: 100, scale: 0.8 }}
			transition={{ duration: 0.3, ease: "easeOut" }}
			whileHover={{ scale: 1.02 }}
		>
			<div className="flex items-start space-x-3">
				<div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
				<div className="flex-1">
					{notification.title && (
						<h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
					)}
					<p className="text-sm">{notification.message}</p>
				</div>
				<button
					onClick={handleDismiss}
					className={`flex-shrink-0 p-1 rounded-full transition-colors ${
						isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"
					}`}
				>
					<X size={16} />
				</button>
			</div>
		</motion.div>
	);
};

export const NotificationSystem = () => {
	const { notifications } = useSelector((state) => state.ui);
	const isDark = useSelector((state) => state.ui.isDark);

	return (
		<div className="fixed top-20 right-4 z-40 max-w-sm w-full">
			<AnimatePresence>
				{notifications.map((notification) => (
					<NotificationItem
						key={notification.id}
						notification={notification}
						isDark={isDark}
					/>
				))}
			</AnimatePresence>
		</div>
	);
};
