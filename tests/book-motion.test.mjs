import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/components/BookCard.astro", import.meta.url), "utf8");
test("复用博客书卡：书体旋转30度，纸页和封底属于同一个旋转层", () => {
  assert.ok(source.includes(".nb-book:hover .nb-book-inner"));
  assert.ok(source.includes("rotateY(-30deg) scale(1.09) translateX(-14px)"));
  assert.ok(source.includes("rotateY(90deg) translateX(calc(var(--book-depth) / 2))"));
  assert.ok(source.includes("translateZ(calc(-1 * var(--book-depth)))"));
  const body = source.slice(source.indexOf('<div class="nb-book-inner">'), source.indexOf("<style>"));
  for (const plane of ["nb-book-cover", "nb-book-pages", "nb-book-back"]) assert.ok(body.includes(plane));
  assert.ok(!source.includes('class="book-title"'));
});

import { createHash } from "node:crypto";
test("书卡和筛选网格CSS与原博客源码完全一致", () => {
  const css = source.match(/<style>([\s\S]*?)<\/style>/)[1];
  const shelf = readFileSync(new URL("../src/styles/bookshelf.css", import.meta.url), "utf8").trim();
  const hash = text => createHash("sha256").update(text).digest("hex");
  assert.equal(hash(css), "d03f5254fa05d2f8c3747f6504ffbf1d97be5dfd18a9a23ce96b38ca0a241b70");
  assert.equal(hash(shelf), "c1e10e71362b85d31f4282e6f45d96878dc0fae291ab8b1ae818a41799abeb49");
});
