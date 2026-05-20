import pandas as pd
from sklearn.preprocessing import LabelEncoder


class GurgaonHousePreprocessor:
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.df = None
        self.locality_encoder = LabelEncoder()

    def _parse_area(self, val):
        if pd.isna(val):
            return None
        try:
            return float(val)
        except Exception:
            return None

    def _parse_price(self, s: str):
        # Same format as Hyderabad: "1.2 Cr", "50 L", etc.
        if not isinstance(s, str):
            return None
        s = s.strip()
        if not s or s.lower().startswith("price on request"):
            return None

        unit = None
        if "Cr" in s:
            unit = "Cr"
        elif "L" in s:
            unit = "L"

        raw = s.replace("Cr", "").replace("L", "")
        raw = raw.replace("₹", "").replace(",", "")
        parts = [p.strip() for p in raw.split("-") if p.strip()]

        nums = []
        for p in parts:
            try:
                nums.append(float(p))
            except Exception:
                pass
        if not nums:
            return None

        avg_val = sum(nums) / len(nums)

        if unit == "Cr":
            return avg_val * 1_00_00_000
        elif unit == "L":
            return avg_val * 1_00_000
        else:
            return avg_val * 1_00_000

    def load_and_clean(self):
        df = pd.read_csv(self.data_path)
        print("Gurgaon columns:", df.columns.tolist())

        required_cols = ["LOCALITY", "BEDROOM_NUM", "MIN_AREA_SQFT", "PRICE"]
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise ValueError(f"Gurgaon missing required columns: {missing}")

        df = df[required_cols].copy()
        print("Gurgaon: selected core cols:", df.shape)

        df["locality"] = df["LOCALITY"].astype(str).str.strip()

        # BEDROOM_NUM -> int
        df["BEDROOM_NUM"] = (
            df["BEDROOM_NUM"].astype(str).str.extract(r"(\d+)", expand=False)
        )
        df["BEDROOM_NUM"] = pd.to_numeric(df["BEDROOM_NUM"], errors="coerce")

        # area sqft
        df["AREA_NUM"] = df["MIN_AREA_SQFT"].apply(self._parse_area)

        # price rupees
        df["PRICE_NUM"] = df["PRICE"].apply(self._parse_price)

        df = df.dropna(
            subset=["BEDROOM_NUM", "AREA_NUM", "PRICE_NUM", "locality"]
        ).reset_index(drop=True)
        print("Gurgaon: after parsing & dropping NaN:", df.shape)

        df = df[(df["AREA_NUM"] >= 20) & (df["AREA_NUM"] <= 5000)]
        df = df[df["PRICE_NUM"] > 0]
        print("Gurgaon: after filtering area & price:", df.shape)

        df = df.rename(
            columns={
                "BEDROOM_NUM": "bhk",
                "AREA_NUM": "area_sqft",
                "PRICE_NUM": "price",
            }
        )

        df["area_sqm"] = df["area_sqft"] * 0.0929
        df["price_per_sqm"] = df["price"] / df["area_sqm"]

        df = df[df["bhk"].isin([2, 3])].reset_index(drop=True)
        print("Gurgaon: after keeping only 2BHK & 3BHK:", df.shape)

        df["locality"] = df["locality"].astype(str)
        self.locality_encoder.fit(df["locality"])
        df["locality_enc"] = self.locality_encoder.transform(df["locality"])

        self.df = df
        return df

    def get_features_target(self, bhk_value):
        df_bhk = self.df[self.df["bhk"] == bhk_value].copy()
        X = df_bhk[["locality_enc", "area_sqm"]]
        y = df_bhk["price_per_sqm"]
        return X, y

    def encode_locality(self, locality):
        locality = str(locality)
        if locality not in self.locality_encoder.classes_:
            raise ValueError(f"Gurgaon locality '{locality}' not seen during training.")
        return self.locality_encoder.transform([locality])[0]