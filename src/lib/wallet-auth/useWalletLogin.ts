import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { useAccount, useConnect, useSignMessage, type Connector } from "wagmi";
import { generateSignedMessage } from "@/lib/wallet-auth/signature-message";
import { getWalletNonce, loginWithWallet, type WalletChain } from "@/lib/api/wallet-auth";
import { ApiError } from "@/lib/api/errors";

export type WalletLoginStatus = "idle" | "connecting" | "signing" | "error";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function completeLogin(
  walletAddress: string,
  chain: WalletChain,
  sign: (message: string) => Promise<string>,
): Promise<string> {
  let nonce: string;
  try {
    const result = await getWalletNonce(walletAddress, chain);
    nonce = result.nonce;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      throw new ApiError("This wallet isn't registered yet. Sign up on trynoah.ai first.", 404);
    }
    throw err;
  }

  const issuedAt = new Date().toISOString();
  const message = generateSignedMessage(walletAddress, nonce, issuedAt);
  const signature = await sign(message);
  const { accessToken } = await loginWithWallet({ walletAddress, signature, chain, issuedAt });
  return accessToken;
}

/** Connect → fetch nonce → sign → exchange for a session token, for either chain. */
export function useWalletLogin(onToken: (accessToken: string) => Promise<void>) {
  const [pendingSolanaWallet, setPendingSolanaWallet] = useState<WalletName | null>(null);
  const [status, setStatus] = useState<WalletLoginStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const solana = useWallet();
  const { connectAsync, connectors: evmConnectors } = useConnect();
  const { signMessageAsync } = useSignMessage();
  useAccount(); // keeps wagmi's account cache warm for connectAsync's result

  const runLogin = useCallback(
    async (walletAddress: string, chain: WalletChain, sign: (message: string) => Promise<string>) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setStatus("signing");
      setError(null);
      try {
        const accessToken = await completeLogin(walletAddress, chain, sign);
        await onToken(accessToken);
        setStatus("idle");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not sign in with this wallet.");
        setStatus("error");
      } finally {
        inFlight.current = false;
      }
    },
    [onToken],
  );

  // Solana's select() only targets an adapter; the actual connect() call has to wait
  // for `wallet` to reflect that selection before it does anything useful.
  useEffect(() => {
    if (!pendingSolanaWallet || solana.wallet?.adapter.name !== pendingSolanaWallet) return;
    setPendingSolanaWallet(null);
    setStatus("connecting");

    solana
      .connect()
      .then(() => {
        const address = solana.publicKey?.toBase58();
        const signMessage = solana.signMessage;
        if (!address) throw new Error("No Solana address after connecting");
        if (!signMessage) throw new Error("This wallet doesn't support message signing");
        return runLogin(address, "SOLANA", async (message) => toBase64(await signMessage(new TextEncoder().encode(message))));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not connect to that wallet.");
        setStatus("error");
      });
    // solana's own identity changes every render; only re-run when the target wallet changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSolanaWallet, solana.wallet, runLogin]);

  const connectSolana = useCallback(
    (walletName: WalletName) => {
      setError(null);
      solana.select(walletName);
      setPendingSolanaWallet(walletName);
    },
    [solana],
  );

  const connectEvm = useCallback(
    async (connector: Connector) => {
      setError(null);
      setStatus("connecting");
      try {
        const result = await connectAsync({ connector });
        const address = result.accounts[0];
        await runLogin(address, "EVM", (message) => signMessageAsync({ message, account: address }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not connect to that wallet.");
        setStatus("error");
      }
    },
    [connectAsync, runLogin, signMessageAsync],
  );

  return {
    status,
    error,
    solanaWallets: solana.wallets,
    evmConnectors,
    connectSolana,
    connectEvm,
  };
}
