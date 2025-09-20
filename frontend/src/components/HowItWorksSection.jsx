import React from "react";
import { useSelector } from "react-redux";
import { motion } from "motion/react";
import { Upload, FileText, Brain } from "lucide-react";
import { Link } from "react-router-dom";

const HowItWorksSection = () => {
	const { isDark } = useSelector((s) => s.ui);

	const steps = [
		{
			title: "Upload your notes",
			desc: "Add images or PDFs up to 50MB.",
			Icon: Upload,
			gradient: "from-blue-500 to-purple-600",
		},
		{
			title: "We extract the text",
			desc: "OCR cleans and corrects your content.",
			Icon: FileText,
			gradient: "from-green-500 to-emerald-500",
		},
		{
			title: "Generate study materials",
			desc: "Create quizzes and practice instantly.",
			Icon: Brain,
			gradient: "from-rose-500 to-pink-600",
		},
	];

	return (
		<section className="mt-16">
			<div className="mx-auto px-4">
				<div className="text-center mb-8">
					<h2
						className={`text-4xl font-bold ${
							isDark
								? "bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-600"
								: "text-gray-900"
						}`}
					>
						How it works
					</h2>
					<p className={`${isDark ? "text-gray-400" : "text-gray-600"} mt-2`}>
						From handwritten notes to interactive practice in minutes.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
					{steps.map(({ title, desc, Icon, gradient }, i) => (
						<motion.div
							key={title}
							className={`flex justify-start gap-4 rounded-2xl border p-4 ${
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
							<div
								className={`w-12 h-12 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center text-white shadow-md mb-4`}
							>
								<Icon size={22} />
							</div>
							<div>
								<h3
									className={`font-semibold ${
										isDark ? "text-white" : "text-gray-900"
									}`}
								>
									{title}
								</h3>
								<p
									className={`mt-1 text-sm ${
										isDark ? "text-gray-400" : "text-gray-600"
									}`}
								>
									{desc}
								</p>
							</div>
						</motion.div>
					))}
				</div>

				<div className="mt-8 text-center">
					<Link to="/upload">
						<motion.button
							className="px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r text-lg from-blue-500 to-purple-600 shadow"
							whileHover={{ y: -2, scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
						>
							Try it with a sample file
						</motion.button>
					</Link>
				</div>
			</div>
		</section>
	);
};

export default HowItWorksSection;
