import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const server = () => import("../scripts/local-admin.mjs");

test("仅固定三种Git命令，不允许任意命令或参数", async()=>{
 const {gitArgs}=await server();
 assert.deepEqual(gitArgs("add"),["add","."]);
 assert.deepEqual(gitArgs("push"),["push","origin","main"]);
 assert.deepEqual(gitArgs("commit","更新书单"),["commit","-m","更新书单"]);
 assert.throws(()=>gitArgs("reset"));assert.throws(()=>gitArgs("commit",""));
});
test("环回地址、Host、Origin与写入token都必须匹配",async()=>{
 const {authorize}=await server();
 const req={socket:{remoteAddress:"127.0.0.1"},headers:{host:"127.0.0.1:4321",origin:"http://127.0.0.1:4321","x-admin-token":"secret"}};
 assert.doesNotThrow(()=>authorize(req,"secret",true));
 for(const headers of [{...req.headers,origin:"https://evil.com"},{...req.headers,host:"evil.com"},{...req.headers,"x-admin-token":"wrong"}]) assert.throws(()=>authorize({...req,headers},"secret",true));
 assert.throws(()=>authorize({...req,socket:{remoteAddress:"192.168.1.5"}},"secret",true));
});
test("文件保存有修订检测和备份，不覆盖另一标签页新改动",async()=>{
 const {readBooks,writeBooks}=await server();const dir=await mkdtemp(join(tmpdir(),"bookshelf-test-"));
 try{await mkdir(join(dir,"src/data"),{recursive:true});await writeFile(join(dir,"src/data/books.ts"),'export const books: Book[] = [];');
 const initial=await readBooks(dir);const book={title:"本地测试",category:"文学",image:"/covers/test.webp",status:2,score:0,published:"2026-10-04",startDate:"",endDate:""};
 const saved=await writeBooks(dir,[book],initial.revision);assert.equal(saved.books.length,1);
 await assert.rejects(writeBooks(dir,[],initial.revision));
 assert.ok((await readFile(join(dir,"src/data/books.ts"),"utf8")).includes("本地测试"));
 }finally{await rm(dir,{recursive:true,force:true});}
});
test("转WebP并完整保留原始图片字节",async()=>{
 const {saveCover}=await server();const sharp=(await import("sharp")).default;const dir=await mkdtemp(join(tmpdir(),"bookshelf-image-"));
 try{const png=await sharp({create:{width:2,height:3,channels:3,background:"red"}}).png().toBuffer();const result=await saveCover(dir,png);assert.ok(result.image.endsWith(".webp"));
 assert.deepEqual(await readFile(join(dir,"public",result.original)),png);
 assert.equal((await sharp(await readFile(join(dir,"public",result.image))).metadata()).format,"webp");
 }finally{await rm(dir,{recursive:true,force:true});}
});

test("真实Git流程可流式执行add、commit、push，跨站调用被拒绝",async()=>{
 const {default:plugin}=await server();const {createServer}=await import("node:http");const {execFileSync}=await import("node:child_process");
 const dir=await mkdtemp(join(tmpdir(),"bookshelf-git-"));let http;
 try{
  execFileSync("git",["init","-b","main"],{cwd:dir});execFileSync("git",["config","user.name","后台测试"],{cwd:dir});execFileSync("git",["config","user.email","admin-test@example.invalid"],{cwd:dir});
  const remote=join(dir,"remote.git");execFileSync("git",["init","--bare",remote]);execFileSync("git",["remote","add","origin",remote],{cwd:dir});
  await writeFile(join(dir,".gitignore"),"remote.git/\n.local-admin/\n");await mkdir(join(dir,"src/data"),{recursive:true});await writeFile(join(dir,"src/data/books.ts"),'export const books: Book[] = [];');
  let middleware;plugin(dir).configureServer({middlewares:{use(fn){middleware=fn;}}});
  http=createServer((req,res)=>middleware(req,res,()=>{res.statusCode=404;res.end();}));await new Promise(resolve=>http.listen(0,"127.0.0.1",resolve));
  const origin="http://127.0.0.1:"+http.address().port;const initial=await(await fetch(origin+"/__local-admin/books")).json();
  const blocked=await fetch(origin+"/__local-admin/git",{method:"POST",headers:{origin:"https://evil.com","x-admin-token":initial.token,"content-type":"application/json"},body:JSON.stringify({action:"add"})});assert.equal(blocked.status,400);
  for(const action of ["add","commit","push"]){const response=await fetch(origin+"/__local-admin/git",{method:"POST",headers:{origin,"x-admin-token":initial.token,"content-type":"application/json"},body:JSON.stringify({action,message:"测试提交"})});assert.equal(response.status,200);assert.ok(response.headers.get("content-type").includes("ndjson"));const lines=(await response.text()).trim().split("\n").map(line=>JSON.parse(line));assert.equal(lines.at(-1).code,0);}
  assert.ok(execFileSync("git",["--git-dir",remote,"rev-parse","refs/heads/main"],{encoding:"utf8"}).trim());
 }finally{if(http){http.closeAllConnections();await new Promise(resolve=>http.close(resolve));}await rm(dir,{recursive:true,force:true});}
});
