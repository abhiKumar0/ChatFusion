"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { decryptPrivateKey } from './crypto';
import { useGetMe } from './react-query/queries';

interface CryptoContextType {
  decryptedPrivateKey: string | null;
  isLoading: boolean;
  error: string | null;
}

const CryptoContext = createContext<CryptoContextType | null>(null);

export const useCrypto = () => {
  const context = useContext(CryptoContext);
  if (!context) {
    throw new Error('useCrypto must be used within CryptoProvider');
  }
  return context;
};

export const CryptoProvider = ({ children }: { children: React.ReactNode }) => {
  const [decryptedPrivateKey, setDecryptedPrivateKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: user } = useGetMe();

  useEffect(() => {
    if (!user?.encryptedPrivateKey || !user?.email) {
      setDecryptedPrivateKey(null);
      return;
    }

    const decryptKey = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const decrypted = await decryptPrivateKey(user.encryptedPrivateKey, user.email);
        setDecryptedPrivateKey(decrypted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to decrypt private key');
        setDecryptedPrivateKey(null);
      } finally {
        setIsLoading(false);
      }
    };

    decryptKey();
  }, [user?.encryptedPrivateKey, user?.email]);

  return (
    <CryptoContext.Provider value={{ decryptedPrivateKey, isLoading, error }}>
      {children}
    </CryptoContext.Provider>
  );
};
