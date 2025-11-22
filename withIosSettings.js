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

        // Codigo de la cura (SIN el bloque 'post_install do', solo lo de adentro)
        const fixCode = `
    # --- FIX INYECTADO CORRECTAMENTE ---
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end
    # -----------------------------------
        `;

        // Buscamos la funcion clave que ya existe dentro del bloque post_install
        const anchor = 'react_native_post_install(installer)';
        
        if (podfileContent.includes(anchor)) {
           // Si aun no tiene nuestro fix, lo pegamos justo despues de esa linea
           if (!podfileContent.includes('FIX INYECTADO')) {
             const newContent = podfileContent.replace(anchor, `${anchor}\n${fixCode}`);
             fs.writeFileSync(podfilePath, newContent);
           }
        }
      }
      return config;
    },
  ]);
};