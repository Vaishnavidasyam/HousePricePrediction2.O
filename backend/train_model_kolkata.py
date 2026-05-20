import os
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

from kolkata_preprocessing import KolkataHousePreprocessor

DATA_PATH = os.path.join("..", "dataset", "kolkata.csv")
MODEL_DIR = os.path.join("models", "kolkata")

if not os.path.exists(MODEL_DIR):
    os.makedirs(MODEL_DIR)

preprocessor = KolkataHousePreprocessor(DATA_PATH)
df = preprocessor.load_and_clean()
print("Kolkata data loaded:", df.shape)

for bhk_val in [2, 3]:
    X, y = preprocessor.get_features_target(bhk_val)

    if len(X) < 5:
        print(f"[WARN] Not enough Kolkata data for {bhk_val}BHK; skipping...")
        continue

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"Kolkata {bhk_val}BHK MAE: ₹{mae:.2f}/sqm")

    joblib.dump(model, os.path.join(MODEL_DIR, f"rf_{bhk_val}bhk.pkl"))

joblib.dump(preprocessor, os.path.join(MODEL_DIR, "preprocessor.pkl"))
print("✅ Kolkata models and preprocessor saved to 'models/kolkata/'")