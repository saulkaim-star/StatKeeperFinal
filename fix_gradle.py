
import os

file_path = 'android/app/build.gradle'

with open(file_path, 'r') as f:
    content = f.read()

# The bad block I identified
bad_block = """    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }"""

# The good block
good_block = """    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }"""

if bad_block in content:
    new_content = content.replace(bad_block, good_block)
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("Successfully fixed build.gradle")
else:
    print("Could not find the exact bad block to replace. Dumping content for debugging:")
    print(content[1000:2000]) # Dump a chunk where it likely is
