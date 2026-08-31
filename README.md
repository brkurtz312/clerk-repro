# Clerk Expo — `attempted to use private field on non-instance`

Minimal reproduction for a `TypeError: attempted to use private field on non-instance`
thrown by `@clerk/expo` sign-in on iOS (Hermes, New Architecture).

## Cause

Clerk's `SignInFuture` methods read private class fields off their receiver.
Copying one into a local detaches it, and the call throws under Hermes before
any network request is made:

```ts
const createPasswordSignIn = signIn.create as unknown as (...);
await createPasswordSignIn({ strategy: "password", identifier, password });
// TypeError: attempted to use private field on non-instance
```

Calling the factor-specific method on `signIn` itself keeps the receiver intact
and works:

```ts
const { error } = await signIn.password({ identifier, password });
```

`App.tsx` is the whole app (~100 lines) and offers both paths as buttons:

- **A. Detached `signIn.create`** — throws; the error and stack are rendered on
  screen, so no device console is needed.
- **B. Attached `signIn.password`** — reaches the Clerk API and reports the
  resulting status or `error.code`.

## Environment

- `@clerk/expo` 4.6.0 → `@clerk/clerk-js` 6.30.1, `@clerk/react` 6.14.7, `@clerk/shared` 4.30.1
- Expo SDK 54.0.37, React Native 0.81.5, React 19.1.0, Hermes, New Architecture enabled
- Built with EAS Build (iOS production profile), installed through TestFlight

## Running it

```
npm install
eas build --platform ios --profile production
```

The publishable key for a throwaway Clerk development instance is committed in
`eas.json` — swap in your own if you prefer.
