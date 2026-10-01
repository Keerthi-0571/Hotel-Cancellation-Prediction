
from flask import Flask, request, jsonify
from flask_cors import CORS

import pandas as pd
import joblib
import os


# ============================================================
# CREATE FLASK APP
# ============================================================

app = Flask(__name__)
CORS(app)


# ============================================================
# MODEL PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "hotel_cancellation_model.pkl"
)

PREPROCESSOR_PATH = os.path.join(
    BASE_DIR,
    "models",
    "preprocessor.pkl"
)


# ============================================================
# LOAD MODEL AND PREPROCESSOR ONCE
# ============================================================

try:

    model = joblib.load(MODEL_PATH)

    preprocessor = joblib.load(
        PREPROCESSOR_PATH
    )

    print("====================================")
    print("Model loaded successfully!")
    print("Preprocessor loaded successfully!")
    print("====================================")

except Exception as e:

    print("ERROR loading model/preprocessor:")
    print(e)

    model = None
    preprocessor = None


# ============================================================
# HOME ROUTE
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "message": "Hotel Cancellation Prediction API",
        "status": "running"
    })


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health", methods=["GET"])
def health():

    if model is not None and preprocessor is not None:

        return jsonify({
            "status": "healthy",
            "model": "loaded"
        })

    return jsonify({
        "status": "unhealthy",
        "model": "not loaded"
    }), 500


# ============================================================
# PREDICTION ROUTE
# ============================================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        # ----------------------------------------------------
        # CHECK MODEL
        # ----------------------------------------------------

        if model is None or preprocessor is None:

            return jsonify({
                "error": "Model or preprocessor is not loaded."
            }), 500


        # ----------------------------------------------------
        # GET DATA FROM FRONTEND
        # ----------------------------------------------------

        data = request.get_json()

        if not data:

            return jsonify({
                "error": "No input data received."
            }), 400


        # ----------------------------------------------------
        # REQUIRED USER FIELDS
        #
        # These are the simple fields sent by script.js
        # ----------------------------------------------------

        required_fields = [

            "hotel",

            "lead_time",

            "arrival_date_month",

            "stays_in_weekend_nights",

            "stays_in_week_nights",

            "adults",

            "children",

            "market_segment",

            "deposit_type"

        ]


        # ----------------------------------------------------
        # CHECK REQUIRED FIELDS
        # ----------------------------------------------------

        missing_fields = [

            field
            for field in required_fields
            if field not in data

        ]


        if missing_fields:

            return jsonify({

                "error": "Missing required fields.",

                "missing_fields":
                    missing_fields

            }), 400


        # ====================================================
        # DEFAULT VALUES FOR HIDDEN MODEL FEATURES
        # ====================================================
        #
        # The user does NOT need to enter these.
        # They are supplied automatically.
        #
        # ====================================================

        defaults = {

            "arrival_date_year": 2017,

            "arrival_date_week_number": 28,

            "arrival_date_day_of_month": 10,

            "babies": 0,

            "meal": "BB",

            "country": "PRT",

            "distribution_channel": "TA/TO",

            "is_repeated_guest": 0,

            "previous_cancellations": 0,

            "previous_bookings_not_canceled": 0,

            "reserved_room_type": "A",

            "assigned_room_type": "A",

            "booking_changes": 0,

            "agent": 9,

            "company": 0,

            "days_in_waiting_list": 0,

            "customer_type": "Transient",

            "adr": 100,

            "required_car_parking_spaces": 0,

            "total_of_special_requests": 0
        }


        # ----------------------------------------------------
        # ADD DEFAULT VALUES
        # ----------------------------------------------------

        for key, value in defaults.items():

            if key not in data:

                data[key] = value


        # ====================================================
        # CREATE DATAFRAME
        # ====================================================

        input_data = pd.DataFrame([data])


        # ====================================================
        # PREPROCESS INPUT
        # ====================================================

        processed_data = preprocessor.transform(
            input_data
        )


        # ====================================================
        # MAKE PREDICTION
        # ====================================================

        prediction = model.predict(
            processed_data
        )[0]


        # ====================================================
        # CANCELLATION PROBABILITY
        # ====================================================

        probability = model.predict_proba(
            processed_data
        )[0][1]


        probability_percentage = (
            probability * 100
        )


        # ====================================================
        # DETERMINE RISK LEVEL
        # ====================================================

        if probability_percentage < 40:

            risk_level = "Low"

        elif probability_percentage < 70:

            risk_level = "Medium"

        else:

            risk_level = "High"


        # ====================================================
        # PREDICTION LABEL
        # ====================================================

        if prediction == 1:

            prediction_label = "Cancelled"

        else:

            prediction_label = "Not Cancelled"


        # ====================================================
        # FINAL RESPONSE
        # ====================================================

        result = {

            "prediction":
                int(prediction),

            "prediction_label":
                prediction_label,

            "cancellation_probability":
                round(
                    probability_percentage,
                    2
                ),

            "risk_level":
                risk_level

        }


        print(
            "Prediction:",
            result
        )


        return jsonify(result)


    # ========================================================
    # ERROR HANDLING
    # ========================================================

    except Exception as e:

        print(
            "Prediction Error:",
            str(e)
        )

        return jsonify({

            "error":
                "Prediction failed: "
                + str(e)

        }), 500


# ============================================================
# RUN FLASK SERVER
# ============================================================

if __name__ == "__main__":

    app.run(

        host="127.0.0.1",

        port=5000,

        debug=True

    )

