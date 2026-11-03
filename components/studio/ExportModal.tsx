"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Tabs, tabIds } from "@/components/ui/Tabs";
import { designToHtmlDocument, designToHtmlFragment, designToReact, maskDataUris } from "@/lib/studio/codegen";
import { type AdDesign, slugify } from "@/lib/studio/model";
import { downloadBlob, renderDesignToPng } from "@/lib/studio/raster";

const TABS = [
  { id: "download", label: "Download" },
  { id: "code", label: "Copy code" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const CODE_KINDS = [
  { id: "html", label: "HTML" },
  { id: "react", label: "React" },
  { id: "json", label: "JSON" },
] as const;
type CodeKind = (typeof CODE_KINDS)[number]["id"];

type Job = { id: string; label: string; hint: string; icon: IconName };

const JOBS: Job[] = [
  { id: "png1", label: "PNG image", hint: "Exact pixel size, ready to upload", icon: "image" },
  { id: "png2", label: "PNG @2×", hint: "Double resolution for sharp screens", icon: "image" },
  { id: "html", label: "HTML file", hint: "Self-contained, no dependencies", icon: "type" },
  { id: "json", label: "Design JSON", hint: "Re-import or hand over to a developer", icon: "layers" },
  { id: "zip", label: "ZIP bundle", hint: "PNG, HTML, JSON and a README", icon: "download" },
];

export function ExportModal({ design, open, onClose }: { design: AdDesign; open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<TabId>("download");
  const [kind, setKind] = useState<CodeKind>("html");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const slug = slugify(design.name);

  const code = useMemo(() => {
    if (!open) return "";
    if (kind === "react") return designToReact(design);
    if (kind === "json") return JSON.stringify(design, null, 2);
    return designToHtmlFragment(design);
  }, [design, kind, open]);

  const run = async (job: Job) => {
    setBusy(job.id);
    setMessage(null);
    try {
      if (job.id === "png1" || job.id === "png2") {
        const scale = job.id === "png2" ? 2 : 1;
        downloadBlob(await renderDesignToPng(design, scale), `${slug}${scale > 1 ? "@2x" : ""}.png`);
      } else if (job.id === "html") {
        downloadBlob(new Blob([designToHtmlDocument(design)], { type: "text/html" }), `${slug}.html`);
      } else if (job.id === "json") {
        downloadBlob(new Blob([JSON.stringify(design, null, 2)], { type: "application/json" }), `${slug}.json`);
      } else {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        zip.file(`${slug}.html`, designToHtmlDocument(design));
        zip.file(`${slug}.json`, JSON.stringify(design, null, 2));
        zip.file(`${slug}.png`, await renderDesignToPng(design, 1));
        zip.file(
          "README.txt",
          `${design.name}\n${design.width}x${design.height}px\n\nExported from Ad Garage (demo build).\n- ${slug}.png  upload this to an ad platform\n- ${slug}.html embed on a page you control\n- ${slug}.json the editable design\n\nCheck each platform's current creative requirements before you upload.\n`,
        );
        downloadBlob(await zip.generateAsync({ type: "blob" }), `${slug}-bundle.zip`);
      }
      setMessage({ ok: true, text: `${job.label} downloaded.` });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Export failed." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Export · ${design.name}`} size="md">
      <Tabs items={TABS} value={tab} onChange={setTab} label="Export options" idPrefix="export" />
      <div role="tabpanel" id={tabIds("export", tab).panel} aria-labelledby={tabIds("export", tab).tab} className="pt-4">
        {tab === "download" ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {JOBS.map((job) => (
              <li key={job.id}>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => run(job)}
                  className="flex w-full items-start gap-3 border border-white/15 p-3 text-left transition-colors hover:border-hazard disabled:opacity-50"
                >
                  <Icon name={job.icon} size={18} className="mt-0.5 shrink-0 text-hazard" />
                  <span>
                    <span className="block font-display text-sm tracking-[0.04em]">
                      {busy === job.id ? "Preparing…" : job.label}
                    </span>
                    <span className="block font-body text-xs leading-5 text-chalk/60">{job.hint}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1" role="group" aria-label="Code format">
                {CODE_KINDS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    aria-pressed={kind === k.id}
                    onClick={() => setKind(k.id)}
                    className={`border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.04em] ${
                      kind === k.id ? "border-hazard bg-hazard text-bay-floor" : "border-white/20 text-chalk/75"
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
              <CopyButton text={code} label="Copy code" />
            </div>
            <pre className="mt-3 max-h-[360px] overflow-auto border border-white/10 bg-bay-floor p-3 font-mono text-[11px] leading-5 text-chalk/85">
              <code>{maskDataUris(code)}</code>
            </pre>
            <p className="mt-2 font-body text-xs leading-5 text-chalk/55">
              Embedded images are shortened here for reading. Copy and download include the full data.
            </p>
          </div>
        )}
        {message ? (
          <p role="status" aria-live="polite" className={`mt-3 font-body text-sm ${message.ok ? "text-torque" : "text-flag"}`}>
            {message.text}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
