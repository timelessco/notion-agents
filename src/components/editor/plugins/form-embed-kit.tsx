import { createPlatePlugin } from "platejs/react";
import { FormEmbedElement } from "@/components/ui/form-embed-node";

export const FormEmbedPlugin = createPlatePlugin({
  key: "formEmbed",
  node: { isElement: true, isVoid: true, component: FormEmbedElement },
});

export const FormEmbedKit = [FormEmbedPlugin];
