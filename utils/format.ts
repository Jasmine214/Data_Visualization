export function formatStreams(value: number): string {
  if (!Number.isFinite(value)) return "0";

  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${trimNumber(value / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${trimNumber(value / 1_000_000)}M`;
  if (abs >= 1_000) return `${trimNumber(value / 1_000)}K`;
  return Math.round(value).toLocaleString("en-US");
}

export function formatFullNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString("en-US");
}

export function formatDateLabel(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return dateValue;

  return new Intl.DateTimeFormat("zh-TW", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function formatShortDateLabel(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return dateValue;

  return new Intl.DateTimeFormat("zh-TW", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function truncateLabel(value: string, maxLength = 28): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

function trimNumber(value: number): string {
  const rounded = value >= 10 ? value.toFixed(0) : value.toFixed(1);
  return rounded.replace(/\.0$/, "");
}
