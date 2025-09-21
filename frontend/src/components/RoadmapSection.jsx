import React from "react";
import { useSelector } from "react-redux";
import { motion } from "motion/react";
import { Rocket, GitBranch, Code2, Star } from "lucide-react";

const RoadmapSection = () => {
	const { isDark } = useSelector((s) => s.ui);

	const items = [
		{
			Icon: Rocket,
			title: "MVP today",
			desc: "Upload JPG/PNG/PDF → OCR → Quiz generation.",
		},
		{
			Icon: GitBranch,
			title: "Next up",
			desc: "Flashcards, spaced repetition, exports, better OCR.",
		},
		{
			Icon: Code2,
			title: "Built with",
			desc: "React, Redux, Tailwind, motion/react, Lucide.",
		},
		{
			Icon: Star,
			title: "Made at",
			desc: "Hackathon 2025 — feedback welcome!",
		},
	];

	return (
		<section className="mt-16">
			<div className="max-w-7xl mx-auto px-4">
				<div className="text-center mb-8">
					<h2
						className={`text-3xl font-bold ${
							isDark ? "text-white" : "text-gray-900"
						}`}
					>
						What to expect
					</h2>
					<p className={`${isDark ? "text-gray-400" : "text-gray-600"} mt-2`}>
						This is an early build — here’s what works and what’s coming next.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-4 gap-5">
					{items.map(({ Icon, title, desc }, i) => (
						<motion.div
							key={title}
							className={`rounded-2xl border p-5 ${
								isDark
									? "bg-gray-800/70 border-gray-700"
									: "bg-white border-gray-200 shadow-sm"
							}`}
							initial={{ opacity: 0, y: 12 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: i * 0.06, duration: 0.35 }}
							whileHover={{ y: -4 }}
						>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center">
									<Icon size={18} />
								</div>
								<h3
									className={`font-semibold ${
										isDark ? "text-white" : "text-gray-900"
									}`}
								>
									{title}
								</h3>
							</div>
							<p
								className={`mt-3 text-sm ${
									isDark ? "text-gray-400" : "text-gray-600"
								}`}
							>
								{desc}
							</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
};

export default RoadmapSection;
