const { Jimp, intToRGBA } = require('jimp');
const path = require('path');

const sourcePath =
  process.argv[2] ||
  '/Users/ednerpizarro/Downloads/Gemini_Generated_Image_abd6l9abd6l9abd6.png';
const outputPath = process.argv[3] || path.join(__dirname, 'public/assets/security-chaser-sheet.png');

const FRAME_WIDTH = 96;
const FRAME_HEIGHT = 96;
const INNER_WIDTH = 74;
const INNER_HEIGHT = 82;
const COLUMNS = 4;
const BASE_SOURCE_WIDTH = 2390;
const BASE_SOURCE_HEIGHT = 1792;

const frameCrops = [
  { name: 'idle-front', x: 372, y: 130, w: 352, h: 390 },
  { name: 'idle-back', x: 744, y: 130, w: 352, h: 390 },
  { name: 'idle-left', x: 1174, y: 130, w: 344, h: 390 },
  { name: 'idle-right', x: 1588, y: 130, w: 344, h: 390 },
  { name: 'walk-front-1', x: 20, y: 540, w: 280, h: 345 },
  { name: 'walk-front-2', x: 330, y: 540, w: 250, h: 345 },
  { name: 'walk-back-1', x: 596, y: 540, w: 300, h: 345 },
  { name: 'walk-back-2', x: 900, y: 540, w: 300, h: 345 },
  { name: 'walk-left-1', x: 1170, y: 540, w: 320, h: 350 },
  { name: 'walk-left-2', x: 1445, y: 540, w: 320, h: 350 },
  { name: 'walk-right-1', x: 1760, y: 540, w: 320, h: 350 },
  { name: 'walk-right-2', x: 2035, y: 540, w: 320, h: 350 }
];

function colorDistance(a, b) {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) +
      Math.pow(a.g - b.g, 2) +
      Math.pow(a.b - b.b, 2)
  );
}

function getPixel(image, x, y) {
  const color = image.getPixelColor(x, y);
  return intToRGBA(color);
}

function brightness(pixel) {
  return (pixel.r + pixel.g + pixel.b) / 3;
}

function channelSpread(pixel) {
  return Math.max(pixel.r, pixel.g, pixel.b) - Math.min(pixel.r, pixel.g, pixel.b);
}

function isBackground(pixel) {
  return channelSpread(pixel) <= 24 && brightness(pixel) >= 130;
}

function removeBackground(image) {
  const { width, height } = image.bitmap;
  const visited = new Uint8Array(width * height);
  const queue = [];

  const enqueue = (x, y) => {
    const idx = y * width + x;
    if (visited[idx]) {
      return;
    }

    const pixel = getPixel(image, x, y);
    if (!isBackground(pixel)) {
      return;
    }

    visited[idx] = 1;
    queue.push([x, y]);
  };

  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }

  for (let y = 1; y < height - 1; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    image.setPixelColor(0x00000000, x, y);

    if (x > 0) enqueue(x - 1, y);
    if (x < width - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < height - 1) enqueue(x, y + 1);
  }

  const islandVisited = new Uint8Array(width * height);

  const collectIsland = (startX, startY) => {
    const pixels = [];
    const islandQueue = [[startX, startY]];
    islandVisited[startY * width + startX] = 1;

    while (islandQueue.length > 0) {
      const [x, y] = islandQueue.shift();
      pixels.push([x, y]);

      const neighbors = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1]
      ];

      for (const [nextX, nextY] of neighbors) {
        if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
          continue;
        }

        const nextIndex = nextY * width + nextX;
        if (islandVisited[nextIndex]) {
          continue;
        }

        islandVisited[nextIndex] = 1;
        const nextPixel = getPixel(image, nextX, nextY);
        if (!isBackground(nextPixel)) {
          continue;
        }

        islandQueue.push([nextX, nextY]);
      }
    }

    return pixels;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (islandVisited[index]) {
        continue;
      }

      const pixel = getPixel(image, x, y);
      if (!isBackground(pixel)) {
        islandVisited[index] = 1;
        continue;
      }

      const island = collectIsland(x, y);
      if (island.length > 24) {
        continue;
      }

      for (const [px, py] of island) {
        image.setPixelColor(0x00000000, px, py);
      }
    }
  }
}

function scaleCrop(crop, sourceWidth, sourceHeight) {
  const scaleX = sourceWidth / BASE_SOURCE_WIDTH;
  const scaleY = sourceHeight / BASE_SOURCE_HEIGHT;

  return {
    name: crop.name,
    x: Math.round(crop.x * scaleX),
    y: Math.round(crop.y * scaleY),
    w: Math.round(crop.w * scaleX),
    h: Math.round(crop.h * scaleY)
  };
}

async function buildFrameSheet() {
  const source = await Jimp.read(sourcePath);
  const rows = Math.ceil(frameCrops.length / COLUMNS);
  const sheet = new Jimp({
    width: FRAME_WIDTH * COLUMNS,
    height: FRAME_HEIGHT * rows,
    color: 0x00000000
  });

  for (let index = 0; index < frameCrops.length; index++) {
    const crop = scaleCrop(frameCrops[index], source.bitmap.width, source.bitmap.height);
    const sprite = source.clone().crop({
      x: crop.x,
      y: crop.y,
      w: crop.w,
      h: crop.h
    });

    removeBackground(sprite);
    sprite.autocrop();

    const scale = Math.min(
      INNER_WIDTH / sprite.bitmap.width,
      INNER_HEIGHT / sprite.bitmap.height
    );

    sprite.resize({
      w: Math.max(1, Math.round(sprite.bitmap.width * scale)),
      h: Math.max(1, Math.round(sprite.bitmap.height * scale))
    });

    const frame = new Jimp({
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
      color: 0x00000000
    });

    const offsetX = Math.round((FRAME_WIDTH - sprite.bitmap.width) / 2);
    const offsetY = FRAME_HEIGHT - sprite.bitmap.height - 8;

    frame.composite(sprite, offsetX, offsetY);

    const frameX = (index % COLUMNS) * FRAME_WIDTH;
    const frameY = Math.floor(index / COLUMNS) * FRAME_HEIGHT;
    sheet.composite(frame, frameX, frameY);

    console.log(`Built frame ${index}: ${crop.name}`);
  }

  await sheet.write(outputPath);
  console.log(`Saved ${outputPath}`);
}

buildFrameSheet().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
