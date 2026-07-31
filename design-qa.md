# Design QA

- Source visual truth: `/Users/xht/.codex/visualizations/2026/07/30/019fb0a7-61d2-7f11-baec-4c1574434836/free-ai-style-benchmark-2026-07-31/concept-2.png`
- Implementation screenshot: `/Users/xht/project/咸鱼/.codex-ui-qa/home-desktop-final.png`
- Mobile screenshot: `/Users/xht/project/咸鱼/.codex-ui-qa/home-mobile-final.png`
- Full-view comparison: `/Users/xht/project/咸鱼/.codex-ui-qa/home-comparison-final.png`
- Focused comparison: `/Users/xht/project/咸鱼/.codex-ui-qa/home-focus-comparison-final.png`
- Viewport/state: homepage, light theme, desktop 1280 × 720 CSS px and mobile 390 × 844 CSS px, device density 1.
- Source pixels: 1487 × 1058. For the desktop comparison it was proportionally normalized to 1280 px wide and cropped to the top 720 px so browser chrome and density did not affect the comparison.
- Implementation pixels: desktop 1280 × 720; mobile 390 × 844.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: the implementation preserves the reference's high-contrast Chinese hierarchy, near-black display text, compact navigation, and lighter supporting copy. System Chinese fallbacks are appropriate and no clipping is visible at either checked viewport.
- Spacing and layout rhythm: the centered search, two-column editorial composition, medium radii, restrained borders, and low-elevation cards match the reference language. The user-requested AI 赚钱 / AI 炒股 emphasis intentionally moves those two actions above the editorial feature.
- Colors and tokens: violet remains the primary interaction color; coral marks commercial signals; soft violet marks stock research; green is reserved for trust and update semantics. Contrast is legible in both desktop and mobile captures.
- Image quality and asset fidelity: the selected mock's decorative hero illustration was intentionally omitted because the user requested AI 赚钱 and AI 炒股 to be more prominent. Its space is used for live, source-backed content rather than a placeholder or reconstructed image.
- Copy and content: all visible claims are generated from current project data. AI 赚钱 states the number of public sources; AI 炒股 states project/news counts and explicitly says it is not investment advice, does not predict prices, and does not promise returns.

## Focused Region Evidence

The focused comparison checks the reference's lower action-entry treatment against the promoted AI 赚钱 / AI 炒股 cards. The implementation retains the reference's paired-card rhythm and coral/violet distinction while increasing card area, title weight, source metadata, and risk copy as requested.

## Comparison History

1. Pass 1 (`home-desktop-pass1.png`): P1 — the daily board made the editorial row too tall, leaving both high-intent cards below the 1280 × 720 fold. Fixed by compacting the three board groups and truncating long ranking titles.
2. Pass 2 (`home-desktop-pass2.png`): P1 — only the top edge of the AI 赚钱 / AI 炒股 cards was visible, still weaker than the user's requested priority. Fixed by moving the paired cards directly below search and above the editorial feature.
3. Final (`home-desktop-final.png`, `home-mobile-final.png`): both cards are fully visible in the desktop first screen and lead the mobile content stack. No P0/P1/P2 issue remains.

## Interaction And Runtime Checks

- Mobile menu expanded successfully and exposed all 17 links, including highlighted AI 赚钱 and AI 炒股 entries.
- Homepage search submitted `Claude` to `/search/?q=Claude` successfully.
- AI 赚钱 and AI 炒股 cards expose direct internal links and dedicated analytics event names.
- Browser console errors checked on homepage and search results: none.

## Follow-up Polish

No blocking polish remains. Real traffic should decide whether the paired cards keep equal weight or whether one earns a larger share after enough engagement data accumulates.

final result: passed
