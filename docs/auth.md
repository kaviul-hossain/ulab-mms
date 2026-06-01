# Authentication

Authentication is handled by NextAuth with credentials login and optional Google login.

## Sign-In UI

The public sign-in page lives at `app/auth/signin/page.tsx`.

It does three important things:

- redirects authenticated users to `/dashboard`
- submits credentials with `signIn('credentials', { redirect: false })`
- shows toast feedback through `notify.auth`

It also exposes two alternate paths:

- admin login via `/admin/signin`
- student mark lookup via `/student/check-marks`

## NextAuth Config

The auth handler is defined in `app/api/auth/[...nextauth]/route.ts`.

### Credentials Provider

The credentials provider:

1. checks that email and password were supplied
2. connects to MongoDB
3. finds the user by email
4. compares the password with `bcrypt.compare()`
5. returns a session-safe user object

```ts
return {
  id: (user._id as any).toString(),
  email: user.email,
  name: user.name,
  role: (user as any).role || 'user',
};
```

### JWT and Session Callbacks

The JWT callback enriches the token with the app user id and role.
The session callback then copies those values onto `session.user`.

That is why client pages can use:

```ts
const { data: session } = useSession();
```

and still access `session.user.id` and `session.user.role`.

## Session Rules

- sessions use the `jwt` strategy
- max age is 30 minutes
- update age is 5 minutes
- the sign-in page is `/auth/signin`

## Data Model

The `models/User.ts` schema stores:

- `name`
- `email`
- `password`
- `role`
- password reset token fields

Passwords are stored hashed, and the auth route never exposes the hash to the browser.
