#!/usr/bin/env python3
"""
Text Extractor - OCR Helper Script
Processes images using Tesseract OCR and returns detected text with bounding boxes
"""

import sys
import json
import os

def check_dependencies():
    """Check if required dependencies are installed."""
    errors = []
    
    try:
        import pytesseract
    except ImportError:
        errors.append("pytesseract module not found. Install with: pip3 install pytesseract")
    
    try:
        from PIL import Image
    except ImportError:
        errors.append("Pillow module not found. Install with: pip3 install Pillow")
    
    # Check for tesseract binary
    import shutil
    if not shutil.which('tesseract'):
        errors.append("Tesseract OCR not found. Install tesseract-ocr package.")
    
    return errors

def get_available_languages():
    """Get list of available Tesseract languages."""
    try:
        import pytesseract
        return pytesseract.get_languages()
    except Exception:
        return ['eng']

def process_image(image_path, language='eng'):
    """
    Process image with Tesseract OCR and return text regions with bounding boxes.
    
    Args:
        image_path: Path to the image file
        language: Tesseract language code (default: 'eng')
    
    Returns:
        Dictionary with OCR results including text and bounding boxes
    """
    import pytesseract
    from PIL import Image
    
    # Validate image path
    if not os.path.exists(image_path):
        return {
            'success': False,
            'error': f'Image file not found: {image_path}',
            'text': '',
            'regions': []
        }
    
    try:
        # Open image
        image = Image.open(image_path)
        image_width, image_height = image.size
        
        # Check if language is available
        available_langs = get_available_languages()
        if language not in available_langs:
            # Fall back to English if requested language not available
            if 'eng' in available_langs:
                language = 'eng'
            elif available_langs:
                language = available_langs[0]
        
        # Get detailed OCR data with bounding boxes
        ocr_data = pytesseract.image_to_data(image, lang=language, output_type=pytesseract.Output.DICT)
        
        # Process OCR results
        regions = []
        full_text_lines = []
        current_line = {
            'text': '',
            'words': [],
            'line_num': -1,
            'block_num': -1
        }
        
        n_boxes = len(ocr_data['text'])
        
        for i in range(n_boxes):
            text = ocr_data['text'][i].strip()
            conf = int(ocr_data['conf'][i])
            
            # Skip empty text or low confidence
            if not text or conf < 0:
                continue
            
            # Get bounding box
            x = ocr_data['left'][i]
            y = ocr_data['top'][i]
            w = ocr_data['width'][i]
            h = ocr_data['height'][i]
            
            line_num = ocr_data['line_num'][i]
            block_num = ocr_data['block_num'][i]
            word_num = ocr_data['word_num'][i]
            
            # Create word region
            word_region = {
                'text': text,
                'x': x,
                'y': y,
                'width': w,
                'height': h,
                'confidence': conf,
                'line_num': line_num,
                'block_num': block_num,
                'word_num': word_num
            }
            regions.append(word_region)
            
            # Build lines for full text
            if line_num != current_line['line_num'] or block_num != current_line['block_num']:
                # Save previous line
                if current_line['text']:
                    full_text_lines.append(current_line['text'])
                
                # Start new line
                current_line = {
                    'text': text,
                    'words': [word_region],
                    'line_num': line_num,
                    'block_num': block_num
                }
            else:
                # Continue current line
                current_line['text'] += ' ' + text
                current_line['words'].append(word_region)
        
        # Don't forget last line
        if current_line['text']:
            full_text_lines.append(current_line['text'])
        
        # Group words into lines for easier selection
        line_regions = []
        lines_by_key = {}
        
        for region in regions:
            key = (region['block_num'], region['line_num'])
            if key not in lines_by_key:
                lines_by_key[key] = {
                    'words': [],
                    'text': '',
                    'x': region['x'],
                    'y': region['y'],
                    'width': region['width'],
                    'height': region['height'],
                    'block_num': region['block_num'],
                    'line_num': region['line_num']
                }
            
            line = lines_by_key[key]
            line['words'].append(region)
            
            # Update line bounding box
            line['x'] = min(line['x'], region['x'])
            line['y'] = min(line['y'], region['y'])
            right = max(line['x'] + line['width'], region['x'] + region['width'])
            bottom = max(line['y'] + line['height'], region['y'] + region['height'])
            line['width'] = right - line['x']
            line['height'] = bottom - line['y']
        
        # Build line text and convert to list
        for key in sorted(lines_by_key.keys()):
            line = lines_by_key[key]
            line['text'] = ' '.join([w['text'] for w in sorted(line['words'], key=lambda w: w['x'])])
            line_regions.append(line)
        
        # Get full text
        full_text = pytesseract.image_to_string(image, lang=language).strip()
        
        return {
            'success': True,
            'error': None,
            'text': full_text,
            'regions': regions,
            'lines': line_regions,
            'image_width': image_width,
            'image_height': image_height,
            'language': language
        }
        
    except pytesseract.TesseractNotFoundError:
        return {
            'success': False,
            'error': 'Tesseract OCR is not installed or not in PATH',
            'text': '',
            'regions': [],
            'lines': []
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'text': '',
            'regions': [],
            'lines': []
        }

def main():
    """Main entry point."""
    # Check arguments
    if len(sys.argv) < 2:
        result = {
            'success': False,
            'error': 'Usage: ocr_helper.py <image_path> [language]',
            'text': '',
            'regions': [],
            'lines': []
        }
        print(json.dumps(result))
        sys.exit(1)
    
    image_path = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else 'eng'
    
    # Check dependencies first
    dep_errors = check_dependencies()
    if dep_errors:
        result = {
            'success': False,
            'error': '; '.join(dep_errors),
            'text': '',
            'regions': [],
            'lines': []
        }
        print(json.dumps(result))
        sys.exit(1)
    
    # Process image
    result = process_image(image_path, language)
    
    # Output JSON result
    print(json.dumps(result))
    
    # Exit with appropriate code
    sys.exit(0 if result['success'] else 1)

if __name__ == '__main__':
    main()
