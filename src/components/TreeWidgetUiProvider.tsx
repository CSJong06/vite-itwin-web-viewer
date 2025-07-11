/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  CategoriesTreeComponent,
  createTreeWidget,
  ModelsTreeComponent,
} from "@itwin/tree-widget-react";
import { selectionStorage } from "../SelectionStorage";
import { getSchemaContext } from "../SchemaContext";

export const treeWidgetUiProvider = {
  id: "TreeWidgetUIProvider",
  getWidgets: () => [
    createTreeWidget({
      trees: [
        {
          id: ModelsTreeComponent.id,
          getLabel: () => ModelsTreeComponent.getLabel(),
          render: (props) => (
            <ModelsTreeComponent
              getSchemaContext={getSchemaContext}
              density={props.density}
              selectionStorage={selectionStorage}
              selectionMode={"extended"}
              onPerformanceMeasured={props.onPerformanceMeasured}
              onFeatureUsed={props.onFeatureUsed}
            />
          ),
        },
        {
          id: CategoriesTreeComponent.id,
          getLabel: () => CategoriesTreeComponent.getLabel(),
          render: (props) => (
            <CategoriesTreeComponent
              getSchemaContext={getSchemaContext}
              density={props.density}
              selectionStorage={selectionStorage}
              onPerformanceMeasured={props.onPerformanceMeasured}
              onFeatureUsed={props.onFeatureUsed}
            />
          ),
        },
      ],
    }),
  ],
};
