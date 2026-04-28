const { Jimp, ResizeStrategy, intToRGBA, rgbaToInt } = require('jimp');
const path = require('path');

const sourcePath =
  process.argv[2] ||
  '/Users/ednerpizarro/Desktop/StageDiveResources/Vocalist_SpriteSheet.png';
const outputPath =
  process.argv[3] || path.join(__dirname, 'public/assets/vocalist-sheet.png');

const FRAME_WIDTH = 208;
const FRAME_HEIGHT = 248;
const INNER_WIDTH = 190;
const INNER_HEIGHT = 232;
const COLUMNS = 4;

const frameBounds = [
  { name: 'idle-front', minX: 26, maxX: 129, minY: 24, maxY: 257 },
  { name: 'idle-left', minX: 196, maxX: 293, minY: 29, maxY: 257 },
  { name: 'idle-right', minX: 368, maxX: 469, minY: 26, maxY: 257 },
  { name: 'idle-back', minX: 542, maxX: 645, minY: 26, maxY: 257 },
  { name: 'sing-front', minX: 723, maxX: 830, minY: 25, maxY: 257 },
  { name: 'sing-left', minX: 884, maxX: 1005, minY: 26, maxY: 257 },
  { name: 'sing-right', minX: 1076, maxX: 1198, minY: 26, maxY: 257 },
  { name: 'mic-stand-front', minX: 1229, maxX: 1381, minY: 26, maxY: 257 },
  { name: 'mic-stand-left', minX: 9, maxX: 150, minY: 280, maxY: 505 },
  { name: 'hype-crowd', minX: 218, maxX: 355, minY: 284, maxY: 505 },
  { name: 'both-arms-up', minX: 398, maxX: 537, minY: 285, maxY: 505 },
  { name: 'pointing-mic-out', minX: 598, maxX: 771, minY: 283, maxY: 505 },
  { name: 'scream-power-vocal', minX: 811, maxX: 986, minY: 280, maxY: 505 },
  { name: 'crouch-sing', minX: 987, maxX: 1180, minY: 314, maxY: 505 },
  { name: 'kneel-sing', minX: 1241, maxX: 1360, minY: 312, maxY: 505 },
  { name: 'headbang-1', minX: 19, maxX: 143, minY: 557, maxY: 740 },
  { name: 'headbang-2', minX: 200, maxX: 327, minY: 549, maxY: 740 },
  { name: 'jump-pose', minX: 396, maxX: 517, minY: 523, maxY: 740 },
  { name: 'lean-back-sing', minX: 518, maxX: 690, minY: 555, maxY: 740 },
  { name: 'walk-front-1', minX: 691, maxX: 863, minY: 544, maxY: 740 },
  { name: 'walk-front-2', minX: 864, maxX: 1036, minY: 506, maxY: 740 },
  { name: 'walk-left-1', minX: 1037, maxX: 1209, minY: 550, maxY: 740 },
  { name: 'walk-left-2', minX: 1210, maxX: 1382, minY: 549, maxY: 740 },
  { name: 'walk-right-1', minX: 25, maxX: 112, minY: 765, maxY: 918 },
  { name: 'walk-right-2', minX: 191, maxX: 281, minY: 765, maxY: 918 },
  { name: 'back-turn-exit', minX: 377, maxX: 470, minY: 762, maxY: 919 }
];

function getPixel(image, x, y) {
  return intToRGBA(image.getPixelColor(x, y));
}

function colorDistance(a, b) {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) +
      Math.pow(a.g - b.g, 2) +
      Math.pow(a.b - b.b, 2)
  );
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
  const threshold = 46;

  const enqueue = (x, y) => {
    const idx = y * width + x;
    if (visited[idx]) {
      return;
    }

    const pixel = getPixel(image, x, y);
    if (pixel.a <= 8 || colorDistance(pixel, background) > threshold) {
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

function buildFrameRegions(sourceWidth, sourceHeight) {
  return frameBounds.map((bound) => {
    const padding = 16;
    const x = Math.max(0, bound.minX - padding);
    const y = Math.max(0, bound.minY - padding);
    const maxX = Math.min(sourceWidth - 1, bound.maxX + padding);
    const maxY = Math.min(sourceHeight - 1, bound.maxY + padding);

    return {
      name: bound.name,
      x,
      y,
      w: maxX - x + 1,
      h: maxY - y + 1
    };
  });
}

async function buildVocalistSheet() {
  const source = await Jimp.read(sourcePath);
  const frameRegions = buildFrameRegions(source.bitmap.width, source.bitmap.height);
  const rows = Math.ceil(frameRegions.length / COLUMNS);
  const sheet = new Jimp({
    width: FRAME_WIDTH * COLUMNS,
    height: FRAME_HEIGHT * rows,
    color: 0x00000000
  });
  const processedSprites = [];

  for (let index = 0; index < frameRegions.length; index++) {
    const crop = frameRegions[index];
    const sprite = source.clone().crop({
      x: crop.x,
      y: crop.y,
      w: crop.w,
      h: crop.h
    });

    removeBackground(sprite);
    sprite.autocrop();
    solidifyVisiblePixels(sprite);
    processedSprites.push({ name: crop.name, sprite });
  }

  const maxWidth = Math.max(...processedSprites.map(({ sprite }) => sprite.bitmap.width));
  const maxHeight = Math.max(...processedSprites.map(({ sprite }) => sprite.bitmap.height));
  const globalScale = Math.min(INNER_WIDTH / maxWidth, INNER_HEIGHT / maxHeight);

  for (let index = 0; index < processedSprites.length; index++) {
    const { name, sprite } = processedSprites[index];
    sprite.resize({
      w: Math.max(1, Math.round(sprite.bitmap.width * globalScale)),
      h: Math.max(1, Math.round(sprite.bitmap.height * globalScale)),
      mode: ResizeStrategy.NEAREST_NEIGHBOR
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

    console.log(`Built frame ${index}: ${name}`);
  }

  await sheet.write(outputPath);
  console.log(`Saved ${outputPath}`);
}

buildVocalistSheet().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
