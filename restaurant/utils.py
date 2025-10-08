import cv2
import numpy as np
import os
import sys
from ultralytics import YOLO

os.makedirs('output', exist_ok=True)
os.makedirs('output/crops', exist_ok=True)

model = YOLO('yolov8n.pt')

pepsico_model_paths = [
    "restaurant/runs/detect/pepsico_quick7/weights/best.pt",
]

pepsico_model = None
for path in pepsico_model_paths:
    if os.path.exists(path):
        pepsico_model = YOLO(path)
        print(f"✅ Loaded PepsiCo model: {path}")
        break

if not pepsico_model:
    print("⚠️ No PepsiCo model found. All bottles will be marked as 'Undetected'")

def identify_brand(crop_image, confidence_threshold=0.15):
    """Use PepsiCo model to identify the brand of a bottle crop"""
    if pepsico_model is None:
        return "Undetected", 0.0
    
    try:
        results = pepsico_model(crop_image, conf=confidence_threshold)
        
        if results and len(results[0].boxes) > 0:
            # Get the highest confidence detection
            best_box = max(results[0].boxes, key=lambda x: float(x.conf[0]))
            class_name = pepsico_model.names[int(best_box.cls[0])]
            confidence = float(best_box.conf[0])
            
            # Only return brand if confidence is reasonable
            if confidence > 0.2:
                return class_name, confidence
            else:
                return "Undetected", confidence
        else:
            return "Undetected", 0.0
    except Exception as e:
        print(f"Error in brand identification: {e}")
        return "Undetected", 0.0

def detect_bottles(image_path):
    """Detect bottles and identify brands in the given image"""
    image = cv2.imread(image_path)
    if image is None:
        print("Error: Could not load image.")
        return None, [], [], 0, 0, 0

    original_image = image.copy()
    height, width, _ = image.shape

    # Run YOLOv8 inference with lower confidence for more bottle detections
    results = model(image, conf=0.1, imgsz=640)

    bottle_count = 0
    bottle_details = []

    for result in results:
        for box in result.boxes:
            if int(box.cls) == 39:  # bottle class in COCO
                bottle_count += 1

                # Get bounding box coordinates
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf_score = float(box.conf[0])

                # Crop the bottle region with padding
                pad = 15
                x1_pad = max(0, x1 - pad)
                y1_pad = max(0, y1 - pad)
                x2_pad = min(width, x2 + pad)
                y2_pad = min(height, y2 + pad)

                crop = image[y1_pad:y2_pad, x1_pad:x2_pad]

                # Identify brand
                brand_name, brand_confidence = identify_brand(crop)

                # Save crop
                crop_filename = f"bottle_{bottle_count:02d}_{brand_name.replace(' ', '_')}_{brand_confidence:.2f}.jpg"
                crop_path = os.path.join('output/crops', crop_filename)
                cv2.imwrite(crop_path, crop)

                # Store bottle details
                bottle_info = {
                    'id': bottle_count,
                    'bbox': [x1, y1, x2, y2],
                    'detection_conf': conf_score,
                    'brand': brand_name,
                    'brand_conf': brand_confidence,
                    'crop_path': crop_path
                }
                bottle_details.append(bottle_info)

    # Build PepsiCo matrix (by box position, 5 rows)
    def build_pepsico_matrix(bottle_details, rows=5):
        sorted_bottles = sorted(bottle_details, key=lambda b: (b['bbox'][1], b['bbox'][0]))
        n = len(sorted_bottles)
        row_size = (n + rows - 1) // rows  # ceil division
        matrix = []
        for i in range(rows):
            row_bottles = sorted_bottles[i*row_size:(i+1)*row_size]
            row_bottles = sorted(row_bottles, key=lambda b: b['bbox'][0])
            row = []
            for b in row_bottles:
                if b['brand'] == "Undetected":
                    row.append('u')
                elif b['brand']:
                    row.append(b['brand'][0].lower())
                else:
                    row.append(' ')
            matrix.append(row)
        return matrix

    matrix = build_pepsico_matrix(bottle_details, rows=5)

    # Calculate counts
    total_bottles = len(bottle_details)
    detected_brands = sum(1 for b in bottle_details if b['brand'] != "Undetected")
    undetected = sum(1 for b in bottle_details if b['brand'] == "Undetected")

    # Save output image with bounding boxes
    for bottle in bottle_details:
        x1, y1, x2, y2 = bottle['bbox']
        if bottle['brand'] != "Undetected":
            color = (255, 0, 0)  # Blue for identified
            thickness = 2
        else:
            color = (0, 165, 255)  # Orange for undetected
            thickness = 2
        cv2.rectangle(original_image, (x1, y1), (x2, y2), color, thickness)
        cv2.putText(original_image, f"#{bottle['id']}: {bottle['brand']}", (x1, y1-10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    output_path = os.path.join('output', os.path.basename(image_path))
    cv2.imwrite(output_path, original_image)

    return original_image, bottle_details, matrix, total_bottles, detected_brands, undetected

def print_results(bottle_details, matrix, total_bottles, detected_brands, undetected, image_path):
    """Print detection results to console"""
    print("\n🍼 BOTTLE DETECTION RESULTS")
    print("=" * 50)
    print(f"Image: {image_path}")
    print(f"Total bottles detected: {total_bottles}\n")

    # Count brands
    brand_counts = {}
    for bottle in bottle_details:
        brand = bottle['brand']
        brand_counts[brand] = brand_counts.get(brand, 0) + 1

    print("BRAND SUMMARY:")
    for brand, count in brand_counts.items():
        print(f"  {brand}: {count}")
    print()

    print("DETAILED ANALYSIS:")
    print(f"{'ID':<3} {'Brand':<20} {'Confidence':<12} {'Location':<20}")
    print("-" * 60)
    for bottle in sorted(bottle_details, key=lambda b: b['id']):
        x1, y1, x2, y2 = bottle['bbox']
        print(f"{bottle['id']:<3} {bottle['brand']:<20} ", end="")
        if bottle['brand_conf'] > 0:
            print(f"{bottle['brand_conf']:.2%}       ", end="")
        else:
            print(f"{'N/A':<12} ", end="")
        print(f"({x1},{y1})-({x2},{y2})")

    print("\nPepsiCo Matrix (by box position, 5 rows):")
    for row in matrix:
        print(' '.join(row))

    print(f"\n📁 Output image saved: output/{os.path.basename(image_path)}")
    print(f"📁 Crops saved in: output/crops/")
    print(f"💡 Total PepsiCo bottles: {sum(1 for b in bottle_details if 'pepsi' in b['brand'].lower())}")
    print(f"💡 Identified brands: {detected_brands}")
    print(f"💡 Undetected: {undetected}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python utils.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.isfile(image_path) or not image_path.lower().endswith(('.png', '.jpg', '.jpeg')):
        print("Error: Please provide a valid image file (.png, .jpg, .jpeg)")
        sys.exit(1)

    print(f"Processing image: {image_path}")
    output_image, bottle_details, matrix, total_bottles, detected_brands, undetected = detect_bottles(image_path)
    
    if output_image is not None:
        print_results(bottle_details, matrix, total_bottles, detected_brands, undetected, image_path)
    else:
        print("Error: Failed to process the image.")

if __name__ == "__main__":
    main()

def get_posm_count():
    total_no_of_brand = 5
    detected_brands = 2
    return  detected_brands , total_no_of_brand   