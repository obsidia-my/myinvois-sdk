// C14N11 (xml-c14n11) canonicalisation per W3C spec.
// Used to produce a reproducible byte sequence from XML before hashing.
// Reference: https://www.w3.org/TR/xml-c14n11/
import { DOMParser } from '@xmldom/xmldom';
import type { Element, Node, Attr, Document } from '@xmldom/xmldom';

const DOM_ELEMENT = 1;
const DOM_TEXT = 3;
const DOM_CDATA = 4;
const DOM_PI = 7;
const DOM_COMMENT = 8;
const DOM_DOCUMENT = 9;

// Collect in-scope namespace declarations inherited from ANCESTORS of a node.
// Does NOT include declarations on the node itself (those are computed by getNamespaceDeclarations).
function getInScopeNamespaces(node: Element): Map<string, string> {
  const ns = new Map<string, string>();
  let cur: Element | null = node.parentNode as Element | null;
  while (cur !== null && cur.nodeType === DOM_ELEMENT) {
    const attrs = cur.attributes;
    for (let i = 0; i < attrs.length; i++) {
      const a = attrs.item(i);
      if (a === null) continue;
      if (a.name === 'xmlns') {
        if (!ns.has('')) ns.set('', a.value);
      } else if (a.name.startsWith('xmlns:')) {
        const prefix = a.name.slice(6);
        if (!ns.has(prefix)) ns.set(prefix, a.value);
      }
    }
    cur = (cur.parentNode as Element | null);
  }
  return ns;
}

// Collect namespace declarations visibly used/declared on this element (for output).
function getNamespaceDeclarations(
  el: Element,
  parentNs: Map<string, string>,
): Array<[string, string]> {
  const decls: Array<[string, string]> = [];
  const attrs = el.attributes;
  for (let i = 0; i < attrs.length; i++) {
    const a = attrs.item(i);
    if (a === null) continue;
    if (a.name === 'xmlns') {
      const parentVal = parentNs.get('') ?? '';
      if (a.value !== parentVal) decls.push(['xmlns', a.value]);
    } else if (a.name.startsWith('xmlns:')) {
      const prefix = a.name.slice(6);
      const parentVal = parentNs.get(prefix) ?? '';
      if (a.value !== parentVal) decls.push([a.name, a.value]);
    }
  }
  decls.sort((a, b) => a[0].localeCompare(b[0]));
  return decls;
}

// Non-namespace attributes, sorted: namespace-URI-then-local-name.
function getNonNsAttrs(el: Element): Attr[] {
  const result: Attr[] = [];
  const attrs = el.attributes;
  for (let i = 0; i < attrs.length; i++) {
    const a = attrs.item(i);
    if (a === null) continue;
    if (a.name !== 'xmlns' && !a.name.startsWith('xmlns:')) {
      result.push(a);
    }
  }
  result.sort((a, b) => {
    const nsA = a.namespaceURI ?? '';
    const nsB = b.namespaceURI ?? '';
    if (nsA !== nsB) return nsA.localeCompare(nsB);
    return (a.localName ?? a.name).localeCompare(b.localName ?? b.name);
  });
  return result;
}

function escapeAttr(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\t/g, '&#9;')
    .replace(/\n/g, '&#10;')
    .replace(/\r/g, '&#13;');
}

function escapeText(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r/g, '&#13;');
}

function canonicaliseNode(
  node: Node,
  parentNs: Map<string, string>,
  parts: string[],
): void {
  if (node.nodeType === DOM_ELEMENT) {
    const el = node as Element;
    const decls = getNamespaceDeclarations(el, parentNs);
    const localNs = new Map(parentNs);
    for (const [k, v] of decls) {
      if (k === 'xmlns') localNs.set('', v);
      else localNs.set(k.slice(6), v);
    }

    parts.push('<');
    parts.push(el.tagName);

    for (const [k, v] of decls) {
      parts.push(` ${k}="${escapeAttr(v)}"`);
    }

    const nonNs = getNonNsAttrs(el);
    for (const a of nonNs) {
      parts.push(` ${a.name}="${escapeAttr(a.value)}"`);
    }

    parts.push('>');

    const children = el.childNodes;
    for (let i = 0; i < children.length; i++) {
      const child = children.item(i);
      if (child !== null) canonicaliseNode(child, localNs, parts);
    }

    parts.push('</');
    parts.push(el.tagName);
    parts.push('>');
  } else if (node.nodeType === DOM_TEXT) {
    parts.push(escapeText(node.nodeValue ?? ''));
  } else if (node.nodeType === DOM_CDATA) {
    parts.push(escapeText(node.nodeValue ?? ''));
  } else if (node.nodeType === DOM_PI) {
    const pi = node as unknown as { target: string; data: string };
    parts.push(`<?${pi.target} ${pi.data}?>`);
  } else if (node.nodeType === DOM_COMMENT) {
    // Comments are NOT included in C14N11 by default (excl-c14n style).
    // LHDN transforms exclude them via XPath, so we omit them.
  } else if (node.nodeType === DOM_DOCUMENT) {
    const doc = node as Document;
    const children = doc.childNodes;
    for (let i = 0; i < children.length; i++) {
      const child = children.item(i);
      if (child !== null) canonicaliseNode(child, parentNs, parts);
    }
  }
}

// XPath-style transform that removes elements matching a predicate.
// Used to strip UBLExtensions and cac:Signature before hashing the document.
function filterElement(el: Element, removeTags: Set<string>): Element | null {
  if (removeTags.has(el.tagName)) return null;
  // Clone shallowly then recurse children
  const doc = el.ownerDocument;
  if (doc === null) return el;
  const clone = doc.createElement(el.tagName);
  // Copy attributes
  const attrs = el.attributes;
  for (let i = 0; i < attrs.length; i++) {
    const a = attrs.item(i);
    if (a !== null) clone.setAttribute(a.name, a.value);
  }
  // Copy namespace-aware children
  const children = el.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children.item(i);
    if (child === null) continue;
    if (child.nodeType === DOM_ELEMENT) {
      const filtered = filterElement(child as Element, removeTags);
      if (filtered !== null) clone.appendChild(filtered);
    } else {
      clone.appendChild(child.cloneNode(true));
    }
  }
  return clone;
}

// Tags to remove from XML before hashing (LHDN XPath transforms).
const LHDN_EXCLUDE_TAGS = new Set([
  'ext:UBLExtensions',
  'UBLExtensions',
  'cac:Signature',
  'Signature',
]);

export function canonicaliseXml(xml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const root = doc.documentElement;
  if (root === null) return '';
  const filtered = filterElement(root, LHDN_EXCLUDE_TAGS);
  if (filtered === null) return '';
  const parentNs = getInScopeNamespaces(root);
  const parts: string[] = [];
  canonicaliseNode(filtered, parentNs, parts);
  return parts.join('');
}
