import { getTranslation } from "./utils/getTranslation";
import { PLUGIN_ID } from "./pluginId";
import { Initializer } from "./components/Initializer";
import { PluginIcon } from "./components/PluginIcon";
import { ContentManagerWidget } from "./components/ContentManagerWidget";

import type { StrapiApp } from "@strapi/strapi/admin";

const plugin: StrapiApp["appPlugins"][string] = {
  register(app) {
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: 'Publishing Workflow',
      },
      Component: () => import('./pages/Settings'),
      permissions: [],
    });

    app.addSettingsLink('global', {
      intlLabel: {
        id: `${PLUGIN_ID}.settings.link`,
        defaultMessage: 'Publishing Workflow',
      },
      id: `${PLUGIN_ID}-settings`,
      to: `plugins/${PLUGIN_ID}`,
      Component: () => import('./pages/Settings'),
      permissions: [],
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  bootstrap(app: Pick<StrapiApp, 'addSettingsLink' | 'addSettingsLinks' | 'getPlugin' | 'registerHook'>) {
    app.getPlugin("content-manager").injectComponent("editView", "right-links", {
      name: "publishing-workflow-widget",
      Component: ContentManagerWidget,
    });
  },

  registerTrads({ locales }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = (await import(
            `./translations/${locale}.json`
          )) as {
            default: Record<string, string>;
          };

          const newData: Record<string, string> = {};
          const keys = Object.keys(data);

          for (const key of keys) {
            newData[getTranslation(key)] = data[key];
          }

          return { data: newData, locale };
        } catch {
          return { data: {}, locale };
        }
      }),
    );
  },
};

export default plugin;