"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { CardSection } from "@/components/shared/CardSection";
import { EmptyState } from "@/components/shared/EmptyState";
import type { TrendPoint } from "@/types/spotify";
import { formatFullNumber, formatStreams } from "@/utils/format";

interface SongTrendAreaChartProps {
  points: TrendPoint[];
  averageStreams: number;
  selectedRegion: string | null;
}

export function SongTrendAreaChart({ points, averageStreams, selectedRegion }: SongTrendAreaChartProps) {
  return (
    <CardSection
      title="趨勢"
      subtitle="顯示所選歌曲的串流趨勢，水平參考線代表目前期間平均值。"
      tone="purple"
    >
      {points.length === 0 ? (
        <EmptyState title="沒有趨勢資料" message="請選擇歌曲、清除地區或放寬日期範圍。" />
      ) : (
        <div className="h-[430px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 18, right: 24, left: 0, bottom: 18 }}>
              <defs>
                <linearGradient id="trendPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EE5A9C" stopOpacity={0.52} />
                  <stop offset="100%" stopColor="#4EA3F1" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#2a2a2a" />
              <XAxis
                dataKey="label"
                stroke="#b3b3b3"
                tickLine={false}
                axisLine={false}
                minTickGap={32}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={formatStreams}
                stroke="#b3b3b3"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<TrendTooltip selectedRegion={selectedRegion} />} />
              <ReferenceLine
                y={averageStreams}
                stroke="#F2E625"
                strokeDasharray="7 7"
                label={{ value: "平均值", position: "right", fill: "#F2E625", fontSize: 12, fontWeight: 800 }}
              />
              <Area
                type="monotone"
                dataKey="streams"
                stroke="#EE5A9C"
                strokeWidth={3}
                fill="url(#trendPurple)"
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#121212", fill: "#EE5A9C" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </CardSection>
  );
}

function TrendTooltip({
  active,
  payload,
  selectedRegion
}: {
  active?: boolean;
  payload?: Array<{ payload: TrendPoint }>;
  selectedRegion: string | null;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;
  return (
    <div className="rounded-[8px] border border-[#2a2a2a] bg-[#181818] px-4 py-3 shadow-panel">
      <p className="text-sm font-black text-white">{point.period}</p>
      {selectedRegion ? <p className="mt-1 text-xs capitalize text-[#b3b3b3]">{selectedRegion}</p> : null}
      <p className="mt-2 text-sm font-bold text-[#EE5A9C]">{formatFullNumber(point.streams)} 次串流</p>
    </div>
  );
}
