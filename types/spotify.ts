export interface SpotifyRow {
  title: string;
  rank: string;
  date: string;
  artist: string;
  url: string;
  region: string;
  chart: string;
  trend: string;
  streams: string;
  year: string;
  month: string;
  week: string;
  first_entry_date: string;
  global_first_date: string;
  spread_delay_days: string;
}

export interface ParsedSpotifyRow {
  title: string;
  rank: number;
  date: Date;
  artist: string;
  url: string;
  region: string;
  chart: string;
  trend: string;
  streams: number;
  year: number;
  month: number;
  week: number;
  firstEntryDate: Date | null;
  globalFirstDate: Date | null;
  spreadDelayDays: number;
  songKey: string;
}

export interface SongOption {
  label: string;
  value: string;
  title: string;
  artist: string;
  detailBucket?: string;
}

export interface SongAggregate {
  songKey: string;
  title: string;
  artist: string;
  streams: number;
}

export interface ArtistAggregate {
  artist: string;
  streams: number;
}

export interface RegionAggregate {
  region: string;
  streams: number;
}

export interface TrendPoint {
  period: string;
  label: string;
  streams: number;
}

export interface RegionCoordinate {
  lat: number;
  lon: number;
}

export interface DashboardSongFact {
  periodStart: string;
  title: string;
  artist: string;
  songKey: string;
  region: string;
  streams: number;
}

export interface DashboardSongGlobalFact {
  periodStart: string;
  title: string;
  artist: string;
  songKey: string;
  streams: number;
}

export interface DashboardArtistFact {
  periodStart: string;
  artist: string;
  region: string;
  streams: number;
}

export interface DashboardArtistGlobalFact {
  periodStart: string;
  artist: string;
  streams: number;
}

export interface DashboardRegionFact {
  periodStart: string;
  region: string;
  streams: number;
}

export type CompactSongDetailFact = [periodStart: string, region: string, streams: number];
export type SongDetailBucket = Record<string, CompactSongDetailFact[]>;

export interface DashboardData {
  generatedAt: string;
  sourceFile: string;
  aggregation: "weekly";
  dateDomain: {
    min: string;
    max: string;
  };
  songOptions: SongOption[];
  totalStreams: number;
  songGlobalFacts: DashboardSongGlobalFact[];
  artistGlobalFacts: DashboardArtistGlobalFact[];
  songFacts: DashboardSongFact[];
  artistFacts: DashboardArtistFact[];
  regionFacts: DashboardRegionFact[];
  regionCoordinates: Record<string, RegionCoordinate>;
  unmappedRegions: string[];
  buildSettings: {
    topSongLimit: number;
    topArtistLimit: number;
    detailBucketCount?: number;
  };
}

export interface FilterState {
  dateRange: {
    start: string;
    end: string;
  };
  selectedSongKey?: string | null;
  selectedArtist?: string | null;
  selectedRegion?: string | null;
}
