import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Set aesthetic style
sns.set_theme(style="whitegrid")

BASE_DIR = r"C:\Users\5510s\Downloads\Swiggy Project"
FOOD_DATA = os.path.join(BASE_DIR, "food_augmented.csv")
IM_DATA = os.path.join(BASE_DIR, "im_augmented.csv")

# Create output dir for images
VIS_DIR = os.path.join(BASE_DIR, "Visualizations")
os.makedirs(VIS_DIR, exist_ok=True)

def analyze_and_visualize():
    df_food = pd.read_csv(FOOD_DATA)
    df_im = pd.read_csv(IM_DATA)
    
    print("Generating Chart 1: Fee Stack Comparison (Food vs IM)")
    # Average fees
    food_fees = {
        'Delivery_Fee': df_food['delivery_fee'].mean(),
        'Surge_Fee': df_food['Surge_Fee'].mean(),
        'Platform_Fee': df_food['Platform_Fee'].mean(),
        'Handling_Fee': 0 # N/A for food
    }
    
    im_fees = {
        'Delivery_Fee': df_im['Delivery_Fee'].mean(),
        'Surge_Fee': df_im['Surge_Fee'].mean(),
        'Platform_Fee': df_im['Platform_Fee'].mean(),
        'Handling_Fee': df_im['Handling_Fee'].mean()
    }
    
    fee_df = pd.DataFrame([food_fees, im_fees], index=['Food Delivery', 'Instamart'])
    fee_df = fee_df[['Delivery_Fee', 'Surge_Fee', 'Platform_Fee', 'Handling_Fee']]
    
    ax = fee_df.plot(kind='bar', stacked=True, figsize=(8, 6), color=['#fc8019', '#fcaf75', '#333333', '#119b33'])
    plt.title('Average Fee Component Breakdowns', fontsize=16)
    plt.ylabel('Average Fee Amount (INR)')
    plt.xticks(rotation=0)
    plt.legend(title='Fee Types', bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.tight_layout()
    plt.savefig(os.path.join(VIS_DIR, 'fee_stack_comparison.png'))
    plt.close()
    
    print("Generating Chart 2: Fee Percentage Impact (Food Business Line)")
    # Group fee percentages to see where most orders fall
    plt.figure(figsize=(8, 5))
    sns.histplot(df_food['Fee_Percentage'], bins=50, kde=True, color='#fc8019')
    plt.axvline(20, color='red', linestyle='--', label='Danger Zone (>20% Fees)')
    plt.title('Distribution of Total Fees as % of Cart Value (Food)')
    plt.xlabel('Fees as % of Subtotal')
    plt.ylabel('Number of Orders Completed')
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(VIS_DIR, 'fee_percentage_impact.png'))
    plt.close()

    print("Generating Chart 3: Surge Pricing vs Weather Logic Gap (Food)")
    # Are we surging too much during clear weather, or losing volume in light rain?
    weather_surge = df_food.groupby('rainy_weather')['Surge_Fee'].mean().reset_index()
    plt.figure(figsize=(7, 5))
    sns.barplot(x='rainy_weather', y='Surge_Fee', data=weather_surge, palette='Blues_d')
    plt.title('Average applied Surge fee vs Weather Condition')
    plt.ylabel('Average Surge (INR)')
    plt.xlabel('Is it Raining?')
    plt.tight_layout()
    plt.savefig(os.path.join(VIS_DIR, 'weather_surge_gap.png'))
    plt.close()

    print("Generating Chart 4: Instamart Handling Fee vs Order Volume")
    plt.figure(figsize=(8, 5))
    sns.scatterplot(x='Items_Count', y='Handling_Fee', data=df_im, alpha=0.3, color='#119b33')
    plt.title('Instamart: Handling Fee Scaling with Item Count')
    plt.xlabel('Number of Items in Cart')
    plt.ylabel('Handling Fee Applied (INR)')
    plt.tight_layout()
    plt.savefig(os.path.join(VIS_DIR, 'im_handling_fee_scaling.png'))
    plt.close()
    
    print(f"All visualizations saved to {VIS_DIR}!")

if __name__ == "__main__":
    analyze_and_visualize()
