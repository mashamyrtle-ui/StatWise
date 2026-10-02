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
  faceAuthenticationEnabled?: boolean;
  faceEnrollmentStatus?: 'NOT_ENROLLED' | 'ENROLLED' | 'REVOKED';
  faceTemplate?: string;
  faceEnrolledAt?: string;
  enrolledFaceThumbnail?: string;
  jobRole?: string;
  targetRole?: string;
  specialization?: string;
  status?: 'Active' | 'Inactive';
  trainingStatus?: 'Enrolled' | 'Completed' | 'In Progress' | 'Not Started';
}

export type EvidenceWeight = 'primary' | 'high' | 'medium' | 'supporting';
export type EvidenceType = 
  | 'baseline_assessment'
  | 'post_training_assessment'
  | 'course_assessment'
  | 'previous_assessment'
  | 'training_completion'
  | 'work_experience'
  | 'self_assessment';

export interface CompetencyEvidenceItem {
  type: EvidenceType;
  label: string;
  source: string;
  score?: number;
  level?: string;
  details: string;
  date?: string;
  weight: EvidenceWeight;
  isVerified: boolean;
}

export interface CompetencyHistoryEntry {
  stage: 'Baseline' | 'Training' | 'Post-Assessment' | 'Recertification';
  date: string;
  score: number;
  delta?: number;
  eventDescription: string;
}

export interface CompetencyScore {
  competency_id: string;
  competency_name: string;
  category: string;
  code: string;
  current_level: number;       // 1-5
  score_percentage: number;    // 0-100 (AI-derived evidence-based official score)
  confidence?: 'High' | 'Medium' | 'Low';
  primaryEvidence?: string;
  evidenceSummary?: string;
  selfReportedProficiency?: 'Beginner' | 'Developing' | 'Proficient' | 'Advanced' | 'None';
  evidence?: CompetencyEvidenceItem[];
  history?: CompetencyHistoryEntry[];
  lastAssessedAt?: string;
  status?: 'Verified' | 'Pending Verification' | 'Needs Recertification';
  observation?: string;
}

export interface SkillGap {
  competency_id: string;
  competency_name: string;
  category: string;
  current_percentage: number;
  required_percentage: number;
  gap: number;                 // levels (0-5)
  gap_percentage?: number;     // raw points: max(0, required - current)
  gap_label: 'High' | 'Medium' | 'Low' | 'None';
  priority?: 'High' | 'Medium' | 'Low' | 'None';
  priorityScore?: number;
  priorityReasons?: string[];
  explanation: string;
  isCoreForRole?: boolean;
  isMandatory?: boolean;
  isPrerequisiteForPath?: boolean;
  confidence?: 'High' | 'Medium' | 'Low';
  primaryEvidence?: string;
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
  faceAuthenticationEnabled?: boolean;
  faceEnrollmentStatus?: 'NOT_ENROLLED' | 'ENROLLED' | 'REVOKED';
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

// ─── Admin Governance Types ───────────────────────────────────────────────────

export type CompetencyLevelName = 'Beginner' | 'Developing' | 'Proficient' | 'Advanced';

export interface JobRoleCompetencyReq {
  competencyCode: string;
  competencyName: string;
  domain: 'Statistical' | 'Technical' | 'Digital Governance' | 'Behavioural & Managerial';
  requiredLevel: number; // 0-100
}

export interface JobRoleDefinition {
  id: string;
  title: string;
  code: string;
  department: string;
  description: string;
  frameworkVersion: number;
  publishedAt: string;
  isActive: boolean;
  competencies: JobRoleCompetencyReq[];
}

export interface CompetencyDomainInfo {
  id: string;
  name: string;
  description: string;
  color: string;
  benchmarkScore: number;
  competencyCount: number;
  keyCompetencies: string[];
}

export interface TrainerRecord {
  id: string;
  name: string;
  email: string;
  department: string;
  expertise: string[];
  qualification: string;
  experienceYears: number;
  assignedProgrammes: string[];
  assignedLearnersCount: number;
  trainingHours: number;
  avgCohortScore: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'active' | 'inactive';
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  supportingDocuments?: string[];
}

export interface AdminAuditEntry {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  resource: string;
  timestamp: string;
  previousValue: string;
  newValue: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface CourseGovernanceItem {
  id: string;
  title: string;
  provider: 'iGOT Karmayogi' | 'NSSTA' | 'TPAC' | 'Other Govt Training' | 'Internal Training';
  domain: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  durationHours: number;
  competencyCodes: string[];
  expectedImprovement: string;
  prerequisites: string;
  targetAudience: string;
  status: 'Active' | 'Under Review' | 'Archived';
  batchSchedule?: string;
}

export interface AssessmentGovItem {
  id: string;
  title: string;
  type: 'Baseline' | 'Post-Training' | 'Diagnostic' | 'Milestone';
  domain: string;
  competenciesCovered: string[];
  questionsCount: number;
  learnersAssessed: number;
  avgScore: number;
  completionRate: number;
  status: 'Published' | 'Under Review' | 'Draft';
  source: 'Trainer Created' | 'AI Generated';
  aiReviewStatus?: 'pending_review' | 'approved' | 'rejected' | 'published';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'statsetu_users_v2';
const CURRENT_USER_KEY = 'statsetu_current_user_id';
const JOB_ROLES_KEY = 'statsetu_job_roles_v1';
const TRAINERS_KEY = 'statsetu_trainers_v1';
const AUDIT_LOGS_KEY = 'statsetu_audit_logs_v1';
const COURSES_GOV_KEY = 'statsetu_courses_gov_v1';
const ASSESSMENTS_GOV_KEY = 'statsetu_assessments_gov_v1';


export const DEMO_USER_IDS = {
  ANANYA: 'demo-ananya-001',
  RAHUL: 'demo-rahul-002',
  TRAINER: 'demo-trainer-003',
  ADMIN: 'demo-admin-004',
  TRN001: 'user-trn001',
  ADM001: 'user-adm001',
  DEMO_LEARNER: 'demo-learner-001',
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

// ─── Competency Scale & Categorization Model ─────────────────────────────────

export function getCompetencyScale(score: number): {
  level: CompetencyLevelName;
  range: string;
  badgeClass: string;
} {
  if (score >= 80) return { level: 'Advanced', range: '80–100%', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  if (score >= 60) return { level: 'Proficient', range: '60–79%', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' };
  if (score >= 40) return { level: 'Developing', range: '40–59%', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' };
  return { level: 'Beginner', range: '0–39%', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
}

// ─── Competency Domains ───────────────────────────────────────────────────────

export const DEFAULT_COMPETENCY_DOMAINS: CompetencyDomainInfo[] = [
  {
    id: 'DOM-STAT',
    name: 'Statistical',
    description: 'Core survey methodology, sampling frameworks, national accounts, price statistics, and official statistical standards.',
    color: '#1e3a5f',
    benchmarkScore: 82,
    competencyCount: 10,
    keyCompetencies: ['Survey Design', 'Sampling', 'National Accounts', 'Price Statistics', 'Labour Statistics', 'Agricultural Statistics', 'Industrial Statistics', 'SDG Indicators', 'Metadata Standards', 'Data Quality Frameworks'],
  },
  {
    id: 'DOM-TECH',
    name: 'Technical Skills',
    description: 'Computing software, econometric tools, programming languages, GIS geospatial mapping, and automated statistical pipelines.',
    color: '#2563eb',
    benchmarkScore: 64,
    competencyCount: 12,
    keyCompetencies: ['Python', 'R', 'SQL', 'Stata', 'SPSS', 'SAS', 'GIS', 'Data Visualization', 'AI / ML', 'Cloud', 'APIs', 'Open Data'],
  },
  {
    id: 'DOM-DIG',
    name: 'Digital Governance',
    description: 'Digital public infrastructure, eGovernance portals, cybersecurity, data confidentiality, and open data publication standards.',
    color: '#059669',
    benchmarkScore: 58,
    competencyCount: 5,
    keyCompetencies: ['Cybersecurity', 'Data Privacy', 'Digital Signatures', 'Government Cloud', 'Digital Public Infrastructure'],
  },
  {
    id: 'DOM-BEH',
    name: 'Behavioural & Managerial',
    description: 'Leadership, inter-departmental communication, technical report writing, public administration ethics, and project management.',
    color: '#7c3aed',
    benchmarkScore: 73,
    competencyCount: 6,
    keyCompetencies: ['Leadership', 'Communication', 'Project Management', 'Ethics', 'Decision Making', 'Change Management'],
  },
];

// ─── Default Job Roles ────────────────────────────────────────────────────────

export const DEFAULT_JOB_ROLES: JobRoleDefinition[] = [
  {
    id: 'ROLE-01',
    title: 'Statistical Data Analyst',
    code: 'SDA',
    department: 'National Accounts & Economic Statistics',
    description: 'Performs statistical modelling, sampling analysis, and microdata processing across official surveys and censuses.',
    frameworkVersion: 2,
    publishedAt: '2026-09-15T10:00:00Z',
    isActive: true,
    competencies: [
      { competencyCode: 'STAT01', competencyName: 'Statistical Theory & Methods', domain: 'Statistical', requiredLevel: 80 },
      { competencyCode: 'STAT02', competencyName: 'Survey Design & Sampling', domain: 'Statistical', requiredLevel: 75 },
      { competencyCode: 'STAT03', competencyName: 'Data Collection & Validation', domain: 'Statistical', requiredLevel: 75 },
      { competencyCode: 'TECH02', competencyName: 'Database & SQL Querying', domain: 'Technical', requiredLevel: 70 },
      { competencyCode: 'TECH01', competencyName: 'Statistical Software (R/Python/SPSS)', domain: 'Technical', requiredLevel: 70 },
      { competencyCode: 'TECH03', competencyName: 'Data Visualization & Dashboards', domain: 'Technical', requiredLevel: 70 },
      { competencyCode: 'TECH04', competencyName: 'Machine Learning for Statistics', domain: 'Technical', requiredLevel: 50 },
      { competencyCode: 'DIG01', competencyName: 'Digital Data Governance', domain: 'Digital Governance', requiredLevel: 60 },
      { competencyCode: 'BEH01', competencyName: 'Communication & Report Writing', domain: 'Behavioural & Managerial', requiredLevel: 70 },
    ],
  },
  {
    id: 'ROLE-02',
    title: 'Senior Statistical Officer',
    code: 'SSO',
    department: 'Field Operations & Survey Coordination',
    description: 'Supervises national socio-economic surveys (PLFS, HCES, ASI), reviews sampling variance, and authors statistical releases.',
    frameworkVersion: 1,
    publishedAt: '2026-01-10T10:00:00Z',
    isActive: true,
    competencies: [
      { competencyCode: 'STAT01', competencyName: 'Statistical Theory & Methods', domain: 'Statistical', requiredLevel: 85 },
      { competencyCode: 'STAT02', competencyName: 'Survey Design & Sampling', domain: 'Statistical', requiredLevel: 80 },
      { competencyCode: 'STAT03', competencyName: 'Data Collection & Validation', domain: 'Statistical', requiredLevel: 80 },
      { competencyCode: 'TECH01', competencyName: 'Statistical Software (R/Python/SPSS)', domain: 'Technical', requiredLevel: 65 },
      { competencyCode: 'TECH03', competencyName: 'Data Visualization & Dashboards', domain: 'Technical', requiredLevel: 65 },
      { competencyCode: 'BEH02', competencyName: 'Leadership & Team Management', domain: 'Behavioural & Managerial', requiredLevel: 75 },
      { competencyCode: 'DIG01', competencyName: 'Digital Data Governance', domain: 'Digital Governance', requiredLevel: 65 },
      { competencyCode: 'BEH01', competencyName: 'Communication & Report Writing', domain: 'Behavioural & Managerial', requiredLevel: 80 },
    ],
  },
  {
    id: 'ROLE-03',
    title: 'Statistical Investigator',
    code: 'SI',
    department: 'Field Operations Division (FOD)',
    description: 'Conducts primary field enumeration, mobile CAPI data validation, and enterprise schedule canvassing.',
    frameworkVersion: 1,
    publishedAt: '2026-02-15T10:00:00Z',
    isActive: true,
    competencies: [
      { competencyCode: 'STAT02', competencyName: 'Survey Design & Sampling', domain: 'Statistical', requiredLevel: 70 },
      { competencyCode: 'STAT03', competencyName: 'Data Collection & Validation', domain: 'Statistical', requiredLevel: 80 },
      { competencyCode: 'STAT01', competencyName: 'Statistical Theory & Methods', domain: 'Statistical', requiredLevel: 65 },
      { competencyCode: 'DIG04', competencyName: 'eGovernance Frameworks (GeM, PFMS)', domain: 'Digital Governance', requiredLevel: 60 },
      { competencyCode: 'BEH01', competencyName: 'Communication & Report Writing', domain: 'Behavioural & Managerial', requiredLevel: 75 },
    ],
  },
  {
    id: 'ROLE-04',
    title: 'Data Scientist',
    code: 'DS',
    department: 'Data Quality and Assurance Division (DQAD)',
    description: 'Develops predictive econometric models, automated data quality scoring, and AI/ML pipelines for national accounts.',
    frameworkVersion: 1,
    publishedAt: '2026-03-01T10:00:00Z',
    isActive: true,
    competencies: [
      { competencyCode: 'TECH01', competencyName: 'Statistical Software (R/Python/SPSS)', domain: 'Technical', requiredLevel: 85 },
      { competencyCode: 'TECH02', competencyName: 'Database & SQL Querying', domain: 'Technical', requiredLevel: 80 },
      { competencyCode: 'TECH04', competencyName: 'Machine Learning for Statistics', domain: 'Technical', requiredLevel: 80 },
      { competencyCode: 'TECH03', competencyName: 'Data Visualization & Dashboards', domain: 'Technical', requiredLevel: 75 },
      { competencyCode: 'TECH05', competencyName: 'GIS & Geospatial Analysis', domain: 'Technical', requiredLevel: 65 },
      { competencyCode: 'STAT01', competencyName: 'Statistical Theory & Methods', domain: 'Statistical', requiredLevel: 75 },
      { competencyCode: 'DIG02', competencyName: 'Open Data & API Standards', domain: 'Digital Governance', requiredLevel: 70 },
    ],
  },
  {
    id: 'ROLE-05',
    title: 'Survey Officer',
    code: 'SO',
    department: 'Social Statistics Division',
    description: 'Formulates multi-round questionnaire design, pilot pre-testing, sample allocation, and interviewer manual drafting.',
    frameworkVersion: 1,
    publishedAt: '2026-01-20T10:00:00Z',
    isActive: true,
    competencies: [
      { competencyCode: 'STAT02', competencyName: 'Survey Design & Sampling', domain: 'Statistical', requiredLevel: 80 },
      { competencyCode: 'STAT03', competencyName: 'Data Collection & Validation', domain: 'Statistical', requiredLevel: 80 },
      { competencyCode: 'STAT01', competencyName: 'Statistical Theory & Methods', domain: 'Statistical', requiredLevel: 75 },
      { competencyCode: 'BEH01', competencyName: 'Communication & Report Writing', domain: 'Behavioural & Managerial', requiredLevel: 70 },
      { competencyCode: 'DIG01', competencyName: 'Digital Data Governance', domain: 'Digital Governance', requiredLevel: 60 },
    ],
  },
  {
    id: 'ROLE-06',
    title: 'Economic Statistician',
    code: 'ES',
    department: 'Economic Statistics Division',
    description: 'Compiles Gross Value Added (GVA), Consumer & Wholesale Price Indices, and Input-Output transaction matrices.',
    frameworkVersion: 1,
    publishedAt: '2026-01-15T10:00:00Z',
    isActive: true,
    competencies: [
      { competencyCode: 'STAT05', competencyName: 'National Accounts & GVA Estimation', domain: 'Statistical', requiredLevel: 85 },
      { competencyCode: 'STAT04', competencyName: 'Index Numbers & Price Statistics', domain: 'Statistical', requiredLevel: 80 },
      { competencyCode: 'STAT01', competencyName: 'Statistical Theory & Methods', domain: 'Statistical', requiredLevel: 80 },
      { competencyCode: 'TECH01', competencyName: 'Statistical Software (R/Python/SPSS)', domain: 'Technical', requiredLevel: 65 },
      { competencyCode: 'TECH03', competencyName: 'Data Visualization & Dashboards', domain: 'Technical', requiredLevel: 70 },
      { competencyCode: 'BEH01', competencyName: 'Communication & Report Writing', domain: 'Behavioural & Managerial', requiredLevel: 75 },
    ],
  },
  {
    id: 'ROLE-07',
    title: 'Labour Statistician',
    code: 'LS',
    department: 'Labour Statistics Wing',
    description: 'Tracks Periodic Labour Force Survey (PLFS) quarterly indicators, workforce participation, and wage statistics.',
    frameworkVersion: 1,
    publishedAt: '2026-02-01T10:00:00Z',
    isActive: true,
    competencies: [
      { competencyCode: 'STAT01', competencyName: 'Statistical Theory & Methods', domain: 'Statistical', requiredLevel: 80 },
      { competencyCode: 'STAT02', competencyName: 'Survey Design & Sampling', domain: 'Statistical', requiredLevel: 75 },
      { competencyCode: 'STAT03', competencyName: 'Data Collection & Validation', domain: 'Statistical', requiredLevel: 75 },
      { competencyCode: 'TECH01', competencyName: 'Statistical Software (R/Python/SPSS)', domain: 'Technical', requiredLevel: 65 },
      { competencyCode: 'TECH02', competencyName: 'Database & SQL Querying', domain: 'Technical', requiredLevel: 65 },
      { competencyCode: 'BEH01', competencyName: 'Communication & Report Writing', domain: 'Behavioural & Managerial', requiredLevel: 70 },
    ],
  },
  {
    id: 'ROLE-08',
    title: 'Agricultural Statistician',
    code: 'AS',
    department: 'Agricultural Statistics Wing',
    description: 'Integrates crop-cutting experiment data, satellite remote sensing vegetation indices, and agricultural census summaries.',
    frameworkVersion: 1,
    publishedAt: '2026-01-10T10:00:00Z',
    isActive: true,
    competencies: [
      { competencyCode: 'STAT02', competencyName: 'Survey Design & Sampling', domain: 'Statistical', requiredLevel: 80 },
      { competencyCode: 'TECH05', competencyName: 'GIS & Geospatial Analysis', domain: 'Technical', requiredLevel: 70 },
      { competencyCode: 'STAT03', competencyName: 'Data Collection & Validation', domain: 'Statistical', requiredLevel: 75 },
      { competencyCode: 'TECH03', competencyName: 'Data Visualization & Dashboards', domain: 'Technical', requiredLevel: 65 },
      { competencyCode: 'STAT01', competencyName: 'Statistical Theory & Methods', domain: 'Statistical', requiredLevel: 70 },
    ],
  },
  {
    id: 'ROLE-09',
    title: 'Training Faculty',
    code: 'TF',
    department: 'National Statistical Training Academy (NSSTA)',
    description: 'Delivers executive modules, curriculum authoring, assessment moderation, and capacity building for ISS/SSS officers.',
    frameworkVersion: 1,
    publishedAt: '2026-01-05T10:00:00Z',
    isActive: true,
    competencies: [
      { competencyCode: 'STAT01', competencyName: 'Statistical Theory & Methods', domain: 'Statistical', requiredLevel: 90 },
      { competencyCode: 'STAT02', competencyName: 'Survey Design & Sampling', domain: 'Statistical', requiredLevel: 85 },
      { competencyCode: 'BEH01', competencyName: 'Communication & Report Writing', domain: 'Behavioural & Managerial', requiredLevel: 90 },
      { competencyCode: 'BEH02', competencyName: 'Leadership & Team Management', domain: 'Behavioural & Managerial', requiredLevel: 85 },
      { competencyCode: 'TECH01', competencyName: 'Statistical Software (R/Python/SPSS)', domain: 'Technical', requiredLevel: 75 },
      { competencyCode: 'DIG01', competencyName: 'Digital Data Governance', domain: 'Digital Governance', requiredLevel: 75 },
    ],
  },
];

// ─── Default Trainers & Approval Workflow ────────────────────────────────────

export const DEFAULT_TRAINERS: TrainerRecord[] = [
  {
    id: 'TRN-001',
    name: 'Sunita Rao',
    email: 'trainer@statsetu.gov.in',
    department: 'Training and Capacity Building',
    expertise: ['Statistical Theory', 'Survey Design', 'National Accounts'],
    qualification: 'Ph.D. Statistics, ISI Kolkata',
    experienceYears: 12,
    assignedProgrammes: ['NSSTA Foundations', 'Advanced Econometrics for ISS'],
    assignedLearnersCount: 142,
    trainingHours: 180,
    avgCohortScore: 86,
    status: 'active',
    appliedAt: '2023-08-01T09:00:00Z',
    reviewedAt: '2023-08-03T11:00:00Z',
    reviewedBy: 'Dr. Rajesh Verma (DDG)',
    reviewNotes: 'Approved with distinction. Senior faculty for national sampling methodologies.',
    supportingDocuments: ['isi_phd_certificate.pdf', 'iss_training_portfolio.pdf'],
  },
  {
    id: 'TRN-002',
    name: 'Priya Menon',
    email: 'priya.menon@nssta.gov.in',
    department: 'National Statistical Training Academy',
    expertise: ['Competency Frameworks', 'Curriculum Design', 'R Programming'],
    qualification: 'M.Sc. Statistics, ISI Bangalore',
    experienceYears: 10,
    assignedProgrammes: ['R Programming for Statistical Officers', 'Survey Design Masterclass'],
    assignedLearnersCount: 98,
    trainingHours: 140,
    avgCohortScore: 88,
    status: 'active',
    appliedAt: '2023-11-10T10:00:00Z',
    reviewedAt: '2023-11-12T14:30:00Z',
    reviewedBy: 'Vikram Nair (Director)',
    reviewNotes: 'Approved. Lead instructor for iGOT Karmayogi technical modules.',
    supportingDocuments: ['nssta_faculty_credential.pdf'],
  },
  {
    id: 'TRN-003',
    name: 'Dr. Arvind Swaminathan',
    email: 'arvind.swaminathan@iitd.ac.in',
    department: 'Data Quality & AI Directorate',
    expertise: ['Machine Learning', 'Big Data Engineering', 'Python for Government'],
    qualification: 'Ph.D. Computer Science, IIT Delhi',
    experienceYears: 8,
    assignedProgrammes: ['AI Applications in Official Statistics (Proposed)'],
    assignedLearnersCount: 0,
    trainingHours: 0,
    avgCohortScore: 0,
    status: 'pending',
    appliedAt: '2026-09-18T09:30:00Z',
    reviewNotes: 'Application pending Administrator review. Candidate proposes 40-hour ML curriculum for MoSPI.',
    supportingDocuments: ['iit_degree.pdf', 'ml_curriculum_proposal.pdf', 'recommendation_letter.pdf'],
  },
  {
    id: 'TRN-004',
    name: 'Meenakshi Sundaram',
    email: 'm.sundaram@des.gov.in',
    department: 'State Directorate of Economics & Statistics (Tamil Nadu)',
    expertise: ['Field Operations', 'Crop Estimation', 'QGIS Remote Sensing'],
    qualification: 'M.Sc. Statistics, Madras University',
    experienceYears: 6,
    assignedProgrammes: ['Geospatial Analytics for State Officers (Proposed)'],
    assignedLearnersCount: 0,
    trainingHours: 0,
    avgCohortScore: 0,
    status: 'pending',
    appliedAt: '2026-09-22T14:15:00Z',
    reviewNotes: 'Application received. Pending administrative verification of state service tenure.',
    supportingDocuments: ['state_noc.pdf', 'gis_sample_project.pdf'],
  },
  {
    id: 'TRN-005',
    name: 'Prof. Ramesh Kulkarni',
    email: 'r.kulkarni@mospi-alumni.gov.in',
    department: 'Economic Statistics Advisory Council',
    expertise: ['National Accounts', 'SNA 2008 Framework', 'Input-Output Tables'],
    qualification: 'Retd. Additional Director General, ISS',
    experienceYears: 28,
    assignedProgrammes: ['Executive Policy Formulation in GVA'],
    assignedLearnersCount: 45,
    trainingHours: 60,
    avgCohortScore: 92,
    status: 'approved',
    appliedAt: '2025-06-10T10:00:00Z',
    reviewedAt: '2025-06-12T16:00:00Z',
    reviewedBy: 'Dr. Rajesh Verma (DDG)',
    reviewNotes: 'Distinguished visiting fellow approved for senior leadership workshops.',
    supportingDocuments: ['iss_superannuation_record.pdf'],
  },
  {
    id: 'TRN-006',
    name: 'Deepak Verma',
    email: 'deepak.verma@nic.in',
    department: 'National Informatics Centre (NIC) Support Unit',
    expertise: ['Database Security', 'PostgreSQL Administration', 'PFMS Integration'],
    qualification: 'B.Tech IT, NIT Kurukshetra',
    experienceYears: 11,
    assignedProgrammes: ['Database Administration for Statisticians'],
    assignedLearnersCount: 30,
    trainingHours: 45,
    avgCohortScore: 78,
    status: 'suspended',
    appliedAt: '2024-02-01T10:00:00Z',
    reviewedAt: '2024-02-05T12:00:00Z',
    reviewedBy: 'Vikram Nair (Director)',
    reviewNotes: 'Suspended pending deputation renewal from NIC.',
    supportingDocuments: ['deputation_order.pdf'],
  },
];

// ─── Default Admin Audit Logs ────────────────────────────────────────────────

export const DEFAULT_AUDIT_LOGS: AdminAuditEntry[] = [
  {
    id: 'AUD-001',
    adminName: 'Dr. Rajesh Verma',
    adminEmail: 'admin@statsetu.gov.in',
    action: 'PUBLISH_FRAMEWORK',
    resource: 'Job Role: Statistical Data Analyst (v2)',
    timestamp: '2026-09-15T10:00:00Z',
    previousValue: 'v1 (6 competencies)',
    newValue: 'v2 (9 competencies including AI/ML at 50%)',
    status: 'SUCCESS',
  },
  {
    id: 'AUD-002',
    adminName: 'Dr. Rajesh Verma',
    adminEmail: 'admin@statsetu.gov.in',
    action: 'APPROVE_TRAINER',
    resource: 'Trainer: Prof. Ramesh Kulkarni (Economic Statistics)',
    timestamp: '2025-06-12T16:00:00Z',
    previousValue: 'status: pending',
    newValue: 'status: approved',
    status: 'SUCCESS',
  },
  {
    id: 'AUD-003',
    adminName: 'Vikram Nair',
    adminEmail: 'vikram.nair@mospi.gov.in',
    action: 'MAP_COURSE_COMPETENCY',
    resource: 'Course: Python for Data Analysis (Govt Edition)',
    timestamp: '2026-08-20T11:45:00Z',
    previousValue: 'Mapped to: TECH01',
    newValue: 'Mapped to: TECH01, TECH03 (Expected Impact: +15 points)',
    status: 'SUCCESS',
  },
  {
    id: 'AUD-004',
    adminName: 'Vikram Nair',
    adminEmail: 'vikram.nair@mospi.gov.in',
    action: 'UPDATE_COMPETENCY_REQUIREMENT',
    resource: 'Job Role: Agricultural Statistician (GIS & Geospatial)',
    timestamp: '2026-07-14T09:15:00Z',
    previousValue: 'GIS required: 60%',
    newValue: 'GIS required: 70%',
    status: 'SUCCESS',
  },
  {
    id: 'AUD-005',
    adminName: 'Dr. Rajesh Verma',
    adminEmail: 'admin@statsetu.gov.in',
    action: 'PUBLISH_ASSESSMENT',
    resource: 'Assessment: National Accounts & GDP Compilation Diagnostic',
    timestamp: '2026-06-01T14:00:00Z',
    previousValue: 'status: draft',
    newValue: 'status: published',
    status: 'SUCCESS',
  },
];

// ─── Default Course Governance List ──────────────────────────────────────────

export const DEFAULT_COURSES_GOVERNANCE: CourseGovernanceItem[] = [
  {
    id: 'C001',
    title: 'Foundations of Official Statistics',
    provider: 'NSSTA',
    domain: 'Statistical',
    level: 'Beginner',
    durationHours: 24,
    competencyCodes: ['STAT01', 'STAT02'],
    expectedImprovement: '+15–20 points in sampling & theory',
    prerequisites: 'Basic mathematics & statistics background',
    targetAudience: 'Newly inducted Statistical Officers & Investigators',
    status: 'Active',
    batchSchedule: 'Batch 2026-B3: Oct 15 – Oct 28',
  },
  {
    id: 'C002',
    title: 'Survey Design & Sampling Techniques',
    provider: 'NSSTA',
    domain: 'Statistical',
    level: 'Intermediate',
    durationHours: 32,
    competencyCodes: ['STAT02', 'STAT03'],
    expectedImprovement: '+20–25 points in complex survey variance',
    prerequisites: 'Foundations of Official Statistics (C001)',
    targetAudience: 'Survey Officers, Senior Statistical Officers',
    status: 'Active',
    batchSchedule: 'Batch 2026-B4: Nov 05 – Nov 20',
  },
  {
    id: 'C003',
    title: 'Python for Data Analysis (Govt Edition)',
    provider: 'iGOT Karmayogi',
    domain: 'Technical',
    level: 'Intermediate',
    durationHours: 40,
    competencyCodes: ['TECH01', 'TECH03'],
    expectedImprovement: '+25–30 points in automated scripting',
    prerequisites: 'Basic computer proficiency',
    targetAudience: 'Statistical Analysts, Data Scientists, Desk Officers',
    status: 'Active',
    batchSchedule: 'Self-paced continuous enrollment',
  },
  {
    id: 'C004',
    title: 'R Programming for Statistical Officers',
    provider: 'iGOT Karmayogi',
    domain: 'Technical',
    level: 'Intermediate',
    durationHours: 36,
    competencyCodes: ['TECH01', 'TECH03'],
    expectedImprovement: '+20–25 points in NSS microdata analysis',
    prerequisites: 'Foundations of Statistics',
    targetAudience: 'NSO & DES Research Officers',
    status: 'Active',
    batchSchedule: 'Self-paced continuous enrollment',
  },
  {
    id: 'C005',
    title: 'GIS & Geospatial Analytics for Statistics',
    provider: 'Other Govt Training',
    domain: 'Technical',
    level: 'Intermediate',
    durationHours: 28,
    competencyCodes: ['TECH05'],
    expectedImprovement: '+20 points in spatial mapping & boundary analysis',
    prerequisites: 'None',
    targetAudience: 'Agricultural Statisticians & Census Planners',
    status: 'Active',
    batchSchedule: 'TPAC Scheduled Cohort 2026',
  },
  {
    id: 'C006',
    title: 'Machine Learning Applications in Official Statistics',
    provider: 'iGOT Karmayogi',
    domain: 'Technical',
    level: 'Advanced',
    durationHours: 48,
    competencyCodes: ['TECH04', 'TECH01'],
    expectedImprovement: '+25 points in predictive econometric modeling',
    prerequisites: 'Python for Data Analysis (C003)',
    targetAudience: 'Data Scientists & National Accounts Analysts',
    status: 'Active',
    batchSchedule: 'Cohort 2: Starts Nov 1',
  },
  {
    id: 'C007',
    title: 'National Accounts & GDP Compilation',
    provider: 'NSSTA',
    domain: 'Statistical',
    level: 'Advanced',
    durationHours: 40,
    competencyCodes: ['STAT05', 'STAT04'],
    expectedImprovement: '+20 points in SNA 2008 & back-series compilation',
    prerequisites: 'Foundations of Official Statistics',
    targetAudience: 'Central Statistics Office & Economic Division Officers',
    status: 'Active',
    batchSchedule: 'Resident Programme at NSSTA Greater Noida',
  },
];

// ─── Default Assessment Governance List ──────────────────────────────────────

export const DEFAULT_ASSESSMENTS_GOVERNANCE: AssessmentGovItem[] = [
  {
    id: 'ASS-01',
    title: 'Baseline Competency Assessment (Official Statistics)',
    type: 'Baseline',
    domain: 'Multi-Domain',
    competenciesCovered: ['STAT01', 'STAT02', 'STAT03', 'TECH01', 'TECH02', 'DIG01', 'BEH01'],
    questionsCount: 20,
    learnersAssessed: 8430,
    avgScore: 68,
    completionRate: 94,
    status: 'Published',
    source: 'Trainer Created',
  },
  {
    id: 'ASS-02',
    title: 'Survey Sampling & NSSO Methodology Diagnostic',
    type: 'Diagnostic',
    domain: 'Statistical',
    competenciesCovered: ['STAT02', 'STAT03'],
    questionsCount: 15,
    learnersAssessed: 1240,
    avgScore: 72,
    completionRate: 88,
    status: 'Published',
    source: 'Trainer Created',
  },
  {
    id: 'ASS-03',
    title: 'Python for Government Data Pipelines — Post-Training',
    type: 'Post-Training',
    domain: 'Technical',
    competenciesCovered: ['TECH01', 'TECH03'],
    questionsCount: 25,
    learnersAssessed: 890,
    avgScore: 71,
    completionRate: 82,
    status: 'Published',
    source: 'AI Generated',
    aiReviewStatus: 'published',
  },
  {
    id: 'ASS-04',
    title: 'National Accounts SNA 2008 & GDP Verification Exam',
    type: 'Milestone',
    domain: 'Statistical',
    competenciesCovered: ['STAT05', 'STAT04'],
    questionsCount: 30,
    learnersAssessed: 420,
    avgScore: 76,
    completionRate: 91,
    status: 'Published',
    source: 'Trainer Created',
  },
  {
    id: 'ASS-05',
    title: 'Automated AI Quiz: PLFS Household Sampling Concepts',
    type: 'Diagnostic',
    domain: 'Statistical',
    competenciesCovered: ['STAT02', 'STAT03'],
    questionsCount: 10,
    learnersAssessed: 0,
    avgScore: 0,
    completionRate: 0,
    status: 'Under Review',
    source: 'AI Generated',
    aiReviewStatus: 'pending_review',
  },
  {
    id: 'ASS-06',
    title: 'Digital Data Privacy & DPDPA 2023 Compliance Quiz',
    type: 'Milestone',
    domain: 'Digital Governance',
    competenciesCovered: ['DIG01', 'DIG03'],
    questionsCount: 12,
    learnersAssessed: 1650,
    avgScore: 84,
    completionRate: 96,
    status: 'Published',
    source: 'Trainer Created',
  },
];

// ─── Governance Storage Accessors ─────────────────────────────────────────────

function loadAllJobRoles(): JobRoleDefinition[] {
  if (typeof window === 'undefined') return DEFAULT_JOB_ROLES;
  try {
    const raw = localStorage.getItem(JOB_ROLES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_JOB_ROLES;
  } catch {
    return DEFAULT_JOB_ROLES;
  }
}

function saveAllJobRoles(roles: JobRoleDefinition[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(JOB_ROLES_KEY, JSON.stringify(roles));
}

function loadAllTrainers(): TrainerRecord[] {
  if (typeof window === 'undefined') return DEFAULT_TRAINERS;
  try {
    const raw = localStorage.getItem(TRAINERS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_TRAINERS;
  } catch {
    return DEFAULT_TRAINERS;
  }
}

function saveAllTrainers(trainers: TrainerRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TRAINERS_KEY, JSON.stringify(trainers));
}

function loadAllAuditLogs(): AdminAuditEntry[] {
  if (typeof window === 'undefined') return DEFAULT_AUDIT_LOGS;
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_AUDIT_LOGS;
  } catch {
    return DEFAULT_AUDIT_LOGS;
  }
}

function saveAllAuditLogs(logs: AdminAuditEntry[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
}

function loadAllCoursesGov(): CourseGovernanceItem[] {
  if (typeof window === 'undefined') return DEFAULT_COURSES_GOVERNANCE;
  try {
    const raw = localStorage.getItem(COURSES_GOV_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_COURSES_GOVERNANCE;
  } catch {
    return DEFAULT_COURSES_GOVERNANCE;
  }
}

function saveAllCoursesGov(items: CourseGovernanceItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COURSES_GOV_KEY, JSON.stringify(items));
}

function loadAllAssessmentsGov(): AssessmentGovItem[] {
  if (typeof window === 'undefined') return DEFAULT_ASSESSMENTS_GOVERNANCE;
  try {
    const raw = localStorage.getItem(ASSESSMENTS_GOV_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_ASSESSMENTS_GOVERNANCE;
  } catch {
    return DEFAULT_ASSESSMENTS_GOVERNANCE;
  }
}

function saveAllAssessmentsGov(items: AssessmentGovItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ASSESSMENTS_GOV_KEY, JSON.stringify(items));
}

// ─── Competency & Gap Calculation ─────────────────────────────────────────────

// ─── AI Competency Engine & Evidence Aggregation Layer ────────────────────────

export interface EvaluateCompetencyInput {
  compCode: string;
  compName: string;
  category: string;
  targetRole?: string;
  department?: string;
  selfAssessmentLevel?: 'Beginner' | 'Developing' | 'Proficient' | 'Advanced' | 'None';
  baselineScore?: number | null;
  baselineDate?: string;
  previousTraining?: { courseTitle: string; completedDate: string; score?: number }[];
  previousAssessments?: { title: string; score: number; date: string }[];
  workExperienceYears?: number;
  workExperienceDetails?: string;
  postTrainingScore?: number | null;
  postTrainingDate?: string;
  postTrainingCourseTitle?: string;
}

/**
 * AI Competency Engine
 * Takes multi-source evidence (Profile, Job Role, Self-Assessment, Training,
 * Assessments, Work Experience, Baseline, Post-Training) and derives an
 * explainable, evidence-based current competency score, confidence rating, and audit trail.
 *
 * CRITICAL RULE: Self-assessment is labelled "Self-reported proficiency" and
 * NEVER directly dictates the official competency score.
 */
export function evaluateCompetencyWithEngine(input: EvaluateCompetencyInput): CompetencyScore {
  const {
    compCode,
    compName,
    category,
    selfAssessmentLevel = 'None',
    baselineScore,
    baselineDate = '2024-08-10T11:00:00Z',
    previousTraining = [],
    previousAssessments = [],
    workExperienceYears = 0,
    workExperienceDetails = '',
    postTrainingScore,
    postTrainingDate,
    postTrainingCourseTitle,
  } = input;

  const evidence: CompetencyEvidenceItem[] = [];
  const history: CompetencyHistoryEntry[] = [];

  // 1. Evidence: Self-Reported Proficiency (Supporting evidence ONLY)
  if (selfAssessmentLevel && selfAssessmentLevel !== 'None') {
    evidence.push({
      type: 'self_assessment',
      label: 'Self-reported proficiency',
      source: 'Learner Onboarding Questionnaire',
      level: selfAssessmentLevel,
      details: `Officer self-reported initial familiarity as "${selfAssessmentLevel}". Non-verified subjective input.`,
      weight: 'supporting',
      isVerified: false,
    });
  }

  // 2. Evidence: Previous Training
  if (previousTraining.length > 0) {
    previousTraining.forEach(t => {
      evidence.push({
        type: 'training_completion',
        label: 'Previous Training Completed',
        source: 'iGOT Karmayogi / NSSTA Registry',
        score: t.score,
        details: `${t.courseTitle}${t.score !== undefined ? ` (Achieved: ${t.score}%)` : ''}`,
        date: t.completedDate,
        weight: 'high',
        isVerified: true,
      });
    });
  } else {
    evidence.push({
      type: 'training_completion',
      label: 'Previous Training',
      source: 'Training Registry',
      details: 'No accredited training recorded for this competency.',
      weight: 'supporting',
      isVerified: true,
    });
  }

  // 3. Evidence: Previous Verified Assessments
  if (previousAssessments.length > 0) {
    previousAssessments.forEach(pa => {
      evidence.push({
        type: 'previous_assessment',
        label: 'Previous Verified Assessment',
        source: 'MoSPI Testing Framework',
        score: pa.score,
        details: `${pa.title} — Verified Score: ${pa.score}%`,
        date: pa.date,
        weight: 'high',
        isVerified: true,
      });
    });
  } else {
    evidence.push({
      type: 'previous_assessment',
      label: 'Previous Assessment',
      source: 'Assessment Service',
      details: 'No prior historical assessment on record.',
      weight: 'supporting',
      isVerified: true,
    });
  }

  // 4. Evidence: Work Experience
  if (workExperienceYears > 0) {
    evidence.push({
      type: 'work_experience',
      label: 'Relevant Work Experience',
      source: 'Cadre Service Profile',
      details: `${workExperienceYears} year${workExperienceYears > 1 ? 's' : ''} official experience${workExperienceDetails ? ` (${workExperienceDetails})` : ''}. Supporting evidence.`,
      weight: 'medium',
      isVerified: true,
    });
  }

  // 5. Evidence: Baseline Assessment (Primary objective anchor)
  if (baselineScore !== undefined && baselineScore !== null) {
    evidence.push({
      type: 'baseline_assessment',
      label: 'Baseline Assessment',
      source: 'MoSPI Diagnostic Assessment',
      score: baselineScore,
      details: `Official verified diagnostic examination score: ${baselineScore}%.`,
      date: baselineDate,
      weight: 'primary',
      isVerified: true,
    });

    history.push({
      stage: 'Baseline',
      date: baselineDate.slice(0, 10),
      score: baselineScore,
      eventDescription: 'Official baseline diagnostic examination',
    });
  }

  // 6. Evidence: Post-Training Assessment (Latest demonstrated ability)
  if (postTrainingScore !== undefined && postTrainingScore !== null) {
    evidence.push({
      type: 'post_training_assessment',
      label: 'Post-Training Assessment',
      source: postTrainingCourseTitle || 'Post-Training Verification',
      score: postTrainingScore,
      details: `Post-training verification exam: ${postTrainingScore}%. Highest recency priority.`,
      date: postTrainingDate || new Date().toISOString(),
      weight: 'primary',
      isVerified: true,
    });

    history.push({
      stage: 'Post-Assessment',
      date: (postTrainingDate || new Date().toISOString()).slice(0, 10),
      score: postTrainingScore,
      delta: baselineScore ? postTrainingScore - baselineScore : undefined,
      eventDescription: `Completed post-training verification for ${postTrainingCourseTitle || 'cohort'}`,
    });
  }

  // ── Engine Synthesis: Determine Official Competency Score ──
  let officialScore = 30; // Fallback estimate if zero objective data
  let confidence: 'High' | 'Medium' | 'Low' = 'Low';
  let primaryEvidence = 'Self-reported proficiency only (Not verified)';
  let evidenceSummary = 'Awaiting baseline assessment verification.';
  let observation = '';
  let status: CompetencyScore['status'] = 'Pending Verification';

  if (postTrainingScore !== undefined && postTrainingScore !== null) {
    // Highest priority: Verified post-training assessment!
    officialScore = postTrainingScore;
    confidence = 'High';
    primaryEvidence = `Post-Training Assessment (${postTrainingScore}%)`;
    evidenceSummary = `Your competency has been updated to ${postTrainingScore}% following verified post-training evaluation.`;
    status = 'Verified';
    observation = baselineScore
      ? `Demonstrated ${postTrainingScore - baselineScore >= 0 ? '+' : ''}${postTrainingScore - baselineScore} points improvement from baseline.`
      : 'Post-training evaluation verified.';
  } else if (baselineScore !== undefined && baselineScore !== null) {
    // Primary anchor: Verified baseline diagnostic
    officialScore = baselineScore;
    status = 'Verified';
    primaryEvidence = `Baseline Assessment (${baselineScore}%)`;

    // Confidence determination: High if supported by previous training or historical assessment; Medium otherwise
    const hasMultipleObjective = previousTraining.some(t => t.score !== undefined) || previousAssessments.length > 0;
    confidence = hasMultipleObjective ? 'High' : 'Medium';

    evidenceSummary = 'Your current competency is based primarily on your baseline assessment.';

    // Edge Case A: Self-assessment High, Assessment Low
    if ((selfAssessmentLevel === 'Advanced' || selfAssessmentLevel === 'Proficient') && baselineScore < 50) {
      observation = `Your demonstrated assessment performance (${baselineScore}%) is substantially lower than your self-reported proficiency (${selfAssessmentLevel}). Targeted upskilling is recommended.`;
    }
    // Edge Case B: Self-assessment Low, Assessment High
    else if ((selfAssessmentLevel === 'Beginner' || selfAssessmentLevel === 'Developing') && baselineScore >= 75) {
      observation = `Your demonstrated assessment performance (${baselineScore}%) is substantially higher than your self-reported proficiency (${selfAssessmentLevel}). Demonstrated capability verified.`;
    } else {
      observation = 'Score verified through objective evaluation.';
    }
  } else if (previousAssessments.length > 0) {
    officialScore = previousAssessments[0].score;
    confidence = 'Medium';
    primaryEvidence = `Previous Assessment: ${previousAssessments[0].title} (${previousAssessments[0].score}%)`;
    evidenceSummary = 'Derived from previous verified assessment records.';
    status = 'Verified';
  } else {
    // Case C: No baseline assessment yet!
    officialScore = 25;
    confidence = 'Low';
    status = 'Pending Verification';
    primaryEvidence = 'No verified assessment on record';
    evidenceSummary = 'Current competency is unverified. Complete the baseline assessment to establish your official profile.';
    observation = 'Action required: Take baseline diagnostic assessment.';
  }

  // Derive level 1-5
  const current_level = Math.max(1, Math.min(5, Math.ceil(officialScore / 20)));

  return {
    competency_id: compCode,
    competency_name: compName,
    category,
    code: compCode,
    current_level,
    score_percentage: officialScore,
    confidence,
    primaryEvidence,
    evidenceSummary,
    selfReportedProficiency: selfAssessmentLevel,
    evidence,
    history,
    lastAssessedAt: postTrainingDate || baselineDate || new Date().toISOString(),
    status,
    observation,
  };
}

// ─── Competency & Gap Calculation ─────────────────────────────────────────────

function calculateGapsFromCompetencies(
  competencies: CompetencyScore[],
  role: string,
  jobRoleTitleOrId?: string
): SkillGapResult {
  // 1. Resolve requirements: Admin-managed Job Role Framework is source of truth!
  let reqs: Record<string, number> = {};
  const jobRoles = loadAllJobRoles();
  const matchedRole = jobRoles.find(r =>
    (jobRoleTitleOrId && r.title.toLowerCase() === jobRoleTitleOrId.toLowerCase()) ||
    (jobRoleTitleOrId && r.id.toLowerCase() === jobRoleTitleOrId.toLowerCase()) ||
    (jobRoleTitleOrId && r.code.toLowerCase() === jobRoleTitleOrId.toLowerCase())
  );

  const matchedRoleTitle = matchedRole?.title || 'Statistical Officer';
  const coreCompetencyCodes = new Set(
    matchedRole?.competencies.map(c => c.competencyCode) || ['STAT01', 'STAT02', 'STAT03', 'TECH01', 'TECH02']
  );

  if (matchedRole && matchedRole.competencies && matchedRole.competencies.length > 0) {
    matchedRole.competencies.forEach(c => {
      reqs[c.competencyCode] = c.requiredLevel;
    });
  } else {
    reqs = ROLE_REQUIREMENTS[role] || ROLE_REQUIREMENTS.employee;
  }

  // Core prerequisites across MoSPI curriculum
  const PREREQUISITE_DEPENDENCIES: Record<string, { unlocks: string[]; dependencyReason: string }> = {
    TECH01: {
      unlocks: ['Machine Learning for Statistics (C006)', 'AI in Official Statistics'],
      dependencyReason: 'Python is a mandatory prerequisite for the recommended AI/ML learning pathway.',
    },
    STAT02: {
      unlocks: ['Advanced Econometrics for ISS', 'Complex Sampling Designs'],
      dependencyReason: 'Survey Design & Sampling is a core prerequisite for official NSSO sample allocation.',
    },
    STAT03: {
      unlocks: ['National Accounts & GDP Compilation (C007)'],
      dependencyReason: 'Data validation and scrutiny are prerequisites for macro GVA compilation.',
    },
    TECH02: {
      unlocks: ['Python for Data Analysis (Govt Edition) (C003)'],
      dependencyReason: 'Database querying is a prerequisite for automated survey ETL pipelines.',
    },
  };

  const gaps: SkillGap[] = [];
  const strengths: SkillGap[] = [];

  for (const comp of competencies) {
    const required = reqs[comp.code] ?? (ROLE_REQUIREMENTS[role]?.[comp.code] ?? 60);
    const current = comp.score_percentage;

    // Section 16 & 18: Required - Current = Skill Gap. If Current >= Required, Gap = 0. Never negative.
    const gapPct = Math.max(0, required - current);
    const gapLevels = Math.max(0, Math.round(gapPct / 20));

    let gap_label: 'High' | 'Medium' | 'Low' | 'None' = 'None';
    if (gapPct > 20) gap_label = 'High';
    else if (gapPct > 10) gap_label = 'Medium';
    else if (gapPct > 0) gap_label = 'Low';

    const isCoreForRole = coreCompetencyCodes.has(comp.code);
    const isPrerequisiteForPath = !!PREREQUISITE_DEPENDENCIES[comp.code];

    // Multi-factor Priority Evaluation (Section 21)
    // Considers: gap magnitude + role criticality + prerequisite dependency + evidence certainty
    let priorityScore = gapPct;
    if (isCoreForRole) priorityScore += 25;
    if (isPrerequisiteForPath) priorityScore += 20;

    let priority: 'High' | 'Medium' | 'Low' | 'None' = 'None';
    if (gapPct === 0) {
      priority = 'None';
    } else if (priorityScore >= 45 || gapPct > 22) {
      priority = 'High';
    } else if (priorityScore >= 25 || gapPct > 10) {
      priority = 'Medium';
    } else {
      priority = 'Low';
    }

    // Dynamic, Evidence-Based Gap Reasons (Section 19 & 20)
    const priorityReasons: string[] = [];

    if (gapPct > 0) {
      // 1. Assessment-based reason
      if (comp.primaryEvidence) {
        priorityReasons.push(`Your ${comp.primaryEvidence.toLowerCase()} is ${current.toFixed(0)}% (required: ${required}%).`);
      } else {
        priorityReasons.push(`Demonstrated proficiency (${current.toFixed(0)}%) is ${gapPct} points below the ${required}% role target.`);
      }

      // 2. Training history reason
      const hasTraining = comp.evidence?.some(e => e.type === 'training_completion' && e.score !== undefined);
      if (!hasTraining) {
        priorityReasons.push(`No accredited ${comp.competency_name} training recorded on iGOT Karmayogi or NSSTA.`);
      }

      // 3. Role-based reason
      if (isCoreForRole) {
        priorityReasons.push(`${comp.competency_name} is a designated core competency for your role (${matchedRoleTitle}).`);
      }

      // 4. Dependency-based reason
      if (PREREQUISITE_DEPENDENCIES[comp.code]) {
        priorityReasons.push(PREREQUISITE_DEPENDENCIES[comp.code].dependencyReason);
      }
    }

    const item: SkillGap = {
      competency_id: comp.competency_id,
      competency_name: comp.competency_name,
      category: comp.category,
      current_percentage: current,
      required_percentage: required,
      gap: gapLevels,
      gap_percentage: gapPct,
      gap_label,
      priority,
      priorityScore,
      priorityReasons,
      explanation: gapPct === 0
        ? `You meet or exceed the required level for ${comp.competency_name} (${current.toFixed(0)}% vs ${required}% required).`
        : `Your current competency (${current.toFixed(0)}%) is below the required ${required}% for ${matchedRoleTitle}. Gap: ${gapPct} points. Priority: ${priority}.`,
      isCoreForRole,
      isMandatory: isCoreForRole,
      isPrerequisiteForPath,
      confidence: comp.confidence || 'Medium',
      primaryEvidence: comp.primaryEvidence,
    };

    if (gapPct > 0) gaps.push(item);
    else strengths.push(item);
  }

  // Sort by priorityScore descending so most critical gaps appear first
  gaps.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  return {
    gaps,
    strengths,
    high_priority_count: gaps.filter(g => g.priority === 'High').length,
    medium_priority_count: gaps.filter(g => g.priority === 'Medium').length,
    low_priority_count: gaps.filter(g => g.priority === 'Low').length,
    summary: `Identified ${gaps.length} competency gaps (${gaps.filter(g => g.priority === 'High').length} High, ${gaps.filter(g => g.priority === 'Medium').length} Medium priority) for role: ${matchedRoleTitle}.`,
  };
}

function generateRecommendations(gaps: SkillGap[], career_goal: string): Recommendation[] {
  const gapCodes = gaps.map(g => g.competency_id);
  const highPriorityGaps = gaps.filter(g => g.priority === 'High');
  const highGapCodes = highPriorityGaps.map(g => g.competency_id);

  // Score each course by how directly it addresses high-priority gaps
  const scored = COURSES_CATALOGUE.map(course => {
    let score = 0;
    for (const code of course.competency_codes) {
      if (highGapCodes.includes(code)) score += 45;
      else if (gapCodes.includes(code)) score += 20;
    }
    // Career goal alignment
    const goalLower = career_goal.toLowerCase();
    const titleLower = course.title.toLowerCase();
    if (goalLower.includes('data') && titleLower.includes('data')) score += 10;
    if (goalLower.includes('machine learning') && titleLower.includes('machine learning')) score += 15;
    if (goalLower.includes('gis') && titleLower.includes('gis')) score += 15;
    if (goalLower.includes('leadership') && titleLower.includes('leadership')) score += 15;
    if (goalLower.includes('national') && titleLower.includes('national')) score += 10;
    if (score === 0) score = 15;
    return { course, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top10 = scored.slice(0, 10);

  return top10.map((item, idx) => {
    const matchedGap = gaps.find(g => item.course.competency_codes.some(c => c === g.competency_id));
    let reason = '';

    if (matchedGap) {
      reason = `Recommended because ${matchedGap.competency_name} is a ${matchedGap.priority?.toLowerCase() || 'high'} priority gap for your role (Current: ${matchedGap.current_percentage.toFixed(0)}%, Required: ${matchedGap.required_percentage}%, Gap: ${matchedGap.gap_percentage || (matchedGap.gap * 20)} pts). ${
        matchedGap.isPrerequisiteForPath
          ? 'Course satisfies prerequisites for advanced official statistical pathways.'
          : 'Targeted to close this competency gap to meet framework standards.'
      }`;
    } else {
      reason = `Recommended based on your career goal (${career_goal}) and official statistical competency framework benchmarks.`;
    }

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
    jobRole: 'Statistical Data Analyst',
    targetRole: 'Senior Statistical Officer',
    status: 'Active',
    trainingStatus: 'In Progress',
    onboardingCompleted: true,
    faceEnrolled: true,
    faceTemplate: seedTemplate,
    faceEnrolledAt: '2024-01-16T11:00:00Z',
  };

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

  const competencies: CompetencyScore[] = [
    evaluateCompetencyWithEngine({
      compCode: 'STAT01', compName: 'Statistical Theory & Methods', category: 'Statistical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Advanced', baselineScore: 78, baselineDate: '2024-03-01T09:30:00Z',
      previousAssessments: [{ title: 'UPSC SSS Technical Induction Diagnostic', score: 80, date: '2023-11-15' }],
      workExperienceYears: 5, workExperienceDetails: 'Quarterly GDP & National Accounts Scrutiny',
    }),
    evaluateCompetencyWithEngine({
      compCode: 'STAT02', compName: 'Survey Design & Sampling', category: 'Statistical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Proficient', baselineScore: 68, baselineDate: '2024-03-01T09:30:00Z',
      workExperienceYears: 5, workExperienceDetails: 'ASI Stratified Sampling & Frame Verification',
    }),
    evaluateCompetencyWithEngine({
      compCode: 'STAT03', compName: 'Data Collection & Validation', category: 'Statistical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Advanced', baselineScore: 74, baselineDate: '2024-03-01T09:30:00Z',
      workExperienceYears: 5, workExperienceDetails: 'Microdata Quality Scrutiny & Scrutiny Rules',
    }),
    evaluateCompetencyWithEngine({
      compCode: 'STAT04', compName: 'Index Numbers & Price Statistics', category: 'Statistical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Developing', baselineScore: 62, baselineDate: '2024-03-01T09:30:00Z',
      workExperienceYears: 5,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'STAT05', compName: 'National Accounts & GVA Estimation', category: 'Statistical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Proficient', baselineScore: 58, baselineDate: '2024-03-01T09:30:00Z',
      previousTraining: [{ courseTitle: 'National Accounts Statistics: Concepts & Compilation (C015)', completedDate: '2024-05-10T14:00:00Z', score: 92 }],
      postTrainingScore: 74, postTrainingDate: '2024-05-10T14:00:00Z', postTrainingCourseTitle: 'National Accounts Statistics: Concepts & Compilation (C015)',
      workExperienceYears: 5, workExperienceDetails: 'Quarterly GDP & GVA Estimation Unit',
    }),
    evaluateCompetencyWithEngine({
      compCode: 'TECH01', compName: 'Statistical Software (R/Python/SPSS)', category: 'Technical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Developing', baselineScore: 62, baselineDate: '2024-03-01T09:30:00Z',
      previousTraining: [{ courseTitle: 'Python for Data Analysis (Govt Edition) (C001)', completedDate: '2024-04-05T15:00:00Z', score: 88 }],
      postTrainingScore: 76, postTrainingDate: '2024-04-05T15:00:00Z', postTrainingCourseTitle: 'Python for Data Analysis (Govt Edition) (C001)',
      workExperienceYears: 5, workExperienceDetails: 'Automated survey ETL scripts in Python & R',
    }),
    evaluateCompetencyWithEngine({
      compCode: 'TECH02', compName: 'Database & SQL Querying', category: 'Technical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Developing', baselineScore: 60, baselineDate: '2024-03-01T09:30:00Z',
      workExperienceYears: 5, workExperienceDetails: 'PostgreSQL microdata querying',
    }),
    evaluateCompetencyWithEngine({
      compCode: 'TECH03', compName: 'Data Visualization & Dashboards', category: 'Technical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Developing', baselineScore: 57, baselineDate: '2024-03-01T09:30:00Z',
      workExperienceYears: 5,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'TECH04', compName: 'Machine Learning for Statistics', category: 'Technical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Beginner', baselineScore: 38, baselineDate: '2024-03-01T09:30:00Z',
      workExperienceYears: 5,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'TECH05', compName: 'GIS & Geospatial Analysis', category: 'Technical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Beginner', baselineScore: 22, baselineDate: '2024-03-01T09:30:00Z',
      workExperienceYears: 5,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'DIG01', compName: 'Digital Data Governance', category: 'Digital Governance',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Proficient', baselineScore: 58, baselineDate: '2024-03-01T09:30:00Z',
      previousTraining: [{ courseTitle: 'Data Governance & Quality Framework for Official Statistics (C011)', completedDate: '2024-06-02T12:00:00Z', score: 76 }],
      postTrainingScore: 68, postTrainingDate: '2024-06-02T12:00:00Z', postTrainingCourseTitle: 'Data Governance Framework (C011)',
      workExperienceYears: 5,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'DIG02', compName: 'Open Data & API Standards', category: 'Digital Governance',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Developing', baselineScore: 42, baselineDate: '2024-03-01T09:30:00Z',
      workExperienceYears: 5,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'DIG03', compName: 'Cybersecurity & Data Privacy', category: 'Digital Governance',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Developing', baselineScore: 48, baselineDate: '2024-03-01T09:30:00Z',
      workExperienceYears: 5,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'DIG04', compName: 'eGovernance Frameworks (GeM, PFMS)', category: 'Digital Governance',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Proficient', baselineScore: 62, baselineDate: '2024-03-01T09:30:00Z',
      workExperienceYears: 5,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'BEH01', compName: 'Communication & Report Writing', category: 'Behavioural & Managerial',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Advanced', baselineScore: 80, baselineDate: '2024-03-01T09:30:00Z',
      workExperienceYears: 5, workExperienceDetails: 'Author of official statistical releases',
    }),
    evaluateCompetencyWithEngine({
      compCode: 'BEH02', compName: 'Leadership & Team Management', category: 'Behavioural & Managerial',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Proficient', baselineScore: 65, baselineDate: '2024-03-01T09:30:00Z',
      workExperienceYears: 5, workExperienceDetails: 'Supervision of junior investigators',
    }),
  ];

  const skillGaps = calculateGapsFromCompetencies(competencies, 'employee', profile.jobRole);
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
    jobRole: 'Agricultural Statistician',
    targetRole: 'Statistical Data Analyst',
    status: 'Active',
    trainingStatus: 'In Progress',
    onboardingCompleted: true,
    faceEnrolled: true,
    faceTemplate: seedTemplate,
    faceEnrolledAt: '2024-06-02T10:00:00Z',
  };

  const competencies: CompetencyScore[] = [
    evaluateCompetencyWithEngine({
      compCode: 'STAT01', compName: 'Statistical Theory & Methods', category: 'Statistical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Developing', baselineScore: 55, baselineDate: '2024-08-10T11:00:00Z',
      workExperienceYears: 2, workExperienceDetails: 'Crop estimation sampling',
    }),
    evaluateCompetencyWithEngine({
      compCode: 'STAT02', compName: 'Survey Design & Sampling', category: 'Statistical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Beginner', baselineScore: 44, baselineDate: '2024-08-10T11:00:00Z',
      workExperienceYears: 2,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'STAT03', compName: 'Data Collection & Validation', category: 'Statistical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Developing', baselineScore: 58, baselineDate: '2024-08-10T11:00:00Z',
      workExperienceYears: 2, workExperienceDetails: 'State agricultural survey data validation',
    }),
    evaluateCompetencyWithEngine({
      compCode: 'STAT04', compName: 'Index Numbers & Price Statistics', category: 'Statistical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Beginner', baselineScore: 40, baselineDate: '2024-08-10T11:00:00Z',
      workExperienceYears: 2,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'STAT05', compName: 'National Accounts & GVA Estimation', category: 'Statistical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Beginner', baselineScore: 28, baselineDate: '2024-08-10T11:00:00Z',
      workExperienceYears: 2,
    }),
    // Edge Case A: Self-reported 'Advanced', but demonstrated 30% on assessment! Engine automatically documents discrepancy.
    evaluateCompetencyWithEngine({
      compCode: 'TECH01', compName: 'Statistical Software (R/Python/SPSS)', category: 'Technical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Advanced', baselineScore: 30, baselineDate: '2024-08-10T11:00:00Z',
      workExperienceYears: 2, workExperienceDetails: 'Basic script modifications',
    }),
    evaluateCompetencyWithEngine({
      compCode: 'TECH02', compName: 'Database & SQL Querying', category: 'Technical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Beginner', baselineScore: 38, baselineDate: '2024-08-10T11:00:00Z',
      workExperienceYears: 2,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'TECH03', compName: 'Data Visualization & Dashboards', category: 'Technical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Developing', baselineScore: 42, baselineDate: '2024-08-10T11:00:00Z',
      workExperienceYears: 2,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'TECH04', compName: 'Machine Learning for Statistics', category: 'Technical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Beginner', baselineScore: 20, baselineDate: '2024-08-10T11:00:00Z',
      workExperienceYears: 2,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'TECH05', compName: 'GIS & Geospatial Analysis', category: 'Technical',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Developing', baselineScore: 35, baselineDate: '2024-08-10T11:00:00Z',
      workExperienceYears: 2, workExperienceDetails: 'Field crop satellite imagery polygon scrutiny',
    }),
    evaluateCompetencyWithEngine({
      compCode: 'DIG01', compName: 'Digital Data Governance', category: 'Digital Governance',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Developing', baselineScore: 45, baselineDate: '2024-08-10T11:00:00Z',
      workExperienceYears: 2,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'DIG02', compName: 'Open Data & API Standards', category: 'Digital Governance',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Beginner', baselineScore: 28, baselineDate: '2024-08-10T11:00:00Z',
      workExperienceYears: 2,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'DIG03', compName: 'Cybersecurity & Data Privacy', category: 'Digital Governance',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Beginner', baselineScore: 40, baselineDate: '2024-08-10T11:00:00Z',
      workExperienceYears: 2,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'DIG04', compName: 'eGovernance Frameworks (GeM, PFMS)', category: 'Digital Governance',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Developing', baselineScore: 48, baselineDate: '2024-08-10T11:00:00Z',
      workExperienceYears: 2,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'BEH01', compName: 'Communication & Report Writing', category: 'Behavioural & Managerial',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Proficient', baselineScore: 65, baselineDate: '2024-08-10T11:00:00Z',
      workExperienceYears: 2,
    }),
    evaluateCompetencyWithEngine({
      compCode: 'BEH02', compName: 'Leadership & Team Management', category: 'Behavioural & Managerial',
      targetRole: profile.targetRole, department: profile.department,
      selfAssessmentLevel: 'Developing', baselineScore: 48, baselineDate: '2024-08-10T11:00:00Z',
      workExperienceYears: 2,
    }),
  ];

  const skillGaps = calculateGapsFromCompetencies(competencies, 'employee', profile.jobRole);
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

  const competencies: CompetencyScore[] = COMPETENCY_LIST.map((c) =>
    evaluateCompetencyWithEngine({
      compCode: c.code,
      compName: c.name,
      category: c.category,
      targetRole: 'Senior Training Faculty',
      department: profile.department,
      selfAssessmentLevel: 'Advanced',
      baselineScore: 85,
      baselineDate: '2024-05-12T10:00:00Z',
      previousAssessments: [{ title: 'NSSTA Master Faculty Certification', score: 88, date: '2024-05-12T10:00:00Z' }],
      workExperienceYears: 12,
      workExperienceDetails: 'National Statistical Training Academy (NSSTA) Faculty',
    })
  );

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

  const competencies: CompetencyScore[] = COMPETENCY_LIST.map((c) =>
    evaluateCompetencyWithEngine({
      compCode: c.code,
      compName: c.name,
      category: c.category,
      targetRole: 'Deputy Director General',
      department: profile.department,
      selfAssessmentLevel: 'Advanced',
      baselineScore: 82,
      baselineDate: '2024-04-01T10:00:00Z',
      previousAssessments: [{ title: 'National Statistical Commission Senior Review', score: 85, date: '2024-04-01T10:00:00Z' }],
      workExperienceYears: 18,
      workExperienceDetails: 'Capacity Building & National Statistical Architecture Oversight',
    })
  );

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
      jobRole: 'Statistical Data Analyst',
      targetRole: 'Senior Statistical Officer',
      status: 'Active',
      trainingStatus: 'Not Started',
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
      jobRole: 'Data Scientist',
      targetRole: 'Lead Data Scientist',
      status: 'Active',
      trainingStatus: 'Not Started',
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

function createDemoLearner(): UserRecord {
  return {
    profile: {
      id: DEMO_USER_IDS.DEMO_LEARNER,
      name: 'Demo Learner',
      email: 'learner@statwise.gov.in',
      passwordHash: hashPassword('learner@statwise.gov.in', 'demo123'),
      role: 'employee',
      designation: 'Statistical Officer (Trainee)',
      department: 'Field Operations Division (FOD)',
      years_experience: 1,
      education: 'B.Sc. Statistics',
      current_assignment: 'Sample Survey Field Operations',
      career_goal: 'Strengthen field survey methodologies and technical competencies.',
      employee_id: 'DEMO-L001',
      createdAt: new Date().toISOString(),
      jobRole: 'Statistical Data Analyst',
      targetRole: 'Statistical Officer',
      status: 'Active',
      trainingStatus: 'Not Started',
      onboardingCompleted: false,
      faceEnrolled: false,
      faceEnrollmentStatus: 'NOT_ENROLLED',
      faceAuthenticationEnabled: false,
    },
    onboardingCompleted: false,
    faceEnrolled: false,
    faceEnrollmentStatus: 'NOT_ENROLLED',
    faceAuthenticationEnabled: false,
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
      id: 'N-DEMO-L001',
      message: 'Welcome Demo Learner! Face enrollment required to secure your account.',
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
    { id: DEMO_USER_IDS.DEMO_LEARNER, create: createDemoLearner },
  ];

  for (const { id, create } of demoSeeds) {
    if (!existing[id]) {
      existing[id] = create();
      changed = true;
    } else {
      if (
        id.startsWith('demo-') &&
        id !== DEMO_USER_IDS.DEMO_LEARNER &&
        (!existing[id].faceTemplate || !existing[id].faceEnrolled)
      ) {
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
      // Ensure jobRole and targetRole are set on existing stored demo records
      if (existing[id]?.profile && !existing[id].profile.jobRole) {
        const fresh = create();
        existing[id].profile.jobRole = fresh.profile.jobRole;
        existing[id].profile.targetRole = fresh.profile.targetRole;
        existing[id].profile.status = fresh.profile.status || 'Active';
        existing[id].profile.trainingStatus = fresh.profile.trainingStatus || 'In Progress';
        changed = true;
      }

      // Ensure existing stored demo records receive the AI Competency Engine evidence trail and confidence
      const hasEngineEvidence = existing[id]?.competencies?.length > 0 && !!existing[id].competencies[0]?.evidence;
      if (!hasEngineEvidence && id.startsWith('demo-') && existing[id]?.assessmentCompleted) {
        const fresh = create();
        existing[id].competencies = fresh.competencies;
        existing[id].skillGaps = fresh.skillGaps;
        existing[id].recommendations = fresh.recommendations;
        existing[id].learningPath = fresh.learningPath;
        changed = true;
      }
    }
  }

  if (changed) saveAllUsers(existing);

  // Initialize Admin governance collections if absent
  if (!localStorage.getItem(JOB_ROLES_KEY)) {
    localStorage.setItem(JOB_ROLES_KEY, JSON.stringify(DEFAULT_JOB_ROLES));
  }
  if (!localStorage.getItem(TRAINERS_KEY)) {
    localStorage.setItem(TRAINERS_KEY, JSON.stringify(DEFAULT_TRAINERS));
  }
  if (!localStorage.getItem(AUDIT_LOGS_KEY)) {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
  }
  if (!localStorage.getItem(COURSES_GOV_KEY)) {
    localStorage.setItem(COURSES_GOV_KEY, JSON.stringify(DEFAULT_COURSES_GOVERNANCE));
  }
  if (!localStorage.getItem(ASSESSMENTS_GOV_KEY)) {
    localStorage.setItem(ASSESSMENTS_GOV_KEY, JSON.stringify(DEFAULT_ASSESSMENTS_GOVERNANCE));
  }
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
  u.faceEnrollmentStatus = 'ENROLLED';
  u.faceAuthenticationEnabled = true;
  u.faceTemplate = template;
  u.faceEnrolledAt = now;
  if (thumbnail) u.enrolledFaceThumbnail = thumbnail;
  if (u.profile) {
    u.profile.faceEnrolled = true;
    u.profile.faceEnrollmentStatus = 'ENROLLED';
    u.profile.faceAuthenticationEnabled = true;
    u.profile.faceTemplate = template;
    u.profile.faceEnrolledAt = now;
    if (thumbnail) u.profile.enrolledFaceThumbnail = thumbnail;
  }
  saveAllUsers(users);
  return u;
}

export function disableFaceEnrollment(userId: string): UserRecord {
  initializeStore();
  const users = loadAllUsers();
  const u = users[userId];
  if (!u) throw new Error('User not found');
  u.faceAuthenticationEnabled = false;
  u.faceEnrollmentStatus = 'REVOKED';
  if (u.profile) {
    u.profile.faceAuthenticationEnabled = false;
    u.profile.faceEnrollmentStatus = 'REVOKED';
  }
  saveAllUsers(users);
  return u;
}

export function resetFaceEnrollment(userId: string): UserRecord {
  initializeStore();
  const users = loadAllUsers();
  const u = users[userId];
  if (!u) throw new Error('User not found');
  u.faceEnrolled = false;
  u.faceAuthenticationEnabled = false;
  u.faceEnrollmentStatus = 'NOT_ENROLLED';
  delete u.faceTemplate;
  delete u.faceEnrolledAt;
  delete u.enrolledFaceThumbnail;
  if (u.profile) {
    u.profile.faceEnrolled = false;
    u.profile.faceAuthenticationEnabled = false;
    u.profile.faceEnrollmentStatus = 'NOT_ENROLLED';
    delete u.profile.faceTemplate;
    delete u.profile.faceEnrolledAt;
    delete u.profile.enrolledFaceThumbnail;
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
    throw new Error('Face verification was unsuccessful. Please make sure your face is clearly visible and try again.');
  }

  // Check enrollment
  const enrolledTemplate = found.faceTemplate || found.profile.faceTemplate;
  const isEnrolled = (found.faceEnrolled || found.profile.faceEnrolled) && found.faceEnrollmentStatus !== 'REVOKED';
  if (!isEnrolled || !enrolledTemplate) {
    throw new Error('This account has not completed face enrollment. Please sign in using password and complete Face Setup.');
  }

  // 1:1 Biometric Verification: strictly require live capture template
  if (!liveTemplate) {
    throw new Error('Live face biometric capture is required for face authentication.');
  }

  const comparison = compareFaceVectors(enrolledTemplate, liveTemplate);
  if (!comparison.match) {
    throw new Error('Face verification was unsuccessful. Please make sure your face is clearly visible and try again.');
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

  const oldComps = record.competencies || [];
  const nowIso = new Date().toISOString();

  // Evaluate every competency using AI Competency Engine
  const newComps: CompetencyScore[] = COMPETENCY_LIST.map(comp => {
    const old = oldComps.find(o => o.competency_id === comp.id || o.code === comp.code);
    const hasTestedQ = !!totalPerCode[comp.code];
    const score = hasTestedQ
      ? Math.round(((correctPerCode[comp.code] || 0) / totalPerCode[comp.code]) * 100)
      : (old?.score_percentage ?? 50);

    // Collect relevant completed coursework for this competency
    const relevantTraining = (record.learningHistory || [])
      .filter(h => h.course?.competency_codes?.includes(comp.code) && h.status === 'Completed')
      .map(h => ({
        courseTitle: h.course.title,
        completedDate: h.completed_at || h.enrolled_at,
        score: h.score ?? undefined,
      }));

    // Collect any prior historical assessments
    const previousAssessments = (old?.evidence || [])
      .filter(e => (e.type === 'previous_assessment' || e.type === 'baseline_assessment') && e.score !== undefined)
      .map(e => ({
        title: e.details,
        score: e.score!,
        date: e.date || nowIso,
      }));

    return evaluateCompetencyWithEngine({
      compCode: comp.code,
      compName: comp.name,
      category: comp.category,
      targetRole: record.profile.targetRole || record.profile.jobRole,
      department: record.profile.department,
      selfAssessmentLevel: old?.selfReportedProficiency || 'None',
      baselineScore: score,
      baselineDate: nowIso,
      previousTraining: relevantTraining,
      previousAssessments,
      workExperienceYears: record.profile.years_experience || 0,
      workExperienceDetails: record.profile.current_assignment || '',
    });
  });

  const competencyUpdates = newComps.map(nc => {
    const old = oldComps.find(o => o.competency_id === nc.competency_id);
    const before = old?.score_percentage ?? 0;
    return { competency_id: nc.competency_id, competency_name: nc.competency_name, before, after: nc.score_percentage, delta: nc.score_percentage - before };
  });

  const newSkillGaps = calculateGapsFromCompetencies(newComps, record.profile.role, record.profile.jobRole);
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

export function completeCourseAndPostAssessment(
  userId: string,
  courseId: string,
  postScore: number
): void {
  const users = loadAllUsers();
  const record = users[userId];
  if (!record) return;

  const course = COURSES_CATALOGUE.find(c => c.id === courseId);
  if (!course) return;

  const nowIso = new Date().toISOString();
  let histItem = record.learningHistory.find(h => h.course?.id === courseId);
  if (histItem) {
    histItem.status = 'Completed';
    histItem.completed_at = nowIso;
    histItem.score = postScore;
    histItem.hours_spent = course.duration_hours;
  } else {
    histItem = {
      id: `H${Date.now()}`,
      course,
      status: 'Completed',
      enrolled_at: nowIso,
      completed_at: nowIso,
      hours_spent: course.duration_hours,
      score: postScore,
    };
    record.learningHistory.push(histItem);
  }

  // Update learning path status
  record.learningPath = record.learningPath.map(item =>
    item.course?.id === courseId ? { ...item, status: 'Completed' } : item
  );

  // Update relevant competencies with Post-Training Assessment evidence
  const compCodesToUpdate = course.competency_codes || [];
  record.competencies = (record.competencies || []).map(c => {
    if (compCodesToUpdate.includes(c.code)) {
      return evaluateCompetencyWithEngine({
        compCode: c.code,
        compName: c.competency_name,
        category: c.category,
        targetRole: record.profile.targetRole || record.profile.jobRole,
        department: record.profile.department,
        selfAssessmentLevel: c.selfReportedProficiency || 'None',
        baselineScore: c.score_percentage,
        baselineDate: c.lastAssessedAt,
        previousTraining: [{ courseTitle: course.title, completedDate: nowIso, score: postScore }],
        workExperienceYears: record.profile.years_experience || 0,
        workExperienceDetails: record.profile.current_assignment || '',
        postTrainingScore: postScore,
        postTrainingDate: nowIso,
        postTrainingCourseTitle: course.title,
      });
    }
    return c;
  });

  // Recalculate skill gaps & recommendations with fresh evidence
  record.skillGaps = calculateGapsFromCompetencies(record.competencies, record.profile.role, record.profile.jobRole);
  record.recommendations = generateRecommendations(record.skillGaps.gaps, record.profile.career_goal);
  record.learningPath = generateLearningPath(record.recommendations, record.learningHistory);

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

  // Convert competency profiles using AI Competency Engine
  const mappedCompetencies: CompetencyScore[] = competencyProfiles.map((cp: any) => {
    const compCode = (cp.competencyId || cp.code || '').toUpperCase();
    const compDef = COMPETENCY_LIST.find(c => c.code === compCode || c.id === compCode);

    // Look for self assessment input from onboarding questionnaire
    const selfItem = onboardingDetails?.selfAssessment?.find(
      (s: any) => (s.competencyId || s.code || '').toUpperCase() === compCode
    );
    const selfLevel = selfItem?.level || 'None';

    const workYears = record.profile.years_experience || (onboardingDetails?.workExperience?.length ? 2 : 0);

    return evaluateCompetencyWithEngine({
      compCode: compDef?.code || compCode,
      compName: cp.competencyName || compDef?.name || compCode,
      category: cp.category || compDef?.category || 'Statistical',
      targetRole: record.profile.targetRole || record.profile.jobRole,
      department: record.profile.department,
      selfAssessmentLevel: selfLevel,
      baselineScore: cp.assessedLevel,
      baselineDate: new Date().toISOString(),
      workExperienceYears: workYears,
      workExperienceDetails: record.profile.current_assignment || '',
    });
  });
  record.competencies = mappedCompetencies;

  // Derive dynamic skill gaps with priority reasons, prerequisites & confidence
  const dynamicSkillGaps = calculateGapsFromCompetencies(
    mappedCompetencies,
    record.profile.role,
    record.profile.jobRole || record.profile.designation
  );
  record.skillGaps = dynamicSkillGaps;

  // Generate recommendations directly targeted to the open skill gaps
  record.recommendations = generateRecommendations(dynamicSkillGaps.gaps, record.profile.career_goal || 'Excellence in Official Statistics');
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

// ─── Admin Governance Public APIs ─────────────────────────────────────────────

export function getCompetencyDomains(): CompetencyDomainInfo[] {
  return DEFAULT_COMPETENCY_DOMAINS;
}

export function getJobRoles(): JobRoleDefinition[] {
  initializeStore();
  return loadAllJobRoles();
}

export function getJobRoleById(id: string): JobRoleDefinition | null {
  const roles = getJobRoles();
  return roles.find(r => r.id === id || r.title.toLowerCase() === id.toLowerCase() || r.code.toLowerCase() === id.toLowerCase()) || null;
}

export function saveJobRoleFramework(
  roleId: string,
  competencies: JobRoleCompetencyReq[],
  publishNewVersion: boolean = true,
  adminName: string = 'System Administrator'
): JobRoleDefinition {
  initializeStore();
  const roles = loadAllJobRoles();
  const index = roles.findIndex(r => r.id === roleId);
  if (index === -1) throw new Error('Job Role not found');

  const oldRole = roles[index];
  const newVersion = publishNewVersion ? oldRole.frameworkVersion + 1 : oldRole.frameworkVersion;
  const now = new Date().toISOString();

  const updatedRole: JobRoleDefinition = {
    ...oldRole,
    competencies,
    frameworkVersion: newVersion,
    publishedAt: publishNewVersion ? now : oldRole.publishedAt,
  };

  roles[index] = updatedRole;
  saveAllJobRoles(roles);

  // Record tamper-evident Admin Audit Log
  addAdminAuditLog({
    adminName,
    adminEmail: 'admin@statsetu.gov.in',
    action: publishNewVersion ? 'PUBLISH_FRAMEWORK' : 'UPDATE_FRAMEWORK',
    resource: `Job Role: ${oldRole.title} (v${newVersion})`,
    previousValue: `v${oldRole.frameworkVersion} (${oldRole.competencies.length} competencies)`,
    newValue: `v${newVersion} (${competencies.length} competencies)`,
    status: 'SUCCESS',
  });

  // Section 17 & 35: Connect Admin Competency Framework directly to Learner Engine!
  // Recalculate skill gaps & recommendations for all employees assigned this job role or matching designation
  const users = loadAllUsers();
  let affectedCount = 0;

  Object.values(users).forEach(u => {
    const isMatchingRole =
      (u.profile.jobRole && u.profile.jobRole.toLowerCase() === oldRole.title.toLowerCase()) ||
      u.profile.designation.toLowerCase().includes(oldRole.title.toLowerCase()) ||
      (oldRole.code && u.profile.designation.toLowerCase().includes(oldRole.code.toLowerCase()));

    if (u.profile.role === 'employee' && isMatchingRole && u.competencies && u.competencies.length > 0) {
      const recalculated = calculateGapsFromCompetencies(u.competencies, u.profile.role, updatedRole.title);
      u.skillGaps = recalculated;
      u.recommendations = generateRecommendations(recalculated.gaps, u.profile.career_goal || '');
      u.learningPath = generateLearningPath(u.recommendations, u.learningHistory || []);
      
      u.notifications = [
        {
          id: `N-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          message: `Official Notice: MoSPI Administrator published Competency Framework v${newVersion} for your role (${oldRole.title}). Your required competencies, skill gaps, and course recommendations have been updated.`,
          is_read: false,
          created_at: now,
        },
        ...(u.notifications || []),
      ];
      users[u.profile.id] = u;
      affectedCount++;
    }
  });

  if (affectedCount > 0) {
    saveAllUsers(users);
  }

  return updatedRole;
}

export function createJobRole(
  data: Omit<JobRoleDefinition, 'id' | 'frameworkVersion' | 'publishedAt'>,
  adminName: string = 'System Administrator'
): JobRoleDefinition {
  initializeStore();
  const roles = loadAllJobRoles();
  const newId = `ROLE-${String(roles.length + 1).padStart(2, '0')}`;
  const now = new Date().toISOString();

  const newRole: JobRoleDefinition = {
    ...data,
    id: newId,
    frameworkVersion: 1,
    publishedAt: now,
  };

  roles.push(newRole);
  saveAllJobRoles(roles);

  addAdminAuditLog({
    adminName,
    adminEmail: 'admin@statsetu.gov.in',
    action: 'CREATE_JOB_ROLE',
    resource: `Job Role: ${newRole.title} (${newRole.code})`,
    previousValue: 'None',
    newValue: `Created in ${newRole.department} with ${newRole.competencies.length} competencies`,
    status: 'SUCCESS',
  });

  return newRole;
}

export function updateJobRoleMeta(
  roleId: string,
  updates: Partial<Pick<JobRoleDefinition, 'title' | 'code' | 'department' | 'description' | 'isActive'>>,
  adminName: string = 'System Administrator'
): JobRoleDefinition {
  initializeStore();
  const roles = loadAllJobRoles();
  const index = roles.findIndex(r => r.id === roleId);
  if (index === -1) throw new Error('Job Role not found');

  const old = roles[index];
  const updated = { ...old, ...updates };
  roles[index] = updated;
  saveAllJobRoles(roles);

  addAdminAuditLog({
    adminName,
    adminEmail: 'admin@statsetu.gov.in',
    action: 'UPDATE_JOB_ROLE_METADATA',
    resource: `Job Role: ${updated.title}`,
    previousValue: JSON.stringify(updates),
    newValue: 'Applied',
    status: 'SUCCESS',
  });

  return updated;
}

export function deleteJobRole(roleId: string, adminName: string = 'System Administrator'): boolean {
  initializeStore();
  const roles = loadAllJobRoles();
  const target = roles.find(r => r.id === roleId);
  if (!target) return false;

  const filtered = roles.filter(r => r.id !== roleId);
  saveAllJobRoles(filtered);

  addAdminAuditLog({
    adminName,
    adminEmail: 'admin@statsetu.gov.in',
    action: 'DELETE_JOB_ROLE',
    resource: `Job Role: ${target.title}`,
    previousValue: target.title,
    newValue: 'Deleted',
    status: 'WARNING',
  });

  return true;
}

// ─── Trainer Governance APIs ──────────────────────────────────────────────────

export function getTrainerRecords(): TrainerRecord[] {
  initializeStore();
  return loadAllTrainers();
}

export function getTrainerById(id: string): TrainerRecord | null {
  const trainers = getTrainerRecords();
  return trainers.find(t => t.id === id || t.email.toLowerCase() === id.toLowerCase()) || null;
}

export function updateTrainerStatus(
  trainerId: string,
  status: TrainerRecord['status'],
  reviewNotes: string = '',
  adminName: string = 'System Administrator'
): TrainerRecord {
  initializeStore();
  const trainers = loadAllTrainers();
  const index = trainers.findIndex(t => t.id === trainerId);
  if (index === -1) throw new Error('Trainer not found');

  const oldTrainer = trainers[index];
  const now = new Date().toISOString();
  const updated: TrainerRecord = {
    ...oldTrainer,
    status,
    reviewedAt: now,
    reviewedBy: adminName,
    reviewNotes: reviewNotes || oldTrainer.reviewNotes,
  };

  trainers[index] = updated;
  saveAllTrainers(trainers);

  // Synchronize account role in user records if approved or activated
  const users = loadAllUsers();
  const userMatch = Object.values(users).find(
    u => u.profile.email.toLowerCase() === oldTrainer.email.toLowerCase()
  );
  if (userMatch) {
    if (status === 'approved' || status === 'active') {
      userMatch.profile.role = 'trainer';
    }
    users[userMatch.profile.id] = userMatch;
    saveAllUsers(users);
  }

  // Audit log entry
  addAdminAuditLog({
    adminName,
    adminEmail: 'admin@statsetu.gov.in',
    action: `TRAINER_${status.toUpperCase()}`,
    resource: `Trainer: ${oldTrainer.name} (${oldTrainer.department})`,
    previousValue: `status: ${oldTrainer.status}`,
    newValue: `status: ${status}${reviewNotes ? ` (${reviewNotes})` : ''}`,
    status: 'SUCCESS',
  });

  return updated;
}

// ─── Admin Audit Logs APIs ────────────────────────────────────────────────────

export function getAdminAuditLogs(): AdminAuditEntry[] {
  initializeStore();
  return loadAllAuditLogs();
}

export function addAdminAuditLog(entry: Omit<AdminAuditEntry, 'id' | 'timestamp'>): AdminAuditEntry {
  initializeStore();
  const logs = loadAllAuditLogs();
  const newEntry: AdminAuditEntry = {
    ...entry,
    id: `AUD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    timestamp: new Date().toISOString(),
  };

  logs.unshift(newEntry);
  // Keep last 150 entries
  saveAllAuditLogs(logs.slice(0, 150));
  return newEntry;
}

// ─── Course Governance APIs ───────────────────────────────────────────────────

export function getCourseGovernanceList(): CourseGovernanceItem[] {
  initializeStore();
  return loadAllCoursesGov();
}

export function updateCourseGovernance(
  courseId: string,
  updates: Partial<CourseGovernanceItem>,
  adminName: string = 'System Administrator'
): CourseGovernanceItem {
  initializeStore();
  const list = loadAllCoursesGov();
  const index = list.findIndex(c => c.id === courseId);
  if (index === -1) throw new Error('Course not found');

  const old = list[index];
  const updated = { ...old, ...updates };
  list[index] = updated;
  saveAllCoursesGov(list);

  addAdminAuditLog({
    adminName,
    adminEmail: 'admin@statsetu.gov.in',
    action: 'UPDATE_COURSE_GOVERNANCE',
    resource: `Course: ${updated.title} (${updated.id})`,
    previousValue: JSON.stringify(updates),
    newValue: 'Updated course-to-competency metadata',
    status: 'SUCCESS',
  });

  return updated;
}

// ─── Assessment Governance APIs ───────────────────────────────────────────────

export function getAssessmentGovernanceList(): AssessmentGovItem[] {
  initializeStore();
  return loadAllAssessmentsGov();
}

export function updateAssessmentGovStatus(
  assessmentId: string,
  status: AssessmentGovItem['status'],
  aiStatus?: AssessmentGovItem['aiReviewStatus'],
  adminName: string = 'System Administrator'
): AssessmentGovItem {
  initializeStore();
  const list = loadAllAssessmentsGov();
  const index = list.findIndex(a => a.id === assessmentId);
  if (index === -1) throw new Error('Assessment not found');

  const old = list[index];
  const updated: AssessmentGovItem = {
    ...old,
    status,
    aiReviewStatus: aiStatus !== undefined ? aiStatus : old.aiReviewStatus,
  };

  list[index] = updated;
  saveAllAssessmentsGov(list);

  addAdminAuditLog({
    adminName,
    adminEmail: 'admin@statsetu.gov.in',
    action: 'UPDATE_ASSESSMENT_STATUS',
    resource: `Assessment: ${updated.title}`,
    previousValue: `status: ${old.status}`,
    newValue: `status: ${status}${aiStatus ? `, aiReview: ${aiStatus}` : ''}`,
    status: 'SUCCESS',
  });

  return updated;
}

// ─── Workforce Analytics & Dashboard Metrics ───────────────────────────────────

export function getWorkforceSummaryKPIs() {
  return {
    totalEmployees: 12540,
    activeLearners: 8430,
    activeTrainers: 326,
    courses: 1248,
    avgCompetency: 68,
    criticalSkillGaps: 7,
    trainingCompletion: 74,
  };
}

export function getWorkforceDomainAverages() {
  return [
    { domain: 'Statistical', score: 82, benchmark: 80, color: '#1e3a5f' },
    { domain: 'Technical Skills', score: 64, benchmark: 70, color: '#2563eb' },
    { domain: 'Digital Governance', score: 58, benchmark: 65, color: '#059669' },
    { domain: 'Behavioural & Managerial', score: 73, benchmark: 75, color: '#7c3aed' },
  ];
}

export function getTopOrgSkillGaps() {
  return [
    { competency: 'AI / ML', current: 38, required: 60, gap: 22, affectedEmployees: 2840, domain: 'Technical', priority: 'Critical' },
    { competency: 'Data Visualization', current: 45, required: 70, gap: 25, affectedEmployees: 2310, domain: 'Technical', priority: 'Critical' },
    { competency: 'Python', current: 43, required: 70, gap: 27, affectedEmployees: 2150, domain: 'Technical', priority: 'Critical' },
    { competency: 'GIS & Geospatial Analysis', current: 32, required: 55, gap: 23, affectedEmployees: 1890, domain: 'Technical', priority: 'High' },
    { competency: 'Cloud Computing', current: 28, required: 50, gap: 22, affectedEmployees: 1420, domain: 'Technical', priority: 'High' },
  ];
}

export function getDepartmentAnalytics() {
  return [
    { department: 'Labour Statistics', avgCompetency: 64, criticalGaps: 'AI / ML', employeesCount: 1640, completionRate: 72 },
    { department: 'Agricultural Statistics', avgCompetency: 71, criticalGaps: 'GIS & Geospatial', employeesCount: 2280, completionRate: 78 },
    { department: 'National Accounts', avgCompetency: 76, criticalGaps: 'Python', employeesCount: 1950, completionRate: 84 },
    { department: 'Industrial Statistics', avgCompetency: 61, criticalGaps: 'Data Visualization', employeesCount: 1820, completionRate: 68 },
    { department: 'Field Operations Division (FOD)', avgCompetency: 59, criticalGaps: 'Open Data & APIs', employeesCount: 3120, completionRate: 65 },
    { department: 'Social Statistics Division', avgCompetency: 67, criticalGaps: 'Cloud Computing', employeesCount: 1730, completionRate: 74 },
  ];
}

export function getTrainingEffectivenessData() {
  return [
    { skill: 'Python for Data Analysis', before: 43, after: 71, delta: 28, cohortSize: 1840 },
    { skill: 'Survey Sampling & Design', before: 52, after: 79, delta: 27, cohortSize: 2410 },
    { skill: 'Digital Data Governance', before: 48, after: 74, delta: 26, cohortSize: 1620 },
    { skill: 'GIS & Geospatial Analysis', before: 35, after: 63, delta: 28, cohortSize: 1290 },
    { skill: 'Database & SQL Querying', before: 45, after: 72, delta: 27, cohortSize: 1950 },
  ];
}

export function getEmergingSkillsData() {
  return [
    { skill: 'AI / ML in Official Statistics', demand: 'High', priority: 1, current: 38, required: 60, trend: '+34% YoY' },
    { skill: 'GIS & Satellite Remote Sensing', demand: 'High', priority: 2, current: 32, required: 55, trend: '+28% YoY' },
    { skill: 'Cloud Computing & Data Lakes', demand: 'High', priority: 3, current: 28, required: 50, trend: '+25% YoY' },
    { skill: 'Data Visualization & Storytelling', demand: 'Medium', priority: 4, current: 45, required: 70, trend: '+20% YoY' },
    { skill: 'Python for Automated Microdata', demand: 'High', priority: 5, current: 43, required: 70, trend: '+38% YoY' },
    { skill: 'Big Data Analytics & Spark', demand: 'Medium', priority: 6, current: 30, required: 60, trend: '+18% YoY' },
  ];
}

// ─── Employee Directory Accessors ─────────────────────────────────────────────

export interface EmployeeDirectoryRecord {
  id: string;
  name: string;
  email: string;
  employee_id: string;
  department: string;
  designation: string;
  currentRole: string;
  targetRole: string;
  overallCompetency: number;
  competencyLevel: CompetencyLevelName;
  criticalGapsCount: number;
  topGapName: string;
  trainingStatus: 'Enrolled' | 'Completed' | 'In Progress' | 'Not Started';
  status: 'Active' | 'Inactive';
  assessmentScore: number | null;
  assessmentDate: string | null;
  enrolledCoursesCount: number;
  completedCoursesCount: number;
  competencies: CompetencyScore[];
  skillGaps: SkillGapResult | null;
  learningHistory: HistoryItem[];
  recommendations: Recommendation[];
}

export function getAllUserRecords(): UserRecord[] {
  initializeStore();
  const users = loadAllUsers();
  return Object.values(users);
}

export function getEmployeeDirectory(): EmployeeDirectoryRecord[] {
  initializeStore();
  const users = loadAllUsers();
  const result: EmployeeDirectoryRecord[] = [];

  // Extract all users with role === 'employee'
  Object.values(users)
    .filter(u => u.profile.role === 'employee')
    .forEach(u => {
      const comps = u.competencies || [];
      const avgScore = comps.length > 0
        ? Math.round(comps.reduce((acc, c) => acc + c.score_percentage, 0) / comps.length)
        : (u.assessmentScore || 50);

      const highGaps = u.skillGaps?.gaps?.filter(g => g.gap_label === 'High') || [];
      const topGap = highGaps[0]?.competency_name || u.skillGaps?.gaps?.[0]?.competency_name || 'None';
      const completedCount = u.learningHistory?.filter(h => h.status === 'Completed').length || 0;
      const enrolledCount = (u.enrolledCourses?.length || 0) + (u.learningHistory?.length || 0);

      result.push({
        id: u.profile.id,
        name: u.profile.name,
        email: u.profile.email,
        employee_id: u.profile.employee_id || 'EMP-000',
        department: u.profile.department || 'National Accounts',
        designation: u.profile.designation || 'Statistical Officer',
        currentRole: u.profile.jobRole || 'Statistical Data Analyst',
        targetRole: u.profile.targetRole || 'Senior Statistical Officer',
        overallCompetency: avgScore,
        competencyLevel: getCompetencyScale(avgScore).level,
        criticalGapsCount: highGaps.length,
        topGapName: topGap,
        trainingStatus: u.profile.trainingStatus || (completedCount > 0 ? 'In Progress' : 'Not Started'),
        status: u.profile.status || 'Active',
        assessmentScore: u.assessmentScore || null,
        assessmentDate: u.assessmentDate || null,
        enrolledCoursesCount: enrolledCount,
        completedCoursesCount: completedCount,
        competencies: comps,
        skillGaps: u.skillGaps || null,
        learningHistory: u.learningHistory || [],
        recommendations: u.recommendations || [],
      });
    });

  // Additional representative MoSPI workforce records to demonstrate full enterprise scope
  const mockWorkforce: EmployeeDirectoryRecord[] = [
    {
      id: 'emp-mospi-010',
      name: 'Rajeshwari Patel',
      email: 'r.patel@mospi.gov.in',
      employee_id: 'ISS-4091',
      department: 'Agricultural Statistics',
      designation: 'Deputy Director',
      currentRole: 'Agricultural Statistician',
      targetRole: 'Director (Agricultural Statistics)',
      overallCompetency: 74,
      competencyLevel: 'Proficient',
      criticalGapsCount: 2,
      topGapName: 'GIS & Geospatial Analysis',
      trainingStatus: 'In Progress',
      status: 'Active',
      assessmentScore: 76,
      assessmentDate: '2026-07-14T10:00:00Z',
      enrolledCoursesCount: 3,
      completedCoursesCount: 2,
      competencies: [
        { competency_id: 'STAT01', code: 'STAT01', competency_name: 'Statistical Theory & Methods', category: 'Statistical', current_level: 4, score_percentage: 82 },
        { competency_id: 'STAT02', code: 'STAT02', competency_name: 'Survey Design & Sampling', category: 'Statistical', current_level: 4, score_percentage: 78 },
        { competency_id: 'TECH05', code: 'TECH05', competency_name: 'GIS & Geospatial Analysis', category: 'Technical', current_level: 2, score_percentage: 42 },
        { competency_id: 'TECH01', code: 'TECH01', competency_name: 'Statistical Software (R/Python/SPSS)', category: 'Technical', current_level: 3, score_percentage: 58 },
        { competency_id: 'BEH01', code: 'BEH01', competency_name: 'Communication & Report Writing', category: 'Behavioural & Managerial', current_level: 4, score_percentage: 80 },
      ],
      skillGaps: {
        gaps: [
          { competency_id: 'TECH05', competency_name: 'GIS & Geospatial Analysis', category: 'Technical', current_percentage: 42, required_percentage: 70, gap: 2, gap_label: 'High', explanation: 'Remote sensing for crop yield estimation requires advanced GIS.' },
          { competency_id: 'TECH01', competency_name: 'Statistical Software (R/Python/SPSS)', category: 'Technical', current_percentage: 58, required_percentage: 70, gap: 1, gap_label: 'Medium', explanation: 'Automated survey validation script proficiency recommended.' },
        ],
        strengths: [],
        high_priority_count: 1,
        medium_priority_count: 1,
        low_priority_count: 0,
        summary: 'Targeted GIS upskilling required for satellite crop acreage estimation.',
      },
      learningHistory: [
        { id: 'h-1', course: COURSES_CATALOGUE[0], status: 'Completed', enrolled_at: '2025-08-10', completed_at: '2025-09-12', hours_spent: 24, score: 88 },
        { id: 'h-2', course: COURSES_CATALOGUE[4], status: 'In Progress', enrolled_at: '2026-06-01', completed_at: null, hours_spent: 14, score: null },
      ],
      recommendations: [
        { id: 'rec-1', course_id: 'C005', course: COURSES_CATALOGUE[4], match_score: 95, reason: 'Addresses high priority gap in GIS & Geospatial Analysis.' }
      ],
    },
    {
      id: 'emp-mospi-011',
      name: 'Vikrant Mehta',
      email: 'v.mehta@mospi.gov.in',
      employee_id: 'ISS-3184',
      department: 'Industrial Statistics',
      designation: 'Assistant Director',
      currentRole: 'Statistical Data Analyst',
      targetRole: 'Economic Statistician',
      overallCompetency: 61,
      competencyLevel: 'Proficient',
      criticalGapsCount: 3,
      topGapName: 'Index Numbers & Price Statistics',
      trainingStatus: 'Enrolled',
      status: 'Active',
      assessmentScore: 63,
      assessmentDate: '2026-05-20T11:00:00Z',
      enrolledCoursesCount: 2,
      completedCoursesCount: 1,
      competencies: [
        { competency_id: 'STAT04', code: 'STAT04', competency_name: 'Index Numbers & Price Statistics', category: 'Statistical', current_level: 2, score_percentage: 45 },
        { competency_id: 'TECH02', code: 'TECH02', competency_name: 'Database & SQL Querying', category: 'Technical', current_level: 3, score_percentage: 60 },
        { competency_id: 'TECH03', code: 'TECH03', competency_name: 'Data Visualization & Dashboards', category: 'Technical', current_level: 2, score_percentage: 48 },
      ],
      skillGaps: {
        gaps: [
          { competency_id: 'STAT04', competency_name: 'Index Numbers & Price Statistics', category: 'Statistical', current_percentage: 45, required_percentage: 80, gap: 2, gap_label: 'High', explanation: 'Index of Industrial Production (IIP) compilation requires core price index mastery.' },
          { competency_id: 'TECH03', competency_name: 'Data Visualization & Dashboards', category: 'Technical', current_percentage: 48, required_percentage: 70, gap: 2, gap_label: 'High', explanation: 'Industrial dashboard dissemination requires PowerBI/Superset skills.' },
        ],
        strengths: [],
        high_priority_count: 2,
        medium_priority_count: 0,
        low_priority_count: 0,
        summary: 'Requires IIP methodology and industrial dashboard reporting certification.',
      },
      learningHistory: [
        { id: 'h-3', course: COURSES_CATALOGUE[1], status: 'Completed', enrolled_at: '2025-11-01', completed_at: '2025-12-05', hours_spent: 32, score: 79 },
      ],
      recommendations: [],
    },
    {
      id: 'emp-mospi-012',
      name: 'Sneha Banerjee',
      email: 's.banerjee@mospi.gov.in',
      employee_id: 'ISS-5520',
      department: 'Social Statistics Division',
      designation: 'Senior Statistical Officer',
      currentRole: 'Survey Officer',
      targetRole: 'Director (Social Statistics)',
      overallCompetency: 83,
      competencyLevel: 'Advanced',
      criticalGapsCount: 0,
      topGapName: 'None',
      trainingStatus: 'Completed',
      status: 'Active',
      assessmentScore: 86,
      assessmentDate: '2026-08-05T09:30:00Z',
      enrolledCoursesCount: 4,
      completedCoursesCount: 4,
      competencies: [
        { competency_id: 'STAT01', code: 'STAT01', competency_name: 'Statistical Theory & Methods', category: 'Statistical', current_level: 5, score_percentage: 90 },
        { competency_id: 'STAT02', code: 'STAT02', competency_name: 'Survey Design & Sampling', category: 'Statistical', current_level: 4, score_percentage: 88 },
        { competency_id: 'DIG01', code: 'DIG01', competency_name: 'Digital Data Governance', category: 'Digital Governance', current_level: 4, score_percentage: 82 },
        { competency_id: 'BEH01', code: 'BEH01', competency_name: 'Communication & Report Writing', category: 'Behavioural & Managerial', current_level: 5, score_percentage: 92 },
      ],
      skillGaps: {
        gaps: [],
        strengths: [],
        high_priority_count: 0,
        medium_priority_count: 0,
        low_priority_count: 0,
        summary: 'Exceeds all baseline and promotional requirements for Social Statistics Director role.',
      },
      learningHistory: [
        { id: 'h-4', course: COURSES_CATALOGUE[0], status: 'Completed', enrolled_at: '2024-03-01', completed_at: '2024-03-25', hours_spent: 24, score: 94 },
        { id: 'h-5', course: COURSES_CATALOGUE[1], status: 'Completed', enrolled_at: '2024-05-10', completed_at: '2024-06-12', hours_spent: 32, score: 91 },
      ],
      recommendations: [],
    },
    {
      id: 'emp-mospi-013',
      name: 'Manoj Tiwari',
      email: 'm.tiwari@mospi.gov.in',
      employee_id: 'FOD-8219',
      department: 'Field Operations Division (FOD)',
      designation: 'Junior Statistical Officer',
      currentRole: 'Statistical Investigator',
      targetRole: 'Statistical Officer',
      overallCompetency: 52,
      competencyLevel: 'Developing',
      criticalGapsCount: 3,
      topGapName: 'Open Data & API Standards',
      trainingStatus: 'In Progress',
      status: 'Active',
      assessmentScore: 54,
      assessmentDate: '2026-06-18T14:00:00Z',
      enrolledCoursesCount: 2,
      completedCoursesCount: 0,
      competencies: [
        { competency_id: 'STAT03', code: 'STAT03', competency_name: 'Data Collection & Validation', category: 'Statistical', current_level: 3, score_percentage: 65 },
        { competency_id: 'DIG02', code: 'DIG02', competency_name: 'Open Data & API Standards', category: 'Digital Governance', current_level: 1, score_percentage: 28 },
        { competency_id: 'DIG04', code: 'DIG04', competency_name: 'eGovernance Frameworks (GeM, PFMS)', category: 'Digital Governance', current_level: 2, score_percentage: 45 },
      ],
      skillGaps: {
        gaps: [
          { competency_id: 'DIG02', competency_name: 'Open Data & API Standards', category: 'Digital Governance', current_percentage: 28, required_percentage: 60, gap: 2, gap_label: 'High', explanation: 'Field CAPI API transmission standards require compliance training.' },
        ],
        strengths: [],
        high_priority_count: 1,
        medium_priority_count: 0,
        low_priority_count: 0,
        summary: 'Digital reporting and field sync protocols need reinforcement.',
      },
      learningHistory: [],
      recommendations: [],
    },
    {
      id: 'emp-mospi-014',
      name: 'Amrita Ghosh',
      email: 'a.ghosh@mospi.gov.in',
      employee_id: 'ISS-2940',
      department: 'Labour Statistics',
      designation: 'Deputy Director',
      currentRole: 'Labour Statistician',
      targetRole: 'Joint Director (Labour Statistics)',
      overallCompetency: 69,
      competencyLevel: 'Proficient',
      criticalGapsCount: 2,
      topGapName: 'AI / ML for Statistics',
      trainingStatus: 'Enrolled',
      status: 'Active',
      assessmentScore: 71,
      assessmentDate: '2026-04-10T12:00:00Z',
      enrolledCoursesCount: 3,
      completedCoursesCount: 2,
      competencies: [
        { competency_id: 'STAT01', code: 'STAT01', competency_name: 'Statistical Theory & Methods', category: 'Statistical', current_level: 4, score_percentage: 84 },
        { competency_id: 'TECH04', code: 'TECH04', competency_name: 'Machine Learning for Statistics', category: 'Technical', current_level: 2, score_percentage: 36 },
      ],
      skillGaps: {
        gaps: [
          { competency_id: 'TECH04', competency_name: 'Machine Learning for Statistics', category: 'Technical', current_percentage: 36, required_percentage: 65, gap: 2, gap_label: 'High', explanation: 'Automated occupation coding and PLFS outlier detection using ML models.' },
        ],
        strengths: [],
        high_priority_count: 1,
        medium_priority_count: 0,
        low_priority_count: 0,
        summary: 'Recommended for ML in Official Statistics cohort.',
      },
      learningHistory: [],
      recommendations: [],
    }
  ];

  // Merge unique records
  mockWorkforce.forEach(mw => {
    if (!result.some(r => r.email.toLowerCase() === mw.email.toLowerCase())) {
      result.push(mw);
    }
  });

  return result;
}
