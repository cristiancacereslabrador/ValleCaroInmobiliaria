import { sniffUploadKind } from './upload-sniff.util';

describe('sniffUploadKind', () => {
  it('detecta JPEG por magic bytes', () => {
    expect(sniffUploadKind(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg');
  });

  it('detecta PNG por magic bytes', () => {
    expect(sniffUploadKind(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png');
  });

  it('detecta HEIC por ftyp/heic', () => {
    const buffer = Buffer.alloc(16);
    buffer.write('....ftypheic', 0, 'ascii');
    expect(sniffUploadKind(buffer)).toBe('heic');
  });

  it('detecta MP4 por ftyp', () => {
    const buffer = Buffer.alloc(16);
    buffer.write('....ftypisom', 0, 'ascii');
    expect(sniffUploadKind(buffer)).toBe('mp4');
  });
});
