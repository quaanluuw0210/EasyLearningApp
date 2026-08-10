import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Hook to handle actions that require authentication.
 * Instead of redirecting immediately, it provides a state to show an Auth Prompt.
 * 
 * Usage:
 * const { performAction, showAuthModal, setShowAuthModal } = useProtectedAction();
 * 
 * <button onClick={() => performAction(() => openMySecretModal())}>
 *   Click me
 * </button>
 * 
 * <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
 */
export function useProtectedAction() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const performAction = (action: () => void) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    action();
  };

  return { 
    performAction, 
    showAuthModal, 
    setShowAuthModal, 
    isAuthenticated: !!user, 
    user 
  };
}
