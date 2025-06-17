import { NewsArticle } from '../types';

export const categories = [
  'Technology',
  'Business',
  'Science',
  'Health',
  'Sports',
  'Entertainment',
  'Politics',
  'World',
  'Environment',
  'Education'
];

export const mockNews: NewsArticle[] = [
  {
    id: '1',
    title: 'Revolutionary AI Breakthrough Changes Healthcare Landscape',
    summary: 'New artificial intelligence system demonstrates unprecedented accuracy in medical diagnosis, promising to transform patient care worldwide.',
    content: 'A groundbreaking artificial intelligence system has been developed that can diagnose medical conditions with 95% accuracy, surpassing human doctors in many cases. This revolutionary technology uses advanced machine learning algorithms to analyze medical images, patient histories, and symptoms to provide rapid and accurate diagnoses. The system has been tested across multiple hospitals and has shown remarkable results in detecting cancer, heart disease, and rare conditions that are often missed by traditional diagnostic methods.',
    author: 'Dr. Sarah Chen',
    publishedAt: '2024-01-15T10:30:00Z',
    imageUrl: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Technology',
    tags: ['AI', 'Healthcare', 'Innovation', 'Medical'],
    source: 'TechHealth Today',
    readTime: 8
  },
  {
    id: '2',
    title: 'Global Climate Summit Reaches Historic Agreement',
    summary: 'World leaders unite on ambitious climate action plan with unprecedented funding commitments for renewable energy transition.',
    content: 'In a landmark decision, 195 countries have agreed to an ambitious climate action plan that includes a $500 billion fund for renewable energy infrastructure. The agreement, reached after intense negotiations, sets binding targets for carbon emission reductions and establishes a global carbon trading system. Environmental leaders are calling it the most significant climate agreement since the Paris Accord, with implementation beginning immediately.',
    author: 'Maria Rodriguez',
    publishedAt: '2024-01-15T08:45:00Z',
    imageUrl: 'https://images.pexels.com/photos/9324336/pexels-photo-9324336.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Environment',
    tags: ['Climate', 'Politics', 'Global', 'Energy'],
    source: 'Environmental News Network',
    readTime: 12
  },
  {
    id: '3',
    title: 'Quantum Computing Milestone: First Commercial Applications Launch',
    summary: 'Tech giants announce the first commercial quantum computing applications, marking a new era in computational capabilities.',
    content: 'Major technology companies have successfully launched the first commercial quantum computing applications, focusing on financial modeling, drug discovery, and logistics optimization. These applications demonstrate quantum supremacy in solving complex problems that would take classical computers thousands of years to complete. The breakthrough represents a pivotal moment in the quantum computing industry, with practical applications now available to enterprises worldwide.',
    author: 'James Wilson',
    publishedAt: '2024-01-14T16:20:00Z',
    imageUrl: 'https://images.pexels.com/photos/5474028/pexels-photo-5474028.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Technology',
    tags: ['Quantum', 'Computing', 'Innovation', 'Enterprise'],
    source: 'Quantum Tech Weekly',
    readTime: 10
  },
  {
    id: '4',
    title: 'Space Tourism Takes Off: First Civilian Mission to Mars Announced',
    summary: 'Private space company reveals plans for the first civilian mission to Mars, with tickets now available for wealthy adventurers.',
    content: 'SpaceVenture has announced plans for the first civilian mission to Mars, scheduled for 2028. The 9-month journey will accommodate 12 passengers in a state-of-the-art spacecraft equipped with artificial gravity and luxury amenities. Tickets are priced at $50 million per person, with training beginning 18 months before departure. The mission represents a major milestone in commercial space travel and Mars exploration.',
    author: 'Alex Thompson',
    publishedAt: '2024-01-14T14:15:00Z',
    imageUrl: 'https://images.pexels.com/photos/586063/pexels-photo-586063.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Science',
    tags: ['Space', 'Tourism', 'Mars', 'Innovation'],
    source: 'Space Explorer Magazine',
    readTime: 7
  },
  {
    id: '5',
    title: 'Breakthrough in Renewable Energy Storage Revolutionizes Grid Systems',
    summary: 'New battery technology promises to solve the intermittency problem of renewable energy sources with 10x storage capacity.',
    content: 'Scientists have developed a revolutionary battery technology that can store renewable energy for weeks rather than hours, solving one of the biggest challenges in clean energy adoption. The new solid-state batteries use advanced materials to achieve 10 times the storage capacity of current lithium-ion batteries while being completely recyclable. This breakthrough could accelerate the global transition to renewable energy by making solar and wind power available 24/7.',
    author: 'Dr. Emily Foster',
    publishedAt: '2024-01-14T11:30:00Z',
    imageUrl: 'https://images.pexels.com/photos/9800029/pexels-photo-9800029.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Environment',
    tags: ['Energy', 'Battery', 'Renewable', 'Innovation'],
    source: 'Clean Energy Report',
    readTime: 9
  },
  {
    id: '6',
    title: 'Mental Health Revolution: AI Therapist Shows Promising Results',
    summary: 'Clinical trials reveal that AI-powered therapy sessions are as effective as human therapists for treating anxiety and depression.',
    content: 'A comprehensive study involving 10,000 participants has shown that AI-powered therapy sessions are equally effective as human therapists in treating anxiety and depression. The AI system, trained on millions of therapy sessions, provides 24/7 support and personalized treatment plans. This breakthrough could address the global mental health crisis by making therapy accessible to millions who cannot afford or access traditional treatment.',
    author: 'Dr. Michael Park',
    publishedAt: '2024-01-13T15:45:00Z',
    imageUrl: 'https://images.pexels.com/photos/7176319/pexels-photo-7176319.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Health',
    tags: ['Mental Health', 'AI', 'Therapy', 'Healthcare'],
    source: 'Mental Health Innovation',
    readTime: 11
  },
  {
    id: '7',
    title: 'Cryptocurrency Market Reaches New Heights Amid Institutional Adoption',
    summary: 'Major financial institutions embrace digital currencies, driving market capitalization to unprecedented levels.',
    content: 'The cryptocurrency market has reached a new all-time high with a total market capitalization exceeding $5 trillion, driven by widespread institutional adoption. Major banks, insurance companies, and pension funds are now allocating significant portions of their portfolios to digital assets. Regulatory clarity in major economies has boosted confidence, leading to the launch of numerous crypto-based financial products and services.',
    author: 'Robert Kim',
    publishedAt: '2024-01-13T12:00:00Z',
    imageUrl: 'https://images.pexels.com/photos/8370752/pexels-photo-8370752.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Business',
    tags: ['Cryptocurrency', 'Finance', 'Investment', 'Markets'],
    source: 'Financial Times Digital',
    readTime: 6
  },
  {
    id: '8',
    title: 'Gene Therapy Cures Rare Disease in Landmark Clinical Trial',
    summary: 'Innovative gene editing treatment successfully cures patients with previously incurable genetic disorder.',
    content: 'A groundbreaking gene therapy trial has successfully cured 50 patients with a rare genetic disorder that was previously considered incurable. The CRISPR-based treatment directly edits faulty genes in patients\' cells, providing a permanent cure rather than temporary symptom management. This success opens the door for treating thousands of other genetic diseases and represents a major advancement in personalized medicine.',
    author: 'Dr. Lisa Chang',
    publishedAt: '2024-01-12T17:30:00Z',
    imageUrl: 'https://images.pexels.com/photos/3938023/pexels-photo-3938023.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Health',
    tags: ['Gene Therapy', 'CRISPR', 'Medical', 'Breakthrough'],
    source: 'Medical Research Today',
    readTime: 13
  }
];