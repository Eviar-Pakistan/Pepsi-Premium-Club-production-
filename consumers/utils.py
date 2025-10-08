import re
import pytesseract
from PIL import Image

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def parse_receipt(image_path):
    try:
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)

        bill_no_match = re.search(r"Bill\s*No\s*[:.’']*\s*([0-9-]+)", text, re.IGNORECASE)
        bill_no = bill_no_match.group(1) if bill_no_match else "Not found"

        total_match = re.search(r"Total\s*[:.\s]*Rs?\s*([0-9,]+\.?\d*)", text, re.IGNORECASE)
        if not total_match:
            total_match = re.search(r"Subtotal\s*[:.\s]*Rs?\s*([0-9,]+\.?\d*)", text, re.IGNORECASE)

        if not total_match:
            rs_matches = re.findall(r"Rs\s*([0-9,]+\.?\d*)", text, re.IGNORECASE)
            if rs_matches:
                total_match = [rs_matches[-1]]  
        total_price = total_match[0] if total_match else "Not found"

        products = ["Pepsi", "Aquafina", "Mirinda", "Mountain Dew", "Sting", "Gatorade"]
        found_products = {}
        
        for product in products:

            pattern1 = rf"{product}\s*[x*×]\s*(\d+)"
            pattern2 = rf"(\d+)\s*[x*×]?\s*{product}"
            pattern3 = rf"{product}.*?(\d+)"
            pattern4 = rf"\b{product}\b"
            
            match = re.search(pattern1, text, re.IGNORECASE)
            if not match:
                match = re.search(pattern2, text, re.IGNORECASE)
            if not match:
                match = re.search(pattern3, text, re.IGNORECASE)
            
            if match:
                quantity = match.group(1)
                found_products[product] = int(quantity)
            elif re.search(pattern4, text, re.IGNORECASE):
                found_products[product] = 1

        return bill_no, total_price, text, found_products
    except Exception as e:
        return "Error", str(e), "", {}
