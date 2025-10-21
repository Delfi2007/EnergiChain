"""
Computer Vision Safety Scanner for LPG Cylinders
Uses TensorFlow/Keras CNN to detect safety issues in cylinder images
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
import cv2
import json
from datetime import datetime
import os

class CylinderSafetyScanner:
    def __init__(self, model_path='models/cylinder_safety_model.h5'):
        """Initialize the safety scanner with pre-trained model"""
        self.model_path = model_path
        self.model = None
        self.img_height = 224
        self.img_width = 224
        
        # Safety issue classes
        self.classes = [
            'safe',           # No issues detected
            'rust',           # Rust corrosion
            'dent',           # Physical damage/dents
            'valve_damage',   # Valve issues
            'expired',        # Past expiry date
            'leaking'         # Visual signs of leakage
        ]
        
        # Severity levels
        self.severity = {
            'safe': 0,
            'rust': 2,
            'dent': 3,
            'valve_damage': 4,
            'expired': 5,
            'leaking': 5
        }
        
        self.load_model()
    
    def load_model(self):
        """Load pre-trained model or build new one"""
        if os.path.exists(self.model_path):
            self.model = keras.models.load_model(self.model_path)
            print(f"Loaded model from {self.model_path}")
        else:
            print("Model not found. Building new model architecture...")
            self.model = self.build_model()
    
    def build_model(self):
        """Build CNN architecture for cylinder safety detection"""
        model = keras.Sequential([
            # Input layer
            layers.Input(shape=(self.img_height, self.img_width, 3)),
            
            # Data augmentation
            layers.RandomFlip("horizontal"),
            layers.RandomRotation(0.1),
            layers.RandomZoom(0.1),
            
            # Convolutional blocks
            layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            
            layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            
            layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            
            layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            
            # Fully connected layers
            layers.Flatten(),
            layers.Dropout(0.5),
            layers.Dense(512, activation='relu'),
            layers.Dropout(0.3),
            layers.Dense(len(self.classes), activation='softmax')
        ])
        
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def preprocess_image(self, image_path):
        """Preprocess image for model input"""
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        # Convert BGR to RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Resize to model input size
        img = cv2.resize(img, (self.img_width, self.img_height))
        
        # Normalize pixel values
        img = img.astype('float32') / 255.0
        
        # Add batch dimension
        img = np.expand_dims(img, axis=0)
        
        return img
    
    def detect_rust(self, image_path):
        """Detect rust using color analysis (supplementary)"""
        img = cv2.imread(image_path)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Define rust color range (brownish-red)
        lower_rust = np.array([0, 50, 50])
        upper_rust = np.array([20, 255, 255])
        
        mask = cv2.inRange(hsv, lower_rust, upper_rust)
        rust_percentage = (np.sum(mask > 0) / mask.size) * 100
        
        return rust_percentage > 5  # More than 5% rust-colored pixels
    
    def detect_expiry(self, image_path):
        """Detect expiry date using OCR (basic implementation)"""
        # In production, use pytesseract or cloud OCR API
        # This is a placeholder for the logic
        return {
            'expired': False,
            'expiry_date': None,
            'confidence': 0.0
        }
    
    def scan_cylinder(self, image_path):
        """Main scanning function - returns safety report"""
        try:
            # Preprocess image
            img = self.preprocess_image(image_path)
            
            # Get model predictions
            predictions = self.model.predict(img, verbose=0)
            
            # Get top predictions
            top_indices = np.argsort(predictions[0])[::-1][:3]
            
            results = []
            for idx in top_indices:
                results.append({
                    'issue': self.classes[idx],
                    'confidence': float(predictions[0][idx]),
                    'severity': self.severity[self.classes[idx]]
                })
            
            # Primary issue is the top prediction
            primary_issue = results[0]
            
            # Additional checks
            rust_detected = self.detect_rust(image_path)
            expiry_info = self.detect_expiry(image_path)
            
            # Build comprehensive report
            report = {
                'timestamp': datetime.now().isoformat(),
                'image_path': image_path,
                'primary_issue': primary_issue['issue'],
                'confidence': primary_issue['confidence'],
                'severity_level': primary_issue['severity'],
                'all_detections': results,
                'rust_analysis': {
                    'detected': rust_detected,
                    'method': 'color_analysis'
                },
                'expiry_analysis': expiry_info,
                'is_safe': primary_issue['issue'] == 'safe' and primary_issue['confidence'] > 0.7,
                'recommendation': self.get_recommendation(primary_issue)
            }
            
            return report
            
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_recommendation(self, primary_issue):
        """Get safety recommendation based on detected issue"""
        recommendations = {
            'safe': 'Cylinder is in good condition. Safe to use.',
            'rust': 'Minor rust detected. Monitor condition. Replace if rust increases.',
            'dent': 'Physical damage detected. Do not use. Return for inspection.',
            'valve_damage': 'Valve damage detected. CRITICAL - Do not use. Replace immediately.',
            'expired': 'Cylinder has expired. Do not refill. Return for exchange.',
            'leaking': 'DANGER - Leakage detected. Turn off valve, ventilate area, call support immediately.'
        }
        
        return recommendations.get(primary_issue['issue'], 'Unknown issue. Contact support.')
    
    def train_model(self, train_dir, val_dir, epochs=50, batch_size=32):
        """Train the model on cylinder image dataset"""
        # Data generators with augmentation
        train_datagen = keras.preprocessing.image.ImageDataGenerator(
            rescale=1./255,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True
        )
        
        val_datagen = keras.preprocessing.image.ImageDataGenerator(rescale=1./255)
        
        train_generator = train_datagen.flow_from_directory(
            train_dir,
            target_size=(self.img_height, self.img_width),
            batch_size=batch_size,
            class_mode='categorical',
            classes=self.classes
        )
        
        val_generator = val_datagen.flow_from_directory(
            val_dir,
            target_size=(self.img_height, self.img_width),
            batch_size=batch_size,
            class_mode='categorical',
            classes=self.classes
        )
        
        # Callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
            keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=5),
            keras.callbacks.ModelCheckpoint(
                self.model_path,
                save_best_only=True,
                monitor='val_accuracy'
            )
        ]
        
        # Train
        history = self.model.fit(
            train_generator,
            epochs=epochs,
            validation_data=val_generator,
            callbacks=callbacks
        )
        
        return history
    
    def save_report(self, report, output_path='reports/scan_report.json'):
        """Save scan report to JSON file"""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"Report saved to {output_path}")

# Example usage
if __name__ == "__main__":
    scanner = CylinderSafetyScanner()
    
    # Scan a cylinder image
    report = scanner.scan_cylinder('test_images/cylinder_001.jpg')
    print(json.dumps(report, indent=2))
    
    # Save report
    scanner.save_report(report)
