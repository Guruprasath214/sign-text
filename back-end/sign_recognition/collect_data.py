import cv2
import mediapipe as mp
import numpy as np
import os
import time

SIGN_NAME = "help"   # Change this for each sign
SAMPLES = 200
COUNTDOWN = 3  # Countdown before starting collection

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)
cap = cv2.VideoCapture(0)

# Create dataset directory
os.makedirs("dataset", exist_ok=True)

# Load existing data if available
dataset_path = f"dataset/{SIGN_NAME}.npy"
if os.path.exists(dataset_path):
    existing_data = np.load(dataset_path)
    data = existing_data.tolist()
    existing_count = len(data)
    print(f"Loaded {existing_count} existing samples for '{SIGN_NAME}'")
    print(f"Will collect {SAMPLES} additional samples")
else:
    data = []
    existing_count = 0
    print(f"Starting fresh collection for '{SIGN_NAME}'")

# Countdown before starting
print("Get ready...")
countdown_start = time.time()
countdown_complete = False

count = 0
frame_skip = 0  # Skip frames to avoid similar consecutive samples

while count < SAMPLES:
    ret, frame = cap.read()
    if not ret:
        print("Failed to capture frame")
        break

    frame = cv2.flip(frame, 1)  # Mirror the image
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # Show countdown
    if not countdown_complete:
        elapsed = time.time() - countdown_start
        remaining = COUNTDOWN - int(elapsed)
        if remaining > 0:
            cv2.putText(frame, f"Starting in {remaining}...", 
                       (150, 250), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 255), 3)
            cv2.putText(frame, f"Sign: {SIGN_NAME}", 
                       (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            cv2.imshow("Collect Data", frame)
            cv2.waitKey(1)
            continue
        else:
            countdown_complete = True
            print("Collection started!")
    
    result = hands.process(rgb)

    if result.multi_hand_landmarks:
        for hand_landmarks in result.multi_hand_landmarks:
            # Draw landmarks on frame for visual feedback
            mp_drawing.draw_landmarks(
                frame, 
                hand_landmarks, 
                mp_hands.HAND_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2)
            )
            
            # Collect data with frame skipping to get diverse samples
            if frame_skip == 0:
                landmarks = []
                for lm in hand_landmarks.landmark:
                    landmarks.extend([lm.x, lm.y])  # Keep 2D for compatibility
                
                data.append(landmarks)
                count += 1
                frame_skip = 2  # Skip next 2 frames
            else:
                frame_skip -= 1
        
        # Show success indicator
        cv2.rectangle(frame, (10, 10), (30, 30), (0, 255, 0), -1)
    else:
        # Show warning when no hand detected
        cv2.rectangle(frame, (10, 10), (30, 30), (0, 0, 255), -1)
        cv2.putText(frame, "No hand detected!", 
                   (10, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

    # Display information
    total_samples = existing_count + count
    cv2.putText(frame, f"Sign: {SIGN_NAME}", 
               (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.putText(frame, f"New samples: {count}/{SAMPLES}", 
               (10, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.putText(frame, f"Total samples: {total_samples}", 
               (10, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
    cv2.putText(frame, "Press 'q' to quit", 
               (10, 210), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
    
    cv2.imshow("Collect Data", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("Collection stopped by user")
        break

# Save the collected data
if count > 0:
    data_array = np.array(data)
    np.save(dataset_path, data_array)
    print(f"\n✓ Successfully saved {len(data)} total samples to {dataset_path}")
    print(f"  - Previous samples: {existing_count}")
    print(f"  - New samples: {count}")
    print(f"  - Data shape: {data_array.shape}")
else:
    print("\nNo new data collected")

cap.release()
cv2.destroyAllWindows()
hands.close()
