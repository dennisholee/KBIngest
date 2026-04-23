type PdfSource = {
  data: Buffer | Uint8Array;
};

function toBuffer(data: Buffer | Uint8Array): Buffer {
  return Buffer.isBuffer(data) ? data : Buffer.from(data);
}

function extractText(data: Buffer | Uint8Array): string {
  const text = toBuffer(data).toString('utf-8');

  if (text.includes('Invalid PDF with no text')) {
    return '';
  }

  return text
    .replace(/^%PDF-[^\n]*\n?/, '')
    .replace(/%.*$/gm, '')
    .trim();
}

export function getDocument(source: PdfSource) {
  const extractedText = extractText(source.data);

  return {
    promise: Promise.resolve({
      numPages: 1,
      getPage: async () => ({
        getTextContent: async () => ({
          items: extractedText
            ? extractedText.split(/\s+/).map((value) => ({ str: value }))
            : [],
        }),
      }),
    }),
  };
}