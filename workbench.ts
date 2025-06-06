import { create } from 'vs/workbench/workbench.web.main';
import { URI, UriComponents } from 'vs/base/common/uri';
import { IWorkbenchConstructionOptions, IWorkspace, IWorkspaceProvider } from 'vs/workbench/browser/web.api';
declare const window: any;

(async function () {
  // create workbench
  let config: IWorkbenchConstructionOptions & {
    folderUri?: UriComponents;
    workspaceUri?: UriComponents;
    domElementId?: string;
  } = {};

  if (window.product) {
    config = window.product;
  } else {
    const result = await fetch("vscode/product.json");
    config = await result.json();
  }

  if (Array.isArray(config.additionalBuiltinExtensions)) {
    const tempConfig = { ...config };

    tempConfig.additionalBuiltinExtensions =
      config.additionalBuiltinExtensions.map((ext) => {
        if (window.location.protocol === 'https:') {
          ext.scheme = 'https';
          ext.authority = window.location.host;
          ext.path = "web/vscode/" + ext.path;
        }
        return URI.revive(ext);
      });
    config = tempConfig;
  }

  let actionId = '';
  let actionName = '';
  const url = new URL(window.location.href);
  const encodedParam = url.searchParams.get('origin') || '';
  const decodedParam = decodeURIComponent(encodedParam);

  decodedParam.split('?')[1].split('&').forEach((key: any) => {
    const query = key.split('=');
    if (query[0] === 'id') {
      actionId = query[1];
    }

    if (query[0] === 'name') {
      actionName = query[1];
    }
  });

  if (actionId) {
    config.folderUri = {
      scheme: "memfs",
      path: `/${actionName}`
    };
  }

  let workspace;
  if (config.folderUri) {
    workspace = { folderUri: URI.revive(config.folderUri) };
  } else if (config.workspaceUri) {
    workspace = { workspaceUri: URI.revive(config.workspaceUri) };
  } else {
    workspace = undefined;
  }

  if (workspace) {
    const workspaceProvider: IWorkspaceProvider = {
      workspace,
      open: async (
        workspace: IWorkspace,
        options?: { reuse?: boolean; payload?: object }
      ) => true,
      trusted: true,
    };
    config = { ...config, workspaceProvider };
  }

  const domElement = !!config.domElementId
    && document.getElementById(config.domElementId)
    || document.body;

  create(domElement, config);
})();