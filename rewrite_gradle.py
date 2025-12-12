
import os

file_path = 'android/app/build.gradle'

with open(file_path, 'r') as f:
    lines = f.readlines()

start_index = -1
end_index = -1

for i, line in enumerate(lines):
    if 'signingConfigs {' in line:
        start_index = i
    if 'packagingOptions {' in line:
        end_index = i
        break

if start_index != -1 and end_index != -1:
    new_content = lines[:start_index]
    
    # Insert correct blocks
    new_content.append('    signingConfigs {\n')
    new_content.append('        debug {\n')
    new_content.append("            storeFile file('debug.keystore')\n")
    new_content.append("            storePassword 'android'\n")
    new_content.append("            keyAlias 'androiddebugkey'\n")
    new_content.append("            keyPassword 'android'\n")
    new_content.append('        }\n')
    new_content.append('        release {\n')
    new_content.append("            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {\n")
    new_content.append("                storeFile file(MYAPP_UPLOAD_STORE_FILE)\n")
    new_content.append("                storePassword MYAPP_UPLOAD_STORE_PASSWORD\n")
    new_content.append("                keyAlias MYAPP_UPLOAD_KEY_ALIAS\n")
    new_content.append("                keyPassword MYAPP_UPLOAD_KEY_PASSWORD\n")
    new_content.append("            }\n")
    new_content.append('        }\n')
    new_content.append('    }\n')
    new_content.append('    buildTypes {\n')
    new_content.append('        debug {\n')
    new_content.append('            signingConfig signingConfigs.debug\n')
    new_content.append('        }\n')
    new_content.append('        release {\n')
    new_content.append('            signingConfig signingConfigs.release\n')
    new_content.append('            minifyEnabled false\n')
    new_content.append('            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"\n')
    new_content.append('        }\n')
    new_content.append('    }\n')
    
    new_content.extend(lines[end_index:])
    
    with open(file_path, 'w') as f:
        f.writelines(new_content)
    print("Successfully rewrote signingConfigs and buildTypes")
else:
    print(f"Could not find start ({start_index}) or end ({end_index}) indices")
