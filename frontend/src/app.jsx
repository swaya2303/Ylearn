import { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import { Tree, TreeNode } from "react-organizational-chart";
import MDXRenderer from "./components/MDXRenderer";

function App() {
  const [ocrResult, setOcrResult] = useState(null);
  const [processedResult, setProcessedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingLoading, setProcessingLoading] = useState(false);
  const [error, setError] = useState("");

  // Chat states
  const [chatMessages, setChatMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Quiz states
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [voiceQuizMode, setVoiceQuizMode] = useState(false);
  const [quizListening, setQuizListening] = useState(false);

  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);
  const quizRecognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  // Display mode for study materials
  const [studyMaterialView, setStudyMaterialView] = useState("interactive"); // 'interactive' or 'mdx'

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      setSpeechSupported(true);

      // Chat recognition
      const SpeechRecognition =
        window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setCurrentQuestion(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setError("Speech recognition failed. Please try again.");
      };

      // Quiz recognition
      quizRecognitionRef.current = new SpeechRecognition();
      quizRecognitionRef.current.continuous = false;
      quizRecognitionRef.current.interimResults = false;
      quizRecognitionRef.current.lang = "en-US";

      quizRecognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        handleVoiceQuizAnswer(transcript);
        setQuizListening(false);
      };

      quizRecognitionRef.current.onend = () => {
        setQuizListening(false);
      };

      quizRecognitionRef.current.onerror = (event) => {
        console.error("Quiz speech recognition error:", event.error);
        setQuizListening(false);
        setError("Voice recognition failed. Please try again.");
      };
    }

    // Initialize speech synthesis
    if ("speechSynthesis" in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, []);

  // Text-to-speech function
  const speakText = (text) => {
    if (speechSynthesisRef.current && "speechSynthesis" in window) {
      // Stop any ongoing speech
      speechSynthesisRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;

      speechSynthesisRef.current.speak(utterance);
    }
  };

  // Generate quiz
  const generateQuiz = async (quizType = "mixed", numQuestions = 5) => {
    if (!ocrResult?.corrected_text) {
      setError("Please upload and process a file first.");
      return;
    }

    setQuizLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/generate-quiz",
        {
          context: ocrResult.corrected_text,
          quiz_type: quizType,
          num_questions: numQuestions,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      setQuizQuestions(res.data.questions);
      setCurrentQuizIndex(0);
      setQuizAnswers({});
      setQuizResults(null);
      setShowQuizResults(false);

      // If voice mode, speak the first question
      if (voiceQuizMode && res.data.questions.length > 0) {
        setTimeout(() => {
          speakQuizQuestion(res.data.questions[0]);
        }, 1000);
      }
    } catch (err) {
      setError("Failed to generate quiz. Check backend.");
    } finally {
      setQuizLoading(false);
    }
  };

  // Speak quiz question
  const speakQuizQuestion = (question) => {
    let textToSpeak = `Question: ${question.question}`;

    if (question.type === "mcq" && question.options) {
      textToSpeak += ` Options: ${question.options.join(", ")}`;
    } else if (question.type === "true_false") {
      textToSpeak += " Answer true or false.";
    }

    speakText(textToSpeak);
  };

  // Handle voice quiz answer
  const handleVoiceQuizAnswer = async (transcript) => {
    const currentQuestion = quizQuestions[currentQuizIndex];
    if (!currentQuestion) return;

    let processedAnswer = transcript.toUpperCase();

    // Process different answer formats
    if (currentQuestion.type === "mcq") {
      // Try to extract letter from speech (e.g., "A", "option A", "letter A")
      const letterMatch = processedAnswer.match(/\b([ABCD])\b/);
      if (letterMatch) {
        processedAnswer = letterMatch[1];
      }
    } else if (currentQuestion.type === "true_false") {
      // Handle true/false variations
      if (processedAnswer.includes("TRUE") || processedAnswer.includes("YES")) {
        processedAnswer = "TRUE";
      } else if (
        processedAnswer.includes("FALSE") ||
        processedAnswer.includes("NO")
      ) {
        processedAnswer = "FALSE";
      }
    }

    // Submit the answer
    submitQuizAnswer(currentQuizIndex, processedAnswer, true);
  };

  // Submit quiz answer
  const submitQuizAnswer = async (
    questionIndex,
    answer,
    isVoiceAnswer = false
  ) => {
    const newAnswers = { ...quizAnswers, [questionIndex]: answer };
    setQuizAnswers(newAnswers);

    // Move to next question or finish quiz
    if (questionIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(questionIndex + 1);

      // In voice mode, speak the next question after a short delay
      if (voiceQuizMode && !isVoiceAnswer) {
        setTimeout(() => {
          speakQuizQuestion(quizQuestions[questionIndex + 1]);
        }, 1500);
      } else if (voiceQuizMode && isVoiceAnswer) {
        // Provide feedback and then ask next question
        speakText("Answer recorded.");
        setTimeout(() => {
          speakQuizQuestion(quizQuestions[questionIndex + 1]);
        }, 2000);
      }
    } else {
      // Quiz finished, calculate results
      await calculateQuizResults(newAnswers);
    }
  };

  // Calculate quiz results
  const calculateQuizResults = async (answers) => {
    let correctCount = 0;
    const detailedResults = [];

    for (let i = 0; i < quizQuestions.length; i++) {
      const question = quizQuestions[i];
      const userAnswer = answers[i];
      const isCorrect = userAnswer === question.correct_answer;

      if (isCorrect) correctCount++;

      detailedResults.push({
        question: question.question,
        userAnswer,
        correctAnswer: question.correct_answer,
        isCorrect,
        explanation: question.explanation || "",
      });
    }

    const results = {
      score: correctCount,
      total: quizQuestions.length,
      percentage: Math.round((correctCount / quizQuestions.length) * 100),
      details: detailedResults,
    };

    setQuizResults(results);
    setShowQuizResults(true);

    // In voice mode, announce the results
    if (voiceQuizMode) {
      const resultsText = `Quiz completed! You scored ${correctCount} out of ${quizQuestions.length}. That's ${results.percentage} percent.`;
      setTimeout(() => speakText(resultsText), 1000);
    }
  };

  // Start quiz voice listening
  const startQuizListening = () => {
    if (quizRecognitionRef.current && speechSupported) {
      setQuizListening(true);
      setError("");
      quizRecognitionRef.current.start();
    }
  };

  // Start voice recognition
  const startListening = () => {
    if (recognitionRef.current && speechSupported) {
      setIsListening(true);
      setError("");
      recognitionRef.current.start();
    }
  };

  // Stop voice recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Send chat message to AI tutor
  const handleChatSubmit = async (e) => {
    e.preventDefault();

    if (!currentQuestion.trim()) return;
    if (!ocrResult?.corrected_text) {
      setError(
        "Please upload and process an image first to chat with the AI tutor."
      );
      return;
    }

    const userMessage = { type: "user", content: currentQuestion.trim() };
    setChatMessages((prev) => [...prev, userMessage]);

    setChatLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/chat",
        {
          question: currentQuestion.trim(),
          context: ocrResult.corrected_text,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const tutorMessage = { type: "tutor", content: res.data.answer };
      setChatMessages((prev) => [...prev, tutorMessage]);
      setCurrentQuestion("");
    } catch (err) {
      setError("Failed to get tutor response. Check backend.");
      // Remove the user message if there was an error
      setChatMessages((prev) => prev.slice(0, -1));
    } finally {
      setChatLoading(false);
    }
  };

  // Upload image for OCR
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setProcessedResult(null); // Reset processed results when new image uploaded
    setChatMessages([]); // Clear chat history when new image uploaded
    setQuizQuestions([]); // Clear quiz when new image uploaded
    setQuizResults(null);

    try {
      const formData = new FormData();
      formData.append("file", file); // Changed from "image" to "file"

      const res = await axios.post("http://localhost:5000/api/ocr", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setOcrResult(res.data);
    } catch (err) {
      setError(
        "Failed to process file. Check backend or try a different file format."
      );
    } finally {
      setLoading(false);
    }
  };

  // Process corrected text into study materials
  const handleProcessText = async () => {
    if (!ocrResult?.corrected_text) return;

    setProcessingLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/process-corrected-text",
        {
          text: ocrResult.corrected_text,
          title: "Study Notes",
        },
        { headers: { "Content-Type": "application/json" } }
      );

      setProcessedResult(res.data);
    } catch (err) {
      setError("Failed to process text. Check backend.");
    } finally {
      setProcessingLoading(false);
    }
  };

  // Download markdown file
  const downloadMarkdown = async () => {
    if (!processedResult?.markdown_content) return;

    try {
      const filename = `study_notes_${
        new Date().toISOString().split("T")[0]
      }.md`;

      // Create blob and download
      const blob = new Blob([processedResult.markdown_content], {
        type: "text/markdown",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download markdown file.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans bg-gray-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-800 text-center">
          📘 AI Notes Processor
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg animate-pulse border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              Processing OCR...
            </div>
          </div>
        )}

        {processingLoading && (
          <div className="mb-6 p-4 bg-purple-50 text-purple-800 rounded-lg animate-pulse border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
              Generating study materials...
            </div>
          </div>
        )}

        {/* OCR Section */}
        <section className="mb-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
            📸 Upload Handwritten Notes
          </h2>
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
              📄 Supports: Images (JPG, PNG, etc.) and PDF files with
              handwritten content
            </p>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleImageUpload}
              className="mb-4 p-3 border-2 border-dashed border-gray-300 rounded-xl w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600 file:font-medium transition-colors"
            />
          </div>

          {ocrResult && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-3 text-sm">
                <span
                  className={`px-3 py-2 rounded-full text-white font-medium ${
                    ocrResult.file_type === "pdf"
                      ? "bg-red-500"
                      : "bg-green-500"
                  }`}
                >
                  {ocrResult.file_type === "pdf"
                    ? "📄 PDF Processed"
                    : "🖼️ Image Processed"}
                </span>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-xl mb-4 text-green-700 flex items-center gap-2">
                  ✅ Corrected Text
                </h3>
                <div className="whitespace-pre-line bg-green-50 p-6 rounded-xl border-l-4 border-green-400 max-h-80 overflow-y-auto text-gray-800 leading-relaxed">
                  {ocrResult.corrected_text || "No corrected text available."}
                </div>
              </div>

              {/* Processing Buttons */}
              <div className="flex flex-wrap gap-4 mt-6">
                <button
                  onClick={handleProcessText}
                  disabled={processingLoading || !ocrResult.corrected_text}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center gap-3 shadow-lg"
                >
                  {processingLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    <>✨ Generate Study Materials</>
                  )}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Quiz Section */}
        {ocrResult?.corrected_text && (
          <section className="mb-12 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-sm border border-purple-100">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
              🧩 Interactive Quiz
            </h2>
            <p className="text-sm text-gray-600 mb-6 bg-purple-50 p-4 rounded-xl border border-purple-200">
              Test your knowledge with auto-generated quizzes from your notes.
              Try voice-first mode for hands-free quizzing!
            </p>

            {/* Quiz Controls */}
            {!quizQuestions.length && !quizLoading && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => generateQuiz("mixed", 5)}
                    className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
                  >
                    🧩 Mixed Quiz (5 questions)
                  </button>
                  <button
                    onClick={() => generateQuiz("mcq", 5)}
                    className="p-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
                  >
                    🔤 Multiple Choice
                  </button>
                  <button
                    onClick={() => generateQuiz("true_false", 5)}
                    className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
                  >
                    ✅ True/False
                  </button>
                </div>

                {speechSupported && (
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                    <input
                      type="checkbox"
                      id="voiceMode"
                      checked={voiceQuizMode}
                      onChange={(e) => setVoiceQuizMode(e.target.checked)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <label
                      htmlFor="voiceMode"
                      className="text-sm font-medium text-blue-800 flex items-center gap-2"
                    >
                      🎤 Voice-First Quiz Mode (Questions read aloud, answer by
                      speaking)
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Quiz Loading */}
            {quizLoading && (
              <div className="p-8 text-center bg-white rounded-xl shadow-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-blue-600 font-medium">
                  Generating quiz questions...
                </p>
              </div>
            )}

            {/* Active Quiz */}
            {quizQuestions.length > 0 && !showQuizResults && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm">
                  <h3 className="font-semibold text-xl text-gray-800">
                    Question {currentQuizIndex + 1} of {quizQuestions.length}
                  </h3>
                  <div className="flex gap-3">
                    {voiceQuizMode && speechSupported && (
                      <button
                        onClick={() =>
                          speakQuizQuestion(quizQuestions[currentQuizIndex])
                        }
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        title="Repeat question"
                      >
                        🔊 Repeat
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setQuizQuestions([]);
                        setQuizResults(null);
                        setShowQuizResults(false);
                      }}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      End Quiz
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        ((currentQuizIndex + 1) / quizQuestions.length) * 100
                      }%`,
                    }}
                  ></div>
                </div>

                {/* Current Question */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                  <h4 className="font-semibold text-xl mb-6 text-gray-800 leading-relaxed">
                    {quizQuestions[currentQuizIndex]?.question}
                  </h4>

                  {/* MCQ Options */}
                  {quizQuestions[currentQuizIndex]?.type === "mcq" && (
                    <div className="space-y-3">
                      {quizQuestions[currentQuizIndex]?.options?.map(
                        (option, idx) => (
                          <button
                            key={idx}
                            onClick={() =>
                              submitQuizAnswer(
                                currentQuizIndex,
                                option.charAt(0)
                              )
                            }
                            className="w-full text-left p-4 border-2 border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all transform hover:scale-[1.02] text-gray-700 font-medium"
                          >
                            {option}
                          </button>
                        )
                      )}
                    </div>
                  )}

                  {/* True/False Options */}
                  {(quizQuestions[currentQuizIndex]?.type === "true_false" ||
                    !quizQuestions[currentQuizIndex]?.type) && (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() =>
                          submitQuizAnswer(currentQuizIndex, "True")
                        }
                        className="p-6 bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 border-2 border-green-300 rounded-xl font-semibold text-green-800 transition-all transform hover:scale-105 shadow-md"
                      >
                        ✅ True
                      </button>
                      <button
                        onClick={() =>
                          submitQuizAnswer(currentQuizIndex, "False")
                        }
                        className="p-6 bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 border-2 border-red-300 rounded-xl font-semibold text-red-800 transition-all transform hover:scale-105 shadow-md"
                      >
                        ❌ False
                      </button>
                    </div>
                  )}

                  {/* Voice Answer Button */}
                  {voiceQuizMode && speechSupported && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={startQuizListening}
                        disabled={quizListening}
                        className={`px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg ${
                          quizListening
                            ? "bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse"
                            : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                        }`}
                      >
                        {quizListening
                          ? "🎤 Listening..."
                          : "🎤 Answer by Voice"}
                      </button>
                      {quizListening && (
                        <p className="text-sm text-red-600 mt-3 font-medium">
                          Speak your answer now...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quiz Results */}
            {showQuizResults && quizResults && (
              <div className="space-y-6">
                <div className="text-center p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg border border-blue-200">
                  <h3 className="text-3xl font-bold mb-4 text-gray-800">
                    Quiz Complete! 🎉
                  </h3>
                  <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {quizResults.score}/{quizResults.total}
                  </div>
                  <div className="text-2xl text-gray-600 mb-6">
                    {quizResults.percentage}% Score
                  </div>
                  <div className="mt-6">
                    <span
                      className={`px-6 py-3 rounded-full text-white font-semibold text-lg shadow-lg ${
                        quizResults.percentage >= 80
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : quizResults.percentage >= 60
                          ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                          : "bg-gradient-to-r from-red-500 to-red-600"
                      }`}
                    >
                      {quizResults.percentage >= 80
                        ? "Excellent! 🌟"
                        : quizResults.percentage >= 60
                        ? "Good Job! 👍"
                        : "Keep Studying! 📚"}
                    </span>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-xl text-gray-800">
                    Review Your Answers:
                  </h4>
                  {quizResults.details.map((result, idx) => (
                    <div
                      key={idx}
                      className={`p-6 rounded-xl border-l-4 shadow-sm ${
                        result.isCorrect
                          ? "bg-green-50 border-green-400"
                          : "bg-red-50 border-red-400"
                      }`}
                    >
                      <p className="font-semibold mb-3 text-gray-800 text-lg">
                        {result.question}
                      </p>
                      <div className="text-sm space-y-2">
                        <p>
                          <span className="font-medium text-gray-700">
                            Your Answer:
                          </span>{" "}
                          <span
                            className={`font-semibold ${
                              result.isCorrect
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {result.userAnswer}
                          </span>
                        </p>
                        {!result.isCorrect && (
                          <p>
                            <span className="font-medium text-gray-700">
                              Correct Answer:
                            </span>{" "}
                            <span className="text-green-600 font-semibold">
                              {result.correctAnswer}
                            </span>
                          </p>
                        )}
                        {result.explanation && (
                          <p className="text-gray-600 mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            {result.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* New Quiz Button */}
                <div className="text-center pt-6">
                  <button
                    onClick={() => {
                      setQuizQuestions([]);
                      setQuizResults(null);
                      setShowQuizResults(false);
                      setCurrentQuizIndex(0);
                    }}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
                  >
                    🔄 Take Another Quiz
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* AI Tutor Chat Section */}
        {ocrResult?.corrected_text && (
          <section className="mb-12 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-100">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
              🤖 AI Tutor Chat
            </h2>
            <p className="text-sm text-gray-600 mb-6 bg-green-50 p-4 rounded-xl border border-green-200">
              Ask questions about your notes. The AI tutor will only use your
              uploaded material to answer.
            </p>

            {/* Chat Messages */}
            <div className="mb-6 h-80 overflow-y-auto bg-white rounded-xl p-6 space-y-4 shadow-sm border border-gray-200">
              {chatMessages.length === 0 ? (
                <div className="text-gray-500 text-center py-16 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  <div className="text-4xl mb-4">💬</div>
                  <p className="text-lg font-medium">
                    Start a conversation with your AI tutor!
                  </p>
                  <p className="text-sm">Ask questions about your notes.</p>
                </div>
              ) : (
                chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-6 py-4 rounded-2xl shadow-md ${
                        message.type === "user"
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                          : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300"
                      }`}
                    >
                      <div className="font-semibold text-xs mb-2 opacity-80">
                        {message.type === "user" ? "You" : "🤖 AI Tutor"}
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-gray-200 to-gray-300 px-6 py-4 rounded-2xl shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-transparent"></div>
                      <span className="text-gray-700">
                        AI Tutor is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  placeholder="Ask a question about your notes..."
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-14 text-gray-800"
                  disabled={chatLoading}
                />

                {/* Voice Input Button */}
                {speechSupported && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all ${
                      isListening
                        ? "bg-red-500 text-white animate-pulse shadow-lg"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-600 hover:shadow-md"
                    }`}
                    disabled={chatLoading}
                    title={isListening ? "Stop listening" : "Voice input"}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={!currentQuestion.trim() || chatLoading}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                Send
              </button>
            </form>

            {isListening && (
              <div className="mt-3 text-sm text-red-600 flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="animate-pulse text-red-500">🔴</div>
                <span className="font-medium">
                  Listening... Speak your question now.
                </span>
              </div>
            )}
          </section>
        )}

        {/* Processed Results Section */}
        {processedResult && (
          <section className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-sm border border-yellow-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-semibold text-gray-800">
                📚 Your Study Materials
              </h2>
              <div className="flex gap-3">
                <div className="flex bg-white rounded-lg p-1 border border-gray-300">
                  <button
                    onClick={() => setStudyMaterialView("interactive")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      studyMaterialView === "interactive"
                        ? "bg-blue-500 text-white"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    📊 Interactive
                  </button>
                  <button
                    onClick={() => setStudyMaterialView("mdx")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      studyMaterialView === "mdx"
                        ? "bg-blue-500 text-white"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    📝 Document
                  </button>
                </div>
                <button
                  onClick={downloadMarkdown}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
                  title="Download all study materials as markdown file"
                >
                  📥 Download .md File
                </button>
              </div>
            </div>

            {studyMaterialView === "mdx" ? (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 prose max-w-none">
                <MDXRenderer content={processedResult.markdown_content} />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Bullet Points */}
                {processedResult.bullets?.length > 0 && (
                  <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                      🔍 Key Points
                    </h3>
                    <ul className="space-y-3">
                      {processedResult.bullets.map((bullet, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-blue-500 font-bold text-lg mt-1">
                            •
                          </span>
                          <span className="leading-relaxed text-gray-800">
                            {bullet.replace(/^[•\-]\s*/, "")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Flashcards */}
                {processedResult.flashcards?.length > 0 && (
                  <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                      🎴 Flashcards
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {processedResult.flashcards.map((flashcard, i) => (
                        <div
                          key={i}
                          className="p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 border-l-4 border-blue-500"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold text-lg text-blue-800">
                              Question
                            </h2>
                            <p className="text-sm text-gray-600">
                              Flashcard {i + 1}
                            </p>
                          </div>
                          <p className="font-semibold text-blue-900 text-lg mb-2">
                            {flashcard.question}
                          </p>
                          <hr className="my-4 border-gray-300" />
                          <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold text-lg text-blue-800">
                              Answer
                            </h2>
                          </div>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {flashcard.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mind Map */}
                {processedResult.mindmap && (
                  <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                      🧠 Mind Map
                    </h3>
                    <div className="overflow-x-auto bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-200">
                      <Tree
                        lineWidth={"3px"}
                        lineColor={"#6366F1"}
                        lineBorderRadius={"10px"}
                        label={
                          <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg font-bold text-lg">
                            {processedResult.mindmap.name}
                          </div>
                        }
                      >
                        {processedResult.mindmap.children?.map((child, i) => (
                          <TreeNode
                            key={i}
                            label={
                              <div className="p-3 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl shadow-md font-semibold">
                                {child.name}
                              </div>
                            }
                          >
                            {child.children?.map((sub, j) => (
                              <TreeNode
                                key={j}
                                label={
                                  <div className="p-3 bg-gradient-to-r from-pink-300 to-purple-400 text-white rounded-lg shadow-sm font-medium text-sm">
                                    {sub.name}
                                  </div>
                                }
                              />
                            ))}
                          </TreeNode>
                        ))}
                      </Tree>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Instructions */}
        {!ocrResult && (
          <div className="mt-8 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-6 text-xl">
              🚀 How to use:
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-blue-700 leading-relaxed">
              <li className="p-2">
                Upload an image or PDF of your handwritten notes
              </li>
              <li className="p-2">
                Review the corrected text from OCR processing
              </li>
              <li className="p-2">
                Take interactive quizzes to test your knowledge
              </li>
              <li className="p-2">
                Chat with the AI tutor about your notes (supports voice input!)
              </li>
              <li className="p-2">
                Generate study materials like bullet points, flashcards, and
                mind maps
              </li>
            </ol>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-600">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="font-medium mb-2">📄 File Support</div>
                <div>
                  Upload multi-page handwritten PDFs and various image formats
                  (JPG, PNG, etc.)
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="font-medium mb-2">🧩 Smart Quizzes</div>
                <div>
                  Auto-generated MCQ and True/False questions with voice-first
                  mode
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="font-medium mb-2">📥 Export Options</div>
                <div>
                  Download complete study materials as markdown (.md) files
                </div>
              </div>
              {speechSupported && (
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div className="font-medium mb-2">🎤 Voice Features</div>
                  <div>Voice input for questions and hands-free quiz mode</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
