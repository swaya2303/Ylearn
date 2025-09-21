import { useState, useEffect } from "react";
const FadeIn = ({ children, delay = 0, duration = 0.6 }) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setIsVisible(true), delay * 1000);
		return () => clearTimeout(timer);
	}, [delay]);

	return (
		<div
			className={`transition-all ease-out transform ${
				isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
			}`}
			style={{ transitionDuration: `${duration}s` }}
		>
			{children}
		</div>
	);
};
