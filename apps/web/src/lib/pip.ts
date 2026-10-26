interface PipApi {
  requestWindow(options: { width: number; height: number }): Promise<Window>;
}

/** Whether the browser can open an always-on-top, interactive picture-in-picture window. */
export function pipSupported(host: object = window): boolean {
  return 'documentPictureInPicture' in host;
}

type StyleSource = { querySelectorAll(selector: string): ArrayLike<{ cloneNode(deep: boolean): unknown }> };
type StyleTarget = { head: { append(...nodes: never[]): void } };

/** The PiP window starts blank, so it gets a copy of every stylesheet in the page. */
export function copyStyles(source: StyleSource, target: StyleTarget): void {
  const nodes = Array.from(source.querySelectorAll('style, link[rel="stylesheet"]'), (node) => node.cloneNode(true));
  target.head.append(...(nodes as never[]));
}

export async function openPipWindow(width: number, height: number): Promise<Window> {
  const api = (window as unknown as { documentPictureInPicture: PipApi }).documentPictureInPicture;
  const pip = await api.requestWindow({ width, height });
  copyStyles(document, pip.document as unknown as StyleTarget);
  pip.document.documentElement.lang = document.documentElement.lang;
  pip.document.body.className = 'pip-body';
  return pip;
}
