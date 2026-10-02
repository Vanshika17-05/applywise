import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

export function CountUp({ value = 0, suffix = "", loading = false, duration = 1.5 }) {
  const reduceMotion = useReducedMotion();
  const current = useRef(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number.isFinite(Number(value)) ? Number(value) : 0;
    if (loading || reduceMotion) {
      current.current = loading ? 0 : target;
      setDisplay(current.current);
      return;
    }
    const start = current.current;
    const animation = animate(start, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        current.current = latest;
        setDisplay(Math.round(latest));
      }
    });
    return () => animation.stop();
  }, [value, loading, reduceMotion, duration]);

  return <><span aria-hidden="true">{display}{suffix}</span><span className="sr-only">{value}{suffix}</span></>;
}
