/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { ECSchemaRpcInterface } from "@itwin/ecschema-rpcinterface-common";
import {
  ViewerContentToolsProvider,
  ViewerNavigationToolsProvider,
  ViewerPerformance,
  ViewerStatusbarItemsProvider,
  Viewer as WebViewer,
} from "@itwin/web-viewer-react";
import { useAuthorizationContext } from "../Authorization";
import {
  FitViewTool,
  IModelApp,
  type ScreenViewport,
  StandardViewId,
} from "@itwin/core-frontend";
import { useCallback } from "react";
import { TreeWidget } from "@itwin/tree-widget-react";
import { PropertyGridManager } from "@itwin/property-grid-react";
import {
  MeasurementActionToolbar,
  MeasureTools,
  MeasureToolsUiItemsProvider,
} from "@itwin/measure-tools-react";
import { selectionStorage } from "../SelectionStorage";
import { treeWidgetUiProvider } from "./TreeWidgetUiProvider";
import { propertyGridUiProvider } from "./PropertyGridUiProvider";
import { LeftPanelUIProvider } from "./UIProviders/LeftPanelUIProvider";
import { BottomGridUIProvider } from "./UIProviders/BottomGridUIProvider"; 

interface ViewerProps {
  iTwinId: string;
  iModelId: string;
  changesetId?: string;
}

export function Viewer({ iTwinId, iModelId, changesetId }: ViewerProps) {
  const { client: authClient } = useAuthorizationContext();

  const onIModelAppInit = useCallback(async () => {
    // iModel now initialized
    await TreeWidget.initialize();
    await PropertyGridManager.initialize();
    await MeasureTools.startup();
    MeasurementActionToolbar.setDefaultActionProvider();
  }, []);

  return (
    <WebViewer
      iTwinId={iTwinId}
      iModelId={iModelId}
      changeSetId={changesetId}
      authClient={authClient}
      viewCreatorOptions={viewCreatorOptions}
      enablePerformanceMonitors={true} // see description in the README (https://www.npmjs.com/package/@itwin/web-viewer-react)
      onIModelAppInit={onIModelAppInit}
      mapLayerOptions={{
        BingMaps: {
          key: "key",
          value: process.env.IMJS_BING_MAPS_KEY ?? "",
        },
      }}
      backendConfiguration={{
        defaultBackend: {
          rpcInterfaces: [ECSchemaRpcInterface],
        },
      }}
      uiProviders={[
        new ViewerNavigationToolsProvider(),
        new LeftPanelUIProvider(),
        new BottomGridUIProvider(),
        new ViewerContentToolsProvider({
          vertical: {
            measureGroup: false,
          },
        }),
        new ViewerStatusbarItemsProvider(),
        new MeasureToolsUiItemsProvider(),
        treeWidgetUiProvider,
        propertyGridUiProvider,
      ]}
      selectionStorage={selectionStorage}
    />
  );
}

const viewCreatorOptions = { viewportConfigurer: viewConfiguration };

/**
 * NOTE: This function will execute the "Fit View" tool after the iModel is loaded into the Viewer.
 * This will provide an "optimal" view of the model. However, it will override any default views that are
 * stored in the iModel. Delete this function and the prop that it is passed to if you prefer
 * to honor default views when they are present instead (the Viewer will still apply a similar function to iModels that do not have a default view).
 */
function viewConfiguration(viewPort: ScreenViewport) {
  // default execute the fitview tool and use the iso standard view after tile trees are loaded
  const tileTreesLoaded = async () => {
    return new Promise((resolve, reject) => {
      const start = new Date();
      const intvl = setInterval(() => {
        if (viewPort.areAllTileTreesLoaded) {
          ViewerPerformance.addMark("TilesLoaded");
          ViewerPerformance.addMeasure(
            "TileTreesLoaded",
            "ViewerStarting",
            "TilesLoaded"
          );
          clearInterval(intvl);
          resolve(true);
        }
        const now = new Date();
        // after 20 seconds, stop waiting and fit the view
        if (now.getTime() - start.getTime() > 20000) {
          reject(new Error("Timeout waiting for tile trees to load"));
        }
      }, 100);
    });
  };

  void tileTreesLoaded().finally(() => {
    void IModelApp.tools.run(FitViewTool.toolId, viewPort, true, false);
    viewPort.view.setStandardRotation(StandardViewId.Iso);
  });
}
