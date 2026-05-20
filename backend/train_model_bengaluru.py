# backend/train_all_cities.py
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from multi_city_preprocessing import CityHousePreprocessor

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = PROJECT_ROOT / "dataset"

CITY_FILES = {
    "Hyderabad": "hyderabad.csv",
    "Bengaluru": "Bengaluru_House_Data.csv",
    "Mumbai": "mumbai.csv",
    "Kolkata": "kolkata.csv",
    "Gurgaon": "gurgaon_10k.csv",
}

def train_model_for_city(city: str, csv_filename: str):
    csv_path = DATA_DIR / csv_filename
    print(f"=== Training model for {city} from {csv_path} ===")

    preprocessor = CityHousePreprocessor(city, str(csv_path))
    df = preprocessor.load_and_clean()
    print(city, "cleaned data shape:", df.shape)

    X = df[["locality", "bhk", "area_sqm"]]
    y = df["price"]

    cat_features = ["locality"]
    num_features = ["bhk", "area_sqm"]

    col_transformer = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat_features),
            ("num", "passthrough", num_features),
        ]
    )

    model = RandomForestRegressor(
        n_estimators=120,
        max_depth=18,
        random_state=42,
        n_jobs=-1,
    )

    pipe = Pipeline(
        steps=[
            ("preprocessor", col_transformer),
            ("model", model),
        ]
    )

    X_train, X_valid, y_train, y_valid = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    pipe.fit(X_train, y_train)
    score = pipe.score(X_valid, y_valid)
    print(f"{city}: R^2 on validation = {score:.3f}")

    models_dir = BASE_DIR / "models"
    models_dir.mkdir(exist_ok=True)
    joblib.dump(pipe, models_dir / f"{city.lower()}_model.joblib")

def main():
    for city, filename in CITY_FILES.items():
        if city != "Hyderabad":
            print(f"Skipping {city} for now (cleaning not implemented yet).")
            continue
        train_model_for_city(city, filename)

if __name__ == "__main__":
    main()