import sodium from 'libsodium-wrappers';

// Initialize sodium and export the promise
export const sodiumReady = sodium.ready;

// Export the sodium instance itself
export default sodium;