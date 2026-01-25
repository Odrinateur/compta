/**
 * Web Push implementation for Cloudflare Workers
 * Uses Web Crypto APIs - no external dependencies
 */

interface PushSubscription {
    endpoint: string;
    p256dh: string;
    auth: string;
}

interface PushPayload {
    title: string;
    body: string;
    url?: string;
    tag?: string;
}

interface VapidKeys {
    publicKey: string;
    privateKey: string;
    subject: string;
}

// Base64URL encoding/decoding helpers
function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
    // Add padding if needed
    const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
    const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (const [i, char] of [...binary].entries()) {
        bytes[i] = char.charCodeAt(0);
    }
    return bytes;
}

// Concatenate Uint8Arrays
function concat(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

// Convert Uint8Array to ArrayBuffer (handles subarray views correctly)
function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
    // Create a new ArrayBuffer and copy the data
    const buffer = new ArrayBuffer(arr.byteLength);
    new Uint8Array(buffer).set(arr);
    return buffer;
}

// HKDF implementation using Web Crypto
async function hkdf(
    salt: Uint8Array,
    ikm: Uint8Array,
    info: Uint8Array,
    length: number
): Promise<Uint8Array> {
    // Import IKM as HKDF key
    const ikmKey = await crypto.subtle.importKey(
        "raw",
        toArrayBuffer(ikm),
        { name: "HKDF" },
        false,
        ["deriveBits"]
    );

    // Derive bits
    const derived = await crypto.subtle.deriveBits(
        {
            name: "HKDF",
            hash: "SHA-256",
            salt: toArrayBuffer(salt),
            info: toArrayBuffer(info),
        },
        ikmKey,
        length * 8
    );

    return new Uint8Array(derived);
}

// Create VAPID JWT
async function createVapidJwt(
    audience: string,
    vapidKeys: VapidKeys,
    expiration: number
): Promise<string> {
    const header = { typ: "JWT", alg: "ES256" };
    const payload = {
        aud: audience,
        exp: expiration,
        sub: vapidKeys.subject,
    };

    const encoder = new TextEncoder();
    const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
    const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));

    const unsignedToken = `${headerB64}.${payloadB64}`;

    // Import private key as JWK (web-push generates raw EC keys, not PKCS8)
    // The private key from web-push is the raw 32-byte "d" parameter
    // The public key is the uncompressed 65-byte point (04 || x || y)
    const publicKeyBytes = base64UrlDecode(vapidKeys.publicKey);
    
    // Extract x and y from uncompressed public key (skip the 0x04 prefix)
    const x = base64UrlEncode(publicKeyBytes.slice(1, 33));
    const y = base64UrlEncode(publicKeyBytes.slice(33, 65));
    
    const jwk: JsonWebKey = {
        kty: "EC",
        crv: "P-256",
        x: x,
        y: y,
        d: vapidKeys.privateKey, // Already base64url encoded
    };

    const privateKey = await crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["sign"]
    );

    // Sign
    const signature = await crypto.subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        privateKey,
        encoder.encode(unsignedToken)
    );

    // Convert signature from DER to raw format (if needed) - Web Crypto returns raw format
    const signatureB64 = base64UrlEncode(signature);

    return `${unsignedToken}.${signatureB64}`;
}

// Encrypt payload using aes128gcm
async function encryptPayload(
    payload: string,
    subscription: PushSubscription
): Promise<{ encrypted: Uint8Array; localPublicKey: Uint8Array; salt: Uint8Array }> {
    const encoder = new TextEncoder();

    // Decode subscription keys
    const clientPublicKey = base64UrlDecode(subscription.p256dh);
    const authSecret = base64UrlDecode(subscription.auth);

    // Generate local ECDH key pair
    const localKeyPair = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveBits"]
    );

    // Export local public key (uncompressed format)
    const localPublicKeyRaw = await crypto.subtle.exportKey("raw", localKeyPair.publicKey);
    const localPublicKey = new Uint8Array(localPublicKeyRaw);

    // Import client public key
    const clientKey = await crypto.subtle.importKey(
        "raw",
        toArrayBuffer(clientPublicKey),
        { name: "ECDH", namedCurve: "P-256" },
        false,
        []
    );

    // Derive shared secret via ECDH
    const sharedSecretBits = await crypto.subtle.deriveBits(
        { name: "ECDH", public: clientKey },
        localKeyPair.privateKey,
        256
    );
    const sharedSecret = new Uint8Array(sharedSecretBits);

    // Generate salt (16 random bytes)
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Derive IKM: HKDF-SHA256(auth, sharedSecret, "WebPush: info" || 0x00 || client || server)
    const ikmInfo = concat(
        encoder.encode("WebPush: info\0"),
        clientPublicKey,
        localPublicKey
    );
    const ikm = await hkdf(authSecret, sharedSecret, ikmInfo, 32);

    // Derive content encryption key: HKDF-SHA256(salt, ikm, "Content-Encoding: aes128gcm" || 0x00, 16)
    const cekInfo = encoder.encode("Content-Encoding: aes128gcm\0");
    const cek = await hkdf(salt, ikm, cekInfo, 16);

    // Derive nonce: HKDF-SHA256(salt, ikm, "Content-Encoding: nonce" || 0x00, 12)
    const nonceInfo = encoder.encode("Content-Encoding: nonce\0");
    const nonce = await hkdf(salt, ikm, nonceInfo, 12);

    // Import CEK for AES-GCM
    const aesKey = await crypto.subtle.importKey("raw", toArrayBuffer(cek), { name: "AES-GCM" }, false, [
        "encrypt",
    ]);

    // Pad the payload (add delimiter byte 0x02)
    const payloadBytes = encoder.encode(payload);
    const paddedPayload = concat(payloadBytes, new Uint8Array([2]));

    // Encrypt with AES-GCM
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: toArrayBuffer(nonce) },
        aesKey,
        toArrayBuffer(paddedPayload)
    );

    // Build the encrypted content coding header
    // salt (16) + rs (4) + idlen (1) + keyid (65 for P-256)
    const rs = new Uint8Array(4);
    const recordSize = 4096;
    rs[0] = (recordSize >> 24) & 0xff;
    rs[1] = (recordSize >> 16) & 0xff;
    rs[2] = (recordSize >> 8) & 0xff;
    rs[3] = recordSize & 0xff;

    const idlen = new Uint8Array([localPublicKey.length]);

    const encrypted = concat(salt, rs, idlen, localPublicKey, new Uint8Array(ciphertext));

    return { encrypted, localPublicKey, salt };
}

// Send a push notification
export async function sendPushNotification(
    subscription: PushSubscription,
    payload: PushPayload,
    vapidKeys: VapidKeys
): Promise<{ success: boolean; statusCode: number; error?: string }> {
    try {
        // Get the origin from the endpoint URL
        const endpointUrl = new URL(subscription.endpoint);
        const audience = endpointUrl.origin;

        // JWT expires in 12 hours
        const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

        // Create VAPID JWT
        const jwt = await createVapidJwt(audience, vapidKeys, expiration);

        // Encrypt the payload
        const payloadString = JSON.stringify(payload);
        const { encrypted } = await encryptPayload(payloadString, subscription);

        // Build authorization header
        const authorization = `vapid t=${jwt}, k=${vapidKeys.publicKey}`;

        // Send the request
        const response = await fetch(subscription.endpoint, {
            method: "POST",
            headers: {
                Authorization: authorization,
                "Content-Type": "application/octet-stream",
                "Content-Encoding": "aes128gcm",
                TTL: "86400", // 24 hours
                Urgency: "normal",
            },
            body: toArrayBuffer(encrypted),
        });

        if (response.status === 201) {
            return { success: true, statusCode: response.status };
        }

        // Handle errors
        const errorText = await response.text();
        return {
            success: false,
            statusCode: response.status,
            error: errorText,
        };
    } catch (error) {
        return {
            success: false,
            statusCode: 0,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// Check if a subscription is still valid (410 Gone means expired)
export function isSubscriptionExpired(statusCode: number): boolean {
    return statusCode === 404 || statusCode === 410;
}
