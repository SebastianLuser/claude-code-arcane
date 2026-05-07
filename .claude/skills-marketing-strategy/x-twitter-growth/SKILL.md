---
name: x-twitter-growth
description: "X/Twitter growth engine — algorithm mechanics, thread engineering, reply strategy, profile optimization, and competitive intelligence."
category: "marketing-strategy"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# X/Twitter Growth Engine

X-specific growth skill. For multi-platform social content, see `social-content`. For social strategy, see `social-media-manager`.

## Step 1 — Profile Audit

Before growth work, audit the X presence:

- [ ] Clear value proposition in bio (who you help + how)
- [ ] Specific niche — no generic labels
- [ ] Social proof element and CTA/link
- [ ] Pinned tweet <30 days old with clear CTA
- [ ] Posting frequency 1x/day minimum, >30% reply ratio

Run: `python3 scripts/profile_auditor.py --handle @username`

---

## Step 2 — Competitive Intelligence

1. Search `site:x.com "topic" min_faves:100` for high-performing content
2. Identify 5-10 accounts in niche, analyze: frequency, content types, hook patterns, engagement rates
3. Extract: hook patterns, content themes, format mix, posting times, engagement triggers

Run: `python3 scripts/competitor_analyzer.py --handles @acc1 @acc2`

---

## Step 3 — Content Creation

### Tweet Types (by growth impact)

1. **Threads** — Highest reach/follow conversion. Hook in <7 words, 5-12 tweets, each standalone-worthy, CTA in final tweet + reply to tweet 1
2. **Atomic Tweets** — Breadth/impressions. Under 200 chars, one idea, no links in body, questions drive replies
3. **Quote Tweets** — Authority building. Add data, counterpoint, or personal experience (never just "This")
4. **Replies** — Fastest visibility. Reply to 2-10x accounts, add genuine value, be first

For algorithm signal weights, see [references/algorithm-signals.md](references/algorithm-signals.md).

---

## Step 4 — Algorithm Mechanics

| Signal | Weight | Action |
|--------|--------|--------|
| Replies received | Very high | Write reply-worthy content |
| Time spent reading | High | Threads, longer tweets |
| Profile visits | High | Curiosity gaps |
| Bookmarks | High | Tactical, save-worthy content |
| Link clicks | Low (penalized) | Put links in first reply |

**Kills reach:** Links in body, editing <30 min, going offline after posting, >2 hashtags.

---

## Step 5 — Growth Playbook

### Week 1-2: Foundation
Optimize bio/pin, identify 20 accounts to engage daily, reply 10-20x/day, post 2-3 atomic tweets, publish 1 thread.

### Week 3-4: Pattern Recognition
Double down on top 2 formats, increase to 3-5 posts/day, 2-3 threads/week, start quote-tweeting.

### Month 2+: Scale
Develop 3-5 recurring series, cross-pollinate to LinkedIn/newsletter, build mutual engagement relationships.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `profile_auditor.py` | Audit bio, pinned, activity patterns |
| `tweet_composer.py` | Generate tweets/threads with hook patterns |
| `competitor_analyzer.py` | Analyze competitor accounts |
| `content_planner.py` | Generate content calendars |
| `growth_tracker.py` | Track follower growth and engagement |

## Related Skills

- `social-content` — Multi-platform content creation
- `social-media-manager` — Overall social strategy
- `copywriting` — Headline and hook techniques
