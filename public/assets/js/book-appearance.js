// Shared by the public shelf, the admin live preview and migration tooling.
export function getBookThickness(pageCount) {
  const width = Math.round(Math.min(112, Math.max(52, 46 + (pageCount || 160) * .18)));
  return Math.round(18 + ((width - 52) / 60) * 14);
}

function luminance(hex) {
  const channels = [1, 3, 5].map(index => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  });
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}

export function getReadableInk(background) {
  const contrast = foreground => (Math.max(luminance(background), luminance(foreground)) + .05) / (Math.min(luminance(background), luminance(foreground)) + .05);
  // Black/white guarantee at least 4.58:1 for every valid sRGB binding color.
  // Stored text colors cannot guarantee this for arbitrary admin choices.
  return contrast('#000000') >= contrast('#ffffff') ? '#000000' : '#ffffff';
}

// Quantize sampled edge pixels into color buckets so isolated artwork details do not dominate.
export function pickCoverColor(image) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 48;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0, 48, 48);
  const pixels = context.getImageData(0, 0, 48, 48).data;
  const buckets = new Map();
  for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
    if (x > 5 && x < 42 && y > 5 && y < 42) continue;
    const i = (y * 48 + x) * 4; if (pixels[i + 3] < 200) continue;
    const rgb = [pixels[i], pixels[i + 1], pixels[i + 2]];
    const key = rgb.map(value => Math.floor(value / 24)).join(',');
    const bucket = buckets.get(key) || { count: 0, sums: [0, 0, 0] };
    bucket.count++; rgb.forEach((value, j) => { bucket.sums[j] += value; }); buckets.set(key, bucket);
  }
  const dominant = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
  if (!dominant) throw new Error('No readable cover pixels');
  return '#' + dominant.sums.map(value => Math.round(value / dominant.count).toString(16).padStart(2, '0')).join('');
}
