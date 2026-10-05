# 0005: Size the pilot with a cluster design effect, and say what it can detect

**Status:** accepted

**Context.** The deck proposes "the 20 highest-RTO pincodes, against a matched control group". Orders in the same pincode are correlated, so 13,000 orders per arm are worth far fewer independent observations. An unclustered calculation would claim the pilot can detect a shift of about 3 points. It can't.

**Decision.**
- Use a two-proportion sample size (two-sided α 0.05, power 0.80) with design effect 1 + (m − 1) × ICC, where m is the orders per pincode over the pilot.
- Defaults: 20 treated and 20 control pincodes (the control size is an assumption, because the deck doesn't state it), 50 orders per pincode per week, 13 weeks, ICC 0.02 (an assumption the pilot itself would measure).
- `#/pilot` states, in a sentence generated from these values, that the design detects about a 4.6-point drop, and that a 3-point shift would need about 50 pincodes per arm.
- The expected values in the tests were computed independently in Python.

**Consequences.**
- The pilot is presented as able to confirm a large effect or catch a failure early. It is not presented as able to measure Move 1's 3.4-point conservative estimate.
- "More pincodes, not more weeks" becomes a concrete recommendation to Valmo.
- If the real ICC turns out lower, the pilot is more sensitive than stated. The calculator shows this directly.
