// Pure client-safe auth utilities — no server imports here

// Password strength: min 8 chars, 1 uppercase, 1 number, 1 special
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) return { valid: false, message: "At least 8 characters" };
  if (!/[A-Z]/.test(password)) return { valid: false, message: "At least 1 uppercase letter" };
  if (!/[0-9]/.test(password)) return { valid: false, message: "At least 1 number" };
  if (!/[^A-Za-z0-9]/.test(password)) return { valid: false, message: "At least 1 special character (!@#$...)" };
  return { valid: true };
}

export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
  if (score <= 3) return { score, label: "Fair", color: "#f59e0b" };
  if (score === 4) return { score, label: "Strong", color: "#84cc16" };
  return { score, label: "Very Strong", color: "#22c55e" };
}
