import { getPublicAssetPath } from "@/utils/publicAssetPath";

export type DashboardView = "overview" | "song";

interface SidebarNavProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

const navItems: Array<{ id: DashboardView; label: string; hint: string }> = [
  { id: "overview", label: "概覽", hint: "歌曲、歌手、市場" },
  { id: "song", label: "單曲分析", hint: "地區分布與趨勢" }
];

export function SidebarNav({ activeView, onViewChange }: SidebarNavProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#2a2a2a] bg-[#000000]/92 px-4 py-2 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <img src={getPublicAssetPath("/img/Logo.png")} alt="Spotify" className="h-10 w-10 rounded-[8px]" />
          <div>
            <p className="text-xs font-bold text-[#1DB954]">資料儀表板</p>
            <h1 className="text-lg font-black leading-tight text-white xl:text-xl">Spotify 2017–2021 串流趨勢全解析</h1>
          </div>
        </div>

        <nav className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-center">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const activeClasses =
              item.id === "overview"
                ? "border-[#1DB954] bg-[#1DB954] text-[#121212]"
                : "border-[#EE5A9C] bg-[#EE5A9C] text-[#121212]";

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onViewChange(item.id)}
                className={`rounded-[8px] border px-4 py-2 text-left transition hover:bg-[#282828] ${
                  isActive ? activeClasses : "border-[#2a2a2a] bg-[#121212] text-[#b3b3b3]"
                }`}
              >
                <span className="block text-sm font-black">{item.label}</span>
                <span className="mt-1 block text-xs leading-4">{item.hint}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
