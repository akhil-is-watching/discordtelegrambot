import { createConfig, http } from "wagmi";
// Imported from viem directly (not wagmi/chains) — Bun's production bundler was resolving
// wagmi/chains' re-export of `mainnet` to undefined, crashing the whole app at module load.
import { mainnet } from "viem/chains";
import { injected } from "wagmi/connectors";

// Injected-only (MetaMask, Rabby, Brave, etc.) — no WalletConnect project id configured.
export const wagmiConfig = createConfig({
  chains: [mainnet],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
  },
});
