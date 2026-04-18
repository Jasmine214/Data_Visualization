import type { ArtistAggregate, RegionAggregate, SongAggregate } from "@/types/spotify";
import { formatStreams } from "@/utils/format";

export interface OverviewSummary {
  totalStreams: number;
  totalShare: number;
  biggestMarket: RegionAggregate | null;
  hottestSong: SongAggregate | null;
  hottestArtist: ArtistAggregate | null;
}

interface OverviewSummaryCardsProps {
  summary: OverviewSummary;
}

export function OverviewSummaryCards({ summary }: OverviewSummaryCardsProps) {
  const heat = getHeat(summary.totalShare);

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="總串流量"
        value={formatStreams(summary.totalStreams)}
        detail={`佔 2017-2021 總串流量 ${Math.round(summary.totalShare * 100)}%`}
        valueClassName={heat.valueClassName}
      />
      <SummaryCard
        label="最大市場"
        value={summary.biggestMarket?.region ?? "無資料"}
        detail={summary.biggestMarket ? `串流量${formatStreams(summary.biggestMarket.streams)}` : "調整日期範圍"}
        accent="#4EA3F1"
      />
      <SummaryCard
        label="最熱門歌曲"
        value={summary.hottestSong?.title ?? "無資料"}
        detail={summary.hottestSong?.artist ?? "調整日期範圍"}
        accent="#F2E625"
      />
      <SummaryCard
        label="最佳歌手"
        value={summary.hottestArtist?.artist ?? "無資料"}
        detail={summary.hottestArtist ? `串流量${formatStreams(summary.hottestArtist.streams)}` : "調整日期範圍"}
        accent="#EE5A9C"
      />
    </section>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  accent = "#1DB954",
  valueClassName = "text-white"
}: {
  label: string;
  value: string;
  detail: string;
  accent?: string;
  valueClassName?: string;
}) {
  return (
    <article className="min-w-0 rounded-[8px] border border-[#2a2a2a] bg-[#181818] p-3 shadow-panel">
      <div className="mb-2 h-1.5 w-12 rounded-[8px]" style={{ backgroundColor: accent }} />
      <p className="text-xs font-black text-[#b3b3b3]">{label}</p>
      <p className={`mt-1 truncate text-xl font-black leading-tight xl:text-2xl ${valueClassName}`} title={value}>
        {value}
      </p>
      <p className="mt-1 truncate text-xs font-bold text-[#b3b3b3]" title={detail}>
        {detail}
      </p>
    </article>
  );
}

function getHeat(share: number) {
  if (share >= 0.6) return { valueClassName: "text-[#1DB954]" };
  if (share >= 0.25) return { valueClassName: "text-[#F2E625]" };
  return { valueClassName: "text-[#EE5A9C]" };
}
