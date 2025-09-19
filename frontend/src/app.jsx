import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Tree, TreeNode } from "react-organizational-chart";

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

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      
      // Chat recognition
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setCurrentQuestion(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setError('Speech recognition failed. Please try again.');
      };

      // Quiz recognition
      quizRecognitionRef.current = new SpeechRecognition();
      quizRecognitionRef.current.continuous = false;
      quizRecognitionRef.current.interimResults = false;
      quizRecognitionRef.current.lang = 'en-US';

      quizRecognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        handleVoiceQuizAnswer(transcript);
        setQuizListening(false);
      };

      quizRecognitionRef.current.onend = () => {
        setQuizListening(false);
      };

      quizRecognitionRef.current.onerror = (event) => {
        console.error('Quiz speech recognition error:', event.error);
        setQuizListening(false);
        setError('Voice recognition failed. Please try again.');
      };
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, []);

  // Text-to-speech function
  const speakText = (text) => {
    if (speechSynthesisRef.current && 'speechSynthesis' in window) {
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
          num_questions: numQuestions
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
    
    if (question.type === 'mcq' && question.options) {
      textToSpeak += ` Options: ${question.options.join(', ')}`;
    } else if (question.type === 'true_false') {
      textToSpeak += ' Answer true or false.';
    }
    
    speakText(textToSpeak);
  };

  // Handle voice quiz answer
  const handleVoiceQuizAnswer = async (transcript) => {
    const currentQuestion = quizQuestions[currentQuizIndex];
    if (!currentQuestion) return;

    let processedAnswer = transcript.toUpperCase();
    
    // Process different answer formats
    if (currentQuestion.type === 'mcq') {
      // Try to extract letter from speech (e.g., "A", "option A", "letter A")
      const letterMatch = processedAnswer.match(/\b([ABCD])\b/);
      if (letterMatch) {
        processedAnswer = letterMatch[1];
      }
    } else if (currentQuestion.type === 'true_false') {
      // Handle true/false variations
      if (processedAnswer.includes('TRUE') || processedAnswer.includes('YES')) {
        processedAnswer = 'TRUE';
      } else if (processedAnswer.includes('FALSE') || processedAnswer.includes('NO')) {
        processedAnswer = 'FALSE';
      }
    }

    // Submit the answer
    submitQuizAnswer(currentQuizIndex, processedAnswer, true);
  };

  // Submit quiz answer
  const submitQuizAnswer = async (questionIndex, answer, isVoiceAnswer = false) => {
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
        explanation: question.explanation || ""
      });
    }

    const results = {
      score: correctCount,
      total: quizQuestions.length,
      percentage: Math.round((correctCount / quizQuestions.length) * 100),
      details: detailedResults
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
      setError("Please upload and process an image first to chat with the AI tutor.");
      return;
    }

    const userMessage = { type: 'user', content: currentQuestion.trim() };
    setChatMessages(prev => [...prev, userMessage]);
    
    setChatLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/chat",
        { 
          question: currentQuestion.trim(),
          context: ocrResult.corrected_text 
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const tutorMessage = { type: 'tutor', content: res.data.answer };
      setChatMessages(prev => [...prev, tutorMessage]);
      setCurrentQuestion("");
    } catch (err) {
      setError("Failed to get tutor response. Check backend.");
      // Remove the user message if there was an error
      setChatMessages(prev => prev.slice(0, -1));
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
      formData.append("file", file);  // Changed from "image" to "file"

      const res = await axios.post("http://localhost:5000/api/ocr", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setOcrResult(res.data);
    } catch (err) {
      setError("Failed to process file. Check backend or try a different file format.");
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
        { text: ocrResult.corrected_text },
        { headers: { "Content-Type": "application/json" } }
      );

      setProcessedResult(res.data);
    } catch (err) {
      setError("Failed to process text. Check backend.");
    } finally {
      setProcessingLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6">📘 AI Notes Processor</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">{error}</div>
      )}
      
      {loading && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded animate-pulse">
          Processing OCR...
        </div>
      )}

      {processingLoading && (
        <div className="mb-4 p-3 bg-purple-100 text-purple-800 rounded animate-pulse">
          Generating study materials...
        </div>
      )}

      {/* OCR Section */}
      <section className="mb-10 p-4 bg-white rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          📸 Upload Handwritten Notes
        </h2>
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Supports: Images (JPG, PNG, etc.) and PDF files with handwritten content
          </p>
          <input 
            type="file" 
            accept="image/*,.pdf" 
            onChange={handleImageUpload}
            className="mb-4 p-2 border rounded w-full file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        
        {ocrResult && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="px-2 py-1 bg-blue-100 rounded text-blue-800 font-medium">
                {ocrResult.file_type === 'pdf' ? '📄 PDF Processed' : '🖼️ Image Processed'}
              </span>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-2">✅ Corrected Text</h3>
              <div className="whitespace-pre-line bg-green-50 p-4 rounded-lg border-l-4 border-green-400 max-h-60 overflow-y-auto">
                {ocrResult.corrected_text || "No corrected text available."}
              </div>
            </div>

            {/* Processing Buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={handleProcessText}
                disabled={processingLoading || !ocrResult.corrected_text}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                {processingLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    ✨ Generate Study Materials
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Quiz Section */}
      {ocrResult?.corrected_text && (
        <section className="mb-10 p-4 bg-white rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📝 Interactive Quiz
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Test your knowledge with auto-generated quizzes from your notes. Try voice-first mode for hands-free quizzing!
          </p>

          {/* Quiz Controls */}
          {!quizQuestions.length && !quizLoading && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => generateQuiz("mixed", 5)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  📝 Mixed Quiz (5 questions)
                </button>
                <button
                  onClick={() => generateQuiz("mcq", 5)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  🔤 Multiple Choice
                </button>
                <button
                  onClick={() => generateQuiz("true_false", 5)}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                >
                  ✅ True/False
                </button>
              </div>
              
              {speechSupported && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="voiceMode"
                    checked={voiceQuizMode}
                    onChange={(e) => setVoiceQuizMode(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="voiceMode" className="text-sm font-medium text-blue-800">
                    🎤 Voice-First Quiz Mode (Questions read aloud, answer by speaking)
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Quiz Loading */}
          {quizLoading && (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
              <p className="text-blue-600">Generating quiz questions...</p>
            </div>
          )}

          {/* Active Quiz */}
          {quizQuestions.length > 0 && !showQuizResults && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">
                  Question {currentQuizIndex + 1} of {quizQuestions.length}
                </h3>
                <div className="flex gap-2">
                  {voiceQuizMode && speechSupported && (
                    <button
                      onClick={() => speakQuizQuestion(quizQuestions[currentQuizIndex])}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
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
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                  >
                    End Quiz
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%` }}
                ></div>
              </div>

              {/* Current Question */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-semibold text-lg mb-4">
                  {quizQuestions[currentQuizIndex]?.question}
                </h4>

                {/* MCQ Options */}
                {quizQuestions[currentQuizIndex]?.type === 'mcq' && (
                  <div className="space-y-2">
                    {quizQuestions[currentQuizIndex]?.options?.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => submitQuizAnswer(currentQuizIndex, option.charAt(0))}
                        className="w-full text-left p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {/* True/False Options */}
                {(quizQuestions[currentQuizIndex]?.type === 'true_false' || !quizQuestions[currentQuizIndex]?.type) && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => submitQuizAnswer(currentQuizIndex, 'True')}
                      className="flex-1 p-3 bg-green-100 hover:bg-green-200 border border-green-300 rounded-lg font-medium transition-colors"
                    >
                      ✅ True
                    </button>
                    <button
                      onClick={() => submitQuizAnswer(currentQuizIndex, 'False')}
                      className="flex-1 p-3 bg-red-100 hover:bg-red-200 border border-red-300 rounded-lg font-medium transition-colors"
                    >
                      ❌ False
                    </button>
                  </div>
                )}

                {/* Voice Answer Button */}
                {voiceQuizMode && speechSupported && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={startQuizListening}
                      disabled={quizListening}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        quizListening
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {quizListening ? '🎤 Listening...' : '🎤 Answer by Voice'}
                    </button>
                    {quizListening && (
                      <p className="text-sm text-red-600 mt-2">
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
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <h3 className="text-2xl font-bold mb-2">Quiz Complete! 🎉</h3>
                <div className="text-4xl font-bold mb-2">
                  {quizResults.score}/{quizResults.total}
                </div>
                <div className="text-lg text-gray-600">
                  {quizResults.percentage}% Score
                </div>
                <div className="mt-4">
                  <span className={`px-4 py-2 rounded-full text-white font-medium ${
                    quizResults.percentage >= 80 ? 'bg-green-500' : 
                    quizResults.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {quizResults.percentage >= 80 ? 'Excellent!' : 
                     quizResults.percentage >= 60 ? 'Good Job!' : 'Keep Studying!'}
                  </span>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">Review Your Answers:</h4>
                {quizResults.details.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${
                      result.isCorrect ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
                    }`}
                  >
                    <p className="font-medium mb-2">{result.question}</p>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-medium">Your Answer:</span>{' '}
                        <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                          {result.userAnswer}
                        </span>
                      </p>
                      {!result.isCorrect && (
                        <p>
                          <span className="font-medium">Correct Answer:</span>{' '}
                          <span className="text-green-600">{result.correctAnswer}</span>
                        </p>
                      )}
                      {result.explanation && (
                        <p className="text-gray-600 mt-2">{result.explanation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* New Quiz Button */}
              <div className="text-center pt-4">
                <button
                  onClick={() => {
                    setQuizQuestions([]);
                    setQuizResults(null);
                    setShowQuizResults(false);
                    setCurrentQuizIndex(0);
                  }}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
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
        <section className="mb-10 p-4 bg-white rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🤖 AI Tutor Chat
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Ask questions about your notes. The AI tutor will only use your uploaded material to answer.
          </p>

          {/* Chat Messages */}
          <div className="mb-4 h-60 overflow-y-auto bg-gray-50 rounded-lg p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Start a conversation with your AI tutor! Ask questions about your notes.
              </div>
            ) : (
              chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="font-semibold text-xs mb-1">
                      {message.type === 'user' ? 'You' : 'AI Tutor'}
                    </div>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                    AI Tutor is thinking...
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                placeholder="Ask a question about your notes..."
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                disabled={chatLoading}
              />
              
              {/* Voice Input Button */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                  }`}
                  disabled={chatLoading}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  <svg
                    className="w-4 h-4"
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
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              Send
            </button>
          </form>
          
          {isListening && (
            <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
              <div className="animate-pulse">🔴</div>
              Listening... Speak your question now.
            </div>
          )}
        </section>
      )}

      {/* Processed Results Section */}
      {processedResult && (
        <section className="p-4 bg-white rounded-xl shadow">
          <h2 className="text-2xl font-semibold mb-6 text-center">📚 Your Study Materials</h2>

          <div className="space-y-8">
            {/* Bullet Points */}
            {processedResult.bullets?.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  📍 Bullet Points
                </h3>
                <ul className="space-y-2">
                  {processedResult.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold mt-1">•</span>
                      <span className="leading-relaxed">{bullet.replace(/^[•\-]\s*/, '')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Flashcards */}
            {processedResult.flashcards?.length > 0 && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  🎴 Flashcards
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {processedResult.flashcards.map((flashcard, i) => (
                    <div
                      key={i}
                      className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-400"
                    >
                      <p className="font-semibold text-blue-700 mb-2">
                        Q: {flashcard.question}
                      </p>
                      <p className="text-gray-700">
                        A: {flashcard.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mind Map */}
            {processedResult.mindmap && (
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  🧠 Mind Map
                </h3>
                <div className="overflow-x-auto bg-white p-4 rounded-lg">
                  <Tree
                    lineWidth={"3px"}
                    lineColor={"#4F46E5"}
                    lineBorderRadius={"10px"}
                    label={
                      <div className="p-3 bg-indigo-500 text-white rounded-lg shadow-md font-semibold">
                        {processedResult.mindmap.name}
                      </div>
                    }
                  >
                    {processedResult.mindmap.children?.map((child, i) => (
                      <TreeNode
                        key={i}
                        label={
                          <div className="p-3 bg-green-400 text-white rounded-lg shadow-md font-medium">
                            {child.name}
                          </div>
                        }
                      >
                        {child.children?.map((sub, j) => (
                          <TreeNode
                            key={j}
                            label={
                              <div className="p-2 bg-pink-300 text-gray-800 rounded-lg shadow-sm text-sm">
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
        </section>
      )}

      {/* Instructions */}
      {!ocrResult && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">How to use:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-700">
            <li>Upload an image or PDF of your handwritten notes</li>
            <li>Review the corrected text from OCR processing</li>
            <li>Take interactive quizzes to test your knowledge</li>
            <li>Chat with the AI tutor about your notes (supports voice input!)</li>
            <li>Generate study materials like bullet points, flashcards, and mind maps</li>
          </ol>
          <div className="mt-3 space-y-1 text-sm text-blue-600">
            <div>📄 <strong>PDF Support:</strong> Upload multi-page handwritten PDFs</div>
            <div>🖼️ <strong>Image Support:</strong> JPG, PNG, and other image formats</div>
            <div>📝 <strong>Smart Quizzes:</strong> Auto-generated MCQ and True/False questions</div>
            {speechSupported && (
              <>
                <div>🎤 <strong>Voice Input:</strong> Speak your questions to the AI tutor</div>
                <div>🔊 <strong>Voice-First Quizzes:</strong> Questions read aloud, answer by speaking</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;