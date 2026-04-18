"use client";

import { useEffect, useMemo, useState } from "react";
import { CardSection } from "@/components/shared/CardSection";
import { EmptyState } from "@/components/shared/EmptyState";
import type { SongAggregate } from "@/types/spotify";
import { formatFullNumber, formatStreams } from "@/utils/format";

interface TopSongsChartProps {
  songs: SongAggregate[];
  onSongSelect: (songKey: string) => void;
}

const pageSize = 10;
const pageCount = 5;
const rankPalette = [
  "#1DB954",
  "#F2E625",
  "#B8F251",
  "#4EA3F1",
  "#EE5A9C",
  "#FF3B30",
  "#FFD166",
  "#9BE7FF",
  "#F8C9D8",
  "#C6F45D"
];

export function TopSongsChart({ songs, onSongSelect }: TopSongsChartProps) {
  const [page, setPage] = useState(0);
  const maxPage = Math.max(Math.min(Math.ceil(songs.length / pageSize), pageCount) - 1, 0);

  useEffect(() => {
    setPage(0);
  }, [songs]);

  useEffect(() => {
    if (page > maxPage) setPage(maxPage);
  }, [maxPage, page]);

  const pageSongs = useMemo(() => {
    const start = page * pageSize;
    return songs.slice(start, start + pageSize);
  }, [page, songs]);

  return (
    <CardSection
      title="熱門歌曲"
      subtitle="依所選期間的總串流量排序，每頁 10 名，可切換查看前 50 名。"
      tone="green"
      className="flex min-h-0 flex-col"
      action={
        <div className="flex items-center gap-2 text-xs font-black text-[#b3b3b3]">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(current - 1, 0))}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#535353] text-white transition hover:border-[#1DB954] disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="上一頁"
          >
            &lt;
          </button>
          <span className="min-w-[42px] text-center">{page + 1} / {pageCount}</span>
          <button
            type="button"
            disabled={page >= maxPage}
            onClick={() => setPage((current) => Math.min(current + 1, maxPage))}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#535353] text-white transition hover:border-[#1DB954] disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="下一頁"
          >
            &gt;
          </button>
        </div>
      }
    >
      {songs.length === 0 ? (
        <EmptyState title="沒有歌曲資料" message="請放寬日期範圍後再試一次。" />
      ) : (
        <div className="grid min-h-0 flex-1 gap-1.5" style={{ gridTemplateRows: "repeat(10, minmax(0, 1fr))" }}>
          {pageSongs.map((song, index) => {
            const rank = page * pageSize + index + 1;
            const color = getRankColor(rank);
            const muted = rank > 10;

            return (
              <button
                key={song.songKey}
                type="button"
                onClick={() => onSongSelect(song.songKey)}
                className="group grid min-h-[42px] w-full grid-cols-[40px_minmax(0,1fr)_86px] items-center gap-3 overflow-hidden rounded-[8px] border border-[#2a2a2a] bg-[#121212] px-3 py-2 text-left transition hover:border-[#535353] hover:bg-[#202020]"
                title={`${song.title} - ${song.artist}: ${formatFullNumber(song.streams)} 次串流`}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] text-sm font-black text-[#121212]"
                  style={{ backgroundColor: color, opacity: muted ? 0.58 : 1 }}
                >
                  {rank}
                </span>
                <span className="min-w-0 truncate text-sm font-black text-white group-hover:text-[#1DB954]">
                  {song.title} - {song.artist}
                </span>
                <span className="justify-self-end text-xs font-black text-[#b3b3b3]">
                  {formatStreams(song.streams)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </CardSection>
  );
}

function getRankColor(rank: number): string {
  if (rank <= 10) return rankPalette[rank - 1];
  return "#9B8A92";
}
