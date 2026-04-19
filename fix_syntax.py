import re

with open('src/constants/tarotData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the malformed block
# It starts after the closing brace of the first 星币十
pattern = r'(\s*\},\n)"advice": "现在的你应该展现出作为一名家族.*?(\s*\},\n\{\n\s*"name": "星币侍从",)'
match = re.search(pattern, content, re.DOTALL)

if match:
    print("Found malformed block!")
    new_content = content[:match.start()] + match.group(1) + match.group(2).lstrip('}, \n')
    # wait, if I keep match.group(1) which is "  },\n", then I should just append "{\n    \"name\": \"星币侍从\","
    
    # Let's do it simpler:
    # Just replace the whole matched pattern with "  },\n{\n    \"name\": \"星币侍从\","
    
    replacement = '  },\n{\n    "name": "星币侍从",'
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    with open('src/constants/tarotData.ts', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced.")
else:
    print("Pattern not found. Let's try another regex.")
    pattern2 = r'(\s*\},\n)"advice": "现在的你应该展现出.*?"descriptionReversed": "当星币十出现在逆位时.*?(\s*\},\n\{\n\s*"name": "星币侍从",)'
    match2 = re.search(pattern2, content, re.DOTALL)
    if match2:
        print("Found malformed block with pattern 2!")
        replacement = '  },\n{\n    "name": "星币侍从",'
        new_content = re.sub(pattern2, replacement, content, flags=re.DOTALL)
        with open('src/constants/tarotData.ts', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Replaced pattern 2.")
    else:
        print("Still not found.")

