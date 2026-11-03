import { spawn } from 'node:child_process';

// Un video de telefono (1080p/4K, HEVC en iPhone) pesa 100-500 MB y muchos
// navegadores Android no reproducen HEVC. Se re-codifica a H.264/AAC con el
// lado largo limitado a 1280 px y `faststart`, para que pese pocos MB y se
// reproduzca en cualquier movil sin descargarlo entero.
const MAX_EDGE = 1280;
const TRANSCODE_TIMEOUT_MS = 8 * 60 * 1000;

export function transcodeVideoToMp4(inputPath: string, outputPath: string): Promise<void> {
  const scale = `scale='if(gt(iw,ih),min(${MAX_EDGE},iw),-2)':'if(gt(iw,ih),-2,min(${MAX_EDGE},ih))'`;
  const args = [
    '-y',
    '-hide_banner',
    '-loglevel', 'error',
    '-i', inputPath,
    '-map', '0:v:0',
    '-map', '0:a:0?',
    '-vf', scale,
    '-fpsmax', '30',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '27',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '96k',
    '-ac', '2',
    '-movflags', '+faststart',
    '-threads', '2',
    '-max_muxing_queue_size', '1024',
    outputPath,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-2000);
    });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
    }, TRANSCODE_TIMEOUT_MS);

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`ffmpeg termino con ${signal ?? `codigo ${code}`}: ${stderr.trim()}`));
    });
  });
}
