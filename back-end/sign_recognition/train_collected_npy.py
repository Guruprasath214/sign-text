import os
import json
import pickle
import numpy as np
from collections import Counter
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

def load_npy_dataset(dataset_dir):
    X, y = [], []
    for fname in os.listdir(dataset_dir):
        if not fname.lower().endswith(".npy"):
            continue
        label = os.path.splitext(fname)[0].upper()
        arr = np.load(os.path.join(dataset_dir, fname))  # shape: (samples, 42)
        if arr.ndim == 2 and arr.shape[1] > 0:
            for row in arr:
                X.append(row.tolist())
                y.append(label)
    return np.array(X), np.array(y)

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_dir = os.path.join(script_dir, "dataset")

    print("=" * 60)
    print("TRAINING FROM COLLECTED .NPY DATA")
    print("=" * 60)

    if not os.path.isdir(dataset_dir):
        print(f"❌ Dataset folder not found: {dataset_dir}")
        return

    X, y = load_npy_dataset(dataset_dir)

    if len(X) == 0:
        print("❌ No samples found. Make sure you have .npy files in 'back-end/sign_recognition/dataset/'.")
        return

    print(f"\nDataset Summary:")
    print(f"  Total samples: {len(X)}")
    print(f"  Number of signs: {len(set(y))}")
    print(f"  Signs: {sorted(set(y))}")

    counts = Counter(y)
    print("\nTop signs by sample count:")
    for sign, cnt in counts.most_common(10):
        print(f"  {sign}: {cnt}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("\nTraining RandomForest...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=20,
        random_state=42,
        n_jobs=-1,
        verbose=1
    )
    model.fit(X_train, y_train)

    train_acc = model.score(X_train, y_train)
    test_acc = model.score(X_test, y_test)
    print("\nResults:")
    print(f"  Train accuracy: {train_acc * 100:.2f}%")
    print(f"  Test accuracy:  {test_acc * 100:.2f}%")

    model_path = os.path.join(script_dir, "model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    print(f"\n✓ Model saved: {model_path}")

    labels_path = os.path.join(script_dir, "labels.json")
    with open(labels_path, "w") as f:
        json.dump({"labels": sorted(set(y))}, f, indent=2)
    print(f"✓ Labels saved: {labels_path}")

    print("\nRestart the backend to load the new model.")
    print("=" * 60)

if __name__ == "__main__":
    main()