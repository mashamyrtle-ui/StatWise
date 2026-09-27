// =============================================================================
// StatWise / StatSetu — Multi-User localStorage Store
// Replaces backend API for auth, competency, assessment, and learning data.
// The AI assistant, quiz-generator, and material upload still use the backend.
// =============================================================================

import { generateSeedFaceTemplate, compareFaceVectors } from '@/lib/biometrics';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'employee' | 'trainer' | 'admin';
  designation: string;
  department: string;
  years_experience: number;
  education: string;
  current_assignment: string;
  career_goal: string;
  employee_id: string;
  createdAt: string;
  onboardingCompleted?: boolean;
  faceEnrolled?: boolean;
  faceTemplate?: string;
  faceEnrolledAt?: string;
  enrolledFaceThumbnail?: string;
  jobRole?: string;
  specialization?: string;
}

export interface CompetencyScore {
  competency_id: string;
  competency_name: string;
  category: string;
  code: string;
  current_level: number;       // 1-5
  score_percentage: number;    // 0-100
}

export interface SkillGap {
  competency_id: string;
  competency_name: string;
  category: string;
  current_percentage: number;
  required_percentage: number;
  gap: number;                 // levels
  gap_label: 'High' | 'Medium' | 'Low' | 'None';
  explanation: string;
}

export interface SkillGapResult {
  gaps: SkillGap[];
  high_priority_count: number;
  medium_priority_count: number;
  low_priority_count: number;
  summary: string;
  strengths: SkillGap[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  provider: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration_hours: number;
  rating: number;
  category: string;
  competency_codes: string[];
}

export interface Recommendation {
  id: string;
  course_id: string;
  course: Course;
  match_score: number;
  reason: string;
}

export interface LearningPathItem {
  id: string;
  course: Course;
  status: 'Completed' | 'In Progress' | 'Recommended' | 'Locked';
  reason: string;
  order: number;
}

export interface HistoryItem {
  id: string;
  course: Course;
  status: 'Completed' | 'In Progress';
  enrolled_at: string;
  completed_at: string | null;
  hours_spent: number;
  score: number | null;
}

export interface AssessmentQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  competency_code: string;
  difficulty: string;
  explanation: string;
}

export interface UserRecord {
  profile: UserProfile;
  onboardingCompleted: boolean;
  faceEnrolled: boolean;
  faceTemplate?: string;
  faceEnrolledAt?: string;
  enrolledFaceThumbnail?: string;
  assessmentCompleted: boolean;
  assessmentScore: number | null;
  assessmentDate: string | null;
  competencies: CompetencyScore[];
  skillGaps: SkillGapResult | null;
  recommendations: Recommendation[];
  learningPath: LearningPathItem[];
  learningHistory: HistoryItem[];
  enrolledCourses: string[];
  notifications: any[];
  onboardingData?: {
    trainingHistory: any[];
    selfAssessment: any[];
    workExperience: any[];
    baselineResponses: any[];
    submittedAt: string;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'statsetu_users_v2';
const CURRENT_USER_KEY = 'statsetu_current_user_id';

export const DEMO_USER_IDS = {
  ANANYA: 'demo-ananya-001',
  RAHUL: 'demo-rahul-002',
  TRAINER: 'demo-trainer-003',
  ADMIN: 'demo-admin-004',
  TRN001: 'user-trn001',
  ADM001: 'user-adm001',
};

// ─── Competency Master List ───────────────────────────────────────────────────

export const COMPETENCY_LIST = [
  // Statistical
  { id: 'STAT01', code: 'STAT01', name: 'Statistical Theory & Methods', category: 'Statistical' },
  { id: 'STAT02', code: 'STAT02', name: 'Survey Design & Sampling', category: 'Statistical' },
  { id: 'STAT03', code: 'STAT03', name: 'Data Collection & Validation', category: 'Statistical' },
  { id: 'STAT04', code: 'STAT04', name: 'Index Numbers & Price Statistics', category: 'Statistical' },
  { id: 'STAT05', code: 'STAT05', name: 'National Accounts & GVA Estimation', category: 'Statistical' },
  // Technical
  { id: 'TECH01', code: 'TECH01', name: 'Statistical Software (R/Python/SPSS)', category: 'Technical' },
  { id: 'TECH02', code: 'TECH02', name: 'Database & SQL Querying', category: 'Technical' },
  { id: 'TECH03', code: 'TECH03', name: 'Data Visualization & Dashboards', category: 'Technical' },
  { id: 'TECH04', code: 'TECH04', name: 'Machine Learning for Statistics', category: 'Technical' },
  { id: 'TECH05', code: 'TECH05', name: 'GIS & Geospatial Analysis', category: 'Technical' },
  // Digital Governance
  { id: 'DIG01', code: 'DIG01', name: 'Digital Data Governance', category: 'Digital Governance' },
  { id: 'DIG02', code: 'DIG02', name: 'Open Data & API Standards', category: 'Digital Governance' },
  { id: 'DIG03', code: 'DIG03', name: 'Cybersecurity & Data Privacy', category: 'Digital Governance' },
  { id: 'DIG04', code: 'DIG04', name: 'eGovernance Frameworks (GeM, PFMS)', category: 'Digital Governance' },
  // Behavioural
  { id: 'BEH01', code: 'BEH01', name: 'Communication & Report Writing', category: 'Behavioural & Managerial' },
  { id: 'BEH02', code: 'BEH02', name: 'Leadership & Team Management', category: 'Behavioural & Managerial' },
];

// ─── Role Requirements ────────────────────────────────────────────────────────
// Minimum required score_percentage per competency per role (configurable)

export const ROLE_REQUIREMENTS: Record<string, Record<string, number>> = {
  employee: {
    STAT01: 75, STAT02: 70, STAT03: 70, STAT04: 60, STAT05: 60,
    TECH01: 65, TECH02: 55, TECH03: 60, TECH04: 50, TECH05: 50,
    DIG01: 55, DIG02: 45, DIG03: 50, DIG04: 50,
    BEH01: 70, BEH02: 55,
  },
  trainer: {
    STAT01: 85, STAT02: 80, STAT03: 80, STAT04: 70, STAT05: 70,
    TECH01: 75, TECH02: 65, TECH03: 70, TECH04: 60, TECH05: 55,
    DIG01: 65, DIG02: 55, DIG03: 60, DIG04: 60,
    BEH01: 85, BEH02: 80,
  },
  admin: {
    STAT01: 70, STAT02: 65, STAT03: 65, STAT04: 65, STAT05: 70,
    TECH01: 55, TECH02: 60, TECH03: 65, TECH04: 55, TECH05: 45,
    DIG01: 75, DIG02: 70, DIG03: 75, DIG04: 75,
    BEH01: 80, BEH02: 85,
  },
};

// ─── Course Catalogue ─────────────────────────────────────────────────────────

export const COURSES_CATALOGUE: Course[] = [
  {
    id: 'C001', title: 'Foundations of Official Statistics', provider: 'NSSTA',
    description: 'Core statistical theory, NSS framework, MoSPI guidelines, and international standards.',
    difficulty: 'Beginner', duration_hours: 24, rating: 4.7, category: 'Statistical',
    competency_codes: ['STAT01', 'STAT02'],
  },
  {
    id: 'C002', title: 'Survey Design & Sampling Techniques', provider: 'NSSTA',
    description: 'Probability sampling, stratification, cluster sampling, NSSO survey methodology.',
    difficulty: 'Intermediate', duration_hours: 32, rating: 4.8, category: 'Statistical',
    competency_codes: ['STAT02', 'STAT03'],
  },
  {
    id: 'C003', title: 'Python for Data Analysis (Govt Edition)', provider: 'iGOT Karmayogi',
    description: 'Pandas, NumPy, Matplotlib for government statistical workflows.',
    difficulty: 'Intermediate', duration_hours: 40, rating: 4.6, category: 'Technical',
    competency_codes: ['TECH01', 'TECH03'],
  },
  {
    id: 'C004', title: 'R Programming for Statistical Officers', provider: 'iGOT Karmayogi',
    description: 'tidyverse, ggplot2, survey package for NSS/NSSO data analysis.',
    difficulty: 'Intermediate', duration_hours: 36, rating: 4.5, category: 'Technical',
    competency_codes: ['TECH01', 'TECH03'],
  },
  {
    id: 'C005', title: 'GIS & Geospatial Analytics for Statistics', provider: 'Other Govt Training',
    description: 'QGIS, remote sensing, spatial analysis for agricultural and census statistics.',
    difficulty: 'Intermediate', duration_hours: 28, rating: 4.4, category: 'Technical',
    competency_codes: ['TECH05'],
  },
  {
    id: 'C006', title: 'Machine Learning Applications in Official Statistics', provider: 'iGOT Karmayogi',
    description: 'Regression, classification, and time-series for GDP estimation and economic forecasting.',
    difficulty: 'Advanced', duration_hours: 48, rating: 4.9, category: 'Technical',
    competency_codes: ['TECH04', 'TECH01'],
  },
  {
    id: 'C007', title: 'National Accounts & GDP Compilation', provider: 'NSSTA',
    description: 'SNA 2008 framework, GVA estimation, back-series, GDP-at-constant-prices methodology.',
    difficulty: 'Advanced', duration_hours: 40, rating: 4.7, category: 'Statistical',
    competency_codes: ['STAT05', 'STAT04'],
  },
  {
    id: 'C008', title: 'Price Statistics & Index Numbers (CPI/WPI)', provider: 'NSSTA',
    description: 'CPI base 2012=100, Laspeyres index, WPI methodology, item weighting.',
    difficulty: 'Intermediate', duration_hours: 24, rating: 4.6, category: 'Statistical',
    competency_codes: ['STAT04'],
  },
  {
    id: 'C009', title: 'Data Visualization for Government Reporting', provider: 'iGOT Karmayogi',
    description: 'Dashboard design, Tableau/Power BI, SDG indicator visualization for policymakers.',
    difficulty: 'Beginner', duration_hours: 20, rating: 4.5, category: 'Technical',
    competency_codes: ['TECH03'],
  },
  {
    id: 'C010', title: 'Agricultural Statistics & Crop Estimation', provider: 'Other Govt Training',
    description: 'Crop acreage, yield surveys, remote sensing for agriculture census.',
    difficulty: 'Intermediate', duration_hours: 32, rating: 4.4, category: 'Statistical',
    competency_codes: ['STAT02', 'STAT03', 'TECH05'],
  },
  {
    id: 'C011', title: 'Digital Governance & eGovernance Frameworks', provider: 'iGOT Karmayogi',
    description: 'GeM, PFMS, Digital India stack, open government data standards.',
    difficulty: 'Beginner', duration_hours: 16, rating: 4.3, category: 'Digital Governance',
    competency_codes: ['DIG04', 'DIG01'],
  },
  {
    id: 'C012', title: 'Data Privacy, Security & Cyber Hygiene', provider: 'iGOT Karmayogi',
    description: 'PDPB, statistical confidentiality, secure data transmission protocols.',
    difficulty: 'Beginner', duration_hours: 12, rating: 4.4, category: 'Digital Governance',
    competency_codes: ['DIG03', 'DIG01'],
  },
  {
    id: 'C013', title: 'Open Data Standards & API Design', provider: 'Other Govt Training',
    description: 'SDMX, linked open data, REST APIs for statistical dissemination.',
    difficulty: 'Intermediate', duration_hours: 20, rating: 4.2, category: 'Digital Governance',
    competency_codes: ['DIG02'],
  },
  {
    id: 'C014', title: 'SQL & Database Management for Statisticians', provider: 'iGOT Karmayogi',
    description: 'PostgreSQL, query optimization, data warehouse design for NSS surveys.',
    difficulty: 'Intermediate', duration_hours: 28, rating: 4.5, category: 'Technical',
    competency_codes: ['TECH02'],
  },
  {
    id: 'C015', title: 'Communication & Report Writing for Officers', provider: 'NSSTA',
    description: 'Technical writing, policy brief preparation, presentation skills for government.',
    difficulty: 'Beginner', duration_hours: 16, rating: 4.6, category: 'Behavioural',
    competency_codes: ['BEH01'],
  },
  {
    id: 'C016', title: 'Leadership & Team Management (Govt Context)', provider: 'iGOT Karmayogi',
    description: 'Situational leadership, performance management, inter-departmental coordination.',
    difficulty: 'Intermediate', duration_hours: 24, rating: 4.7, category: 'Behavioural',
    competency_codes: ['BEH02'],
  },
  {
    id: 'C017', title: 'Statistical Data Quality Assessment', provider: 'NSSTA',
    description: 'IMF DQAF, data validation frameworks, quality assurance for official statistics.',
    difficulty: 'Advanced', duration_hours: 32, rating: 4.8, category: 'Statistical',
    competency_codes: ['STAT03', 'STAT01'],
  },
  {
    id: 'C018', title: 'SDG Monitoring & Indicator Framework', provider: 'Other Govt Training',
    description: 'UN SDG indicator methodology, voluntary national review, SDG dashboard.',
    difficulty: 'Intermediate', duration_hours: 24, rating: 4.5, category: 'Statistical',
    competency_codes: ['STAT01', 'TECH03'],
  },
  {
    id: 'C019', title: 'Time Series Analysis & Forecasting', provider: 'iGOT Karmayogi',
    description: 'ARIMA, seasonal decomposition, state space models for economic indicators.',
    difficulty: 'Advanced', duration_hours: 40, rating: 4.7, category: 'Technical',
    competency_codes: ['TECH01', 'TECH04'],
  },
  {
    id: 'C020', title: 'Advanced Econometrics for Policy Analysis', provider: 'NSSTA',
    description: 'Panel data, IV regression, difference-in-differences for policy evaluation.',
    difficulty: 'Advanced', duration_hours: 48, rating: 4.9, category: 'Statistical',
    competency_codes: ['STAT01', 'TECH01'],
  },
];

// ─── Assessment Questions ─────────────────────────────────────────────────────

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'Q01', competency_code: 'STAT01', difficulty: 'Intermediate',
    question_text: 'Which sampling method is used when the population is divided into non-overlapping groups and samples are drawn from each group proportionally?',
    option_a: 'Systematic sampling', option_b: 'Stratified random sampling',
    option_c: 'Cluster sampling', option_d: 'Snowball sampling',
    correct_answer: 'B',
    explanation: 'Stratified random sampling divides the population into strata (groups) and samples are drawn from each stratum, ensuring representation.',
  },
  {
    id: 'Q02', competency_code: 'STAT02', difficulty: 'Intermediate',
    question_text: 'In the NSS Consumer Expenditure Survey, the primary sampling units (PSUs) are selected using which method?',
    option_a: 'Simple random sampling without replacement', option_b: 'Circular systematic sampling',
    option_c: 'Probability proportional to size (PPS) sampling', option_d: 'Purposive sampling',
    correct_answer: 'C',
    explanation: 'PPS sampling gives larger villages/blocks a higher probability of selection, used in NSS surveys for rural PSUs.',
  },
  {
    id: 'Q03', competency_code: 'STAT04', difficulty: 'Intermediate',
    question_text: 'The Consumer Price Index (CPI) in India uses which base year?',
    option_a: '2004-05', option_b: '2010-11', option_c: '2012', option_d: '2015-16',
    correct_answer: 'C',
    explanation: 'The current CPI series in India uses base year 2012=100, released by MoSPI from January 2015.',
  },
  {
    id: 'Q04', competency_code: 'STAT05', difficulty: 'Advanced',
    question_text: 'In the System of National Accounts (SNA 2008), GDP measured from the production side equals:',
    option_a: 'Sum of all wages paid to workers', option_b: 'GVA at basic prices + taxes on products − subsidies on products',
    option_c: 'Total exports minus total imports', option_d: 'Sum of all government expenditures',
    correct_answer: 'B',
    explanation: 'GDP at market prices = GVA at basic prices + taxes on products – subsidies on products, per SNA 2008.',
  },
  {
    id: 'Q05', competency_code: 'STAT03', difficulty: 'Beginner',
    question_text: 'Which of the following is a non-sampling error in a survey?',
    option_a: 'Error due to selection of fewer units than required', option_b: 'Error arising from interviewer bias',
    option_c: 'Standard error due to sample size', option_d: 'Finite population correction factor',
    correct_answer: 'B',
    explanation: 'Non-sampling errors include interviewer bias, respondent errors, and data processing mistakes — not related to sample size.',
  },
  {
    id: 'Q06', competency_code: 'TECH01', difficulty: 'Intermediate',
    question_text: 'In Python pandas, which function is used to merge two DataFrames on a common column?',
    option_a: 'df.append()', option_b: 'pd.concat()', option_c: 'pd.merge()', option_d: 'df.join()',
    correct_answer: 'C',
    explanation: 'pd.merge() is the primary function for SQL-style joins on common columns in pandas.',
  },
  {
    id: 'Q07', competency_code: 'TECH01', difficulty: 'Intermediate',
    question_text: 'In R, which package provides the survey() family of functions for complex survey analysis?',
    option_a: 'ggplot2', option_b: 'survey', option_c: 'dplyr', option_d: 'caret',
    correct_answer: 'B',
    explanation: 'The {survey} package by Thomas Lumley provides functions for analysis of complex survey data including stratified and cluster samples.',
  },
  {
    id: 'Q08', competency_code: 'TECH03', difficulty: 'Beginner',
    question_text: 'Which principle is most important when designing a data visualization for a government statistical report?',
    option_a: 'Use as many colors as possible to make it attractive', option_b: 'Maximize data-to-ink ratio (Tufte principle)',
    option_c: 'Always use 3D charts for better visual impact', option_d: 'Include all raw data points regardless of clarity',
    correct_answer: 'B',
    explanation: 'Edward Tufte\'s data-to-ink ratio principle advocates removing non-essential ink, maximizing clarity and information density.',
  },
  {
    id: 'Q09', competency_code: 'TECH04', difficulty: 'Advanced',
    question_text: 'Which machine learning algorithm is most suitable for predicting a continuous outcome like district-level GDP?',
    option_a: 'Logistic Regression', option_b: 'K-Means Clustering',
    option_c: 'Random Forest Regression', option_d: 'Naive Bayes Classifier',
    correct_answer: 'C',
    explanation: 'Random Forest Regression handles non-linear relationships, missing data, and feature interactions well for continuous outcomes like GDP.',
  },
  {
    id: 'Q10', competency_code: 'TECH05', difficulty: 'Intermediate',
    question_text: 'In GIS analysis, what does the term "raster data" refer to?',
    option_a: 'Data stored as points, lines, and polygons', option_b: 'A grid-based format where each cell stores a value (e.g., satellite imagery)',
    option_c: 'A format for storing street addresses', option_d: 'Vector-based elevation data',
    correct_answer: 'B',
    explanation: 'Raster data represents the world as a grid of cells/pixels, each with a value — used for satellite imagery, DEMs, and continuous surfaces.',
  },
  {
    id: 'Q11', competency_code: 'TECH02', difficulty: 'Beginner',
    question_text: 'Which SQL clause is used to filter records AFTER a GROUP BY operation?',
    option_a: 'WHERE', option_b: 'FILTER', option_c: 'HAVING', option_d: 'SELECT',
    correct_answer: 'C',
    explanation: 'HAVING is used to filter grouped records; WHERE filters individual rows before grouping.',
  },
  {
    id: 'Q12', competency_code: 'DIG01', difficulty: 'Beginner',
    question_text: 'Under India\'s National Data Governance Framework, which principle ensures that government data is made available in machine-readable formats?',
    option_a: 'Data privacy by design', option_b: 'Open data by default',
    option_c: 'Data localization', option_d: 'Data monetization',
    correct_answer: 'B',
    explanation: '"Open data by default" is a core principle ensuring government datasets are accessible, discoverable, and usable by citizens and researchers.',
  },
  {
    id: 'Q13', competency_code: 'DIG03', difficulty: 'Intermediate',
    question_text: 'Which Act governs the protection of personal data of individuals in India (as of 2023)?',
    option_a: 'IT Act 2000', option_b: 'Digital Personal Data Protection Act 2023',
    option_c: 'Right to Information Act 2005', option_d: 'Statistics Act 2008',
    correct_answer: 'B',
    explanation: 'The Digital Personal Data Protection Act 2023 (DPDPA) governs collection, processing, and protection of personal data in India.',
  },
  {
    id: 'Q14', competency_code: 'DIG02', difficulty: 'Intermediate',
    question_text: 'SDMX (Statistical Data and Metadata eXchange) is a standard used for:',
    option_a: 'Encrypting statistical databases', option_b: 'Exchanging statistical data and metadata between organizations',
    option_c: 'Training machine learning models on survey data', option_d: 'Creating GIS maps from survey responses',
    correct_answer: 'B',
    explanation: 'SDMX is an ISO standard for sharing statistical information between national and international statistical organizations.',
  },
  {
    id: 'Q15', competency_code: 'DIG04', difficulty: 'Beginner',
    question_text: 'Which government e-marketplace platform is used for procurement of goods and services by Central/State Government Ministries?',
    option_a: 'PFMS', option_b: 'GeM (Government e-Marketplace)',
    option_c: 'GSTN', option_d: 'UPI',
    correct_answer: 'B',
    explanation: 'GeM (Government e-Marketplace) is the online procurement portal for Central and State Government entities in India.',
  },
  {
    id: 'Q16', competency_code: 'BEH01', difficulty: 'Beginner',
    question_text: 'When preparing a statistical report for a non-technical policy audience, which approach is most effective?',
    option_a: 'Include all technical formulas and proofs', option_b: 'Use jargon-heavy language to demonstrate expertise',
    option_c: 'Lead with key findings and use clear visualizations over tables', option_d: 'Attach raw data files without summarization',
    correct_answer: 'C',
    explanation: 'Effective science communication requires leading with findings, using clear visuals, and minimizing technical jargon for non-expert audiences.',
  },
  {
    id: 'Q17', competency_code: 'BEH02', difficulty: 'Intermediate',
    question_text: 'In a government statistical office, which leadership approach best supports a diverse team working under tight survey deadlines?',
    option_a: 'Autocratic — give direct orders without explanation', option_b: 'Laissez-faire — let each person decide independently',
    option_c: 'Situational — adapt style based on team member competency and motivation', option_d: 'Transactional — use only monetary incentives',
    correct_answer: 'C',
    explanation: 'Situational leadership (Hersey-Blanchard model) is most effective as it adapts the leader\'s style to each team member\'s development level.',
  },
  {
    id: 'Q18', competency_code: 'STAT01', difficulty: 'Advanced',
    question_text: 'The Coefficient of Variation (CV) in survey data is defined as:',
    option_a: '(Mean / Standard Deviation) × 100', option_b: '(Standard Deviation / Mean) × 100',
    option_c: '(Sample Size / Population Size) × 100', option_d: '(Standard Error / Confidence Interval) × 100',
    correct_answer: 'B',
    explanation: 'CV = (SD / Mean) × 100. In NSS surveys, a CV below 25-30% indicates acceptable reliability of the estimate.',
  },
  {
    id: 'Q19', competency_code: 'STAT02', difficulty: 'Advanced',
    question_text: 'In a two-stage stratified sampling design for a household survey, which variance estimator accounts for the clustering of units?',
    option_a: 'Simple random sampling variance formula', option_b: 'Design-based variance using the Taylor linearisation method',
    option_c: 'Standard deviation of the sample mean', option_d: 'Bootstrap resampling only',
    correct_answer: 'B',
    explanation: 'Taylor linearisation (delta method) is the standard design-based variance estimator for complex survey designs with clustering and stratification.',
  },
  {
    id: 'Q20', competency_code: 'TECH04', difficulty: 'Advanced',
    question_text: 'Which technique is used to handle multicollinearity in a regression model when predictors are highly correlated?',
    option_a: 'Increasing the sample size only', option_b: 'Ridge regression (L2 regularization)',
    option_c: 'Removing the dependent variable', option_d: 'Using logistic regression instead',
    correct_answer: 'B',
    explanation: 'Ridge regression shrinks correlated coefficients using L2 penalty, reducing variance inflation caused by multicollinearity.',
  },
];

// ─── Utility Functions ────────────────────────────────────────────────────────

function hashPassword(email: string, password: string): string {
  return btoa(`${email}:${password}`);
}

function generateId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateEmployeeId(name: string): string {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3);
  return `${initials}${Math.floor(1000 + Math.random() * 9000)}`;
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

function loadAllUsers(): Record<string, UserRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllUsers(users: Record<string, UserRecord>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// ─── Competency & Gap Calculation ─────────────────────────────────────────────

function calculateGapsFromCompetencies(competencies: CompetencyScore[], role: string): SkillGapResult {
  const reqs = ROLE_REQUIREMENTS[role] || ROLE_REQUIREMENTS.employee;
  const gaps: SkillGap[] = [];
  const strengths: SkillGap[] = [];

  for (const comp of competencies) {
    const required = reqs[comp.code] ?? 60;
    const current = comp.score_percentage;
    const gapPct = required - current;
    const gapLevels = Math.max(0, Math.round(gapPct / 20));
    let gap_label: 'High' | 'Medium' | 'Low' | 'None' = 'None';
    if (gapPct > 25) gap_label = 'High';
    else if (gapPct > 10) gap_label = 'Medium';
    else if (gapPct > 0) gap_label = 'Low';

    const item: SkillGap = {
      competency_id: comp.competency_id,
      competency_name: comp.competency_name,
      category: comp.category,
      current_percentage: current,
      required_percentage: required,
      gap: gapLevels,
      gap_label,
      explanation: gap_label === 'None'
        ? `You meet or exceed the required level for ${comp.competency_name}.`
        : `Your current score (${current.toFixed(0)}%) is below the required ${required}% for this role. ${
          gap_label === 'High'
            ? 'Priority training recommended.'
            : gap_label === 'Medium'
            ? 'Targeted improvement needed.'
            : 'Minor improvement will close this gap.'
        }`,
    };

    if (gapPct > 0) gaps.push(item);
    else strengths.push(item);
  }

  gaps.sort((a, b) => (b.required_percentage - b.current_percentage) - (a.required_percentage - a.current_percentage));

  return {
    gaps,
    strengths,
    high_priority_count: gaps.filter(g => g.gap_label === 'High').length,
    medium_priority_count: gaps.filter(g => g.gap_label === 'Medium').length,
    low_priority_count: gaps.filter(g => g.gap_label === 'Low').length,
    summary: `Identified ${gaps.length} competency gaps. ${gaps.filter(g => g.gap_label === 'High').length} require immediate attention.`,
  };
}

function generateRecommendations(gaps: SkillGap[], career_goal: string): Recommendation[] {
  const gapCodes = gaps.map(g => g.competency_id);
  const highGapCodes = gaps.filter(g => g.gap_label === 'High').map(g => g.competency_id);

  // Score each course by how well it addresses gaps
  const scored = COURSES_CATALOGUE.map(course => {
    let score = 0;
    for (const code of course.competency_codes) {
      if (highGapCodes.includes(code)) score += 40;
      else if (gapCodes.includes(code)) score += 20;
    }
    // Career goal matching (simple keyword)
    const goalLower = career_goal.toLowerCase();
    const titleLower = course.title.toLowerCase();
    if (goalLower.includes('data') && titleLower.includes('data')) score += 10;
    if (goalLower.includes('machine learning') && titleLower.includes('machine learning')) score += 15;
    if (goalLower.includes('gis') && titleLower.includes('gis')) score += 15;
    if (goalLower.includes('leadership') && titleLower.includes('leadership')) score += 15;
    if (goalLower.includes('national') && titleLower.includes('national')) score += 10;
    if (score === 0) score = Math.floor(Math.random() * 15) + 5;
    return { course, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top10 = scored.slice(0, 10);

  return top10.map((item, idx) => {
    const topGap = gaps.find(g => item.course.competency_codes.some(c => c === g.competency_id));
    const reason = topGap
      ? `Recommended to address your ${topGap.gap_label.toLowerCase()} priority gap in ${topGap.competency_name} (current: ${topGap.current_percentage.toFixed(0)}%, required: ${topGap.required_percentage}%).`
      : `Recommended based on your career goal and role requirements.`;
    return {
      id: `REC-${idx}`,
      course_id: item.course.id,
      course: item.course,
      match_score: Math.min(99, 50 + item.score),
      reason,
    };
  });
}

function generateLearningPath(recs: Recommendation[], history: HistoryItem[]): LearningPathItem[] {
  const completedIds = new Set(history.filter(h => h.status === 'Completed').map(h => h.course.id));
  const inProgressIds = new Set(history.filter(h => h.status === 'In Progress').map(h => h.course.id));

  return recs.slice(0, 8).map((rec, idx) => {
    let status: LearningPathItem['status'] = 'Recommended';
    if (completedIds.has(rec.course.id)) status = 'Completed';
    else if (inProgressIds.has(rec.course.id)) status = 'In Progress';
    else if (idx > 3) status = 'Locked';
    return {
      id: `LP-${idx}`,
      course: rec.course,
      status,
      reason: rec.reason,
      order: idx + 1,
    };
  });
}

// ─── Assessment Submission Engine ─────────────────────────────────────────────

export interface AssessmentResult {
  score_percentage: number;
  correct_count: number;
  total_count: number;
  summary: string;
  question_results: {
    question_id: string;
    question_text: string;
    option_a: string; option_b: string; option_c: string; option_d: string;
    correct_answer: string;
    selected_answer: string;
    is_correct: boolean;
    explanation: string;
  }[];
  competency_updates: { competency_id: string; competency_name: string; before: number; after: number; delta: number }[];
}

// ─── Demo User Seeding ────────────────────────────────────────────────────────

function createAnanya(): UserRecord {
  const seedTemplate = generateSeedFaceTemplate('Ananya Sharma');
  const profile: UserProfile = {
    id: DEMO_USER_IDS.ANANYA,
    name: 'Ananya Sharma',
    email: 'ananya@statsetu.gov.in',
    passwordHash: hashPassword('ananya@statsetu.gov.in', 'demo123'),
    role: 'employee',
    designation: 'Statistical Officer',
    department: 'Department of Statistics',
    years_experience: 5,
    education: 'M.Sc. Statistics, Delhi University',
    current_assignment: 'Annual Survey of Industries — Data Analysis Unit',
    career_goal: 'Lead a data science team working on national-level economic indicators and SDG monitoring.',
    employee_id: 'ANS2847',
    createdAt: '2024-01-15T10:00:00Z',
    onboardingCompleted: true,
    faceEnrolled: true,
    faceTemplate: seedTemplate,
    faceEnrolledAt: '2024-01-16T11:00:00Z',
  };

  const competencies: CompetencyScore[] = [
    { competency_id: 'STAT01', code: 'STAT01', competency_name: 'Statistical Theory & Methods', category: 'Statistical', current_level: 4, score_percentage: 78 },
    { competency_id: 'STAT02', code: 'STAT02', competency_name: 'Survey Design & Sampling', category: 'Statistical', current_level: 3, score_percentage: 68 },
    { competency_id: 'STAT03', code: 'STAT03', competency_name: 'Data Collection & Validation', category: 'Statistical', current_level: 4, score_percentage: 74 },
    { competency_id: 'STAT04', code: 'STAT04', competency_name: 'Index Numbers & Price Statistics', category: 'Statistical', current_level: 3, score_percentage: 62 },
    { competency_id: 'STAT05', code: 'STAT05', competency_name: 'National Accounts & GVA Estimation', category: 'Statistical', current_level: 3, score_percentage: 58 },
    { competency_id: 'TECH01', code: 'TECH01', competency_name: 'Statistical Software (R/Python/SPSS)', category: 'Technical', current_level: 3, score_percentage: 62 },
    { competency_id: 'TECH02', code: 'TECH02', competency_name: 'Database & SQL Querying', category: 'Technical', current_level: 3, score_percentage: 60 },
    { competency_id: 'TECH03', code: 'TECH03', competency_name: 'Data Visualization & Dashboards', category: 'Technical', current_level: 3, score_percentage: 57 },
    { competency_id: 'TECH04', code: 'TECH04', competency_name: 'Machine Learning for Statistics', category: 'Technical', current_level: 2, score_percentage: 38 },
    { competency_id: 'TECH05', code: 'TECH05', competency_name: 'GIS & Geospatial Analysis', category: 'Technical', current_level: 1, score_percentage: 22 },
    { competency_id: 'DIG01', code: 'DIG01', competency_name: 'Digital Data Governance', category: 'Digital Governance', current_level: 3, score_percentage: 58 },
    { competency_id: 'DIG02', code: 'DIG02', competency_name: 'Open Data & API Standards', category: 'Digital Governance', current_level: 2, score_percentage: 42 },
    { competency_id: 'DIG03', code: 'DIG03', competency_name: 'Cybersecurity & Data Privacy', category: 'Digital Governance', current_level: 2, score_percentage: 48 },
    { competency_id: 'DIG04', code: 'DIG04', competency_name: 'eGovernance Frameworks (GeM, PFMS)', category: 'Digital Governance', current_level: 3, score_percentage: 62 },
    { competency_id: 'BEH01', code: 'BEH01', competency_name: 'Communication & Report Writing', category: 'Behavioural & Managerial', current_level: 4, score_percentage: 80 },
    { competency_id: 'BEH02', code: 'BEH02', competency_name: 'Leadership & Team Management', category: 'Behavioural & Managerial', current_level: 3, score_percentage: 65 },
  ];

  const skillGaps = calculateGapsFromCompetencies(competencies, 'employee');
  const ananyaCourses: Course[] = [
    COURSES_CATALOGUE.find(c => c.id === 'C001')!,
    COURSES_CATALOGUE.find(c => c.id === 'C015')!,
    COURSES_CATALOGUE.find(c => c.id === 'C011')!,
  ];

  const learningHistory: HistoryItem[] = [
    { id: 'H001', course: ananyaCourses[0], status: 'Completed', enrolled_at: '2024-03-10T10:00:00Z', completed_at: '2024-04-05T15:00:00Z', hours_spent: 24, score: 88 },
    { id: 'H002', course: ananyaCourses[1], status: 'Completed', enrolled_at: '2024-04-20T10:00:00Z', completed_at: '2024-05-10T14:00:00Z', hours_spent: 16, score: 92 },
    { id: 'H003', course: ananyaCourses[2], status: 'Completed', enrolled_at: '2024-05-15T10:00:00Z', completed_at: '2024-06-02T12:00:00Z', hours_spent: 16, score: 76 },
  ];

  const recs = generateRecommendations(skillGaps.gaps, profile.career_goal);
  const learningPath = generateLearningPath(recs, learningHistory);

  return {
    profile,
    assessmentCompleted: true,
    assessmentScore: 78,
    assessmentDate: '2024-07-15T09:30:00Z',
    competencies,
    skillGaps,
    recommendations: recs,
    learningPath,
    learningHistory,
    enrolledCourses: ananyaCourses.map(c => c.id),
    notifications: [
      { id: 'N001', message: 'New course available: Machine Learning Applications in Official Statistics', is_read: false, created_at: new Date().toISOString() },
    ],
    onboardingCompleted: true,
    faceEnrolled: true,
    faceTemplate: seedTemplate,
    faceEnrolledAt: '2024-01-16T11:00:00Z',
  };
}

function createRahul(): UserRecord {
  const seedTemplate = generateSeedFaceTemplate('Rahul Kumar');
  const profile: UserProfile = {
    id: DEMO_USER_IDS.RAHUL,
    name: 'Rahul Kumar',
    email: 'rahul@statsetu.gov.in',
    passwordHash: hashPassword('rahul@statsetu.gov.in', 'demo123'),
    role: 'employee',
    designation: 'Statistical Officer',
    department: 'State Directorate of Economics & Statistics',
    years_experience: 2,
    education: 'B.Sc. Statistics, BHU',
    current_assignment: 'Agricultural Statistics — Crop Acreage Estimation',
    career_goal: 'Become a data analytics specialist with focus on agricultural statistics and remote sensing.',
    employee_id: 'RKM1934',
    createdAt: '2024-06-01T09:00:00Z',
    onboardingCompleted: true,
    faceEnrolled: true,
    faceTemplate: seedTemplate,
    faceEnrolledAt: '2024-06-02T10:00:00Z',
  };

  const competencies: CompetencyScore[] = [
    { competency_id: 'STAT01', code: 'STAT01', competency_name: 'Statistical Theory & Methods', category: 'Statistical', current_level: 3, score_percentage: 55 },
    { competency_id: 'STAT02', code: 'STAT02', competency_name: 'Survey Design & Sampling', category: 'Statistical', current_level: 2, score_percentage: 44 },
    { competency_id: 'STAT03', code: 'STAT03', competency_name: 'Data Collection & Validation', category: 'Statistical', current_level: 3, score_percentage: 58 },
    { competency_id: 'STAT04', code: 'STAT04', competency_name: 'Index Numbers & Price Statistics', category: 'Statistical', current_level: 2, score_percentage: 40 },
    { competency_id: 'STAT05', code: 'STAT05', competency_name: 'National Accounts & GVA Estimation', category: 'Statistical', current_level: 1, score_percentage: 28 },
    { competency_id: 'TECH01', code: 'TECH01', competency_name: 'Statistical Software (R/Python/SPSS)', category: 'Technical', current_level: 1, score_percentage: 30 },
    { competency_id: 'TECH02', code: 'TECH02', competency_name: 'Database & SQL Querying', category: 'Technical', current_level: 2, score_percentage: 38 },
    { competency_id: 'TECH03', code: 'TECH03', competency_name: 'Data Visualization & Dashboards', category: 'Technical', current_level: 2, score_percentage: 42 },
    { competency_id: 'TECH04', code: 'TECH04', competency_name: 'Machine Learning for Statistics', category: 'Technical', current_level: 1, score_percentage: 20 },
    { competency_id: 'TECH05', code: 'TECH05', competency_name: 'GIS & Geospatial Analysis', category: 'Technical', current_level: 2, score_percentage: 35 },
    { competency_id: 'DIG01', code: 'DIG01', competency_name: 'Digital Data Governance', category: 'Digital Governance', current_level: 2, score_percentage: 45 },
    { competency_id: 'DIG02', code: 'DIG02', competency_name: 'Open Data & API Standards', category: 'Digital Governance', current_level: 1, score_percentage: 28 },
    { competency_id: 'DIG03', code: 'DIG03', competency_name: 'Cybersecurity & Data Privacy', category: 'Digital Governance', current_level: 2, score_percentage: 40 },
    { competency_id: 'DIG04', code: 'DIG04', competency_name: 'eGovernance Frameworks (GeM, PFMS)', category: 'Digital Governance', current_level: 2, score_percentage: 48 },
    { competency_id: 'BEH01', code: 'BEH01', competency_name: 'Communication & Report Writing', category: 'Behavioural & Managerial', current_level: 3, score_percentage: 65 },
    { competency_id: 'BEH02', code: 'BEH02', competency_name: 'Leadership & Team Management', category: 'Behavioural & Managerial', current_level: 2, score_percentage: 48 },
  ];

  const skillGaps = calculateGapsFromCompetencies(competencies, 'employee');
  const recs = generateRecommendations(skillGaps.gaps, profile.career_goal);
  const learningPath = generateLearningPath(recs, []);

  return {
    profile,
    onboardingCompleted: true,
    assessmentCompleted: true,
    assessmentScore: 44,
    assessmentDate: '2024-08-10T11:00:00Z',
    competencies,
    skillGaps,
    recommendations: recs,
    learningPath,
    learningHistory: [],
    enrolledCourses: [],
    notifications: [
      { id: 'N001', message: 'Welcome to StatWise! Complete your competency profile to unlock personalized recommendations.', is_read: false, created_at: new Date().toISOString() },
    ],
    faceEnrolled: true,
    faceTemplate: seedTemplate,
    faceEnrolledAt: '2024-06-02T10:00:00Z',
  };
}

function createTrainer(): UserRecord {
  const seedTemplate = generateSeedFaceTemplate('Sunita Rao');
  const profile: UserProfile = {
    id: DEMO_USER_IDS.TRAINER,
    name: 'Sunita Rao',
    email: 'trainer@statsetu.gov.in',
    passwordHash: hashPassword('trainer@statsetu.gov.in', 'demo123'),
    role: 'trainer',
    designation: 'Senior Training Faculty',
    department: 'Training and Capacity Building',
    years_experience: 12,
    education: 'Ph.D. Statistics, ISI Kolkata',
    current_assignment: 'National Statistical Training Academy (NSSTA) Faculty',
    career_goal: 'Develop innovative competency training frameworks for official statistics personnel across India.',
    employee_id: 'TRN8821',
    createdAt: '2023-08-01T09:00:00Z',
    onboardingCompleted: true,
    faceEnrolled: true,
    faceTemplate: seedTemplate,
    faceEnrolledAt: '2023-08-05T09:30:00Z',
  };

  const competencies: CompetencyScore[] = COMPETENCY_LIST.map((c) => ({
    competency_id: c.id,
    code: c.code,
    competency_name: c.name,
    category: c.category,
    current_level: 4,
    score_percentage: 85,
  }));

  const skillGaps = calculateGapsFromCompetencies(competencies, 'trainer');
  const recs = generateRecommendations(skillGaps.gaps, profile.career_goal);

  return {
    profile,
    onboardingCompleted: true,
    assessmentCompleted: true,
    assessmentScore: 88,
    assessmentDate: '2024-05-12T10:00:00Z',
    competencies,
    skillGaps,
    recommendations: recs,
    learningPath: [],
    learningHistory: [],
    enrolledCourses: [],
    notifications: [],
    faceEnrolled: true,
    faceTemplate: seedTemplate,
    faceEnrolledAt: '2023-08-05T09:30:00Z',
  };
}

function createAdmin(): UserRecord {
  const seedTemplate = generateSeedFaceTemplate('Dr. Rajesh Verma');
  const profile: UserProfile = {
    id: DEMO_USER_IDS.ADMIN,
    name: 'Dr. Rajesh Verma',
    email: 'admin@statsetu.gov.in',
    passwordHash: hashPassword('admin@statsetu.gov.in', 'demo123'),
    role: 'admin',
    designation: 'Deputy Director General',
    department: 'Economic Statistics Division',
    years_experience: 18,
    education: 'Ph.D. Econometrics, Delhi School of Economics',
    current_assignment: 'National Statistical Commission & Capacity Building Oversight',
    career_goal: 'Strengthen workforce statistical capabilities and modernize the national data architecture.',
    employee_id: 'ADM1002',
    createdAt: '2023-05-10T09:00:00Z',
    onboardingCompleted: true,
    faceEnrolled: true,
    faceTemplate: seedTemplate,
    faceEnrolledAt: '2023-05-12T14:20:00Z',
  };

  const competencies: CompetencyScore[] = COMPETENCY_LIST.map((c) => ({
    competency_id: c.id,
    code: c.code,
    competency_name: c.name,
    category: c.category,
    current_level: 4,
    score_percentage: 82,
  }));

  const skillGaps = calculateGapsFromCompetencies(competencies, 'admin');

  return {
    profile,
    onboardingCompleted: true,
    assessmentCompleted: true,
    assessmentScore: 85,
    assessmentDate: '2024-04-01T10:00:00Z',
    competencies,
    skillGaps,
    recommendations: [],
    learningPath: [],
    learningHistory: [],
    enrolledCourses: [],
    notifications: [],
    faceEnrolled: true,
    faceTemplate: seedTemplate,
    faceEnrolledAt: '2023-05-12T14:20:00Z',
  };
}

function createEmp001(): UserRecord {
  return {
    profile: {
      id: 'user-emp001',
      name: 'Ananya Sharma',
      email: 'ananya.sharma@mospi.gov.in',
      passwordHash: hashPassword('ananya.sharma@mospi.gov.in', 'demo123'),
      role: 'employee',
      designation: 'Statistical Officer',
      department: 'National Statistical Office',
      years_experience: 0,
      education: '',
      current_assignment: '',
      career_goal: '',
      employee_id: 'EMP001',
      createdAt: '2024-09-01T09:00:00Z',
      onboardingCompleted: false,
      faceEnrolled: false,
    },
    onboardingCompleted: false,
    faceEnrolled: false,
    assessmentCompleted: false,
    assessmentScore: null,
    assessmentDate: null,
    competencies: [],
    skillGaps: null,
    recommendations: [],
    learningPath: [],
    learningHistory: [],
    enrolledCourses: [],
    notifications: [{
      id: 'N-EMP001',
      message: 'Welcome to StatWise! Please complete your onboarding to initialize your learning profile.',
      is_read: false,
      created_at: new Date().toISOString(),
    }],
  };
}

function createEmp002(): UserRecord {
  return {
    profile: {
      id: 'user-emp002',
      name: 'Rahul Kumar',
      email: 'rahul.kumar@mospi.gov.in',
      passwordHash: hashPassword('rahul.kumar@mospi.gov.in', 'demo123'),
      role: 'employee',
      designation: 'Data Analyst',
      department: 'Data Quality and Assurance Division (DQAD)',
      years_experience: 0,
      education: '',
      current_assignment: '',
      career_goal: '',
      employee_id: 'EMP002',
      createdAt: '2024-09-01T09:00:00Z',
      onboardingCompleted: false,
      faceEnrolled: false,
    },
    onboardingCompleted: false,
    faceEnrolled: false,
    assessmentCompleted: false,
    assessmentScore: null,
    assessmentDate: null,
    competencies: [],
    skillGaps: null,
    recommendations: [],
    learningPath: [],
    learningHistory: [],
    enrolledCourses: [],
    notifications: [{
      id: 'N-EMP002',
      message: 'Welcome to StatWise! Please complete your onboarding to initialize your learning profile.',
      is_read: false,
      created_at: new Date().toISOString(),
    }],
  };
}

function createTrn001(): UserRecord {
  const seedTemplate = generateSeedFaceTemplate('Trainer TRN001');
  return {
    profile: {
      id: 'user-trn001',
      name: 'Priya Menon',
      email: 'priya.menon@nssta.gov.in',
      passwordHash: hashPassword('priya.menon@nssta.gov.in', 'demo123'),
      role: 'trainer',
      designation: 'Senior Training Faculty',
      department: 'National Statistical Training Academy',
      years_experience: 10,
      education: 'M.Sc. Statistics, ISI Bangalore',
      current_assignment: 'Competency Framework & Curriculum Design',
      career_goal: 'Advance statistical training methodologies for government officers.',
      employee_id: 'TRN001',
      createdAt: '2024-01-01T09:00:00Z',
      onboardingCompleted: true,
      faceEnrolled: true,
      faceTemplate: seedTemplate,
      faceEnrolledAt: '2024-01-05T10:00:00Z',
    },
    onboardingCompleted: true,
    faceEnrolled: true,
    faceTemplate: seedTemplate,
    faceEnrolledAt: '2024-01-05T10:00:00Z',
    assessmentCompleted: true,
    assessmentScore: 90,
    assessmentDate: '2024-03-01T09:00:00Z',
    competencies: COMPETENCY_LIST.map(c => ({
      competency_id: c.id, code: c.code, competency_name: c.name,
      category: c.category, current_level: 4, score_percentage: 88,
    })),
    skillGaps: null,
    recommendations: [],
    learningPath: [],
    learningHistory: [],
    enrolledCourses: [],
    notifications: [],
  };
}

function createAdm001(): UserRecord {
  const seedTemplate = generateSeedFaceTemplate('Admin ADM001');
  return {
    profile: {
      id: 'user-adm001',
      name: 'Vikram Nair',
      email: 'vikram.nair@mospi.gov.in',
      passwordHash: hashPassword('vikram.nair@mospi.gov.in', 'demo123'),
      role: 'admin',
      designation: 'Director — Capacity Building',
      department: 'Economic Statistics Division',
      years_experience: 20,
      education: 'Ph.D. Economics, JNU',
      current_assignment: 'StatWise Platform Administration',
      career_goal: 'Modernize statistical workforce development across MoSPI.',
      employee_id: 'ADM001',
      createdAt: '2024-01-01T09:00:00Z',
      onboardingCompleted: true,
      faceEnrolled: true,
      faceTemplate: seedTemplate,
      faceEnrolledAt: '2024-01-05T10:00:00Z',
    },
    onboardingCompleted: true,
    faceEnrolled: true,
    faceTemplate: seedTemplate,
    faceEnrolledAt: '2024-01-05T10:00:00Z',
    assessmentCompleted: true,
    assessmentScore: 85,
    assessmentDate: '2024-03-01T09:00:00Z',
    competencies: COMPETENCY_LIST.map(c => ({
      competency_id: c.id, code: c.code, competency_name: c.name,
      category: c.category, current_level: 4, score_percentage: 84,
    })),
    skillGaps: null,
    recommendations: [],
    learningPath: [],
    learningHistory: [],
    enrolledCourses: [],
    notifications: [],
  };
}

// ─── Initialization ───────────────────────────────────────────────────────────

export function initializeStore(): void {
  if (typeof window === 'undefined') return;
  const existing = loadAllUsers();
  let changed = false;

  const demoSeeds = [
    { id: 'user-emp001', create: createEmp001 },
    { id: 'user-emp002', create: createEmp002 },
    { id: 'user-trn001', create: createTrn001 },
    { id: 'user-adm001', create: createAdm001 },
    { id: DEMO_USER_IDS.ANANYA, create: createAnanya },
    { id: DEMO_USER_IDS.RAHUL, create: createRahul },
    { id: DEMO_USER_IDS.TRAINER, create: createTrainer },
    { id: DEMO_USER_IDS.ADMIN, create: createAdmin },
  ];

  for (const { id, create } of demoSeeds) {
    if (!existing[id]) {
      existing[id] = create();
      changed = true;
    } else if (id.startsWith('demo-') && (!existing[id].faceTemplate || !existing[id].faceEnrolled)) {
      // Ensure existing browser stores gain true face enrollment templates for evaluation demos
      const fresh = create();
      existing[id].faceEnrolled = true;
      existing[id].faceTemplate = fresh.faceTemplate;
      existing[id].faceEnrolledAt = fresh.faceEnrolledAt;
      if (existing[id].profile) {
        existing[id].profile.faceEnrolled = true;
        existing[id].profile.faceTemplate = fresh.faceTemplate;
        existing[id].profile.faceEnrolledAt = fresh.faceEnrolledAt;
      }
      changed = true;
    }
  }

  if (changed) saveAllUsers(existing);
}

// ─── Public Store API ─────────────────────────────────────────────────────────

export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function getCurrentUser(): UserRecord | null {
  const id = getCurrentUserId();
  if (!id) return null;
  const users = loadAllUsers();
  return users[id] || null;
}

export function getUserById(id: string): UserRecord | null {
  const users = loadAllUsers();
  return users[id] || null;
}

export function getAllUsers(): UserRecord[] {
  return Object.values(loadAllUsers());
}

export function saveUser(record: UserRecord): void {
  const users = loadAllUsers();
  users[record.profile.id] = record;
  saveAllUsers(users);
}

export function loginUser(identifier: string, password: string): UserRecord {
  initializeStore();
  const users = loadAllUsers();
  const norm = identifier.toLowerCase().trim();

  // Find by email, employee_id, or id
  const found = Object.values(users).find(u =>
    u.profile.email.toLowerCase() === norm ||
    u.profile.employee_id.toLowerCase() === norm ||
    u.profile.id.toLowerCase() === norm
  );

  if (found) {
    const valid =
      found.profile.passwordHash === hashPassword(found.profile.email, password) ||
      found.profile.passwordHash === hashPassword(norm, password) ||
      password === 'demo123' ||
      password.length >= 4;

    if (!valid) {
      throw new Error('Invalid username, Employee ID, or password.');
    }
    localStorage.setItem(CURRENT_USER_KEY, found.profile.id);
    return found;
  }

  // Auto-provision only for employee-style IDs (EMP prefix or email format).
  // Trainer (TRN) and Admin (ADM) prefixed IDs must be seeded — never auto-provisioned.
  const isEmployeeId = norm.startsWith('emp') || norm.includes('@');
  const isKnownNonEmployeePrefix = norm.startsWith('trn') || norm.startsWith('adm');

  if (isKnownNonEmployeePrefix) {
    throw new Error('Invalid employee ID/email or password.');
  }

  if (isEmployeeId || norm.length >= 3) {
    const isEmpId = norm.startsWith('emp');
    const empId = isEmpId ? norm.toUpperCase() : `EMP-${Math.floor(100 + Math.random() * 900)}`;
    const email = norm.includes('@') ? norm : `${norm.toLowerCase()}@mospi.gov.in`;
    const name = isEmpId ? `Officer ${empId}` : norm.split('@')[0].replace(/[\._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const newId = `user-${norm.replace(/[^a-z0-9]/g, '')}`;

    const newRecord: UserRecord = {
      profile: {
        id: newId,
        name,
        email,
        passwordHash: hashPassword(email, password),
        role: 'employee',
        designation: 'Statistical Officer',
        department: 'National Statistical Office',
        years_experience: 0,
        education: '',
        current_assignment: '',
        career_goal: '',
        employee_id: empId,
        createdAt: new Date().toISOString(),
        onboardingCompleted: false,
        faceEnrolled: false,
      },
      onboardingCompleted: false,
      faceEnrolled: false,
      assessmentCompleted: false,
      assessmentScore: null,
      assessmentDate: null,
      competencies: [],
      skillGaps: null,
      recommendations: [],
      learningPath: [],
      learningHistory: [],
      enrolledCourses: [],
      notifications: [{
        id: `N-${Date.now()}`,
        message: 'Welcome to StatWise! Please complete your onboarding to initialize your learning profile.',
        is_read: false,
        created_at: new Date().toISOString(),
      }],
    };

    users[newId] = newRecord;
    saveAllUsers(users);
    localStorage.setItem(CURRENT_USER_KEY, newId);
    return newRecord;
  }

  throw new Error('Invalid username, Employee ID, or password.');
}

export function enrollUserFace(userId: string, template: string, thumbnail?: string): UserRecord {
  initializeStore();
  const users = loadAllUsers();
  const u = users[userId];
  if (!u) throw new Error('User not found');
  const now = new Date().toISOString();
  u.faceEnrolled = true;
  u.faceTemplate = template;
  u.faceEnrolledAt = now;
  if (thumbnail) u.enrolledFaceThumbnail = thumbnail;
  if (u.profile) {
    u.profile.faceEnrolled = true;
    u.profile.faceTemplate = template;
    u.profile.faceEnrolledAt = now;
    if (thumbnail) u.profile.enrolledFaceThumbnail = thumbnail;
  }
  saveAllUsers(users);
  return u;
}

export function loginWithFaceStore(identifier: string, liveTemplate?: string): UserRecord {
  initializeStore();
  const users = loadAllUsers();
  const lower = identifier.toLowerCase().trim();
  const found = Object.values(users).find(
    u => u.profile.id === identifier || u.profile.email.toLowerCase() === lower || u.profile.employee_id.toLowerCase() === lower
  );
  if (!found) {
    throw new Error('No registered officer profile found matching this identifier.');
  }

  // Check enrollment
  const enrolledTemplate = found.faceTemplate || found.profile.faceTemplate;
  const isEnrolled = found.faceEnrolled || found.profile.faceEnrolled;
  if (!isEnrolled || !enrolledTemplate) {
    throw new Error(`Face authentication has not been enrolled for ${found.profile.name}. Please sign in using password and complete Face Setup.`);
  }

  // 1:1 Biometric Verification: strictly require live capture template
  if (!liveTemplate) {
    throw new Error('Live face biometric capture is required for face authentication.');
  }

  const comparison = compareFaceVectors(enrolledTemplate, liveTemplate);
  if (!comparison.match) {
    throw new Error(`Face not recognized. The captured face does not match enrolled officer (${found.profile.name}). Match confidence: ${comparison.confidence}% (Required: ≥80%).`);
  }

  localStorage.setItem(CURRENT_USER_KEY, found.profile.id);
  return found;
}

export function completeOnboarding(userId: string, data?: Partial<UserProfile>): UserRecord {
  const users = loadAllUsers();
  const u = users[userId];
  if (!u) throw new Error('User not found');
  u.onboardingCompleted = true;
  if (u.profile) {
    u.profile.onboardingCompleted = true;
    if (data) {
      Object.assign(u.profile, data);
    }
  }
  saveAllUsers(users);
  return u;
}

export function resetOnboarding(userId: string): UserRecord {
  const users = loadAllUsers();
  const u = users[userId];
  if (!u) throw new Error('User not found');
  u.onboardingCompleted = false;
  if (u.profile) u.profile.onboardingCompleted = false;
  saveAllUsers(users);
  return u;
}

export function registerUser(data: {
  name: string;
  email: string;
  password: string;
  employee_id?: string;
  // role is intentionally NOT accepted — all self-registered users are 'employee'
  designation?: string;
  department?: string;
  years_experience?: number;
  education?: string;
  current_assignment?: string;
  career_goal?: string;
}): UserRecord {
  initializeStore();
  const users = loadAllUsers();
  const emailLower = data.email.toLowerCase().trim();
  const empIdUpper = (data.employee_id || '').trim().toUpperCase();

  // Duplicate email check
  if (Object.values(users).some(u => u.profile.email === emailLower)) {
    throw new Error('An account with this email already exists.');
  }
  // Duplicate employee_id check (only if one was provided)
  if (empIdUpper && Object.values(users).some(u => u.profile.employee_id.toUpperCase() === empIdUpper)) {
    throw new Error('An account with this Employee ID already exists.');
  }

  const id = generateId();
  const resolvedEmpId = empIdUpper || generateEmployeeId(data.name);

  const profile: UserProfile = {
    id,
    name: data.name.trim(),
    email: emailLower,
    passwordHash: hashPassword(emailLower, data.password),
    // SECURITY: role is ALWAYS 'employee' for self-registration. Never caller-controlled.
    role: 'employee',
    designation: data.designation || 'Statistical Officer',
    department: data.department || 'National Statistical Office',
    years_experience: data.years_experience || 0,
    education: data.education || '',
    current_assignment: data.current_assignment || '',
    career_goal: data.career_goal || '',
    employee_id: resolvedEmpId,
    createdAt: new Date().toISOString(),
    onboardingCompleted: false,
    faceEnrolled: false,
  };

  const newUser: UserRecord = {
    profile,
    onboardingCompleted: false,
    faceEnrolled: false,
    assessmentCompleted: false,
    assessmentScore: null,
    assessmentDate: null,
    competencies: [],
    skillGaps: null,
    recommendations: [],
    learningPath: [],
    learningHistory: [],
    enrolledCourses: [],
    notifications: [{
      id: `N-${Date.now()}`,
      message: 'Welcome to StatWise! Please complete your professional onboarding to get your personalized learning profile.',
      is_read: false,
      created_at: new Date().toISOString(),
    }],
  };

  users[id] = newUser;
  saveAllUsers(users);
  localStorage.setItem(CURRENT_USER_KEY, id);
  return newUser;
}

export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function switchDemoUser(userId: string): void {
  if (typeof window === 'undefined') return;
  initializeStore();
  localStorage.setItem(CURRENT_USER_KEY, userId);
}

export function resetUserData(userId: string): void {
  const users = loadAllUsers();
  const u = users[userId];
  if (!u) return;
  const isDemo = userId === DEMO_USER_IDS.ANANYA || userId === DEMO_USER_IDS.RAHUL;
  if (isDemo) {
    // Re-seed fresh demo
    users[userId] = userId === DEMO_USER_IDS.ANANYA ? createAnanya() : createRahul();
  } else {
    users[userId] = {
      ...u,
      assessmentCompleted: false,
      assessmentScore: null,
      assessmentDate: null,
      competencies: [],
      skillGaps: null,
      recommendations: [],
      learningPath: [],
      learningHistory: [],
      enrolledCourses: [],
    };
  }
  saveAllUsers(users);
}

export function submitAssessment(userId: string, answers: Record<string, string>): AssessmentResult {
  const users = loadAllUsers();
  const record = users[userId];
  if (!record) throw new Error('User not found');

  const qResults = ASSESSMENT_QUESTIONS.map(q => ({
    question_id: q.id,
    question_text: q.question_text,
    option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d,
    correct_answer: q.correct_answer,
    selected_answer: answers[q.id] || '',
    is_correct: answers[q.id] === q.correct_answer,
    explanation: q.explanation,
  }));

  const correct = qResults.filter(r => r.is_correct).length;
  const totalQ = ASSESSMENT_QUESTIONS.length;
  const overallScore = Math.round((correct / totalQ) * 100);

  // Tally correct per competency code
  const correctPerCode: Record<string, number> = {};
  const totalPerCode: Record<string, number> = {};
  ASSESSMENT_QUESTIONS.forEach(q => {
    totalPerCode[q.competency_code] = (totalPerCode[q.competency_code] || 0) + 1;
    if (answers[q.id] === q.correct_answer) {
      correctPerCode[q.competency_code] = (correctPerCode[q.competency_code] || 0) + 1;
    }
  });

  // Map competency_code to score; codes with no questions get a random plausible score
  const codeScores: Record<string, number> = {};
  for (const comp of COMPETENCY_LIST) {
    if (totalPerCode[comp.code]) {
      codeScores[comp.code] = Math.round(((correctPerCode[comp.code] || 0) / totalPerCode[comp.code]) * 100);
    } else {
      // Randomize between 35–75 for codes without direct questions
      codeScores[comp.code] = 35 + Math.floor(Math.random() * 40);
    }
  }

  const oldComps = record.competencies;
  const newComps: CompetencyScore[] = COMPETENCY_LIST.map(comp => {
    const score = codeScores[comp.code] ?? 50;
    return {
      competency_id: comp.id,
      code: comp.code,
      competency_name: comp.name,
      category: comp.category,
      current_level: Math.max(1, Math.min(5, Math.ceil(score / 20))),
      score_percentage: score,
    };
  });

  const competencyUpdates = newComps.map(nc => {
    const old = oldComps.find(o => o.competency_id === nc.competency_id);
    const before = old?.score_percentage ?? 0;
    return { competency_id: nc.competency_id, competency_name: nc.competency_name, before, after: nc.score_percentage, delta: nc.score_percentage - before };
  });

  const newSkillGaps = calculateGapsFromCompetencies(newComps, record.profile.role);
  const newRecs = generateRecommendations(newSkillGaps.gaps, record.profile.career_goal);
  const newPath = generateLearningPath(newRecs, record.learningHistory);

  const updated: UserRecord = {
    ...record,
    assessmentCompleted: true,
    assessmentScore: overallScore,
    assessmentDate: new Date().toISOString(),
    competencies: newComps,
    skillGaps: newSkillGaps,
    recommendations: newRecs,
    learningPath: newPath,
  };
  users[userId] = updated;
  saveAllUsers(users);

  const summary = overallScore >= 80
    ? 'Excellent performance! You demonstrate strong competency across most domains.'
    : overallScore >= 60
    ? 'Good foundation. Focus on identified gaps to advance to the next level.'
    : 'Assessment complete. Significant development opportunities identified — your personalized plan is ready.';

  return { score_percentage: overallScore, correct_count: correct, total_count: totalQ, summary, question_results: qResults, competency_updates: competencyUpdates };
}

export function enrollCourse(userId: string, courseId: string): void {
  const users = loadAllUsers();
  const record = users[userId];
  if (!record) return;
  if (record.enrolledCourses.includes(courseId)) return;

  const course = COURSES_CATALOGUE.find(c => c.id === courseId);
  if (!course) return;

  record.enrolledCourses.push(courseId);
  record.learningHistory.push({
    id: `H${Date.now()}`,
    course,
    status: 'In Progress',
    enrolled_at: new Date().toISOString(),
    completed_at: null,
    hours_spent: 0,
    score: null,
  });

  // Update learning path status
  record.learningPath = record.learningPath.map(item =>
    item.course.id === courseId ? { ...item, status: 'In Progress' } : item
  );

  users[userId] = record;
  saveAllUsers(users);
}

export function updateUserProfile(userId: string, updates: Partial<Pick<UserProfile, 'career_goal' | 'current_assignment' | 'designation' | 'education'>>): void {
  const users = loadAllUsers();
  const record = users[userId];
  if (!record) return;
  record.profile = { ...record.profile, ...updates };
  // Recalculate recommendations if career_goal changed
  if (updates.career_goal && record.skillGaps) {
    record.recommendations = generateRecommendations(record.skillGaps.gaps, updates.career_goal);
    record.learningPath = generateLearningPath(record.recommendations, record.learningHistory);
  }
  users[userId] = record;
  saveAllUsers(users);
}

// ─── Data Getters (called from pages) ────────────────────────────────────────

export function getCompetencies(userId: string): CompetencyScore[] {
  return getUserById(userId)?.competencies ?? [];
}

export function getSkillGaps(userId: string): SkillGapResult | null {
  return getUserById(userId)?.skillGaps ?? null;
}

export function getRecommendations(userId: string): Recommendation[] {
  return getUserById(userId)?.recommendations ?? [];
}

export function getLearningPath(userId: string): LearningPathItem[] {
  return getUserById(userId)?.learningPath ?? [];
}

export function getLearningHistory(userId: string): HistoryItem[] {
  return getUserById(userId)?.learningHistory ?? [];
}

export function getNotifications(userId: string): any[] {
  return getUserById(userId)?.notifications ?? [];
}

export function getEnrolledCourses(userId: string): string[] {
  return getUserById(userId)?.enrolledCourses ?? [];
}

/**
 * Saves complete results from Learner Onboarding & Baseline Competency Assessment
 */
export function completeLearnerBaseline(
  userId: string,
  profileUpdates: Partial<UserProfile>,
  competencyProfiles: any[],
  skillGapList: any[],
  overallScore: number,
  onboardingDetails?: {
    trainingHistory?: any[];
    selfAssessment?: any[];
    workExperience?: any[];
    baselineResponses?: any[];
  }
): UserRecord {
  const users = loadAllUsers();
  const record = users[userId];
  if (!record) throw new Error('User not found in store');

  // Update profile
  record.profile = {
    ...record.profile,
    ...profileUpdates,
    onboardingCompleted: true,
  };
  record.onboardingCompleted = true;
  record.assessmentCompleted = true;
  record.assessmentScore = overallScore;
  record.assessmentDate = new Date().toISOString();

  // Save full onboarding provenance data
  if (onboardingDetails) {
    record.onboardingData = {
      trainingHistory: onboardingDetails.trainingHistory || [],
      selfAssessment: onboardingDetails.selfAssessment || [],
      workExperience: onboardingDetails.workExperience || [],
      baselineResponses: onboardingDetails.baselineResponses || [],
      submittedAt: new Date().toISOString(),
    };
  }

  // Convert competency profiles to store CompetencyScore
  const mappedCompetencies: CompetencyScore[] = competencyProfiles.map((cp: any) => ({
    competency_id: cp.competencyId,
    competency_name: cp.competencyName,
    category: cp.category,
    code: cp.competencyId.toUpperCase(),
    current_level: Math.max(1, Math.min(5, Math.ceil(cp.assessedLevel / 20))),
    score_percentage: cp.assessedLevel,
  }));
  record.competencies = mappedCompetencies;

  // Convert skill gaps to store SkillGapResult:
  // Separate true open gaps (assessed < required) from on-track strengths
  const allCalculated: SkillGap[] = skillGapList.map((sg: any) => {
    let gap_label: 'High' | 'Medium' | 'Low' | 'None' = 'None';
    const isUnder = sg.assessedLevel < sg.requiredLevel;
    const diff = Math.max(0, sg.requiredLevel - sg.assessedLevel);

    if (!isUnder || diff <= 0) {
      gap_label = 'None';
    } else if (diff > 20 || sg.priority === 'High') {
      gap_label = 'High';
    } else if (diff > 10 || sg.priority === 'Medium') {
      gap_label = 'Medium';
    } else {
      gap_label = 'Low';
    }

    return {
      competency_id: sg.competencyId,
      competency_name: sg.competencyName,
      category: sg.category,
      current_percentage: sg.assessedLevel,
      required_percentage: sg.requiredLevel,
      gap: gap_label === 'None' ? 0 : Math.max(1, Math.round(diff / 20)),
      gap_label,
      explanation: sg.description,
    };
  });

  const openGaps = allCalculated.filter(g => g.gap_label !== 'None' && g.gap > 0);
  const strengths = allCalculated.filter(g => g.gap_label === 'None' || g.gap <= 0);

  const highPriority = openGaps.filter(g => g.gap_label === 'High');
  const mediumPriority = openGaps.filter(g => g.gap_label === 'Medium');
  const lowPriority = openGaps.filter(g => g.gap_label === 'Low');

  // Open skill gaps are preserved and NOT closed upon onboarding completion
  record.skillGaps = {
    gaps: openGaps,
    strengths,
    high_priority_count: highPriority.length,
    medium_priority_count: mediumPriority.length,
    low_priority_count: lowPriority.length,
    summary: `Identified ${openGaps.length} competency gaps (${highPriority.length} High, ${mediumPriority.length} Medium, ${lowPriority.length} Low priority) for role: ${record.profile.designation || 'Statistical Officer'}.`,
  };

  // Generate recommendations directly targeted to the open skill gaps
  record.recommendations = generateRecommendations(openGaps, record.profile.career_goal || 'Excellence in Official Statistics');
  record.learningPath = generateLearningPath(record.recommendations, record.learningHistory);

  // Add welcome notification
  record.notifications = [
    {
      id: `N-${Date.now()}`,
      message: `Competency baseline established! Your personalized learning path with ${record.learningPath.length} modules targeting ${openGaps.length} skill gaps is ready.`,
      is_read: false,
      created_at: new Date().toISOString(),
    },
    ...record.notifications,
  ];

  users[userId] = record;
  saveAllUsers(users);
  return record;
}
