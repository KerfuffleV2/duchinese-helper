type ChildDef = {
  typ: string;
  attrs?: {[key: string]: string};
  children?: String | Child[];
};
type Child = Element | ChildDef;

function mkElementTree(
  typ: string,
  attrs?: {[key: string]: string} | string | null,
  children?: String | (String | Child)[] | null
) {
  const el = document.createElement(typ);
  if (attrs) {
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v ?? ''));
  }
  if (!children) {
    return el;
  }
  if (typeof children === 'string') {
    children = [children];
  }
  const isChild = (v: ChildDef | String): v is ChildDef =>
    typeof v !== 'string';

  for (const child of children) {
    switch (typeof child) {
      case 'string':
        el.appendChild(document.createTextNode(child));
        break;
      case 'object':
        if (child instanceof Element) {
          el.appendChild(child);
        } else if (isChild(child)) {
          el.appendChild(mkElementTree(child.typ, child.attrs, child.children));
        }
        break;
    }
  }
  return el;
}

export {mkElementTree};
