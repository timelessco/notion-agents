import { createPlatePlugin } from "platejs/react";

import { ChartEmbedElement } from "@/components/ui/chart-embed-node";

export const ChartEmbedPlugin = createPlatePlugin({
  key: "chartEmbed",
  node: { isElement: true, isVoid: true, component: ChartEmbedElement },
});

export const ChartEmbedKit = [ChartEmbedPlugin];
