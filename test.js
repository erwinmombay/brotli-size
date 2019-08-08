import fs from 'fs';
import test from 'ava';
import brotliSize, {sync, stream} from './dist/';

const file = fs.readFileSync('test.js', 'utf8');

test('async - get the brotli size', async (t) => {
  t.plan(2);
  const size = await brotliSize(file);
  t.true(typeof size === 'number');
  t.true(size < file.length);
});

test('sync - get the brotli size', (t) => {
  t.plan(1);
  t.true(sync(file) < file.length);
});

test.cb('stream', t => {
  fs.createReadStream('test.js')
    .pipe(stream())
    .on('end', function() {
      t.is(this.brotliSize, sync(file));
      t.end();
    });
});

test.cb('brotli-size event', t => {
  fs.createReadStream('test.js')
    .pipe(stream())
    .on('brotli-size', size => {
      t.is(size, sync(file));
      t.end();
    });
});
