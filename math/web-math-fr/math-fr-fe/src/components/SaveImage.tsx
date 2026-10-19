import { useState, type RefObject } from "react";
import { Button, Text } from "@kit/index";

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
      <Button variant="outline"
        type="button"
        onClick={save}
      >
        Save image
      </Button>
      {trouble ? (
        <Text kind="warning" as="p" className="mt-1">The picture could not be read back</Text>
      ) : null}
    </div>
  );
}
