# 0003: Count only the ₹120 return leg as RTO drag

**Status:** accepted

**Context.** A failed delivery costs ₹50 forward plus ₹120 back, ₹170 gross (case data pack). But the forward leg is spent whether or not the parcel is delivered. Valuing prevented RTOs at ₹170 would overstate the saving.

**Decision.**
- The true incremental drag is RTOs × ₹120: ₹20.4L per lakh orders (₹28.9L gross is shown only for reference).
- Move 1, the UPI switch (₹18 expected per switch) and Move 2 all use the ₹120 basis.
- Orders that never ship (cancelled before dispatch, or "I didn't order this") avoid both legs. They are shown as "up to ₹170" **per case** and are never added into the Move 1 total, because that total already counts them through the reply rates.

**Consequences.**
- The headline saving is smaller, and harder to attack.
- The UPI incentive shows honestly as slightly negative at a ₹20 discount (−₹2), which is why the pilot tests ₹10 (+₹8).
- Two bases appear in the UI, so each per-case value is labelled with its kind: counted, expected, or up to.
