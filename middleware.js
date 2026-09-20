export default async function middleware(request) {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const isChapterPage = segments.length >= 3; // ['novels', '书名', '章节名']
  const isNumericId =
    segments.length >= 2 &&
    /^\d{5}$/.test(segments[1]) &&
    segments[1] !== '00000';

  // 辅助函数：fetch 00000 内容并将路径中的 00000 替换为 sourceId 后返回（归一信号除外）
  async function rewriteFrom00000(rewritePath, sourceId) {
    const rewriteUrl = new URL(request.url);
    rewriteUrl.pathname = rewritePath;
    rewriteUrl.search = '';
    const resp = await fetch(rewriteUrl.toString());

    // 归一信号（canonical / og:url / JSON-LD 的 @id 与 url）必须继续指向 00000 原页，
    // 先用占位符隔离，避开下面的全局替换，替换完再还原
    const KEEP_PATTERN = /<link[^>]+rel=["']canonical["'][^>]*>|<meta[^>]+property=["']og:url["'][^>]*>|"@id":\s*"[^"]*\/novels\/00000\/[^"]*"|"url":\s*"[^"]*\/novels\/00000\/[^"]*"/gi;
    const kept = [];
    let html = (await resp.text()).replace(KEEP_PATTERN, (m) => {
      kept.push(m);
      return `\u0000KEEP${kept.length - 1}\u0000`;
    });
    html = html.replaceAll('/novels/00000', `/novels/${sourceId}`);
    html = html.replace(/\u0000KEEP(\d+)\u0000/g, (_, i) => kept[i]);

    const newHeaders = new Headers(resp.headers);
    // resp.text() 已解压，若保留上游的 content-encoding: br，浏览器会解码失败导致白屏
    newHeaders.delete('content-encoding');
    newHeaders.delete('content-length');
    newHeaders.delete('etag');
    newHeaders.set('content-type', 'text/html; charset=utf-8');
    return new Response(html, { status: resp.status, headers: newHeaders });
  }

  // 数字ID路由：/novels/XXXXX 与 /novels/XXXXX/N 都取 00000 的内容重写后返回
  // 直接 return 会 404——这些 ID 没有静态文件，内容只存在于 00000 下
  if (isNumericId) {
    if (isChapterPage) {
      const chapterPath = segments.slice(2).join('/');
      return rewriteFrom00000(`/novels/00000/${chapterPath}`, segments[1]);
    }
    return rewriteFrom00000('/novels/00000', segments[1]);
  }

  // 非数字ID（真实书名路由）走静态文件
  return;
}

// 覆盖所有 /novels/ 路径（含目录页和章节页）
export const config = {
  matcher: ['/novels/:path*'],
};