const { withInfoPlist, withStringsXml } = require('@expo/config-plugins');

module.exports = function withAppName(config, customName) {
  // Update Android app_name
  config = withStringsXml(config, (config) => {
    const strings = config.modResults.resources.string || [];
    const appNameString = strings.find((item) => item.$.name === 'app_name');
    if (appNameString) {
      appNameString._ = customName;
    } else {
      strings.push({ $: { name: 'app_name' }, _: customName });
    }
    config.modResults.resources.string = strings;
    return config;
  });

  // Update iOS CFBundleDisplayName
  config = withInfoPlist(config, (config) => {
    config.modResults.CFBundleDisplayName = customName;
    return config;
  });

  return config;
};
