import fs from 'fs';
import test from 'ava';
import module from './';

const file = fs.readFileSync('test.js', 'utf8');

test('sync - get the brotli size', (t) => {
  t.plan(1);
  t.true(module.sync(file) < file.length);
});

test.cb('stream', t => {
  fs.createReadStream('test.js')
    .pipe(module.stream())
    .on('end', function() {
      t.is(this.brotliSize, module.sync(file));
      t.end();
    });
});

test.cb('brotli-size event', t => {
  fs.createReadStream('test.js')
    .pipe(module.stream())
    .on('brotli-size', size => {
      t.is(size, module.sync(file));
      t.end();
    });
});
