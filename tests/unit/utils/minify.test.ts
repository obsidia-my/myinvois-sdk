import { minifyXml, minifyJson } from '../../../src/utils/minify';

describe('minify utils', () => {
  it('minifyXml removes whitespace between tags', () => {
    const xml = `<root>
  <child>value</child>
  <other>  text  </other>
</root>`;
    expect(minifyXml(xml)).toBe('<root><child>value</child><other>  text  </other></root>');
  });

  it('minifyXml removes XML comments', () => {
    expect(minifyXml('<!-- comment --><root></root>')).toBe('<root></root>');
  });

  it('minifyXml trims leading/trailing whitespace', () => {
    expect(minifyXml('  <root/>  ')).toBe('<root/>');
  });

  it('minifyJson stringifies without spaces', () => {
    expect(minifyJson({ a: 1, b: 'hello' })).toBe('{"a":1,"b":"hello"}');
  });

  it('minifyJson handles arrays', () => {
    expect(minifyJson([1, 2, 3])).toBe('[1,2,3]');
  });
});
