import type { PlateElementProps } from "platejs/react";
import { PlateElement, useReadOnly } from "platejs/react";
import { Link } from "@tanstack/react-router";
import { FileIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface FormEmbedElementData {
  type: "formEmbed";
  id?: string;
  formId: string;
  title?: string;
  children: [{ text: "" }];
}

export const createFormEmbedNode = (data: {
  formId: string;
  title?: string;
}): FormEmbedElementData => ({
  type: "formEmbed",
  formId: data.formId,
  title: data.title,
  children: [{ text: "" }],
});

export const FormEmbedElement = (props: PlateElementProps) => {
  const { element, children } = props;
  const readOnly = useReadOnly();
  const formId = element.formId as string | undefined;
  const title = (element.title as string | undefined) ?? "Untitled form";

  return (
    <PlateElement {...props} className={cn("clear-both my-3", props.className)}>
      <div contentEditable={false} role="presentation" className="select-none">
        {formId ? (
          <Link
            to="/forms/$formId"
            params={{ formId }}
            className="flex items-center gap-3 rounded-md border bg-muted/30 px-4 py-3 text-sm hover:bg-muted/50"
            target={readOnly ? undefined : "_blank"}
            rel="noreferrer"
          >
            <FileIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{title}</span>
            <span className="ml-auto text-muted-foreground text-xs">Form</span>
          </Link>
        ) : (
          <div className="rounded-md border border-dashed px-4 py-3 text-muted-foreground text-sm">
            Empty form embed — missing formId
          </div>
        )}
      </div>
      {children}
    </PlateElement>
  );
};
