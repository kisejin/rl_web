# RL Atlas interface references

Reviewed on 2026-11-14:

- [shadcn/ui — Button](https://ui.shadcn.com/docs/components/button): consistent control sizes, centered icon/label pairs, visible keyboard focus, and clear primary/secondary actions.
- [Exercism — Python track](https://exercism.org/tracks/python): readable exercise lists, aligned metadata, and a clear path from concepts to coding practice.
- [Brilliant](https://brilliant.org/): visual explanations and a focused interactive learning area.
- [Gymnasium — Basic Usage](https://gymnasium.farama.org/introduction/basic_usage/): retained the established documentation navigation and readable theory layout.

Applied patterns:

- Shared spacing, icon and control tokens in `src/ui-primitives.css`; SVG control symbols in `src/ui-icons.js` avoid platform-specific glyph positioning.
- `src/docs-polish.css` aligns course actions, chapter cards, metadata, exercise rows, forms and animation controls. Reading text remains left aligned; button contents are centered.
- `src/lab-polish.css` aligns the independent Python workspace toolbar, pane tabs, editor actions and console. The lab still does not import the documentation layout or stylesheet.
- Compact desktop controls use a consistent 36–40 px height; primary reading actions use 44 px. Mobile actions wrap or stack instead of clipping their labels.
- Theme switching, focus states, Python execution, mathematical rendering and learning progress retain their behavior.

Verification includes screenshots and control geometry across course, lessons, exercise list, notebook and Python labs at desktop and mobile widths, plus the existing browser suite. Native video controls and mathematical diagram labels are preserved.
