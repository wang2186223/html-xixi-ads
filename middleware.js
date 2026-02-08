// 这种写法不需要 import 任何东西，Vercel 原生支持
export default function middleware(request) {
  // 获取国家代码
  const country = request.geo?.country;

  // 如果是来自中国大陆
  if (country === 'CN') {
    // 307 是临时重定向，对 SEO 更友好
    return Response.redirect('https://www.baidu.com', 307);
  }

  // 返回 null 或不返回任何内容，表示放行流量
  return;
}

// 这里的配置保持不变，拦截所有页面请求
export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};