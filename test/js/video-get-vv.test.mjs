// get-vv.mjs: argument parsing and the data: URL base64 extractor. Pure functions only (no browser,
// no network). Run with: bin/test-js test/js/video-get-vv.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, extractVvBase64 } from '../../tools/video/capture/get-vv.mjs';

const B64 = 'W3ZpcnQtdmlld2VyXQp0eXBlPXNwaWNlCg==';   // "[virt-viewer]\ntype=spice\n"

test('extractVvBase64 reads a plain base64 data URL', () => {
  assert.equal(extractVvBase64(`data:text/plain;base64,${B64}`), B64);
});

test('extractVvBase64 tolerates whitespace and percent-encoded newlines', () => {
  // Base64.encode64 inserts newlines; the anchor .href getter turns them into %0A.
  const chunked = B64.replace(/(.{8})/g, '$1\n');
  assert.equal(extractVvBase64(`data:text/plain;base64,${chunked}`), B64);
  assert.equal(extractVvBase64(`data:text/plain;base64,${chunked.replace(/\n/g, '%0A')}`), B64);
});

test('extractVvBase64 rejects non-data URLs and non-base64 bodies', () => {
  assert.equal(extractVvBase64('https://example.test/x.vv'), null);
  assert.equal(extractVvBase64('data:text/plain,not-base64'), null);
  assert.equal(extractVvBase64('data:text/plain;base64,not valid !@#'), null);
  assert.equal(extractVvBase64(null), null);
  assert.equal(extractVvBase64(undefined), null);
  assert.equal(extractVvBase64(42), null);
});

test('parseArgs requires vm-url, out and storage-state; defaults base-url', () => {
  const a = parseArgs(['--vm-url', 'https://h/vms/1', '--out', '/tmp/k.vv', '--storage-state', '/tmp/s.json']);
  assert.equal(a.vmUrl, 'https://h/vms/1');
  assert.equal(a.out, '/tmp/k.vv');
  assert.equal(a.storageState, '/tmp/s.json');
  assert.equal(a.baseUrl, 'https://localhost:3000');
  assert.equal(a.vmId, undefined);
  const b = parseArgs(['--vm-url', 'u', '--out', 'o', '--storage-state', 's', '--vm-id', '1889', '--base-url', 'http://x:1']);
  assert.equal(b.vmId, '1889');
  assert.equal(b.baseUrl, 'http://x:1');
});

test('parseArgs rejects missing required args, missing values and unknown flags', () => {
  assert.throws(() => parseArgs(['--out', 'o', '--storage-state', 's']), /--vm-url is required/);
  assert.throws(() => parseArgs(['--vm-url', 'u', '--storage-state', 's']), /--out is required/);
  assert.throws(() => parseArgs(['--vm-url', 'u', '--out', 'o']), /--storage-state is required/);
  assert.throws(() => parseArgs(['--vm-url']), /needs a value/);
  assert.throws(() => parseArgs(['--vm-url', 'u', '--out', 'o', '--storage-state', 's', '--bogus']), /unknown argument/);
});
