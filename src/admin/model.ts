import type { Book } from "../data/books";

export const statusLabels = ["", "想读", "读过", "在读", "搁置", "抛弃"];
const coverPath = /^\/covers\/[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp|gif|avif)$/;

export function validateBook(value: Book): Book {
  const title = value.title.trim();
  const category = value.category.trim();
  const image = value.image.trim();
  if (!title || title.length > 200) throw new Error("书名必填，最多200字。");
  if (!category || category.length > 80) throw new Error("分类必填，最多80字。");
  if (![1, 2, 3, 4, 5].includes(value.status)) throw new Error("请选择有效的阅读状态。");
  if (!Number.isFinite(value.score) || value.score < 0 || value.score > 10) throw new Error("评分必须在0—10之间，0表示不展示评分。");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.published)) throw new Error("请选择有效日期。");
  const date = new Date(value.published + "T00:00:00Z");
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value.published) throw new Error("日期无效。");
  if (!coverPath.test(image)) {
    let url: URL;
    try { url = new URL(image); } catch { throw new Error("请上传封面或填写完整的HTTP(S)图片地址。"); }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("封面地址只允许HTTP(S)。");
  }
  const startDate = value.startDate ?? "";
  const endDate = value.endDate ?? "";
  for (const readingDate of [startDate, endDate]) {
    if (!readingDate) continue;
    const parsed = new Date(readingDate + "T00:00:00Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(readingDate) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0,10) !== readingDate) throw new Error("阅读日期无效。");
  }
  if (startDate && endDate && startDate > endDate) throw new Error("结束日期不能早于开始日期。");
  return { title, category, status: value.status, score: value.score, image, published: value.published, startDate, endDate };
}

export async function validateCover(blob: Blob): Promise<string> {
  if (!blob.size || blob.size > 10 * 1024 * 1024) throw new Error("封面图片不可为空，单张最多10MB。");
  const bytes = new Uint8Array(await blob.slice(0, 32).arrayBuffer());
  const text = new TextDecoder().decode(bytes);
  let ext = "";
  if ([137,80,78,71,13,10,26,10].every((n,i) => bytes[i] === n)) ext = "png";
  else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ext = "jpg";
  else if (text.startsWith("GIF87a") || text.startsWith("GIF89a")) ext = "gif";
  else if (text.startsWith("RIFF") && text.slice(8,12) === "WEBP") ext = "webp";
  else if (text.slice(4,8) === "ftyp" && /avif|avis/.test(text.slice(8))) ext = "avif";
  if (!ext) throw new Error("仅支持有效的JPEG、PNG、WebP、GIF或AVIF图片，不支持SVG。");
  return ext;
}
