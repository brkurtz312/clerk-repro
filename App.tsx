import { ClerkProvider, useSignIn } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import React, { useState } from "react";
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from "react-native";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

function SignInScreen() {
  const { signIn, fetchStatus } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const report = (err: unknown) => {
    console.error("Sign-in failed:", err);
    const detail = err instanceof Error ? err.message : String(err);
    const stack =
      err instanceof Error && err.stack ? err.stack.split("\n").slice(0, 6).join(" | ") : "no stack";
    setResult(`THREW: ${detail} STACK: ${stack}`);
  };

  // Reproduces the bug: copying signIn.create into a local detaches it from its
  // receiver, so the method cannot reach its private sign-in state. Under
  // Hermes every call throws "attempted to use private field on non-instance"
  // before any network request is made.
  const handleDetached = async () => {
    setResult(null);
    try {
      type PasswordSignInCreateParams = Omit<Parameters<typeof signIn.create>[0], "strategy"> & {
        strategy: "password";
      };
      const createPasswordSignIn = signIn.create as unknown as (
        params: PasswordSignInCreateParams,
      ) => Promise<unknown>;
      await createPasswordSignIn({ strategy: "password", identifier: email, password });
      setResult("Detached call returned without throwing");
    } catch (err) {
      report(err);
    }
  };

  // The fix: call the factor-specific method on signIn itself, so the receiver
  // is intact. Reaches the Clerk API and resolves with { error } / a status.
  const handleAttached = async () => {
    setResult(null);
    try {
      const { error } = await signIn.password({ identifier: email, password });
      setResult(
        error
          ? `Reached Clerk API — error: ${error.code} (${error.message})`
          : `Reached Clerk API — status: ${signIn.status}`,
      );
    } catch (err) {
      report(err);
    }
  };

  const busy = fetchStatus === "fetching";
  const disabled = !email || !password || busy;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clerk minimal repro</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button
        title={busy ? "Signing in..." : "A. Detached signIn.create (throws)"}
        onPress={handleDetached}
        disabled={disabled}
      />
      <Button
        title={busy ? "Signing in..." : "B. Attached signIn.password (works)"}
        onPress={handleAttached}
        disabled={disabled}
      />
      {busy && <ActivityIndicator />}
      {result && <Text style={styles.result}>{result}</Text>}
    </View>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SignInScreen />
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 },
  result: { marginTop: 12 },
});
