
with open('android/app/build.gradle', 'r') as f:
    lines = f.readlines()
    with open('debug_lines.txt', 'w') as out:
        for i, line in enumerate(lines[130:160]):
            out.write(f'{i+131}: {line}')
