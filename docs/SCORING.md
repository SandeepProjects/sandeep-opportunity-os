# Sandeep Opportunity OS — Explainable Scoring Specification (`docs/SCORING.md`)

Every opportunity score (`0–100`) is the sum of 5 transparent, user-configurable components—never an opaque black-box number.

## 1. Category Weight Matrices

| Pipeline Category | Component 1 | Component 2 | Component 3 | Component 4 | Component 5 | Hard Gate Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Freelance Client Leads** | Profile & Case-Study Fit (`30`) | Deterministic Audit Evidence (`25`) | Business Ticket Value (`20`) | Public Contact Path (`15`) | Urgency (`10`) | Must have observable, non-insulting improvement evidence |
| **2. Visa / Relocation Jobs** | Stack & Level Fit (`35`) | Source & ATS Evidence (`20`) | Visa / Location Eligibility (`20`) | Employer & Comp Quality (`15`) | Urgency (`10`) | **Seniority Gate**: Roles requiring `5+ years` (Senior/Lead/Principal) receive `0` Eligibility & Quality |
| **3. Master's & Scholarships** | Academic & Portfolio Fit (`30`) | Funding Coverage Strength (`25`) | Eligibility Confidence (`25`) | Official Source Evidence (`10`) | Deadline Urgency (`10`) | Never marks `CONFIRMED` unless official rules + profile match |
| **4. Remote Jobs & Internships** | Stack & Level Fit (`35`) | Official Source Evidence (`20`) | Remote Region & TZ Eligibility (`20`) | Compensation & Role Quality (`15`) | Urgency (`10`) | **Regional Gate**: Roles legally excluding Cyprus/EMEA receive `0/20` Eligibility + `-20 pt` penalty |
