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
export function WalletProviders({ children }: { children: ReactNode }) {
  const solanaWallets = useMemo(() => [], []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
          <WalletProvider wallets={solanaWallets} autoConnect={false}>
            {children}
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
