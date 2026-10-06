import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-xl border border-brand-green/10 bg-white/90 p-4 sm:p-5 shadow-sm backdrop-blur hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
          <p className="font-serif text-lg sm:text-xl md:text-2xl text-brand-green truncate">
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-muted-foreground/70 truncate">{subtext}</p>
          )}
        </div>
        <div className={`p-2 sm:p-2.5 rounded-lg ${bgColor} flex-shrink-0 ml-2`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}
