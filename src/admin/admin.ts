import type { Book } from "../data/books";
import { statusLabels, validateBook } from "./model";

const el = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
let books: Book[] = [];
let revision = "";
let token = "";
let editingIndex: number | undefined;
let dirty = false;
let busy = false;
let gitRunning = false;
const editor = el<HTMLDialogElement>("editor");
const form = el<HTMLFormElement>("book-form");
const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
const gitDialog = el<HTMLDialogElement>("git-dialog");

function message(value: unknown, error = false) {
 const target=el("message");target.textContent=value instanceof Error?value.message:String(value);target.classList.toggle("is-error",error);
}
async function api(route: string, body?: unknown, binary = false) {
 const response = await fetch("/__local-admin/" + route, body === undefined ? {} : {
  method:"POST",headers:{"x-admin-token":token,"Content-Type":binary?"application/octet-stream":"application/json"},body:binary?body as Blob:JSON.stringify(body),
 });
 const result=await response.json();if(!response.ok)throw new Error(result.error||"本地操作失败。");return result;
}
async function run(task:()=>Promise<void>) {
 if(busy||gitRunning)return;busy=true;
 const controls=Array.from(el("admin-root").querySelectorAll<HTMLInputElement|HTMLButtonElement>("button,input,select"));
 const disabled=controls.map(control=>control.disabled);controls.forEach(control=>control.disabled=true);
 try{await task();}catch(error){message(error,true);if(editor.open)el("form-error").textContent=error instanceof Error?error.message:String(error);}
 finally{controls.forEach((control,index)=>control.disabled=disabled[index]);busy=false;}
}
async function load() {
 const data=await api("books");books=data.books;revision=data.revision;token=data.token;
 el("saved-state").textContent="项目文件";render();
}
function render() {
 const tbody=el("book-list");tbody.replaceChildren();
 const query=el<HTMLInputElement>("search").value.trim().toLowerCase();
 el("total").textContent="全部藏书 · "+books.length+" 本";
 el("category-options").replaceChildren();
 for(const category of new Set(books.map(book=>book.category))){const option=document.createElement("option");option.value=category;el("category-options").append(option);}
 let matched=0;
 books.forEach((book,index)=>{
  if(!(book.title+" "+book.category).toLowerCase().includes(query))return;matched++;
  const row=document.createElement("tr");const cell=document.createElement("td");const info=document.createElement("div");info.className="book-info";
  const image=document.createElement("img");image.src=book.image;image.alt="";image.loading="lazy";
  const title=document.createElement("strong");title.textContent=book.title;info.append(image,title);cell.append(info);row.append(cell);
  for(const value of [book.category,statusLabels[book.status],book.score>0?String(book.score):"—",book.startDate||"—",book.endDate||"—"]){const td=document.createElement("td");td.textContent=value;row.append(td);}
  const actions=document.createElement("td");actions.className="row-actions";
  for(const [action,label] of [["edit","编辑"],["delete","删除"]]){const button=document.createElement("button");button.type="button";button.className="text-button "+action;button.dataset.index=String(index);button.dataset.action=action;button.textContent=label;button.setAttribute("aria-label",label+"《"+book.title+"》");actions.append(button);}
  row.append(actions);tbody.append(row);
 });
 el("empty").hidden=matched>0;
}
function preview(){const image=el<HTMLImageElement>("cover-preview");const placeholder=el("cover-placeholder");image.hidden=true;placeholder.hidden=false;
 const source=field("image").value;
 if(!/^\/covers\/[a-zA-Z0-9_-]+\.webp$/.test(source)&&!/^https?:\/\//i.test(source))return;
 image.onload=()=>{image.hidden=false;placeholder.hidden=true;};image.onerror=()=>{image.hidden=true;placeholder.hidden=false;};image.src=source;
}
function openEditor(index?:number){if(busy||gitRunning)return;editingIndex=index;form.reset();const book=index===undefined?{title:"",category:"",status:2,score:0,image:"",startDate:"",endDate:""}:books[index];
 for(const key of ["title","category","status","score","image","startDate","endDate"] as const)field(key).value=String(book[key]??"");
 el("editor-title").textContent=index===undefined?"新增书籍":"编辑书籍";el("form-error").textContent="";dirty=false;preview();editor.showModal();field("title").focus();
}
function closeEditor(){if(busy||dirty&&!confirm("放弃未保存的修改？"))return;dirty=false;editor.close();}
async function save(next:Book[]){const data=await api("books",{books:next,revision});books=data.books;revision=data.revision;render();el("saved-state").textContent="已写入本地文件";}
async function start(){
 await load();["add","push-open","reset"].forEach(id=>el<HTMLButtonElement>(id).disabled=false);
 el("add").addEventListener("click",()=>openEditor());el("search").addEventListener("input",render);
 el("book-list").addEventListener("click",event=>{const button=(event.target as Element).closest<HTMLButtonElement>("button[data-index]");if(!button||busy||gitRunning)return;const index=Number(button.dataset.index);if(button.dataset.action==="edit")openEditor(index);else if(confirm("从项目文件中删除《"+books[index].title+"》？封面原图仍会保留。"))void run(async()=>{await save(books.filter((_,i)=>i!==index));message("已删除并写入文件。");});});
 for(const id of ["cancel-editor","close-editor"])el(id).addEventListener("click",closeEditor);
 editor.addEventListener("cancel",event=>{event.preventDefault();closeEditor();});form.addEventListener("input",()=>dirty=true);field("image").addEventListener("change",preview);
 el<HTMLInputElement>("cover-file").addEventListener("change",event=>{const file=(event.target as HTMLInputElement).files?.[0];if(file)void run(async()=>{const data=await api("cover",file,true);field("image").value=data.image;dirty=true;preview();message("原图已保留，WebP已生成。");});});
 el("use-url").addEventListener("click",()=>void run(async()=>{const data=await api("download",{url:field("image").value});field("image").value=data.image;dirty=true;preview();message("图片已下载并转换为WebP。");}));
 form.addEventListener("submit",event=>{event.preventDefault();void run(async()=>{
  let image=field("image").value.trim();if(/^https?:/i.test(image))image=(await api("download",{url:image})).image;
  const previous=editingIndex===undefined?undefined:books[editingIndex];
  const book=validateBook({title:field("title").value,category:field("category").value,status:Number(field("status").value) as Book["status"],score:Number(field("score").value),image,published:previous?.published||new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Hong_Kong"}),startDate:field("startDate").value,endDate:field("endDate").value});
  await save(editingIndex===undefined?[book,...books]:books.map((item,index)=>index===editingIndex?book:item));dirty=false;editor.close();message("已写入本地文件。");
 });});
 el("reset").addEventListener("click",()=>void run(async()=>{await load();message("已重新读取项目文件。");}));
 el("push-open").addEventListener("click",()=>gitDialog.showModal());el("close-git").addEventListener("click",()=>{if(!gitRunning)gitDialog.close();});gitDialog.addEventListener("cancel",event=>{if(gitRunning)event.preventDefault();});
 document.querySelectorAll<HTMLButtonElement>("[data-git]").forEach(button=>button.addEventListener("click",()=>void executeGit(button.dataset.git!)));
 window.addEventListener("beforeunload",event=>{if(dirty||gitRunning)event.preventDefault();});
}
async function executeGit(action:string){
 if(busy||gitRunning)return;
 const commitMessage=el<HTMLInputElement>("commit-message").value.trim();if(action==="commit"&&!commitMessage){message("请输入提交说明。",true);return;}
 gitRunning=true;const buttons=Array.from(gitDialog.querySelectorAll<HTMLButtonElement>("button"));buttons.forEach(button=>button.disabled=true);
 const terminal=el("git-terminal");const append=(text:string)=>{terminal.textContent=(terminal.textContent+text).slice(-200000);terminal.scrollTop=terminal.scrollHeight;};
 append("\n$ git "+(action==="add"?"add .":action==="push"?"push origin main":"commit -m "+JSON.stringify(commitMessage))+"\n");
 try{
  const response=await fetch("/__local-admin/git",{method:"POST",headers:{"Content-Type":"application/json","x-admin-token":token},body:JSON.stringify({action,message:commitMessage})});
  if(!response.ok)throw new Error((await response.json()).error);
  const reader=response.body!.getReader();const decoder=new TextDecoder();let pending="";let completed=false;
  while(true){const {done,value}=await reader.read();pending+=done?decoder.decode():decoder.decode(value,{stream:true});const lines=pending.split("\n");pending=lines.pop()??"";for(const line of lines){if(!line)continue;const output=JSON.parse(line);if(output.text)append(output.text);if(output.done){completed=true;append("\n[退出码 "+output.code+"]\n");}}if(done)break;}
  if(!completed)throw new Error("连接中断，请检查命令状态后再操作。");
 }catch(error){append("\n错误："+(error instanceof Error?error.message:String(error))+"\n");}
 finally{gitRunning=false;buttons.forEach(button=>button.disabled=false);}
}
if(["127.0.0.1","localhost","[::1]"].includes(location.hostname)){el("admin-root").hidden=false;void start().catch(error=>message(error,true));}else el("local-only").hidden=false;
