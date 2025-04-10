export function validateName(name) {
    // Ensure name is a non-empty string and does not contain '<' or '>'.
    if (typeof name !== 'string') return false;
    const trimmed = name.trim();
    if (trimmed.length === 0) return false;
    // Disallow HTML-like tags or any use of angle brackets.
    const forbiddenPattern = /[0-9!@#$%^&'*(),?\/"{}\[\]<>\\|+=\.:;`~\-_]/;
    return !forbiddenPattern.test(trimmed);
  }