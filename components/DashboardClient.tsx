"use client";

import { useEffect, useMemo, useState } from "react";
import { OverviewView } from "./overview/OverviewView";
import { SongDetailView } from "./song/SongDetailView";
import { DashboardLayout } from "./shared/DashboardLayout";
import { DateRangeFilter } from "./shared/DateRangeFilter";
import { FilterChips } from "./shared/FilterChips";
import type { DashboardData, DashboardSongFact, FilterState, SongDetailBucket } from "@/types/spotify";
import {
  aggregateRegions,
  aggregateSongRegions,
  aggregateSongTrend,
  aggregateTopArtists,
  aggregateTopSongs,
  filterArtistGlobalFacts,
  filterRegionFacts,
  filterSongGlobalFacts,
  filterSongFacts,
  getAverageStreams,
  getSongOptionByKey,
  getSongDetailBucket,
  sortSongOptions
} from "@/utils/spotify";
import type { DashboardView } from "./shared/SidebarNav";
import { getPublicAssetPath } from "@/utils/publicAssetPath";

export default function DashboardClient() {
  const [activeView, setActiveView] = useState<DashboardView>("overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<FilterState["dateRange"]>({ start: "", end: "" });
  const [selectedSongKey, setSelectedSongKey] = useState<string | null>(null);
  const [overviewArtist, setOverviewArtist] = useState<string | null>(null);
  const [overviewRegion, setOverviewRegion] = useState<string | null>(null);
  const [songRegion, setSongRegion] = useState<string | null>(null);
  const [songDetailBuckets, setSongDetailBuckets] = useState<Record<string, SongDetailBucket>>({});
  const [songDetailLoadingKey, setSongDetailLoadingKey] = useState<string | null>(null);
  const [songDetailError, setSongDetailError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(getPublicAssetPath("/data/spotify_dashboard_data.json"))
      .then((response) => {
        if (!response.ok) {
          throw new Error("找不到儀表板資料，請先執行 npm run prepare-data。");
        }
        return response.json() as Promise<DashboardData>;
      })
      .then((dashboardData) => {
        if (cancelled) return;
        setData(dashboardData);
        setDateRange({ start: dashboardData.dateDomain.min, end: dashboardData.dateDomain.max });
      })
      .catch((fetchError: Error) => {
        if (!cancelled) setError(fetchError.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const periods = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.regionFacts.map((fact) => fact.periodStart))].sort();
  }, [data]);

  const selectedSong = useMemo(
    () => getSongOptionByKey(data?.songOptions ?? [], selectedSongKey),
    [data?.songOptions, selectedSongKey]
  );

  const songOptions = useMemo(
    () => [...(data?.songOptions ?? [])].sort(sortSongOptions),
    [data?.songOptions]
  );

  const overviewData = useMemo(() => {
    if (!data || !dateRange.start || !dateRange.end) {
      return {
        topSongs: [],
        topArtists: [],
        marketRegions: [],
        summary: {
          totalStreams: 0,
          totalShare: 0,
          biggestMarket: null,
          hottestSong: null,
          hottestArtist: null
        }
      };
    }

    const overviewFilters: FilterState = {
      dateRange,
      selectedSongKey: null,
      selectedArtist: null,
      selectedRegion: null
    };
    const topSongs = aggregateTopSongs(filterSongGlobalFacts(data.songGlobalFacts, overviewFilters), 50);
    const topArtists = aggregateTopArtists(filterArtistGlobalFacts(data.artistGlobalFacts, overviewFilters), 10);
    const currentRegionFacts = filterRegionFacts(data.regionFacts, overviewFilters, { applyRegion: false });
    const marketRegions = aggregateRegions(currentRegionFacts).filter((region) => region.region !== "global");
    const totalStreams = currentRegionFacts.reduce((sum, region) => sum + region.streams, 0);

    return {
      topSongs,
      topArtists,
      marketRegions,
      summary: {
        totalStreams,
        totalShare: data.totalStreams > 0 ? totalStreams / data.totalStreams : 0,
        biggestMarket: marketRegions[0] ?? null,
        hottestSong: topSongs[0] ?? null,
        hottestArtist: topArtists[0] ?? null
      }
    };
  }, [data, dateRange]);

  const selectedSongBucket = useMemo(() => {
    if (!selectedSongKey) return null;
    return selectedSong?.detailBucket ?? getSongDetailBucket(selectedSongKey, data?.buildSettings.detailBucketCount ?? 64);
  }, [data?.buildSettings.detailBucketCount, selectedSong?.detailBucket, selectedSongKey]);

  useEffect(() => {
    if (!data || !selectedSongKey || !selectedSongBucket || songDetailBuckets[selectedSongBucket]) {
      return;
    }

    let cancelled = false;
    setSongDetailError(null);
    setSongDetailLoadingKey(selectedSongBucket);

    fetch(getPublicAssetPath(`/data/song-details/${selectedSongBucket}`))
      .then((response) => {
        if (!response.ok) throw new Error("無法載入這首歌的分桶資料。");
        return response.json() as Promise<SongDetailBucket>;
      })
      .then((bucket) => {
        if (cancelled) return;
        setSongDetailBuckets((current) => ({
          ...current,
          [selectedSongBucket]: bucket
        }));
      })
      .catch((fetchError: Error) => {
        if (!cancelled) setSongDetailError(fetchError.message);
      })
      .finally(() => {
        if (!cancelled) setSongDetailLoadingKey(null);
      });

    return () => {
      cancelled = true;
    };
  }, [data, selectedSongBucket, selectedSongKey, songDetailBuckets]);

  const songDetailData = useMemo(() => {
    if (!data || !selectedSongKey || !dateRange.start || !dateRange.end) {
      return { songRegions: [], trendPoints: [], averageStreams: 0 };
    }

    const songOnlyFilters: FilterState = {
      dateRange,
      selectedSongKey,
      selectedArtist: null,
      selectedRegion: null
    };
    const trendFilters: FilterState = {
      dateRange,
      selectedSongKey,
      selectedArtist: null,
      selectedRegion: songRegion
    };

    const compactFacts = selectedSongBucket ? songDetailBuckets[selectedSongBucket]?.[selectedSongKey] : undefined;
    const songFacts: DashboardSongFact[] =
      compactFacts?.map(([periodStart, region, streams]) => ({
        periodStart,
        title: selectedSong?.title ?? selectedSongKey.split(" — ")[0] ?? selectedSongKey,
        artist: selectedSong?.artist ?? selectedSongKey.split(" — ")[1] ?? "",
        songKey: selectedSongKey,
        region,
        streams
      })) ?? [];
    const regionFacts = filterSongFacts(songFacts, songOnlyFilters, { applyArtist: false, applyRegion: false });
    const trendFacts = filterSongFacts(songFacts, trendFilters, { applyArtist: false, applyRegion: true });
    const trendPoints = aggregateSongTrend(trendFacts);

    return {
      songRegions: aggregateSongRegions(regionFacts, 14).filter((region) => region.region !== "global").slice(0, 10),
      trendPoints,
      averageStreams: getAverageStreams(trendPoints)
    };
  }, [data, dateRange, selectedSong, selectedSongBucket, selectedSongKey, songDetailBuckets, songRegion]);

  function handleSongSelect(songKey: string | null) {
    setSelectedSongKey(songKey);
    setSongDetailError(null);
  }

  function handleArtistSelect(artist: string) {
    setOverviewArtist((current) => (current === artist ? null : artist));
  }

  function handleOverviewSongSelect(songKey: string) {
    setSelectedSongKey(songKey);
    setActiveView("song");
  }

  function handleOverviewRegionSelect(region: string) {
    setOverviewRegion((current) => (current === region ? null : region));
  }

  function handleSongRegionSelect(region: string) {
    setSongRegion((current) => (current === region ? null : region));
  }

  if (error) {
    return (
      <DashboardLayout activeView={activeView} onViewChange={setActiveView}>
        <div className="rounded-[8px] border border-[#ff4d4d]/50 bg-[#181818] p-6 shadow-panel">
          <h1 className="text-xl font-black text-[#ff4d4d]">資料尚未準備完成</h1>
          <p className="mt-2 text-sm leading-6 text-[#b3b3b3]">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout activeView={activeView} onViewChange={setActiveView}>
        <div className="rounded-[8px] border border-[#2a2a2a] bg-[#181818] p-6 shadow-panel">
          <p className="text-sm font-bold text-[#b3b3b3]">正在載入 Spotify 儀表板資料...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeView={activeView} onViewChange={setActiveView}>
      <DateRangeFilter periods={periods} dateRange={dateRange} onDateRangeChange={setDateRange} />
      <FilterChips
        song={activeView === "song" ? selectedSong : null}
        artist={activeView === "overview" ? overviewArtist : null}
        region={activeView === "overview" ? overviewRegion : songRegion}
        onClearSong={() => setSelectedSongKey(null)}
        onClearArtist={() => setOverviewArtist(null)}
        onClearRegion={() => (activeView === "overview" ? setOverviewRegion(null) : setSongRegion(null))}
        onClearAll={() => {
          if (activeView === "overview") {
            setOverviewArtist(null);
            setOverviewRegion(null);
          } else {
            setSelectedSongKey(null);
            setSongRegion(null);
          }
        }}
      />

      {activeView === "overview" ? (
        <OverviewView
          summary={overviewData.summary}
          topSongs={overviewData.topSongs}
          topArtists={overviewData.topArtists}
          marketRegions={overviewData.marketRegions}
          coordinates={data.regionCoordinates}
          unmappedRegions={data.unmappedRegions}
          selectedArtist={overviewArtist}
          selectedRegion={overviewRegion}
          onSongSelect={handleOverviewSongSelect}
          onArtistSelect={handleArtistSelect}
          onRegionSelect={handleOverviewRegionSelect}
          onClearArtist={() => setOverviewArtist(null)}
          onClearRegion={() => setOverviewRegion(null)}
        />
      ) : (
        <SongDetailView
          songOptions={songOptions}
          selectedSongKey={selectedSongKey}
          selectedRegion={songRegion}
          songRegions={songDetailData.songRegions}
          trendPoints={songDetailData.trendPoints}
          averageStreams={songDetailData.averageStreams}
          isLoading={Boolean(selectedSongBucket && songDetailLoadingKey === selectedSongBucket)}
          error={songDetailError}
          onSongChange={handleSongSelect}
          onRegionSelect={handleSongRegionSelect}
          onClearRegion={() => setSongRegion(null)}
        />
      )}
    </DashboardLayout>
  );
}
