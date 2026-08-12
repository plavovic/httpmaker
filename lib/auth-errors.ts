const AUTH_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  OAuthAccountNotLinked: "This email is already connected through another sign-in method. Sign in with the provider you originally used.",
  OAuthCallbackError: "Google sign-in could not be completed. Please try again.",
  AccessDenied: "Sign-in was cancelled or access was denied.",
  Configuration: "Sign-in is temporarily unavailable. Please try again later.",
};

export function friendlyAuthError(code?: string) {
  if (!code) return null;
  return AUTH_ERROR_MESSAGES[code] ?? "Sign-in could not be completed. Please try again.";
}
