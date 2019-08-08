import {constants as brotliConstants, brotliCompress, brotliCompressSync, BrotliOptions, createBrotliCompress} from 'zlib';
import {PassThrough as PassThroughStream} from 'stream';
import {readFile, readFileSync} from 'fs';
import {promisify} from 'util';

const duplexer = require('duplexer');
const readFilePromise = promisify(readFile);

// Support a subset of the possible encoding options. 
export interface BrotliEncodeParams {
  mode?: number;
  quality?: number;
}

const bufferFormatter = (incoming: Buffer | string): Buffer => typeof incoming === 'string' ? Buffer.from(incoming, 'utf8') : incoming;
const optionFormatter = (passed?: BrotliEncodeParams, toEncode?: Buffer): BrotliOptions => ({
  params: {
    [brotliConstants.BROTLI_PARAM_MODE]: passed && 'mode' in passed && passed.mode || brotliConstants.BROTLI_DEFAULT_MODE,
    [brotliConstants.BROTLI_PARAM_QUALITY]: passed && 'quality' in passed && passed.quality || brotliConstants.BROTLI_MAX_QUALITY,
    [brotliConstants.BROTLI_PARAM_SIZE_HINT]: toEncode ? toEncode.byteLength : 0,
  }
});

/**
 * @param incoming Either a Buffer or string of the value to encode.
 * @param options Subset of Encoding Parameters.
 * @return Promise that resolves with the encoded Buffer length.
 */
export default async function size(incoming: Buffer | string, options?: BrotliEncodeParams): Promise<number> {
  const buffer = bufferFormatter(incoming);

  return new Promise(function(resolve, reject) {
    brotliCompress(buffer, optionFormatter(options, buffer), (error: Error | null, result: Buffer) => {
      if (error !== null) {
        reject(error);
      }
      resolve(result.byteLength);
    });
  });
}

/**
 * @param incoming Either a Buffer or string of the value to encode.
 * @param options Subset of Encoding Parameters.
 * @return Length of encoded Buffer.
 */
export function sync(incoming: Buffer | string, options?: BrotliEncodeParams): number {
  const buffer = bufferFormatter(incoming);
  return brotliCompressSync(buffer, optionFormatter(options, buffer)).byteLength;
}

/**
 * @param options 
 * @return PassThroughStream for the contents being compressed
 */
export function stream(options?: BrotliEncodeParams): PassThroughStream {
  const input = new PassThroughStream();
  const output = new PassThroughStream();
  const wrapper = duplexer(input, output);
  let size = 0;

  const brotli = createBrotliCompress(optionFormatter(options))
    .on('data', buf => {
      size += buf.length;
    })
    .on('error', () => {
      wrapper.brotliSize = 0;
    })
    .on('end', () => {
      wrapper.brotliSize = size;
      wrapper.emit('brotli-size', size);
      output.end();
    });

  input.pipe(brotli);
  input.pipe(output, {end: false});

  return wrapper;
}

/**
 * @param path File Path for the file to compress.
 * @param options Subset of Encoding Parameters.
 * @return Promise that resolves with size of encoded file.
 */
export async function file(path: string, options?: BrotliEncodeParams): Promise<number> {
  const file = await readFilePromise(path);
  return (await size(file, options));
}

/**
 * @param path File Path for the file to compress.
 * @param options Subset of Encoding Parameters.
 * @return size of encoded file.
 */
export function fileSync(path: string, options?: BrotliEncodeParams): number {
  const file = readFileSync(path);
  return sync(file, options);
}
