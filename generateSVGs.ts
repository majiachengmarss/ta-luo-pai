import fs from 'fs';
import path from 'path';

// Helper to generate roman numerals for Minor Arcana
function toRoman(num: number): string {
    if (num === 1) return 'ACE';
    if (num === 11) return 'PAGE';
    if (num === 12) return 'KNIGHT';
    if (num === 13) return 'QUEEN';
    if (num === 14) return 'KING';
    const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return roman[num] || num.toString();
}

const MAJOR_ARCANA = [
  { id: '00', name: 'The Fool', num: '0' },
  { id: '01', name: 'The Magician', num: 'I' },
  { id: '02', name: 'The High Priestess', num: 'II' },
  { id: '03', name: 'The Empress', num: 'III' },
  { id: '04', name: 'The Emperor', num: 'IV' },
  { id: '05', name: 'The Hierophant', num: 'V' },
  { id: '06', name: 'The Lovers', num: 'VI' },
  { id: '07', name: 'The Chariot', num: 'VII' },
  { id: '08', name: 'Strength', num: 'VIII' },
  { id: '09', name: 'The Hermit', num: 'IX' },
  { id: '10', name: 'Wheel of Fortune', num: 'X' },
  { id: '11', name: 'Justice', num: 'XI' },
  { id: '12', name: 'The Hanged Man', num: 'XII' },
  { id: '13', name: 'Death', num: 'XIII' },
  { id: '14', name: 'Temperance', num: 'XIV' },
  { id: '15', name: 'The Devil', num: 'XV' },
  { id: '16', name: 'The Tower', num: 'XVI' },
  { id: '17', name: 'The Star', num: 'XVII' },
  { id: '18', name: 'The Moon', num: 'XVIII' },
  { id: '19', name: 'The Sun', num: 'XIX' },
  { id: '20', name: 'Judgement', num: 'XX' },
  { id: '21', name: 'The World', num: 'XXI' }
];

const SUITS = [
    { prefix: 'wands', name: 'WANDS', color1: '#7c2d12', color2: '#f59e0b', symbol: '✦' }, // Fire
    { prefix: 'cups', name: 'CUPS', color1: '#1e3a8a', color2: '#3b82f6', symbol: '♥' },   // Water
    { prefix: 'swords', name: 'SWORDS', color1: '#374151', color2: '#9ca3af', symbol: '⚔' }, // Air
    { prefix: 'pentacles', name: 'PENTACLES', color1: '#14532d', color2: '#10b981', symbol: '❂' } // Earth
];

const CARDS: any[] = [...MAJOR_ARCANA.map(c => ({...c, type: 'major'}))];

for (const suit of SUITS) {
    for (let i = 1; i <= 14; i++) {
        CARDS.push({
            id: `${suit.prefix}_${i}`,
            name: `${toRoman(i)} OF ${suit.name}`,
            num: toRoman(i),
            type: 'minor',
            suit: suit
        });
    }
}

const dir = path.join(process.cwd(), 'public', 'assets', 'cards');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

function generateSVG(card: any) {
  const isMajor = card.type === 'major';
  const c1 = isMajor ? '#1e1b4b' : card.suit.color1;
  const c2 = isMajor ? '#4c1d95' : card.suit.color2;
  const accent = isMajor ? '#fbbf24' : '#ffffff';
  const symbol = isMajor ? '✧' : card.suit.symbol;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 700">
    <defs>
      <linearGradient id="grad${card.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${c1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${c2};stop-opacity:1" />
      </linearGradient>
      <radialGradient id="glow${card.id}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:${accent};stop-opacity:0.3" />
        <stop offset="100%" style="stop-color:${c1};stop-opacity:0" />
      </radialGradient>
    </defs>
    <rect width="400" height="700" fill="url(#grad${card.id})" rx="20"/>
    <rect width="400" height="700" fill="url(#glow${card.id})" rx="20"/>
    
    <!-- Outer borders -->
    <path d="M 40 40 L 360 40 L 360 660 L 40 660 Z" fill="none" stroke="${accent}" stroke-width="3" opacity="0.6" rx="10"/>
    <path d="M 50 50 L 350 50 L 350 650 L 50 650 Z" fill="none" stroke="${accent}" stroke-width="1" opacity="0.3" rx="5"/>
    
    <!-- Central geometry -->
    <circle cx="200" cy="350" r="150" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="4 8" opacity="0.5"/>
    <circle cx="200" cy="350" r="130" fill="none" stroke="${accent}" stroke-width="1" opacity="0.3"/>
    
    <!-- Suit Symbol / Mystic icon -->
    <text x="200" y="200" font-family="sans-serif" font-size="60" fill="${accent}" text-anchor="middle" dominant-baseline="middle" opacity="0.4">${symbol}</text>
    <text x="200" y="500" font-family="sans-serif" font-size="60" fill="${accent}" text-anchor="middle" dominant-baseline="middle" opacity="0.4">${symbol}</text>

    <!-- Particles -->
    <g fill="${accent}" opacity="0.8">
      <circle cx="80" cy="150" r="2"/><circle cx="320" cy="200" r="1"/><circle cx="100" cy="500" r="1.5"/><circle cx="300" cy="600" r="2"/>
      <circle cx="150" cy="100" r="1"/><circle cx="350" cy="400" r="2"/><circle cx="50" cy="350" r="1.5"/>
    </g>

    <!-- Text content -->
    <text x="200" y="330" font-family="serif" font-size="${card.num.length > 3 ? 50 : 80}" font-weight="bold" fill="${accent}" text-anchor="middle" dominant-baseline="middle" opacity="0.9">${card.num}</text>
    <text x="200" y="440" font-family="serif" font-size="18" font-weight="normal" fill="${accent}" text-anchor="middle" dominant-baseline="middle" letter-spacing="4">${card.name.toUpperCase()}</text>
  </svg>`;
}

for (const card of CARDS) {
  fs.writeFileSync(path.join(dir, `card_${card.id}.svg`), generateSVG(card));
}
console.log('Successfully generated all 78 mystic SVG Tarot cards locally!');
