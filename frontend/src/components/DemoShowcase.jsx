import React from "react";
import { useSelector } from "react-redux";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Play, Github } from "lucide-react";

const DemoShowcase = () => {
	const { isDark } = useSelector((s) => s.ui);

	return (
		<section className="mt-16">
			<div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
				<motion.div
					className={`rounded-2xl border overflow-hidden ${
						isDark
							? "bg-gray-800/70 border-gray-700"
							: "bg-white border-gray-200 shadow-sm"
					}`}
					initial={{ opacity: 0, y: 12 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.4 }}
				>
					{/* Replace with your video or GIF */}
					<div
						className={`aspect-video ${
							isDark ? "bg-gray-900" : "bg-gray-100"
						} flex items-center justify-center`}
					>
						<span className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>
							Demo video or GIF
						</span>
					</div>
					<div className="p-5 flex items-center justify-between">
						<div>
							<h3
								className={`font-semibold ${
									isDark ? "text-white" : "text-gray-900"
								}`}
							>
								See it in action
							</h3>
							<p
								className={`text-sm mt-1 ${
									isDark ? "text-gray-400" : "text-gray-600"
								}`}
							>
								Watch how notes turn into quizzes in under a minute.
							</p>
						</div>
						<div className="flex gap-2">
							<Link to="/upload">
								<motion.button
									className="px-3 py-2 rounded-lg text-white bg-gradient-to-r from-blue-500 to-purple-600 text-sm"
									whileHover={{ y: -2 }}
								>
									<Play
										size={16}
										className="inline mr-1"
									/>
									Live demo
								</motion.button>
							</Link>
							<a
								href="https://github.com/your-repo"
								target="_blank"
								rel="noreferrer"
							>
								<motion.button
									className={`px-3 py-2 rounded-lg text-sm border ${
										isDark
											? "border-gray-600 text-gray-200 hover:bg-gray-700"
											: "border-gray-300 text-gray-700 hover:bg-gray-100"
									}`}
									whileHover={{ y: -2 }}
								>
									<Github
										size={16}
										className="inline mr-1"
									/>
									GitHub
								</motion.button>
							</a>
						</div>
					</div>
				</motion.div>

				<motion.div
					className={`rounded-2xl border p-5 ${
						isDark
							? "bg-gray-800/70 border-gray-700"
							: "bg-white border-gray-200 shadow-sm"
					}`}
					initial={{ opacity: 0, y: 12 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.4, delay: 0.1 }}
				>
					<h3
						className={`font-semibold ${
							isDark ? "text-white" : "text-gray-900"
						}`}
					>
						Example output
					</h3>
					<div className={`mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm`}>
						<div
							className={`${
								isDark ? "bg-gray-900/60" : "bg-gray-50"
							} rounded-lg p-4 border ${
								isDark ? "border-gray-700" : "border-gray-200"
							}`}
						>
							<p
								className={`${
									isDark ? "text-gray-400" : "text-gray-600"
								} text-xs mb-2`}
							>
								Extracted text (snippet)
							</p>
							<pre
								className={`${
									isDark ? "text-gray-200" : "text-gray-800"
								} whitespace-pre-wrap leading-relaxed`}
							>
								Photosynthesis converts light energy into chemical energy.
								Chlorophyll absorbs light, mainly in blue and red wavelengths.
							</pre>
						</div>
						<div
							className={`${
								isDark ? "bg-gray-900/60" : "bg-gray-50"
							} rounded-lg p-4 border ${
								isDark ? "border-gray-700" : "border-gray-200"
							}`}
						>
							<p
								className={`${
									isDark ? "text-gray-400" : "text-gray-600"
								} text-xs mb-2`}
							>
								Generated quiz (sample)
							</p>
							<ol
								className={`${
									isDark ? "text-gray-200" : "text-gray-800"
								} list-decimal pl-4 space-y-2`}
							>
								<li>
									Which pigment primarily absorbs light during photosynthesis?
								</li>
								<li>Name two wavelengths most absorbed by chlorophyll.</li>
							</ol>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
};

export default DemoShowcase;
