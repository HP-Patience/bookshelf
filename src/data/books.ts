export type BookStatus = 1 | 2 | 3 | 4 | 5;

export interface Book {
  title: string;
  category: string;
  status: BookStatus;
  score: number;
  image: string;
  published: string;
  startDate?: string;
  endDate?: string;
}

export const books: Book[] = [
  {
    "title": "遥远的救世主（《天道》影视原著）",
    "category": "精品小说",
    "status": 2,
    "score": 0,
    "image": "/covers/578b879300215e58867ad5ceb0af5d3d71449c5485ecf033702c9995e8e40ad4.webp",
    "published": "2026-09-18",
    "startDate": "",
    "endDate": ""
  },
  {
    "title": "富爸爸穷爸爸",
    "category": "经济理财",
    "status": 2,
    "score": 0,
    "image": "/covers/cccde844cb0272a5ca8cb70831569f1bcbe5a8d801c653fce00c7fd90dafb67e.webp",
    "published": "2026-09-18",
    "startDate": "",
    "endDate": ""
  },
  {
    "title": "认知觉醒：开启自我改变的原动力",
    "category": "心理",
    "status": 2,
    "score": 0,
    "image": "/covers/0f89791ada061c9f32a2b37f9f5c631099b7a2af79ac9d56ab3d4f14e23057cd.webp",
    "published": "2026-05-18",
    "startDate": "",
    "endDate": ""
  },
  {
    "title": "人性的弱点（卡耐基经典励志系列）",
    "category": "个人成长",
    "status": 2,
    "score": 0,
    "image": "/covers/88f66d5cdae6c51830fd517ede4770dc3fed97b01d78161b2447601ff5adf213.webp",
    "published": "2026-05-10",
    "startDate": "",
    "endDate": ""
  },
  {
    "title": "冯唐成事心法",
    "category": "经济理财",
    "status": 2,
    "score": 0,
    "image": "/covers/00e647bcb05a654de8e8ad536fd182636c6f0bbe3715ace6813a339e4924661d.webp",
    "published": "2026-04-15",
    "startDate": "",
    "endDate": ""
  },
  {
    "title": "追风筝的人（珍藏纪念版）",
    "category": "文学",
    "status": 2,
    "score": 0,
    "image": "/covers/cec1c9b06b5c212132e8712217b49beeb3f2b9d89baae15ad2a208d07a106a59.webp",
    "published": "2025-06-06",
    "startDate": "",
    "endDate": ""
  },
  {
    "title": "啊2.0",
    "category": "文学",
    "status": 2,
    "score": 0,
    "image": "/covers/c78fc472b4bf49bdbaa3daeccabbfe66647debcc8b26103105df800c661df157.webp",
    "published": "2025-04-25",
    "startDate": "",
    "endDate": ""
  },
  {
    "title": "被嫌弃的松子的一生（2021版｜同名电影原著）",
    "category": "精品小说",
    "status": 2,
    "score": 0,
    "image": "/covers/48b69fac97a9f13b3c71a37bbed8f81086e72030f6211389064f203935bd53c7.webp",
    "published": "2025-04-15",
    "startDate": "",
    "endDate": ""
  },
  {
    "title": "恶意",
    "category": "精品小说",
    "status": 2,
    "score": 0,
    "image": "/covers/b831ec779736b1fbdf20959bff450d22141672ec3f39e4d494fc92999d894787.webp",
    "published": "2025-04-12",
    "startDate": "",
    "endDate": ""
  },
  {
    "title": "强者思维",
    "category": "哲学宗教",
    "status": 2,
    "score": 0,
    "image": "/covers/cffa17327d9cb17730bc4de527133cb362f6054a1424fbe6f72a225083b88400.webp",
    "published": "2025-03-10",
    "startDate": "",
    "endDate": ""
  },
  {
    "title": "乖摸摸头",
    "category": "精品小说",
    "status": 2,
    "score": 0,
    "image": "/covers/b3794295ccb92668332aa2cf74bc0a6d55510d3691e0b655ad961dc15e26dad5.webp",
    "published": "2019-03-31",
    "startDate": "",
    "endDate": ""
  }
];
