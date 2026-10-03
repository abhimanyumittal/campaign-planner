# Eval results

Model: `google:gemini-3.5-flash` · Pipeline **15/15** · Single-prompt baseline **15/15**

Expectations live in `evals/cases.ts`. They are deliberately loose: "a sensible answer", not "the one right answer".
Checks on status, flags, personas and clarifying questions don't apply to the baseline (it has none of those), so its score is generous.

| # | Advertiser | Status | Pipeline picks | Pipeline | Baseline picks | Baseline ads | Baseline |
|---|---|---|---|---|---|---|---|
| 1 | We sell premium dog food for senior dogs, targetin… | clear | Pawline, Ruffco, Pantrygood | ✓ | pub_007, pub_009, pub_018 | 3 | ✓ |
| 2 | A sustainable activewear brand for women. Made fro… | clear | Movewell, Cloudfoot, Stride & Stem, Studiogrid | ✓ | pub_002, pub_016, pub_017 | 3 | ✓ |
| 3 | We make a non-alcoholic sparkling drink with adapt… | clear | Pop & Sip, Studiogrid | ✓ | pub_020, pub_008, pub_012, pub_003 | 3 | ✓ |
| 4 | Small-batch candles poured by hand in Vermont. Nat… | clear | Northbed, Hearthstone Goods, Pantrygood | ✓ | pub_014, pub_011, pub_010 | 4 | ✓ |
| 5 | We help people feel better.… | vague | Studiogrid, Daily Form, Movewell | ✓ | pub_012, pub_003, pub_020 | 3 | ✓ |
| 6 | Technical outerwear for serious backcountry skiers… | clear | Cloudfoot | ✓ | pub_017, pub_002, pub_003 | 3 | ✓ |
| 7 | B2B SaaS for dental practices. We automate their p… | no_fit | none | ✓ | none | 3 | ✓ |
| 8 | A new kind of thing for moms.… | vague | Kitchenly, Pantrygood | ✓ | pub_015, pub_002, pub_006 | 3 | ✓ |
| 9 | Refillable, concentrated cleaning products. Skip t… | clear | Pantrygood, Swiftcart, Kitchenly | ✓ | pub_008, pub_014, pub_011 | 3 | ✓ |
| 10 | Custom-fit leather handbags, Italian-made, handcra… | clear | none | ✓ | pub_005, pub_004, pub_016 | 3 | ✓ |
| 11 | We sell protein bars that don't taste like cardboa… | clear | Pantrygood, Daily Form, Movewell, Studiogrid, Cloudfoot | ✓ | pub_020, pub_008, pub_003, pub_012 | 3 | ✓ |
| 12 | A subscription box for new cat owners. First three… | clear | Tailcrate, Pawline, Ruffco, Kitchenly | ✓ | pub_007, pub_009 | 3 | ✓ |
| 13 | Workout supplements: pre-workout, creatine, protei… | clear | Daily Form, Movewell | ✓ | pub_012, pub_002, pub_020 | 3 | ✓ |
| 14 | Bedding. Linen. Actually-breathable stuff made in … | clear | Northbed, Linden Park | ✓ | pub_011, pub_014 | 3 | ✓ |
| 15 | idk just try it… | vague | none | ✓ | pub_001, pub_013, pub_020 | 3 | ✓ |
