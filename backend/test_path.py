# backend/inspect_hyd.py
import pandas as pd
from pathlib import Path
 
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "dataset"

path = DATA_DIR / "hyderabad.csv"
print("Path:", path)
print("Exists:", path.exists())

df = pd.read_csv(path, nrows=5)
print("Columns:", df.columns.tolist())
print(df.head())