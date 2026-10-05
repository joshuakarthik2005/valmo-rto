# 90-second judge walkthrough

Open https://valmo-jet.vercel.app. Every screen carries a "Prototype: simulated data" badge. For a hands-free version, press **▶ Demo** (about 2 minutes, with captions; Space pauses).

| Time | Where | Do | Say |
|---|---|---|---|
| 0:00 | Landing `#/` | Point at the three stat cards | "17% of orders come back: 17,000 per lakh. We count only the ₹120 return leg, because the ₹50 forward leg is spent either way. That is ₹20.4L of true drag, and COD returns 4× as often as prepaid." |
| 0:12 | Customer `#/customer` | Tap **No reply: escalate** twice | "We ask before dispatch: WhatsApp at T-48h, the delivery window at T-24h, an IVR call at T-2h, and the hub calls if there is still no reply." |
| 0:22 | Customer | **Restart**, then **I didn't order this** | "That parcel is now held and the seller alerted: up to ₹170 avoided for this case, with fraud caught. We never add these per-case ceilings into the aggregate." |
| 0:30 | Customer | **Restart**, **Yes, deliver**, then **Pay by UPI** | "A UPI switch is worth ₹18 expected. At a ₹20 discount that is −₹2, so we say so and pilot ₹10 instead (+₹8)." |
| 0:40 | Rider `#/rider` | **Mark customer unavailable**, then **Call customer**, **No answer**, and mark again | "No logged call means auto-reject. A logged, unanswered masked call is a verified attempt: the fee is protected and the customer gets a follow-up. No GPS anywhere." |
| 0:52 | Resale `#/resale` | **Next step** through to the buyer match | "A refused ₹699 pair of sneakers passes six checks, is matched to a buyer 0.8 km away (same device blocked), and the hub only prints the auto-invoice. That is ₹74 net per parcel." |
| 1:05 | Impact `#/impact` | Toggle **Ceiling**, then drag **Resale match rate** | "Sequenced, the two moves net ₹5.4L to ₹11.4L per lakh orders, 26% to 56% of the drag. Every slider shows its source. Share this link and the scenario comes with it." |
| 1:20 | Pilot `#/pilot` | Point at the headline, then slide **Pincodes per arm** | "We test it on 10 treatment and 10 matched control pincodes over 90 days. We're candid about power: orders cluster by pincode, so this design detects about a 6-point drop, not 3. Adding pincodes moves that; adding weeks barely does. The pilot pauses if rider earnings, cost per order or delivery time slip." |
| 1:28 | Footer | Point at the QR | "The code, the tests that assert every number, and this replay are all public." |

The Hub control tower (`#/hub`) is optional if a judge asks how the hub sees all of this.
