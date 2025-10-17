import { Request } from 'express';
//设置允许访问的域名
const allowlist = ['http://localhost:9527', 'http://localhost:5174'];

const corsOptionsDelegate = (req: Request, callback) => {
  let corsOptions;
  const origin = req.header('Origin');

  if (!origin) {
    // 兼容原生移动端/WebView无 Origin 的场景
    corsOptions = { origin: true, credentials: true };
  } else if (allowlist.indexOf(origin) !== -1) {
    corsOptions = { origin, credentials: true };
  } else {
    corsOptions = { origin: false }; // 非白名单的浏览器请求拒绝跨域
  }
  callback(null, corsOptions);
};
export default corsOptionsDelegate;
