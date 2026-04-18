"use client";

import { useMemo, useState } from "react";
import { CardSection } from "@/components/shared/CardSection";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ArtistAggregate } from "@/types/spotify";
import { formatFullNumber, formatStreams, truncateLabel } from "@/utils/format";

interface TopArtistBubbleChartProps {
  artists: ArtistAggregate[];
  selectedArtist: string | null;
  onArtistSelect: (artist: string) => void;
  onClearArtist: () => void;
}

interface BubbleTooltip {
  x: number;
  y: number;
  artist: ArtistAggregate;
}

const bubblePositions = [
  { x: 78, y: 132 },
  { x: 196, y: 88 },
  { x: 318, y: 142 },
  { x: 446, y: 90 },
  { x: 562, y: 136 },
  { x: 146, y: 218 },
  { x: 278, y: 228 },
  { x: 410, y: 212 },
  { x: 526, y: 224 },
  { x: 570, y: 74 }
];

export function TopArtistBubbleChart({
  artists,
  selectedArtist,
  onArtistSelect,
  onClearArtist
}: TopArtistBubbleChartProps) {
  const [tooltip, setTooltip] = useState<BubbleTooltip | null>(null);
  const maxStreams = Math.max(...artists.map((artist) => artist.streams), 1);
  const minStreams = artists.length > 0 ? Math.min(...artists.map((artist) => artist.streams)) : 0;

  const bubbles = useMemo(
    () =>
      artists.slice(0, 10).map((artist, index) => {
        const position = bubblePositions[index] ?? bubblePositions[bubblePositions.length - 1];
        const ratio = Math.sqrt(artist.streams / maxStreams);
        const radius = 22 + Math.pow(ratio, 1.2) * 48;
        return {
          ...artist,
          x: position.x,
          y: position.y,
          radius,
          ratio
        };
      }),
    [artists, maxStreams]
  );

  return (
    <CardSection
      title="熱門歌手"
      tone="green"
      className="flex min-h-0 flex-col"
      action={
        selectedArtist ? (
          <button
            type="button"
            onClick={onClearArtist}
            className="rounded-[8px] border border-[#1DB954]/40 bg-[#121212] px-3 py-2 text-xs font-bold text-white"
          >
            清除歌手
          </button>
        ) : null
      }
    >
      {bubbles.length === 0 ? (
        <EmptyState title="沒有歌手資料" message="請放寬日期範圍後再試一次。" />
      ) : (
        <div className="relative min-h-0 flex-1">
          <svg viewBox="0 0 640 300" className="h-full w-full overflow-visible" role="img" aria-label="熱門歌手泡泡圖">
            {bubbles.map((bubble) => {
              const selected = selectedArtist === bubble.artist;
              const inactive = selectedArtist && !selected;
              const normalized = (bubble.streams - minStreams) / Math.max(maxStreams - minStreams, 1);
              const fill = getBubbleColor(normalized);
              const textLines = splitArtistName(bubble.artist, bubble.radius);
              const fontSize = bubble.radius > 48 ? 12 : bubble.radius > 32 ? 10 : 8;

              return (
                <g
                  key={bubble.artist}
                  role="button"
                  tabIndex={0}
                  onClick={() => onArtistSelect(bubble.artist)}
                  onMouseMove={(event) => {
                    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    setTooltip({
                      x: event.clientX - (bounds?.left ?? 0) + 12,
                      y: event.clientY - (bounds?.top ?? 0) + 12,
                      artist: bubble
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  className="cursor-pointer outline-none"
                >
                  <circle
                    cx={bubble.x}
                    cy={bubble.y}
                    r={bubble.radius}
                    fill={selected ? "#1DB954" : fill}
                    opacity={inactive ? 0.36 : 1}
                    stroke="transparent"
                    strokeWidth={0}
                  />
                  <text
                    x={bubble.x}
                    y={bubble.y - (textLines.length - 1) * (fontSize * 0.55)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={selected ? "#121212" : "#FFFFFF"}
                    fontSize={fontSize}
                    fontWeight={800}
                    pointerEvents="none"
                  >
                    {textLines.map((line, index) => (
                      <tspan key={`${line}-${index}`} x={bubble.x} dy={index === 0 ? 0 : fontSize + 2}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                  {bubble.radius > 48 ? (
                    <text
                      x={bubble.x}
                      y={bubble.y + textLines.length * (fontSize + 2) * 0.5 + 12}
                      textAnchor="middle"
                      fill={selected ? "#121212" : "#b3b3b3"}
                      fontSize={10}
                      fontWeight={700}
                      pointerEvents="none"
                    >
                      {formatStreams(bubble.streams)}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>

          {tooltip ? (
            <div
              className="pointer-events-none absolute rounded-[8px] border border-[#2a2a2a] bg-[#181818] px-4 py-3 shadow-panel"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              <p className="text-sm font-black text-white">{tooltip.artist.artist}</p>
              <p className="mt-1 text-xs font-bold text-[#1DB954]">
                {formatFullNumber(tooltip.artist.streams)} 次串流
              </p>
            </div>
          ) : null}
        </div>
      )}
    </CardSection>
  );
}

function splitArtistName(artist: string, radius: number): string[] {
  const maxLength = radius > 48 ? 18 : radius > 34 ? 14 : 9;
  const truncated = truncateLabel(artist, maxLength);
  const parts = truncated.split(" ");
  if (parts.length <= 2 || radius < 34) return [truncated];
  const midpoint = Math.ceil(parts.length / 2);
  return [parts.slice(0, midpoint).join(" "), parts.slice(midpoint).join(" ")];
}

function getBubbleColor(value: number): string {
  const ratio = Math.max(0, Math.min(1, value));
  const start = { r: 83, g: 83, b: 83 };
  const end = { r: 29, g: 185, b: 84 };
  const r = Math.round(start.r + (end.r - start.r) * ratio);
  const g = Math.round(start.g + (end.g - start.g) * ratio);
  const b = Math.round(start.b + (end.b - start.b) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}
