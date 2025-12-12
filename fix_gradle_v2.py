
import os

file_path = 'android/app/build.gradle'

with open(file_path, 'r') as f:
    content = f.read()

# The pattern to look for
target_pattern = "keyPassword 'android'\n        release {"
replacement = "keyPassword 'android'\n        }\n        release {"

if target_pattern in content:
    new_content = content.replace(target_pattern, replacement)
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("Successfully fixed build.gradle")
else:
    # Try with different whitespace just in case
    target_pattern_2 = "keyPassword 'android'\n            release {" # if indentation was different
    if target_pattern_2 in content:
         new_content = content.replace(target_pattern_2, replacement)
         with open(file_path, 'w') as f:
            f.write(new_content)
         print("Successfully fixed build.gradle (variant 2)")
    else:
        print("Could not find the pattern to replace.")
