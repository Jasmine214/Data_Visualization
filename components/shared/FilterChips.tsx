import type { SongOption } from "@/types/spotify";

interface FilterChipsProps {
  song: SongOption | null;
  artist: string | null;
  region: string | null;
  onClearSong: () => void;
  onClearArtist: () => void;
  onClearRegion: () => void;
  onClearAll: () => void;
}

export function FilterChips({
  song,
  artist,
  region,
  onClearSong,
  onClearArtist,
  onClearRegion,
  onClearAll
}: FilterChipsProps) {
  const hasFilters = Boolean(song || artist || region);

  if (!hasFilters) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[8px] border border-[#2a2a2a] bg-[#181818] px-4 py-3 shadow-panel">
      {song ? <Chip label={`歌曲：${song.label}`} onClear={onClearSong} tone="green" /> : null}
      {artist ? <Chip label={`歌手：${artist}`} onClear={onClearArtist} tone="green" /> : null}
      {region ? <Chip label={`地區：${region}`} onClear={onClearRegion} tone="purple" /> : null}
      <button
        type="button"
        onClick={onClearAll}
        className="ml-auto rounded-[8px] border border-[#535353] px-3 py-2 text-xs font-bold text-[#b3b3b3] transition hover:bg-[#282828] hover:text-white"
      >
        清除全部
      </button>
    </div>
  );
}

function Chip({
  label,
  onClear,
  tone
}: {
  label: string;
  onClear: () => void;
  tone: "green" | "purple";
}) {
  const toneClasses =
    tone === "green"
      ? "border-[#1DB954]/50 bg-[#1DB954]/14 text-white"
      : "border-[#EE5A9C]/50 bg-[#EE5A9C]/14 text-white";

  return (
    <span className={`inline-flex max-w-full items-center gap-2 rounded-[8px] border px-3 py-2 text-sm ${toneClasses}`}>
      <span className="truncate">{label}</span>
      <button type="button" onClick={onClear} className="text-xs font-black" aria-label={`清除 ${label}`}>
        x
      </button>
    </span>
  );
}
