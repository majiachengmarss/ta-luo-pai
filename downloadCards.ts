import fs from 'fs';
import path from 'path';
import https from 'https';

const CARDS = [
  { id: '00', url: 'https://upload.wikimedia.org/wikipedia/en/9/90/RWS_Tarot_00_Fool.jpg' },
  { id: '01', url: 'https://upload.wikimedia.org/wikipedia/en/d/de/RWS_Tarot_01_Magician.jpg' },
  { id: '02', url: 'https://upload.wikimedia.org/wikipedia/en/8/88/RWS_Tarot_02_High_Priestess.jpg' },
  { id: '03', url: 'https://upload.wikimedia.org/wikipedia/en/d/d2/RWS_Tarot_03_Empress.jpg' },
  { id: '04', url: 'https://upload.wikimedia.org/wikipedia/en/c/c3/RWS_Tarot_04_Emperor.jpg' },
  { id: '05', url: 'https://upload.wikimedia.org/wikipedia/en/8/8d/RWS_Tarot_05_Hierophant.jpg' },
  { id: '06', url: 'https://upload.wikimedia.org/wikipedia/en/d/db/RWS_Tarot_06_Lovers.jpg' },
  { id: '07', url: 'https://upload.wikimedia.org/wikipedia/en/9/9b/RWS_Tarot_07_Chariot.jpg' },
  { id: '08', url: 'https://upload.wikimedia.org/wikipedia/en/f/f5/RWS_Tarot_08_Strength.jpg' },
  { id: '09', url: 'https://upload.wikimedia.org/wikipedia/en/4/4d/RWS_Tarot_09_Hermit.jpg' },
  { id: '10', url: 'https://upload.wikimedia.org/wikipedia/en/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg' },
  { id: '11', url: 'https://upload.wikimedia.org/wikipedia/en/e/e0/RWS_Tarot_11_Justice.jpg' },
  { id: '12', url: 'https://upload.wikimedia.org/wikipedia/en/2/2b/RWS_Tarot_12_Hanged_Man.jpg' },
  { id: '13', url: 'https://upload.wikimedia.org/wikipedia/en/d/d7/RWS_Tarot_13_Death.jpg' },
  { id: '14', url: 'https://upload.wikimedia.org/wikipedia/en/f/f8/RWS_Tarot_14_Temperance.jpg' },
  { id: '15', url: 'https://upload.wikimedia.org/wikipedia/en/5/55/RWS_Tarot_15_Devil.jpg' },
  { id: '16', url: 'https://upload.wikimedia.org/wikipedia/en/5/53/RWS_Tarot_16_Tower.jpg' },
  { id: '17', url: 'https://upload.wikimedia.org/wikipedia/en/c/cd/RWS_Tarot_17_Star.jpg' },
  { id: '18', url: 'https://upload.wikimedia.org/wikipedia/en/7/7f/RWS_Tarot_18_Moon.jpg' },
  { id: '19', url: 'https://upload.wikimedia.org/wikipedia/en/1/17/RWS_Tarot_19_Sun.jpg' },
  { id: '20', url: 'https://upload.wikimedia.org/wikipedia/en/d/dd/RWS_Tarot_20_Judgement.jpg' },
  { id: '21', url: 'https://upload.wikimedia.org/wikipedia/en/f/ff/RWS_Tarot_21_World.jpg' }
];

const dir = path.join(process.cwd(), 'public', 'assets', 'cards');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

const download = (url: string, dest: string) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = https.get(url, options, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          // Handle redirect
          https.get(response.headers.location, options, (res2) => {
              res2.pipe(file);
              res2.on('end', () => resolve(true));
          }).on('error', reject);
          return;
      }
      
      if (response.statusCode !== 200) {
          reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
          return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
    
    // Set a timeout to prevent hanging
    request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error(`Request timeout for ${url}`));
    });
  });
};

async function run() {
  console.log('Downloading 22 Major Arcana cards with Browser spoofing...');
  for (const card of CARDS) {
    const dest = path.join(dir, `card_${card.id}.jpg`);
    if (!fs.existsSync(dest) || fs.statSync(dest).size === 0) {
        try {
            await download(card.url, dest);
            console.log(`Downloaded: card_${card.id}.jpg`);
            // Add a small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 500));
        } catch (e: any) {
            console.error(`Failed to download ${card.id}:`, e.message);
        }
    } else {
        console.log(`Skipped (already exists): card_${card.id}.jpg`);
    }
  }
  console.log('Download process finished!');
}

run();
