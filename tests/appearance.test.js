import assert from 'node:assert/strict';
import test from 'node:test';
import { getReadableInk } from '../public/assets/js/book-appearance.js';

test('spine labels meet AA across arbitrary admin binding colors', () => {
  let minimum = Infinity;
  for (let r = 0; r <= 255; r += 15) for (let g = 0; g <= 255; g += 15) for (let b = 0; b <= 255; b += 15) {
    const hex = '#' + [r, g, b].map(value => value.toString(16).padStart(2, '0')).join('');
    const linear = [r, g, b].map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    const luminance = linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
    const ink = getReadableInk(hex);
    assert.ok(['#000000', '#ffffff'].includes(ink));
    const ratio = ink === '#000000' ? (luminance + .05) / .05 : 1.05 / (luminance + .05);
    minimum = Math.min(minimum, ratio);
    assert.ok(ratio >= 4.5, `Insufficient spine contrast for ${hex}`);
  }
  assert.ok(minimum >= 4.58);
});
