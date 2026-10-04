import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicIPv4, fetchCoverImage } from '../lib/cover-image.js';

test('Cover relay rejects private networks, non-image schemes and credential-bearing URLs', async () => {
  for (const address of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.1.1', '0.0.0.0', '198.18.0.1', '192.0.2.1', '203.0.113.1', '224.1.2.3', '::1', 'not-an-ip']) assert.equal(publicIPv4(address), false, address);
  assert.equal(publicIPv4('8.8.8.8'), true);
  for (const url of ['http://127.0.0.1/cover.jpg', 'http://10.0.0.1/a', 'file:///etc/passwd', 'https://user:pass@example.com/cover.jpg', 'http://8.8.8.8:8080/cover.jpg', 'http://[::1]/cover.jpg']) {
    await assert.rejects(fetchCoverImage(url), error => error.status === 400, url);
  }
});
