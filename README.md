# SkillTwin 
AI-powered student skill analysis and career skill gap identification system


 # About the Project

SkillRwin is an AI-powered platform designed to analyze students' technical skills based on their academic work and projects.
It helps students understand their current skill levels, identify skill gaps, and discover what they need to learn for their desired careers.

# Key Features

* AI-Based Skill Analysis: Analyzes students' academic performance and project work to estimate their technical skill levels.
* Career Skill Gap Analysis: Compares students' current skills with the skills required for a selected job role.
* Personalized Learning Recommendations: Suggests learning tasks and projects based on identified skill gaps.
* Project-Based Evaluation: Uses submitted projects to evaluate and update students' skill levels.
* Career Readiness Insights: Helps students understand their progress toward career goals.

# Project Goal

The main goal of SkillRwin is to bridge the gap between academic learning and industry skill requirements through AI-driven skill analysis and personalized recommendations.

 # Technologies

To be updated as development progresses.

 # Team -LadyBug
 
 Sabiha Hossain Farin	241-35-133	https://github.com/sabihafarin
 
 Faujia Haque	241-35-134	https://github.com/Fauji-Frog
 
 Asmaul Husna Nipun	241-35-230	https://github.com/nipun230


 # Project Status

Currently under development as an academic Capstone Project.



## Authentication Module (FR-01)
- **User Registration**: Enforces valid full name, university email format, strong password (8+ characters, uppercase, lowercase, numbers, and special characters), password confirmation match, student ID, and academic department.
- **Login Functionality**: Clean zero-autofill login form with `autoComplete="off"` and `autoComplete="new-password"`, non-standard DOM input identifiers, and togglable show/hide password visibility.
- **Secure Password Handling**: Passwords are salted and hashed with bcrypt (10 rounds). No credentials or secrets are hardcoded in source code; seed credentials use environment variables (`SEED_STUDENT_PASSWORD` / `SEED_DEFAULT_PASSWORD`).
- **User Isolation**: Every evidence, skill, circular, and report is strictly associated with the authenticated user profile (`req.user.profileId`), guaranteeing independent workspaces.

## Core Feature Implementations (FR-04 to FR-13)
- **Evidence Upload & Text Extraction (FR-04 to FR-07)**: Real file upload supporting PDF (`pdf-parse`), DOCX (`mammoth`), and text/code files. Chunks stored in `EvidenceChunk` collection, genuine `chunkCount`, evidence deletion cascading to disk, chunks, and reports.
- **Job Circular Processing (FR-08, FR-09)**: Paste or PDF/DOCX upload, skill catalog keyword extraction with word-boundary matching, default `confirmed: false`, interactive review checklist, and blocked `/analyze` until user explicitly confirms requirements.
- **Evidence-Grounded Gap Analysis (FR-10 to FR-13, FR-24)**: Matches against actual extracted text chunks (not tags alone), classifications (`matched`, `partial`, `missing_evidence`, `gap`), includes `durationMs`, persistent evidence flagging with non-destructive recalculation.
