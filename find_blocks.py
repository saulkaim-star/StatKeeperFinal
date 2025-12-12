
with open('android/app/build.gradle', 'r') as f:
    lines = f.readlines()

keywords = ['signingConfigs {', 'buildTypes {', 'release {', 'debug {', 'defaultConfig {']
for i, line in enumerate(lines):
    for kw in keywords:
        if kw in line:
            print(f'{i+1}: {line.strip()}')
