import vision from '@google-cloud/vision';
import path from 'path';

const keyPath = Assets.absoluteFilePath('credentials/service-account.json');

const client = new vision.ImageAnnotatorClient({
  keyFilename: keyPath,
});

export async function extractTextFromImage(filePathOrBuffer) {
  let request;

  if (Buffer.isBuffer(filePathOrBuffer)) {
    request = { image: { content: filePathOrBuffer.toString('base64') } };
  } else {
    request = { image: { source: { filename: filePathOrBuffer } } };
  }

  const [result] = await client.textDetection(request);
  const detections = result.textAnnotations;

  if (detections.length > 0) {
    console.log('Detected text:', detections[0].description);
    return detections[0].description;
  } else {
    console.log('No text detected');
    return null;
  }
}
