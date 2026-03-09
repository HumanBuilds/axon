const ERROR_MAP: Record<string, string> = {
  // error.code values
  invalid_credentials: "Incorrect email or password.",
  user_not_found: "No account found with that email.",
  email_not_confirmed: "Please verify your email before signing in.",
  over_request_rate_limit: "Too many attempts. Please wait a moment.",
  weak_password: "Password must be at least 6 characters.",
  user_already_exists: "An account with that email already exists.",
  validation_failed: "Please check your input and try again.",

  // error.message fallbacks (Supabase sometimes only sets message)
  "Invalid login credentials": "Incorrect email or password.",
  "Email not confirmed": "Please verify your email before signing in.",
  "User already registered": "An account with that email already exists.",
  "Password should be at least 6 characters":
    "Password must be at least 6 characters.",
};

export function friendlyAuthError(error: {
  code?: string;
  message?: string;
}): string {
  if (error.code && ERROR_MAP[error.code]) return ERROR_MAP[error.code];
  if (error.message && ERROR_MAP[error.message]) return ERROR_MAP[error.message];
  return "Something went wrong. Please try again.";
}
