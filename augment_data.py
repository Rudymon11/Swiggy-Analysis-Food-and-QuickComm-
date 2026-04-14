import pandas as pd
import numpy as np
import os

# Define file paths
BASE_DIR = r"C:\Users\5510s\Downloads\Swiggy Project"
FOOD_DATA_PATH = os.path.join(BASE_DIR, "Food Ordering Behavior (India, 50K Orders) 2926", "food_ordering_behavior_dataset.csv")
IM_DATA_PATH = os.path.join(BASE_DIR, "Quick Commerce Dataset 2026", "quick_commerce_data_modified_cleaned.csv")

OUTPUT_FOOD = os.path.join(BASE_DIR, "food_augmented.csv")
OUTPUT_IM = os.path.join(BASE_DIR, "im_augmented.csv")

def augment_food_data(df):
    """Augments Food Business Line data with realistic pricing metrics."""
    print("Augmenting Food dataset...")
    # Add Platform Fee (Fixed at 5)
    df['Platform_Fee'] = 18

    # Base Delivery Fee is already in 'delivery_fee'
    
    # Calculate Surge Fee based on Rainy Weather and time taken to order
    df['Surge_Fee'] = np.where(df['rainy_weather'] == 'Yes', 
                               np.random.randint(30, 80, size=len(df)), 
                               np.random.choice([0, 10, 20], size=len(df), p=[0.7, 0.2, 0.1]))
    
    # Convert 'order_value' (which is probably subtotal) to a clear terminology
    df['Subtotal'] = df['order_value']
    df['Total_Fees'] = df['delivery_fee'] + df['Platform_Fee'] + df['Surge_Fee']
    df['Final_Total'] = df['Subtotal'] + df['Total_Fees']
    
    # Simulate Cart Abandonment logic (If total fees are > 15% of Subtotal, higher chance of abandonment)
    # Since these are completed orders, we'll create a simulation column "Likely_To_Abandon" for our analysis
    df['Fee_Percentage'] = (df['Total_Fees'] / df['Subtotal']) * 100
    
    return df

def augment_im_data(df):
    """Augments Instamart Business Line data with realistic pricing metrics."""
    print("Augmenting Instamart dataset...")
    # Fix Platform Fee
    df['Platform_Fee'] = 18
    
    # Create a realistic 'Delivery_Fee' based on Distance
    df['Delivery_Fee'] = (df['Distance_Km'] * 8).round()
    
    # Create 'Handling_Fee' (Unique to fast-commerce, based on Item Count)
    df['Handling_Fee'] = (df['Items_Count'] * 2).clip(lower=4, upper=25)
    
    # Small Surge if delivery time is very fast during rush hour
    df['Surge_Fee'] = np.where((df['Delivery_Time_Min'] < 15) & (df['Distance_Km'] > 5), 
                               np.random.randint(20, 50, size=len(df)), 
                               0)
                               
    df['Subtotal'] = df['Order_Value']
    df['Total_Fees'] = df['Delivery_Fee'] + df['Platform_Fee'] + df['Surge_Fee'] + df['Handling_Fee']
    df['Final_Total'] = df['Subtotal'] + df['Total_Fees']
    df['Fee_Percentage'] = (df['Total_Fees'] / df['Subtotal']) * 100
    
    return df

if __name__ == "__main__":
    if not os.path.exists(FOOD_DATA_PATH) or not os.path.exists(IM_DATA_PATH):
        print("Error: Input files not found. Check file paths!")
    else:
        # Load datasets (using chunks or sample if too large, but these should fit in memory)
        df_food = pd.read_csv(FOOD_DATA_PATH)
        df_im = pd.read_csv(IM_DATA_PATH)
        
        # Augment
        df_food_aug = augment_food_data(df_food)
        df_im_aug = augment_im_data(df_im)
        
        # Save
        df_food_aug.to_csv(OUTPUT_FOOD, index=False)
        df_im_aug.to_csv(OUTPUT_IM, index=False)
        print("Augmented datasets saved successfully!")
