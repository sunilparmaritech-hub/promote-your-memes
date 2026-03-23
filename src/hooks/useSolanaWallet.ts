import { useState, useEffect, useCallback } from "react";
import {
  Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL
} from "@solana/web3.js";

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      isBackpack?: boolean;
      connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      publicKey?: { toString: () => string } | null;
      signTransaction?: (tx: unknown) => Promise<unknown>;
      request?: (params: { method: string; params?: unknown }) => Promise<unknown>;
    };
  }
}

export type WalletState = {
  connected: boolean;
  publicKey: string | null;
  connecting: boolean;
  walletName: string | null;
};

export function useSolanaWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    publicKey: null,
    connecting: false,
    walletName: null,
  });

  useEffect(() => {
    const solana = window.solana;
    if (solana?.publicKey) {
      setWallet({
        connected: true,
        publicKey: solana.publicKey.toString(),
        connecting: false,
        walletName: solana.isPhantom ? "Phantom" : "Wallet",
      });
    }
  }, []);

  const connect = useCallback(async () => {
    const solana = window.solana;
    if (!solana) {
      window.open("https://phantom.app/", "_blank");
      return;
    }
    try {
      setWallet(w => ({ ...w, connecting: true }));
      const resp = await solana.connect();
      setWallet({
        connected: true,
        publicKey: resp.publicKey.toString(),
        connecting: false,
        walletName: solana.isPhantom ? "Phantom" : "Wallet",
      });
    } catch (err) {
      console.error("Wallet connect error:", err);
      setWallet(w => ({ ...w, connecting: false }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await window.solana?.disconnect();
    } catch {}
    setWallet({ connected: false, publicKey: null, connecting: false, walletName: null });
  }, []);

  const sendSol = useCallback(async (toAddress: string, amountSol: number): Promise<string | null> => {
    const solana = window.solana;
    if (!solana || !wallet.publicKey) throw new Error("Wallet not connected");

    const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
    const fromPubkey = new PublicKey(wallet.publicKey);
    const toPubkey = new PublicKey(toAddress);
    const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    const tx = new Transaction().add(
      SystemProgram.transfer({ fromPubkey, toPubkey, lamports })
    );
    tx.recentBlockhash = blockhash;
    tx.feePayer = fromPubkey;

    const signedTx = await solana.signTransaction!(tx) as typeof tx;
    const sig = await connection.sendRawTransaction((signedTx as Transaction).serialize());
    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
    return sig;
  }, [wallet.publicKey]);

  return { wallet, connect, disconnect, sendSol };
}
