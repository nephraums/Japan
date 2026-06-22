"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallButton() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!prompt) return null;

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  }

  return (
    <button type="button" onClick={install} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#ded3c3] bg-white/70 px-3 text-sm font-semibold text-[#514b45] transition hover:border-[#c83b2f] hover:text-[#9f2a22]" title="Install Japan 2026">
      <Download size={16} aria-hidden="true" /><span className="hidden lg:inline">Install app</span><span className="sr-only lg:hidden">Install app</span>
    </button>
  );
}
