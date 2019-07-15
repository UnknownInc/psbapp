const { utils: { fromBuildIdentifier } } = require('@electron-forge/core');

module.exports = {
    "buildIdentifier": process.env.IS_BETA ? 'beta' : 'prod',
    "asar": true,
    "platform": 'all',
    "packagerConfig": {
      "appCopyright":"Copyright (c) 2019 piblicis sapient.",
      "appBundleId": fromBuildIdentifier({ beta: 'com.rmcloudsoftware.beta.psb', prod: 'com.rmcloudsoftware.psb' }),
      "appCategoryType": "public.app-category.business",
      "icon":"images/psb",
    },
    "makers": [
      {
        "name": "@electron-forge/maker-squirrel",
        "config": {
          "name": "psbapp"
        }
      },
      {
        name: '@electron-forge/maker-dmg',
        config: {
          name:'psb',
          icon:"images/psb.icns",
          background: './images/DmgBkg.png',
          overwite: true,
          additionalDMGOptions:{
          }
        }
      },
      {
        name: '@electron-forge/maker-wix',
      },
      {
        "name": "@electron-forge/maker-zip",
        // "platforms": [
        //   "darwin",
        //   "windows"
        // ]
      },
      {
        "name": "@electron-forge/maker-deb",
        "config": {}
      },
      {
        "name": "@electron-forge/maker-rpm",
        "config": {}
      }
    ],
    publishers:[
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: {
                    owner: 'UnknownInc',
                    name: 'psbapp'
                },
                prerelease: true
            }
        }
    ]
  }