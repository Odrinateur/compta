/**
 * Simple password hashing using SHA-256 + salt
 */

/**
 * Hashes a password using SHA-256 with a random salt
 */
export async function hashPassword(password: string): Promise<string> {
    // Generate random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const encoder = new TextEncoder();

    // Convert salt to hex string for combining
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");

    // Combine password + salt
    const data = encoder.encode(password + saltHex);

    // Hash with SHA-256
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

    // Return salt:hash (both hex encoded)
    return `${saltHex}:${hash}`;
}

/**
 * Verifies a password against a hashed password
 */
export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    const [saltHex, storedHash] = hashedPassword.split(":");
    if (!saltHex || !storedHash) return false;

    const encoder = new TextEncoder();

    // Hash the password with the same salt
    const data = encoder.encode(password + saltHex);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const computedHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

    return computedHash === storedHash;
}

