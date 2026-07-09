# House Price Prediction 2.0

A real estate price prediction tool that helps users estimate property prices across five major Indian cities — Hyderabad, Bengaluru, Mumbai, Kolkata, and Gurgaon.

## Project Description

This project was built to make house price estimation easier and more interactive. Instead of manually checking multiple websites or talking to brokers, users can just enter property details like city, locality, area, and number of bedrooms, and get an estimated price instantly.

The backend uses machine learning models trained on real estate data to predict prices. The frontend is a full-featured web app with a dashboard, 3D visualizations, comparison tools, and an AI assistant that answers questions about properties. The project was originally developed as a data science / machine learning exercise and later expanded into a full-stack application.

## Features

- **Price Prediction** — Get instant price estimates for apartments, villas, plots, and other property types
- **Multi-City Support** — Works for 5 Indian cities with city-specific ML models
- **City Comparison** — Compare property prices and investment metrics between two cities side-by-side
- **AI Assistant** — Ask questions about property value, rental yield, growth forecasts, and investment risk
- **3D Property Viewer** — Visualize floor plans in 2D and 3D with interactive controls
- **City Intelligence Dashboard** — View demand scores, infrastructure ratings, locality data, and land prices for each city
- **Investment Analysis** — Get growth projections, rental yield estimates, and investment verdicts
- **Dark/Light Theme** — Toggle between dark and light mode

## Technologies Used

**Frontend:**
- React 19
- React Router (client-side routing)
- Three.js / React Three Fiber (3D visualization)
- Framer Motion (animations)
- Lucide React (icons)
- Axios (API calls)
- Bootstrap

**Backend:**
- Python
- FastAPI (REST API framework)
- Scikit-learn (Random Forest model)
- Pandas & NumPy (data processing)
- Joblib (model serialization)
- Uvicorn (server)

**ML Models:**
- Random Forest Regressor trained per city per BHK type (2BHK and 3BHK)
- Label encoding for localities

## Project Structure

```
HousePricePrediction2.O/
├── backend/                  # Python FastAPI backend
│   ├── app.py                # Main API server with /predict and /metadata endpoints
│   ├── data_preprocessing.py # Data cleaning and preprocessing for Hyderabad
│   ├── bengaluru_preprocessing.py
│   ├── mumbai_preprocessing.py
│   ├── kolkata_preprocessing.py
│   ├── gurgaon_preprocessing.py
│   ├── train_model.py        # Script to train Hyderabad model
│   ├── train_model_bengaluru.py
│   ├── train_model_mumbai.py
│   ├── train_model_kolkata.py
│   ├── train_model_gurgaon.py
│   ├── requirements.txt      # Python dependencies
│   └── models/               # Saved ML models (pickle files)
├── frontend/                 # React web application
│   ├── src/
│   │   ├── App.js            # Main app with routing
│   │   ├── PlatformLayout.js # Sidebar + navbar layout
│   │   ├── sections/         # Page components
│   │   │   ├── PropertyHub.js           # Main valuation form
│   │   │   ├── ValuationResults.js      # Detailed property report
│   │   │   ├── ComparisonCenter.js      # Compare two cities
│   │   │   ├── SmartCityIntelligence.js # City insights dashboard
│   │   │   ├── InvestmentIntelligence.js # Investment analysis
│   │   │   ├── Explorer3D.js           # 3D property viewer
│   │   │   └── AiAssistantPanel.js     # AI chatbot for queries
│   │   ├── components/       # Reusable UI components
│   │   ├── data/
│   │   │   └── marketData.js # City profiles, price logic, helpers
│   │   ├── hooks/
│   │   │   └── useMarketMetadata.js # Fetches city metadata from API
│   │   └── pages/
│   └── package.json
├── dataset/                  # CSV data files for each city
│   ├── hyderabad.csv
│   ├── Bengaluru_House_Data.csv
│   ├── mumbai.csv
│   ├── kolkata.csv
│   ├── gurgaon_10k.csv
│   └── facets/               # Breakdown of categorical features
├── model/                    # Additional saved models
│   ├── house_price_model.pickle
│   └── columns.json
└── house_prediction.ipynb    # Jupyter notebook for model training
```

## Installation

### Prerequisites
- Python 3.8+ installed
- Node.js 18+ installed
- Git installed

### Steps

1. **Clone the repository**
   ```
   git clone https://github.com/your-username/HousePricePrediction2.O.git
   cd HousePricePrediction2.O
   ```

2. **Set up the backend**
   ```
   cd backend
   pip install -r requirements.txt
   ```

3. **Start the backend server**
   ```
   uvicorn app:app --reload
   ```
   The API will run at `http://127.0.0.1:8000`.

4. **Set up the frontend** (in a new terminal)
   ```
   cd frontend
   npm install
   ```

5. **Start the frontend**
   ```
   npm start
   ```
   The app will open at `http://localhost:3000`.

> **Note:** The frontend works even if the backend is not running — it falls back to built-in estimation logic. But for ML-powered predictions, keep the backend running.

## How to Use

1. Open the app in your browser at `http://localhost:3000`
2. Click **Launch Platform** on the home page
3. On the **Property Hub** page, select a city, locality, property type, BHK, and area
4. Click **Execute Full Market Valuation** to get a price estimate
5. View the detailed report on the **Valuation** page with price breakdown, growth forecast, and comparison table
6. Use the sidebar to explore:
   - **Compare** — Compare two cities side-by-side
   - **City & Land** — View city scores, locality data, land prices
   - **Investment** — Analyze investment scenarios
   - **Visual Studio** — Explore properties in 3D
   - **AI Assistant** — Chat with the AI advisor about properties

 

## Future Improvements

- Add more cities and property types
- Train models for more BHK configurations (1BHK, 4BHK, 5BHK)
- Use deep learning models for better accuracy
- Add user authentication and saved property portfolios
- Integrate live property listing data from real estate APIs
- Add map-based property search
- Deploy the app to cloud (AWS, Vercel, or Railway)

## Author

Vaishnavidasyam

---

*This project was built as part of a learning exercise in data science and full-stack development.*
