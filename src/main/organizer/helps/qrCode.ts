import * as QRCode from "qrcode";

// generate QR buffer instead of Base64
export async function generateQRCodeBuffer(data: string): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(data, {
      type: 'png',
      width: 400,
      margin: 2,
    });
    return buffer;
  } catch (error) {
    console.error("QR Generation Error:", error);
    throw error;
  }
}
