from docx import Document
from docx.shared import Pt
import re
import os

def create_word_document(content, output_path):
    """
    Creates a Word document from provided content.
    Supports basic markdown-like syntax for headings and attempts to
    render scientific symbols in a "Word-like" way.
    """
    doc = Document()
    
    # Common LaTeX to Unicode mappings for "readable" Word documents
    symbol_map = {
        r'\\psi': 'ψ',
        r'\\phi': 'ϕ',
        r'\\theta': 'θ',
        r'\\pi': 'π',
        r'\\alpha': 'α',
        r'\\beta': 'β',
        r'\\gamma': 'γ',
        r'\\delta': 'δ',
        r'\\epsilon': 'ε',
        r'\\hbar': 'ħ',
        r'\\infty': '∞',
        r'\\sqrt': '√',
        r'\\int': '∫',
        r'\\sum': '∑',
        r'\\partial': '∂',
        r'\\nabla': '∇',
        r'\\Delta': 'Δ',
        r'\\approx': '≈',
        r'\\neq': '≠',
        r'\\le': '≤',
        r'\\ge': '≥',
        r'\\times': '×',
        r'\\cdot': '·',
        r'\\rightarrow': '→',
        r'\\Rightarrow': '⇒',
        r'\\dots': '...',
        r'\\text{.*?}' : lambda m: m.group(0)[6:-1], # Remove \text{}
    }

    def clean_math(text):
        # Remove LaTeX math markers \( \) and \[ \]
        text = re.sub(r'\\\[(.*?)\\\]', r'\1', text)
        text = re.sub(r'\\\((.*?)\\\)', r'\1', text)
        
        # Replace symbols
        for latex, uni in symbol_map.items():
            if callable(uni):
                text = re.sub(latex, uni, text)
            else:
                text = re.sub(latex, uni, text)
        
        # Clean up common LaTeX structures
        text = re.sub(r'\^(\d)', r'^\1', text) # Simple superscript
        text = re.sub(r'_(\d)', r'_\1', text) # Simple subscript
        text = re.sub(r'\\{', '{', text)
        text = re.sub(r'\\}', '}', text)
        
        return text

    lines = content.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if line.startswith('# '):
            doc.add_heading(clean_math(line[2:]), 0)
        elif line.startswith('## '):
            doc.add_heading(clean_math(line[3:]), 1)
        elif line.startswith('### '):
            doc.add_heading(clean_math(line[4:]), 2)
        else:
            # Paragraph - bold formatting handling
            p = doc.add_paragraph()
            # Split line by bold markers **
            parts = re.split(r'(\*\*.*?\*\*)', line)
            for part in parts:
                if part.startswith('**') and part.endswith('**'):
                    run = p.add_run(clean_math(part[2:-2]))
                    run.bold = True
                else:
                    p.add_run(clean_math(part))
            
    doc.save(output_path)
    return output_path

if __name__ == "__main__":
    # Test generation
    test_content = """# Quantum Mechanics Notes
## Introduction
Complex numbers are fundamental to quantum mechanics.
### The Imaginary Unit
The imaginary unit i is defined as the square root of -1.
## Wave Functions
The wave function psi is a complex-valued function.
"""
    test_output = "test_note.docx"
    create_word_document(test_content, test_output)
    print(f"Test document created at: {os.path.abspath(test_output)}")
