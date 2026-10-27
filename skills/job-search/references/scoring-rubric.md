# Job Scoring Rubric

Weighted 0-100 score to decide where to invest effort. The goal is not to apply to everything: it is to focus on postings with a real match. Default threshold **≥75** (configurable per profile in `min_match_score`).

## Dimensions and weights (default)

| Dimension | Weight | How to score |
|---|---:|---|
| **Stack/skills match** | 30 | % of must-haves you meet. 30 if you cover all the core ones; proportionally lower otherwise. |
| **Seniority** | 15 | 15 if the level fits. Penalize over-qualified (boredom/rejection) and under-qualified (filter). |
| **Work mode + eligibility** | 20 | Remote/hybrid/onsite by preference; time zone; visa/eligibility. If there is a hard eligibility blocker → strong cap on the score. |
| **Salary** | 15 | 15 if ≥ your target; proportional down to your minimum; 0 if below the minimum. If not published, neutral (≈8) and flag it. |
| **Company/culture/stage** | 10 | Fit with preference (startup vs enterprise, product vs consultancy, values). |
| **Posting quality** | 10 | JD clarity, recency (fresh > old), few applicants, defined process. |

Add up the dimensions → 0-100 score.

## Adjustments / flags

- **Positive trigger phrase** (e.g. "code-forward", "high autonomy", a stack you love): +2-5 if it reinforces your fit.
- **Red flag in the JD** (ego, "rockstar", impossible scope, "we're like a family"): −5-10 and a note of caution.
- **Imminent closing:** it does not change the score, but it raises the action **priority**.
- **Blocked eligibility** (a visa you do not have, a mandatory incompatible time zone): cap the score at <50 even if the rest is perfect.

## From score to action

| Score | Action |
|---|---|
| **≥85** | High priority. Apply with custom CV + cover letter + outreach. |
| **75-84** | Apply; custom CV yes, outreach if there is an easy contact. |
| **60-74** | Borderline. Apply only if there is time or a strong angle (referral). |
| **<60** | Skip unless there is a strategic reason. |

## Priority (different from the score)

`priority` in the frontmatter combines score + urgency + eligibility:
- **high:** score ≥85, or ≥75 with imminent closing / warm referral.
- **medium:** 75-84 without urgency.
- **low:** borderline or waiting to validate requirements.

## Record

Save the `score` in the frontmatter of the `03-Applications/` note and reflect the active ones in `00-Dashboard.md` grouped by priority. Write down the breakdown if the score was borderline - it helps decide and re-evaluate later.
