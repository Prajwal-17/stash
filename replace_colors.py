import os
import re

directories = ["components", "app"]

replacements = [
    # Backgrounds
    (r'bg-\[\#090909\]', 'bg-background'),
    (r'bg-\[\#141414\]', 'bg-background'),
    (r'bg-\[\#111112\]', 'bg-card'),
    (r'bg-\[\#151515\]', 'bg-popover'),
    (r'bg-\[\#1a1a1a\]', 'bg-popover'),
    (r'bg-\[\#0b0b0c\]', 'bg-background'),
    (r'bg-neutral-950', 'bg-background'),
    (r'bg-neutral-900', 'bg-card'),
    (r'bg-white/4', 'bg-muted'),
    (r'bg-white/5', 'bg-muted'),
    (r'bg-white/6', 'bg-accent'),
    (r'bg-white/8', 'bg-accent'),
    (r'bg-white/10', 'bg-accent'),
    
    # Borders
    (r'border-white/10', 'border-border'),
    (r'border-white/8', 'border-border'),
    (r'border-neutral-800', 'border-border'),
    (r'border-neutral-700', 'border-border'),
    
    # Text
    (r'text-neutral-100', 'text-foreground'),
    (r'text-neutral-200', 'text-foreground'),
    (r'text-neutral-300', 'text-muted-foreground'),
    (r'text-neutral-400', 'text-muted-foreground'),
    (r'text-neutral-500', 'text-muted-foreground'),
    (r'text-neutral-600', 'text-muted-foreground'),
    (r'text-neutral-950', 'text-background'),
    (r'text-white', 'text-foreground'),
    
    # Hover
    (r'hover:bg-white/4', 'hover:bg-accent'),
    (r'hover:bg-white/6', 'hover:bg-accent'),
    (r'hover:bg-white/8', 'hover:bg-accent'),
    (r'hover:bg-white/10', 'hover:bg-accent'),
    (r'hover:bg-neutral-800', 'hover:bg-accent'),
    (r'hover:bg-neutral-900', 'hover:bg-accent'),
    (r'hover:text-white', 'hover:text-accent-foreground'),
    
    # Placeholder
    (r'placeholder:text-neutral-500', 'placeholder:text-muted-foreground'),
    (r'placeholder:text-neutral-600', 'placeholder:text-muted-foreground'),
    
    # Focus
    (r'focus:border-white/20', 'focus:border-ring'),
    (r'focus:border-neutral-700', 'focus:border-ring'),
]

for directory in directories:
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()
                
                original = content
                for old, new in replacements:
                    content = re.sub(old, new, content)
                
                if original != content:
                    with open(filepath, 'w') as f:
                        f.write(content)
                    print(f"Updated {filepath}")

