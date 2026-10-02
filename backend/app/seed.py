"""
StatWise Demo Data Seeder
Populates the SQLite database with realistic Indian statistical system data.
Run automatically on first startup.
"""
import asyncio
import logging
from datetime import datetime, timezone, timedelta
import hashlib
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.database import AsyncSessionLocal, create_tables
from app.models.user import User, Department, UserRole
from app.models.competency import (
    Competency, CompetencyCategory, UserCompetency, RoleCompetencyRequirement
)
from app.models.course import Course, CourseCompetency, LearningHistory, LearningPathItem, CourseProvider
from app.models.assessment import Assessment, Question, DifficultyLevel, QuestionType
from app.models.training import TrainingProgramme, TrainingProvider
from app.models.notification import Notification, NotificationType
from app.models.recommendation import Recommendation

logger = logging.getLogger(__name__)

def hash_password(password: str) -> str:
    salt = "statsetu_salt_"
    return hashlib.sha256((salt + password).encode()).hexdigest()


async def is_seeded(db: AsyncSession) -> bool:
    result = await db.execute(select(User).limit(1))
    return result.scalar_one_or_none() is not None


async def seed_all():
    await create_tables()
    async with AsyncSessionLocal() as db:
        if await is_seeded(db):
            logger.info("Database already seeded, skipping.")
            return
        logger.info("Seeding demo data...")

        # ─── DEPARTMENTS ────────────────────────────────────────────
        depts = [
            Department(name="Department of Statistics", code="DOS", description="Core statistical operations and data collection"),
            Department(name="Economic Statistics Division", code="ESD", description="National accounts and economic indicators"),
            Department(name="Social Statistics Division", code="SSD", description="Population, health, and social indicators"),
            Department(name="Agricultural Statistics Division", code="ASD", description="Crop and agricultural data systems"),
            Department(name="IT and Digital Infrastructure", code="ITDI", description="Technology and digital systems support"),
            Department(name="Training and Capacity Building", code="TCB", description="Learning and development division"),
        ]
        db.add_all(depts)
        await db.flush()

        dept_map = {d.code: d.id for d in depts}

        # ─── COMPETENCIES ────────────────────────────────────────────
        competencies = [
            # Statistical
            Competency(name="Statistical Analysis", code="STAT01", category=CompetencyCategory.statistical, description="Core statistical methods, probability, and inference"),
            Competency(name="Survey Design", code="STAT02", category=CompetencyCategory.statistical, description="Design and methodology of statistical surveys"),
            Competency(name="Sampling", code="STAT03", category=CompetencyCategory.statistical, description="Sampling theory, methods, and application"),
            Competency(name="National Accounts", code="STAT04", category=CompetencyCategory.statistical, description="GDP, GNP, and national accounting frameworks"),
            Competency(name="Price Statistics", code="STAT05", category=CompetencyCategory.statistical, description="CPI, WPI, and inflation measurement"),
            Competency(name="Labour Statistics", code="STAT06", category=CompetencyCategory.statistical, description="Employment, unemployment, and PLFS analysis"),
            Competency(name="Agricultural Statistics", code="STAT07", category=CompetencyCategory.statistical, description="Crop estimation and agricultural data"),
            Competency(name="SDG Indicators", code="STAT08", category=CompetencyCategory.statistical, description="Sustainable Development Goal monitoring and reporting"),
            Competency(name="Data Quality Frameworks", code="STAT09", category=CompetencyCategory.statistical, description="Quality assurance in official statistics"),
            Competency(name="Metadata Standards", code="STAT10", category=CompetencyCategory.statistical, description="SDMX, DDI, and metadata management"),
            # Technical
            Competency(name="Python", code="TECH01", category=CompetencyCategory.technical, description="Python programming for data analysis and automation"),
            Competency(name="R", code="TECH02", category=CompetencyCategory.technical, description="R statistical computing and visualization"),
            Competency(name="SQL", code="TECH03", category=CompetencyCategory.technical, description="SQL databases and data querying"),
            Competency(name="Stata", code="TECH04", category=CompetencyCategory.technical, description="Stata for econometric analysis"),
            Competency(name="SPSS", code="TECH05", category=CompetencyCategory.technical, description="SPSS for statistical analysis"),
            Competency(name="GIS", code="TECH06", category=CompetencyCategory.technical, description="Geographic Information Systems for spatial data"),
            Competency(name="Data Visualization", code="TECH07", category=CompetencyCategory.technical, description="Creating effective data visualizations and dashboards"),
            Competency(name="AI/ML", code="TECH08", category=CompetencyCategory.technical, description="Artificial intelligence and machine learning for statistics"),
            Competency(name="Cloud Computing", code="TECH09", category=CompetencyCategory.technical, description="Government cloud platforms and services"),
            Competency(name="APIs and Open Data", code="TECH10", category=CompetencyCategory.technical, description="Working with government APIs and open data portals"),
            # Digital Governance
            Competency(name="Cybersecurity", code="DIG01", category=CompetencyCategory.digital_governance, description="Information security and data protection"),
            Competency(name="Data Privacy", code="DIG02", category=CompetencyCategory.digital_governance, description="PDPB compliance and privacy-by-design"),
            Competency(name="Digital Signatures", code="DIG03", category=CompetencyCategory.digital_governance, description="e-Sign, PKI, and digital authentication"),
            Competency(name="Government Cloud", code="DIG04", category=CompetencyCategory.digital_governance, description="MeghRaj and NIC cloud infrastructure"),
            Competency(name="Digital Public Infrastructure", code="DIG05", category=CompetencyCategory.digital_governance, description="Aadhaar, UPI, GSTN, and DPI frameworks"),
            # Behavioural
            Competency(name="Leadership", code="BEH01", category=CompetencyCategory.behavioural, description="Team leadership and organizational management"),
            Competency(name="Communication", code="BEH02", category=CompetencyCategory.behavioural, description="Written, oral, and presentation skills"),
            Competency(name="Project Management", code="BEH03", category=CompetencyCategory.behavioural, description="Planning, execution, and monitoring of projects"),
            Competency(name="Ethics and Integrity", code="BEH04", category=CompetencyCategory.behavioural, description="Government ethics, transparency, and accountability"),
            Competency(name="Decision Making", code="BEH05", category=CompetencyCategory.behavioural, description="Analytical and evidence-based decision making"),
        ]
        db.add_all(competencies)
        await db.flush()

        comp_map = {c.code: c.id for c in competencies}
        comp_name_map = {c.name: c.id for c in competencies}

        # ─── ROLE REQUIREMENTS ────────────────────────────────────────
        statistical_officer_reqs = [
            RoleCompetencyRequirement(role_name="Statistical Officer", competency_id=comp_map["STAT01"], required_level=4, priority=3),
            RoleCompetencyRequirement(role_name="Statistical Officer", competency_id=comp_map["STAT02"], required_level=4, priority=3),
            RoleCompetencyRequirement(role_name="Statistical Officer", competency_id=comp_map["STAT03"], required_level=4, priority=3),
            RoleCompetencyRequirement(role_name="Statistical Officer", competency_id=comp_map["STAT04"], required_level=3, priority=2),
            RoleCompetencyRequirement(role_name="Statistical Officer", competency_id=comp_map["STAT05"], required_level=3, priority=2),
            RoleCompetencyRequirement(role_name="Statistical Officer", competency_id=comp_map["STAT08"], required_level=3, priority=2),
            RoleCompetencyRequirement(role_name="Statistical Officer", competency_id=comp_map["TECH01"], required_level=4, priority=3),  # Python
            RoleCompetencyRequirement(role_name="Statistical Officer", competency_id=comp_map["TECH03"], required_level=3, priority=2),  # SQL
            RoleCompetencyRequirement(role_name="Statistical Officer", competency_id=comp_map["TECH06"], required_level=3, priority=3),  # GIS
            RoleCompetencyRequirement(role_name="Statistical Officer", competency_id=comp_map["TECH07"], required_level=3, priority=2),  # Data Viz
            RoleCompetencyRequirement(role_name="Statistical Officer", competency_id=comp_map["TECH08"], required_level=3, priority=3),  # AI/ML
            RoleCompetencyRequirement(role_name="Statistical Officer", competency_id=comp_map["DIG01"], required_level=2, priority=1),
            RoleCompetencyRequirement(role_name="Statistical Officer", competency_id=comp_map["DIG02"], required_level=2, priority=1),
            RoleCompetencyRequirement(role_name="Statistical Officer", competency_id=comp_map["BEH01"], required_level=2, priority=1),
            RoleCompetencyRequirement(role_name="Statistical Officer", competency_id=comp_map["BEH02"], required_level=3, priority=2),
        ]

        data_analyst_reqs = [
            RoleCompetencyRequirement(role_name="Data Analyst", competency_id=comp_map["STAT01"], required_level=3, priority=2),
            RoleCompetencyRequirement(role_name="Data Analyst", competency_id=comp_map["TECH01"], required_level=4, priority=3),
            RoleCompetencyRequirement(role_name="Data Analyst", competency_id=comp_map["TECH03"], required_level=4, priority=3),
            RoleCompetencyRequirement(role_name="Data Analyst", competency_id=comp_map["TECH07"], required_level=4, priority=3),
            RoleCompetencyRequirement(role_name="Data Analyst", competency_id=comp_map["TECH08"], required_level=3, priority=2),
            RoleCompetencyRequirement(role_name="Data Analyst", competency_id=comp_map["DIG01"], required_level=2, priority=1),
        ]

        db.add_all(statistical_officer_reqs + data_analyst_reqs)
        await db.flush()

        # ─── USERS ────────────────────────────────────────────────────
        users_data = [
            # Demo Employee (Ananya Sharma)
            dict(employee_id="MOS2024001", name="Ananya Sharma", email="ananya@statsetu.gov.in",
                 password="demo123", role=UserRole.employee, dept_code="DOS",
                 designation="Statistical Officer", years_experience=5.0,
                 education="M.Sc. Statistics, Delhi University",
                 career_goal="Lead a data science team working on national-level economic indicators and SDG monitoring",
                 current_assignment="Annual Survey of Industries — Data Analysis Unit"),
            # Demo Learner for Face Enrollment Flow
            dict(employee_id="DEMO-L001", name="Demo Learner", email="learner@statwise.gov.in",
                 password="demo123", role=UserRole.employee, dept_code="DOS",
                 designation="Statistical Officer (Trainee)", years_experience=1.0,
                 education="B.Sc. Statistics",
                 career_goal="Strengthen field survey methodologies and technical competencies",
                 current_assignment="Sample Survey Field Operations"),
            # More employees
            dict(employee_id="MOS2024002", name="Rajesh Kumar", email="rajesh@statsetu.gov.in",
                 password="demo123", role=UserRole.employee, dept_code="ESD",
                 designation="Data Analyst", years_experience=8.0,
                 education="B.Tech Computer Science, NIT Trichy",
                 career_goal="Build automated data pipelines for national accounts"),
            dict(employee_id="MOS2024003", name="Priya Nair", email="priya@statsetu.gov.in",
                 password="demo123", role=UserRole.employee, dept_code="SSD",
                 designation="Statistical Officer", years_experience=3.0,
                 education="M.A. Economics, JNU",
                 career_goal="Specialize in SDG indicator monitoring and social statistics"),
            dict(employee_id="MOS2024004", name="Amit Singh", email="amit@statsetu.gov.in",
                 password="demo123", role=UserRole.employee, dept_code="ASD",
                 designation="Senior Statistical Officer", years_experience=12.0,
                 education="M.Sc. Agricultural Statistics, IASRI",
                 career_goal="Modernize agricultural survey methodology using remote sensing"),
            dict(employee_id="MOS2024005", name="Kavitha Reddy", email="kavitha@statsetu.gov.in",
                 password="demo123", role=UserRole.employee, dept_code="DOS",
                 designation="Statistical Officer", years_experience=4.0,
                 education="M.Sc. Statistics, Hyderabad University",
                 career_goal="Develop expertise in machine learning for official statistics"),
            dict(employee_id="MOS2024006", name="Suresh Babu", email="suresh@statsetu.gov.in",
                 password="demo123", role=UserRole.employee, dept_code="ESD",
                 designation="Data Analyst", years_experience=6.0,
                 education="M.Com, Osmania University + Data Science Certification",
                 career_goal="Move into price statistics and CPI methodology"),
            dict(employee_id="MOS2024007", name="Meena Krishnan", email="meena@statsetu.gov.in",
                 password="demo123", role=UserRole.employee, dept_code="SSD",
                 designation="Statistical Officer", years_experience=7.0,
                 education="M.Sc. Population Studies, IIPS Mumbai",
                 career_goal="Lead the PLFS data analysis team"),
            dict(employee_id="MOS2024008", name="Deepak Joshi", email="deepak@statsetu.gov.in",
                 password="demo123", role=UserRole.employee, dept_code="ITDI",
                 designation="Systems Analyst", years_experience=9.0,
                 education="B.E. Information Technology, VTU",
                 career_goal="Build the next-generation statistical data infrastructure"),
            dict(employee_id="MOS2024009", name="Sunita Verma", email="sunita@statsetu.gov.in",
                 password="demo123", role=UserRole.employee, dept_code="ASD",
                 designation="Statistical Officer", years_experience=2.0,
                 education="M.Sc. Statistics, BHU",
                 career_goal="Specialize in GIS-based crop area estimation"),
            dict(employee_id="MOS2024010", name="Arjun Pillai", email="arjun@statsetu.gov.in",
                 password="demo123", role=UserRole.employee, dept_code="DOS",
                 designation="Statistical Officer", years_experience=5.5,
                 education="M.Sc. Applied Statistics, CUSAT",
                 career_goal="Develop expertise in big data analytics for official statistics"),
            # Trainers
            dict(employee_id="TRN2024001", name="Dr. Ramesh Sharma", email="trainer@statsetu.gov.in",
                 password="demo123", role=UserRole.trainer, dept_code="TCB",
                 designation="Senior Training Officer", years_experience=15.0,
                 education="Ph.D. Statistics, ISI Kolkata",
                 career_goal="Develop comprehensive training programmes for NSO staff"),
            dict(employee_id="TRN2024002", name="Dr. Lalitha Menon", email="trainer2@statsetu.gov.in",
                 password="demo123", role=UserRole.trainer, dept_code="TCB",
                 designation="Training Officer", years_experience=10.0,
                 education="M.Sc. Statistics + MBA, IIM Kozhikode",
                 career_goal="Design digital learning pathways for government statisticians"),
            # Admins
            dict(employee_id="ADM2024001", name="Vijay Sharma", email="admin@statsetu.gov.in",
                 password="demo123", role=UserRole.admin, dept_code="DOS",
                 designation="Director", years_experience=20.0,
                 education="IAS, IAS Academy Mussoorie",
                 career_goal="Build a future-ready statistical workforce for India"),
            dict(employee_id="ADM2024002", name="Rekha Gupta", email="admin2@statsetu.gov.in",
                 password="demo123", role=UserRole.admin, dept_code="TCB",
                 designation="Joint Director", years_experience=16.0,
                 education="M.Sc. Statistics, Delhi School of Economics",
                 career_goal="Transform training effectiveness using data-driven insights"),
        ]

        user_objects = []
        for ud in users_data:
            u = User(
                employee_id=ud["employee_id"],
                name=ud["name"],
                email=ud["email"],
                hashed_password=hash_password(ud["password"]),
                role=ud["role"],
                department_id=dept_map.get(ud["dept_code"]),
                designation=ud["designation"],
                years_experience=ud["years_experience"],
                education=ud["education"],
                career_goal=ud.get("career_goal"),
                current_assignment=ud.get("current_assignment"),
                is_active=True,
            )
            db.add(u)
            user_objects.append(u)

        await db.flush()

        ananya = user_objects[0]

        # ─── ANANYA'S COMPETENCIES ─────────────────────────────────────
        ananya_competencies = [
            (comp_map["STAT01"], 88, 4),  # Statistical Analysis
            (comp_map["STAT02"], 82, 4),  # Survey Design
            (comp_map["STAT03"], 65, 3),  # Sampling
            (comp_map["STAT04"], 70, 3),  # National Accounts
            (comp_map["STAT05"], 60, 3),  # Price Statistics
            (comp_map["STAT08"], 75, 3),  # SDG Indicators
            (comp_map["TECH01"], 34, 2),  # Python — High gap
            (comp_map["TECH02"], 45, 2),  # R
            (comp_map["TECH03"], 72, 3),  # SQL
            (comp_map["TECH06"], 25, 1),  # GIS — High gap
            (comp_map["TECH07"], 55, 3),  # Data Visualization — Medium gap
            (comp_map["TECH08"], 31, 2),  # AI/ML — High gap
            (comp_map["DIG01"], 40, 2),  # Cybersecurity
            (comp_map["DIG02"], 50, 2),  # Data Privacy
            (comp_map["BEH01"], 60, 3),  # Leadership
            (comp_map["BEH02"], 75, 3),  # Communication
            (comp_map["BEH03"], 65, 3),  # Project Management
        ]
        now = datetime.now(timezone.utc)
        for cid, score, level in ananya_competencies:
            uc = UserCompetency(
                user_id=ananya.id,
                competency_id=cid,
                score_percentage=float(score),
                current_level=level,
                last_assessed=now - timedelta(days=30),
                assessment_count=1,
            )
            db.add(uc)

        # Other employee competencies (varied profiles)
        other_employee_comps = [
            # Rajesh Kumar — strong tech, avg stats
            (user_objects[1], [(comp_map["STAT01"], 65, 3), (comp_map["TECH01"], 85, 4), (comp_map["TECH03"], 90, 4), (comp_map["TECH07"], 80, 4), (comp_map["TECH08"], 55, 3)]),
            # Priya Nair — good stats, weak tech
            (user_objects[2], [(comp_map["STAT01"], 75, 3), (comp_map["STAT08"], 80, 4), (comp_map["TECH01"], 25, 1), (comp_map["TECH03"], 40, 2), (comp_map["BEH02"], 85, 4)]),
            # Amit Singh — agricultural expert
            (user_objects[3], [(comp_map["STAT01"], 90, 4), (comp_map["STAT07"], 92, 5), (comp_map["TECH06"], 70, 3), (comp_map["TECH01"], 40, 2), (comp_map["BEH01"], 80, 4)]),
            # Kavitha Reddy
            (user_objects[4], [(comp_map["STAT01"], 72, 3), (comp_map["TECH01"], 50, 2), (comp_map["TECH08"], 45, 2), (comp_map["TECH07"], 60, 3), (comp_map["DIG01"], 55, 3)]),
            # Suresh Babu
            (user_objects[5], [(comp_map["STAT05"], 80, 4), (comp_map["TECH03"], 75, 3), (comp_map["TECH01"], 35, 2), (comp_map["BEH03"], 70, 3)]),
            # Meena Krishnan
            (user_objects[6], [(comp_map["STAT06"], 85, 4), (comp_map["STAT01"], 78, 4), (comp_map["TECH01"], 45, 2), (comp_map["BEH02"], 80, 4)]),
            # Deepak Joshi — IT focused
            (user_objects[7], [(comp_map["TECH01"], 82, 4), (comp_map["TECH03"], 85, 4), (comp_map["DIG01"], 78, 4), (comp_map["DIG04"], 72, 3), (comp_map["TECH08"], 60, 3)]),
            # Sunita Verma — junior
            (user_objects[8], [(comp_map["STAT01"], 55, 3), (comp_map["TECH06"], 35, 2), (comp_map["TECH01"], 20, 1), (comp_map["STAT07"], 60, 3)]),
            # Arjun Pillai
            (user_objects[9], [(comp_map["STAT01"], 80, 4), (comp_map["TECH01"], 65, 3), (comp_map["TECH03"], 70, 3), (comp_map["TECH08"], 40, 2), (comp_map["BEH05"], 75, 3)]),
        ]
        for user, comps in other_employee_comps:
            for cid, score, level in comps:
                uc = UserCompetency(
                    user_id=user.id, competency_id=cid,
                    score_percentage=float(score), current_level=level,
                    last_assessed=now - timedelta(days=60), assessment_count=1,
                )
                db.add(uc)

        await db.flush()

        # ─── COURSES (35 courses) ─────────────────────────────────────
        courses = [
            # iGOT courses
            dict(code="IGOT001", title="Python for Data Analysis", provider=CourseProvider.igot,
                 desc="Comprehensive Python programming for statistical data analysis using Pandas, NumPy, and Matplotlib. Designed for government statistical officers.",
                 diff="Intermediate", hours=20, cat="Programming", rating=4.7, comp_codes=["TECH01"], tags=["python", "data-analysis", "pandas"]),
            dict(code="IGOT002", title="Python Fundamentals for Government Officials", provider=CourseProvider.igot,
                 desc="Introduction to Python programming. No prior coding experience required. Covers variables, loops, functions, and basic data handling.",
                 diff="Beginner", hours=12, cat="Programming", rating=4.5, comp_codes=["TECH01"], tags=["python", "beginner", "programming"]),
            dict(code="IGOT003", title="SQL for Statistical Databases", provider=CourseProvider.igot,
                 desc="Advanced SQL queries for statistical databases. Covers window functions, CTEs, and optimization for large government datasets.",
                 diff="Intermediate", hours=15, cat="Database", rating=4.6, comp_codes=["TECH03"], tags=["sql", "database", "queries"]),
            dict(code="IGOT004", title="Data Visualization with Python and Tableau", provider=CourseProvider.igot,
                 desc="Create compelling data visualizations for government reports and dashboards using Python (Matplotlib, Seaborn, Plotly) and Tableau.",
                 diff="Intermediate", hours=18, cat="Visualization", rating=4.8, comp_codes=["TECH07", "TECH01"], tags=["visualization", "dashboard", "charts"]),
            dict(code="IGOT005", title="Introduction to Machine Learning for Officials", provider=CourseProvider.igot,
                 desc="Foundational machine learning concepts for government officials. Covers regression, classification, clustering with practical statistical examples.",
                 diff="Intermediate", hours=25, cat="AI/ML", rating=4.6, comp_codes=["TECH08"], tags=["machine-learning", "ai", "classification"]),
            dict(code="IGOT006", title="Machine Learning for Official Statistics", provider=CourseProvider.igot,
                 desc="Advanced ML techniques applied to official statistics: small area estimation, nowcasting, and automated data validation.",
                 diff="Advanced", hours=30, cat="AI/ML", rating=4.9, comp_codes=["TECH08", "STAT01"], tags=["machine-learning", "official-statistics", "advanced"]),
            dict(code="IGOT007", title="GIS Fundamentals for Government", provider=CourseProvider.igot,
                 desc="Introduction to Geographic Information Systems. Covers GIS concepts, spatial data types, and basic map creation using QGIS.",
                 diff="Beginner", hours=16, cat="GIS", rating=4.4, comp_codes=["TECH06"], tags=["gis", "spatial", "qgis", "maps"]),
            dict(code="IGOT008", title="Cybersecurity for Government Officers", provider=CourseProvider.igot,
                 desc="Essential cybersecurity awareness for government officials. Covers data classification, secure communications, and incident response.",
                 diff="Beginner", hours=8, cat="Security", rating=4.3, comp_codes=["DIG01"], tags=["cybersecurity", "security", "awareness"]),
            dict(code="IGOT009", title="Digital Governance and e-Office", provider=CourseProvider.igot,
                 desc="Digital governance frameworks, e-Office systems, digital signatures, and government workflow automation.",
                 diff="Beginner", hours=10, cat="Digital Governance", rating=4.2, comp_codes=["DIG03", "DIG04"], tags=["e-governance", "digital", "e-office"]),
            dict(code="IGOT010", title="R for Statistical Computing", provider=CourseProvider.igot,
                 desc="Statistical computing with R. Covers data manipulation, statistical testing, regression analysis, and publication-quality graphics.",
                 diff="Intermediate", hours=20, cat="Programming", rating=4.7, comp_codes=["TECH02"], tags=["r", "statistics", "programming"]),
            dict(code="IGOT011", title="Open Data and Government APIs", provider=CourseProvider.igot,
                 desc="Working with open government data portals, REST APIs, and data.gov.in. Practical exercises with real Indian government datasets.",
                 diff="Intermediate", hours=12, cat="Data", rating=4.4, comp_codes=["TECH10"], tags=["open-data", "api", "data.gov.in"]),
            dict(code="IGOT012", title="Data Privacy and PDPB Compliance", provider=CourseProvider.igot,
                 desc="Understanding India's Personal Data Protection Bill, data privacy principles, and compliance requirements for government data handlers.",
                 diff="Intermediate", hours=10, cat="Privacy", rating=4.5, comp_codes=["DIG02"], tags=["data-privacy", "pdpb", "compliance"]),
            dict(code="IGOT013", title="SDG Monitoring and Reporting", provider=CourseProvider.igot,
                 desc="Comprehensive guide to SDG indicator measurement, monitoring frameworks, and reporting mechanisms for Indian government.",
                 diff="Intermediate", hours=14, cat="Statistics", rating=4.6, comp_codes=["STAT08"], tags=["sdg", "monitoring", "indicators"]),
            dict(code="IGOT014", title="Leadership for Government Officers", provider=CourseProvider.igot,
                 desc="Leadership skills for senior government officials. Covers team management, stakeholder communication, and change leadership.",
                 diff="Intermediate", hours=16, cat="Leadership", rating=4.3, comp_codes=["BEH01"], tags=["leadership", "management", "soft-skills"]),
            dict(code="IGOT015", title="Project Management for Government", provider=CourseProvider.igot,
                 desc="Project management methodologies adapted for government context. Covers planning, monitoring, and evaluation of public sector projects.",
                 diff="Intermediate", hours=20, cat="Management", rating=4.5, comp_codes=["BEH03"], tags=["project-management", "planning", "monitoring"]),
            dict(code="IGOT016", title="Deep Learning and Neural Networks", provider=CourseProvider.igot,
                 desc="Advanced deep learning concepts for statistical applications. Covers neural networks, CNNs, and applications in image-based data collection.",
                 diff="Advanced", hours=35, cat="AI/ML", rating=4.8, comp_codes=["TECH08"], tags=["deep-learning", "neural-networks", "advanced"]),
            dict(code="IGOT017", title="Cloud Computing for Government (MeghRaj)", provider=CourseProvider.igot,
                 desc="Using NIC's MeghRaj cloud platform for government applications. Covers IaaS, PaaS, data storage, and security on government cloud.",
                 diff="Intermediate", hours=15, cat="Cloud", rating=4.4, comp_codes=["TECH09", "DIG04"], tags=["cloud", "meghraj", "nic"]),
            dict(code="IGOT018", title="Ethics and Integrity in Public Service", provider=CourseProvider.igot,
                 desc="Ethics framework for government officials. Covers conduct rules, conflict of interest, whistleblower protection, and public trust.",
                 diff="Beginner", hours=8, cat="Ethics", rating=4.2, comp_codes=["BEH04"], tags=["ethics", "integrity", "conduct"]),
            # NSSTA courses
            dict(code="NSSTA001", title="Advanced Sampling Methods", provider=CourseProvider.nssta,
                 desc="Advanced training in probability sampling, complex survey designs, PPS sampling, and design effects. Includes hands-on exercises with Indian survey data.",
                 diff="Advanced", hours=40, cat="Sampling", rating=4.9, comp_codes=["STAT03"], tags=["sampling", "survey", "advanced"]),
            dict(code="NSSTA002", title="Survey Design and Field Operations", provider=CourseProvider.nssta,
                 desc="Comprehensive survey design: questionnaire development, pilot testing, field supervision, and non-sampling error control.",
                 diff="Intermediate", hours=32, cat="Survey", rating=4.7, comp_codes=["STAT02"], tags=["survey-design", "fieldwork", "questionnaire"]),
            dict(code="NSSTA003", title="National Accounts Statistics", provider=CourseProvider.nssta,
                 desc="System of National Accounts (SNA 2008). Covers GDP compilation, input-output tables, and supply-use tables in Indian context.",
                 diff="Advanced", hours=40, cat="National Accounts", rating=4.8, comp_codes=["STAT04"], tags=["national-accounts", "gdp", "sna"]),
            dict(code="NSSTA004", title="GIS Applications in Official Statistics", provider=CourseProvider.nssta,
                 desc="Advanced GIS for statistical applications: spatial sampling, small area estimation, satellite-based crop monitoring, and thematic mapping.",
                 diff="Advanced", hours=35, cat="GIS", rating=4.8, comp_codes=["TECH06", "STAT07"], tags=["gis", "spatial-statistics", "crop-estimation"]),
            dict(code="NSSTA005", title="Price Statistics and Index Numbers", provider=CourseProvider.nssta,
                 desc="Comprehensive training on CPI and WPI compilation, index number theory, and chain-linking methods.",
                 diff="Advanced", hours=30, cat="Price Statistics", rating=4.7, comp_codes=["STAT05"], tags=["cpi", "wpi", "price-statistics"]),
            dict(code="NSSTA006", title="Labour Force Survey Analysis", provider=CourseProvider.nssta,
                 desc="Methodology and analysis of Periodic Labour Force Survey (PLFS). Covers employment, unemployment, and labour market indicators.",
                 diff="Advanced", hours=28, cat="Labour Statistics", rating=4.6, comp_codes=["STAT06"], tags=["plfs", "labour", "employment"]),
            dict(code="NSSTA007", title="Data Quality Assessment", provider=CourseProvider.nssta,
                 desc="Quality frameworks for official statistics: Generic Statistical Business Process Model (GSBPM), data quality dimensions, and audit procedures.",
                 diff="Intermediate", hours=25, cat="Quality", rating=4.6, comp_codes=["STAT09"], tags=["data-quality", "gsbpm", "audit"]),
            dict(code="NSSTA008", title="Stata for Econometric Analysis", provider=CourseProvider.nssta,
                 desc="Advanced econometric analysis using Stata: regression, time series, panel data, and survey data analysis with Stata.",
                 diff="Advanced", hours=30, cat="Programming", rating=4.7, comp_codes=["TECH04"], tags=["stata", "econometrics", "regression"]),
            dict(code="NSSTA009", title="Agricultural Statistics and Crop Estimation", provider=CourseProvider.nssta,
                 desc="Methods for agricultural statistics: area and yield estimation, General Crop Estimation Survey (GCES), and remote sensing applications.",
                 diff="Advanced", hours=35, cat="Agricultural Statistics", rating=4.8, comp_codes=["STAT07", "TECH06"], tags=["agriculture", "crop-estimation", "remote-sensing"]),
            dict(code="NSSTA010", title="Metadata Standards and SDMX", provider=CourseProvider.nssta,
                 desc="Statistical metadata management: SDMX, DDI, and metadata exchange frameworks for Indian statistical system.",
                 diff="Intermediate", hours=20, cat="Metadata", rating=4.4, comp_codes=["STAT10"], tags=["sdmx", "metadata", "standards"]),
            # Other government
            dict(code="MOSPI001", title="Machine Learning Applications in NSO", provider=CourseProvider.other_govt,
                 desc="Practical applications of ML in National Statistical Office: automated data validation, outlier detection, and imputation methods.",
                 diff="Advanced", hours=25, cat="AI/ML", rating=4.7, comp_codes=["TECH08", "STAT09"], tags=["machine-learning", "nso", "automation"]),
            dict(code="MOSPI002", title="Data Visualization for Policy Makers", provider=CourseProvider.other_govt,
                 desc="Creating effective data visualizations and dashboards for policy communication. Focuses on government report design and NSSO data presentation.",
                 diff="Intermediate", hours=16, cat="Visualization", rating=4.5, comp_codes=["TECH07"], tags=["visualization", "policy", "dashboard"]),
            dict(code="MOSPI003", title="Introduction to R for NSO Staff", provider=CourseProvider.other_govt,
                 desc="R programming tailored for NSO statistical officers. Covers survey data analysis, complex sampling, and NSS data processing.",
                 diff="Beginner", hours=15, cat="Programming", rating=4.4, comp_codes=["TECH02"], tags=["r", "nso", "survey-data"]),
            dict(code="MOSPI004", title="Digital Public Infrastructure for Statistics", provider=CourseProvider.other_govt,
                 desc="Integration of Aadhaar, GSTN, and other DPI platforms for administrative data in official statistics.",
                 diff="Intermediate", hours=12, cat="Digital Governance", rating=4.3, comp_codes=["DIG05"], tags=["dpi", "aadhaar", "gstn"]),
            dict(code="MOSPI005", title="SPSS for Survey Data Analysis", provider=CourseProvider.other_govt,
                 desc="SPSS for analyzing large-scale survey data. Covers descriptive statistics, cross-tabulations, and basic inferential analysis.",
                 diff="Beginner", hours=14, cat="Programming", rating=4.2, comp_codes=["TECH05"], tags=["spss", "survey", "analysis"]),
            dict(code="MOSPI006", title="Effective Communication for Statistical Officers", provider=CourseProvider.other_govt,
                 desc="Communication skills for statistical professionals: report writing, presenting data to non-technical audiences, and media interaction.",
                 diff="Beginner", hours=10, cat="Communication", rating=4.3, comp_codes=["BEH02"], tags=["communication", "report-writing", "presentation"]),
            dict(code="MOSPI007", title="Advanced Python: Statistical Computing", provider=CourseProvider.other_govt,
                 desc="Advanced Python for statistical computing: SciPy, StatsModels, and scikit-learn for government data analysis.",
                 diff="Advanced", hours=25, cat="Programming", rating=4.8, comp_codes=["TECH01", "TECH08"], tags=["python", "scipy", "advanced"]),
        ]

        course_objects = []
        for cd in courses:
            c = Course(
                course_code=cd["code"],
                title=cd["title"],
                provider=cd["provider"],
                description=cd["desc"],
                difficulty=cd["diff"],
                duration_hours=cd["hours"],
                category=cd["cat"],
                rating=cd["rating"],
                rating_count=int(cd["rating"] * 100),
                tags=cd.get("tags", []),
                is_active=True,
            )
            db.add(c)
            course_objects.append((c, cd["comp_codes"]))

        await db.flush()

        # CourseCompetency links
        for course, comp_codes in course_objects:
            for code in comp_codes:
                if code in comp_map:
                    cc = CourseCompetency(
                        course_id=course.id,
                        competency_id=comp_map[code],
                        proficiency_gained=1,
                    )
                    db.add(cc)

        await db.flush()

        # ─── ANANYA'S LEARNING HISTORY ──────────────────────────────────
        # Find specific courses by code
        course_by_code = {}
        for c, _ in course_objects:
            course_by_code[c.course_code] = c

        ananya_history = [
            (course_by_code["IGOT003"], "Completed", 100, 15, 88),   # SQL — completed
            (course_by_code["NSSTA002"], "Completed", 100, 32, 91),  # Survey Design — completed
            (course_by_code["IGOT013"], "Completed", 100, 14, 85),   # SDG — completed
            (course_by_code["IGOT002"], "In Progress", 40, 5, None), # Python Fundamentals — in progress
        ]
        for course, status, prog, hours, score in ananya_history:
            lh = LearningHistory(
                user_id=ananya.id,
                course_id=course.id,
                status=status,
                progress_percentage=float(prog),
                hours_spent=float(hours),
                score=float(score) if score else None,
                completed_at=now - timedelta(days=45) if status == "Completed" else None,
            )
            db.add(lh)

        # ─── ANANYA'S LEARNING PATH ──────────────────────────────────────
        learning_path_items = [
            (course_by_code["IGOT002"], 1, "In Progress", "Build Python fundamentals before advancing to data analysis"),
            (course_by_code["IGOT001"], 2, "Recommended", "Core Python data analysis skills required for your role"),
            (course_by_code["IGOT007"], 3, "Recommended", "GIS fundamentals to address your significant spatial data skills gap"),
            (course_by_code["NSSTA004"], 4, "Locked", "Advanced GIS — requires GIS Fundamentals completion"),
            (course_by_code["IGOT005"], 5, "Recommended", "Machine learning fundamentals for official statistics"),
            (course_by_code["IGOT006"], 6, "Locked", "Advanced ML — requires Introduction to ML completion"),
            (course_by_code["IGOT004"], 7, "Recommended", "Data visualization to improve your dashboard communication skills"),
            (course_by_code["NSSTA001"], 8, "Recommended", "Advanced sampling to deepen your survey methodology expertise"),
        ]
        for course, idx, status, reason in learning_path_items:
            lpi = LearningPathItem(
                user_id=ananya.id,
                course_id=course.id,
                order_index=idx,
                status=status,
                reason=reason,
            )
            db.add(lpi)

        # ─── DIAGNOSTIC ASSESSMENT ───────────────────────────────────────
        diagnostic = Assessment(
            title="Competency Diagnostic Assessment",
            description="A comprehensive diagnostic assessment covering all major competency areas for Statistical Officers. This helps identify your current proficiency levels.",
            difficulty=DifficultyLevel.medium,
            total_questions=20,
            time_limit_minutes=35,
            is_diagnostic=True,
            competency_ids=[comp_map["STAT01"], comp_map["STAT03"], comp_map["TECH01"], comp_map["TECH06"], comp_map["TECH08"]],
        )
        db.add(diagnostic)
        await db.flush()

        # Diagnostic questions
        diag_questions = [
            # Statistics
            dict(comp="STAT01", text="In hypothesis testing, what does a p-value less than 0.05 indicate?", a="The null hypothesis is definitely true", b="The result is statistically significant at 5% significance level", c="The sample size is insufficient", d="The alternative hypothesis is false", ans="B", exp="A p-value < 0.05 means there is less than a 5% probability of observing the test statistic (or more extreme) if the null hypothesis were true. We reject the null hypothesis at the 5% significance level.", diff=DifficultyLevel.medium),
            dict(comp="STAT01", text="Which measure of central tendency is most affected by extreme outliers?", a="Median", b="Mode", c="Mean", d="Trimmed Mean", ans="C", exp="The arithmetic mean is sensitive to extreme values because all observations are weighted equally. A single very large or very small outlier can shift the mean significantly, while the median (middle value) remains stable.", diff=DifficultyLevel.easy),
            dict(comp="STAT01", text="What does R-squared (R²) represent in a linear regression model?", a="The correlation between the independent variables", b="The proportion of variance in the dependent variable explained by the model", c="The p-value of the regression", d="The number of independent variables", ans="B", exp="R² (coefficient of determination) ranges from 0 to 1 and measures the proportion of total variance in Y that is explained by the regression model. An R² of 0.85 means the model explains 85% of the variability in the outcome.", diff=DifficultyLevel.medium),
            dict(comp="STAT01", text="In a standard normal distribution, approximately what percentage of data falls within ±2 standard deviations?", a="68%", b="90%", c="95%", d="99.7%", ans="C", exp="The 68-95-99.7 rule: ~68% falls within ±1σ, ~95% within ±2σ, and ~99.7% within ±3σ. This is fundamental to confidence interval construction.", diff=DifficultyLevel.easy),
            # Sampling
            dict(comp="STAT03", text="Which sampling technique is most appropriate when the population is geographically dispersed and a complete sampling frame is unavailable?", a="Stratified Random Sampling", b="Systematic Sampling", c="Multi-stage Cluster Sampling", d="Simple Random Sampling", ans="C", exp="Multi-stage cluster sampling is ideal when a complete frame is unavailable and geography makes individual selection costly. Clusters (villages, blocks) are first selected, then individuals within clusters.", diff=DifficultyLevel.medium),
            dict(comp="STAT03", text="What is the effect of increasing sample size on sampling error?", a="Sampling error increases", b="Sampling error decreases", c="Sampling error remains the same", d="Effect depends on the population distribution", ans="B", exp="Sampling error (standard error) decreases as sample size increases, following the inverse square root relationship: SE = σ/√n. Doubling the sample size reduces the standard error by a factor of √2.", diff=DifficultyLevel.easy),
            dict(comp="STAT03", text="PPS (Probability Proportional to Size) sampling assigns higher selection probabilities to:", a="Units selected by convenience", b="Randomly selected units regardless of size", c="Larger units in the population", d="Units in the smallest stratum", ans="C", exp="In PPS sampling, the probability of selecting a unit is proportional to its size measure (e.g., number of workers, area). This reduces variance when the study variable is correlated with size.", diff=DifficultyLevel.hard),
            # Python
            dict(comp="TECH01", text="In Python, which library provides the DataFrame data structure for tabular data manipulation?", a="NumPy", b="Matplotlib", c="SciPy", d="Pandas", ans="D", exp="Pandas provides the DataFrame (2D tabular) and Series (1D array) data structures optimized for data manipulation and analysis. It integrates seamlessly with NumPy arrays and Matplotlib visualizations.", diff=DifficultyLevel.easy),
            dict(comp="TECH01", text="What does the Python function `df.groupby('region')['value'].mean()` compute?", a="The sum of values for each region", b="The mean of 'value' for each unique region", c="The count of rows per region", d="The median of 'value' overall", ans="B", exp="`.groupby('region')` splits the DataFrame by unique values in 'region', and `.mean()` computes the arithmetic mean of 'value' within each group. This is equivalent to SQL's GROUP BY with AVG().", diff=DifficultyLevel.medium),
            dict(comp="TECH01", text="Which Python statement correctly reads a CSV file and handles Indian rupee (₹) currency format?", a="pd.read_csv('data.csv', encoding='utf-16')", b="pd.read_csv('data.csv', encoding='utf-8', thousands=',')", c="pd.read_csv('data.csv', index_col=0)", d="pd.read_csv('data.csv', dtype=str)", ans="B", exp="For Indian number formats with comma separators (e.g., 1,00,000), using `thousands=','` allows Pandas to correctly parse numbers. UTF-8 encoding handles special Indian currency symbols.", diff=DifficultyLevel.medium),
            # GIS
            dict(comp="TECH06", text="In GIS, what is the difference between vector and raster data?", a="Vector uses pixels; raster uses points and polygons", b="Vector represents features as points, lines, and polygons; raster represents data as a grid of cells", c="Vector is for 3D data; raster is for 2D data", d="There is no practical difference in GIS", ans="B", exp="Vector data represents geographic features as discrete geometries (points for locations, lines for roads/rivers, polygons for administrative boundaries). Raster data divides the area into a regular grid of cells — ideal for satellite imagery, elevation, and continuous phenomena.", diff=DifficultyLevel.medium),
            dict(comp="TECH06", text="Which GIS operation would you use to find all villages within 5 km of a river?", a="Clip", b="Dissolve", c="Buffer and Intersect", d="Project", ans="C", exp="First, create a 5 km Buffer around the river to generate a polygon of the 5 km zone. Then, Intersect the buffer with the village point layer to identify all villages within the zone.", diff=DifficultyLevel.medium),
            dict(comp="TECH06", text="What coordinate reference system is commonly used for large-scale official maps in India?", a="WGS84 (EPSG:4326)", b="Lambert Conformal Conic", c="Polyconic projection (Great Trigonometrical Survey)", d="Universal Transverse Mercator (UTM)", ans="A", exp="WGS84 (World Geodetic System 1984) with EPSG:4326 is the standard geographic coordinate system for GPS and global mapping. For Indian official maps, SOI (Survey of India) traditionally used Polyconic/Everest spheroid, but WGS84 is now standard for digital systems.", diff=DifficultyLevel.hard),
            # AI/ML
            dict(comp="TECH08", text="In machine learning, what is the purpose of a validation set?", a="To train the final model before deployment", b="To tune hyperparameters and select the best model without biasing the test set", c="To augment the training data with synthetic examples", d="To evaluate the final deployed model's performance", ans="B", exp="The validation set is used to evaluate model performance during training for hyperparameter tuning and model selection. It's separate from both the training set (used to fit parameters) and the test set (used to estimate final performance on unseen data).", diff=DifficultyLevel.medium),
            dict(comp="TECH08", text="Which of the following is an example of supervised learning?", a="K-means clustering of districts by economic indicators", b="Principal Component Analysis of survey responses", c="Predicting crop yield from weather variables using regression", d="Anomaly detection in financial transactions without labels", ans="C", exp="Supervised learning uses labeled training data (input-output pairs). Predicting crop yield from weather variables uses historical data with known yields (labels) to train a regression model. K-means and PCA are unsupervised; anomaly detection without labels is also unsupervised.", diff=DifficultyLevel.medium),
            dict(comp="TECH08", text="What does 'overfitting' mean in machine learning?", a="The model performs well on training data but poorly on new, unseen data", b="The model is too simple to capture the underlying patterns", c="The training dataset is too large for the available compute", d="The model was trained for too few epochs", ans="A", exp="Overfitting occurs when a model learns the noise and specific patterns of training data too closely, losing the ability to generalize to new data. Signs include near-perfect training accuracy but significantly lower validation/test accuracy.", diff=DifficultyLevel.easy),
            # Data Visualization
            dict(comp="TECH07", text="Which chart type is most appropriate for showing trends in unemployment rate over 10 years?", a="Pie chart", b="Line chart", c="Bar chart", d="Scatter plot", ans="B", exp="Line charts are ideal for visualizing continuous trends over time. For unemployment rate across 10 years, a line chart clearly shows the trajectory, peaks, and troughs. Pie charts show proportions; bar charts compare discrete categories; scatter plots show relationships between two variables.", diff=DifficultyLevel.easy),
            dict(comp="TECH07", text="In data visualization, what is the purpose of a box plot?", a="To show geographic distribution of data", b="To display the distribution of data including quartiles, median, and outliers", c="To compare parts of a whole", d="To show relationships between three variables", ans="B", exp="A box plot (box-and-whisker plot) displays the five-number summary: minimum, Q1 (25th percentile), median (Q2), Q3 (75th percentile), and maximum. It also shows outliers as individual points, making it excellent for comparing distributions across groups.", diff=DifficultyLevel.medium),
            # SQL
            dict(comp="TECH03", text="Which SQL statement retrieves only unique values of 'state' from the survey_data table?", a="SELECT * FROM survey_data WHERE state IS UNIQUE", b="SELECT DISTINCT state FROM survey_data", c="SELECT state FROM survey_data GROUP BY ALL", d="SELECT UNIQUE(state) FROM survey_data", ans="B", exp="SELECT DISTINCT eliminates duplicate rows from the result set. `SELECT DISTINCT state FROM survey_data` returns each unique state name exactly once, regardless of how many rows exist for each state.", diff=DifficultyLevel.easy),
            dict(comp="TECH03", text="In SQL, the HAVING clause is used to:", a="Filter individual rows before grouping", b="Join multiple tables", c="Filter groups after the GROUP BY aggregation", d="Sort the final result set", ans="C", exp="HAVING filters the result of GROUP BY aggregations. WHERE filters individual rows before grouping (cannot use aggregate functions). HAVING filters after aggregation — e.g., `HAVING COUNT(*) > 100` keeps only groups with more than 100 records.", diff=DifficultyLevel.medium),
        ]

        for qd in diag_questions:
            q = Question(
                assessment_id=diagnostic.id,
                competency_id=comp_map.get(qd["comp"]),
                question_text=qd["text"],
                option_a=qd["a"],
                option_b=qd["b"],
                option_c=qd["c"],
                option_d=qd["d"],
                correct_answer=qd["ans"],
                explanation=qd["exp"],
                difficulty=qd["diff"],
                question_type=QuestionType.mcq,
            )
            db.add(q)

        # ─── TRAINING PROGRAMMES ─────────────────────────────────────────
        programmes = [
            dict(code="NSSTA-T01", title="Survey Methodology and Design", provider=TrainingProvider.nssta,
                 area="Survey Statistics", target="Statistical Officers, Senior Statistical Officers", days=5,
                 desc="Intensive residential training on survey design, sampling methods, field operations, and data quality for national surveys.",
                 elig="Officers with at least 2 years in survey operations", comp_codes=["STAT02", "STAT03"]),
            dict(code="NSSTA-T02", title="National Accounts: Advanced Workshop", provider=TrainingProvider.nssta,
                 area="National Accounts", target="Officers in NAS Division", days=7,
                 desc="Advanced workshop on SNA 2008, supply-use tables, and GDP compilation methodology.",
                 elig="Officers with prior national accounts training", comp_codes=["STAT04"]),
            dict(code="NSSTA-T03", title="Machine Learning for Statistical Production", provider=TrainingProvider.nssta,
                 area="Data Science", target="Technical and Statistical Officers", days=5,
                 desc="Hands-on training in machine learning applications for official statistics: automated data validation, nowcasting, and administrative data integration.",
                 elig="Officers with basic Python knowledge", comp_codes=["TECH08", "TECH01"]),
            dict(code="NSSTA-T04", title="GIS for Census and Surveys", provider=TrainingProvider.nssta,
                 area="Geographic Information Systems", target="All Statistical Officers", days=5,
                 desc="Practical GIS training for census enumeration block creation, survey mapping, and thematic map production.",
                 elig="Open to all statistical officers", comp_codes=["TECH06"]),
            dict(code="NSSTA-T05", title="Price Statistics: Methodology and Compilation", provider=TrainingProvider.nssta,
                 area="Price Statistics", target="Officers in Price Statistics Division", days=5,
                 desc="CPI and WPI compilation methodology, index number theory, and quality adjustment methods.",
                 elig="Officers in Price Statistics or related divisions", comp_codes=["STAT05"]),
            dict(code="NSSTA-T06", title="Data Visualization and Dashboard Design", provider=TrainingProvider.nssta,
                 area="Data Communication", target="All Statistical Officers", days=3,
                 desc="Creating impactful data visualizations for government reports and online dashboards using Python and Power BI.",
                 elig="Open to all officers with basic computer skills", comp_codes=["TECH07"]),
            dict(code="TPAC-T01", title="SDG Implementation and Monitoring", provider=TrainingProvider.tpac,
                 area="SDG Statistics", target="Officers in SDG Monitoring Cell", days=4,
                 desc="Training on SDG indicator framework, data sourcing, and reporting to MoSPI SDG Dashboard.",
                 elig="Officers in SDG or planning divisions", comp_codes=["STAT08"]),
            dict(code="TPAC-T02", title="Agricultural Crop Estimation Using Remote Sensing", provider=TrainingProvider.tpac,
                 area="Agricultural Statistics", target="Officers in Agricultural Statistics Division", days=5,
                 desc="Remote sensing and satellite data applications for crop area estimation and yield forecasting.",
                 elig="Officers in Agricultural Statistics Division", comp_codes=["STAT07", "TECH06"]),
            dict(code="TPAC-T03", title="Cybersecurity for Government Data Managers", provider=TrainingProvider.tpac,
                 area="Digital Security", target="All Government Officers", days=2,
                 desc="Practical cybersecurity training: secure handling of sensitive statistical data, incident response, and compliance.",
                 elig="Open to all officers", comp_codes=["DIG01"]),
            dict(code="MOSPI-T01", title="Python for NSO Data Processing", provider=TrainingProvider.mospi,
                 area="Data Science", target="Statistical Officers, Data Analysts", days=5,
                 desc="Intensive Python training tailored for NSO data processing: NSSO microdata analysis, large survey data, and automation.",
                 elig="Officers comfortable with computers and basic statistics", comp_codes=["TECH01"]),
            dict(code="MOSPI-T02", title="Leadership Development Programme for Statistical Officers", provider=TrainingProvider.mospi,
                 area="Leadership", target="Senior Statistical Officers, Deputy Directors", days=10,
                 desc="Residential leadership development program covering team management, stakeholder engagement, and strategic thinking.",
                 elig="Officers at the level of SSO and above", comp_codes=["BEH01", "BEH03"]),
            dict(code="MOSPI-T03", title="Data Quality Framework for Official Statistics", provider=TrainingProvider.mospi,
                 area="Data Quality", target="All Statistical Officers", days=3,
                 desc="Implementing quality frameworks in Indian statistical system using GSBPM and UN-NQAF guidelines.",
                 elig="Open to all statistical officers", comp_codes=["STAT09"]),
        ]

        for pd_item in programmes:
            tp = TrainingProgramme(
                programme_code=pd_item["code"],
                title=pd_item["title"],
                provider=pd_item["provider"],
                training_area=pd_item["area"],
                description=pd_item["desc"],
                target_audience=pd_item["target"],
                duration_days=pd_item["days"],
                eligibility=pd_item["elig"],
                competency_ids=[comp_map.get(c) for c in pd_item["comp_codes"] if comp_map.get(c)],
                schedule_info="Next session: January 2025 at NSSTA, Greater Noida",
                venue="NSSTA, Greater Noida / Online",
                contact_email="training@nssta.gov.in",
                is_active=1,
            )
            db.add(tp)

        # ─── NOTIFICATIONS FOR ANANYA ───────────────────────────────────
        notifications = [
            Notification(
                user_id=ananya.id,
                type=NotificationType.assessment_due,
                title="Competency Assessment Due",
                message="Your quarterly competency assessment is due. Take the diagnostic assessment to update your skill profile.",
                action_url="/assessments",
                is_read=False,
            ),
            Notification(
                user_id=ananya.id,
                type=NotificationType.new_recommendation,
                title="New Course Recommended",
                message="Python for Data Analysis has been recommended based on your skill gap analysis. 94% match with your profile.",
                action_url="/courses",
                is_read=False,
            ),
            Notification(
                user_id=ananya.id,
                type=NotificationType.course_match,
                title="NSSTA Training Programme Match",
                message="GIS for Census and Surveys (NSSTA) starts next month. It matches your skill gap in GIS. Register now.",
                action_url="/courses",
                is_read=True,
            ),
            Notification(
                user_id=ananya.id,
                type=NotificationType.learning_milestone,
                title="Learning Milestone Achieved",
                message="Congratulations! You have completed 3 courses and accumulated 61 learning hours.",
                action_url="/history",
                is_read=True,
            ),
        ]
        db.add_all(notifications)

        await db.commit()
        logger.info("✅ StatSetu demo data seeded successfully!")
        logger.info(f"   Demo accounts: ananya@statsetu.gov.in / trainer@statsetu.gov.in / admin@statsetu.gov.in")
        logger.info(f"   Password for all: demo123")


if __name__ == "__main__":
    asyncio.run(seed_all())
