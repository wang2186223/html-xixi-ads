import { NextResponse } from 'next/server';

export function middleware(request) {
  // 获取访问者的国家代码
  const country = request.geo?.country;
  
  // 只阻止中国大陆 IP（CN），允许香港（HK）、澳门（MO）、台湾（TW）访问
  if (country === 'CN') {
    // 重定向到百度
    return NextResponse.redirect('https://www.baidu.com', 307);
  }
  
  // 其他地区（包括港澳台）正常访问
  return NextResponse.next();
}

// 配置 middleware 应用的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
