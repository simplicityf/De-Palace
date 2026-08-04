export function PalmIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M32 60V30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M32 32C32 32 20 26 14 12C14 12 30 12 32 32Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M32 32C32 32 44 26 50 12C50 12 34 12 32 32Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M32 28C32 28 22 20 20 6C20 6 34 8 32 28Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M32 28C32 28 42 20 44 6C44 6 30 8 32 28Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M32 24C32 24 30 12 32 2C32 2 34 12 32 24Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function PalmDivider({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className ?? ""}`}>
      <span className="h-px w-12 bg-current opacity-40" />
      <PalmIcon className="size-5 text-current" />
      <span className="h-px w-12 bg-current opacity-40" />
    </div>
  );
}
