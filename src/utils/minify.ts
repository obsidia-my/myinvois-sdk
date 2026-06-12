export function minifyXml(xml: string): string {
  return xml
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/^\s+|\s+$/g, '');
}

export function minifyJson(obj: unknown): string {
  return JSON.stringify(obj);
}
