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

        // Bloque de código que fuerza C++17
        const fixCode = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end
        `;

        // Buscamos el lugar exacto usando Regex (flexible con espacios)
        const regex = /post_install\s*do\s*\|installer\|/;
        
        if (regex.test(podfileContent) && !podfileContent.includes('CLANG_CXX_LANGUAGE_STANDARD')) {
          // Pegamos la cura
          podfileContent = podfileContent.replace(regex, (match) => `${match}\n${fixCode}`);
          fs.writeFileSync(podfilePath, podfileContent);
        }
      }
      return config;
    },
  ]);
};