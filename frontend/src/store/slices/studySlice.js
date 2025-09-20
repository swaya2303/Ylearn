// store/slices/studySlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as apiService from "../../api/apiService";

// Async thunks for API calls
export const uploadAndProcessFile = createAsyncThunk(
	"study/uploadAndProcessFile",
	async (file, { rejectWithValue, dispatch }) => {
		try {
			// Start upload progress simulation
			const progressInterval = setInterval(() => {
				dispatch(updateUploadProgress(Math.min(90, Math.random() * 15)));
			}, 200);

			const ocrResult = await apiService.uploadAndProcessImage(file);

			clearInterval(progressInterval);
			dispatch(updateUploadProgress(100));

			// Process the corrected text to get study materials
			const processedResult = await apiService.processText(
				ocrResult.corrected_text,
			);

			return {
				ocrResult,
				processedResult,
			};
		} catch (error) {
			return rejectWithValue(error.message);
		}
	},
);

export const generateQuiz = createAsyncThunk(
	"study/generateQuiz",
	async (
		{ context, quizType = "mixed", numQuestions = 5 },
		{ rejectWithValue },
	) => {
		try {
			const result = await apiService.generateQuiz(
				context,
				quizType,
				numQuestions,
			);
			return result;
		} catch (error) {
			return rejectWithValue(error.message);
		}
	},
);

export const checkAnswer = createAsyncThunk(
	"study/checkAnswer",
	async (
		{ userAnswer, correctAnswer, questionType = "mcq" },
		{ rejectWithValue },
	) => {
		try {
			const result = await apiService.checkAnswer(
				userAnswer,
				correctAnswer,
				questionType,
			);
			return result;
		} catch (error) {
			return rejectWithValue(error.message);
		}
	},
);

export const chatWithTutor = createAsyncThunk(
	"study/chatWithTutor",
	async ({ question, context }, { rejectWithValue }) => {
		try {
			const result = await apiService.chatWithTutor(question, context);
			return {
				question,
				answer: result.answer,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			return rejectWithValue(error.message);
		}
	},
);

const initialState = {
	// OCR and Processing
	ocrResult: null,
	processedResult: null,
	uploadProgress: 0,

	// Study Materials
	studyMaterials: [],
	flashcards: [],
	mindmap: null,
	bullets: [],
	formattedText: "",
	markdownContent: "",

	// Quiz System
	currentQuiz: null,
	quizResults: [],
	selectedAnswers: {},
	currentQuestion: 0,
	quizSettings: {
		type: "mixed",
		numQuestions: 5,
	},

	// AI Tutor
	chatHistory: [],

	// File Management
	uploadedFiles: [],
	currentFile: null,

	// Statistics
	totalStudySessions: 0,
	totalQuizzesTaken: 0,
	averageQuizScore: 0,
	studyStreak: 0,
	lastStudyDate: null,

	// Performance Tracking
	weakAreas: [],
	strongAreas: [],
	studyTime: 0, // in minutes

	// User Preferences
	preferences: {
		flashcardAutoFlip: false,
		quizDifficulty: "mixed",
		studyReminders: true,
		darkMode: false,
	},
};

const studySlice = createSlice({
	name: "study",
	initialState,
	reducers: {
		// Upload Progress
		updateUploadProgress: (state, action) => {
			state.uploadProgress = Math.min(
				100,
				state.uploadProgress + action.payload,
			);
		},

		resetUploadProgress: (state) => {
			state.uploadProgress = 0;
		},

		// Study Materials
		setStudyMaterials: (state, action) => {
			const { flashcards, mindmap, bullets, formattedText, markdownContent } =
				action.payload;
			state.flashcards = flashcards || [];
			state.mindmap = mindmap || null;
			state.bullets = bullets || [];
			state.formattedText = formattedText || "";
			state.markdownContent = markdownContent || "";
		},

		addStudyMaterial: (state, action) => {
			state.studyMaterials.push({
				id: Date.now(),
				title: action.payload.title,
				content: action.payload.content,
				createdAt: new Date().toISOString(),
				type: action.payload.type,
			});
		},

		removeStudyMaterial: (state, action) => {
			state.studyMaterials = state.studyMaterials.filter(
				(material) => material.id !== action.payload,
			);
		},

		// File Management
		setCurrentFile: (state, action) => {
			state.currentFile = action.payload;
		},

		addUploadedFile: (state, action) => {
			const file = {
				id: Date.now(),
				name: action.payload.name,
				type: action.payload.type,
				size: action.payload.size,
				uploadedAt: new Date().toISOString(),
			};
			state.uploadedFiles.unshift(file);
			state.currentFile = file;
		},

		// Quiz Management
		setCurrentQuiz: (state, action) => {
			state.currentQuiz = action.payload;
			state.selectedAnswers = {};
			state.currentQuestion = 0;
		},

		setQuizSettings: (state, action) => {
			state.quizSettings = { ...state.quizSettings, ...action.payload };
		},

		setSelectedAnswer: (state, action) => {
			const { questionIndex, answer } = action.payload;
			state.selectedAnswers[questionIndex] = answer;
		},

		setCurrentQuestion: (state, action) => {
			state.currentQuestion = action.payload;
		},

		nextQuestion: (state) => {
			if (
				state.currentQuiz &&
				state.currentQuestion < state.currentQuiz.questions.length - 1
			) {
				state.currentQuestion += 1;
			}
		},

		previousQuestion: (state) => {
			if (state.currentQuestion > 0) {
				state.currentQuestion -= 1;
			}
		},

		submitQuizResults: (state, action) => {
			const results = action.payload;
			state.quizResults.unshift({
				id: Date.now(),
				...results,
				completedAt: new Date().toISOString(),
			});

			// Update statistics
			state.totalQuizzesTaken += 1;
			const scores = state.quizResults.map((result) => result.percentage);
			state.averageQuizScore = Math.round(
				scores.reduce((a, b) => a + b, 0) / scores.length,
			);

			// Update performance tracking
			if (results.percentage >= 80) {
				// Good performance areas
				const topics = results.results
					.filter((r) => r.isCorrect)
					.map((r) => r.question);
				state.strongAreas = [...new Set([...state.strongAreas, ...topics])];
			} else {
				// Areas needing improvement
				const topics = results.results
					.filter((r) => !r.isCorrect)
					.map((r) => r.question);
				state.weakAreas = [...new Set([...state.weakAreas, ...topics])];
			}
		},

		resetQuiz: (state) => {
			state.currentQuiz = null;
			state.selectedAnswers = {};
			state.currentQuestion = 0;
		},

		// Chat History
		addChatMessage: (state, action) => {
			state.chatHistory.push({
				id: Date.now(),
				...action.payload,
				timestamp: new Date().toISOString(),
			});
		},

		clearChatHistory: (state) => {
			state.chatHistory = [];
		},

		// Statistics Updates
		updateStudyTime: (state, action) => {
			state.studyTime += action.payload; // minutes
		},

		incrementStudySessions: (state) => {
			state.totalStudySessions += 1;
			state.lastStudyDate = new Date().toISOString();

			// Update study streak
			const today = new Date().toDateString();
			const lastStudy = state.lastStudyDate
				? new Date(state.lastStudyDate).toDateString()
				: null;
			const yesterday = new Date(Date.now() - 86400000).toDateString();

			if (lastStudy === yesterday) {
				state.studyStreak += 1;
			} else if (lastStudy !== today) {
				state.studyStreak = 1;
			}
		},

		// Preferences
		updatePreferences: (state, action) => {
			state.preferences = { ...state.preferences, ...action.payload };
		},

		// Performance Analysis
		updatePerformanceAnalysis: (state) => {
			// Analyze recent quiz results for performance insights
			const recentResults = state.quizResults.slice(0, 5); // Last 5 quizzes

			if (recentResults.length > 0) {
				const avgRecent =
					recentResults.reduce((sum, result) => sum + result.percentage, 0) /
					recentResults.length;

				// Update weak/strong areas based on recent performance
				const weakTopics = [];
				const strongTopics = [];

				recentResults.forEach((result) => {
					result.results.forEach((answer) => {
						if (answer.isCorrect) {
							strongTopics.push(answer.question);
						} else {
							weakTopics.push(answer.question);
						}
					});
				});

				// Keep only unique topics and limit to 10 each
				state.weakAreas = [...new Set(weakTopics)].slice(0, 10);
				state.strongAreas = [...new Set(strongTopics)].slice(0, 10);
			}
		},

		// Reset Functions
		resetStudyData: (state) => {
			state.ocrResult = null;
			state.processedResult = null;
			state.flashcards = [];
			state.mindmap = null;
			state.bullets = [];
			state.formattedText = "";
			state.markdownContent = "";
			state.uploadProgress = 0;
		},

		resetAllData: (state) => {
			Object.assign(state, {
				...initialState,
				preferences: state.preferences, // Keep preferences
			});
		},
	},

	extraReducers: (builder) => {
		// Upload and Process File
		builder
			.addCase(uploadAndProcessFile.pending, (state) => {
				state.uploadProgress = 0;
			})
			.addCase(uploadAndProcessFile.fulfilled, (state, action) => {
				const { ocrResult, processedResult } = action.payload;
				state.ocrResult = ocrResult;
				state.processedResult = processedResult;

				// Update study materials
				if (processedResult) {
					state.flashcards = processedResult.flashcards || [];
					state.mindmap = processedResult.mindmap || null;
					state.bullets = processedResult.bullets || [];
					state.formattedText = processedResult.formatted_text || "";
					state.markdownContent = processedResult.markdown_content || "";
				}

				state.uploadProgress = 100;
			})
			.addCase(uploadAndProcessFile.rejected, (state) => {
				state.uploadProgress = 0;
			});

		// Generate Quiz
		builder.addCase(generateQuiz.fulfilled, (state, action) => {
			state.currentQuiz = action.payload;
			state.selectedAnswers = {};
			state.currentQuestion = 0;
		});

		// Chat with Tutor
		builder.addCase(chatWithTutor.fulfilled, (state, action) => {
			state.chatHistory.push(action.payload);
		});
	},
});

export const {
	// Upload Progress
	updateUploadProgress,
	resetUploadProgress,

	// Study Materials
	setStudyMaterials,
	addStudyMaterial,
	removeStudyMaterial,

	// File Management
	setCurrentFile,
	addUploadedFile,

	// Quiz Management
	setCurrentQuiz,
	setQuizSettings,
	setSelectedAnswer,
	setCurrentQuestion,
	nextQuestion,
	previousQuestion,
	submitQuizResults,
	resetQuiz,

	// Chat
	addChatMessage,
	clearChatHistory,

	// Statistics
	updateStudyTime,
	incrementStudySessions,

	// Preferences
	updatePreferences,

	// Performance
	updatePerformanceAnalysis,

	// Reset Functions
	resetStudyData,
	resetAllData,
} = studySlice.actions;

export default studySlice.reducer;
