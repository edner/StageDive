const { Jimp, intToRGBA } = require('jimp');
const path = require('path');

const DEFAULT_INPUTS = [
  '/Users/ednerpizarro/Desktop/StageDiveResources/Aggressor1-SpriteSheet.png',
  '/Users/ednerpizarro/Desktop/StageDiveResources/Aggressor_2-SpriteSheet.png',
  '/Users/ednerpizarro/Desktop/StageDiveResources/Aggressor_3-SpriteSheet.png',
  '/Users/ednerpizarro/Desktop/StageDiveResources/Aggressor_4-SprteSheet.png'
];

const FRAME_WIDTH = 96;
const FRAME_HEIGHT = 96;
const INNER_WIDTH = 78;
const INNER_HEIGHT = 84;
const COLUMNS = 4;
const BOUNDS_PADDING = 14;
const MIN_COMPONENT_AREA = 1400;
const MERGE_DISTANCE = 54;
const ROW_GROUP_TOLERANCE = 90;
const OUTPUT_DIR = path.join(__dirname, 'public/assets');

function brightness(pixel) {
  return (pixel.r + pixel.g + pixel.b) / 3;
}

function channelSpread(pixel) {
  return Math.max(pixel.r, pixel.g, pixel.b) - Math.min(pixel.r, pixel.g, pixel.b);
}

function isBackground(pixel) {
  return pixel.a > 0 && brightness(pixel) <= 38 && channelSpread(pixel) <= 22;
}

function getPixel(image, x, y) {
  return intToRGBA(image.getPixelColor(x, y));
}

function removeBackground(image) {
  const { width, height } = image.bitmap;
  const visited = new Uint8Array(width * height);
  const queue = [];

  const enqueue = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return;
    }

    const index = y * width + x;
    if (visited[index]) {
      return;
    }

    const pixel = getPixel(image, x, y);
    if (!isBackground(pixel)) {
      return;
    }

    visited[index] = 1;
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

    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }
}

function collectComponents(image) {
  const { width, height } = image.bitmap;
  const visited = new Uint8Array(width * height);
  const components = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (visited[index]) {
        continue;
      }

      visited[index] = 1;
      const pixel = getPixel(image, x, y);
      if (pixel.a === 0) {
        continue;
      }

      const queue = [[x, y]];
      const component = {
        area: 0,
        minX: x,
        minY: y,
        maxX: x,
        maxY: y
      };

      while (queue.length > 0) {
        const [currentX, currentY] = queue.shift();
        component.area++;
        component.minX = Math.min(component.minX, currentX);
        component.minY = Math.min(component.minY, currentY);
        component.maxX = Math.max(component.maxX, currentX);
        component.maxY = Math.max(component.maxY, currentY);

        const neighbors = [
          [currentX - 1, currentY],
          [currentX + 1, currentY],
          [currentX, currentY - 1],
          [currentX, currentY + 1]
        ];

        for (const [nextX, nextY] of neighbors) {
          if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
            continue;
          }

          const nextIndex = nextY * width + nextX;
          if (visited[nextIndex]) {
            continue;
          }

          visited[nextIndex] = 1;
          const nextPixel = getPixel(image, nextX, nextY);
          if (nextPixel.a === 0) {
            continue;
          }

          queue.push([nextX, nextY]);
        }
      }

      components.push(component);
    }
  }

  return components;
}

function boxDistance(a, b) {
  const horizontalGap = Math.max(0, Math.max(a.minX - b.maxX, b.minX - a.maxX));
  const verticalGap = Math.max(0, Math.max(a.minY - b.maxY, b.minY - a.maxY));
  return Math.hypot(horizontalGap, verticalGap);
}

function attachDetailComponents(components) {
  const mainComponents = components
    .filter((component) => component.area >= MIN_COMPONENT_AREA)
    .map((component) => ({ ...component }));
  const detailComponents = components.filter((component) => component.area < MIN_COMPONENT_AREA);

  for (const detail of detailComponents) {
    let closest = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const main of mainComponents) {
      const distance = boxDistance(detail, main);
      if (distance < closestDistance) {
        closest = main;
        closestDistance = distance;
      }
    }

    if (!closest || closestDistance > MERGE_DISTANCE) {
      continue;
    }

    closest.minX = Math.min(closest.minX, detail.minX);
    closest.minY = Math.min(closest.minY, detail.minY);
    closest.maxX = Math.max(closest.maxX, detail.maxX);
    closest.maxY = Math.max(closest.maxY, detail.maxY);
  }

  return mainComponents;
}

function expandBounds(bounds, image) {
  return {
    minX: Math.max(0, bounds.minX - BOUNDS_PADDING),
    minY: Math.max(0, bounds.minY - BOUNDS_PADDING),
    maxX: Math.min(image.bitmap.width - 1, bounds.maxX + BOUNDS_PADDING),
    maxY: Math.min(image.bitmap.height - 1, bounds.maxY + BOUNDS_PADDING)
  };
}

function sortFrameBounds(boundsList) {
  const sorted = [...boundsList].sort((a, b) => a.minY - b.minY || a.minX - b.minX);
  const rows = [];

  for (const bounds of sorted) {
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const row = rows.find((entry) => Math.abs(entry.centerY - centerY) <= ROW_GROUP_TOLERANCE);

    if (row) {
      row.items.push(bounds);
      row.centerY = (row.centerY * (row.items.length - 1) + centerY) / row.items.length;
      continue;
    }

    rows.push({ centerY, items: [bounds] });
  }

  rows.sort((a, b) => a.centerY - b.centerY);
  return rows.flatMap((row) => row.items.sort((a, b) => a.minX - b.minX));
}

async function extractFrames(sourcePath) {
  const image = await Jimp.read(sourcePath);
  removeBackground(image);

  const boundsList = sortFrameBounds(
    attachDetailComponents(collectComponents(image)).map((bounds) => expandBounds(bounds, image))
  );

  return boundsList.map((bounds) => {
    const frame = image.clone().crop({
      x: bounds.minX,
      y: bounds.minY,
      w: bounds.maxX - bounds.minX + 1,
      h: bounds.maxY - bounds.minY + 1
    });

    frame.autocrop();
    return frame;
  });
}

async function buildSheet(frames, outputPath) {
  const rows = Math.ceil(frames.length / COLUMNS);
  const sheet = new Jimp({
    width: FRAME_WIDTH * COLUMNS,
    height: FRAME_HEIGHT * rows,
    color: 0x00000000
  });

  for (let index = 0; index < frames.length; index++) {
    const sprite = frames[index].clone();
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
    const offsetY = Math.max(0, FRAME_HEIGHT - sprite.bitmap.height - 6);
    frame.composite(sprite, offsetX, offsetY);

    const frameX = (index % COLUMNS) * FRAME_WIDTH;
    const frameY = Math.floor(index / COLUMNS) * FRAME_HEIGHT;
    sheet.composite(frame, frameX, frameY);
  }

  await sheet.write(outputPath);
}

async function main() {
  const inputs = process.argv.slice(2);
  const sourcePaths = inputs.length > 0 ? inputs : DEFAULT_INPUTS;

  for (let index = 0; index < sourcePaths.length; index++) {
    const sourcePath = sourcePaths[index];
    const frames = await extractFrames(sourcePath);

    if (frames.length !== 10) {
      throw new Error(`Expected 10 frames in ${sourcePath}, found ${frames.length}`);
    }

    const outputPath = path.join(OUTPUT_DIR, `aggro-crowd-${index + 1}-sheet.png`);
    await buildSheet(frames, outputPath);
    console.log(`Saved ${outputPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
