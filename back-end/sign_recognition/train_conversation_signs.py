"""
Train model with CONVERSATIONAL ASL signs (not alphabet)
Suitable for real-time video calls

Recommended dataset: WLASL (Word-Level American Sign Language)
Download from: https://www.kaggle.com/datasets/risangbaskoro/wlasl-processed

Common signs for video calls:
- Greetings: HELLO, HI, GOODBYE, GOOD MORNING
- Politeness: PLEASE, THANK YOU, SORRY, EXCUSE ME
- Questions: WHAT, WHERE, WHEN, WHO, WHY, HOW
- Responses: YES, NO, MAYBE, OK, FINE
- Emotions: HAPPY, SAD, ANGRY, LOVE, HATE
- Actions: HELP, NEED, WANT, LIKE, GO, COME
- Time: NOW, LATER, TODAY, TOMORROW, YESTERDAY
- Common: GOOD, BAD, BEFORE, AFTER, AGAIN, MORE
"""

import os
import cv2
import mediapipe as mp
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import pickle
import json
from collections import Counter

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=True, max_num_hands=2, min_detection_confidence=0.5)

# Common conversational signs (prioritize these)
PRIORITY_SIGNS = [
    'HELLO', 'HI', 'GOODBYE', 'BYE',
    'PLEASE', 'THANK_YOU', 'SORRY', 'EXCUSE_ME',
    'YES', 'NO', 'MAYBE', 'OK', 'FINE',
    'WHAT', 'WHERE', 'WHEN', 'WHO', 'WHY', 'HOW',
    'HELP', 'NEED', 'WANT', 'LIKE', 'LOVE',
    'GO', 'COME', 'STOP', 'START', 'WAIT',
    'GOOD', 'BAD', 'HAPPY', 'SAD',
    'NOW', 'LATER', 'TODAY', 'TOMORROW',
    'BEFORE', 'AFTER', 'AGAIN', 'MORE',
    'EAT', 'DRINK', 'SLEEP', 'WORK',
    'UNDERSTAND', 'KNOW', 'LEARN', 'TEACH',
    'FRIEND', 'FAMILY', 'MOTHER', 'FATHER',
    'HOW_ARE_YOU', 'NICE_TO_MEET_YOU', 'SEE_YOU_LATER'
]

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
            # Support both one-handed and two-handed signs
            for hand_landmarks in results.multi_hand_landmarks[:2]:  # Max 2 hands
                for landmark in hand_landmarks.landmark:
                    keypoints.extend([landmark.x, landmark.y, landmark.z])
            
            # Pad to consistent size (2 hands * 21 landmarks * 3 coords = 126)
            while len(keypoints) < 126:
                keypoints.extend([0, 0, 0])
            
            return keypoints[:126]  # Ensure max size
        return None
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return None

def extract_keypoints_from_video(video_path, max_frames=30):
    """Extract keypoints from video (for WLASL dataset)"""
    try:
        cap = cv2.VideoCapture(video_path)
        keypoints_sequence = []
        
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        # Sample frames evenly
        frame_indices = np.linspace(0, frame_count - 1, min(max_frames, frame_count), dtype=int)
        
        for frame_idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(frame_rgb)
            
            if results.multi_hand_landmarks:
                frame_keypoints = []
                for hand_landmarks in results.multi_hand_landmarks[:2]:
                    for landmark in hand_landmarks.landmark:
                        frame_keypoints.extend([landmark.x, landmark.y, landmark.z])
                
                while len(frame_keypoints) < 126:
                    frame_keypoints.extend([0, 0, 0])
                
                keypoints_sequence.append(frame_keypoints[:126])
        
        cap.release()
        
        # Average keypoints across frames for static classification
        if keypoints_sequence:
            return np.mean(keypoints_sequence, axis=0).tolist()
        return None
    except Exception as e:
        print(f"Error processing video {video_path}: {e}")
        return None

def process_wlasl_dataset(dataset_path, max_samples_per_sign=200):
    """Process WLASL dataset (video format)
    Structure:
    dataset/
        HELLO/
            video1.mp4
            video2.mp4
        THANK_YOU/
            video1.mp4
    """
    X = []
    y = []
    
    print("Processing WLASL dataset...")
    print(f"Dataset path: {dataset_path}\n")
    
    sign_folders = [f for f in os.listdir(dataset_path) 
                   if os.path.isdir(os.path.join(dataset_path, f))]
    
    # Prioritize common conversation signs
    priority_folders = [s for s in sign_folders if s.upper() in PRIORITY_SIGNS]
    other_folders = [s for s in sign_folders if s.upper() not in PRIORITY_SIGNS]
    
    print(f"Found {len(sign_folders)} total signs")
    print(f"  Priority conversational signs: {len(priority_folders)}")
    print(f"  Other signs: {len(other_folders)}\n")
    
    # Process priority signs first
    all_folders = priority_folders + other_folders[:50]  # Limit total signs
    
    for sign_folder in sorted(all_folders):
        sign_path = os.path.join(dataset_path, sign_folder)
        
        print(f"Processing sign: {sign_folder}")
        count = 0
        processed = 0
        
        video_files = [f for f in os.listdir(sign_path) 
                      if f.lower().endswith(('.mp4', '.avi', '.mov'))]
        
        video_files = video_files[:max_samples_per_sign]
        
        for video_file in video_files:
            video_path = os.path.join(sign_path, video_file)
            keypoints = extract_keypoints_from_video(video_path)
            
            if keypoints:
                X.append(keypoints)
                y.append(sign_folder.upper())
                processed += 1
            
            count += 1
            if count % 20 == 0:
                print(f"  Processed {count}/{len(video_files)} videos...")
        
        print(f"  ✓ Completed: {processed}/{count} successful extractions\n")
    
    return np.array(X), np.array(y)

def process_image_dataset(dataset_path, max_samples_per_sign=200):
    """Process image-based dataset
    Structure:
    dataset/
        HELLO/
            img1.jpg
        THANK_YOU/
            img1.jpg
    """
    X = []
    y = []
    
    print("Processing image dataset...")
    print(f"Dataset path: {dataset_path}\n")
    
    sign_folders = [f for f in os.listdir(dataset_path) 
                   if os.path.isdir(os.path.join(dataset_path, f))]
    
    # Filter out single letters if present
    sign_folders = [s for s in sign_folders if len(s) > 1 or s.upper() in ['I', 'A']]
    
    print(f"Found {len(sign_folders)} sign classes\n")
    
    for sign_folder in sorted(sign_folders):
        sign_path = os.path.join(dataset_path, sign_folder)
        
        print(f"Processing sign: {sign_folder}")
        count = 0
        processed = 0
        
        image_files = [f for f in os.listdir(sign_path) 
                      if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
        
        image_files = image_files[:max_samples_per_sign]
        
        for img_file in image_files:
            img_path = os.path.join(sign_path, img_file)
            keypoints = extract_keypoints_from_image(img_path)
            
            if keypoints:
                X.append(keypoints)
                y.append(sign_folder.upper())
                processed += 1
            
            count += 1
            if count % 100 == 0:
                print(f"  Processed {count}/{len(image_files)} images...")
        
        print(f"  ✓ Completed: {processed}/{count} successful extractions\n")
    
    return np.array(X), np.array(y)

def train_model(dataset_path, is_video=False):
    """Train model from dataset"""
    print("=" * 70)
    print("ASL CONVERSATIONAL SIGNS MODEL TRAINING")
    print("=" * 70 + "\n")
    
    if not os.path.exists(dataset_path):
        print(f"❌ Error: Dataset path not found: {dataset_path}")
        return None
    
    # Detect if video or image dataset
    sample_folder = os.listdir(dataset_path)[0]
    sample_path = os.path.join(dataset_path, sample_folder)
    sample_files = os.listdir(sample_path)
    
    has_videos = any(f.lower().endswith(('.mp4', '.avi', '.mov')) for f in sample_files)
    
    if has_videos:
        print("Detected VIDEO dataset (WLASL format)\n")
        X, y = process_wlasl_dataset(dataset_path)
    else:
        print("Detected IMAGE dataset\n")
        X, y = process_image_dataset(dataset_path)
    
    print("\n" + "=" * 70)
    print(f"Dataset Summary:")
    print(f"  Total samples: {len(X)}")
    print(f"  Number of signs: {len(set(y))}")
    print(f"  Signs: {sorted(set(y))}")
    
    # Show sample distribution
    sign_counts = Counter(y)
    print(f"\nTop 10 signs by sample count:")
    for sign, count in sign_counts.most_common(10):
        print(f"  {sign}: {count} samples")
    print("=" * 70 + "\n")
    
    if len(X) == 0:
        print("❌ Error: No data processed!")
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
        n_estimators=300, 
        max_depth=25,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1,
        verbose=1
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    train_accuracy = model.score(X_train, y_train)
    test_accuracy = model.score(X_test, y_test)
    
    print("\n" + "=" * 70)
    print("Training Results:")
    print(f"  Training accuracy: {train_accuracy * 100:.2f}%")
    print(f"  Testing accuracy: {test_accuracy * 100:.2f}%")
    print("=" * 70 + "\n")
    
    # Save model
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, 'model.pkl')
    
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"✓ Model saved to: {model_path}")
    
    # Save labels
    labels_path = os.path.join(script_dir, 'labels.json')
    with open(labels_path, 'w') as f:
        json.dump({
            'labels': sorted(set(y)),
            'priority_signs': PRIORITY_SIGNS,
            'total_signs': len(set(y))
        }, f, indent=2)
    
    print(f"✓ Labels saved to: {labels_path}")
    print("\n" + "=" * 70)
    print("TRAINING COMPLETED SUCCESSFULLY!")
    print("Restart your backend server to use the new model.")
    print("=" * 70)
    
    return model

if __name__ == "__main__":
    print("\nASL Conversational Signs Model Trainer")
    print("-" * 70)
    print("\nRecommended datasets:")
    print("  1. WLASL: https://www.kaggle.com/datasets/risangbaskoro/wlasl-processed")
    print("  2. ASL Signs: https://www.kaggle.com/datasets/lexset/asl-signs")
    print("\nDataset structure:")
    print("  dataset/")
    print("    HELLO/")
    print("      video1.mp4  (or img1.jpg)")
    print("    THANK_YOU/")
    print("      video1.mp4  (or img1.jpg)\n")
    
    dataset_path = input("Enter the full path to your dataset folder: ").strip()
    dataset_path = dataset_path.strip('"').strip("'")
    
    print(f"\nUsing path: {dataset_path}\n")
    
    if os.path.exists(dataset_path):
        train_model(dataset_path)
    else:
        print(f"❌ Error: Path not found!")
        print(f"Checked: {dataset_path}")
