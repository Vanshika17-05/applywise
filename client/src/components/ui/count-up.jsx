import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

export function CountUp({ value, suffix = "", loading = false }) {
  const reduceMotion = useReducedMotion();
  const current = useRef(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (loading || reduceMotion) {
      current.current = loading ? 0 : value;
      setDisplay(current.current);
      return;
    }
    const animation = animate(current.current, value, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (latest) => { current.current = latest; setDisplay(Math.round(latest)); }
    });
    return () => animation.stop();
  }, [value, loading, reduceMotion]);

  return <><span aria-hidden="true">{display}{suffix}</span><span className="sr-only">{value}{suffix}</span></>;
}
