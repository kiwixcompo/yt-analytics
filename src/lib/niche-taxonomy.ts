export interface SubNiche {
  id: string;
  name: string;
  subNiches?: Array<{ id: string; name: string; seeds: string[] }>;
  seeds?: string[];
}

export interface GeneralNiche {
  id: string;
  name: string;
  icon: string;
  subNiches: SubNiche[];
}

export const NICHE_HIERARCHY: GeneralNiche[] = [
  {
    id: 'technology',
    name: 'Technology',
    icon: 'Cpu',
    subNiches: [
      {
        id: 'ai',
        name: 'Artificial Intelligence',
        subNiches: [
          {
            id: 'ai-agents',
            name: 'AI Agents & Code Generation',
            seeds: ['craft anything', 'cursor ai', 'claude 3.7', 'deepseek r1', 'windsurf ai', 'bolt new', 'v0 dev'],
          },
          {
            id: 'ai-video',
            name: 'AI Video & Media Creation',
            seeds: ['sora ai', 'kling ai', 'runway gen 3', 'luma dream machine', 'elevenlabs ai', 'midjourney v7'],
          },
          {
            id: 'llms',
            name: 'Large Language Models & Chatbots',
            seeds: ['chatgpt 5', 'gemini 2.0', 'open source llm', 'ollama local', 'grok 3', 'claude sonnet'],
          },
        ],
      },
      {
        id: 'software',
        name: 'Software & Development',
        subNiches: [
          {
            id: 'web-dev',
            name: 'Web & Fullstack Development',
            seeds: ['next js 15', 'react 19', 'tailwind v4', 'typescript tutorial', 'supabase auth', 'shadcn ui'],
          },
          {
            id: 'automation',
            name: 'Automation & Scripting',
            seeds: ['python automation', 'n8n workflow', 'make com tutorial', 'web scraping python', 'selenium bot'],
          },
          {
            id: 'mobile-dev',
            name: 'Mobile App Development',
            seeds: ['react native expo', 'flutter 2026', 'swiftui tutorial', 'ios app development'],
          },
        ],
      },
      {
        id: 'hardware',
        name: 'Hardware & Devices',
        subNiches: [
          {
            id: 'pc-gaming-hardware',
            name: 'PC Builds & GPUs',
            seeds: ['rtx 5090', 'rtx 5080 benchmark', 'budget gaming pc 2026', 'amd ryzen 9000', 'intel core ultra'],
          },
          {
            id: 'smartphones',
            name: 'Smartphones & Mobile Tech',
            seeds: ['iphone 17 pro max', 'samsung galaxy s25 ultra', 'pixel 10 review', 'foldable phone 2026'],
          },
        ],
      },
    ],
  },
  {
    id: 'business',
    name: 'Business & Finance',
    icon: 'TrendingUp',
    subNiches: [
      {
        id: 'online-business',
        name: 'Online Business & E-Commerce',
        subNiches: [
          {
            id: 'side-hustles',
            name: 'Side Hustles & Passive Income',
            seeds: ['passive income 2026', 'digital products to sell', 'faceless youtube channel', 'high ticket affiliate marketing', 'ugc creator'],
          },
          {
            id: 'saas-agency',
            name: 'Micro-SaaS & Agency',
            seeds: ['micro saas ideas', 'ai automation agency aaa', 'smma 2026', 'b2b lead generation'],
          },
        ],
      },
      {
        id: 'investing',
        name: 'Investing & Personal Finance',
        subNiches: [
          {
            id: 'stocks-funds',
            name: 'Stock Market & ETFs',
            seeds: ['etfs to hold forever', 'dividend investing strategy', 'stocks to buy 2026', 'sp500 index fund', 'roth ira setup'],
          },
          {
            id: 'crypto',
            name: 'Crypto & Decentralized Finance',
            seeds: ['bitcoin cycle peak', 'solana ecosystem', 'crypto bull run 2026', 'altcoins 100x', 'crypto airdrops'],
          },
        ],
      },
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming & Entertainment',
    icon: 'Gamepad2',
    subNiches: [
      {
        id: 'action-games',
        name: 'Action & Open World Games',
        subNiches: [
          {
            id: 'gta-franchise',
            name: 'GTA & Open World',
            seeds: ['gta 6 gameplay leak', 'gta 6 map trailer', 'gta 5 roleplay', 'cyberpunk update'],
          },
          {
            id: 'rpg-souls',
            name: 'Action RPGs & Soulslike',
            seeds: ['monster hunter wilds', 'elden ring dlc build', 'black myth wukong', 'witcher 4 news'],
          },
        ],
      },
      {
        id: 'creative-sandbox',
        name: 'Sandbox & Battle Royale',
        subNiches: [
          {
            id: 'minecraft',
            name: 'Minecraft & Sandbox',
            seeds: ['minecraft 1.22 update', 'minecraft hardcore 100 days', 'roblox blox fruits', 'roblox studio game'],
          },
          {
            id: 'esports-shooters',
            name: 'Competitive Shooters',
            seeds: ['valorant new agent', 'fortnite chapter 6', 'warzone meta loadout', 'counter strike 2'],
          },
        ],
      },
    ],
  },
  {
    id: 'creator-growth',
    name: 'Creator Economy & Media',
    icon: 'Video',
    subNiches: [
      {
        id: 'youtube-growth',
        name: 'YouTube Strategy & Analytics',
        subNiches: [
          {
            id: 'algorithm-ctr',
            name: 'Algorithm, CTR & Retention',
            seeds: ['youtube algorithm update 2026', 'high ctr thumbnail design', 'how to get first 1000 subscribers', 'youtube shorts monetization'],
          },
          {
            id: 'video-editing',
            name: 'Editing & Production',
            seeds: ['davinci resolve 19 tutorial', 'capcut pc tricks', 'premiere pro sound design', 'b roll video editing'],
          },
        ],
      },
    ],
  },
];
