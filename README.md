# Swiggy PriceOps - Pricing Intelligence and Gap Analysis

A data-driven analysis of Swiggy's pricing engine across the Food Delivery and Instamart (Quick-Commerce) business lines. The project features an interactive dashboard, a surge pricing simulator, competitive benchmarking, and a product roadmap for pricing dashboard enhancements.

**Dataset Size:** Approximately 1 Million orders (50K Food + 948K Instamart)  
**Tech Stack:** Python (Pandas, Matplotlib, Seaborn) + Vanilla HTML/CSS/JS (Chart.js)

---

## Motivation

Pricing is one of the most impactful levers in the food delivery and quick-commerce space. It directly affects order conversion, customer satisfaction, and unit economics. Despite this, most publicly available datasets lack the granular pricing fields (surge fees, platform fees, handling charges) that are central to how platforms like Swiggy actually operate.

This project was built to bridge that gap. The objective was to take publicly available order data, augment it with realistic pricing logic, and then analyze it through the lens of a product or pricing team. The end result is a set of quantitative insights, identified gaps in pricing logic, and a proposed roadmap for improvements.

---

## Glossary

The following terms are used throughout this project and the dashboard:

| Term | Full Form | Definition |
|---|---|---|
| **BL** | Business Line | A distinct business segment within Swiggy. The two BLs analyzed are Food Delivery and Instamart (Quick-Commerce). |
| **AOV** | Average Order Value | The average value of the items in a customer's cart before any fees are applied. Calculated as total subtotal divided by total orders. |
| **GMV** | Gross Merchandise Value | The total value of all orders placed across the dataset. It represents overall transaction volume. |
| **Fee Load** | Fee Load (%) | Total fees (delivery + surge + platform + handling) expressed as a percentage of the cart's subtotal. A Fee Load of 25% means the customer pays Rs.25 in fees for every Rs.100 worth of food or groceries. |
| **Take Rate** | Take Rate (%) | The percentage of GMV that the platform retains as fee revenue. Calculated as total fees collected divided by total GMV. |
| **Surge Fee** | Surge Fee | An additional charge applied during periods of high demand or adverse weather. In Food delivery, this is primarily triggered by rain. In Instamart, it is triggered by express deliveries over long distances. |
| **Platform Fee** | Platform Fee | A fixed fee charged per order to cover the cost of operating the platform (app maintenance, customer support, payment processing, etc.). Currently Rs.18 on Swiggy. |
| **Handling Fee** | Handling / Packing Fee | An Instamart-specific fee charged to cover the cost of picking, packing, and bagging items from the dark store. It scales with the number of items in the order. |
| **Danger Zone** | Danger Zone | Orders where the Fee Load exceeds 20%. Beyond this threshold, cart abandonment (users dropping off at checkout) increases significantly. |
| **Smart Cap** | Smart Cap | A proposed pricing mechanism that automatically reduces fees if the total Fee Load exceeds a configured threshold (e.g., 20%). |
| **Dark Store** | Dark Store | A warehouse-style fulfillment center not open to walk-in customers. Instamart and competitors like Blinkit and Zepto operate from dark stores for fast delivery. |
| **Surge Hit Rate** | Surge Hit Rate (%) | The percentage of total orders that had a non-zero surge fee applied. |

---

## KPIs Tracked

The dashboard tracks the following KPIs. Each was selected to represent a different dimension of pricing health, and together they give a complete picture of how fees affect revenue, user experience, and operational efficiency.

| KPI | Formula | Why It Matters |
|---|---|---|
| **Total Orders** | Count of all orders | Establishes the scale of each business line and the statistical significance of the analysis. |
| **Total GMV** | Sum of all order subtotals | Represents total transaction value. This is the denominator for Take Rate and the baseline for all revenue calculations. |
| **Average Order Value (AOV)** | Total subtotal / Total orders | Indicates the typical cart size. Higher AOV orders can absorb more fees without entering the Danger Zone. |
| **Average Total Fees** | Mean of (Delivery + Surge + Platform + Handling) | Shows the absolute rupee amount a user pays in fees on an average order. |
| **Fee Load (%)** | (Total Fees / Subtotal) x 100 | The most critical KPI. Measures what percentage of the cart value is consumed by fees. This is what the user "feels" at checkout. |
| **Danger Zone Rate (%)** | Orders with Fee Load > 20% / Total orders x 100 | Quantifies how many orders breach the 20% threshold where cart abandonment risk spikes. |
| **Take Rate (%)** | Total fees collected / Total GMV x 100 | Measures the platform's effective revenue extraction rate. A key metric for unit economics and investor reporting. |
| **Surge Hit Rate (%)** | Orders with Surge > 0 / Total orders x 100 | Measures how frequently users encounter surge pricing. A high rate indicates fee volatility that can erode user trust. |
| **Average Rating** | Mean of user ratings (1-5) | A proxy for customer satisfaction. Tracked alongside fee metrics to assess whether pricing impacts user sentiment. |
| **Repeat Order Rate (%)** | Repeat orders / Total orders x 100 (Food BL only) | Indicates user retention. Persistent high fees may reduce repeat usage over time. |

---

## Approach

The project follows a three-phase methodology:

### Phase 1: Data Augmentation
Publicly available Kaggle datasets do not contain internal pricing columns such as Surge Fee, Platform Fee, or Handling Fee. A Python pipeline (`augment_data.py`) was written to inject these fields using realistic business logic, transforming raw order data into pricing-engine-ready datasets.

### Phase 2: Quantitative Analysis
A Python analytics engine (`pricing_analyzer.py` and `prepare_dashboard_data.py`) processes the augmented data to compute:
- 10 KPI cards covering GMV, AOV, Take Rate, Fee Load, Surge Hit Rate, Danger Zone percentage, and more
- Chart-ready aggregations including fee distributions, city-wise breakdowns, weather correlations, and rating vs. fee scatter data
- Simulator base values for the interactive surge pricing tool

### Phase 3: Interactive Dashboard
A self-contained web dashboard (`dashboard/`) renders the analysis in the browser across five tabs:
1. **Overview** - High-level KPIs and distribution charts
2. **BL Deep Dive** - Independent pricing structure analysis for each business line
3. **Surge Simulator** - Adjust pricing levers and observe real-time conversion impact
4. **Competitive Intel** - Food vs Zomato/MagicPin, Instamart vs Blinkit/Zepto
5. **Gap Analysis and Roadmap** - Identified gaps and a proposed feature timeline

---

## Dataset Selection

### Source Datasets (from Kaggle)

| Dataset | Records | Key Columns | Purpose |
|---|---|---|---|
| Food Ordering Behavior (India, 50K Orders) | 50,000 | `order_value`, `delivery_fee`, `city`, `cuisine`, `rainy_weather`, `rating_given`, `is_repeat_order`, `order_time` | Food Business Line analysis |
| Quick Commerce Dataset 2026 | 947,752 | `Order_Value`, `Delivery_Time_Min`, `Distance_Km`, `Items_Count`, `Product_Category`, `City`, `Customer_Rating` | Instamart Business Line analysis |

### Why These Datasets?

The **Food Ordering Behavior** dataset was selected because it includes a `rainy_weather` column, which is critical for analyzing weather-dependent surge pricing logic.

The **Quick Commerce Dataset** was selected because it captures Instamart-specific dimensions such as `Items_Count`, `Distance_Km`, and `Delivery_Time_Min`. These fields are necessary to model Handling Fees and express-delivery surges.

These two datasets represent fundamentally different business models. Food delivery operates with restaurant-to-door logistics, weather-sensitive demand, and cuisine-driven order values. Quick-commerce operates with warehouse-to-door logistics, item-count-driven packing costs, and speed-based delivery promises. They are analyzed independently throughout this project, and each is benchmarked only against its own competitive set.

Three additional Kaggle datasets (Swiggy Restaurant Data, Swiggy Sentiment Analysis, and an older Swiggy dataset) were downloaded but not used in the final analysis, as they did not contain order-level pricing-relevant fields.

---

## Modifications to the Datasets

The raw Kaggle datasets lacked internal pricing metrics. The augmentation script (`augment_data.py`) injected the following columns:

### Food Business Line

| New Column | Logic Applied |
|---|---|
| `Platform_Fee` | Fixed at Rs.18 (matching Swiggy's current flat platform fee) |
| `Surge_Fee` | If `rainy_weather == Yes`: random value between Rs.30 and Rs.80. If `No`: 70% chance of Rs.0, 20% chance of Rs.10, 10% chance of Rs.20 |
| `Total_Fees` | Sum of `delivery_fee`, `Platform_Fee`, and `Surge_Fee` |
| `Fee_Percentage` | `(Total_Fees / Subtotal) x 100`, representing the "Fee Load" metric |

### Instamart Business Line

| New Column | Logic Applied |
|---|---|
| `Platform_Fee` | Fixed at Rs.18 |
| `Delivery_Fee` | `Distance_Km x 8` (distance-based pricing model) |
| `Handling_Fee` | `Items_Count x 2`, clipped to a Rs.4 to Rs.25 range (simulating packing costs) |
| `Surge_Fee` | If delivery time < 15 min and distance > 5 km: random value between Rs.20 and Rs.50. Otherwise Rs.0 |
| `Total_Fees` | Sum of `Delivery_Fee`, `Platform_Fee`, `Surge_Fee`, and `Handling_Fee` |
| `Fee_Percentage` | `(Total_Fees / Subtotal) x 100` |

---

## How to Run

### Prerequisites
- Python 3.10 or above
- A modern web browser (Chrome, Edge, or Firefox)

### Setup and Execution

```bash
# 1. Navigate to the project directory
cd "Swiggy Project"

# 2. Create a virtual environment and install dependencies
python -m venv venv
.\venv\Scripts\activate          # Windows
# source venv/bin/activate       # macOS/Linux

pip install pandas matplotlib seaborn numpy

# 3. Augment the raw Kaggle datasets with pricing fields
python augment_data.py
# Output: food_augmented.csv, im_augmented.csv

# 4. Generate static visualization charts (optional)
python pricing_analyzer.py
# Output: Visualizations/ folder with 4 PNG charts

# 5. Prepare data for the interactive dashboard
python prepare_dashboard_data.py
# Output: dashboard/dashboard_data.js

# 6. Open the dashboard in your browser
start dashboard\index.html       # Windows
# open dashboard/index.html      # macOS
```

The dashboard is fully self-contained. No web server is required. Opening `index.html` directly in a browser is sufficient.

---

## Key Insights

### 1. The 20% Danger Zone

A significant portion of orders across both business lines have fee loads that exceed the 20% threshold. At this level, total fees consume more than one-fifth of the order value, which is the point where cart abandonment increases sharply. Neither business line currently implements any mechanism to cap or moderate the total fee stack.

**Recommendation:** Implement a configurable "Smart Cap" rule. If total fees exceed 20% of the cart value, the system should automatically subsidize the most elastic fee component (typically the Delivery Fee) to bring the total below the threshold.

### 2. Weather Surge in Food Delivery is Binary and Imprecise

In the Food BL, average surge fee jumps from approximately Rs.4 during clear weather to over Rs.54 during rain, a 13.8x increase. However, weather conditions exist on a spectrum. The current binary (rain/no rain) model does not distinguish between light drizzle and heavy storm, leading to two failure modes: over-surging during light rain (losing price-sensitive orders) and under-surging during storms (failing to adequately compensate delivery partners or capture the demand premium).

This is a Food-specific problem. Instamart operates from dark stores with much shorter delivery radii, and weather has a far smaller impact on its logistics.

**Recommendation:** Replace the binary model with a 5-tier weather gradient (Clear, Cloudy, Drizzle, Rain, Storm), each mapped to a calibrated surge multiplier.

### 3. Instamart's Handling Fee Ceiling Creates a Subsidy Leak

The Handling Fee in Instamart caps at Rs.25 regardless of item count. For bulk orders with 30 or more items requiring multiple bags, the platform absorbs packing and runner-capacity costs above the cap. This is structurally different from the Food BL, which does not have a handling fee at all.

The right comparison here is against Blinkit (Rs.6 to Rs.20, flat) and Zepto (Rs.2 to Rs.15, cart-value-based). Both competitors also struggle with this problem, but Zepto's cart-value-based model at least scales proportionally.

**Recommendation:** Implement a stepped fee model. Tier 1 (1 to 10 items: Rs.4 to Rs.12), Tier 2 (11 to 25 items: Rs.12 to Rs.25), and Tier 3 (26+ items: Rs.25 to Rs.40).

### 4. No Player in Either Segment Uses a Fee Cap

Competitive benchmarking reveals that no major player across either segment (Zomato, MagicPin in food; Blinkit, Zepto in quick-commerce) implements a smart fee cap. This represents a first-mover opportunity for Swiggy to position itself as the most pricing-transparent platform in the Indian market.

### 5. Surge Hit Rate in Food is Disproportionately High

Approximately 65% of Food orders are affected by some form of surge pricing. This is a food-delivery-specific issue driven by weather sensitivity, peak-hour demand, and distance variability. Instamart, operating from fixed dark-store locations with shorter radii, sees a much lower surge frequency. This confirms that surge logic needs to be tuned independently for each business line rather than shared.

### 6. Platform Fee is a Significant Fixed Cost

At Rs.18 per order, the platform fee is a fixed cost that disproportionately affects low-value carts. On a Rs.150 Instamart order, the platform fee alone represents 12% of the cart value before any delivery, surge, or handling charges are added. This makes it the single largest contributor to Danger Zone breaches on small orders.

**Recommendation:** Consider a tiered or percentage-based platform fee for orders below a certain cart value threshold to reduce the regressive impact on small baskets.

---

## Technologies Used

| Tool | Purpose |
|---|---|
| Python 3 | Data processing and augmentation |
| Pandas | DataFrame operations and groupby aggregations |
| NumPy | Statistical computations and random distributions |
| Matplotlib + Seaborn | Static chart generation |
| HTML / CSS / JavaScript | Interactive dashboard frontend |
| Chart.js | Browser-based interactive charts |
| Google Fonts (Inter) | Dashboard typography |
