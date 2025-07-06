
from nudenet import NudeClassifier
import sys
import json

def analyze_image(image_path):
    try:
        # Initialize classifier
        classifier = NudeClassifier()
        
        # Classify image
        result = classifier.classify(image_path)
        
        # Get predictions for the image
        predictions = result[image_path]
        
        # Convert to format compatible with our system
        response = {
            'predictions': [
                {
                    'className': class_name,
                    'probability': score
                }
                for class_name, score in predictions.items()
            ],
            'error': None
        }
        
        print(json.dumps(response))
        sys.stdout.flush()
        
    except Exception as e:
        error_response = {
            'predictions': [],
            'error': str(e)
        }
        print(json.dumps(error_response))
        sys.stdout.flush()

if __name__ == '__main__':
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        analyze_image(image_path)
    