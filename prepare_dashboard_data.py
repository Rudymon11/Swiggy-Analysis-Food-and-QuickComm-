"""
Reads augmented CSVs and computes all KPIs, chart data, and simulator
base values. Outputs a JS file that the dashboard loads directly.
"""
import pandas as pd
import numpy as np
import json
import os

BASE_DIR = r"C:\Users\5510s\Downloads\Swiggy Project"
FOOD_DATA = os.path.join(BASE_DIR, "food_augmented.csv")
IM_DATA = os.path.join(BASE_DIR, "im_augmented.csv")
OUTPUT = os.path.join(BASE_DIR, "dashboard", "dashboard_data.js")


def prepare_data():
    df_food = pd.read_csv(FOOD_DATA)
    df_im = pd.read_csv(IM_DATA)

    data = {}

    # ── KPI Cards ──────────────────────────────────────────────
    data["kpis"] = {
        "food": {
            "totalOrders": int(len(df_food)),
            "avgOrderValue": round(float(df_food["Subtotal"].mean()), 2),
            "avgTotalFees": round(float(df_food["Total_Fees"].mean()), 2),
            "avgFeeLoad": round(float(df_food["Fee_Percentage"].mean()), 2),
            "dangerZoneRate": round(
                float((df_food["Fee_Percentage"] > 20).mean() * 100), 2
            ),
            "avgDeliveryFee": round(float(df_food["delivery_fee"].mean()), 2),
            "avgSurgeFee": round(float(df_food["Surge_Fee"].mean()), 2),
            "avgPlatformFee": round(float(df_food["Platform_Fee"].mean()), 2),
            "takeRate": round(
                float(df_food["Total_Fees"].sum() / df_food["Subtotal"].sum() * 100), 2
            ),
            "surgeHitRate": round(
                float((df_food["Surge_Fee"] > 0).mean() * 100), 2
            ),
            "avgRating": round(float(df_food["rating_given"].mean()), 2),
            "repeatOrderRate": round(
                float((df_food["is_repeat_order"] == "Yes").mean() * 100), 2
            )
            if "is_repeat_order" in df_food.columns
            else 0,
            "gmv": round(float(df_food["Subtotal"].sum()), 0),
        },
        "im": {
            "totalOrders": int(len(df_im)),
            "avgOrderValue": round(float(df_im["Subtotal"].mean()), 2),
            "avgTotalFees": round(float(df_im["Total_Fees"].mean()), 2),
            "avgFeeLoad": round(float(df_im["Fee_Percentage"].mean()), 2),
            "dangerZoneRate": round(
                float((df_im["Fee_Percentage"] > 20).mean() * 100), 2
            ),
            "avgDeliveryFee": round(float(df_im["Delivery_Fee"].mean()), 2),
            "avgSurgeFee": round(float(df_im["Surge_Fee"].mean()), 2),
            "avgPlatformFee": round(float(df_im["Platform_Fee"].mean()), 2),
            "avgHandlingFee": round(float(df_im["Handling_Fee"].mean()), 2),
            "takeRate": round(
                float(df_im["Total_Fees"].sum() / df_im["Subtotal"].sum() * 100), 2
            ),
            "surgeHitRate": round(
                float((df_im["Surge_Fee"] > 0).mean() * 100), 2
            ),
            "avgRating": round(float(df_im["Customer_Rating"].mean()), 2),
            "gmv": round(float(df_im["Subtotal"].sum()), 0),
        },
    }

    # ── Fee Stack Comparison ───────────────────────────────────
    data["feeStack"] = {
        "food": {
            "Delivery Fee": round(float(df_food["delivery_fee"].mean()), 2),
            "Surge Fee": round(float(df_food["Surge_Fee"].mean()), 2),
            "Platform Fee": round(float(df_food["Platform_Fee"].mean()), 2),
        },
        "im": {
            "Delivery Fee": round(float(df_im["Delivery_Fee"].mean()), 2),
            "Surge Fee": round(float(df_im["Surge_Fee"].mean()), 2),
            "Platform Fee": round(float(df_im["Platform_Fee"].mean()), 2),
            "Handling Fee": round(float(df_im["Handling_Fee"].mean()), 2),
        },
    }

    # ── Fee Load Distribution ──────────────────────────────────
    food_hist, food_bins = np.histogram(
        df_food["Fee_Percentage"].clip(0, 60), bins=30
    )
    im_hist, im_bins = np.histogram(
        df_im["Fee_Percentage"].clip(0, 60), bins=30
    )
    data["feeLoadDist"] = {
        "food": {
            "counts": food_hist.tolist(),
            "bins": [round(b, 1) for b in food_bins[:-1].tolist()],
        },
        "im": {
            "counts": im_hist.tolist(),
            "bins": [round(b, 1) for b in im_bins[:-1].tolist()],
        },
    }

    # ── Weather vs Surge (Food) ────────────────────────────────
    weather_data = (
        df_food.groupby("rainy_weather")
        .agg(
            avg_surge=("Surge_Fee", "mean"),
            avg_fee_load=("Fee_Percentage", "mean"),
            avg_rating=("rating_given", "mean"),
            order_count=("order_id", "count"),
        )
        .reset_index()
    )
    data["weatherSurge"] = weather_data.round(2).to_dict("records")

    # ── City-wise Analysis ─────────────────────────────────────
    data["cityAnalysis"] = {}
    if "city" in df_food.columns:
        city_food = (
            df_food.groupby("city")
            .agg(
                avg_aov=("Subtotal", "mean"),
                avg_fee_load=("Fee_Percentage", "mean"),
                avg_surge=("Surge_Fee", "mean"),
                order_count=("order_id", "count"),
            )
            .reset_index()
            .sort_values("order_count", ascending=False)
            .head(10)
        )
        data["cityAnalysis"]["food"] = city_food.round(2).to_dict("records")

    if "City" in df_im.columns:
        city_im = (
            df_im.groupby("City")
            .agg(
                avg_aov=("Subtotal", "mean"),
                avg_fee_load=("Fee_Percentage", "mean"),
                avg_surge=("Surge_Fee", "mean"),
                order_count=("Order_ID", "count"),
            )
            .reset_index()
            .sort_values("order_count", ascending=False)
            .head(10)
        )
        data["cityAnalysis"]["im"] = city_im.round(2).to_dict("records")

    # ── Rating vs Fee Load (sampled scatter) ───────────────────
    food_sample = df_food[["rating_given", "Fee_Percentage"]].sample(
        min(500, len(df_food)), random_state=42
    )
    data["ratingVsFee"] = {
        "food": {
            "ratings": food_sample["rating_given"].tolist(),
            "feeLoads": [round(f, 2) for f in food_sample["Fee_Percentage"].tolist()],
        }
    }
    if "Customer_Rating" in df_im.columns:
        im_sample = df_im[["Customer_Rating", "Fee_Percentage"]].sample(
            min(500, len(df_im)), random_state=42
        )
        data["ratingVsFee"]["im"] = {
            "ratings": im_sample["Customer_Rating"].tolist(),
            "feeLoads": [round(f, 2) for f in im_sample["Fee_Percentage"].tolist()],
        }

    # ── Cuisine / Category Breakdown ──────────────────────────
    if "cuisine" in df_food.columns:
        cuisine_data = (
            df_food.groupby("cuisine")
            .agg(
                avg_aov=("Subtotal", "mean"),
                avg_fee_load=("Fee_Percentage", "mean"),
                order_count=("order_id", "count"),
            )
            .reset_index()
            .sort_values("order_count", ascending=False)
            .head(8)
        )
        data["cuisineBreakdown"] = cuisine_data.round(2).to_dict("records")

    if "Product_Category" in df_im.columns:
        cat_data = (
            df_im.groupby("Product_Category")
            .agg(
                avg_aov=("Subtotal", "mean"),
                avg_fee_load=("Fee_Percentage", "mean"),
                order_count=("Order_ID", "count"),
            )
            .reset_index()
            .sort_values("order_count", ascending=False)
            .head(8)
        )
        data["categoryBreakdown"] = cat_data.round(2).to_dict("records")

    # ── Order Time Analysis (Food) ─────────────────────────────
    if "order_time" in df_food.columns:
        time_data = (
            df_food.groupby("order_time")
            .agg(
                avg_surge=("Surge_Fee", "mean"),
                avg_fee_load=("Fee_Percentage", "mean"),
                avg_aov=("Subtotal", "mean"),
                order_count=("order_id", "count"),
            )
            .reset_index()
        )
        data["timeAnalysis"] = time_data.round(2).to_dict("records")

    # ── Meal Type Analysis ─────────────────────────────────────
    if "meal_type" in df_food.columns:
        meal_data = (
            df_food.groupby("meal_type")
            .agg(
                avg_aov=("Subtotal", "mean"),
                avg_fee_load=("Fee_Percentage", "mean"),
                order_count=("order_id", "count"),
            )
            .reset_index()
        )
        data["mealAnalysis"] = meal_data.round(2).to_dict("records")

    # ── Discount Impact ────────────────────────────────────────
    if "discount_applied" in df_food.columns:
        disc_food = (
            df_food.groupby("discount_applied")
            .agg(
                avg_aov=("Subtotal", "mean"),
                avg_fee_load=("Fee_Percentage", "mean"),
                avg_rating=("rating_given", "mean"),
                order_count=("order_id", "count"),
            )
            .reset_index()
        )
        data["discountImpact"] = disc_food.round(2).to_dict("records")

    # ── Surge Simulator Base Data ──────────────────────────────
    data["surgeSimBase"] = {
        "avgFoodDeliveryFee": round(float(df_food["delivery_fee"].mean()), 2),
        "avgFoodSurgeFee": round(float(df_food["Surge_Fee"].mean()), 2),
        "avgFoodSubtotal": round(float(df_food["Subtotal"].mean()), 2),
        "avgFoodPlatformFee": 18,
        "avgIMDeliveryFee": round(float(df_im["Delivery_Fee"].mean()), 2),
        "avgIMSurgeFee": round(float(df_im["Surge_Fee"].mean()), 2),
        "avgIMHandlingFee": round(float(df_im["Handling_Fee"].mean()), 2),
        "avgIMSubtotal": round(float(df_im["Subtotal"].mean()), 2),
        "avgIMPlatformFee": 18,
    }

    # ── Fee Bucket Conversion Simulation ───────────────────────
    # Model: conversion rate decays as fee load rises
    buckets = [0, 5, 10, 15, 20, 25, 30, 40, 60]
    labels = ["0-5%", "5-10%", "10-15%", "15-20%", "20-25%", "25-30%", "30-40%", "40-60%"]
    food_cut = pd.cut(df_food["Fee_Percentage"], bins=buckets, labels=labels)
    bucket_counts = food_cut.value_counts().sort_index()
    # Simulated conversion curve (higher fee = lower conversion)
    base_conversions = [0.95, 0.92, 0.87, 0.78, 0.62, 0.45, 0.30, 0.15]
    data["conversionCurve"] = {
        "labels": labels,
        "baseConversion": base_conversions,
        "orderCounts": bucket_counts.tolist(),
    }

    # ── Save ───────────────────────────────────────────────────
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w") as f:
        f.write("const DASHBOARD_DATA = ")
        json.dump(data, f, indent=2)
        f.write(";\n")

    print(f"Dashboard data written -> {OUTPUT}")
    print(f"  Food orders : {len(df_food):,}")
    print(f"  IM orders   : {len(df_im):,}")


if __name__ == "__main__":
    prepare_data()
