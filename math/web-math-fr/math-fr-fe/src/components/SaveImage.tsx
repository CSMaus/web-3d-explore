import { useState, type RefObject } from "react";

type Props = { stage: RefObject<HTMLElement | null>; name: string };

export function SaveImage({ stage, name }: Props) {
  const [trouble, setTrouble] = useState(false);

  const save = () => {
    const canvas = stage.current?.querySelector("canvas");
    if (!canvas) {
      setTrouble(true);
      return;
    }
    try {
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      const link = document.createElement("a");
      link.download = `${name}-${stamp}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setTrouble(false);
    } catch {
      setTrouble(true);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={save}
        className="rounded border border-edge px-3 py-1.5 font-mono text-[11px] text-muted transition-colors hover:border-leaf hover:text-leaf"
      >
        save image
      </button>
      {trouble ? (
        <p className="mt-1 text-[11px] text-warn">the picture could not be read back</p>
      ) : null}
    </div>
  );
}
