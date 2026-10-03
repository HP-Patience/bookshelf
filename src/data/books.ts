export type BookStatus = 1 | 2 | 3 | 4 | 5;

export interface Book {
  title: string;
  category: string;
  status: BookStatus;
  score: number;
  image: string;
  published: string;
}

export const books: Book[] = [
  {
    "title": "遥远的救世主（《天道》影视原著）",
    "status": 2,
    "score": 0,
    "image": "https://cdn.weread.qq.com/weread/cover/27/cpplatform_jaexyfgcdv21qcn89p91jg/t6_cpplatform_jaexyfgcdv21qcn89p91jg1788937965.jpg",
    "published": "2026-09-18",
    "category": "精品小说"
  },
  {
    "title": "富爸爸穷爸爸",
    "status": 2,
    "score": 0,
    "image": "https://cdn.weread.qq.com/weread/cover/68/YueWen_23601930/t6_YueWen_23601930.jpg",
    "published": "2026-09-18",
    "category": "经济理财"
  },
  {
    "title": "认知觉醒：开启自我改变的原动力",
    "status": 2,
    "score": 0,
    "image": "https://cdn.weread.qq.com/weread/cover/86/YueWen_33628204/t6_YueWen_33628204.jpg",
    "published": "2026-05-18",
    "category": "心理"
  },
  {
    "title": "人性的弱点（卡耐基经典励志系列）",
    "status": 2,
    "score": 0,
    "image": "https://cdn.weread.qq.com/weread/cover/35/YueWen_918483/t6_YueWen_918483.jpg",
    "published": "2026-05-10",
    "category": "个人成长"
  },
  {
    "title": "冯唐成事心法",
    "status": 2,
    "score": 0,
    "image": "https://cdn.weread.qq.com/weread/cover/22/YueWen_35138325/t6_YueWen_35138325.jpg",
    "published": "2026-04-15",
    "category": "经济理财"
  },
  {
    "title": "追风筝的人（珍藏纪念版）",
    "status": 2,
    "score": 0,
    "image": "https://cdn.weread.qq.com/weread/cover/46/yuewen_546339/t6_yuewen_5463391747707629.jpg",
    "published": "2025-06-06",
    "category": "文学"
  },
  {
    "title": "啊2.0",
    "status": 2,
    "score": 0,
    "image": "https://cdn.weread.qq.com/weread/cover/58/YueWen_33629539/t6_YueWen_33629539.jpg",
    "published": "2025-04-25",
    "category": "文学"
  },
  {
    "title": "被嫌弃的松子的一生（2021版｜同名电影原著）",
    "status": 2,
    "score": 0,
    "image": "https://cdn.weread.qq.com/weread/cover/50/YueWen_36927214/t6_YueWen_36927214.jpg",
    "published": "2025-04-15",
    "category": "精品小说"
  },
  {
    "title": "恶意",
    "status": 2,
    "score": 0,
    "image": "https://cdn.weread.qq.com/weread/cover/29/3300020529/t6_3300020529.jpg",
    "published": "2025-04-12",
    "category": "精品小说"
  },
  {
    "title": "强者思维",
    "status": 2,
    "score": 0,
    "image": "https://cdn.weread.qq.com/weread/cover/50/cpplatform_ohulsqfabtcppehqdqtmcr/t6_cpplatform_ohulsqfabtcppehqdqtmcr1696758968.jpg",
    "published": "2025-03-10",
    "category": "哲学宗教"
  },
  {
    "title": "乖摸摸头",
    "status": 2,
    "score": 0,
    "image": "https://img.tsh520.cn/file/blog/books/s27466554.jpg",
    "published": "2019-03-31",
    "category": "精品小说"
  }
];
