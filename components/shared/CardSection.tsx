import type { ReactNode } from "react";

type CardTone = "green" | "purple" | "neutral";

interface CardSectionProps {
  title: string;
  subtitle?: string;
  tone?: CardTone;
  className?: string;
  action?: ReactNode;
  children: ReactNode;
}

const toneClasses: Record<CardTone, string> = {
  green: "border-[#2a2a2a] bg-[#181818]",
  purple: "border-[#2a2a2a] bg-[#181818]",
  neutral: "border-[#2a2a2a] bg-[#181818]"
};

export function CardSection({
  title,
  subtitle,
  tone = "neutral",
  className = "",
  action,
  children
}: CardSectionProps) {
  return (
    <section className={`rounded-[8px] border p-3 shadow-panel ${toneClasses[tone]} ${className}`}>
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-black text-white">{title}</h2>
          {subtitle ? <p className="mt-1 max-w-2xl text-xs leading-5 text-[#b3b3b3]">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
