const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withIosSettings(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

        // Codigo para forzar C++17
        const fixCode = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = "c++17"
      end
    end
        `;

        // Buscamos el inicio del bloque post_install usando Regex
        const regex = /post_install\s*do\s*\|installer\|/;
        
        if (regex.test(podfileContent) && !podfileContent.includes('CLANG_CXX_LANGUAGE_STANDARD')) {
          podfileContent = podfileContent.replace(regex, (match) => `${match}\n${fixCode}`);
          fs.writeFileSync(podfilePath, podfileContent);
        }
      }
      return config;
    },
  ]);
};