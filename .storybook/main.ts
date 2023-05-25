// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/* eslint-disable filenames/match-exported */

import { StorybookConfig } from "@storybook/react-webpack5";
import path from "path";
import { Configuration } from "webpack";

import { makeConfig } from "@foxglove/studio-base/webpack";

const storybookConfig: StorybookConfig = {
  // Workaround for https://github.com/storybookjs/storybook/issues/19446
  stories: ["../packages/**/!(node_modules)**/*.stories.tsx"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-actions",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  // Carefully merge our main webpack config with the Storybook default config.
  // For the most part, our webpack config has already been designed to handle
  // all the imports and edge cases we need to support. However, at least some of
  // Storybook's config is required, for instance the HtmlWebpackPlugin that they
  // use to generate the main iframe page.
  webpackFinal: (config: Configuration): Configuration => {
    const studioWebpackConfig = makeConfig(
      undefined,
      { mode: config.mode },
      {
        allowUnusedVariables: true,
        version: "0.0.0-storybook",
        // We are only setting the configFile from Storybook as it is required to properly resolve
        // some assumptions made while traversing the dependency tree in Chromatic.
        tsconfigPath: `${path.resolve(__dirname)}/tsconfig.json`,
      },
    );
    return {
      ...config,
      // context is required for ForkTsCheckerWebpackPlugin to find .storybook/tsconfig.json
      optimization: {
        ...config.optimization,
        minimize: false, // disabling minification improves build performance
      },

      resolve: {
        ...studioWebpackConfig.resolve,
        alias: {
          ...studioWebpackConfig.resolve?.alias,
        },
      },
      module: studioWebpackConfig.module,
      plugins: (config.plugins ?? [])
        // DocgenPlugin adds to the build time and we don't use storybook's autogenerated docs.
        .filter((plugin) => plugin.constructor.name !== "DocgenPlugin")
        .concat(studioWebpackConfig.plugins ?? []),
    };
  },
};

module.exports = storybookConfig;
