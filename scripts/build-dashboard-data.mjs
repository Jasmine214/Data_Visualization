import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const CSV_PATH = process.env.SPOTIFY_CSV_PATH
  ? path.resolve(process.env.SPOTIFY_CSV_PATH)
  : path.join(root, "spotify_clean.csv");
const OUTPUT_PATH = process.env.SPOTIFY_DASHBOARD_OUTPUT
  ? path.resolve(process.env.SPOTIFY_DASHBOARD_OUTPUT)
  : path.join(root, "public", "data", "spotify_dashboard_data.json");
const COORDINATES_PATH = path.join(root, "data", "regionCoordinates.json");
const SONG_DETAILS_DIR = path.join(root, "public", "data", "song-details");

const TOP_SONG_LIMIT = toPositiveInteger(process.env.DASHBOARD_TOP_SONG_LIMIT, 450);
const TOP_ARTIST_LIMIT = toPositiveInteger(process.env.DASHBOARD_TOP_ARTIST_LIMIT, 60);
const DETAIL_BUCKET_COUNT = toPositiveInteger(process.env.DASHBOARD_DETAIL_BUCKET_COUNT, 64);

const regionCoordinates = JSON.parse(fs.readFileSync(COORDINATES_PATH, "utf8"));

console.log(`Reading ${CSV_PATH}`);
console.log(`Building full overview facts and ${DETAIL_BUCKET_COUNT} song-detail buckets.`);

const firstPass = await scanTotals();

console.log("First pass complete.");
console.log(`Valid top200 rows: ${firstPass.validRows.toLocaleString("en-US")}`);
console.log(`Unique songs: ${firstPass.songTotals.size.toLocaleString("en-US")}`);
console.log(`Unique artists: ${firstPass.artistTotals.size.toLocaleString("en-US")}`);

const dashboard = await buildDashboardFacts(firstPass.songTotals);
const unmappedRegions = [...firstPass.regionTotals.keys()]
  .filter((region) => !regionCoordinates[region])
  .sort((a, b) => (firstPass.regionTotals.get(b)?.streams ?? 0) - (firstPass.regionTotals.get(a)?.streams ?? 0));

const output = {
  generatedAt: new Date().toISOString(),
  sourceFile: path.basename(CSV_PATH),
  aggregation: "weekly",
  dateDomain: {
    min: firstPass.minPeriod,
    max: firstPass.maxPeriod
  },
  songOptions: dashboard.songOptions,
  totalStreams: Math.round(firstPass.totalStreams),
  songGlobalFacts: dashboard.songGlobalFacts,
  artistGlobalFacts: dashboard.artistGlobalFacts,
  songFacts: [],
  artistFacts: [],
  regionFacts: dashboard.regionFacts,
  regionCoordinates,
  unmappedRegions,
  buildSettings: {
    topSongLimit: TOP_SONG_LIMIT,
    topArtistLimit: TOP_ARTIST_LIMIT,
    detailBucketCount: DETAIL_BUCKET_COUNT
  }
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output));
writeSongDetailBuckets(dashboard.songDetailBuckets);

const sizeMb = fs.statSync(OUTPUT_PATH).size / 1024 / 1024;
console.log(`Wrote ${OUTPUT_PATH}`);
console.log(`JSON size: ${sizeMb.toFixed(1)} MB`);
console.log(`Song options: ${dashboard.songOptions.length.toLocaleString("en-US")}`);
console.log(`Song global facts: ${dashboard.songGlobalFacts.length.toLocaleString("en-US")}`);
console.log(`Artist global facts: ${dashboard.artistGlobalFacts.length.toLocaleString("en-US")}`);
console.log(`Song detail buckets: ${DETAIL_BUCKET_COUNT}`);
console.log(`Region facts: ${dashboard.regionFacts.length.toLocaleString("en-US")}`);
if (unmappedRegions.length > 0) {
  console.log(`Unmapped regions: ${unmappedRegions.slice(0, 12).join(", ")}`);
}

async function scanTotals() {
  const songTotals = new Map();
  const artistTotals = new Map();
  const regionTotals = new Map();
  let validRows = 0;
  let totalStreams = 0;
  let minPeriod = "";
  let maxPeriod = "";

  await streamCsvRows((row) => {
    const parsed = parseValidRow(row);
    if (!parsed) return;

    validRows += 1;
    totalStreams += parsed.streams;
    minPeriod = minPeriod ? minDate(minPeriod, parsed.periodStart) : parsed.periodStart;
    maxPeriod = maxPeriod ? maxDate(maxPeriod, parsed.periodStart) : parsed.periodStart;

    const songCurrent = songTotals.get(parsed.songKey);
    if (songCurrent) {
      songCurrent.streams += parsed.streams;
    } else {
      songTotals.set(parsed.songKey, {
        songKey: parsed.songKey,
        title: parsed.title,
        artist: parsed.artist,
        streams: parsed.streams
      });
    }

    const artistCurrent = artistTotals.get(parsed.artist);
    if (artistCurrent) {
      artistCurrent.streams += parsed.streams;
    } else {
      artistTotals.set(parsed.artist, {
        artist: parsed.artist,
        streams: parsed.streams
      });
    }

    const regionCurrent = regionTotals.get(parsed.region);
    if (regionCurrent) {
      regionCurrent.streams += parsed.streams;
    } else {
      regionTotals.set(parsed.region, {
        region: parsed.region,
        streams: parsed.streams
      });
    }
  }, "totals");

  return {
    songTotals,
    artistTotals,
    regionTotals,
    validRows,
    totalStreams,
    minPeriod,
    maxPeriod
  };
}

async function buildDashboardFacts(songTotals) {
  const songGlobalFacts = new Map();
  const artistGlobalFacts = new Map();
  const regionFacts = new Map();
  const songDetailBuckets = Array.from({ length: DETAIL_BUCKET_COUNT }, () => new Map());

  await streamCsvRows((row) => {
    const parsed = parseValidRow(row);
    if (!parsed) return;

    addSongGlobalFact(songGlobalFacts, parsed);
    addArtistGlobalFact(artistGlobalFacts, parsed);
    addRegionFact(regionFacts, parsed);
    addSongDetailBucketFact(songDetailBuckets, parsed);
  }, "facts");

  const songOptions = buildAllSongOptions(songTotals);

  return {
    songOptions,
    songGlobalFacts: sortFacts([...songGlobalFacts.values()]),
    artistGlobalFacts: sortFacts([...artistGlobalFacts.values()]),
    regionFacts: sortFacts([...regionFacts.values()]),
    songDetailBuckets
  };
}

async function streamCsvRows(onRow, phase) {
  const stream = fs.createReadStream(CSV_PATH, { encoding: "utf8" });
  const reader = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });

  let headers = null;
  let lineNumber = 0;

  for await (const line of reader) {
    lineNumber += 1;

    if (lineNumber === 1) {
      headers = parseCsvLine(line).map((header) => header.replace(/^\uFEFF/, ""));
      continue;
    }

    if (!line.trim() || !headers) continue;

    const fields = parseCsvLine(line);
    if (fields.length < headers.length) continue;

    const row = {};
    headers.forEach((header, index) => {
      row[header] = fields[index] ?? "";
    });

    onRow(row);

    if (lineNumber % 1_000_000 === 0) {
      console.log(`[${phase}] ${lineNumber.toLocaleString("en-US")} lines`);
    }
  }
}

function addSongGlobalFact(map, parsed) {
  const key = `${parsed.periodStart}\t${parsed.songKey}`;
  const current = map.get(key);

  if (current) {
    current.streams += parsed.streams;
  } else {
    map.set(key, {
      periodStart: parsed.periodStart,
      title: parsed.title,
      artist: parsed.artist,
      songKey: parsed.songKey,
      streams: parsed.streams
    });
  }
}

function addArtistGlobalFact(map, parsed) {
  const key = `${parsed.periodStart}\t${parsed.artist}`;
  const current = map.get(key);

  if (current) {
    current.streams += parsed.streams;
  } else {
    map.set(key, {
      periodStart: parsed.periodStart,
      artist: parsed.artist,
      streams: parsed.streams
    });
  }
}

function buildAllSongOptions(songTotals) {
  const collator = new Intl.Collator("zh-Hant-u-co-stroke", {
    numeric: true,
    sensitivity: "base"
  });

  return [...songTotals.values()]
    .map((song) => ({
      label: song.songKey,
      value: song.songKey,
      title: song.title,
      artist: song.artist,
      detailBucket: getSongDetailBucketFile(song.songKey)
    }))
    .sort((a, b) => collator.compare(a.label, b.label));
}

function addSongDetailBucketFact(buckets, parsed) {
  const bucket = getSongDetailBucketNumber(parsed.songKey);
  const bucketMap = buckets[bucket];
  const key = `${parsed.songKey}\t${parsed.periodStart}\t${parsed.region}`;
  const current = bucketMap.get(key);

  if (current) {
    current.streams += parsed.streams;
  } else {
    bucketMap.set(key, {
      songKey: parsed.songKey,
      periodStart: parsed.periodStart,
      region: parsed.region,
      streams: parsed.streams
    });
  }
}

function writeSongDetailBuckets(buckets) {
  fs.mkdirSync(SONG_DETAILS_DIR, { recursive: true });

  buckets.forEach((bucketMap, index) => {
    const bySong = {};
    const facts = [...bucketMap.values()].sort((a, b) => {
      return (
        a.songKey.localeCompare(b.songKey) ||
        a.periodStart.localeCompare(b.periodStart) ||
        a.region.localeCompare(b.region)
      );
    });

    facts.forEach((fact) => {
      if (!bySong[fact.songKey]) bySong[fact.songKey] = [];
      bySong[fact.songKey].push([fact.periodStart, fact.region, Math.round(fact.streams)]);
    });

    fs.writeFileSync(path.join(SONG_DETAILS_DIR, bucketFileName(index)), JSON.stringify(bySong));
  });
}

function addRegionFact(map, parsed) {
  const key = `${parsed.periodStart}\t${parsed.region}`;
  const current = map.get(key);

  if (current) {
    current.streams += parsed.streams;
  } else {
    map.set(key, {
      periodStart: parsed.periodStart,
      region: parsed.region,
      streams: parsed.streams
    });
  }
}

function parseValidRow(row) {
  const chart = cleanText(row.chart).toLowerCase();
  if (chart !== "top200") return null;

  const title = cleanText(row.title);
  const artist = cleanText(row.artist);
  const region = cleanText(row.region).toLowerCase();
  const date = cleanText(row.date).slice(0, 10);
  const streams = Number.parseFloat(row.streams);

  if (!title || !artist || !region || !isValidDateString(date) || !Number.isFinite(streams) || streams <= 0) {
    return null;
  }

  return {
    title,
    artist,
    region,
    date,
    periodStart: getWeekStart(date),
    streams: Math.round(streams),
    songKey: `${title} — ${artist}`
  };
}

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}

function getWeekStart(dateValue) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

function sortFacts(facts) {
  return facts
    .map((fact) => ({
      ...fact,
      streams: Math.round(fact.streams)
    }))
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart) || b.streams - a.streams);
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

function minDate(a, b) {
  return a < b ? a : b;
}

function maxDate(a, b) {
  return a > b ? a : b;
}

function getSongDetailBucketFile(songKey) {
  return bucketFileName(getSongDetailBucketNumber(songKey));
}

function getSongDetailBucketNumber(songKey) {
  let hash = 5381;
  for (let index = 0; index < songKey.length; index += 1) {
    hash = (hash * 33) ^ songKey.charCodeAt(index);
  }
  return Math.abs(hash >>> 0) % DETAIL_BUCKET_COUNT;
}

function bucketFileName(index) {
  return `bucket-${String(index).padStart(2, "0")}.json`;
}

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
