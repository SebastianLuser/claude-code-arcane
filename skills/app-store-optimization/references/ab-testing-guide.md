# ASO A/B Testing Guide

## Workflow: Run A/B Test

1. Select test element (prioritize by impact):
   - Icon (highest impact)
   - Screenshot 1 (high impact)
   - Title (high impact)
   - Short description (medium impact)
2. Form hypothesis:
   ```
   If we [change], then [metric] will [improve/increase] by [amount]
   because [rationale].
   ```
3. Create variants:
   - Control: Current version
   - Treatment: Single variable change
4. Calculate required sample size:
   - Baseline conversion rate
   - Minimum detectable effect (usually 5%)
   - Statistical significance (95%)
5. Launch test:
   - Apple: Use Product Page Optimization
   - Android: Use Store Listing Experiments
6. Run test for minimum duration:
   - At least 7 days
   - Until statistical significance reached
7. Analyze results:
   - Compare conversion rates
   - Check statistical significance
   - Document learnings
8. **Validation:** Single variable tested; sample size sufficient; significance reached (95%); results documented; winner implemented

## A/B Test Prioritization

| Element | Conversion Impact | Test Complexity |
|---------|-------------------|-----------------|
| App Icon | 10-25% lift possible | Medium (design needed) |
| Screenshot 1 | 15-35% lift possible | Medium |
| Title | 5-15% lift possible | Low |
| Short Description | 5-10% lift possible | Low |
| Video | 10-20% lift possible | High |

## Sample Size Quick Reference

| Baseline CVR | Impressions Needed (per variant) |
|--------------|----------------------------------|
| 1% | 31,000 |
| 2% | 15,500 |
| 5% | 6,200 |
| 10% | 3,100 |

## Test Documentation Template

```
TEST ID: ASO-2025-001
ELEMENT: App Icon
HYPOTHESIS: A bolder color icon will increase conversion by 10%
START DATE: [Date]
END DATE: [Date]

RESULTS:
- Control CVR: 4.2%
- Treatment CVR: 4.8%
- Lift: +14.3%
- Significance: 97%
- Decision: Implement treatment

LEARNINGS:
- Bold colors outperform muted tones in this category
- Apply to screenshot backgrounds for next test
```
