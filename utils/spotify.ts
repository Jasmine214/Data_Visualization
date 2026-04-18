import type {
  ArtistAggregate,
  DashboardArtistGlobalFact,
  DashboardArtistFact,
  DashboardRegionFact,
  DashboardSongGlobalFact,
  DashboardSongFact,
  FilterState,
  ParsedSpotifyRow,
  RegionAggregate,
  SongAggregate,
  SongOption,
  SpotifyRow,
  TrendPoint
} from "@/types/spotify";
import { formatShortDateLabel } from "./format";

export function buildSongKey(title: string, artist: string): string {
  return `${title.trim()} — ${artist.trim()}`;
}

export function parseSpotifyData(rows: SpotifyRow[]): ParsedSpotifyRow[] {
  return rows
    .map((row) => {
      const title = cleanText(row.title);
      const artist = cleanText(row.artist);
      const region = cleanText(row.region).toLowerCase();
      const streams = toNumber(row.streams);
      const date = toDate(row.date);

      if (!title || !artist || !region || !date || !Number.isFinite(streams) || streams <= 0) {
        return null;
      }

      return {
        title,
        rank: toNumber(row.rank),
        date,
        artist,
        url: cleanText(row.url),
        region,
        chart: cleanText(row.chart),
        trend: cleanText(row.trend),
        streams,
        year: toNumber(row.year),
        month: toNumber(row.month),
        week: toNumber(row.week),
        firstEntryDate: toDate(row.first_entry_date),
        globalFirstDate: toDate(row.global_first_date),
        spreadDelayDays: toNumber(row.spread_delay_days),
        songKey: buildSongKey(title, artist)
      };
    })
    .filter((row): row is ParsedSpotifyRow => Boolean(row));
}

export function filterData(
  rows: ParsedSpotifyRow[],
  filters: FilterState,
  options: { chartType?: string; applySong?: boolean; applyArtist?: boolean; applyRegion?: boolean } = {}
): ParsedSpotifyRow[] {
  const chartType = options.chartType ?? "top200";
  const applySong = options.applySong ?? true;
  const applyArtist = options.applyArtist ?? true;
  const applyRegion = options.applyRegion ?? true;

  return rows.filter((row) => {
    if (chartType && row.chart !== chartType) return false;
    if (!isDateWithin(row.date.toISOString().slice(0, 10), filters.dateRange)) return false;
    if (applySong && filters.selectedSongKey && row.songKey !== filters.selectedSongKey) return false;
    if (applyArtist && filters.selectedArtist && row.artist !== filters.selectedArtist) return false;
    if (applyRegion && filters.selectedRegion && row.region !== filters.selectedRegion) return false;
    return true;
  });
}

export function filterSongFacts(
  facts: DashboardSongFact[],
  filters: FilterState,
  options: { applySong?: boolean; applyArtist?: boolean; applyRegion?: boolean } = {}
): DashboardSongFact[] {
  const applySong = options.applySong ?? true;
  const applyArtist = options.applyArtist ?? true;
  const applyRegion = options.applyRegion ?? true;

  return facts.filter((fact) => {
    if (!isDateWithin(fact.periodStart, filters.dateRange)) return false;
    if (applySong && filters.selectedSongKey && fact.songKey !== filters.selectedSongKey) return false;
    if (applyArtist && filters.selectedArtist && fact.artist !== filters.selectedArtist) return false;
    if (applyRegion && filters.selectedRegion && fact.region !== filters.selectedRegion) return false;
    return true;
  });
}

export function filterSongGlobalFacts(
  facts: DashboardSongGlobalFact[],
  filters: FilterState
): DashboardSongGlobalFact[] {
  return facts.filter((fact) => isDateWithin(fact.periodStart, filters.dateRange));
}

export function filterArtistFacts(
  facts: DashboardArtistFact[],
  filters: FilterState,
  options: { applyArtist?: boolean; applyRegion?: boolean } = {}
): DashboardArtistFact[] {
  const applyArtist = options.applyArtist ?? true;
  const applyRegion = options.applyRegion ?? true;

  return facts.filter((fact) => {
    if (!isDateWithin(fact.periodStart, filters.dateRange)) return false;
    if (applyArtist && filters.selectedArtist && fact.artist !== filters.selectedArtist) return false;
    if (applyRegion && filters.selectedRegion && fact.region !== filters.selectedRegion) return false;
    return true;
  });
}

export function filterArtistGlobalFacts(
  facts: DashboardArtistGlobalFact[],
  filters: FilterState
): DashboardArtistGlobalFact[] {
  return facts.filter((fact) => isDateWithin(fact.periodStart, filters.dateRange));
}

export function filterRegionFacts(
  facts: DashboardRegionFact[],
  filters: FilterState,
  options: { applyRegion?: boolean } = {}
): DashboardRegionFact[] {
  const applyRegion = options.applyRegion ?? true;

  return facts.filter((fact) => {
    if (!isDateWithin(fact.periodStart, filters.dateRange)) return false;
    if (applyRegion && filters.selectedRegion && fact.region !== filters.selectedRegion) return false;
    return true;
  });
}

export function buildSongOptions(rows: ParsedSpotifyRow[] | DashboardSongFact[]): SongOption[] {
  const options = new Map<string, SongOption>();

  rows.forEach((row) => {
    if (!options.has(row.songKey)) {
      options.set(row.songKey, {
        label: buildSongKey(row.title, row.artist),
        value: row.songKey,
        title: row.title,
        artist: row.artist,
        detailBucket: getSongDetailBucket(row.songKey)
      });
    }
  });

  return [...options.values()].sort(sortSongOptions);
}

export function aggregateTopSongs(rows: (DashboardSongFact | DashboardSongGlobalFact)[], limit = 20): SongAggregate[] {
  const bySong = new Map<string, SongAggregate>();

  rows.forEach((row) => {
    const current = bySong.get(row.songKey);
    if (current) {
      current.streams += row.streams;
    } else {
      bySong.set(row.songKey, {
        songKey: row.songKey,
        title: row.title,
        artist: row.artist,
        streams: row.streams
      });
    }
  });

  return [...bySong.values()].sort((a, b) => b.streams - a.streams).slice(0, limit);
}

export function aggregateTopArtists(
  rows: (DashboardArtistFact | DashboardArtistGlobalFact | DashboardSongFact | DashboardSongGlobalFact)[],
  limit = 12
): ArtistAggregate[] {
  const byArtist = new Map<string, ArtistAggregate>();

  rows.forEach((row) => {
    const current = byArtist.get(row.artist);
    if (current) {
      current.streams += row.streams;
    } else {
      byArtist.set(row.artist, {
        artist: row.artist,
        streams: row.streams
      });
    }
  });

  return [...byArtist.values()].sort((a, b) => b.streams - a.streams).slice(0, limit);
}

export function aggregateRegions(
  rows: (DashboardRegionFact | DashboardSongFact | DashboardArtistFact)[],
  limit?: number
): RegionAggregate[] {
  const byRegion = new Map<string, RegionAggregate>();

  rows.forEach((row) => {
    const current = byRegion.get(row.region);
    if (current) {
      current.streams += row.streams;
    } else {
      byRegion.set(row.region, {
        region: row.region,
        streams: row.streams
      });
    }
  });

  const sorted = [...byRegion.values()].sort((a, b) => b.streams - a.streams);
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function aggregateSongRegions(rows: DashboardSongFact[], limit = 40): RegionAggregate[] {
  return aggregateRegions(rows, limit);
}

export function aggregateSongTrend(rows: DashboardSongFact[]): TrendPoint[] {
  const byWeek = new Map<string, number>();

  // Weekly aggregation keeps the 2017-2021 CSV responsive in the browser while
  // preserving enough movement for the Song Detail trend chart.
  rows.forEach((row) => {
    byWeek.set(row.periodStart, (byWeek.get(row.periodStart) ?? 0) + row.streams);
  });

  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, streams]) => ({
      period,
      label: formatShortDateLabel(period),
      streams
    }));
}

export function getAverageStreams(points: TrendPoint[]): number {
  if (points.length === 0) return 0;
  return points.reduce((sum, point) => sum + point.streams, 0) / points.length;
}

export function getSongOptionByKey(options: SongOption[], songKey: string | null | undefined): SongOption | null {
  if (!songKey) return null;
  return options.find((option) => option.value === songKey) ?? null;
}

export function sortSongOptions(a: SongOption, b: SongOption): number {
  return songOptionCollator.compare(a.label, b.label);
}

export function getSongDetailBucket(songKey: string, bucketCount = 64): string {
  let hash = 5381;
  for (let index = 0; index < songKey.length; index += 1) {
    hash = (hash * 33) ^ songKey.charCodeAt(index);
  }
  const bucket = Math.abs(hash >>> 0) % bucketCount;
  return `bucket-${String(bucket).padStart(2, "0")}.json`;
}

export function getAvailablePeriods(dateMin: string, dateMax: string): string[] {
  const periods: string[] = [];
  const cursor = new Date(`${dateMin}T00:00:00Z`);
  const end = new Date(`${dateMax}T00:00:00Z`);

  if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime())) return periods;

  while (cursor <= end) {
    periods.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  if (periods[periods.length - 1] !== dateMax) periods.push(dateMax);
  return periods;
}

export function isDateWithin(value: string, range: FilterState["dateRange"]): boolean {
  return value >= range.start && value <= range.end;
}

function cleanText(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

function toNumber(value: string | number | null | undefined): number {
  const numberValue = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isFinite(numberValue) ? numberValue : Number.NaN;
}

function toDate(value: string | null | undefined): Date | null {
  const cleanValue = cleanText(value);
  if (!cleanValue) return null;
  const date = new Date(`${cleanValue}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const songOptionCollator = new Intl.Collator("zh-Hant-u-co-stroke", {
  numeric: true,
  sensitivity: "base"
});
