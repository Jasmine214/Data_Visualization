import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spotify 2017–2021 串流趨勢全解析",
  description: "2017-2021 Spotify 熱門歌曲、歌手與市場趨勢儀表板。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
