# 0004: Report the combined saving with Move 2 sequenced after Move 1

**Status:** accepted

**Context.** Move 2 (hub resale) acts on parcels that still come back. If Move 1 (reconfirmation) prevents some RTOs first, fewer parcels are left to resell. Adding Move 2's standalone saving (₹3.1L at a 25% match) to Move 1 would count some parcels twice.

**Decision.**
- The combined figure uses Move 2 **sequenced**: it acts only on what Move 1 leaves behind (13,600 RTOs conservative, 7,650 ceiling).
- Combined: ₹5.4L–₹11.4L, or 26%–56% of the true drag.
- The Impact page can still show Move 2 standalone, with a warning that it double-counts when combined.
- Move 2 does not change the RTO rate. It cuts the cost of failures that still happen, so the RTO gauge moves only with Move 1.

**Consequences.**
- In the ceiling case Move 2 is worth less (₹1.4L) than in the conservative case (₹2.5L). That is counter-intuitive, and the UI explains it.
- The combined range is defensible against a double-counting challenge.
