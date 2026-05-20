# backend/model/bengaluru_preprocessing.py
import pandas as pd
from sklearn.preprocessing import LabelEncoder


class BengaluruHousePreprocessor:
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.df = None
        self.locality_encoder = LabelEncoder()

    def _parse_area(self, s):
        if pd.isna(s):
            return None
        # Bengaluru dataset has total_sqft sometimes like "2100 - 2850"
        s = str(s).strip()
        if not s:
            return None
        # handle range "2100-2850"
        parts = s.replace("Sq. Meter", "").replace("Sq. Yards", "").split("-")
        try:
            if len(parts) == 1:
                return float(parts[0].strip())
            low = float(parts[0].strip())
            high = float(parts[1].strip())
            return (low + high) / 2.0
        except Exception:
            return None

    def _parse_bhk(self, s):
        # "2 BHK" or "4 Bedroom" -> 2, 4
        if pd.isna(s):
            return None
        s = str(s)
        import re
        match = re.search(r"(\d+)", s)
        if not match:
            return None
        return int(match.group(1))

    def _parse_price(self, val):
        # price is already numeric in lakhs (float)
        # convert to rupees: L * 1,00,000
        try:
            if pd.isna(val):
                return None
            v = float(val)
            return v * 1_00_000
        except Exception:
            return None

    def load_and_clean(self):
        df = pd.read_csv(self.data_path)

        print("Bengaluru CSV columns:", df.columns.tolist())

        required_cols = ["location", "size", "total_sqft", "price"]
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise ValueError(f"Bengaluru missing required columns: {missing}")

        df = df[required_cols].copy()
        print("Bengaluru: selected core cols shape:", df.shape)

        # locality
        df["locality"] = df["location"].astype(str).str.strip()

        # bhk
        df["bhk"] = df["size"].apply(self._parse_bhk)

        # area in sqft
        df["area_sqft"] = df["total_sqft"].apply(self._parse_area)

        # price in rupees
        df["price"] = df["price"].apply(self._parse_price)

        # drop invalid
        df = df.dropna(subset=["locality", "bhk", "area_sqft", "price"]).reset_index(drop=True)
        print("Bengaluru: after parsing & dropping NaN:", df.shape)

        # sensible filters
        df = df[(df["area_sqft"] >= 20) & (df["area_sqft"] <= 5000)]
        df = df[df["price"] > 0]
        print("Bengaluru: after filtering area & price:", df.shape)

        # convert to sqm
        df["area_sqm"] = df["area_sqft"] * 0.0929

        # price per sqm
        df["price_per_sqm"] = df["price"] / df["area_sqm"]

        # only 2BHK & 3BHK (same as Hyderabad)
        df = df[df["bhk"].isin([2, 3])].reset_index(drop=True)
        print("Bengaluru: after keeping only 2BHK & 3BHK:", df.shape)

        # locality encoding
        df["locality"] = df["locality"].astype(str)
        self.locality_encoder.fit(df["locality"])
        df["locality_enc"] = self.locality_encoder.transform(df["locality"])

        self.df = df
        return df

    def get_features_target(self, bhk_value: int):
        df_bhk = self.df[self.df["bhk"] == bhk_value].copy()
        X = df_bhk[["locality_enc", "area_sqm"]]
        y = df_bhk["price_per_sqm"]
        return X, y

    def encode_locality(self, locality: str):
        locality = str(locality)
        if locality not in self.locality_encoder.classes_:
            raise ValueError(f"Locality '{locality}' not seen during Bengaluru training.")
        return self.locality_encoder.transform([locality])[0]