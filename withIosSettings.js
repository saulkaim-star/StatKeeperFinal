const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withIosSettings(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        const podfileContent = fs.readFileSync(podfilePath, 'utf-8');
        
        // Este código fuerza C++17 y corrige los Headers.
        // Es la medicina exacta para 'shared_mutex not found'.
        const fixCode = `
    # --- FIX INYECTADO PARA FIREBASE + STATIC ---
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end
    # --------------------------------------------
        `;

        // Buscamos una línea que SIEMPRE está en el Podfile de Expo 51
        const anchor = 'react_native_post_install(installer';
        
        if (podfileContent.includes(anchor) && !podfileContent.includes('FIX INYECTADO')) {
          // Pegamos nuestro código justo después de esa línea
          const newContent = podfileContent.replace(anchor, `${anchor})\n${fixCode}`);
          fs.writeFileSync(podfilePath, newContent);
        }
      }
      return config;
    },
  ]);
};