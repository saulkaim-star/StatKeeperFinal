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
        
        // CODIGO FUERZA BRUTA
        // Inyectamos un bloque al final que busca todos los targets y fuerza C++17
        // Usamos 'post_install' de nuevo, pero confiamos en que Ruby lo ejecute en orden.
        const fixCode = `
# --- FUERZA BRUTA C++17 ---
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
    end
  end
end
# --------------------------
`;
        
        // Si no tiene el fix, lo pegamos al final del archivo a la fuerza
        if (!podfileContent.includes('FUERZA BRUTA C++17')) {
          const newContent = podfileContent + '\n' + fixCode;
          fs.writeFileSync(podfilePath, newContent);
        }
      }
      return config;
    },
  ]);
};