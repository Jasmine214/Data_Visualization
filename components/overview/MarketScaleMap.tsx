"use client";

import { useMemo, useState } from "react";
import { CardSection } from "@/components/shared/CardSection";
import { EmptyState } from "@/components/shared/EmptyState";
import type { RegionAggregate, RegionCoordinate } from "@/types/spotify";
import { formatFullNumber, formatStreams } from "@/utils/format";

interface MarketScaleMapProps {
  regions: RegionAggregate[];
  coordinates: Record<string, RegionCoordinate>;
  selectedRegion: string | null;
  unmappedRegions: string[];
  onRegionSelect: (region: string) => void;
  onClearRegion: () => void;
}

interface MapTooltip {
  x: number;
  y: number;
  align: "left" | "right";
  region: RegionAggregate;
}

const width = 744;
const height = 371;

export function MarketScaleMap({
  regions,
  coordinates,
  selectedRegion,
  unmappedRegions,
  onRegionSelect,
  onClearRegion
}: MarketScaleMapProps) {
  const [tooltip, setTooltip] = useState<MapTooltip | null>(null);
  const maxStreams = Math.max(...regions.map((region) => region.streams), 1);

  const points = useMemo(
    () =>
      regions
        .map((region) => {
          const coordinate = coordinates[region.region];
          if (!coordinate) return null;
          const projected = project(coordinate.lat, coordinate.lon);
          const radius = 5 + Math.sqrt(region.streams / maxStreams) * 30;
          return {
            ...region,
            ...projected,
            radius
          };
        })
        .filter((point): point is RegionAggregate & { x: number; y: number; radius: number } => Boolean(point)),
    [coordinates, maxStreams, regions]
  );

  return (
    <CardSection
      title="市場規模"
      subtitle="泡泡大小代表各市場總串流量"
      tone="green"
      className="flex min-h-0 flex-col overflow-visible"
      action={
        selectedRegion ? (
          <button
            type="button"
            onClick={onClearRegion}
            className="rounded-[8px] border border-[#1DB954]/40 bg-[#121212] px-3 py-2 text-xs font-bold text-white"
          >
            清除市場
          </button>
        ) : null
      }
    >
      {regions.length === 0 ? (
        <EmptyState title="沒有市場資料" message="請放寬日期範圍後再試一次。" />
      ) : (
        <div className="relative min-h-0 flex-1 overflow-visible rounded-[8px] border border-[#2a2a2a] bg-[#121212] p-2">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="block h-full min-h-[210px] w-full rounded-[6px]"
            role="img"
            aria-label="市場規模地圖"
          >
            <rect width={width} height={height} fill="#121212" />
            <image href="/img/WorldMap.svg" x="0" y="0" width={width} height={height} preserveAspectRatio="none" opacity={0.82} />
            {points.map((point) => {
              const selected = selectedRegion === point.region;
              const inactive = selectedRegion && !selected;
              const intensity = Math.sqrt(point.streams / maxStreams);
              return (
                <g
                  key={point.region}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer outline-none"
                  onClick={() => onRegionSelect(point.region)}
                  onMouseMove={(event) => {
                    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    const localX = event.clientX - (bounds?.left ?? 0);
                    const localY = event.clientY - (bounds?.top ?? 0);
                    setTooltip({
                      x: localX,
                      y: Math.max(12, localY),
                      align: bounds && localX > bounds.width - 170 ? "left" : "right",
                      region: point
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={point.radius}
                    fill={getMarketColor(intensity)}
                    stroke={selected ? "#F2E625" : "rgba(18, 18, 18, 0.45)"}
                    strokeWidth={selected ? 3 : 1}
                    opacity={inactive ? 0.32 : 1}
                  />
                </g>
              );
            })}
          </svg>

          {tooltip ? (
            <div
              className="pointer-events-none absolute rounded-[8px] border border-[#2a2a2a] bg-[#181818] px-4 py-3 shadow-panel"
              style={{
                left: tooltip.x,
                top: tooltip.y,
                transform: tooltip.align === "left" ? "translate(-100%, 10px)" : "translate(12px, 10px)"
              }}
            >
              <p className="text-sm font-black capitalize text-white">{tooltip.region.region}</p>
              <p className="mt-1 text-xs font-bold text-[#1DB954]">
                {formatFullNumber(tooltip.region.streams)} 次串流
              </p>
            </div>
          ) : null}

          {unmappedRegions.length > 0 ? (
            <div className="border-t border-[#2a2a2a] px-4 py-3 text-xs leading-5 text-[#b3b3b3]">
              {unmappedRegions.length} 個地區尚未建立座標，可在{" "}
              <span className="font-bold text-white">data/regionCoordinates.json</span> 補上。
            </div>
          ) : null}
        </div>
      )}
    </CardSection>
  );
}

function project(lat: number, lon: number) {
  return {
    x: ((lon + 180) / 360) * width,
    y: ((90 - lat) / 180) * height
  };
}

function getMarketColor(value: number): string {
  if (value > 0.78) return "rgba(29, 185, 84, 0.86)";
  if (value > 0.55) return "rgba(242, 230, 37, 0.78)";
  if (value > 0.34) return "rgba(78, 163, 241, 0.68)";
  return "rgba(238, 90, 156, 0.46)";
}
