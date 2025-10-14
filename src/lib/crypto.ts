import sodium , {sodiumReady} from './solium.ts';
import CryptoJS from 'crypto-js';

// This function runs once per user, e.g., on registration
export async function generateUserKeys() {
    await sodiumReady;

    // Create a key pair for authenticated encryption (Box)
    const keyPair = sodium.crypto_box_keypair();

    const publicKey = sodium.to_base64(keyPair.publicKey);
    const privateKey = sodium.to_base64(keyPair.privateKey);

    return { publicKey, privateKey };
}


export async function encryptMessage(
    message: string,
    recipientPublicKey_base64: string,
    senderPrivateKey_base64: string
) {
    await sodiumReady;
    // Convert keys from base64 back to Uint8Array
    const recipientPublicKey = sodium.from_base64(recipientPublicKey_base64);
    const senderPrivateKey = sodium.from_base64(senderPrivateKey_base64);

    // Basic validation of key lengths
    if (!recipientPublicKey || recipientPublicKey.length !== sodium.crypto_box_PUBLICKEYBYTES) {
        throw new Error('Invalid recipient public key: wrong length or malformed base64');
    }
    if (!senderPrivateKey || senderPrivateKey.length !== sodium.crypto_box_SECRETKEYBYTES) {
        throw new Error('Invalid sender private key: wrong length or malformed base64');
    }
    // Convert the message to a Uint8Array
    // Generate a random nonce (a number used only once)
    const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
    // Encrypt the message - protect with try/catch to give clearer errors on key mismatch
    try {
        const encryptedMessage = sodium.crypto_box_easy(
            message,
            nonce,
            recipientPublicKey,
            senderPrivateKey
        );

        // Return the encrypted message and nonce, both in base64
        return {
            ciphertext: sodium.to_base64(encryptedMessage),
            nonce: sodium.to_base64(nonce),
        };
    } catch (err) {
        // libsodium will often throw when keys are the wrong type/length
        console.error('Encryption failed:', err);
        throw new Error('Encryption failed: check that recipient public key and sender private key are correct base64 keys');
    }
}



export async function decryptMessage(
    ciphertext_base64: string,
    nonce_base64: string,
    senderPublicKey_base64: string,
    recipientPrivateKey_base64: string
) {
    await sodiumReady;

    // Convert everything from base64
    const ciphertext = sodium.from_base64(ciphertext_base64);
    const nonce = sodium.from_base64(nonce_base64);
    const senderPublicKey = sodium.from_base64(senderPublicKey_base64);
    const recipientPrivateKey = sodium.from_base64(recipientPrivateKey_base64);

    // Basic validation of key lengths
    if (!senderPublicKey || senderPublicKey.length !== sodium.crypto_box_PUBLICKEYBYTES) {
        throw new Error('Invalid sender public key: wrong length or malformed base64');
    }
    if (!recipientPrivateKey || recipientPrivateKey.length !== sodium.crypto_box_SECRETKEYBYTES) {
        throw new Error('Invalid recipient private key: wrong length or malformed base64');
    }

    // Decrypt the message
    try {
        const decryptedMessage = sodium.crypto_box_open_easy(
            ciphertext,
            nonce,
            senderPublicKey,
            recipientPrivateKey
        );

        if (!decryptedMessage) {
            // Some builds may return null/undefined on failure
            throw new Error('Decryption failed: authentication failed (wrong key/nonce)');
        }

        // Convert the decrypted message back to a readable string
        return sodium.to_string(decryptedMessage);
    } catch (err) {
        console.error('Decryption error:', err);
        throw new Error('Decryption failed: check that keys and nonce/ciphertext match and are correct base64 strings');
    }
}




// Function to encrypt the private key with a password
export function encryptPrivateKey(privateKey: string, email: string): string {
    const encrypted = CryptoJS.AES.encrypt(privateKey, email).toString();
    return encrypted;
}

// Function to decrypt the private key with a password
export function decryptPrivateKey(encryptedPrivateKey:string, email:string):string {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, email);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);

        // If decryption fails, toString() returns an empty string.
        if (!originalText) {
            throw new Error("Decryption failed: Invalid password or corrupted data.");
        }

        return originalText;
    } catch (error) {
        console.error("Decryption error:", error);
        throw new Error("Decryption failed.");
    }
}