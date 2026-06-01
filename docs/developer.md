# Developer Notes

This section explains the app at a code level.

## Start Here

1. `app/layout.tsx` for the global shell
2. `app/api/auth/[...nextauth]/route.ts` for login/session behavior
3. `lib/mongodb.ts` for Mongoose connection reuse
4. `models/Course.ts` and `models/User.ts` for core persisted data
5. `app/dashboard/page.tsx` for the main course workflow

## Control Flow Summary

- users sign in through NextAuth
- the session is stored in JWT form
- protected pages read the session on the client or server
- the dashboard fetches course data from `/api/courses`
- course creation seeds exams automatically
- notifications are centralized through `app/utils/notifications.ts`

## Practical Reading Order

If you want to understand the system quickly, read the files in this order:

1. `app/auth/signin/page.tsx`
2. `app/api/auth/[...nextauth]/route.ts`
3. `models/User.ts`
4. `lib/mongodb.ts`
5. `models/Course.ts`
6. `app/api/courses/route.ts`
7. `app/dashboard/page.tsx`
8. `app/capstone/page.tsx`

## Why This Matters

The app is mostly a composition of small, focused routes rather than one large service layer. That means the code is easiest to understand by following the user journey from login to dashboard to domain-specific routes.