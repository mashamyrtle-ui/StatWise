import asyncio
import json
import logging
from typing import List, Optional
from app.config import settings

logger = logging.getLogger(__name__)

# Try to import Gemini
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-generativeai not installed; using mock AI responses")


_current_key: Optional[str] = None
_gemini_model = None


def _init_gemini():
    global _current_key, _gemini_model
    if not GEMINI_AVAILABLE:
        return None
    api_key = settings.get_api_key()
    if not api_key:
        return None
    try:
        genai.configure(api_key=api_key)
        model_name = settings.LLM_MODEL or "gemini-1.5-flash"
        model = genai.GenerativeModel(model_name)
        _current_key = api_key
        logger.info(f"Initialized Gemini model {model_name} with API key")
        return model
    except Exception as e:
        logger.warning(f"Gemini init failed: {e}")
        return None


def get_gemini_model():
    global _gemini_model, _current_key
    current_configured_key = settings.get_api_key()
    if current_configured_key != _current_key or _gemini_model is None:
        _gemini_model = _init_gemini()
    return _gemini_model


def _call_gemini_sync(model, prompt: str, max_tokens: int) -> str:
    try:
        response = model.generate_content(
            prompt,
            generation_config={"max_output_tokens": max_tokens, "temperature": 0.3}
        )
        if response and hasattr(response, "text") and response.text:
            return response.text
        if response and hasattr(response, "candidates") and response.candidates:
            parts = response.candidates[0].content.parts
            return "".join([p.text for p in parts if hasattr(p, "text")])
        return ""
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}")
        return ""


async def generate_text(prompt: str, max_tokens: int = 2048) -> str:
    """Generate text using Gemini asynchronously or return empty string on failure."""
    model = get_gemini_model()
    if model is None:
        return ""
    try:
        return await asyncio.to_thread(_call_gemini_sync, model, prompt, max_tokens)
    except Exception as e:
        logger.error(f"Gemini async execution error: {e}")
        return ""


# ─────────────────────────────────────────────────────────────────────────────
# MCQ GENERATION
# ─────────────────────────────────────────────────────────────────────────────

MOCK_SAMPLING_QUESTIONS = [
    {
        "question_text": "Which sampling technique divides the population into homogeneous subgroups before sampling?",
        "option_a": "Cluster Sampling",
        "option_b": "Stratified Sampling",
        "option_c": "Systematic Sampling",
        "option_d": "Convenience Sampling",
        "correct_answer": "B",
        "explanation": "Stratified sampling divides the population into mutually exclusive, homogeneous subgroups called strata (e.g., age groups, income levels) and then draws samples from each stratum. This ensures representation of all subgroups.",
        "difficulty": "Medium",
        "competency_name": "Sampling",
        "source_reference": "Uploaded Material — Page 3"
    },
    {
        "question_text": "What is the primary advantage of Simple Random Sampling (SRS)?",
        "option_a": "It guarantees proportional representation of all subgroups",
        "option_b": "Every unit in the population has an equal probability of selection",
        "option_c": "It requires prior knowledge of the population structure",
        "option_d": "It is the most cost-effective method for large surveys",
        "correct_answer": "B",
        "explanation": "In Simple Random Sampling, every individual element in the population has an equal and independent chance of being selected. This property makes SRS the gold standard for eliminating selection bias.",
        "difficulty": "Easy",
        "competency_name": "Sampling",
        "source_reference": "Uploaded Material — Page 1"
    },
    {
        "question_text": "In cluster sampling, which of the following best describes the primary sampling unit?",
        "option_a": "Individual respondent",
        "option_b": "Stratum",
        "option_c": "Cluster or group",
        "option_d": "Systematic interval",
        "correct_answer": "C",
        "explanation": "In cluster sampling, the population is divided into clusters (e.g., villages, districts, schools) and entire clusters are selected as sampling units. This reduces travel costs in geographically dispersed surveys.",
        "difficulty": "Medium",
        "competency_name": "Sampling",
        "source_reference": "Uploaded Material — Page 5"
    },
    {
        "question_text": "The sampling frame is best defined as:",
        "option_a": "The formula used to calculate the sample size",
        "option_b": "A list or map of all population units from which the sample is drawn",
        "option_c": "The geographic boundary of the survey area",
        "option_d": "The questionnaire used to collect data",
        "correct_answer": "B",
        "explanation": "A sampling frame is an exhaustive list of all units in the target population (e.g., voter rolls, household lists) from which the sample is actually selected. Frame errors occur when this list is incomplete or outdated.",
        "difficulty": "Easy",
        "competency_name": "Sampling",
        "source_reference": "Uploaded Material — Page 2"
    },
    {
        "question_text": "In systematic sampling with interval k, if the first unit selected is the 4th element, which unit is selected next?",
        "option_a": "4 + k",
        "option_b": "4 × k",
        "option_c": "k − 4",
        "option_d": "Random unit after 4th",
        "correct_answer": "A",
        "explanation": "In systematic sampling, after selecting the first unit randomly within the first interval [1, k], every subsequent unit is selected by adding k to the previous selection. So if the first unit is the 4th and k=10, the next is the 14th, then 24th, etc.",
        "difficulty": "Hard",
        "competency_name": "Sampling",
        "source_reference": "Uploaded Material — Page 4"
    },
    {
        "question_text": "Which of the following is a non-probability sampling method?",
        "option_a": "Stratified Random Sampling",
        "option_b": "Cluster Sampling",
        "option_c": "Purposive (Judgement) Sampling",
        "option_d": "Systematic Sampling",
        "correct_answer": "C",
        "explanation": "Purposive sampling is a non-probability method where the researcher deliberately selects units based on their judgment about which units are most relevant. It does not give every unit a known probability of selection.",
        "difficulty": "Medium",
        "competency_name": "Sampling",
        "source_reference": "Uploaded Material — Page 8"
    },
    {
        "question_text": "Sampling error is defined as:",
        "option_a": "Errors due to poor questionnaire design",
        "option_b": "The difference between the sample estimate and the true population value",
        "option_c": "Errors arising from data entry mistakes",
        "option_d": "Bias introduced by the interviewer",
        "correct_answer": "B",
        "explanation": "Sampling error is the difference between a statistic computed from a sample (e.g., sample mean) and the true population parameter. It arises because only a subset of the population is measured. It decreases as sample size increases.",
        "difficulty": "Easy",
        "competency_name": "Sampling",
        "source_reference": "Uploaded Material — Page 6"
    },
    {
        "question_text": "The design effect (DEFF) in complex surveys is used to:",
        "option_a": "Measure the bias in the sample",
        "option_b": "Compare the efficiency of a complex sample design to SRS",
        "option_c": "Determine the response rate",
        "option_d": "Estimate non-sampling errors",
        "correct_answer": "B",
        "explanation": "Design Effect (DEFF) is the ratio of the variance under the complex sampling design to the variance that would have been obtained under SRS of the same size. A DEFF > 1 means the complex design is less efficient than SRS.",
        "difficulty": "Hard",
        "competency_name": "Sampling",
        "source_reference": "Uploaded Material — Page 11"
    },
    {
        "question_text": "Probability Proportional to Size (PPS) sampling is most useful when:",
        "option_a": "All units in the population are of equal size",
        "option_b": "Units vary greatly in size and the variable of interest is correlated with size",
        "option_c": "A complete sampling frame is unavailable",
        "option_d": "Only non-probability sampling is feasible",
        "correct_answer": "B",
        "explanation": "PPS sampling gives larger units a higher probability of selection proportional to their size. This is particularly effective when the study variable (e.g., number of workers in a factory) is correlated with the size measure (e.g., number of employees reported in a register).",
        "difficulty": "Hard",
        "competency_name": "Sampling",
        "source_reference": "Uploaded Material — Page 9"
    },
    {
        "question_text": "What does a 95% confidence interval mean in the context of survey estimation?",
        "option_a": "95% of the sampled respondents gave correct answers",
        "option_b": "If the survey is repeated 100 times, about 95 intervals would contain the true parameter",
        "option_c": "The sample represents 95% of the population",
        "option_d": "There is a 95% chance the sample is unbiased",
        "correct_answer": "B",
        "explanation": "A 95% confidence interval means that if we were to draw many repeated samples and compute the interval each time, approximately 95% of those intervals would contain the true population parameter. It is a statement about the long-run reliability of the method.",
        "difficulty": "Hard",
        "competency_name": "Sampling",
        "source_reference": "Uploaded Material — Page 12"
    }
]


MOCK_GENERAL_QUESTIONS = [
    {
        "question_text": "Which Python library is most commonly used for statistical data manipulation and analysis?",
        "option_a": "NumPy",
        "option_b": "Matplotlib",
        "option_c": "Pandas",
        "option_d": "Scipy",
        "correct_answer": "C",
        "explanation": "Pandas is the primary Python library for data manipulation and analysis. It provides DataFrame and Series structures that make working with tabular and time-series data efficient and intuitive.",
        "difficulty": "Easy",
        "competency_name": "Python",
        "source_reference": "Uploaded Material — Page 1"
    },
    {
        "question_text": "In SQL, which clause is used to filter groups based on aggregate functions?",
        "option_a": "WHERE",
        "option_b": "HAVING",
        "option_c": "GROUP BY",
        "option_d": "ORDER BY",
        "correct_answer": "B",
        "explanation": "The HAVING clause filters groups after aggregation (e.g., HAVING COUNT(*) > 5). Unlike WHERE which filters individual rows before grouping, HAVING operates on the results of GROUP BY and aggregate functions.",
        "difficulty": "Medium",
        "competency_name": "SQL",
        "source_reference": "Uploaded Material — Page 3"
    },
]


async def generate_mcqs_from_text(
    text_chunks: List[str],
    question_count: int = 10,
    difficulty: str = "Medium",
    competency_focus: Optional[str] = None,
    source_filename: str = "Uploaded Material"
) -> List[dict]:
    """
    Generate MCQs from document text chunks.
    Uses Gemini if available, otherwise generates content-based questions from the document text.
    """
    model = get_gemini_model()

    if model is not None:
        return await _generate_with_gemini(
            model, text_chunks, question_count, difficulty,
            competency_focus, source_filename
        )
    else:
        logger.info("Gemini not available — generating content-based questions from document text")
        return _generate_content_based_questions(text_chunks, question_count, difficulty, competency_focus, source_filename)


async def _generate_with_gemini(
    model,
    text_chunks: List[str],
    question_count: int,
    difficulty: str,
    competency_focus: Optional[str],
    source_filename: str
) -> List[dict]:
    combined_text = "\n\n".join(text_chunks[:5])[:6000]  # limit tokens
    competency_note = f"The questions should focus on the competency: {competency_focus}." if competency_focus else ""

    prompt = f"""You are an expert assessment designer for government statistical training programmes in India.

Based ONLY on the following learning material, generate exactly {question_count} high-quality multiple-choice questions (MCQs).

RULES:
1. Base every question strictly on facts present in the provided material. Do NOT invent facts.
2. Each question must have exactly 4 options (A, B, C, D) with exactly one correct answer.
3. Write a clear, factual explanation for the correct answer referencing the material.
4. Difficulty should be: {difficulty}
5. {competency_note}
6. Return a valid JSON array only. No other text before or after the JSON.

JSON format for each question:
{{
  "question_text": "...",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "option_d": "...",
  "correct_answer": "A" or "B" or "C" or "D",
  "explanation": "...",
  "difficulty": "{difficulty}",
  "competency_name": "{competency_focus or 'General'}",
  "source_reference": "{source_filename} — relevant page/section"
}}

LEARNING MATERIAL:
{combined_text}

Generate exactly {question_count} questions as a JSON array:"""

    try:
        response_text = await generate_text(prompt, max_tokens=4096)
        if not response_text:
            return _generate_content_based_questions(text_chunks, question_count, difficulty, competency_focus, source_filename)

        # Extract JSON from response
        start = response_text.find("[")
        end = response_text.rfind("]") + 1
        if start == -1 or end == 0:
            return _generate_content_based_questions(text_chunks, question_count, difficulty, competency_focus, source_filename)

        questions = json.loads(response_text[start:end])

        # Validate each question
        validated = []
        for q in questions:
            if all(k in q for k in ["question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer"]):
                if q["correct_answer"] in ["A", "B", "C", "D"]:
                    validated.append(q)

        if not validated:
            return _generate_content_based_questions(text_chunks, question_count, difficulty, competency_focus, source_filename)

        return validated[:question_count]

    except Exception as e:
        logger.error(f"Gemini MCQ generation failed: {e}")
        return _generate_content_based_questions(text_chunks, question_count, difficulty, competency_focus, source_filename)


def _generate_content_based_questions(
    text_chunks: List[str],
    question_count: int,
    difficulty: str,
    competency_focus: Optional[str],
    source_filename: str
) -> List[dict]:
    """
    Generate questions derived from actual uploaded document content.
    Extracts meaningful sentences and turns them into comprehension MCQs.
    Falls back to mock pool only if document has no usable text.
    """
    import re
    import random

    full_text = " ".join(text_chunks)
    if not full_text.strip() or len(full_text) < 100:
        logger.info("Document text too short — using mock question pool")
        return _get_mock_questions(question_count, competency_focus)

    # Extract clean sentences (>= 40 chars, ends properly)
    sentences = re.split(r'(?<=[.!?])\s+', full_text)
    good_sentences = [
        s.strip() for s in sentences
        if len(s.strip()) >= 40 and len(s.strip()) <= 400
        and not s.strip().startswith("[")  # skip page markers
        and sum(1 for c in s if c.isalpha()) > 20  # mostly text
    ]

    if len(good_sentences) < 3:
        logger.info("Not enough usable sentences extracted — using mock pool")
        return _get_mock_questions(question_count, competency_focus)

    random.shuffle(good_sentences)
    questions = []
    difficulties = ["Easy", "Medium", "Hard"]
    comp_name = competency_focus or "General Knowledge"

    # Wrong-answer distractors
    distractor_pool = [
        "It is not applicable in this context",
        "It depends entirely on external factors",
        "None of the definitions in the material apply here",
        "It refers to the opposite of what is stated",
        "It is an outdated concept no longer in use",
        "It applies only in non-standard conditions",
        "It is defined differently across all disciplines",
        "It requires additional data to determine",
        "It has no direct relationship to the topic covered",
        "It contradicts the material's main argument",
    ]

    used_sentences = set()
    for i, sentence in enumerate(good_sentences):
        if len(questions) >= question_count:
            break
        if sentence in used_sentences:
            continue
        used_sentences.add(sentence)

        words = sentence.split()
        if len(words) < 6:
            continue

        lower = sentence.lower()
        is_definition = any(kw in lower for kw in [" is ", " refers to ", " means ", " defined as ", " describes ", " indicates ", " represents "])

        # Trim sentence for display in question
        display = sentence[:120] + ("..." if len(sentence) > 120 else "")

        if is_definition:
            question_text = f"According to the uploaded material, which statement correctly describes the following concept: \"{display}\""
        else:
            question_text = f"Based on the content of '{source_filename}', which of the following best interprets: \"{display}\""

        # Correct answer = direct quote from document
        correct = sentence[:200] if len(sentence) > 200 else sentence

        # Pick 3 distractors, shuffle pool
        random.shuffle(distractor_pool)
        distractors = distractor_pool[:3]

        options = [correct] + distractors
        random.shuffle(options)
        correct_letter = ["A", "B", "C", "D"][options.index(correct)]

        opt_a, opt_b, opt_c, opt_d = [o[:200] for o in options]
        diff = difficulties[i % 3] if difficulty == "Mixed" else difficulty

        questions.append({
            "question_text": question_text,
            "option_a": opt_a,
            "option_b": opt_b,
            "option_c": opt_c,
            "option_d": opt_d,
            "correct_answer": correct_letter,
            "explanation": f"This is directly stated in the uploaded material. The full context: '{sentence[:300]}'",
            "difficulty": diff,
            "competency_name": comp_name,
            "source_reference": source_filename,
        })

    # Supplement with topic-relevant mock questions if needed
    if len(questions) < question_count:
        needed = question_count - len(questions)
        logger.info(f"Supplementing {needed} questions from the topic mock pool")
        mock_pool = _get_mock_questions(needed * 2, competency_focus)
        questions.extend(mock_pool[:needed])

    return questions[:question_count]


def _get_mock_questions(count: int, competency_focus: Optional[str] = None) -> List[dict]:
    """Return deterministic mock questions for demo purposes."""
    if competency_focus and "sampling" in competency_focus.lower():
        pool = MOCK_SAMPLING_QUESTIONS
    else:
        pool = MOCK_SAMPLING_QUESTIONS + MOCK_GENERAL_QUESTIONS
    return pool[:count]


# ─────────────────────────────────────────────────────────────────────────────
# CHAT / ASSISTANT
# ─────────────────────────────────────────────────────────────────────────────

async def generate_assistant_response(
    user_message: str,
    user_context: dict,
    conversation_history: List[dict]
) -> str:
    """Generate a learning assistant response for the given user."""
    model = get_gemini_model()

    if model is not None:
        return await _chat_with_gemini(model, user_message, user_context, conversation_history)
    else:
        return _mock_assistant_response(user_message, user_context)


async def _chat_with_gemini(model, user_message: str, user_context: dict, history: List[dict]) -> str:
    context_str = json.dumps(user_context, indent=2)
    history_str = "\n".join([f"{h['role'].upper()}: {h['content']}" for h in history[-6:]])

    prompt = f"""You are StatWise AI, an intelligent learning assistant for India's Official Statistical System.
You help government statistical officers understand their competency gaps, learning paths, and statistical concepts.

USER PROFILE:
{context_str}

CONVERSATION HISTORY:
{history_str}

USER MESSAGE: {user_message}

Respond in a helpful, professional, and concise manner. When recommending courses, reference the user's actual skill gaps.
If asked about statistical concepts, explain them clearly with Indian government statistics context where relevant.
Keep responses under 250 words unless the user asks for detailed explanations."""

    try:
        response_text = await generate_text(prompt, max_tokens=512)
        return response_text if response_text else _mock_assistant_response(user_message, user_context)
    except Exception as e:
        logger.error(f"Chat generation error: {e}")
        return _mock_assistant_response(user_message, user_context)


def _mock_assistant_response(user_message: str, user_context: dict) -> str:
    """Deterministic fallback responses for the AI assistant with rich statistical knowledge."""
    msg_lower = user_message.lower()
    name = user_context.get("name", "there")
    top_gap = user_context.get("top_gap", "Python")

    if any(w in msg_lower for w in ["next", "learn", "recommend", "should"]):
        return (
            f"Based on your current competency profile, **{top_gap}** is your highest-priority skill gap. "
            f"I recommend starting with **Python for Data Analysis** on iGOT Karmayogi — it's a 20-hour course "
            f"designed for statistical professionals. After that, the **GIS Fundamentals** programme from NSSTA "
            f"would address your second biggest gap. Would you like me to add these to your learning path?"
        )
    elif any(w in msg_lower for w in ["gap", "weak", "improve", "competency"]):
        return (
            f"Hi {name}! Your current competency profile shows three high-priority gaps:\n\n"
            f"1. **Python** — Current: 34% | Required: 80% for your role\n"
            f"2. **GIS** — Current: 25% | Required: 60%\n"
            f"3. **AI/ML** — Current: 31% | Required: 60%\n\n"
            f"Your strongest competencies are Statistics (88%) and Survey Design (82%). "
            f"Focusing on Python first will give you the highest return, as it underpins both GIS analysis and AI/ML."
        )
    elif any(w in msg_lower for w in ["python", "programming", "pandas", "numpy"]):
        return (
            f"**Python for Statistical Analysis** is essential for modern statistical officers. "
            f"In the context of India's NSO, Python is used for:\n"
            f"- Automated data cleaning and processing of large PLFS/HCES microdata\n"
            f"- Statistical computing (replacing proprietary software for survey tabulation)\n"
            f"- Data visualization with Matplotlib and Seaborn\n"
            f"- API integration with government open data portals (e.g. data.gov.in)\n\n"
            f"**Recommended learning path**: Python Basics → Pandas for Data Analysis → Data Visualization → Statistical Computing in Python."
        )
    elif any(w in msg_lower for w in ["sampling", "sample", "stratified", "cluster", "srs"]):
        return (
            f"**Key Sampling Techniques in Official Statistics:**\n\n"
            f"1. **Simple Random Sampling (SRS)**: Every unit has equal selection probability. Gold standard for unbiased estimation.\n\n"
            f"2. **Stratified Sampling**: Population is divided into homogeneous strata (e.g. rural/urban, district-wise) and sampled from each. Guarantees sub-population representation. Used extensively in PLFS and HCES.\n\n"
            f"3. **Cluster Sampling**: Primary units (e.g. census enumeration blocks, villages) are selected, and all or sub-sampled units within are surveyed. Economical for geographically dispersed surveys.\n\n"
            f"4. **Probability Proportional to Size (PPS)**: Selection probability is proportional to size measure (e.g. enterprise workforce). Standard for Annual Survey of Industries (ASI)."
        )
    elif any(w in msg_lower for w in ["concept", "statistic", "variance", "mean", "median", "standard deviation", "regression", "hypothesis", "p-value"]):
        return (
            f"Here is an explanation of a fundamental statistical concept: **Standard Deviation & Variance** in Survey Estimation:\n\n"
            f"• **Variance ($\sigma^2$)**: Measures the average squared dispersion of survey values around the sample mean.\n"
            f"• **Standard Error (SE)**: The standard deviation of a sampling distribution (e.g., $SE = \sigma / \sqrt{n}$). It quantifies the precision of our survey estimates.\n"
            f"• **Confidence Interval (95%)**: $\hat{\mu} \pm 1.96 \times SE$. Tells us that in 95 out of 100 repeated samples, the calculated interval covers the true population parameter.\n\n"
            f"In MoSPI surveys, the **Coefficient of Variation (CV = SE / Mean × 100%)** is the official metric used to assess the reliability of published estimates."
        )
    elif any(w in msg_lower for w in ["cpi", "inflation", "price", "index", "wpi"]):
        return (
            f"**Consumer Price Index (CPI) in India:**\n\n"
            f"• **Base Year**: Currently 2012=100 (compiled by NSO, MoSPI).\n"
            f"• **Scope**: Measures changes over time in the price level of consumer goods and services purchased by households.\n"
            f"• **Formula**: Modified Laspeyres formula using weights derived from Household Consumer Expenditure Survey (HCES).\n"
            f"• **Series**: Published monthly for Rural, Urban, and Combined at national and state levels."
        )
    elif any(w in msg_lower for w in ["gdp", "national accounts", "gross domestic product", "gva"]):
        return (
            f"**National Accounts & GDP Measurement:**\n\n"
            f"• **GDP (Gross Domestic Product)**: Total monetary value of all finished goods and services produced within a country in a specific period.\n"
            f"• **GVA (Gross Value Added)**: $GVA = GDP - \text{Net Product Taxes (Taxes - Subsidies)}$.\n"
            f"• **Three Approaches**: Production (Output) Approach, Expenditure Approach ($C + I + G + NX$), and Income Approach.\n"
            f"• **Base Year**: 2011-12 (compiled quarterly and annually by National Accounts Division, MoSPI)."
        )
    elif any(w in msg_lower for w in ["gis", "geographic", "spatial", "remote sensing"]):
        return (
            f"**GIS (Geographic Information Systems) in Official Statistics:**\n\n"
            f"• **Applications in NSO**:\n"
            f"  - Delineation and digital mapping of Census Enumeration Blocks\n"
            f"  - Agricultural area and crop yield estimation with satellite remote sensing\n"
            f"  - Small Area Estimation (SAE) combining survey microdata with geospatial covariates\n"
            f"  - Geospatial SDG Indicator monitoring\n\n"
            f"**Recommended training**: NSSTA's *GIS for Official Statistics* and iGOT's *Geospatial Data Basics*."
        )
    elif any(w in msg_lower for w in ["quiz", "practice", "question", "test"]):
        return (
            f"Here is a quick practice question on **Official Statistics**:\n\n"
            f"**Q: Which formula is primarily used by NSO to compile the Consumer Price Index (CPI)?**\n"
            f"A) Paasche's Formula\n"
            f"B) Modified Laspeyres Formula ✓\n"
            f"C) Fisher's Ideal Index\n"
            f"D) Marshall-Edgeworth Index\n\n"
            f"**Explanation**: The NSO uses the Modified Laspeyres formula with base year 2012=100 and weights derived from the Consumer Expenditure Survey.\n\n"
            f"To generate a full 10-question assessment from your study materials, open the **AI Quiz Generator** in the sidebar!"
        )
    elif any(w in msg_lower for w in ["hello", "hi", "hey", "namaste"]):
        return (
            f"Namaste {name}! 🙏 I'm **StatWise AI**, your learning assistant for India's Official Statistical System.\n\n"
            f"I can help you with:\n"
            f"- Explaining statistical concepts (Sampling, CPI, GDP, Estimation, Regression)\n"
            f"- Understanding your competency gaps and recommended courses\n"
            f"- Providing practice MCQs with explanations\n"
            f"- Guiding your learning path across iGOT Karmayogi and NSSTA\n\n"
            f"What would you like to learn about today?"
        )
    else:
        return (
            f"Here is what I can do to assist your statistical learning journey, {name}:\n\n"
            f"1. **Statistical Concepts**: Ask me to explain concepts like *Stratified Sampling*, *Standard Error*, *CPI Calculation*, or *National Accounts*.\n"
            f"2. **Competency Guidance**: Your current top development priority is **{top_gap}** (target: 80%).\n"
            f"3. **Course Pathways**: I can recommend courses from iGOT Karmayogi and NSSTA to bridge your gaps.\n"
            f"4. **Practice Questions**: Ask me for practice MCQs on any topic.\n\n"
            f"Try asking: *'Explain Stratified Sampling'* or *'How is CPI calculated in India?'*"
        )
