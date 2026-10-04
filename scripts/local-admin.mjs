import { readFile, writeFile, mkdir, rename, access } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { lookup } from "node:dns/promises";
import sharp from "sharp";

export function gitArgs(action, message) {
  if (action === "add") return ["add", "."];
  if (action === "push") return ["push", "origin", "main"];
  if (action === "commit" && typeof message === "string" && message.trim() && message.length <= 300 && !message.includes("\0")) return ["commit", "-m", message.trim()];
  throw new Error("只允许git add .、git commit和git push origin main；提交说明不能为空。");
}
const local = hostname => ["127.0.0.1", "localhost", "[::1]"].includes(hostname);
export function authorize(req, token, write) {
  if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress)) throw new Error("仅允许本机访问。");
  const host = req.headers.host;
  if (!host || !local(new URL("http://" + host).hostname)) throw new Error("Host必须为回环地址。");
  if (req.headers.origin && req.headers.origin !== "http://" + host) throw new Error("请求来源不匹配。");
  if (req.headers["sec-fetch-site"] === "cross-site") throw new Error("禁止跨站调用。");
  if (write && (req.headers.origin !== "http://" + host || req.headers["x-admin-token"] !== token)) throw new Error("本地操作凭证无效，请刷新页面。");
}
const revision = source => createHash("sha256").update(source).digest("hex");
export async function readBooks(root) {
  const source = await readFile(join(root,"src/data/books.ts"), "utf8");
  const marker = "export const books: Book[] = ";
  const index = source.indexOf(marker);
  if (index < 0) throw new Error("书籍数据格式不受支持。");
  const books = JSON.parse(source.slice(index + marker.length).trim().replace(/;$/, ""));
  if (!Array.isArray(books)) throw new Error("书籍数据格式错误。");
  return { books, revision: revision(source) };
}
export async function writeBooks(root, books, expectedRevision) {
  const current = await readBooks(root);
  if (current.revision !== expectedRevision) throw new Error("项目书单已被其他操作更新，请重新读取后再保存。");
  if (!Array.isArray(books) || books.length > 5000) throw new Error("书单格式或数量无效。");
  const { validateBook } = await import("../src/admin/model.ts");
  const clean = books.map(validateBook);
  const file = join(root,"src/data/books.ts");
  const source = await readFile(file,"utf8");
  const header = 'export type BookStatus = 1 | 2 | 3 | 4 | 5;\n\nexport interface Book {\n  title: string;\n  category: string;\n  status: BookStatus;\n  score: number;\n  image: string;\n  published: string;\n  startDate?: string;\n  endDate?: string;\n}\n\n';
  await mkdir(join(root,".local-admin/backups"), {recursive:true});
  await writeFile(join(root,".local-admin/backups",Date.now()+"-"+randomUUID()+".ts"),source);
  const temporary = file + "." + randomUUID() + ".tmp";
  await writeFile(temporary,header + "export const books: Book[] = " + JSON.stringify(clean,null,2) + ";\n");
  await rename(temporary,file);
  return readBooks(root);
}
export async function saveCover(root, buffer) {
  if (!buffer.length || buffer.length > 10*1024*1024) throw new Error("封面图片不可为空，单张最多10MB。");
  const image = sharp(buffer, {limitInputPixels:40000000});
  const metadata = await image.metadata();
  const extensions = {jpeg:"jpg",png:"png",webp:"webp",gif:"gif",avif:"avif",heif:"avif"};
  const ext = extensions[metadata.format];
  if (!ext) throw new Error("只允许JPEG、PNG、WebP、GIF、AVIF，不支持SVG。");
  const hash = createHash("sha256").update(buffer).digest("hex");
  const original = "/covers/originals/" + hash + "." + ext;
  const output = "/covers/" + hash + ".webp";
  const webp = await image.rotate().webp({quality:90}).toBuffer();
  await mkdir(join(root,"public/covers/originals"),{recursive:true});
  await writeFile(join(root,"public",original),buffer);
  await writeFile(join(root,"public",output),webp);
  return {image:output,original};
}
function privateAddress(ip) {
  if (ip.includes(":")) return ip === "::1" || ip === "::" || /^(fc|fd|fe80|::ffff:)/i.test(ip);
  const [a,b] = ip.split(".").map(Number);
  return a===0||a===10||a===127||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a===100&&b>=64&&b<=127||a>=224;
}
export async function downloadCover(root, input) {
  let url = new URL(input);
  for (let attempts=0; attempts<5; attempts++) {
    if (!["http:","https:"].includes(url.protocol) || url.username || url.password) throw new Error("只支持HTTP(S)公开图片地址。");
    const addresses = await lookup(url.hostname.replace(/^\[|\]$/g,""),{all:true});
    if (!addresses.length || addresses.some(item=>privateAddress(item.address))) throw new Error("不能下载内网或本机地址。");
    const response = await fetch(url,{redirect:"manual",signal:AbortSignal.timeout(20000)});
    if ([301,302,303,307,308].includes(response.status)) {url=new URL(response.headers.get("location"),url);continue;}
    if (!response.ok) throw new Error("封面下载失败：HTTP " + response.status);
    if (Number(response.headers.get("content-length"))>10*1024*1024) throw new Error("封面超过10MB。");
    const chunks=[];let size=0;
    for await (const chunk of response.body) {size+=chunk.length;if(size>10*1024*1024){await response.body.cancel().catch(()=>{});throw new Error("封面超过10MB。");}chunks.push(chunk);}
    return saveCover(root,Buffer.concat(chunks));
  }
  throw new Error("图片地址跳转过多。");
}
async function readBody(req, limit) {
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>limit)throw new Error("请求过大。");chunks.push(chunk);}
  return Buffer.concat(chunks);
}
export default function localAdminPlugin(root) {
  const token = randomUUID();let locked=false;
  return {name:"bookshelf-local-admin",apply:"serve",configureServer(server){
    server.middlewares.use(async(req,res,next)=>{
      const route = req.url?.split("?")[0];
      if (!route?.startsWith("/__local-admin/")) return next();
      const reply=(status,value)=>{res.statusCode=status;res.setHeader("Content-Type","application/json; charset=utf-8");res.setHeader("Cache-Control","no-store");res.end(JSON.stringify(value));};
      let ownsLock=false;
      try {
        authorize(req,token,req.method!=="GET");
        if(req.method==="GET"&&route==="/__local-admin/books")return reply(200,{...await readBooks(root),token});
        if(req.method!=="POST")return reply(405,{error:"不支持的请求。"});
        if(locked)return reply(409,{error:"正在写文件或执行Git，请等待当前操作结束。"});
        locked=true;ownsLock=true;
        if(route==="/__local-admin/cover") {
          const file=await readBody(req,10*1024*1024);
          return reply(200,await saveCover(root,file));
        }
        const payload=JSON.parse((await readBody(req,5*1024*1024)).toString("utf8"));
        if(route==="/__local-admin/download")return reply(200,await downloadCover(root,payload.url));
        if(route==="/__local-admin/books")return reply(200,await writeBooks(root,payload.books,payload.revision));
        if(route==="/__local-admin/git") {
          const args=gitArgs(payload.action,payload.message);
          res.setHeader("Content-Type","application/x-ndjson; charset=utf-8");res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");res.flushHeaders();
          const send=value=>{if(!res.destroyed)res.write(JSON.stringify(value)+"\n");};
          await new Promise(resolve=>{
            const child=spawn("git",args,{cwd:root,shell:false,env:{...process.env,GIT_TERMINAL_PROMPT:"0",GCM_INTERACTIVE:"never"}});
            const timeout=setTimeout(()=>{send({text:"\n执行超时，已终止命令。\n"});child.kill();},120000);
            child.stdout.setEncoding("utf8");child.stderr.setEncoding("utf8");
            child.stdout.on("data",text=>send({text}));child.stderr.on("data",text=>send({text}));
            child.on("error",error=>{send({text:error.message,done:true,code:1});clearTimeout(timeout);resolve();});
            child.on("close",code=>{clearTimeout(timeout);send({done:true,code:code??1});resolve();});
          });
          res.end();return;
        }
        reply(404,{error:"接口不存在。"});
      }catch(error){if(!res.headersSent)reply(400,{error:error.message});else res.end();}
      finally{if(ownsLock)locked=false;}
    });
  }};
}
