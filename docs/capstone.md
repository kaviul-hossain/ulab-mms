# Capstone

Capstone is separated into a dedicated branch of the app because it has its own submission flow.

## Entry Page

`app/capstone/page.tsx` is a role selector.

It requires authentication and redirects unauthenticated users to `/auth/signin`.

Once loaded, it presents two paths:

- submit as supervisor
- submit as evaluator

## Why It Is Separate

Capstone grading uses different submission semantics from regular course marks:

- supervisors submit for students they supervise
- evaluators submit assigned evaluation marks
- the UI needs role-specific navigation instead of a single generic form

## Shared UI Pattern

The page follows the same structure as the rest of the app:

- sticky header
- ULAB branding
- call-to-action cards
- client-side auth guard

## Related Routes

The capstone landing page links into:

- `capstone/supervisor`
- `capstone/evaluator`
- downstream semester/category-specific submission pages

That keeps the first step simple while pushing the actual scoring logic into the specialized pages.