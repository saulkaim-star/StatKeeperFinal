
with open('android/app/build.gradle', 'r') as f:
    lines = f.readlines()

with open('structure.txt', 'w') as out:
    for i, line in enumerate(lines):
        if 130 <= i <= 150:
            out.write(f"{i+1}: {line}")
