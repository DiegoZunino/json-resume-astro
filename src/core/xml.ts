/**
 * A minimal XML tree and its serializer, for documents built in code (no parsing, no mixed
 * content). The output is the one of Python's ElementTree with two-space indentation: the
 * Europass converter this project ported was written with it, and its files were tested
 * against the Europass importer byte for byte.
 */

export interface XmlElement {
  /** Qualified name, `prefix:local` or just `local` for the default namespace. */
  readonly name: string;
  readonly attributes: readonly (readonly [name: string, value: string])[];
  readonly text: string | undefined;
  readonly children: XmlElement[];
}

export function element(name: string, text?: string, attributes: Record<string, string> = {}): XmlElement {
  return { name, attributes: Object.entries(attributes), text, children: [] };
}

/** Appends a child element and returns it, to build nested elements in place. */
export function append(
  parent: XmlElement,
  name: string,
  text?: string,
  attributes: Record<string, string> = {},
): XmlElement {
  const child = element(name, text, attributes);
  parent.children.push(child);
  return child;
}

const escapeText = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeAttribute = (value: string): string =>
  escapeText(value).replace(/"/g, '&quot;').replace(/\r/g, '&#13;').replace(/\n/g, '&#10;').replace(/\t/g, '&#09;');

const prefixOf = (name: string): string => (name.includes(':') ? name.slice(0, name.indexOf(':')) : '');

/** Prefixes used by element names (unprefixed: the default namespace) and prefixed attributes. */
function usedPrefixes(node: XmlElement, into = new Set<string>()): Set<string> {
  into.add(prefixOf(node.name));
  for (const [name] of node.attributes) if (name.includes(':')) into.add(prefixOf(name));
  for (const child of node.children) usedPrefixes(child, into);
  return into;
}

function render(node: XmlElement, depth: number, declarations = ''): string {
  const attributes = node.attributes.map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`).join('');
  const open = `<${node.name}${declarations}${attributes}`;
  if (node.children.length) {
    const indent = `\n${'  '.repeat(depth)}`;
    const children = node.children.map((child) => `${indent}  ${render(child, depth + 1)}`).join('');
    return `${open}>${children}${indent}</${node.name}>`;
  }
  return node.text ? `${open}>${escapeText(node.text)}</${node.name}>` : `${open} />`;
}

/**
 * The document with its declaration. The root declares only the namespaces in use, sorted by
 * prefix with the default one first; an empty element closes as `<Name />`.
 */
export function serialize(root: XmlElement, namespaces: Readonly<Record<string, string>>): string {
  const declarations = [...usedPrefixes(root)]
    .sort()
    .map((prefix) => {
      const uri = namespaces[prefix];
      if (uri === undefined) throw new Error(`No namespace declared for the prefix "${prefix}".`);
      return ` xmlns${prefix ? `:${prefix}` : ''}="${escapeAttribute(uri)}"`;
    })
    .join('');
  return `<?xml version='1.0' encoding='UTF-8'?>\n${render(root, 0, declarations)}`;
}
