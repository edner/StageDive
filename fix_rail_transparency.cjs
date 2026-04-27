const { Jimp, intToRGBA } = require('jimp');

const files = process.argv.slice(2);

function brightness(pixel) {
  return (pixel.r + pixel.g + pixel.b) / 3;
}

function channelSpread(pixel) {
  return Math.max(pixel.r, pixel.g, pixel.b) - Math.min(pixel.r, pixel.g, pixel.b);
}

function isOuterBackgroundPixel(pixel) {
  return brightness(pixel) >= 220 && channelSpread(pixel) <= 18;
}

function isInnerGapPixel(pixel) {
  return pixel.a > 0 && brightness(pixel) >= 242 && channelSpread(pixel) <= 12;
}

async function makeTransparent(filePath) {
  const image = await Jimp.read(filePath);
  const { width, height } = image.bitmap;
  const floodVisited = new Uint8Array(width * height);
  const queue = [];

  const enqueue = (x, y) => {
    const index = y * width + x;
    if (floodVisited[index]) {
      return;
    }

    floodVisited[index] = 1;
    const pixel = intToRGBA(image.getPixelColor(x, y));
    if (!isOuterBackgroundPixel(pixel)) {
      return;
    }

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

  const regionVisited = new Uint8Array(width * height);

  const collectRegion = (startX, startY) => {
    const pixels = [];
    const regionQueue = [[startX, startY]];
    const startIndex = startY * width + startX;
    regionVisited[startIndex] = 1;

    let minX = startX;
    let maxX = startX;
    let minY = startY;
    let maxY = startY;

    while (regionQueue.length > 0) {
      const [x, y] = regionQueue.shift();
      pixels.push([x, y]);

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

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
        if (regionVisited[nextIndex]) {
          continue;
        }

        regionVisited[nextIndex] = 1;
        const nextPixel = intToRGBA(image.getPixelColor(nextX, nextY));
        if (!isInnerGapPixel(nextPixel)) {
          continue;
        }

        regionQueue.push([nextX, nextY]);
      }
    }

    return {
      pixels,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (regionVisited[index]) {
        continue;
      }

      const pixel = intToRGBA(image.getPixelColor(x, y));
      if (!isInnerGapPixel(pixel)) {
        regionVisited[index] = 1;
        continue;
      }

      const region = collectRegion(x, y);
      const shouldErase =
        region.pixels.length >= 500 &&
        region.width >= 18 &&
        region.height >= 18;

      if (!shouldErase) {
        continue;
      }

      for (const [px, py] of region.pixels) {
        image.setPixelColor(0x00000000, px, py);
      }
    }
  }

  await image.write(filePath);
  console.log(`Updated ${filePath}`);
}

async function main() {
  if (files.length === 0) {
    throw new Error('Pass one or more image paths.');
  }

  for (const file of files) {
    await makeTransparent(file);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
