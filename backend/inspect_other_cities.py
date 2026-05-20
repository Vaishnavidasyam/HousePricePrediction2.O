# backend/inspect_other_cities.py
import pandas as pd
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "dataset"

files = {
    "Mumbai": "mumbai.csv",
    "Kolkata": "kolkata.csv",
    "Gurgaon": "gurgaon_10k.csv",
}

for city, filename in files.items():
    path = DATA_DIR / filename
    print("=" * 60)
    print(f"{city} -> {path}")
    print("Exists:", path.exists())
    if not path.exists():
        continue

    df = pd.read_csv(path, nrows=5)
    print("Columns:", df.columns.tolist())
    print(df.head())