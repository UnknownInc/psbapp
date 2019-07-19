const { utils: { fromBuildIdentifier } } = require('@electron-forge/core');

module.exports = {
    "buildIdentifier": process.env.IS_BETA ? 'beta' : 'prod',
    "asar": true,
    "platform": 'all',
    "packagerConfig": {
      "appCopyright":"Copyright (c) 2019 publicis sapient.",
      "appBundleId": fromBuildIdentifier({ beta: 'com.publicissapient.beta.psb', prod: 'com.publicissapient.psb' }),
      "appCategoryType": "public.app-category.business",
      "icon":"images/psb",
    },
    "makers": [
      // {
      //   "name": "@electron-forge/maker-squirrel",
      //   "config": {
      //     "name": "psbapp"
      //   }
      // },
      // {
      //   name: '@electron-forge/maker-dmg',
      //   config: {
      //     name:'psb',
      //     icon:"images/psb.icns",
      //     background: './images/DmgBkg.png',
      //     overwite: true,
      //     additionalDMGOptions:{
      //       "code-sign":{
      //         "signing-identity":"rravuri@gmail.com"
      //       }
      //     }
      //   }
      // },
      {
        name: '@electron-forge/maker-wix',
        config:{
          appUserModelId:'com.rmcloudsoftware.psb'
        }
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