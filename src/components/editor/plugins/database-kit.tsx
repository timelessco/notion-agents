import { createPlatePlugin } from "platejs/react";

import { DatabaseElement } from "@/components/ui/database-node";

export const DatabasePlugin = createPlatePlugin({
  key: "database",
  node: {
    isElement: true,
    isVoid: true,
    isSelectable: true,
    component: DatabaseElement,
  },
});

export const DatabaseKit = [DatabasePlugin];
