import sodium , {sodiumReady} from './solium';
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
  await sodium.ready;
  
  // Convert keys from base64 back to Uint8Array
  const recipientPublicKey = sodium.from_base64(recipientPublicKey_base64);
  const senderPrivateKey = sodium.from_base64(senderPrivateKey_base64);

  // Generate a random nonce (a number used only once)
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);

  // Encrypt the message
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
}



export async function decryptMessage(
  ciphertext_base64: string,
  nonce_base64: string,
  senderPublicKey_base64: string,
  recipientPrivateKey_base64: string
) {
  await sodium.ready;

  // Convert everything from base64
  const ciphertext = sodium.from_base64(ciphertext_base64);
  const nonce = sodium.from_base64(nonce_base64);
  const senderPublicKey = sodium.from_base64(senderPublicKey_base64);
  const recipientPrivateKey = sodium.from_base64(recipientPrivateKey_base64);

  // Decrypt the message
  const decryptedMessage = sodium.crypto_box_open_easy(
    ciphertext,
    nonce,
    senderPublicKey,
    recipientPrivateKey
  );

  // Convert the decrypted message back to a readable string
  return sodium.to_string(decryptedMessage);
}




// Function to encrypt the private key with a password
export function encryptPrivateKey(privateKey: string, email: string): string {
  const encrypted = CryptoJS.AES.encrypt(privateKey, email).toString();
  return encrypted;
}

// Function to decrypt the private key with a password
export function decryptPrivateKey(encryptedPrivateKey: string, email: string): string {
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