"use client";

import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { CardSection } from "@/components/shared/CardSection";
import { EmptyState } from "@/components/shared/EmptyState";
import type { RegionAggregate } from "@/types/spotify";
import { formatFullNumber, formatStreams, truncateLabel } from "@/utils/format";

interface RegionStreamTreemapProps {
  regions: RegionAggregate[];
  selectedRegion: string | null;
  onRegionSelect: (region: string) => void;
  onClearRegion: () => void;
}

interface TreemapItem {
  name: string;
  region: string;
  size: number;
  streams: number;
  share: number;
}

export function RegionStreamTreemap({
  regions,
  selectedRegion,
  onRegionSelect,
  onClearRegion
}: RegionStreamTreemapProps) {
  const total = regions.reduce((sum, region) => sum + region.streams, 0);
  const maxStreams = Math.max(...regions.map((region) => region.streams), 1);
  const data: TreemapItem[] = regions.map((region) => ({
    name: region.region,
    region: region.region,
    size: region.streams,
    streams: region.streams,
    share: total > 0 ? region.streams / total : 0
  }));

  return (
    <CardSection
      title="地區串流"
      subtitle="顯示所選歌曲在主要地區的串流分布，一張圖最多呈現 10 個地區。"
      tone="purple"
      action={
        selectedRegion ? (
          <button
            type="button"
            onClick={onClearRegion}
            className="rounded-[8px] border border-[#EE5A9C]/40 bg-[#121212] px-3 py-2 text-xs font-bold text-white"
          >
            清除地區
          </button>
        ) : null
      }
    >
      {data.length === 0 ? (
        <EmptyState title="沒有地區資料" message="請選擇歌曲或放寬日期範圍。" />
      ) : (
        <div className="h-[430px] overflow-hidden rounded-[8px] border border-[#2a2a2a] bg-[#121212]">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={data}
              dataKey="size"
              nameKey="name"
              stroke="#121212"
              content={
                <TreemapContent
                  maxStreams={maxStreams}
                  selectedRegion={selectedRegion}
                  onRegionSelect={onRegionSelect}
                />
              }
            >
              <Tooltip content={<TreemapTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      )}
    </CardSection>
  );
}

function TreemapContent(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  region?: string;
  streams?: number;
  depth?: number;
  maxStreams: number;
  selectedRegion: string | null;
  onRegionSelect: (region: string) => void;
}) {
  const { x = 0, y = 0, width = 0, height = 0, region, name, streams = 0, depth } = props;
  if (depth !== 1 || !region) return null;

  const selected = props.selectedRegion === region;
  const inactive = props.selectedRegion && !selected;
  const intensity = Math.sqrt(streams / Math.max(props.maxStreams, 1));
  const fill = selected ? "#EE5A9C" : getTreemapColor(intensity);
  const showLabel = width > 62 && height > 38;

  return (
    <g className="cursor-pointer" onClick={() => props.onRegionSelect(region)}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke={selected ? "#F2E625" : "#121212"}
        strokeWidth={selected ? 3 : 1}
        opacity={inactive ? 0.46 : 1}
      />
      {showLabel ? (
        <>
          <text
            x={x + 10}
            y={y + 20}
            fill={selected ? "#121212" : "#FFFFFF"}
            stroke="none"
            fontSize={12}
            fontWeight={800}
          >
            {truncateLabel(name ?? region, width > 120 ? 18 : 11)}
          </text>
          {height > 58 ? (
            <text
              x={x + 10}
              y={y + 38}
              fill={selected ? "#121212" : "#D7D7D7"}
              stroke="none"
              fontSize={11}
              fontWeight={700}
            >
              {formatStreams(streams)}
            </text>
          ) : null}
        </>
      ) : null}
    </g>
  );
}

function TreemapTooltip({
  active,
  payload
}: {
  active?: boolean;
  payload?: Array<{ payload: TreemapItem }>;
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;
  return (
    <div className="rounded-[8px] border border-[#2a2a2a] bg-[#181818] px-4 py-3 shadow-panel">
      <p className="text-sm font-black capitalize text-white">{item.region}</p>
      <p className="mt-1 text-xs font-bold text-[#EE5A9C]">{formatFullNumber(item.streams)} 次串流</p>
      <p className="mt-1 text-xs text-[#b3b3b3]">佔此歌曲 {(item.share * 100).toFixed(1)}%</p>
    </div>
  );
}

function getTreemapColor(value: number): string {
  if (value > 0.78) return "#EE5A9C";
  if (value > 0.56) return "#B8F251";
  if (value > 0.34) return "#4EA3F1";
  return "#535353";
}
