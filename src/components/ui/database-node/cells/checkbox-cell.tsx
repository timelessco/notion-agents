import { Checkbox } from "@/components/ui/checkbox";

export const CheckboxCell = ({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) => (
  <div className="flex items-center justify-center" onMouseDown={(e) => e.stopPropagation()}>
    <Checkbox
      checked={!!value}
      onCheckedChange={(v) => onChange(!!v)}
      aria-label="Toggle"
      className="size-4"
    />
  </div>
);
