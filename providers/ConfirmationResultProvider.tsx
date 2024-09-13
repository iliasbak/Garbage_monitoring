import { ConfirmationResult } from "firebase/auth";
import {
    useContext,
    createContext,
    type PropsWithChildren,
    useState,
  } from "react";

  const ConfirmationResultContext = createContext<{
    setConfirmationResult: (result: ConfirmationResult) => void;
    confirmationResult: ConfirmationResult | null;
  }>({
    setConfirmationResult: () => {},
    confirmationResult: null,
  });
  
  // This hook can be used to access the user info.
  export function useConfirmationResult() {
    const value = useContext(ConfirmationResultContext);
    if (process.env.NODE_ENV !== "production") {
      if (!value) {
        throw new Error(
          "useConfirmationResult must be wrapped in a <ConfirmationResultProvider />"
        );
      }
    }
  
    return value;
  }
  
  export function ConfirmationResultProvider({ children }: PropsWithChildren) {
    const [confirmationResult, setConfirmationResult] =
      useState<ConfirmationResult | null>(null);
  
    return (
      <ConfirmationResultContext.Provider
        value={{
          setConfirmationResult(result) {
            setConfirmationResult(result);
          },
          confirmationResult,
        }}
      >
        {children}
      </ConfirmationResultContext.Provider>
    );
  }
  