import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Redirects any Supabase magic-link hash fragments to /auth/callback
// so the session can be established reliably before continuing.
const AuthHashRouter = () => {
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash || "";

    // Supabase magic link typically includes access_token and other params in the hash
    const hasSupabaseTokens =
      hash.includes("access_token=") ||
      hash.includes("refresh_token=") ||
      hash.includes("type=recovery") ||
      hash.includes("provider_token=");

    if (hasSupabaseTokens && location.pathname !== "/auth/callback") {
      // Preserve the hash so Supabase can parse it properly
      const target = "/auth/callback" + hash;
      // Use full page replace to avoid losing the hash during SPA navigation
      window.location.replace(target);
    }
  }, [location.pathname]);

  return null;
};

export default AuthHashRouter;

