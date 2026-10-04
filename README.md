# Campaign Planner

Describe a business in a sentence. Get ranked publishers with the reasons each was picked or left out, 3–5 ads written for likely buyer types, and a campaign config.

```bash
npm install
cp .env.example .env.local   # add GOOGLE_GENERATIVE_AI_API_KEY (free at aistudio.google.com/apikey)
npm run dev                  # http://localhost:3000
```

The default model is `gemini-3.8-flash` (about 12s per plan). The 15 sample advertisers are pre-computed and work **without a key**. `npm test` runs 39 offline unit tests. `npm run eval` re-runs the samples through the planner and a single-prompt baseline and writes `evals/RESULTS.md`. Switch providers with `LLM_MODEL=openai:<model>` or `anthropic:<model>`.

## How it works

```
sentence → UNDERSTAND (LLM) → SCORE PERSONAS (code) → SCORE PUBLISHERS (code) → REVIEW ±15 (LLM) ┐
           typed brief        who would buy this?     category fit + where     WRITE ADS (LLM)  ├→ CONFIG (code)
                                                      those buyers shop                          ┘
```

- **The LLM handles language; code makes decisions.** Scoring, inclusion and money are plain code. Every point carries a reason, and the UI draws each score bar from those reasons.
- **Audience first, through a shared taxonomy** (`src/lib/taxonomy.ts`). The data's persona and publisher tags don't line up, so both are tagged into one vocabulary and the LLM maps the advertiser into it. A publisher can earn points for being *where your likely buyers shop*.
- **The LLM is bounded.** The reviewer can move a score at most ±15 and can't recommend a publisher with no category or audience link. Unknown IDs are dropped. Vague input gets a best guess plus clarifying questions; out-of-scope input gets "nothing here fits". If fewer than 3 personas qualify, secondary audiences that shop where the ads run are added and labelled, so there are always 3–5 ads.

Code: `prompts/`, `src/lib/scoring/`, `src/lib/config.ts`, `src/lib/pipeline.ts`.

## Campaign config

`objective` · `budget` (30-day flight, daily cap, even pacing) · `allocations` (share, $, estimated CPM, impressions, % of inventory) · `bidding` · `targeting` (personas, demographics, geos, categories) · `frequencyCap` · `creativeRotation` · `measurement` · `assumptions`.

- **Budget split by score², capped at 25% of a publisher's monthly impressions, minimum $250 each.** This favours the best fits without saturating small audiences (2.8M vs 84M impressions in this catalog).
- **CPM for 14 days, then target CPA.** A new campaign has no conversion data, so it buys reach first. Target CPA ≈ one order for subscriptions and 30% of the order for one-time purchases.
- **Every number lists its assumption**, so a human can check it before launch.

## Results

Same model, all 15 samples: the planner vs. a **single prompt** that gets the whole catalog and decides everything in one call. Both pass **15/15** of my loose checks. With only 20 publishers, a strong model picks sensibly, and I didn't tighten the checks afterwards to make it lose. The differences are in honesty:

| | Planner | Single prompt |
|---|---|---|
| #7 dental SaaS | "Outside this catalog", no ads | No publishers, yet writes 3 ads anyway |
| #10 $1,200 handbags | Nothing qualifies; flags price 9× the typical order | Recommends 3 apparel stores, no warning |
| #15 "idk just try it" | No guess; asks 2 questions | No publishers, yet writes 3 generic ads ("Discover Something New") |

The evals caught real bugs in my version: a broad "women's apparel" tag let classic-apparel stores into activewear results, and a prompt fix over-corrected vague input. Both are fixed and covered by tests. Known gap: single-category products (#3) get thin lists.

## What I cut

Image creative, auth and saved plans, streaming progress, auction modelling, and a learned ranker. None of them help show matching and reasoning in a day's build. The tags and weights are hand-tuned against 15 samples, which is the part I'd least trust at scale.

## Next week

1. Tag publishers into a standard taxonomy (IAB / Google) at onboarding, LLM-assisted and human-reviewed, and **link related categories** (functional beverages ↔ premium grocery).
2. **Embeddings shortlist → rule scoring → LLM review**, so it scales past a few hundred publishers.
3. Learn weights from outcomes (conversions per publisher × persona) instead of hand-tuning.
4. Check ad claims against the brief, including regulated health claims.
5. Evals in CI with versioned prompts; streaming UI.

## Hard vs. easy

**Easy:** fluent copy, JSON, the UI. **Hard:** (1) **a shared vocabulary** across advertisers, personas and publishers; matching is mostly a taxonomy problem, and at scale it's the whole game. (2) **Knowing when not to recommend**: vague, out-of-catalog and price-mismatched advertisers are where plausible answers do damage. (3) **Keeping LLM judgment useful but bounded and auditable.** (4) **Evaluating without ground truth**: the checks test "sensible and honest", which needs human review to stay meaningful.
