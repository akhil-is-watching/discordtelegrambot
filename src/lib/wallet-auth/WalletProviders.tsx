import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { useMemo, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wallet-auth/wagmi-config";

const SOLANA_RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";

const queryClient = new QueryClient();

/**
 * Wraps the app with wagmi (EVM) and the Solana wallet adapter (Solana). No explicit
 * per-wallet adapters are registered — modern wallets (Phantom, Solflare, Backpack, ...)
 * self-register via the Wallet Standard, so `wallets={[]}` still picks them up.
 */
// Without an explicit onError, WalletProvider both console.errors every wallet error
// (even ones useWalletLogin already surfaces in the UI) and, for WalletNotReadyError
// specifically, opens the wallet's website in a new tab — surprising, unwanted UX.
function handleWalletError(error: Error): void {
  console.warn("[wallet]", error.name || error.message || error);
}

export function WalletProviders({ children }: { children: ReactNode }) {
  const solanaWallets = useMemo(() => [], []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
          <WalletProvider wallets={solanaWallets} autoConnect={false} onError={handleWalletError}>
            {children}
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
