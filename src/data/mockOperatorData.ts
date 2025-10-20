
import { OperatorData, NostrPost, Node } from '@/types/operator';

const names = ['Alex Chen', 'Sarah Martinez', 'David Kumar', 'Emma Thompson', 'Michael Rodriguez', 'Lisa Wang', 'James Wilson', 'Maria Garcia'];
const displayNames = ['alextech', 'sarah_ops', 'dkumar', 'emmanode', 'mrodriguez', 'lisatech', 'jameswilson', 'mariaops'];
const bios = [
  'Infrastructure engineer and Nostr enthusiast. Running nodes across 5 continents. Building the decentralized future, one relay at a time.',
  'DevOps specialist focused on network reliability. Passionate about decentralized protocols and blockchain infrastructure.',
  'Full-stack developer maintaining critical network infrastructure. Love contributing to open-source Nostr projects.',
  'Network architect with 10+ years experience. Dedicated to building robust, scalable decentralized systems.',
  'Security researcher and node operator. Specializing in cryptographic protocols and distributed network security.',
  'Systems administrator running enterprise-grade Nostr infrastructure. Committed to network decentralization.',
  'Blockchain developer and infrastructure enthusiast. Operating high-performance nodes for the Nostr ecosystem.',
  'Platform engineer focused on reliability and performance. Building the foundation for tomorrow\'s internet.'
];
const websites = ['alextech.dev', 'sarahops.io', 'dkumar.tech', 'emmanode.com', 'mrodriguez.dev', 'lisatech.net', 'jameswilson.co', 'mariaops.dev'];
const locations = ['San Francisco, CA', 'London, UK', 'Tokyo, Japan', 'Berlin, Germany', 'Sydney, Australia', 'Toronto, CA', 'Singapore', 'Amsterdam, NL'];
const geoHashes = ['9q8yy1dc37', 'gcpuvpk5c', 'xn774c06kx', 'u33db8ce0n', 'r3gx2f9tt5', 'dpz83b9f9b', 'w21z74j6m8', 'u173zq7mq5'];

export const generateMockOperatorData = (npub: string): OperatorData => {
  const hash = npub.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const nameIndex = hash % names.length;
  const followerCount = 500 + (hash % 2000);
  const followingCount = 200 + (hash % 800);
  const isVerified = hash % 3 !== 0;
  const yearsActive = 1 + (hash % 5);
  const completedChecks = 1000 + (hash % 9000);

  return {
    npub: npub || 'npub1xyz123abc456def789012345678901234567890abcdef1234567890abcdef',
    pubkey: npub ? npub.substring(5) : 'xyz123abc456def789012345678901234567890abcdef1234567890abcdef',
    profile: {
      name: names[nameIndex],
      display_name: displayNames[nameIndex],
      about: bios[nameIndex],
      picture: `https://images.unsplash.com/photo-${1500000000 + (hash % 100000000)}?w=150&h=150&fit=crop&crop=face`,
      website: `https://${websites[nameIndex]}`,
      nip05: `${displayNames[nameIndex]}@${websites[nameIndex]}`,
      lud16: `${displayNames[nameIndex]}@getalby.com`,
      location: locations[nameIndex]
    },
    followers: followerCount,
    following: followingCount,
    isVerified,
    yearsActive,
    completedChecks,
    geoHash: geoHashes[nameIndex],
    created_at: 1640995200 + (hash % 31536000)
  };
};

export const generateMockPosts = (npub: string, operatorName: string): NostrPost[] => {
  const hash = npub.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const postTemplates = [
    [
      'Just deployed a new relay node in Tokyo! Network coverage in Asia is getting stronger 🚀 #nostr #infrastructure',
      'Interesting patterns in network traffic today. Seeing 40% increase in European relay usage. The decentralized web is growing! 📈',
      'Running maintenance on NYC-001 tonight at 3AM EST. Expected downtime: 15 minutes. Thanks for your patience! 🔧'
    ],
    [
      'Successfully migrated all nodes to the latest Nostr implementation. Performance improvements are incredible! ⚡',
      'Working on a new monitoring dashboard for network operators. Open source release coming soon 👨‍💻',
      'Network uptime hit 99.95% this month across all my nodes. Proud of the reliability we\'re achieving! 📊'
    ],
    [
      'Experimenting with new load balancing techniques. Early results show 30% better response times 🔧',
      'Just published a technical deep-dive on Nostr relay optimization. Link in bio! 📝',
      'Community meetup was amazing! Met so many talented developers working on Nostr infrastructure 🤝'
    ],
    [
      'Deployed redundant nodes in three new regions today. Decentralization through geographic distribution! 🌍',
      'Security audit completed successfully. All nodes are hardened and ready for increased traffic 🔒',
      'Celebrating 1 year of running Nostr infrastructure! What a journey it has been 🎉'
    ]
  ];
  
  const templateIndex = hash % postTemplates.length;
  const posts = postTemplates[templateIndex];
  
  return posts.map((content, index) => ({
    id: `mock_${npub}_${index}`,
    content,
    created_at: Date.now() - (index * 86400000), // Days ago
    npub,
    likes: 20 + ((hash + index) % 150),
    reposts: 5 + ((hash + index) % 30),
    replies: 3 + ((hash + index) % 20),
    timestamp: ['2 hours ago', '1 day ago', '2 days ago'][index]
  }));
};

export const generateMockNodes = (npub: string): Node[] => {
  const hash = npub.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const cities = ['NYC', 'LON', 'TKY', 'PAR', 'SYD', 'SIN', 'FRA', 'LAX', 'CHI', 'MIA'];
  const statuses: ('online' | 'offline' | 'maintenance')[] = ['online', 'online', 'online', 'maintenance', 'offline'];
  
  const nodeCount = 2 + (hash % 4); // 2-5 nodes
  const nodes: Node[] = [];
  
  for (let i = 0; i < nodeCount; i++) {
    const nodeHash = hash + i;
    const cityIndex = nodeHash % cities.length;
    const statusIndex = nodeHash % statuses.length;
    const uptime = 95 + (nodeHash % 5) + (Math.random() * 0.9);
    
    nodes.push({
      id: i + 1,
      name: `Node-${cities[cityIndex]}-${String(i + 1).padStart(3, '0')}`,
      type: 'Server',
      location: `${cities[cityIndex]}, ${getCityCountry(cities[cityIndex])}`,
      status: statuses[statusIndex],
      uptime: `${uptime.toFixed(1)}%`,
      npub
    });
  }
  
  return nodes;
};

const getCityCountry = (city: string): string => {
  const cityMap: { [key: string]: string } = {
    'NYC': 'USA', 'LON': 'UK', 'TKY': 'Japan', 'PAR': 'France',
    'SYD': 'Australia', 'SIN': 'Singapore', 'FRA': 'Germany',
    'LAX': 'USA', 'CHI': 'USA', 'MIA': 'USA'
  };
  return cityMap[city] || 'Unknown';
};
