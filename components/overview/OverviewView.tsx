"use client";

import { MarketScaleMap } from "./MarketScaleMap";
import { OverviewSummaryCards, type OverviewSummary } from "./OverviewSummaryCards";
import { TopArtistBubbleChart } from "./TopArtistBubbleChart";
import { TopSongsChart } from "./TopSongsChart";
import type { ArtistAggregate, RegionAggregate, RegionCoordinate, SongAggregate } from "@/types/spotify";

interface OverviewViewProps {
  summary: OverviewSummary;
  topSongs: SongAggregate[];
  topArtists: ArtistAggregate[];
  marketRegions: RegionAggregate[];
  coordinates: Record<string, RegionCoordinate>;
  unmappedRegions: string[];
  selectedArtist: string | null;
  selectedRegion: string | null;
  onSongSelect: (songKey: string) => void;
  onArtistSelect: (artist: string) => void;
  onRegionSelect: (region: string) => void;
  onClearArtist: () => void;
  onClearRegion: () => void;
}

export function OverviewView({
  summary,
  topSongs,
  topArtists,
  marketRegions,
  coordinates,
  unmappedRegions,
  selectedArtist,
  selectedRegion,
  onSongSelect,
  onArtistSelect,
  onRegionSelect,
  onClearArtist,
  onClearRegion
}: OverviewViewProps) {
  return (
    <div className="overview-dashboard grid gap-3 xl:h-[calc(100vh-178px)] xl:min-h-0 xl:grid-rows-[auto_minmax(0,1fr)]">
      <OverviewSummaryCards summary={summary} />
      <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,1.06fr)_minmax(380px,0.94fr)]">
        <TopSongsChart songs={topSongs} onSongSelect={onSongSelect} />
        <div className="grid min-h-0 gap-3 xl:grid-rows-[0.84fr_1.16fr]">
          <TopArtistBubbleChart
            artists={topArtists}
            selectedArtist={selectedArtist}
            onArtistSelect={onArtistSelect}
            onClearArtist={onClearArtist}
          />
          <MarketScaleMap
            regions={marketRegions}
            coordinates={coordinates}
            selectedRegion={selectedRegion}
            unmappedRegions={unmappedRegions}
            onRegionSelect={onRegionSelect}
            onClearRegion={onClearRegion}
          />
        </div>
      </div>
    </div>
  );
}
