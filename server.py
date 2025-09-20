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
import re

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
            
        # Enhanced Gemini correction with better prompt
        model = genai.GenerativeModel("gemini-1.5-pro")  # Using stable model
        prompt = f"""You are an expert at correcting OCR output from handwritten academic notes. Your task is to:

1. Fix spelling errors and OCR mistakes
2. Complete incomplete words based on context
3. Maintain original structure and formatting
4. Preserve academic terminology and technical terms
5. Keep bullet points, numbering, and hierarchy intact
6. Don't change the meaning or add new information

OCR Text to correct:
---
{all_text}
---

Return ONLY the corrected text with proper formatting. Do not add explanations or comments."""
        
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

# ------------------ Process Corrected Text + Generate Markdown ------------------
@app.route("/api/process-corrected-text", methods=["POST"])
def process_corrected_text():
    """Updated version using new functions for formatted text processing"""
    data = request.get_json()
    
    if not data or "text" not in data:
        return jsonify({"error": "No text provided"}), 400
    
    corrected_text = data["text"]
    title = data.get("title", "Study Notes")
    
    # ---- CONVERT TEXT TO MARKDOWN ----
    markdown_text = convert_text_to_markdown(corrected_text)
    
    # ---- ENHANCED BULLETS ---- using existing function
    bullets = extract_enhanced_key_points(corrected_text)
    
    # ---- ENHANCED FLASHCARDS FROM FORMATTED TEXT ---- using new function
    flashcards = generate_flashcards_from_formatted_text(markdown_text)
    
    # ---- ENHANCED MINDMAP FROM FORMATTED TEXT ---- using new function  
    mindmap = generate_mindmap_from_formatted_text(markdown_text, title)
    
    # ---- GENERATE ENHANCED MARKDOWN CONTENT ----
    markdown_content = generate_study_materials_markdown(title, markdown_text, bullets, flashcards, mindmap)
    
    return jsonify({
        "bullets": bullets,
        "flashcards": flashcards,
        "mindmap": mindmap,
        "markdown_content": markdown_content,
        "formatted_text": markdown_text
    })
def convert_text_to_markdown(text):
    """Enhanced text to markdown conversion using AI"""
    if not text:
        return ""
    
    model = genai.GenerativeModel("gemini-1.5-pro")  # Using stable model
    prompt = f"""Convert this study note text into clean, well-structured markdown format. Follow these rules:

1. Use appropriate heading levels (##, ###, ####)
2. Format lists with proper bullet points (-)
3. Bold important terms and concepts
4. Use code blocks for formulas, equations, or technical terms
5. Create tables for structured data if applicable
6. Use blockquotes for definitions or important quotes
7. Maintain logical hierarchy and flow
8. Add proper spacing between sections

Text to convert:
---
{text}
---

Return ONLY the markdown-formatted text, no explanations."""
    
    try:
        response = model.generate_content(prompt)
        markdown_text = response.text if response and response.text else text
        return clean_markdown_formatting(markdown_text)
    except Exception as e:
        # Fallback to basic markdown conversion
        return basic_text_to_markdown(text)

def basic_text_to_markdown(text):
    """Fallback basic markdown conversion"""
    lines = text.split('\n')
    markdown_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            markdown_lines.append('')
            continue
            
        # Detect and format different types of content
        if is_heading(line):
            markdown_lines.append(format_as_heading(line))
        elif is_bullet_point(line):
            markdown_lines.append(format_as_bullet(line))
        elif is_numbered_item(line):
            markdown_lines.append(format_as_numbered_item(line))
        elif is_definition(line):
            markdown_lines.append(format_as_definition(line))
        elif is_formula_or_equation(line):
            markdown_lines.append(format_as_code_block(line))
        else:
            # Regular paragraph
            markdown_lines.append(line)
    
    return clean_markdown_formatting('\n'.join(markdown_lines))

def extract_enhanced_key_points(text):
    """Extract key points using enhanced AI prompt"""
    model = genai.GenerativeModel("gemini-1.5-pro")  # Using stable model
    prompt = f"""Analyze the following study material and extract 5-8 key points that capture the most important concepts, facts, or insights.

Guidelines:
- Focus on main ideas, not minor details
- Include important definitions, formulas, or principles
- Make each point concise but complete (1-2 sentences max)
- Prioritize concepts that would likely appear on an exam
- Include quantitative data or specific facts when relevant

Study Material:
---
{text}
---

Return ONLY a JSON array of strings, each representing a key point:
["Key point 1", "Key point 2", ...]"""
    
    try:
        response = model.generate_content(prompt)
        key_points = json.loads(response.text)
        # Format as bullet points
        return [f"• {point}" for point in key_points[:8]]  # Limit to 8 points
    except Exception:
        # Fallback extraction
        lines = [line.strip() for line in text.split('\n') if line.strip() and len(line.split()) >= 3]
        return [f"• {line}" for line in lines[:6]]

def generate_enhanced_flashcards(text):
    """Generate flashcards with enhanced AI prompt"""
    model = genai.GenerativeModel("gemini-1.5-pro")
    prompt = f"""Create 5-8 high-quality flashcards based EXCLUSIVELY on the provided study material. Each flashcard must test specific information, concepts, or details found in the text.

FLASHCARD CREATION RULES:
1. ONLY use information directly stated in the study material
2. Create questions that test different types of knowledge:
   - Factual recall: "What is...", "Who...", "When...", "Where..."
   - Definitions: "Define..." or "What does X mean?"
   - Processes: "What are the steps to...", "How does X work?"
   - Relationships: "How are X and Y related?", "What causes..."
   - Applications: "How is X used...", "Give an example of..."
   - Comparisons: "What's the difference between...", "Compare X and Y"

CONTENT REQUIREMENTS:
- Extract key facts, definitions, processes, examples, and concepts from the text
- Include specific details like numbers, dates, names, formulas mentioned
- Test understanding of important relationships or cause-effect mentioned
- Cover different sections/topics if the material has multiple areas
- Make questions specific enough to have clear, definitive answers
- Ensure answers can be found directly in the provided material

QUESTION QUALITY:
- Questions should be clear and unambiguous  
- Avoid vague questions that could have multiple interpretations
- Include specific context when needed for clarity
- Test meaningful understanding, not trivial details
- Vary question difficulty from basic recall to concept application

Study Material:
---
{text}
---

Return ONLY a JSON array with this exact format:
[
  {{
    "question": "Specific question based on content (What is X? How does Y work? When did Z happen?)",
    "answer": "Complete answer found in the study material"
  }},
  {{
    "question": "Another specific question from the material",
    "answer": "Detailed answer directly from the text"
  }}
]

CRITICAL: Every question and answer must be based on information explicitly stated in the study material above. Do not add external knowledge or make assumptions."""
    
    try:
        response = model.generate_content(prompt)
        flashcards = json.loads(response.text)
        return flashcards[:6]  # Limit to 6 cards
    except Exception:
        # Fallback flashcards
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        return [
            {"question": "What is the main topic of these notes?", "answer": lines[0] if lines else "Study material"},
            {"question": "What are the key concepts mentioned?", "answer": ". ".join(lines[:3]) if len(lines) >= 3 else "Key study concepts"}
        ]

def generate_enhanced_mindmap(text, title):
    """Generate mindmap with enhanced AI prompt"""
    model = genai.GenerativeModel("gemini-1.5-pro")
    prompt = f"""Analyze the study material and create a comprehensive hierarchical mind map that captures ALL key information from the content.

ANALYSIS INSTRUCTIONS:
1. Identify the main subject/topic from the content
2. Find 4-8 major themes, categories, or sections within the material
3. For each theme, extract 3-7 specific details, facts, examples, or sub-concepts
4. Group related information logically
5. Include important definitions, formulas, processes, examples, and key facts
6. Maintain the original context and meaning from the source material

CONTENT REQUIREMENTS:
- Central topic: The main subject covered in the study material
- Main branches: Major themes, chapters, or concept areas found in the text
- Sub-branches: Specific details, examples, definitions, steps, or facts from each main area
- Include numerical data, dates, names, formulas, or specific examples when present
- Capture both theoretical concepts and practical applications mentioned
- Preserve important relationships and connections between ideas

Study Material to Analyze:
---
{text}
---

Return ONLY a JSON object with this exact format:
{{
  "central_topic": "Main subject from the study material",
  "branches": [
    {{
      "name": "Major theme/category from content",
      "sub_branches": [
        "Specific detail/fact from text",
        "Another detail/example from content", 
        "Definition or process from material",
        "Numerical data or formula if present"
      ]
    }},
    {{
      "name": "Second major theme from content",
      "sub_branches": [
        "Related detail from text",
        "Example or case study mentioned",
        "Important point or principle"
      ]
    }}
  ]
}}

IMPORTANT: Extract information DIRECTLY from the provided study material. Do not add external knowledge."""
    
    try:
        response = model.generate_content(prompt)
        mindmap = json.loads(response.text)
        return mindmap
    except Exception:
        # Fallback mindmap
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        return {
            "central_topic": title,
            "branches": [
                {
                    "name": "Key Concepts",
                    "sub_branches": lines[:5] if len(lines) >= 5 else lines
                }
            ]
        }

def clean_markdown_formatting(text):
    """Clean and improve markdown formatting"""
    # Remove excessive blank lines
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    
    # Ensure proper spacing around headings
    text = re.sub(r'\n(#{1,6}\s+[^\n]+)\n', r'\n\n\1\n\n', text)
    
    # Fix bullet point spacing
    text = re.sub(r'\n(-\s+[^\n]+)\n(-\s+)', r'\n\1\n\2', text)
    
    # Remove trailing spaces
    text = re.sub(r' +\n', '\n', text)
    
    return text.strip()

# Helper functions for basic markdown conversion
def is_heading(line):
    """Detect if a line should be formatted as a heading"""
    heading_indicators = [
        'chapter', 'section', 'part', 'unit', 'lesson',
        'introduction', 'conclusion', 'summary', 'overview',
        'definition', 'theorem', 'principle', 'concept'
    ]
    
    line_lower = line.lower()
    
    # Short lines that might be titles
    if len(line.split()) <= 5 and any(indicator in line_lower for indicator in heading_indicators):
        return True
    
    # Lines that are all caps (likely headings)
    if line.isupper() and len(line.split()) <= 6:
        return True
    
    # Lines ending with colons (might be section headers)
    if line.endswith(':') and len(line.split()) <= 6:
        return True
    
    return False

def format_as_heading(line):
    """Format line as markdown heading"""
    line = line.rstrip(':')  # Remove trailing colon if present
    
    # Determine heading level based on content
    if any(word in line.lower() for word in ['chapter', 'unit', 'part']):
        return f"## {line}"
    else:
        return f"### {line}"

def is_bullet_point(line):
    """Detect if line is a bullet point"""
    bullet_markers = ['•', '◦', '▪', '▫', '‣', '-', '*']
    return any(line.startswith(marker) for marker in bullet_markers)

def format_as_bullet(line):
    """Format as proper markdown bullet"""
    for marker in ['•', '◦', '▪', '▫', '‣', '-', '*']:
        if line.startswith(marker):
            line = line[1:].strip()
            break
    return f"- {line}"

def is_numbered_item(line):
    """Detect numbered list items"""
    return bool(re.match(r'^\d+\.?\s+', line))

def format_as_numbered_item(line):
    """Format numbered items properly"""
    match = re.match(r'^(\d+)\.?\s+(.*)', line)
    if match:
        number, content = match.groups()
        return f"{number}. {content}"
    return line

def is_definition(line):
    """Detect definition patterns"""
    definition_patterns = [
        ' is ', ' are ', ' means ', ' refers to ', ' defined as ',
        ':', ' = ', ' equals ', ' represents '
    ]
    return any(pattern in line.lower() for pattern in definition_patterns)

def format_as_definition(line):
    """Format definitions with emphasis"""
    separators = [' is ', ' are ', ' means ', ' refers to ', ' defined as ', ': ']
    
    for sep in separators:
        if sep in line.lower():
            parts = line.split(sep, 1)
            if len(parts) == 2:
                term = parts[0].strip()
                definition = parts[1].strip()
                return f"**{term}**{sep}{definition}"
    
    return line

def is_formula_or_equation(line):
    """Detect mathematical formulas or equations"""
    math_indicators = ['=', '+', '-', '×', '÷', '∑', '∫', '√', '^', '²', '³']
    return any(indicator in line for indicator in math_indicators) and len([c for c in line if c.isalpha()]) < len([c for c in line if c.isdigit() or c in math_indicators])

def format_as_code_block(line):
    """Format as inline code or code block"""
    return f"`{line}`"

def generate_study_materials_markdown(title, original_text, bullets, flashcards, mindmap):
    """Generate enhanced, well-formatted markdown content for study materials"""
    from datetime import datetime
    
    current_date = datetime.now().strftime("%B %d, %Y")
    
    markdown = f"""# 📚 {title}

> **Generated:** {current_date} | **Source:** Handwritten Notes (OCR + AI Enhanced)

---

## 📝 Formatted Notes

{original_text}

---

## 🔍 Key Points Summary

"""
    
    # Add bullet points with better formatting
    for bullet in bullets:
        markdown += f"{bullet}\n"
    
    markdown += f"""
---

## 🎯 Flashcards for Active Recall

> **Study Tip:** Cover the answer and test yourself. Use spaced repetition for best results!

"""
    
    # Generate flashcards with enhanced formatting
    for i, card in enumerate(flashcards, 1):
        markdown += f"""### 📋 Card {i}

**Q:** {card['question']}

<details>
<summary><strong>🔍 Show Answer</strong></summary>

**A:** {card['answer']}

</details>

"""
    
    markdown += """---

## 🧠 Mind Map Structure

"""
    
    # Add mind map with better visualization
    markdown += generate_mindmap_markdown_display(mindmap)
    
    markdown += """

---

## 📊 Study Strategy & Progress Tracking

### 🎯 Recommended Study Approach

1. **📖 Initial Review** (10 min)
   - Read through formatted notes
   - Identify unfamiliar concepts

2. **🎯 Active Practice** (15 min)
   - Go through all flashcards
   - Focus on difficult ones

3. **🧩 Connection Building** (10 min)
   - Review mind map structure
   - Create your own connections

4. **✅ Self-Assessment** (5 min)
   - Test recall without notes
   - Identify knowledge gaps

### 📅 Spaced Repetition Schedule

| Session | Focus | Duration |
|---------|--------|----------|
| **Day 1** | Complete review of all materials | 30 min |
| **Day 3** | Flashcards + difficult concepts | 20 min |
| **Day 7** | Full review + create new questions | 25 min |
| **Day 14** | Final review + teach others | 20 min |

### 🎲 Quick Self-Test Questions

Try these without looking at your notes:

1. **🔍 Recall:** List the main topics from memory
2. **🔗 Connect:** How do the key concepts relate?
3. **💡 Apply:** Give real-world examples for each concept
4. **🎯 Predict:** What questions might appear on an exam?

---

## 📈 Learning Effectiveness Tips

### 🧠 Cognitive Techniques
- **Elaborative Interrogation:** Ask "why" and "how" questions
- **Self-Explanation:** Explain concepts in your own words
- **Interleaving:** Mix different topics during study sessions
- **Retrieval Practice:** Close notes and recall information

### 👥 Social Learning
- **Teaching Others:** Explain concepts to classmates
- **Study Groups:** Discuss and debate key points
- **Peer Testing:** Quiz each other using flashcards

### 🔄 Review Indicators
**✅ Mastered:** Can explain without hesitation
**⚠️ Needs Review:** Hesitant or incomplete answers
**❌ Needs Focus:** Cannot recall or explain

---

## 📚 Additional Study Resources

### 🎨 Create Your Own Materials
- Draw concept maps connecting ideas
- Make acronyms for lists or sequences
- Create visual diagrams for complex processes
- Record yourself explaining key concepts

### 🔍 Deepen Understanding
- Look up related examples online
- Find video explanations for visual learning
- Seek practice problems in textbooks
- Connect to current events or personal experiences

---

*✨ AI-Enhanced Study Materials - Optimized for Learning Success! ✨*
"""
    
    return markdown

def generate_mindmap_markdown_display(mindmap):
    """Generate an enhanced markdown representation of the mind map"""
    if not mindmap:
        return "No mind map data available."
    
    central_topic = mindmap.get('central_topic', 'Main Topic')
    branches = mindmap.get('branches', [])
    
    markdown = f"""```
🎯 {central_topic}
{'═' * (len(central_topic) + 4)}
"""
    
    for i, branch in enumerate(branches):
        is_last = i == len(branches) - 1
        
        branch_name = branch.get('name', 'Branch')
        markdown += f"\n{'└──' if is_last else '├──'} 📌 {branch_name}\n"
        
        # Add sub-branches if they exist
        sub_branches = branch.get('sub_branches', [])
        for j, sub_branch in enumerate(sub_branches):
            is_last_sub = j == len(sub_branches) - 1
            
            if is_last:
                prefix = f"    {'└──' if is_last_sub else '├──'}"
            else:
                prefix = f"│   {'└──' if is_last_sub else '├──'}"
                
            markdown += f"{prefix} • {sub_branch}\n"
        
        if not is_last:
            markdown += "│\n"
    
    markdown += "```\n"
    return markdown

# ------------------ Enhanced Quiz Generation ------------------
@app.route("/api/generate-quiz", methods=["POST"])
def generate_quiz():
    data = request.get_json()
    
    if not data or "context" not in data:
        return jsonify({"error": "Context is required"}), 400
    
    context = data["context"]
    quiz_type = data.get("quiz_type", "mixed")
    num_questions = data.get("num_questions", 5)
    
    if not context.strip():
        return jsonify({"error": "No study material available. Please upload and process a file first."}), 400
    
    model = genai.GenerativeModel("gemini-1.5-pro")  # Using stable model
    
    enhanced_quiz_prompt = f"""Create {num_questions} high-quality {quiz_type} questions based EXCLUSIVELY on the provided study material. Every question must test specific information found in the text.

QUIZ CREATION REQUIREMENTS:
1. CONTENT-BASED: All questions must be answerable using only the study material
2. SPECIFIC: Test particular facts, definitions, processes, relationships mentioned in the text
3. VARIED DIFFICULTY: Include easy (direct facts), medium (relationships/processes), hard (application/analysis) questions
4. COMPREHENSIVE: Cover different sections/topics if the material has multiple areas
5. PRECISE: Questions should have clear, unambiguous answers based on the content

QUESTION DESIGN PRINCIPLES:
- Easy: Direct recall of facts stated in the material
- Medium: Understanding of processes, relationships, or cause-effect mentioned
- Hard: Application of concepts or analysis of information provided

AVOID:
- General knowledge questions not related to the specific material
- Questions that require external information not in the study text  
- Ambiguous questions with multiple possible interpretations
- Trivial details that don't test meaningful understanding

Study Material:
---
{context}
---

IMPORTANT: Base every question on specific information, concepts, facts, or relationships explicitly mentioned in the study material above.

{get_quiz_format_instructions(quiz_type)}

Return ONLY a valid JSON array, no other text."""
    
    try:
        response = model.generate_content(enhanced_quiz_prompt)
        questions = json.loads(response.text)
        
        # Validate and limit questions
        cleaned_questions = []
        for q in questions[:num_questions]:
            if validate_question_format(q, quiz_type):
                cleaned_questions.append(q)
        
        return jsonify({"questions": cleaned_questions})
    except Exception as e:
        # Enhanced fallback questions
        fallback_questions = generate_fallback_quiz(context, quiz_type, num_questions)
        return jsonify({"questions": fallback_questions})

def get_quiz_format_instructions(quiz_type):
    """Get specific format instructions for different quiz types"""
    if quiz_type == "mcq":
        return """Format for MCQ - Each question must be based on specific content from the study material:

EXAMPLE GOOD QUESTIONS:
- "What is the purpose of adding a parity bit in parity check?"
- "In the given checksum example, what are the two 8-bit words being sent?"
- "According to the material, what happens at the receiver's end during parity check?"
- "What is the result when segments are added using 1's complement arithmetic in checksum?"

[{{
  "type": "mcq",
  "difficulty": "easy|medium|hard",
  "question": "Specific question about information in the material (What is X? How does Y work? What happens when Z?)",
  "options": [
    "A) Correct answer from the study material",
    "B) Plausible but incorrect option (not mentioned or contradicted)",
    "C) Another plausible but wrong option", 
    "D) Third plausible but incorrect option"
  ],
  "correct_answer": "A",
  "explanation": "A is correct because the study material states [specific quote or paraphrase]. B, C, D are incorrect because [brief reason]."
}}]

IMPORTANT: 
- Correct answer MUST be information directly from the study material
- Distractors should be plausible but clearly wrong based on what's in the text
- Question should test specific content, not general knowledge
- Use technical terms, numbers, and examples from the material"""
    elif quiz_type == "true_false":
        return """Format for True/False - Each statement must relate to specific content:

EXAMPLE GOOD STATEMENTS:
- "Parity check involves adding an extra bit called a parity bit to make the total number of 1s even or odd."
- "In the checksum example, the sum of the two 8-bit words is 11100010."
- "The receiver detects an error if the parity doesn't match the expected value."
- "Checksum uses 2's complement arithmetic to add segments together."

[{{
  "type": "true_false", 
  "difficulty": "easy|medium|hard",
  "question": "Direct statement about content from the material (The material states that X causes Y. According to the notes, the process involves Z steps.)",
  "correct_answer": "True|False",
  "explanation": "This is True/False because the study material explicitly states/contradicts [specific reference to content]."
}}]

IMPORTANT:
- Statement should be verifiable directly from the study material
- Include specific technical details, numbers, or processes mentioned
- Test understanding of key facts, relationships, or procedures
- Reference specific examples or calculations shown in the material"""
    else:  # mixed
        return """Format for Mixed Quiz (Use both MCQ and True/False formats above):
- 60% MCQ testing specific facts, definitions, processes from the material
- 40% True/False testing key statements and relationships from the content
- All questions must be answerable using only the provided study material
- Include variety in difficulty and content areas covered
- Use specific technical terms, examples, and data from the material"""

def validate_question_format(question, quiz_type):
    """Validate question format"""
    required_fields = ['question', 'correct_answer', 'explanation']
    
    if quiz_type == "mcq" or (quiz_type == "mixed" and question.get('type') == 'mcq'):
        required_fields.append('options')
    
    return all(field in question for field in required_fields)

def generate_fallback_quiz(context, quiz_type, num_questions):
    """Generate fallback quiz questions based on content"""
    # Extract meaningful sentences from the content
    sentences = [s.strip() for s in context.replace('\n', '. ').split('.') if s.strip() and len(s.split()) > 5]
    lines = [line.strip() for line in context.split('\n') if line.strip() and len(line.split()) > 3]
    
    questions = []
    content_items = sentences[:num_questions] if sentences else lines[:num_questions]
    
    for i, content_item in enumerate(content_items):
        if quiz_type == "true_false":
            questions.append({
                "type": "true_false",
                "difficulty": "easy",
                "question": f"According to the study material: {content_item}",
                "correct_answer": "True",
                "explanation": f"This statement is directly mentioned in the study material."
            })
        else:  # mcq or mixed
            # Try to extract a key term or concept from the content
            words = content_item.split()
            if len(words) > 10:
                # Create a question about the content
                question_part = ' '.join(words[:8]) + "..."
                correct_answer = content_item
                
                questions.append({
                    "type": "mcq",
                    "difficulty": "easy", 
                    "question": f"Complete this statement from the study material: {question_part}",
                    "options": [
                        f"A) {correct_answer}",
                        "B) This information is not covered in the material",
                        "C) The material provides contradictory information", 
                        "D) The study material is unclear on this point"
                    ],
                    "correct_answer": "A",
                    "explanation": f"Option A correctly completes the statement as found in the study material."
                })
            else:
                questions.append({
                    "type": "true_false",
                    "difficulty": "easy",
                    "question": f"The study material mentions: {content_item}",
                    "correct_answer": "True",
                    "explanation": "This information is directly stated in the study material."
                })
    
    return questions[:num_questions]

# ------------------ Rest of the existing endpoints remain the same ------------------

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
        is_correct = user_answer == correct_answer
    elif question_type == "true_false":
        user_normalized = user_answer.replace(".", "")
        correct_normalized = correct_answer.replace(".", "")
        
        if user_normalized in ["T", "TRUE"] and correct_normalized in ["T", "TRUE"]:
            is_correct = True
        elif user_normalized in ["F", "FALSE"] and correct_normalized in ["F", "FALSE"]:
            is_correct = True
    
    return jsonify({
        "is_correct": is_correct,
        "user_answer": user_answer,
        "correct_answer": correct_answer
    })

@app.route("/api/chat", methods=["POST"])
def ai_tutor_chat():
    data = request.get_json()
    
    if not data or "question" not in data or "context" not in data:
        return jsonify({"error": "Question and context are required"}), 400
    
    question = data["question"]
    context = data["context"]
    
    if not context.strip():
        return jsonify({"error": "No study material available. Please upload and process an image first."}), 400
    
    model = genai.GenerativeModel("gemini-1.5-pro")  # Using stable model
    
    enhanced_tutor_prompt = f"""You are an expert AI tutor. Your role is to help the student understand their study material by answering questions clearly and educationally.

Guidelines:
- Use ONLY the provided study material to answer
- Explain concepts clearly with examples when possible
- If information isn't in the material, state this clearly
- Ask follow-up questions to check understanding
- Provide study tips when relevant
- Be encouraging and supportive

Study Material:
---
{context}
---

Student's Question: {question}

Provide a helpful, educational response based solely on the study material."""
    
    try:
        response = model.generate_content(enhanced_tutor_prompt)
        answer = response.text if response and response.text else "I'm sorry, I couldn't generate a response. Please try again."
        
        return jsonify({"answer": answer.strip()})
    except Exception as e:
        return jsonify({"error": f"Failed to get tutor response: {str(e)}"}), 500


def generate_flashcards_from_formatted_text(formatted_text):
    """Generate flashcards from formatted markdown text using structure and content"""
    model = genai.GenerativeModel("gemini-1.5-pro")
    prompt = f"""You are given formatted markdown text from study notes. Create 6-8 high-quality flashcards based on the content, structure, and information presented in this formatted text.

FLASHCARD CREATION RULES:
1. Use the formatted text's structure (headings, bullet points, definitions) to identify key concepts
2. Extract important information from each section under different headings
3. Create questions that test different types of knowledge:
   - Definitions: "What is...", "Define..."
   - Facts: "What are the...", "How many...", "When does..."
   - Processes: "What are the steps to...", "How does X work?"
   - Relationships: "How are X and Y related?", "What causes..."
   - Applications: "How is X used...", "Give an example of..."
   - Comparisons: "What's the difference between..."

CONTENT REQUIREMENTS:
- Extract information from under each heading/section
- Include specific details, numbers, formulas, or examples mentioned
- Test understanding of key concepts highlighted in bold or emphasis
- Cover different sections/topics based on the heading structure
- Ensure answers can be found directly in the formatted text

QUESTION QUALITY:
- Make questions specific and clear
- Use the same terminology as used in the formatted text
- Include context from the headings when needed
- Test meaningful understanding, not trivial details
- Vary difficulty levels appropriately

Formatted Text:
---
{formatted_text}
---

Return ONLY a JSON array with this exact format:
[
  {{
    "question": "Clear question based on content under specific headings (What is X mentioned in section Y?)",
    "answer": "Complete answer from the formatted text with specific details"
  }},
  {{
    "question": "Another question from different section/heading",
    "answer": "Detailed answer directly from the formatted text"
  }}
]

CRITICAL: Base every flashcard on information explicitly found in the formatted text above. Use the heading structure to organize and categorize your questions."""
    
    try:
        response = model.generate_content(prompt)
        flashcards = json.loads(response.text)
        return flashcards[:8]  # Limit to 8 cards
    except Exception:
        # Fallback flashcards based on formatted text structure
        return generate_fallback_flashcards_from_formatted(formatted_text)

def generate_mindmap_from_formatted_text(formatted_text, title):
    """Generate mindmap from formatted text using headings as main structure"""
    model = genai.GenerativeModel("gemini-1.5-pro")
    prompt = f"""You are given formatted markdown text with headings and structured content. Create a comprehensive hierarchical mind map that uses the HEADINGS as the main organizational structure.

MINDMAP CREATION INSTRUCTIONS:
1. CENTRAL TOPIC: Use the main subject/title as the center
2. MAIN BRANCHES: Use the major headings (##, ###) from the formatted text as primary branches
3. SUB-BRANCHES: Extract key points, definitions, examples, and details from under each heading
4. STRUCTURE: Follow the heading hierarchy - higher level headings become main branches, lower level headings and content become sub-branches

ANALYSIS APPROACH:
- Identify all headings (##, ###, ####) in the formatted text
- Group content under each heading
- Extract 3-6 key points/details from each headed section
- Include important terms in bold, bullet points, numbered lists
- Preserve the logical flow and organization of the formatted text

CONTENT EXTRACTION:
- Main headings → Primary branches
- Sub-headings → Secondary branches
- Bullet points → Sub-branch items
- Bold terms → Important concepts to include
- Definitions and examples → Specific sub-branch details
- Numbers, formulas, processes → Technical details to preserve

Formatted Text to Analyze:
---
{formatted_text}
---

Return ONLY a JSON object with this exact format:
{{
  "central_topic": "{title}",
  "branches": [
    {{
      "name": "Main Heading from formatted text (e.g., Introduction, Key Concepts, etc.)",
      "sub_branches": [
        "Key point from under this heading",
        "Important detail or definition from this section",
        "Example or process mentioned under this heading",
        "Specific fact or formula from this section"
      ]
    }},
    {{
      "name": "Second main heading from formatted text",
      "sub_branches": [
        "Related detail from this section",
        "Process or example from under this heading",
        "Important concept or definition from this part"
      ]
    }}
  ]
}}

IMPORTANT: 
- Use the actual headings from the formatted text as branch names
- Extract specific content from under each heading
- Maintain the hierarchical structure of the formatted text
- Include important details, not just heading titles"""
    
    try:
        response = model.generate_content(prompt)
        mindmap = json.loads(response.text)
        return mindmap
    except Exception:
        # Fallback mindmap based on formatted text structure
        return generate_fallback_mindmap_from_formatted(formatted_text, title)

def generate_fallback_flashcards_from_formatted(formatted_text):
    """Generate fallback flashcards by parsing formatted text structure"""
    import re
    
    flashcards = []
    lines = formatted_text.split('\n')
    
    # Extract headings and their content
    current_heading = None
    heading_content = {}
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if it's a heading
        if line.startswith('#'):
            current_heading = line.lstrip('#').strip()
            heading_content[current_heading] = []
        elif current_heading and line:
            heading_content[current_heading].append(line)
    
    # Generate flashcards from headings and content
    for heading, content in heading_content.items():
        if len(content) > 0:
            # Create a definition-style question
            first_content = content[0] if content else "Key concept"
            flashcards.append({
                "question": f"What is covered under '{heading}'?",
                "answer": f"Under {heading}: {first_content}"
            })
            
            # Create content-specific questions
            for item in content[:2]:  # Limit to first 2 items per heading
                if len(item.split()) > 5:  # Only use substantial content
                    # Remove markdown formatting for cleaner questions
                    clean_item = re.sub(r'[*_`]', '', item)
                    clean_item = re.sub(r'^[-•]\s*', '', clean_item)  # Remove bullet points
                    
                    if ':' in clean_item:
                        # Split definition-style content
                        parts = clean_item.split(':', 1)
                        if len(parts) == 2:
                            term = parts[0].strip()
                            definition = parts[1].strip()
                            flashcards.append({
                                "question": f"Define: {term}",
                                "answer": definition
                            })
    
    return flashcards[:8]  # Limit to 8 flashcards

def generate_fallback_mindmap_from_formatted(formatted_text, title):
    """Generate fallback mindmap by parsing headings and content"""
    import re
    
    lines = formatted_text.split('\n')
    branches = []
    
    current_branch = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check for main headings (## or ###)
        if re.match(r'^#{2,3}\s+', line):
            if current_branch:  # Save previous branch
                branches.append(current_branch)
            
            heading_text = re.sub(r'^#+\s+', '', line)
            current_branch = {
                "name": heading_text,
                "sub_branches": []
            }
        elif current_branch and line:
            # Add content under current heading
            # Clean up markdown formatting
            clean_line = re.sub(r'[*_`]', '', line)
            clean_line = re.sub(r'^[-•]\s*', '', clean_line)  # Remove bullet points
            clean_line = re.sub(r'^\d+\.\s*', '', clean_line)  # Remove numbers
            
            if len(clean_line.split()) > 2:  # Only substantial content
                current_branch["sub_branches"].append(clean_line)
    
    # Add the last branch
    if current_branch:
        branches.append(current_branch)
    
    # If no headings found, create a simple structure
    if not branches:
        content_lines = [line.strip() for line in lines if line.strip() and not line.strip().startswith('#')]
        branches.append({
            "name": "Key Points",
            "sub_branches": content_lines[:6]  # First 6 lines
        })
    
    return {
        "central_topic": title,
        "branches": branches[:6]  # Limit to 6 main branches
    }


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
    
    # Enhanced processing using the new functions
    text_content = '\n'.join(content)
    bullets = extract_enhanced_key_points(text_content)
    flashcards = generate_enhanced_flashcards(text_content)
    mindmap = generate_enhanced_mindmap(text_content, title)
    
    return jsonify({
        "bullets": bullets,
        "flashcards": flashcards,
        "mindmap": mindmap
    })

# ------------------ Static File Serving ------------------
@app.route("/")
def home():
    return send_from_directory(".", "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(".", path)

if __name__ == "__main__":
    app.run(debug=True, port=5000)