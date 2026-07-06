import { Blocks, Wallet as WalletIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth/useAuth";
import { useWalletLogin } from "@/lib/wallet-auth/useWalletLogin";

export function WalletLoginPage() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { status, error, solanaWallets, evmConnectors, connectSolana, connectEvm } = useWalletLogin(
    async accessToken => {
      await loginWithToken(accessToken);
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/mods";
      navigate(from, { replace: true });
    },
  );

  const busy = status === "connecting" || status === "signing";
  const installedSolanaWallets = solanaWallets.filter(w => w.readyState === WalletReadyState.Installed);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <Blocks className="size-5" />
          </div>
          <CardTitle className="text-xl">Sign in with your wallet</CardTitle>
          <CardDescription>Connect a wallet to manage your Mods.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Solana</p>
            {installedSolanaWallets.length === 0 ? (
              <p className="text-muted-foreground text-sm">No Solana wallets detected in this browser.</p>
            ) : (
              installedSolanaWallets.map(wallet => (
                <Button
                  key={wallet.adapter.name}
                  type="button"
                  variant="outline"
                  className="justify-start gap-2"
                  disabled={busy}
                  onClick={() => connectSolana(wallet.adapter.name)}
                >
                  <img src={wallet.adapter.icon} alt="" className="size-4" />
                  {wallet.adapter.name}
                </Button>
              ))
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">EVM</p>
            {evmConnectors.length === 0 ? (
              <p className="text-muted-foreground text-sm">No EVM wallets detected in this browser.</p>
            ) : (
              evmConnectors.map(connector => (
                <Button
                  key={connector.uid}
                  type="button"
                  variant="outline"
                  className="justify-start gap-2"
                  disabled={busy}
                  onClick={() => connectEvm(connector)}
                >
                  <WalletIcon className="size-4" />
                  {connector.name}
                </Button>
              ))
            )}
          </div>

          {busy && (
            <p className="text-muted-foreground text-center text-sm">
              {status === "connecting" ? "Connecting…" : "Waiting for your signature…"}
            </p>
          )}
          {error && <p className="text-destructive text-center text-sm">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
