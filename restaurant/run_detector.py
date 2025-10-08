import sys
from .utils import detect_bottles

def get_bottle_counts(image_path):
    output_image, bottle_details, matrix, total_bottles, detected_brands, undetected = detect_bottles(image_path)

    # Count PepsiCo bottles
    pepsico_bottles = sum(1 for b in bottle_details if 'pepsi' in b['brand'].lower())

    return pepsico_bottles,total_bottles

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python run_detector.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]
    total_bottles, pepsico_bottles = get_bottle_counts(image_path)

    print(f"Total bottles detected: {total_bottles}")
    print(f"Total PepsiCo bottles: {pepsico_bottles}")
