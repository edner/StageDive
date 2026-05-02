const { Jimp, intToRGBA } = require('jimp');
const path = require('path');

const SOURCE_PATH =
  process.argv[2] || '/Users/ednerpizarro/Desktop/StageDiveResources/Crowd-SprintSheet.png';
const OUTPUT_PATH =
  process.argv[3] || path.join(__dirname, 'public/assets/crowd-normal-sheet.png');

const FRAME_WIDTH = 96;
const FRAME_HEIGHT = 96;
const INNER_WIDTH = 72;
const INNER_HEIGHT = 82;
const EXPECTED_ROWS = 8;
const EXPECTED_COLUMNS = 9;
const BOUNDS_PADDING = 12;
const ROW_GROUP_TOLERANCE = 70;
const MIN_COMPONENT_AREA = 800;

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

      if (component.area >= MIN_COMPONENT_AREA) {
        components.push(component);
      }
    }
  }

  return components;
}

function expandBounds(bounds, image) {
  return {
    minX: Math.max(0, bounds.minX - BOUNDS_PADDING),
    minY: Math.max(0, bounds.minY - BOUNDS_PADDING),
    maxX: Math.min(image.bitmap.width - 1, bounds.maxX + BOUNDS_PADDING),
    maxY: Math.min(image.bitmap.height - 1, bounds.maxY + BOUNDS_PADDING)
  };
}

function sortBounds(boundsList) {
  const rows = [];
  const sorted = [...boundsList].sort((a, b) => a.minY - b.minY || a.minX - b.minX);

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
  return rows.map((row) => row.items.sort((a, b) => a.minX - b.minX));
}

async function main() {
  const source = await Jimp.read(SOURCE_PATH);
  removeBackground(source);

  const rows = sortBounds(collectComponents(source).map((bounds) => expandBounds(bounds, source)));
  if (rows.length !== EXPECTED_ROWS) {
    throw new Error(`Expected ${EXPECTED_ROWS} rows, found ${rows.length}`);
  }

  rows.forEach((row, index) => {
    if (row.length !== EXPECTED_COLUMNS) {
      throw new Error(`Expected ${EXPECTED_COLUMNS} columns in row ${index}, found ${row.length}`);
    }
  });

  const sheet = new Jimp({
    width: FRAME_WIDTH * EXPECTED_COLUMNS,
    height: FRAME_HEIGHT * EXPECTED_ROWS,
    color: 0x00000000
  });

  rows.forEach((row, rowIndex) => {
    row.forEach((bounds, columnIndex) => {
      const sprite = source.clone().crop({
        x: bounds.minX,
        y: bounds.minY,
        w: bounds.maxX - bounds.minX + 1,
        h: bounds.maxY - bounds.minY + 1
      });

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
      const offsetY = Math.max(0, FRAME_HEIGHT - sprite.bitmap.height - 6);
      frame.composite(sprite, offsetX, offsetY);

      sheet.composite(frame, columnIndex * FRAME_WIDTH, rowIndex * FRAME_HEIGHT);
    });
  });

  await sheet.write(OUTPUT_PATH);
  console.log(`Saved ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
