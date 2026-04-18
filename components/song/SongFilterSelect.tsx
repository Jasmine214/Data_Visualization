"use client";

import { useEffect, useMemo, useState } from "react";
import type { SongOption } from "@/types/spotify";

interface SongFilterSelectProps {
  options: SongOption[];
  selectedSongKey: string | null;
  onSongChange: (songKey: string | null) => void;
}

const maxVisibleOptions = 80;

export function SongFilterSelect({ options, selectedSongKey, onSongChange }: SongFilterSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedSongKey) ?? null,
    [options, selectedSongKey]
  );

  useEffect(() => {
    if (selectedOption) {
      setQuery(selectedOption.label);
    } else if (!open) {
      setQuery("");
    }
  }, [open, selectedOption]);

  const normalizedQuery = query.trim().toLocaleLowerCase("zh-TW");
  const filteredOptions = useMemo(() => {
    const candidates = normalizedQuery
      ? options.filter((option) => {
          const searchText = `${option.label} ${option.title} ${option.artist}`.toLocaleLowerCase("zh-TW");
          return searchText.includes(normalizedQuery);
        })
      : options;

    return candidates.slice(0, maxVisibleOptions);
  }, [normalizedQuery, options]);

  const handleSelect = (option: SongOption) => {
    onSongChange(option.value);
    setQuery(option.label);
    setOpen(false);
  };

  const handleClear = () => {
    onSongChange(null);
    setQuery("");
    setOpen(false);
  };

  return (
    <section className="mb-4 rounded-[8px] border border-[#2a2a2a] bg-[#181818] p-4 shadow-panel">
      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(280px,520px)] lg:items-end">
        <div>
          <h2 className="text-base font-black text-white">
            歌曲篩選 - 選擇一首歌查看地區串流分布與時間趨勢
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#b3b3b3]">
            選單保留全資料集歌曲，排序使用英文 A-Z 與繁體中文筆畫排序。
          </p>
        </div>
        <div className="grid gap-2 text-sm font-bold text-white">
          <span>歌曲</span>
          <div className="relative">
            <div className="flex items-center rounded-[8px] border border-[#535353] bg-[#121212] transition focus-within:border-[#1DB954]">
              <input
                type="text"
                role="combobox"
                aria-expanded={open}
                aria-controls="song-filter-options"
                value={query}
                onFocus={() => setOpen(true)}
                onBlur={() => window.setTimeout(() => setOpen(false), 140)}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setOpen(true);
                }}
                placeholder="搜尋歌名或歌手"
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-semibold text-white outline-none placeholder:text-[#535353]"
              />
              {query || selectedSongKey ? (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleClear}
                  className="mr-1 rounded-[8px] px-2 py-1 text-xs font-black text-[#b3b3b3] transition hover:bg-[#2a2a2a] hover:text-white"
                >
                  清除
                </button>
              ) : null}
              <button
                type="button"
                aria-label="展開歌曲選單"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setOpen((current) => !current)}
                className="mr-2 flex h-8 w-8 items-center justify-center rounded-[8px] text-sm font-black text-[#1DB954] transition hover:bg-[#2a2a2a]"
              >
                v
              </button>
            </div>

            {open ? (
              <div
                id="song-filter-options"
                className="absolute right-0 top-[calc(100%+8px)] z-30 max-h-72 w-full overflow-y-auto rounded-[8px] border border-[#2a2a2a] bg-[#121212] p-1 shadow-panel"
              >
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(option)}
                      className={`grid w-full gap-0.5 rounded-[8px] px-3 py-2 text-left transition hover:bg-[#202020] ${
                        selectedSongKey === option.value ? "bg-[#1DB954] text-[#121212]" : "text-white"
                      }`}
                    >
                      <span className="truncate text-sm font-black">{option.title}</span>
                      <span
                        className={`truncate text-xs font-bold ${
                          selectedSongKey === option.value ? "text-[#121212]/75" : "text-[#b3b3b3]"
                        }`}
                      >
                        {option.artist}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-4 text-sm font-bold text-[#b3b3b3]">找不到符合的歌曲</p>
                )}
              </div>
            ) : null}
          </div>
          <span className="text-xs font-bold text-[#535353]">
            {normalizedQuery ? `顯示前 ${filteredOptions.length} 筆符合結果` : `顯示前 ${filteredOptions.length} 筆歌曲`}
          </span>
        </div>
      </div>
    </section>
  );
}
