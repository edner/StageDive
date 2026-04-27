const { Jimp, intToRGBA } = require('jimp');
const path = require('path');

const sourcePath =
  process.argv[2] || '/Users/ednerpizarro/Desktop/StageDiveResources/Rails.png';
const outputDir = process.argv[3] || path.join(__dirname, 'public/assets');

const OUTPUT_SIZE = 1254;

const resources = [
  {
    name: 'broken_rail',
    crop: { x: 0, y: 0, w: 1000, h: 640 },
    targetWidth: 1120,
    offsetY: 18
  },
  {
    name: 'rail',
    crop: { x: 930, y: 0, w: 996, h: 721 },
    targetWidth: 1120,
    offsetY: 36
  }
];

function isGreenHalo(pixel) {
  return (
    pixel.a > 0 &&
    pixel.a <= 180 &&
    pixel.g >= pixel.r + 28 &&
    pixel.g >= pixel.b + 28
  );
}

function cleanGreenHalo(image) {
  const { width, height } = image.bitmap;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = intToRGBA(image.getPixelColor(x, y));
      if (!isGreenHalo(pixel)) {
        continue;
      }

      image.setPixelColor(0x00000000, x, y);
    }
  }
}

async function buildRailAsset(source, resource) {
  const sprite = source.clone().crop(resource.crop);

  cleanGreenHalo(sprite);
  sprite.autocrop();
  cleanGreenHalo(sprite);

  const scale = resource.targetWidth / sprite.bitmap.width;
  sprite.resize({
    w: Math.round(sprite.bitmap.width * scale),
    h: Math.round(sprite.bitmap.height * scale)
  });

  const canvas = new Jimp({
    width: OUTPUT_SIZE,
    height: OUTPUT_SIZE,
    color: 0x00000000
  });

  const offsetX = Math.round((OUTPUT_SIZE - sprite.bitmap.width) / 2);
  const offsetY = Math.round((OUTPUT_SIZE - sprite.bitmap.height) / 2 + resource.offsetY);
  canvas.composite(sprite, offsetX, offsetY);

  await canvas.write(path.join(outputDir, `${resource.name}.png`));
  console.log(`Saved ${resource.name}.png`);
}

async function main() {
  const source = await Jimp.read(sourcePath);

  for (const resource of resources) {
    await buildRailAsset(source, resource);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
