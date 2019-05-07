import fs from 'fs';
import test from 'ava';
import brotliSize from './dist/';

const file = fs.readFileSync('test.js', 'utf8');

test('async - get the brotli size', async (t) => {
  t.plan(2);
  const size = await brotliSize(file);
  t.true(typeof size === 'number');
  t.true(size < file.length);
});

test('sync - get the brotli size', (t) => {
  t.plan(1);
  t.true(brotliSize.sync(file) < file.length);
});

test.cb('stream', t => {
  fs.createReadStream('test.js')
    .pipe(brotliSize.stream())
    .on('end', function() {
      t.is(this.brotliSize, brotliSize.sync(file));
      t.end();
    });
});

test.cb('brotli-size event', t => {
  fs.createReadStream('test.js')
    .pipe(brotliSize.stream())
    .on('brotli-size', size => {
      t.is(size, brotliSize.sync(file));
      t.end();
    });
});
