import type { FilterState } from "@/types/spotify";
import { formatDateLabel } from "@/utils/format";

interface DateRangeFilterProps {
  periods: string[];
  dateRange: FilterState["dateRange"];
  onDateRangeChange: (dateRange: FilterState["dateRange"]) => void;
}

export function DateRangeFilter({ periods, dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const startIndex = findPeriodIndex(periods, dateRange.start, 0);
  const endIndex = findPeriodIndex(periods, dateRange.end, periods.length - 1);
  const disabled = periods.length < 2;
  const maxIndex = Math.max(periods.length - 1, 0);
  const startPercent = maxIndex > 0 ? (startIndex / maxIndex) * 100 : 0;
  const endPercent = maxIndex > 0 ? (endIndex / maxIndex) * 100 : 100;

  function updateStart(index: number) {
    const nextIndex = Math.min(index, endIndex);
    onDateRangeChange({ start: periods[nextIndex], end: periods[endIndex] });
  }

  function updateEnd(index: number) {
    const nextIndex = Math.max(index, startIndex);
    onDateRangeChange({ start: periods[startIndex], end: periods[nextIndex] });
  }

  return (
    <section className="mb-3 rounded-[8px] border border-[#2a2a2a] bg-[#181818] p-3 shadow-panel">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-base font-black text-white">日期篩選 - 控制概覽與單曲分析的時間範圍</h2>
          <p className="mt-1 text-xs text-[#b3b3b3]">
            {dateRange.start && dateRange.end
              ? `${formatDateLabel(dateRange.start)} 至 ${formatDateLabel(dateRange.end)}`
              : "正在準備可用日期"}
          </p>
        </div>

        <div className="grid flex-1 gap-2 xl:max-w-3xl">
          <div className="flex items-center justify-between text-xs font-bold text-[#b3b3b3]">
            <span>開始日期：{dateRange.start ? formatDateLabel(dateRange.start) : "尚未選定"}</span>
            <span>結束日期：{dateRange.end ? formatDateLabel(dateRange.end) : "尚未選定"}</span>
          </div>
          <div className="range-slider">
            <div className="absolute left-0 top-[15px] h-1.5 w-full rounded-[8px] bg-[#535353]" />
            <div
              className="absolute top-[15px] h-1.5 rounded-[8px] bg-[#1DB954]"
              style={{ left: `${startPercent}%`, width: `${Math.max(endPercent - startPercent, 0)}%` }}
            />
            <input
              type="range"
              min={0}
              max={maxIndex}
              value={startIndex}
              disabled={disabled}
              onChange={(event) => updateStart(Number(event.target.value))}
              aria-label="開始日期"
            />
            <input
              type="range"
              min={0}
              max={maxIndex}
              value={endIndex}
              disabled={disabled}
              onChange={(event) => updateEnd(Number(event.target.value))}
              aria-label="結束日期"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function findPeriodIndex(periods: string[], value: string, fallback: number): number {
  if (periods.length === 0) return 0;
  const exact = periods.indexOf(value);
  if (exact >= 0) return exact;
  const next = periods.findIndex((period) => period >= value);
  if (next >= 0) return next;
  return Math.min(Math.max(fallback, 0), periods.length - 1);
}
