import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

/**
 * Keeps the renderer sized to its container using the ResizeObserver of the window the canvas
 * actually lives in. Once the scene is portalled into the picture-in-picture window, the main
 * window's observer no longer sees its size changes, which left the view stretched off-centre.
 */
export function FitToWindow() {
  const gl = useThree((state) => state.gl);
  const setSize = useThree((state) => state.setSize);

  useEffect(() => {
    const container = gl.domElement.parentElement;
    const view = container?.ownerDocument.defaultView;
    if (!container || !view) return;
    const fit = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width > 0 && height > 0) setSize(width, height);
    };
    const observer = new view.ResizeObserver(fit);
    observer.observe(container);
    view.addEventListener('resize', fit);
    fit();
    return () => {
      observer.disconnect();
      view.removeEventListener('resize', fit);
    };
  }, [gl, setSize]);

  return null;
}
