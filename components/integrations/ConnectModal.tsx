"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import type { Platform } from "@/lib/domain/types";
import { integrationsService } from "@/lib/services";

const SCOPES = [
  "See your ad accounts and campaigns",
  "Create and edit ads and campaigns",
  "Read performance and status reports",
];

/** A simulated consent screen. In the backend phase this step becomes a redirect to the platform's real OAuth page. */
export function ConnectModal({
  platform,
  onClose,
  onConnected,
}: {
  platform: Platform | null;
  onClose: () => void;
  onConnected?: (platformId: Platform["id"]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authorize = async () => {
    if (!platform) return;
    setBusy(true);
    setError(null);
    try {
      await integrationsService.connect(platform.id);
      onConnected?.(platform.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={platform !== null} onClose={busy ? () => {} : onClose} title={`Connect ${platform?.name ?? ""}`} size="sm">
      {platform ? (
        <div className="flex flex-col gap-4">
          <p className="border border-hazard/50 bg-hazard/10 p-3 font-body text-xs leading-5 text-chalk/80">
            <strong className="text-hazard">Simulation.</strong> No real account is contacted and nothing is stored on
            a server. This shows how the consent step will look.
          </p>
          <div className="border border-white/10 bg-bay-floor p-4">
            <p className="font-display text-base tracking-[0.04em]">Ad Garage wants to:</p>
            <ul className="mt-3 flex flex-col gap-2">
              {SCOPES.map((scope) => (
                <li key={scope} className="flex items-start gap-2 font-body text-sm text-chalk/80">
                  <Icon name="check" size={14} className="mt-1 shrink-0 text-torque" />
                  {scope}
                </li>
              ))}
            </ul>
            <p className="mt-3 font-body text-xs text-chalk/50">You can disconnect at any time.</p>
          </div>
          {error ? (
            <p role="alert" className="font-body text-sm text-flag">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={authorize} disabled={busy}>
              {busy ? "Connecting…" : "Authorize (demo)"}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
