import os
import cv2
import mediapipe as mp
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import pickle
import json

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=True, max_num_hands=1, min_detection_confidence=0.5)

def extract_keypoints_from_image(image_path):
    """Extract hand keypoints from an image"""
    try:
        image = cv2.imread(image_path)
        if image is None:
            return None
        
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = hands.process(image_rgb)
        
        if results.multi_hand_landmarks:
            keypoints = []
            for landmark in results.multi_hand_landmarks[0].landmark:
                keypoints.extend([landmark.x, landmark.y])
            return keypoints
        return None
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return None

def process_dataset(dataset_path, max_samples_per_sign=500):
    """Process images from dataset folder structure:
    dataset/
        A/
            img1.jpg
            img2.jpg
        B/
            img1.jpg
        ...
    """
    X = []
    y = []
    
    print("Processing dataset...")
    print(f"Dataset path: {dataset_path}\n")
    
    # Get all sign folders
    sign_folders = [f for f in os.listdir(dataset_path) 
                   if os.path.isdir(os.path.join(dataset_path, f))]
    
    print(f"Found {len(sign_folders)} sign classes: {sorted(sign_folders)}\n")
    
    for sign_folder in sorted(sign_folders):
        sign_path = os.path.join(dataset_path, sign_folder)
        
        print(f"Processing sign: {sign_folder}")
        count = 0
        processed = 0
        
        # Get all image files
        image_files = [f for f in os.listdir(sign_path) 
                      if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
        
        # Limit samples per sign to avoid imbalance
        image_files = image_files[:max_samples_per_sign]
        
        for img_file in image_files:
            img_path = os.path.join(sign_path, img_file)
            keypoints = extract_keypoints_from_image(img_path)
            
            if keypoints:
                X.append(keypoints)
                y.append(sign_folder)
                processed += 1
            
            count += 1
            if count % 100 == 0:
                print(f"  Processed {count}/{len(image_files)} images...")
        
        print(f"  ✓ Completed: {processed}/{count} successful extractions\n")
    
    return np.array(X), np.array(y)

def train_model_from_dataset(dataset_path):
    """Train model from dataset images"""
    print("=" * 60)
    print("ASL SIGN LANGUAGE MODEL TRAINING")
    print("=" * 60 + "\n")
    
    if not os.path.exists(dataset_path):
        print(f"❌ Error: Dataset path not found: {dataset_path}")
        print("\nPlease check the path and try again.")
        return None
    
    # Process dataset
    X, y = process_dataset(dataset_path)
    
    print("\n" + "=" * 60)
    print(f"Dataset Summary:")
    print(f"  Total samples: {len(X)}")
    print(f"  Number of signs: {len(set(y))}")
    print(f"  Signs: {sorted(set(y))}")
    print("=" * 60 + "\n")
    
    if len(X) == 0:
        print("❌ Error: No data processed!")
        print("Make sure your dataset has the correct structure:")
        print("  dataset/")
        print("    A/")
        print("      img1.jpg")
        print("    B/")
        print("      img1.jpg")
        return None
    
    # Split data
    print("Splitting data (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)
    
    print(f"  Training samples: {len(X_train)}")
    print(f"  Testing samples: {len(X_test)}\n")
    
    # Train model
    print("Training Random Forest classifier...")
    print("This may take several minutes...\n")
    
    model = RandomForestClassifier(
        n_estimators=200, 
        max_depth=20,
        random_state=42,
        n_jobs=-1,
        verbose=1
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    train_accuracy = model.score(X_train, y_train)
    test_accuracy = model.score(X_test, y_test)
    
    print("\n" + "=" * 60)
    print("Training Results:")
    print(f"  Training accuracy: {train_accuracy * 100:.2f}%")
    print(f"  Testing accuracy: {test_accuracy * 100:.2f}%")
    print("=" * 60 + "\n")
    
    # Save model
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, 'model.pkl')
    
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"✓ Model saved to: {model_path}")
    
    # Save label mapping
    labels_path = os.path.join(script_dir, 'labels.json')
    with open(labels_path, 'w') as f:
        json.dump({'labels': sorted(set(y))}, f, indent=2)
    
    print(f"✓ Labels saved to: {labels_path}")
    print("\n" + "=" * 60)
    print("TRAINING COMPLETED SUCCESSFULLY!")
    print("Restart your backend server to use the new model.")
    print("=" * 60)
    
    return model

if __name__ == "__main__":
    print("\nASL Sign Language Model Trainer")
    print("-" * 60)
    print("\nDataset should be organized as:")
    print("  E:\\Downloads\\asl_dataset\\")
    print("    A\\")
    print("      img1.jpg")
    print("      img2.jpg")
    print("    B\\")
    print("      img1.jpg")
    print("    ...\n")
    
    # Example paths (user can modify)
    print("Example path formats:")
    print("  E:\\Downloads\\asl_alphabet_train")
    print("  E:\\Downloads\\ASL-Alphabet\\asl_alphabet_train")
    print("  C:\\Users\\YourName\\Downloads\\dataset\n")
    
    dataset_path = input("Enter the full path to your dataset folder: ").strip()
    
    # Remove quotes if user copied path with quotes
    dataset_path = dataset_path.strip('"').strip("'")
    
    print(f"\nUsing path: {dataset_path}\n")
    
    if os.path.exists(dataset_path):
        train_model_from_dataset(dataset_path)
    else:
        print(f"❌ Error: Path not found!")
        print(f"Checked: {dataset_path}")
        print("\nTips:")
        print("  - Use full path like E:\\Downloads\\asl_alphabet_train")
        print("  - Check for typos in the path")
        print("  - Make sure you extracted the zip file")
