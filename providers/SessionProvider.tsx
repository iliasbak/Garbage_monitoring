import { useContext, createContext, type PropsWithChildren } from "react";
import { useStorageState } from "@/hooks/useStorageState";
import { UserCredential } from "firebase/auth";

const AuthContext = createContext<{
  signIn: (credential: UserCredential) => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

// This hook can be used to access the user info.
export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState<UserCredential | null>("session");

  return (
    <AuthContext.Provider
      value={{
        signIn: (credential: UserCredential) => {
          // Perform sign-in logic here
          setSession(credential);
        },
        signOut: () => {
          setSession(null);
        },
        session: null,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
