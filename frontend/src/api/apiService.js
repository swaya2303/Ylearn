const API_BASE_URL =
	import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5000/api";

// Error handling utility
class APIError extends Error {
	constructor(message, status) {
		super(message);
		this.name = "APIError";
		this.status = status;
	}
}

// Generic API request handler
const apiRequest = async (url, options = {}) => {
	const config = {
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
		...options,
	};

	try {
		const response = await fetch(`${API_BASE_URL}${url}`, config);

		if (!response.ok) {
			let errorMessage = `HTTP error! status: ${response.status}`;
			try {
				const errorData = await response.json();
				errorMessage = errorData.error || errorMessage;
			} catch (e) {
				// If parsing error response fails, use generic message
			}
			throw new APIError(errorMessage, response.status);
		}

		// Handle different content types
		const contentType = response.headers.get("content-type");
		if (contentType && contentType.includes("application/json")) {
			return await response.json();
		}

		return await response.text();
	} catch (error) {
		if (error instanceof APIError) {
			throw error;
		}

		// Network or other errors
		if (error.name === "TypeError" && error.message === "Failed to fetch") {
			throw new APIError("Network error: Unable to connect to server", 0);
		}

		throw new APIError(error.message || "An unexpected error occurred", 0);
	}
};

// Progress tracking for file uploads
const uploadWithProgress = async (url, formData, onProgress) => {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();

		xhr.upload.addEventListener("progress", (event) => {
			if (event.lengthComputable && onProgress) {
				const progress = Math.round((event.loaded / event.total) * 100);
				onProgress(progress);
			}
		});

		xhr.addEventListener("load", () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				try {
					const response = JSON.parse(xhr.responseText);
					resolve(response);
				} catch (error) {
					reject(new APIError("Invalid JSON response", xhr.status));
				}
			} else {
				try {
					const errorData = JSON.parse(xhr.responseText);
					reject(
						new APIError(
							errorData.error || `HTTP error! status: ${xhr.status}`,
							xhr.status,
						),
					);
				} catch (error) {
					reject(new APIError(`HTTP error! status: ${xhr.status}`, xhr.status));
				}
			}
		});

		xhr.addEventListener("error", () => {
			reject(new APIError("Network error: Upload failed", 0));
		});

		xhr.addEventListener("timeout", () => {
			reject(new APIError("Upload timeout: Request took too long", 0));
		});

		xhr.open("POST", `${API_BASE_URL}${url}`);
		xhr.timeout = 300000; // 5 minutes timeout for large files
		xhr.send(formData);
	});
};

// File validation utility
const validateFile = (file) => {
	const maxSize = 50 * 1024 * 1024; // 50MB
	const allowedTypes = [
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/bmp",
		"image/webp",
		"application/pdf",
	];

	if (!file) {
		throw new APIError("No file provided", 400);
	}

	if (file.size > maxSize) {
		throw new APIError(
			`File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
			400,
		);
	}

	if (!allowedTypes.includes(file.type)) {
		throw new APIError(
			`File type not supported. Allowed types: ${allowedTypes.join(", ")}`,
			400,
		);
	}

	return true;
};

// API Service Functions

/**
 * Upload and process image/PDF file with OCR
 * @param {File} file - File to upload
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} OCR result with corrected text
 */
export const uploadAndProcessImage = async (file, onProgress) => {
	validateFile(file);

	const formData = new FormData();
	formData.append("file", file);

	try {
		if (onProgress) {
			return await uploadWithProgress("/ocr", formData, onProgress);
		} else {
			const response = await fetch(`${API_BASE_URL}/ocr`, {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new APIError(
					errorData.error || `HTTP error! status: ${response.status}`,
					response.status,
				);
			}

			return await response.json();
		}
	} catch (error) {
		if (error instanceof APIError) {
			throw error;
		}
		throw new APIError("Failed to process file. Please try again.", 0);
	}
};

/**
 * Process corrected text to generate study materials
 * @param {string} text - The corrected text from OCR
 * @param {string} title - Title for the study material
 * @returns {Promise<Object>} Processed study materials
 */
export const processText = async (text, title = "Study Notes") => {
	if (!text || typeof text !== "string" || !text.trim()) {
		throw new APIError("No text provided for processing", 400);
	}

	try {
		return await apiRequest("/process-corrected-text", {
			method: "POST",
			body: JSON.stringify({ text, title }),
		});
	} catch (error) {
		throw new APIError("Failed to process text. Please try again.", 0);
	}
};

/**
 * Generate quiz from study context
 * @param {string} context - Study material context
 * @param {string} quizType - Type of quiz ('mcq', 'true_false', 'mixed')
 * @param {number} numQuestions - Number of questions to generate
 * @returns {Promise<Object>} Generated quiz data
 */
export const generateQuiz = async (
	context,
	quizType = "mixed",
	numQuestions = 5,
) => {
	if (!context || typeof context !== "string" || !context.trim()) {
		throw new APIError("No study material available for quiz generation", 400);
	}

	if (numQuestions < 1 || numQuestions > 20) {
		throw new APIError("Number of questions must be between 1 and 20", 400);
	}

	const validQuizTypes = ["mcq", "true_false", "mixed"];
	if (!validQuizTypes.includes(quizType)) {
		throw new APIError(
			`Invalid quiz type. Must be one of: ${validQuizTypes.join(", ")}`,
			400,
		);
	}

	try {
		return await apiRequest("/generate-quiz", {
			method: "POST",
			body: JSON.stringify({
				context,
				quiz_type: quizType,
				num_questions: numQuestions,
			}),
		});
	} catch (error) {
		throw new APIError("Failed to generate quiz. Please try again.", 0);
	}
};

/**
 * Check quiz answer
 * @param {string} userAnswer - User's answer
 * @param {string} correctAnswer - Correct answer
 * @param {string} questionType - Type of question ('mcq', 'true_false')
 * @returns {Promise<Object>} Answer check result
 */
export const checkAnswer = async (
	userAnswer,
	correctAnswer,
	questionType = "mcq",
) => {
	if (!userAnswer || !correctAnswer) {
		throw new APIError("Both user answer and correct answer are required", 400);
	}

	try {
		return await apiRequest("/check-answer", {
			method: "POST",
			body: JSON.stringify({
				user_answer: userAnswer,
				correct_answer: correctAnswer,
				question_type: questionType,
			}),
		});
	} catch (error) {
		throw new APIError("Failed to check answer. Please try again.", 0);
	}
};

/**
 * Chat with AI tutor
 * @param {string} question - User's question
 * @param {string} context - Study material context
 * @returns {Promise<Object>} Tutor response
 */
export const chatWithTutor = async (question, context) => {
	if (!question || typeof question !== "string" || !question.trim()) {
		throw new APIError("Question is required for chat", 400);
	}

	if (!context || typeof context !== "string" || !context.trim()) {
		throw new APIError("No study material available for tutoring", 400);
	}

	try {
		return await apiRequest("/chat", {
			method: "POST",
			body: JSON.stringify({ question, context }),
		});
	} catch (error) {
		throw new APIError("Failed to get tutor response. Please try again.", 0);
	}
};

/**
 * Process uploaded notes JSON file
 * @param {File} file - JSON notes file
 * @returns {Promise<Object>} Processed notes
 */
export const processNotes = async (file) => {
	validateFile(file);

	if (file.type !== "application/json") {
		throw new APIError("File must be a JSON file", 400);
	}

	const formData = new FormData();
	formData.append("file", file);

	try {
		const response = await fetch(`${API_BASE_URL}/process-notes`, {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new APIError(
				errorData.error || `HTTP error! status: ${response.status}`,
				response.status,
			);
		}

		return await response.json();
	} catch (error) {
		if (error instanceof APIError) {
			throw error;
		}
		throw new APIError("Failed to process notes file. Please try again.", 0);
	}
};

/**
 * Health check for API
 * @returns {Promise<Object>} API health status
 */
export const healthCheck = async () => {
	try {
		const response = await fetch(`${API_BASE_URL}/health`);
		return {
			status: response.ok ? "healthy" : "unhealthy",
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		return {
			status: "error",
			error: error.message,
			timestamp: new Date().toISOString(),
		};
	}
};

/**
 * Get API configuration/info
 * @returns {Object} API configuration
 */
export const getApiConfig = () => ({
	baseUrl: API_BASE_URL,
	maxFileSize: 50 * 1024 * 1024, // 50MB
	supportedFileTypes: [
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/bmp",
		"image/webp",
		"application/pdf",
	],
	timeout: 300000, // 5 minutes
});

// Export utilities for external use
export { APIError, validateFile };

// Default export
export default {
	uploadAndProcessImage,
	processText,
	generateQuiz,
	checkAnswer,
	chatWithTutor,
	processNotes,
	healthCheck,
	getApiConfig,
};
