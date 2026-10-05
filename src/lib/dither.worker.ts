// Off-main-thread dithering for the hero portrait: fetch + decode the source
// maps once, then answer one request per grid size / theme.
import { ditherGrid, redChannel, type Channel, type DitherRequest, type DitherResult } from "./dither";

let sources: Promise<{ luma: Channel; mask: Channel }> | null = null;

async function load(url: string): Promise<Channel> {
  const bitmap = await createImageBitmap(await (await fetch(url)).blob());
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0);
  return redChannel(ctx.getImageData(0, 0, bitmap.width, bitmap.height).data, bitmap.width, bitmap.height);
}

self.onmessage = async (e: MessageEvent<DitherRequest>) => {
  const { id, cols, rows, dark, luma, mask } = e.data;
  try {
    sources ??= Promise.all([load(luma), load(mask)]).then(([l, m]) => ({ luma: l, mask: m }));
    const result: DitherResult = { id, cols, rows, ...ditherGrid(await sources, cols, rows, dark) };
    (self as unknown as Worker).postMessage(result, [result.dots.buffer, result.order.buffer, result.keys.buffer]);
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, error: String(err) });
  }
};
