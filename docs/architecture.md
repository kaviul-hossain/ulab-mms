# Architecture

This project is a Next.js App Router application backed by MongoDB and NextAuth.

## Request Flow

1. The browser loads `app/layout.tsx`, which wraps every page with `AuthProvider`, `ThemeProvider`, the toast container, the footer, and the bug-report button.
2. Authenticated pages read the session with `useSession()` on the client or `getServerSession(authOptions)` on the server.
3. Data routes connect through `lib/mongodb.ts`, which reuses a cached Mongoose connection to avoid reconnecting on hot reload.
4. Domain logic is split between the route handlers in `app/api/**`, the models in `models/**`, and UI utilities in `app/utils/**`.

## Root Layout

`app/layout.tsx` is the global shell for the app. It defines the fonts, global metadata, and the persistent providers.

```tsx
<AuthProvider>
  <ThemeProvider>
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
      <AppFooter />
    </div>
    <Toaster richColors position="top-right" />
    <BugReportButton />
  </ThemeProvider>
</AuthProvider>
```

That means every route gets:

- session state from NextAuth
- theme switching
- toast notifications
- a shared footer
- a floating bug-report entry point

## Database Layer

`lib/mongodb.ts` keeps a single cached connection in development.

- If a connection already exists, it returns it immediately.
- If not, it creates one with `mongoose.connect()`.
- If the connection fails, it clears the pending promise so the next request can retry cleanly.

This pattern prevents the common Mongoose hot-reload problem where API routes create too many connections.

## Shared UX

`app/utils/notifications.ts` centralizes toast messages behind a service object.

Instead of repeating `toast.success()` and `toast.error()` in every page, the app calls helpers like:

- `notify.auth.signInSuccess()`
- `notify.course.created()`
- `notify.mark.bulkSaved()`

That keeps messages consistent across the UI.

## Code Paths To Know

- `app/layout.tsx` for the global shell
- `app/api/auth/[...nextauth]/route.ts` for session logic
- `lib/mongodb.ts` for database connection reuse
- `app/utils/notifications.ts` for user feedback
- `models/*.ts` for the data contracts
