const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withIosSettings(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      // Apuntamos directo a la carpeta ios/Podfile
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        const podfileContent = fs.readFileSync(podfilePath, 'utf-8');
        
        // El código de la cura C++17
        const fixCode = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end
        `;

        // Buscamos la línea exacta donde termina la configuración de React Native
        // Esta línea SIEMPRE existe en Expo 51.
        const anchor = 'react_native_post_install(installer)';

        if (podfileContent.includes(anchor)) {
          // Si ya tiene el fix, no lo ponemos otra vez
          if (!podfileContent.includes('CLANG_CXX_LANGUAGE_STANDARD')) {
             // Reemplazamos la línea por: La línea + Nuestro Código
             const newContent = podfileContent.replace(anchor, `${anchor}\n${fixCode}`);
             fs.writeFileSync(podfilePath, newContent);
             console.log("✅ PARCHE C++17 APLICADO CON ÉXITO");
          }
        } else {
          console.error("⚠️ NO SE ENCONTRÓ EL ANCLA EN EL PODFILE");
        }
      } else {
        console.error("⚠️ NO SE ENCONTRÓ EL ARCHIVO PODFILE en: " + podfilePath);
      }
      return config;
    },
  ]);
};