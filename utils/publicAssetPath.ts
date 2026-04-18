const publicAssetBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function getPublicAssetPath(path: string) {
  return `${publicAssetBasePath}${path.startsWith("/") ? path : `/${path}`}`;
}
