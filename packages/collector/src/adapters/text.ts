export const DETAIL_MAX = 120;
export const TOOL_ARG_MAX = 60;

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function toolLabel(name: string, arg: string | undefined): string {
  return arg ? `${name}: ${truncate(arg, TOOL_ARG_MAX)}` : name;
}
