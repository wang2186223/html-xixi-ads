export default function middleware(req) {
  const country = req.geo?.country || 'unknown';
  
  // 强制打印，这样你在 Vercel Logs 里能看到
  console.log("Visitor from:", country);

  if (country === 'CN') {
    return Response.redirect('https://www.baidu.com', 307);
  }
}

// 强制匹配所有路径，不放过任何一个页面
export const config = {
  matcher: '/:path*',
};