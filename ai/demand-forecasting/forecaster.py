"""
LSTM-based Demand Forecasting for LPG Cylinder Orders
Predicts when customers will need their next refill
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
import pandas as pd
import json
from datetime import datetime, timedelta
import os

class DemandForecaster:
    def __init__(self, model_path='models/demand_lstm_model.h5'):
        """Initialize the demand forecasting model"""
        self.model_path = model_path
        self.model = None
        self.lookback_days = 30  # Use 30 days of history
        self.forecast_days = 7   # Predict 7 days ahead
        
        self.load_model()
    
    def load_model(self):
        """Load pre-trained LSTM model"""
        if os.path.exists(self.model_path):
            self.model = keras.models.load_model(self.model_path)
            print(f"Loaded model from {self.model_path}")
        else:
            print("Model not found. Building new LSTM architecture...")
            self.model = self.build_model()
    
    def build_model(self):
        """Build LSTM architecture for time series forecasting"""
        model = keras.Sequential([
            # Input layer
            layers.Input(shape=(self.lookback_days, 7)),  # 7 features per day
            
            # LSTM layers
            layers.LSTM(128, return_sequences=True),
            layers.Dropout(0.2),
            
            layers.LSTM(64, return_sequences=True),
            layers.Dropout(0.2),
            
            layers.LSTM(32),
            layers.Dropout(0.2),
            
            # Dense layers
            layers.Dense(64, activation='relu'),
            layers.Dense(32, activation='relu'),
            
            # Output layer - predict probability of order in next N days
            layers.Dense(self.forecast_days, activation='sigmoid')
        ])
        
        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy', 'precision', 'recall']
        )
        
        return model
    
    def extract_features(self, customer_data):
        """
        Extract features from customer order history
        Features:
        1. Days since last order
        2. Cylinder size (6kg, 13kg, 50kg)
        3. Day of week (0-6)
        4. Week of month (1-5)
        5. Month (1-12)
        6. Family size estimate
        7. Historical average days between orders
        """
        features = []
        
        orders = customer_data['orders']
        family_size = customer_data.get('family_size', 4)
        
        for i in range(len(orders)):
            order = orders[i]
            order_date = datetime.fromisoformat(order['date'])
            
            # Calculate days since last order
            if i > 0:
                prev_date = datetime.fromisoformat(orders[i-1]['date'])
                days_since_last = (order_date - prev_date).days
            else:
                days_since_last = 0
            
            # Cylinder size encoding
            size_map = {'6kg': 6, '13kg': 13, '50kg': 50}
            cylinder_size = size_map.get(order['cylinder_size'], 13)
            
            # Temporal features
            day_of_week = order_date.weekday()
            week_of_month = (order_date.day - 1) // 7 + 1
            month = order_date.month
            
            # Average days between orders (historical)
            if i >= 3:
                recent_intervals = []
                for j in range(i-3, i):
                    date1 = datetime.fromisoformat(orders[j]['date'])
                    date2 = datetime.fromisoformat(orders[j+1]['date'])
                    recent_intervals.append((date2 - date1).days)
                avg_interval = np.mean(recent_intervals)
            else:
                avg_interval = 30  # Default
            
            features.append([
                days_since_last / 100.0,      # Normalize
                cylinder_size / 50.0,          # Normalize
                day_of_week / 7.0,
                week_of_month / 5.0,
                month / 12.0,
                family_size / 10.0,
                avg_interval / 100.0
            ])
        
        return np.array(features)
    
    def prepare_sequences(self, features):
        """Prepare sequences for LSTM input"""
        sequences = []
        
        if len(features) < self.lookback_days:
            # Pad with zeros if insufficient history
            padding = np.zeros((self.lookback_days - len(features), features.shape[1]))
            features = np.vstack([padding, features])
        
        # Take the last lookback_days
        sequence = features[-self.lookback_days:]
        sequences.append(sequence)
        
        return np.array(sequences)
    
    def predict_next_order(self, customer_data):
        """
        Predict when customer will likely need next order
        Returns probability for each of next 7 days
        """
        try:
            # Extract features
            features = self.extract_features(customer_data)
            
            # Prepare sequence
            sequence = self.prepare_sequences(features)
            
            # Predict
            predictions = self.model.predict(sequence, verbose=0)[0]
            
            # Get last order date
            last_order = customer_data['orders'][-1]
            last_order_date = datetime.fromisoformat(last_order['date'])
            
            # Build forecast
            forecast = []
            for day in range(self.forecast_days):
                forecast_date = last_order_date + timedelta(days=day+1)
                forecast.append({
                    'date': forecast_date.isoformat(),
                    'probability': float(predictions[day]),
                    'day_offset': day + 1
                })
            
            # Find most likely order date
            max_prob_idx = np.argmax(predictions)
            most_likely_date = last_order_date + timedelta(days=max_prob_idx+1)
            
            # Calculate cylinder usage pattern
            usage_pattern = self.analyze_usage_pattern(customer_data)
            
            result = {
                'customer_id': customer_data['customer_id'],
                'last_order_date': last_order['date'],
                'predicted_order_date': most_likely_date.isoformat(),
                'confidence': float(predictions[max_prob_idx]),
                'forecast': forecast,
                'usage_pattern': usage_pattern,
                'recommendation': self.get_recommendation(predictions, usage_pattern),
                'timestamp': datetime.now().isoformat()
            }
            
            return result
            
        except Exception as e:
            return {
                'error': str(e),
                'customer_id': customer_data.get('customer_id', 'unknown'),
                'timestamp': datetime.now().isoformat()
            }
    
    def analyze_usage_pattern(self, customer_data):
        """Analyze customer's LPG usage pattern"""
        orders = customer_data['orders']
        
        if len(orders) < 2:
            return {
                'pattern': 'insufficient_data',
                'avg_days_between_orders': None,
                'consistency': 'unknown'
            }
        
        # Calculate intervals between orders
        intervals = []
        for i in range(1, len(orders)):
            date1 = datetime.fromisoformat(orders[i-1]['date'])
            date2 = datetime.fromisoformat(orders[i]['date'])
            intervals.append((date2 - date1).days)
        
        avg_interval = np.mean(intervals)
        std_interval = np.std(intervals)
        
        # Determine consistency
        if std_interval / avg_interval < 0.2:
            consistency = 'very_consistent'
        elif std_interval / avg_interval < 0.4:
            consistency = 'consistent'
        else:
            consistency = 'variable'
        
        # Determine pattern
        if avg_interval < 15:
            pattern = 'heavy_user'
        elif avg_interval < 30:
            pattern = 'regular_user'
        else:
            pattern = 'light_user'
        
        return {
            'pattern': pattern,
            'avg_days_between_orders': round(avg_interval, 1),
            'std_days': round(std_interval, 1),
            'consistency': consistency,
            'total_orders': len(orders)
        }
    
    def get_recommendation(self, predictions, usage_pattern):
        """Generate recommendation based on prediction"""
        max_prob = np.max(predictions)
        days_until = np.argmax(predictions) + 1
        
        if max_prob > 0.8 and days_until <= 3:
            return {
                'action': 'send_urgent_reminder',
                'message': f"You'll likely need gas in {days_until} days. Order now to avoid running out!",
                'urgency': 'high'
            }
        elif max_prob > 0.6 and days_until <= 5:
            return {
                'action': 'send_reminder',
                'message': f"Based on your usage, you may need gas around {days_until} days from now.",
                'urgency': 'medium'
            }
        else:
            return {
                'action': 'monitor',
                'message': 'Your gas supply looks good for now. We\'ll remind you when it\'s time.',
                'urgency': 'low'
            }
    
    def train_model(self, train_data, val_data, epochs=100, batch_size=32):
        """Train the LSTM model on historical order data"""
        X_train, y_train = train_data
        X_val, y_val = val_data
        
        callbacks = [
            keras.callbacks.EarlyStopping(
                patience=15,
                restore_best_weights=True,
                monitor='val_loss'
            ),
            keras.callbacks.ReduceLROnPlateau(
                factor=0.5,
                patience=7,
                monitor='val_loss'
            ),
            keras.callbacks.ModelCheckpoint(
                self.model_path,
                save_best_only=True,
                monitor='val_accuracy'
            )
        ]
        
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks
        )
        
        return history
    
    def batch_predict(self, customers_data):
        """Predict for multiple customers"""
        predictions = []
        
        for customer_data in customers_data:
            prediction = self.predict_next_order(customer_data)
            predictions.append(prediction)
        
        return predictions

# Example usage
if __name__ == "__main__":
    forecaster = DemandForecaster()
    
    # Example customer data
    customer_data = {
        'customer_id': 'CUST123',
        'family_size': 4,
        'orders': [
            {'date': '2024-01-15', 'cylinder_size': '13kg'},
            {'date': '2024-02-10', 'cylinder_size': '13kg'},
            {'date': '2024-03-05', 'cylinder_size': '13kg'},
            {'date': '2024-03-28', 'cylinder_size': '13kg'}
        ]
    }
    
    # Predict
    prediction = forecaster.predict_next_order(customer_data)
    print(json.dumps(prediction, indent=2))
