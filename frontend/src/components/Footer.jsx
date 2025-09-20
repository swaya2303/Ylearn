// components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "motion/react";
import { Github, Twitter, Linkedin, Mail, Send } from "lucide-react";

const Footer = () => {
	const { isDark } = useSelector((state) => state.ui);
	const year = new Date().getFullYear();

	const product = [
		{ label: "Home", to: "/" },
		{ label: "Upload", to: "/upload" },
		{ label: "Study", to: "/study" },
		{ label: "Quiz", to: "/quiz" },
		{ label: "AI Tutor", to: "/tutor" },
		{ label: "Dashboard", to: "/dashboard" },
	];

	const resources = [
		{ label: "Privacy", to: "/privacy" },
		{ label: "Terms", to: "/terms" },
		{ label: "Status", to: "/status" },
		// Keep it lean; add Docs/Guides later if needed
	];

	const socials = [
		{ label: "GitHub", href: "https://github.com", Icon: Github },
		{ label: "Twitter", href: "https://twitter.com", Icon: Twitter },
		{ label: "LinkedIn", href: "https://linkedin.com", Icon: Linkedin },
		{ label: "Email", href: "mailto:hello@ylearn.app", Icon: Mail },
	];

	return (
		<footer className="relative">
			{/* Accent line for continuity with the navbar */}
			<div className="absolute inset-x-0 -top-px h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 opacity-70" />

			<div
				className={`relative border-t backdrop-blur ${
					isDark
						? "bg-gray-900/95 border-gray-800"
						: "bg-white/95 border-gray-200"
				}`}
			>
				{/* Subtle, non-intrusive decor */}
				<div className="pointer-events-none absolute inset-0 overflow-hidden">
					<div
						className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl ${
							isDark ? "bg-blue-600/10" : "bg-blue-500/10"
						}`}
					/>
					<div
						className={`absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl ${
							isDark ? "bg-purple-600/10" : "bg-purple-500/10"
						}`}
					/>
				</div>

				<div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-10">
						{/* Brand + short blurb + newsletter */}
						<div className="md:col-span-2">
							<Link
								to="/"
								className="inline-flex items-center gap-3"
							>
								<motion.div
									className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
									whileHover={{ rotate: 10, scale: 1.04 }}
									transition={{ type: "spring", stiffness: 400, damping: 14 }}
								>
									<span className="text-white font-bold text-sm">AI</span>
								</motion.div>
								<span
									className={`font-bold text-xl ${
										isDark ? "text-white" : "text-gray-900"
									}`}
								>
									YLearn
								</span>
							</Link>

							<p
								className={`mt-3 text-sm leading-relaxed ${
									isDark ? "text-gray-400" : "text-gray-600"
								}`}
							>
								Turn your notes into interactive study materials with AI —
								extract, organize, and quiz yourself in minutes.
							</p>

							{/* Compact newsletter */}
							<form
								className="mt-5"
								onSubmit={(e) => {
									e.preventDefault();
									// handle subscribe
								}}
							>
								<div
									className={`flex items-center rounded-xl border overflow-hidden ${
										isDark
											? "border-gray-700 bg-gray-800/60"
											: "border-gray-300 bg-white/70"
									}`}
								>
									<input
										type="email"
										placeholder="Get product updates"
										className={`w-full px-4 py-3 outline-none text-sm ${
											isDark
												? "bg-transparent text-gray-200 placeholder-gray-400"
												: "bg-transparent text-gray-800 placeholder-gray-500"
										}`}
										aria-label="Email address"
									/>
									<button
										type="submit"
										className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold"
										aria-label="Subscribe"
									>
										<Send size={16} />
									</button>
								</div>
								<p
									className={`mt-2 text-xs ${
										isDark ? "text-gray-500" : "text-gray-500"
									}`}
								>
									No spam. Unsubscribe anytime.
								</p>
							</form>
						</div>

						{/* Links: Product */}
						<div>
							<h4
								className={`text-xs font-semibold tracking-wider uppercase ${
									isDark ? "text-gray-400" : "text-gray-700"
								}`}
							>
								Product
							</h4>
							<ul className="mt-4 space-y-2">
								{product.map((l) => (
									<li key={l.label}>
										<Link to={l.to}>
											<motion.span
												className={`inline-flex items-center text-sm ${
													isDark
														? "text-gray-300 hover:text-white"
														: "text-gray-600 hover:text-gray-900"
												}`}
												whileHover={{ x: 4 }}
												transition={{
													type: "spring",
													stiffness: 400,
													damping: 26,
												}}
											>
												{l.label}
											</motion.span>
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Links: Resources */}
						<div>
							<h4
								className={`text-xs font-semibold tracking-wider uppercase ${
									isDark ? "text-gray-400" : "text-gray-700"
								}`}
							>
								Resources
							</h4>
							<ul className="mt-4 space-y-2">
								{resources.map((l) => (
									<li key={l.label}>
										<Link to={l.to}>
											<motion.span
												className={`inline-flex items-center text-sm ${
													isDark
														? "text-gray-300 hover:text-white"
														: "text-gray-600 hover:text-gray-900"
												}`}
												whileHover={{ x: 4 }}
												transition={{
													type: "spring",
													stiffness: 400,
													damping: 26,
												}}
											>
												{l.label}
											</motion.span>
										</Link>
									</li>
								))}
							</ul>
						</div>
					</div>

					{/* Divider */}
					<div
						className={`mt-10 border-t ${
							isDark ? "border-gray-800" : "border-gray-200"
						}`}
					/>

					{/* Bottom row */}
					<div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
						<p
							className={`text-sm ${
								isDark ? "text-gray-500" : "text-gray-500"
							}`}
						>
							© {year} YLearn. All rights reserved.
						</p>

						<div className="flex items-center gap-3">
							{socials.map(({ label, href, Icon }) => (
								<motion.a
									key={label}
									href={href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={label}
									className={`p-2 rounded-lg border transition-colors ${
										isDark
											? "border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
											: "border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
									}`}
									whileHover={{ y: -2 }}
									whileTap={{ scale: 0.97 }}
								>
									<Icon size={18} />
								</motion.a>
							))}
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
