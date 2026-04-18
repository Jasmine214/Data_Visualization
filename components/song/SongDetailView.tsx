"use client";

import { RegionStreamTreemap } from "./RegionStreamTreemap";
import { SongFilterSelect } from "./SongFilterSelect";
import { SongTrendAreaChart } from "./SongTrendAreaChart";
import type { RegionAggregate, SongOption, TrendPoint } from "@/types/spotify";

interface SongDetailViewProps {
  songOptions: SongOption[];
  selectedSongKey: string | null;
  selectedRegion: string | null;
  songRegions: RegionAggregate[];
  trendPoints: TrendPoint[];
  averageStreams: number;
  isLoading: boolean;
  error: string | null;
  onSongChange: (songKey: string | null) => void;
  onRegionSelect: (region: string) => void;
  onClearRegion: () => void;
}

export function SongDetailView({
  songOptions,
  selectedSongKey,
  selectedRegion,
  songRegions,
  trendPoints,
  averageStreams,
  isLoading,
  error,
  onSongChange,
  onRegionSelect,
  onClearRegion
}: SongDetailViewProps) {
  return (
    <div>
      <SongFilterSelect options={songOptions} selectedSongKey={selectedSongKey} onSongChange={onSongChange} />
      {isLoading ? (
        <div className="mb-4 rounded-[8px] border border-[#4EA3F1]/40 bg-[#4EA3F1]/10 px-4 py-3 text-sm font-bold text-[#9BE7FF]">
          正在載入這首歌的完整地區資料...
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-[8px] border border-[#FF3B30]/50 bg-[#FF3B30]/10 px-4 py-3 text-sm font-bold text-[#FFB4AE]">
          {error}
        </div>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.88fr)_minmax(0,1.12fr)]">
        <RegionStreamTreemap
          regions={songRegions}
          selectedRegion={selectedRegion}
          onRegionSelect={onRegionSelect}
          onClearRegion={onClearRegion}
        />
        <SongTrendAreaChart
          points={trendPoints}
          averageStreams={averageStreams}
          selectedRegion={selectedRegion}
        />
      </div>
    </div>
  );
}
