---
version: alpha
name: SplitBill — Clear Together
description: Owner-selected warm, clear visual direction for a shared-expense workspace.
colors:
  primary: "#6957b3"
  primary-hover: "#59449e"
  on-primary: "#ffffff"
  canvas: "#f7f6f3"
  surface: "#ffffff"
  surface-muted: "#f5f4f6"
  ink: "#292936"
  muted: "#757584"
  outline: "#eae9e6"
  accent: "#ebe7f8"
  positive: "#517e69"
  error: "#a33e39"
typography:
  headline-lg:
    fontFamily: Arial, sans-serif
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.04em
  heading-md:
    fontFamily: Arial, sans-serif
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.03em
  body-md:
    fontFamily: Arial, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label-sm:
    fontFamily: Arial, sans-serif
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.4
rounded:
  sm: 7px
  md: 10px
  lg: 14px
  full: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 42px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    height: 46px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: 42px
---

# SplitBill design system

## Overview

**Status: visual direction selected by the owner on 2026-11-15 and applied to the connected workspace.** The selected direction is the revised warm, clear prototype: group balances and expenses beside the entry form on desktop, with a simplified mobile layout. Earlier options A–C were rejected. The retained prototype uses fictional data and does not connect to the backend.

Reference images: [desktop](docs/design/splitbill-desktop-reference.png) and [mobile](docs/design/splitbill-mobile-reference.png). These screenshots capture the selected prototype, including its preview notice; they are visual references, not evidence that the product workflows exist. The visible Next.js development badge is tooling, not part of the design.

The connected workspace uses the tokens below and implements the selected layout with responsive interaction states. Product behavior belongs in PRODUCT.md and the backend API contract, not in this visual document.

## Colors

Use restrained violet for the primary action, dark ink for text, a warm neutral canvas and white surfaces. Muted gray supports secondary copy. Use the positive color with an explicit `Gets back` label; use readable neutral text and `Owes` for negative balances. Never rely on hue or sign alone. Reserve error red for validation or failure.

## Typography

Use an ordinary sans-serif workhorse; the prototype currently uses Arial. Page headings are 32px on desktop and 28px on mobile; section headings are 18px; common body copy is 13–14px. Use tabular numerals for amounts. Allow long descriptions to wrap and give financial values enough space to remain legible. The type treatment reflects the selected prototype; verify the actual font and hierarchy during implementation.

## Layout

A simple header anchors identity. A maximum 1200px workspace places balances and expense history beside a 390px expense form, with a 24px gap. At 800px and below, place the form first and stack work areas vertically with 18px side padding.

## Elevation & Depth

Separate canvas, group context and work surfaces with tonal differences and a fine border. Avoid decorative stacking and heavy shadows. Use a soft shadow only for transient feedback such as a toast.

## Shapes

Use 7–14px radii for inputs, surfaces and controls. Round avatars communicate member identity, not interactive status. Maintain consistent shapes and a visible focus outline.

## Components

- **Shared controls:** Button, Input, Textarea and Select belong in `src/components/ui/`. Callers provide accessible labels; reuse native keyboard behavior.
- **Selection:** show the current user and group together, with clear labels. Only list groups available to the selected user.
- **Expense entry:** description, amount, payer, split mode and member selection remain visible and understandable. Preview amounts update with the current input. In exact mode show remaining or over-allocated amounts and disable invalid submission.
- **Balances:** list each member including zero, with readable labels for who receives or owes. Align monetary figures consistently.
- **Expense list:** show description, payer, amount and newest-first order. Offer deletion only to the payer and confirm it.
- **States:** implement loading, empty, disabled, field error, API error, success, refresh failure and uncertain submission. The prototype only demonstrates selected visual states; it does not prove these workflows.

## Do's and Don'ts

- Do keep the primary task prominent and verify desktop, mobile, keyboard focus and error states.
- Do pair color with words for financial direction and errors.
- Do preserve exact monetary behavior and API rules from the project requirements.
- Do not show example data as real account data or imply the prototype persists changes.
- Do not promote prototype code directly to production; implement and verify the actual flow against the selected reference.
