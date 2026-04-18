import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { NextResponse } from "next/server";
import type { DashboardSongFact } from "@/types/spotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const csvPath = path.join(process.cwd(), "spotify_clean.csv");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const songKey = searchParams.get("songKey");

  if (!songKey) {
    return NextResponse.json({ error: "Missing songKey" }, { status: 400 });
  }

  if (!fs.existsSync(csvPath)) {
    return NextResponse.json({ error: "spotify_clean.csv was not found" }, { status: 404 });
  }

  const facts = await buildSongFacts(songKey);
  return NextResponse.json({ songKey, facts });
}

async function buildSongFacts(songKey: string): Promise<DashboardSongFact[]> {
  const stream = fs.createReadStream(csvPath, { encoding: "utf8" });
  const reader = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });
  const byWeekRegion = new Map<string, DashboardSongFact>();
  let headers: string[] | null = null;

  for await (const line of reader) {
    if (!headers) {
      headers = parseCsvLine(line).map((header) => header.replace(/^\uFEFF/, ""));
      continue;
    }

    if (!line.trim()) continue;
    const fields = parseCsvLine(line);
    if (fields.length < headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = fields[index] ?? "";
    });

    const parsed = parseValidRow(row);
    if (!parsed || parsed.songKey !== songKey) continue;

    const key = `${parsed.periodStart}\t${parsed.region}`;
    const current = byWeekRegion.get(key);
    if (current) {
      current.streams += parsed.streams;
    } else {
      byWeekRegion.set(key, parsed);
    }
  }

  return [...byWeekRegion.values()]
    .map((fact) => ({ ...fact, streams: Math.round(fact.streams) }))
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart) || b.streams - a.streams);
}

function parseValidRow(row: Record<string, string>): DashboardSongFact | null {
  if (cleanText(row.chart).toLowerCase() !== "top200") return null;

  const title = cleanText(row.title);
  const artist = cleanText(row.artist);
  const region = cleanText(row.region).toLowerCase();
  const date = cleanText(row.date).slice(0, 10);
  const streams = Number.parseFloat(row.streams);

  if (!title || !artist || !region || !isValidDateString(date) || !Number.isFinite(streams) || streams <= 0) {
    return null;
  }

  return {
    periodStart: getWeekStart(date),
    title,
    artist,
    songKey: `${title} — ${artist}`,
    region,
    streams: Math.round(streams)
  };
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
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

function getWeekStart(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00Z`);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

function cleanText(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}
