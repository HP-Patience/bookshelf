import assert from "node:assert/strict";
import test from "node:test";

const model = () => import("../src/admin/model.ts");
const book = { title: " 测试书 📖 ", category: " 文学 ", status: 2, score: 8.5, published: "2026-10-04", image: "https://example.com/cover.jpg" };

test("规范化书籍且拒绝空标题、越界状态评分与非法日期", async () => {
  const { validateBook } = await model();
  assert.equal(validateBook(book).title, "测试书 📖");
  assert.equal(validateBook(book).category, "文学");
  for (const patch of [{title:" "}, {category:""}, {status:6}, {score:11}, {score:NaN}, {published:"2026-02-30"}]) {
    assert.throws(() => validateBook({...book,...patch}));
  }
});

test("封面只允许HTTP(S)或安全的本地covers路径", async () => {
  const { validateBook } = await model();
  assert.equal(validateBook({...book,image:"/covers/abc.webp"}).image, "/covers/abc.webp");
  for (const image of ["javascript:alert(1)","data:image/svg+xml,x","/covers/../secret","/covers/a%2fb.png","//evil.com/x","/covers/abc.svg"]) {
    assert.throws(() => validateBook({...book,image}));
  }
});





test("图片校验识别实际字节，拒绝伪装图片、SVG和超过10MB文件", async () => {
  const { validateCover } = await model();
  assert.equal(await validateCover(new Blob([new Uint8Array([137,80,78,71,13,10,26,10])], {type:"image/png"})), "png");
  await assert.rejects(validateCover(new Blob(["<svg></svg>"],{type:"image/png"})));
  await assert.rejects(validateCover(new Blob([new Uint8Array(10*1024*1024+1)],{type:"image/png"})));
});



test("阅读开始结束日期可留空，有日期时校验范围与先后", async () => {
 const { validateBook }=await model();
 assert.equal(validateBook({...book,startDate:"2026-01-01",endDate:"2026-02-01"}).startDate,"2026-01-01");
 assert.equal(validateBook({...book,startDate:"",endDate:""}).endDate,"");
 assert.throws(()=>validateBook({...book,startDate:"2026-02-30"}));
 assert.throws(()=>validateBook({...book,startDate:"2026-03-01",endDate:"2026-02-01"}));
});
