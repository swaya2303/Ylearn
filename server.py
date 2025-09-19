import os
import json
from flask import Flask, request, jsonify, send_from_directory
from google.cloud import vision
from dotenv import load_dotenv
import google.generativeai as genai  # Gemini
from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  # PyMuPDF for PDF processing
from PIL import Image
import io

# Load .env
load_dotenv()

# Gemini setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)
CORS(app)  # ✅ allow all origins by default

# Vision client (reads GOOGLE_APPLICATION_CREDENTIALS env var)
vision_client = vision.ImageAnnotatorClient()

# ------------------ OCR + Correction (Images & PDFs) ------------------
@app.route("/api/ocr", methods=["POST"])
def ocr_and_correct():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files["file"]
    file_content = file.read()
    filename = file.filename.lower()
    
    all_text = ""
    
    try:
        if filename.endswith('.pdf'):
            # Handle PDF files
            all_text = process_pdf(file_content)
        else:
            # Handle image files
            all_text = process_image(file_content)
            
        if not all_text.strip():
            return jsonify({"error": "No text detected in the file"}), 400
            
        # Gemini correction
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""Here is OCR output from a handwritten document:
---
{all_text}
---
Some words may be incomplete or nonsensical due to OCR errors.
Fix spelling and autocorrect incomplete words without changing meaning.
Maintain the original structure and formatting as much as possible.
Return only corrected text, nothing else.
"""
        
        gemini_response = model.generate_content(prompt)
        corrected_text = gemini_response.text if gemini_response and gemini_response.text else all_text
        
        return jsonify({
            "corrected_text": corrected_text.strip(),
            "file_type": "pdf" if filename.endswith('.pdf') else "image"
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to process file: {str(e)}"}), 500

def process_pdf(file_content):
    """Extract text from PDF pages using OCR"""
    try:
        # Open PDF from bytes
        pdf_document = fitz.open(stream=file_content, filetype="pdf")
        all_text = ""
        
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            
            # Convert page to image
            mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better OCR quality
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            # OCR the page image
            image = vision.Image(content=img_data)
            response = vision_client.document_text_detection(image=image)
            
            if response.error.message:
                continue  # Skip pages with errors
                
            page_text = response.full_text_annotation.text if response.full_text_annotation else ""
            if page_text.strip():
                all_text += f"\n--- Page {page_num + 1} ---\n{page_text}\n"
        
        pdf_document.close()
        return all_text
        
    except Exception as e:
        raise Exception(f"PDF processing failed: {str(e)}")

def process_image(file_content):
    """Extract text from image using OCR"""
    try:
        # OCR the image
        image = vision.Image(content=file_content)
        response = vision_client.document_text_detection(image=image)
        
        if response.error.message:
            raise Exception(f"OCR failed: {response.error.message}")
            
        return response.full_text_annotation.text if response.full_text_annotation else ""
        
    except Exception as e:
        raise Exception(f"Image processing failed: {str(e)}")

# ------------------ Process Corrected Text ------------------
@app.route("/api/process-corrected-text", methods=["POST"])
def process_corrected_text():
    data = request.get_json()
    
    if not data or "text" not in data:
        return jsonify({"error": "No text provided"}), 400
    
    corrected_text = data["text"]
    
    # Split text into lines/sentences for processing
    lines = [line.strip() for line in corrected_text.split('\n') if line.strip()]
    
    # ---- BULLETS ----
    bullets = [f"• {line}" for line in lines]
    
    # ---- FLASHCARDS ---- using Gemini
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    flashcard_prompt = f"""
    Convert the following text into 3-5 simple Q/A flashcards for studying.
    Return only a JSON array of objects with "question" and "answer" fields.
    Make the questions test understanding of key concepts.
    
    Text:
    {corrected_text}
    
    Format: [{{"question": "...", "answer": "..."}}, ...]
    """
    
    try:
        flashcard_response = model.generate_content(flashcard_prompt)
        flashcards = json.loads(flashcard_response.text)
    except Exception as e:
        # Fallback flashcards
        flashcards = [
            {"question": "What is the main topic of these notes?", "answer": lines[0] if lines else "Study notes"},
            {"question": "What are the key points mentioned?", "answer": ". ".join(lines[:3])}
        ]
    
    # ---- MINDMAP ---- using Gemini
    mindmap_prompt = f"""
    Create a hierarchical mindmap structure from this text.
    Return only a JSON object with "name" (main topic) and "children" array.
    Each child should have "name" and optionally "children" for sub-topics.
    
    Text:
    {corrected_text}
    
    Format: {{"name": "Main Topic", "children": [{{"name": "Subtopic 1", "children": [{{"name": "Detail 1"}}]}}, {{"name": "Subtopic 2"}}]}}
    """
    
    try:
        mindmap_response = model.generate_content(mindmap_prompt)
        mindmap = json.loads(mindmap_response.text)
    except Exception as e:
        # Fallback mindmap
        mindmap = {
            "name": "Study Notes",
            "children": [
                {
                    "name": "Key Points",
                    "children": [{"name": line} for line in lines[:5]]
                }
            ]
        }
    
    return jsonify({
        "bullets": bullets,
        "flashcards": flashcards,
        "mindmap": mindmap
    })

# ------------------ Notes Processing (existing functionality) ------------------
@app.route("/api/process-notes", methods=["POST"])
def process_notes():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files["file"]
    
    try:
        notes = json.load(file)
    except Exception as e:
        return jsonify({"error": f"Invalid JSON: {str(e)}"}), 400
    
    content = notes.get("content", [])
    title = notes.get("title", "Notes")
    
    # ---- BULLETS ----
    bullets = [f"- {line.strip()}" for line in content]
    
    # ---- FLASHCARDS ---- (basic rule + Gemini fallback)
    flashcards = []
    for sentence in content:
        if "produce" in sentence.lower():
            flashcards.append({
                "question": "What does it produce?",
                "answer": sentence.split("produce")[-1].strip()
            })
    
    # If no flashcards found, ask Gemini to generate some
    if not flashcards:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""
        Convert the following study notes into simple Q/A flashcards (JSON list of {{question, answer}}):
        {content}
        """
        gemini_response = model.generate_content(prompt)
        try:
            flashcards = json.loads(gemini_response.text)
        except Exception:
            flashcards = [{"question": "What is this about?", "answer": title}]
    
    # ---- MINDMAP ----
    mindmap = {
        "name": title,
        "children": [
            {"name": "Main Points", "children": [{"name": line.strip()} for line in content]}
        ]
    }
    
    return jsonify({
        "bullets": bullets,
        "flashcards": flashcards,
        "mindmap": mindmap
    })

# ------------------ Quiz Generation ------------------
@app.route("/api/generate-quiz", methods=["POST"])
def generate_quiz():
    data = request.get_json()
    
    if not data or "context" not in data:
        return jsonify({"error": "Context is required"}), 400
    
    context = data["context"]
    quiz_type = data.get("quiz_type", "mixed")  # mcq, true_false, or mixed
    num_questions = data.get("num_questions", 5)
    
    if not context.strip():
        return jsonify({"error": "No study material available. Please upload and process a file first."}), 400
    
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    if quiz_type == "mcq":
        quiz_prompt = f"""
        Create {num_questions} multiple choice questions based on the following study material.
        Return only a JSON array with this exact format:
        
        [{{"question": "What is...?", "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"], "correct_answer": "A", "explanation": "Brief explanation"}}]
        
        Study Material:
        {context}
        
        Make sure questions test understanding, not just memorization.
        """
    elif quiz_type == "true_false":
        quiz_prompt = f"""
        Create {num_questions} true/false questions based on the following study material.
        Return only a JSON array with this exact format:
        
        [{{"question": "Statement about the material", "correct_answer": "True", "explanation": "Brief explanation why this is true/false"}}]
        
        Study Material:
        {context}
        
        Make statements that test comprehension of key concepts.
        """
    else:  # mixed
        quiz_prompt = f"""
        Create {num_questions} questions (mix of MCQ and True/False) based on the following study material.
        Return only a JSON array with this exact format:
        
        For MCQ: {{"type": "mcq", "question": "What is...?", "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"], "correct_answer": "A", "explanation": "Brief explanation"}}
        For True/False: {{"type": "true_false", "question": "Statement", "correct_answer": "True", "explanation": "Brief explanation"}}
        
        Study Material:
        {context}
        
        Make it roughly 60% MCQ and 40% True/False questions.
        """
    
    try:
        response = model.generate_content(quiz_prompt)
        questions = json.loads(response.text)
        
        # Validate and clean the questions
        cleaned_questions = []
        for q in questions[:num_questions]:  # Ensure we don't exceed requested number
            if 'question' in q and 'correct_answer' in q:
                cleaned_questions.append(q)
        
        return jsonify({"questions": cleaned_questions})
    except Exception as e:
        # Fallback questions if AI generation fails
        fallback_questions = [
            {
                "type": "true_false",
                "question": "The material contains important study information.",
                "correct_answer": "True",
                "explanation": "Based on the uploaded content."
            }
        ]
        return jsonify({"questions": fallback_questions})

# ------------------ Quiz Answer Checking ------------------
@app.route("/api/check-answer", methods=["POST"])
def check_answer():
    data = request.get_json()
    
    if not data or "user_answer" not in data or "correct_answer" not in data:
        return jsonify({"error": "User answer and correct answer are required"}), 400
    
    user_answer = data["user_answer"].strip().upper()
    correct_answer = data["correct_answer"].strip().upper()
    question_type = data.get("question_type", "mcq")
    
    is_correct = False
    
    if question_type == "mcq":
        # For MCQ, check if the letter matches (A, B, C, D)
        is_correct = user_answer == correct_answer
    elif question_type == "true_false":
        # For True/False, accept various forms
        user_normalized = user_answer.replace(".", "")
        correct_normalized = correct_answer.replace(".", "")
        
        # Accept "T"/"F" and "TRUE"/"FALSE"
        if user_normalized in ["T", "TRUE"] and correct_normalized in ["T", "TRUE"]:
            is_correct = True
        elif user_normalized in ["F", "FALSE"] and correct_normalized in ["F", "FALSE"]:
            is_correct = True
    
    return jsonify({
        "is_correct": is_correct,
        "user_answer": user_answer,
        "correct_answer": correct_answer
    })

# ------------------ AI Tutor Chat ------------------
@app.route("/api/chat", methods=["POST"])
def ai_tutor_chat():
    data = request.get_json()
    
    if not data or "question" not in data or "context" not in data:
        return jsonify({"error": "Question and context are required"}), 400
    
    question = data["question"]
    context = data["context"]  # This will be the corrected text from OCR
    
    if not context.strip():
        return jsonify({"error": "No study material available. Please upload and process an image first."}), 400
    
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    tutor_prompt = f"""
    You are an AI tutor. Answer the student's question using ONLY the provided study material.
    Be helpful, clear, and educational. If the answer isn't in the material, say so.
    
    Study Material:
    {context}
    
    Student's Question: {question}
    
    Instructions:
    - Only use information from the study material above
    - Be concise but thorough
    - If the question can't be answered from the material, politely explain this
    - Act as a helpful tutor, not just an information retriever
    """
    
    try:
        response = model.generate_content(tutor_prompt)
        answer = response.text if response and response.text else "I'm sorry, I couldn't generate a response. Please try again."
        
        return jsonify({"answer": answer.strip()})
    except Exception as e:
        return jsonify({"error": f"Failed to get tutor response: {str(e)}"}), 500

# ------------------ Static File Serving ------------------
@app.route("/")
def home():
    return send_from_directory(".", "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(".", path)

if __name__ == "__main__":
    app.run(debug=True, port=5000)