---
name: mdr-745-specialist
description: "EU MDR 2017/745 compliance — device classification, technical documentation, clinical evidence, post-market surveillance, and EUDAMED."
category: "regulatory"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# MDR 2017/745 Specialist

EU MDR compliance patterns for medical device classification, technical documentation, and clinical evidence.

## Device Classification (Annex VIII)

1. Identify duration (transient, short-term, long-term)
2. Determine invasiveness (non-invasive, body orifice, surgical)
3. Assess body system contact (CNS, cardiac, other)
4. Check if active device (energy dependent)
5. Apply classification rules 1-22; for software, apply MDCG 2019-11
6. Document classification rationale
7. **Validation:** Classification confirmed with Notified Body

### Classification Matrix

| Factor | Class I | Class IIa | Class IIb | Class III |
|--------|---------|-----------|-----------|-----------|
| Duration | Any | Short-term | Long-term | Long-term |
| Invasiveness | Non-invasive | Body orifice | Surgical | Implantable |
| System | Any | Non-critical | Critical organs | CNS/cardiac |

For complete Annex VIII rules, software classification (MDCG 2019-11), and worked examples, see [references/mdr-classification-guide.md](references/mdr-classification-guide.md).

---

## Technical Documentation (Annex II/III)

1. Create device description (variants, accessories, intended purpose)
2. Develop labeling (Article 13, IFU)
3. Document design and manufacturing process
4. Complete GSPR compliance matrix
5. Prepare benefit-risk analysis
6. Compile V&V evidence, integrate risk management file (ISO 14971)
7. **Validation:** Technical file reviewed for completeness

### Conformity Assessment Routes

| Class | Route | NB Involvement |
|-------|-------|----------------|
| I | Annex II self-declaration | None |
| IIa | Annex II + IX or XI | Product or QMS |
| IIb | Annex IX + X or X + XI | Type exam + production |
| III | Annex IX + X | Full QMS + type exam |

For GSPR checklist template, technical file structure, and DoC template, see [references/technical-documentation-templates.md](references/technical-documentation-templates.md).

---

## Clinical Evidence (Annex XIV)

1. Define clinical claims and endpoints
2. Conduct systematic literature search
3. Appraise data quality, assess equivalence
4. Identify evidence gaps, determine if investigation required
5. Prepare Clinical Evaluation Report (CER)
6. **Validation:** CER reviewed by qualified evaluator

| Class | Minimum Evidence | Investigation |
|-------|------------------|---------------|
| I | Risk-benefit analysis | Not typically required |
| IIa | Literature + post-market | May be required |
| IIb | Systematic literature review | Often required |
| III | Comprehensive clinical data | Required (Article 61) |

For CER structure, qualified evaluator requirements, and PMCF guidance, see [references/clinical-evidence-requirements.md](references/clinical-evidence-requirements.md).

---

## Post-Market Surveillance

| Component | Requirement | Frequency |
|-----------|-------------|-----------|
| PMS Plan | Article 84 | Maintain current |
| PSUR | Class IIa+ | Per class schedule |
| PMCF Plan | Annex XIV Part B | Update with CER |
| Vigilance | Articles 87-92 | As events occur |

Serious incident reporting: 2 days (public health threat), 10 days (death/serious), 15 days (other).

---

## EUDAMED and UDI

1. Obtain issuing entity code (GS1, HIBCC, ICCBBA)
2. Assign UDI-DI/UDI-PI, apply carriers to labels
3. Register in EUDAMED (actor, devices, certificates)
4. **Validation:** UDI verified on sample labels

---

## Tools and References

```bash
python scripts/mdr_gap_analyzer.py --device "Device Name" --class IIa
```

| Document | Content |
|----------|---------|
| [mdr-classification-guide.md](references/mdr-classification-guide.md) | Annex VIII rules, software classification, examples |
| [clinical-evidence-requirements.md](references/clinical-evidence-requirements.md) | CER structure, PMCF guidance |
| [technical-documentation-templates.md](references/technical-documentation-templates.md) | Annex II/III content, GSPR matrix, DoC |
