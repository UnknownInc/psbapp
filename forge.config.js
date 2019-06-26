const { utils: { fromBuildIdentifier } } = require('@electron-forge/core');

module.exports = {
    "buildIdentifier": process.env.IS_BETA ? 'beta' : 'prod',
    "packagerConfig": {
      "appBundleId": fromBuildIdentifier({ beta: 'com.rmcloudsoftware.beta.psb', prod: 'com.rmcloudsoftware.psb' })
    },
    "makers": [
      {
        "name": "@electron-forge/maker-squirrel",
        "config": {
          "name": "psbapp"
        }
      },
      {
        "name": "@electron-forge/maker-zip",
        "platforms": [
          "darwin"
        ]
      },
      {
        "name": "@electron-forge/maker-deb",
        "config": {}
      },
      {
        "name": "@electron-forge/maker-rpm",
        "config": {}
      }
    ]
  }