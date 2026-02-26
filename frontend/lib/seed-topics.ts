export const seedTopics = [
  'Elon Musk',
  'Bitcoin',
  'Artificial Intelligence',
  'Donald Trump',
  'Climate Change',
  'COVID-19',
  'SpaceX',
  'Tesla',
  'ChatGPT',
  'Quantum Computing',
  'Joe Biden',
  'Ukraine',
  'Palestine',
  'iPhone',
  'Mars',
  'Nuclear Energy',
  'Web3',
  'Blockchain',
  'Virtual Reality',
  'Social Media',
  'Renewable Energy',
  'Electric Vehicles',
  'Cryptocurrency',
  'Machine Learning',
  'Metaverse',
  'NFT',
  'Autonomous Vehicles',
  'Gene Editing',
  'Space Exploration',
  'Cybersecurity',
];

export interface TopicCategory {
  slug: string;
  name: string;
  description: string;
  topics: string[];
}

export const topicCategories: TopicCategory[] = [
  {
    slug: 'politics',
    name: 'Politics',
    description: 'Compare how Wikipedia and Grokipedia cover political figures, conflicts, and geopolitical events.',
    topics: ['Donald Trump', 'Joe Biden', 'Ukraine', 'Palestine'],
  },
  {
    slug: 'technology',
    name: 'Technology',
    description: 'See how traditional and AI-powered encyclopedias describe AI, computing, and tech innovations.',
    topics: ['Artificial Intelligence', 'ChatGPT', 'Machine Learning', 'Quantum Computing', 'Cybersecurity', 'iPhone', 'Virtual Reality', 'Social Media'],
  },
  {
    slug: 'science',
    name: 'Science',
    description: 'Explore differences in how Wikipedia and Grokipedia present scientific topics and discoveries.',
    topics: ['Climate Change', 'COVID-19', 'Mars', 'Nuclear Energy', 'Gene Editing', 'Space Exploration', 'Renewable Energy'],
  },
  {
    slug: 'crypto-finance',
    name: 'Crypto & Finance',
    description: 'Compare coverage of cryptocurrency, blockchain technology, and the future of decentralized finance.',
    topics: ['Bitcoin', 'Cryptocurrency', 'Blockchain', 'NFT', 'Web3', 'Metaverse'],
  },
  {
    slug: 'business',
    name: 'Business & Innovation',
    description: 'See how encyclopedias cover major companies, entrepreneurs, and emerging industries.',
    topics: ['Elon Musk', 'SpaceX', 'Tesla', 'Electric Vehicles', 'Autonomous Vehicles'],
  },
];
