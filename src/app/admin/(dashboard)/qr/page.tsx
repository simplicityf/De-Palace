import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

export default async function QrPage() {
  const menuUrl = `${process.env.NEXT_PUBLIC_APP_URL}/menu`;
  const dataUrl = await QRCode.toDataURL(menuUrl, {
    width: 512,
    margin: 2,
    color: { dark: "#1a1a12", light: "#efffd8" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl">Menu QR code</h1>
        <p className="text-muted-foreground">Links to {menuUrl}</p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL, not an optimizable asset */}
        <img
          src={dataUrl}
          alt="QR code linking to the DePalace menu"
          className="h-64 w-64"
        />
        <a href={dataUrl} download="depalace-menu-qr.png">
          <Button>Download PNG</Button>
        </a>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          Print this once and place it on tables or signage. Anyone who scans
          it goes straight to the public menu — no app or login needed.
        </p>
      </div>
    </div>
  );
}
