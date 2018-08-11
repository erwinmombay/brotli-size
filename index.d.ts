/// <reference types="node" />

import * as stream from 'stream'

interface BrotliEncodeParams {
  disable_literal_context_modeling: boolean;
  lgblock: number;
  lgwin: number;
  mode: number;
  quality: number;
  size_hint: number;
}

interface BrotliSizeStream extends stream.PassThrough {
  on (event: string, listener: (...args: any[]) => void): this;
  on (event: 'brotli-size', listener: (size: number) => void): this;
  brotliSize?: number;
}

declare function brotliSize (str: string | Buffer, opt_params?: Partial<BrotliEncodeParams>): Promise<number>;

declare namespace brotliSize {
  function sync (str: string | Buffer, opt_params?: Partial<BrotliEncodeParams>): number;
  function stream (opt_params?: Partial<BrotliEncodeParams>): BrotliSizeStream;
}

export = brotliSize;