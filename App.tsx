import { ClerkProvider, useSignIn } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import React, { useState } from "react";
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from "react-native";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

function SignInScreen() {
  const { signIn, fetchStatus } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    try {
      type PasswordSignInCreateParams = Omit<Parameters<typeof signIn.create>[0], "strategy"> & {
        strategy: "password";
      };
      const createPasswordSignIn = signIn.create as unknown as (
        params: PasswordSignInCreateParams,
      ) => Promise<unknown>;
      await createPasswordSignIn({ strategy: "password", identifier: email, password });
    } catch (err) {
      console.error("Sign-in failed:", err);
      const detail = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error && err.stack ? err.stack.split("\n").slice(0, 6).join(" | ") : "no stack";
      setError(`${detail} STACK: ${stack}`);
    }
  };

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
        title={fetchStatus === "fetching" ? "Signing in..." : "Sign in"}
        onPress={handleSubmit}
        disabled={!email || !password || fetchStatus === "fetching"}
      />
      {fetchStatus === "fetching" && <ActivityIndicator />}
      {error && <Text style={styles.error}>{error}</Text>}
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
  error: { color: "red", marginTop: 12 },
});
