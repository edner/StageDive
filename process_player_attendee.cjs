const { Jimp, ResizeStrategy, intToRGBA, rgbaToInt } = require('jimp');
const path = require('path');

const sourcePath =
  process.argv[2] ||
  '/Users/ednerpizarro/Desktop/StageDiveResources/Player_SpriteSheet.png';
const outputPath =
  process.argv[3] || path.join(__dirname, 'public/assets/player-attendee-sheet.png');

const FRAME_WIDTH = 144;
const FRAME_HEIGHT = 128;
const INNER_WIDTH = 126;
const INNER_HEIGHT = 114;
const COLUMNS = 4;

const frameCrops = [
  { name: 'idle-front', x: 145, y: 0, w: 190, h: 250 },
  { name: 'idle-back', x: 430, y: 0, w: 190, h: 250 },
  { name: 'idle-left', x: 720, y: 0, w: 170, h: 250 },
  { name: 'idle-right', x: 1045, y: 0, w: 170, h: 250 },
  { name: 'walk-front-1', x: 0, y: 340, w: 170, h: 250 },
  { name: 'walk-front-2', x: 185, y: 340, w: 170, h: 250 },
  { name: 'walk-back-1', x: 375, y: 340, w: 160, h: 250 },
  { name: 'walk-back-2', x: 555, y: 340, w: 160, h: 250 },
  { name: 'walk-left-1', x: 740, y: 345, w: 145, h: 245 },
  { name: 'walk-left-2', x: 915, y: 345, w: 130, h: 245 },
  { name: 'walk-right-1', x: 1090, y: 345, w: 135, h: 245 },
  { name: 'walk-right-2', x: 1265, y: 345, w: 135, h: 245 },
  { name: 'excited', x: 0, y: 690, w: 160, h: 210 },
  { name: 'stage-dive-left', x: 170, y: 735, w: 210, h: 165 },
  { name: 'stage-dive-right', x: 395, y: 735, w: 205, h: 165 },
  { name: 'stage-dive-down', x: 635, y: 745, w: 140, h: 155 },
  { name: 'crowd-surf-up', x: 810, y: 760, w: 185, h: 140 },
  { name: 'faceplant', x: 1010, y: 805, w: 190, h: 95 },
  { name: 'beated', x: 1240, y: 760, w: 160, h: 140 }
];

function colorDistance(a, b) {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) +
      Math.pow(a.g - b.g, 2) +
      Math.pow(a.b - b.b, 2)
  );
}

function getPixel(image, x, y) {
  return intToRGBA(image.getPixelColor(x, y));
}

function sampleBackground(image) {
  const samples = [];
  const lastX = image.bitmap.width - 1;
  const lastY = image.bitmap.height - 1;

  for (let x = 0; x <= lastX; x += 4) {
    samples.push(getPixel(image, x, 0));
    samples.push(getPixel(image, x, lastY));
  }

  for (let y = 4; y < lastY; y += 4) {
    samples.push(getPixel(image, 0, y));
    samples.push(getPixel(image, lastX, y));
  }

  const total = samples.reduce(
    (acc, sample) => {
      acc.r += sample.r;
      acc.g += sample.g;
      acc.b += sample.b;
      return acc;
    },
    { r: 0, g: 0, b: 0 }
  );

  return {
    r: Math.round(total.r / samples.length),
    g: Math.round(total.g / samples.length),
    b: Math.round(total.b / samples.length)
  };
}

function removeBackground(image) {
  const background = sampleBackground(image);
  const { width, height } = image.bitmap;
  const visited = new Uint8Array(width * height);
  const queue = [];
  const threshold = 52;

  const enqueue = (x, y) => {
    const idx = y * width + x;
    if (visited[idx]) {
      return;
    }

    const pixel = getPixel(image, x, y);
    if (colorDistance(pixel, background) > threshold) {
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
}

function hasTransparentBackground(image) {
  const edgePoints = [
    [0, 0],
    [image.bitmap.width - 1, 0],
    [0, image.bitmap.height - 1],
    [image.bitmap.width - 1, image.bitmap.height - 1]
  ];

  return edgePoints.every(([x, y]) => getPixel(image, x, y).a === 0);
}

function solidifyVisiblePixels(image) {
  const { width, height } = image.bitmap;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = getPixel(image, x, y);

      if (pixel.a <= 16) {
        image.setPixelColor(0x00000000, x, y);
        continue;
      }

      image.setPixelColor(rgbaToInt(pixel.r, pixel.g, pixel.b, 255), x, y);
    }
  }
}

async function buildPlayerSheet() {
  const source = await Jimp.read(sourcePath);
  const rows = Math.ceil(frameCrops.length / COLUMNS);
  const sheet = new Jimp({
    width: FRAME_WIDTH * COLUMNS,
    height: FRAME_HEIGHT * rows,
    color: 0x00000000
  });

  for (let index = 0; index < frameCrops.length; index++) {
    const crop = frameCrops[index];
    const sprite = source.clone().crop({
      x: crop.x,
      y: crop.y,
      w: crop.w,
      h: crop.h
    });

    if (!hasTransparentBackground(sprite)) {
      removeBackground(sprite);
    }
    sprite.autocrop();

    const scale = Math.min(
      INNER_WIDTH / sprite.bitmap.width,
      INNER_HEIGHT / sprite.bitmap.height
    );

    sprite.resize({
      w: Math.max(1, Math.round(sprite.bitmap.width * scale)),
      h: Math.max(1, Math.round(sprite.bitmap.height * scale)),
      mode: ResizeStrategy.NEAREST_NEIGHBOR
    });
    solidifyVisiblePixels(sprite);

    const frame = new Jimp({
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
      color: 0x00000000
    });

    const offsetX = Math.round((FRAME_WIDTH - sprite.bitmap.width) / 2);
    const offsetY =
      crop.name.startsWith('stage-dive') ||
      crop.name === 'crowd-surf-up' ||
      crop.name === 'faceplant' ||
      crop.name === 'beated'
        ? Math.round((FRAME_HEIGHT - sprite.bitmap.height) / 2)
        : FRAME_HEIGHT - sprite.bitmap.height - 8;

    frame.composite(sprite, offsetX, offsetY);

    const frameX = (index % COLUMNS) * FRAME_WIDTH;
    const frameY = Math.floor(index / COLUMNS) * FRAME_HEIGHT;
    sheet.composite(frame, frameX, frameY);

    console.log(`Built frame ${index}: ${crop.name}`);
  }

  await sheet.write(outputPath);
  console.log(`Saved ${outputPath}`);
}

buildPlayerSheet().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
