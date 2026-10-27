import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
}

interface Box {
  left: number;
  width: number;
  /** Full width of the control, for the right edge of the label mask. */
  total: number;
}

interface SegmentedProps<T extends string> {
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange(value: T): void;
  label: string;
  /** Tabs switch views; radios pick a setting. */
  kind: 'tab' | 'radio';
  className?: string;
}

/**
 * Pill-shaped switch whose selected background slides between options. A second copy of the labels,
 * in the selected colour, is clipped to the pill, so text changes colour exactly where the pill is
 * mid-slide. Both move with CSS transitions, so a quick second click reverses from wherever they are.
 */
export function Segmented<T extends string>({ options, value, onChange, label, kind, className = '' }: SegmentedProps<T>) {
  const root = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  // The first placement lands without sliding in from the left edge.
  const [settled, setSettled] = useState(false);
  const keys = options.map((option) => option.value).join();

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const place = () => {
      const selected = element.querySelector<HTMLElement>('[data-segment][data-selected]');
      if (!selected) return;
      const next = { left: selected.offsetLeft, width: selected.offsetWidth, total: element.clientWidth };
      setBox((last) => (last && last.left === next.left && last.width === next.width && last.total === next.total ? last : next));
    };
    place();
    // Labels change width when the language changes. The control may live in the
    // picture-in-picture window, so observe with that window's own ResizeObserver.
    const View = element.ownerDocument.defaultView ?? window;
    const observer = new View.ResizeObserver(place);
    observer.observe(element);
    return () => observer.disconnect();
  }, [value, keys]);

  useLayoutEffect(() => {
    if (!box || settled) return;
    const view = root.current?.ownerDocument.defaultView ?? window;
    const frame = view.requestAnimationFrame(() => setSettled(true));
    return () => view.cancelAnimationFrame(frame);
  }, [box, settled]);

  const selectedProp = kind === 'tab' ? 'aria-selected' : 'aria-checked';
  const clip = box ? `inset(0 ${box.total - box.left - box.width}px 0 ${box.left}px round 999px)` : 'inset(0 100% 0 0)';

  return (
    <div
      ref={root}
      className={`seg segmented ${className}`.trim()}
      role={kind === 'tab' ? 'tablist' : 'radiogroup'}
      aria-label={label}
      data-settled={settled || undefined}
    >
      <span className="seg-pill" aria-hidden="true" style={box ? { transform: `translateX(${box.left}px)`, width: box.width } : { opacity: 0 }} />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role={kind}
          {...{ [selectedProp]: option.value === value }}
          data-segment=""
          data-selected={option.value === value || undefined}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
      <div className="seg-ink" aria-hidden="true" style={{ clipPath: clip }}>
        {options.map((option) => (
          <span key={option.value}>{option.label}</span>
        ))}
      </div>
    </div>
  );
}
