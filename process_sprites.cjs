const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

const inputFiles = {
  'player': '/Users/ednerpizarro/.gemini/antigravity/brain/eb1d9322-8955-4300-ad2f-aa33807f06ac/player_sprite_1777147555219.png',
  'crowd': '/Users/ednerpizarro/.gemini/antigravity/brain/eb1d9322-8955-4300-ad2f-aa33807f06ac/crowd_sprite_1777147567826.png',
  'security': '/Users/ednerpizarro/.gemini/antigravity/brain/eb1d9322-8955-4300-ad2f-aa33807f06ac/security_sprite_1777147580640.png',
  'band': '/Users/ednerpizarro/.gemini/antigravity/brain/eb1d9322-8955-4300-ad2f-aa33807f06ac/band_sprite_1777147595779.png'
};

const outputDir = '/Users/ednerpizarro/StageDive/public/assets';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function processImages() {
  for (const [name, file] of Object.entries(inputFiles)) {
    try {
      console.log(`Processing ${name}...`);
      const image = await Jimp.read(file);
      
      const targetColor = { r: 0, g: 0, b: 0, a: 255 };
      const colorDistance = (c1, c2) => {
          return Math.sqrt(
              Math.pow(c1.r - c2.r, 2) +
              Math.pow(c1.g - c2.g, 2) +
              Math.pow(c1.b - c2.b, 2)
          );
      };

      image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        const a = this.bitmap.data[idx + 3];

        if (colorDistance({r,g,b,a}, targetColor) <= 40) {
            this.bitmap.data[idx + 3] = 0; 
        }
      });
      
      // Auto crop transparent edges
      image.autocrop();
      
      // Resize down to something manageable
      image.resize({ w: 64 });
      
      await image.write(`${outputDir}/${name}.png`);
      console.log(`Saved ${name}.png`);
    } catch (e) {
      console.error(`Error processing ${name}:`, e);
    }
  }
}

processImages();
