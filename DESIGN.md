# SplitBill design system

## Overview

Owner direction: warm and friendly, with distinctive design that preserves required functionality, correctness, clarity and states. The following values are observed scaffold only, not approved tokens: `src/app/page.tsx`, `layout.tsx`, `globals.css`, reviewed 2026-11-14. Brief prioritizes correctness and usability over visual design.

## Colors

Page uses Tailwind stone-50 background, stone-950 foreground, white card, stone-200 border, stone-600/700 secondary text and emerald-700 label. Global background/foreground variables are #fff/#171717, dark preference #0a0a0a/#ededed; page utilities override its own surfaces. These are observations, not accepted brand tokens.

## Typography

Page uses text-sm label with semibold uppercase and 0.2em tracking; heading text-4xl, semibold, tight tracking, sm:text-5xl; body text-lg with leading-8. Layout loads Geist variables; body explicitly uses Arial/Helvetica/sans-serif in globals.css.

## Layout

Centered full-height page, horizontal padding 1.5rem and vertical 4rem. Card max width 42rem, padding 2rem (3rem at Tailwind sm breakpoint), rounded-3xl, border and shadow-sm. Description max width 36rem. Responsive values use the installed Tailwind defaults; verify rendered behavior when the page compiles.

## Elevation & Depth and Shapes

White bordered card with shadow-sm and rounded-3xl; status panel uses stone-100, rounded-2xl and 1.25rem padding.

## Components and states

Only scaffold text and a status panel exist. Fields, focus, loading, empty, error, success, disabled, validation and recovery states are not implemented or approved. Provide labels, keyboard support and accessible feedback when implemented.

## Agent usage and visual acceptance

For UI design use the existing host Impeccable skill, preserving its policies; do not download its separate engine without request. Verify relevant viewports and states against actual rendered output after the existing JSX error is resolved. No visual verification was performed in this setup.
