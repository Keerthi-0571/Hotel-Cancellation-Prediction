document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("predictionForm");
    const button = document.getElementById("predictBtn");
    const loading = document.getElementById("loading");
    const result = document.getElementById("result");

    console.log("Hotel Prediction JS loaded");

    if (!form) {
        console.error("predictionForm not found");
        return;
    }

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        // =========================================
        // SHOW LOADING
        // =========================================

        if (button) {
            button.disabled = true;
            button.innerHTML = "⏳ Predicting...";
        }

        if (loading) {
            loading.classList.remove("d-none");
        }

        if (result) {
            result.innerHTML = `
                <div class="text-center p-4">
                    <div class="spinner-border text-primary"></div>
                    <p class="mt-3 text-muted">
                        Analyzing booking...
                    </p>
                </div>
            `;
        }

        // =========================================
        // GET FORM VALUES
        // =========================================

        const totalNights =
            Number(document.getElementById("total_nights").value);

        const weekendNights =
            Math.min(totalNights, 2);

        const weekNights =
            Math.max(totalNights - weekendNights, 0);


        // =========================================
        // CREATE MODEL INPUT
        // =========================================

        const data = {

            hotel:
                document.getElementById("hotel").value,

            lead_time:
                Number(
                    document.getElementById("lead_time").value
                ),

            arrival_date_month:
                document.getElementById("arrival_date_month").value,

            stays_in_weekend_nights:
                weekendNights,

            stays_in_week_nights:
                weekNights,

            adults:
                Number(
                    document.getElementById("adults").value
                ),

            children:
                Number(
                    document.getElementById("children").value || 0
                ),

            market_segment:
                document.getElementById("market_segment").value,

            deposit_type:
                document.getElementById("deposit_type").value,


            // =====================================
            // DEFAULT VALUES
            // =====================================

            arrival_date_year: 2017,

            arrival_date_week_number: 28,

            arrival_date_day_of_month: 10,

            babies: 0,

            meal: "BB",

            country: "PRT",

            distribution_channel: "TA/TO",

            is_repeated_guest: 0,

            previous_cancellations: 0,

            previous_bookings_not_canceled: 0,

            reserved_room_type: "A",

            assigned_room_type: "A",

            booking_changes: 0,

            agent: 9,

            company: 0,

            days_in_waiting_list: 0,

            customer_type: "Transient",

            adr: 100,

            required_car_parking_spaces: 0,

            total_of_special_requests: 0
        };


        console.log("Sending prediction data:", data);


        // =========================================
        // SEND TO FLASK
        // =========================================

        const controller =
            new AbortController();

        const timeout =
            setTimeout(function () {

                controller.abort();

            }, 8000);


        try {

            const response =
                await fetch(
                    "http://127.0.0.1:5000/predict",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(data),

                        signal:
                            controller.signal
                    }
                );


            clearTimeout(timeout);


            // =====================================
            // READ RESPONSE
            // =====================================

            const text =
                await response.text();

            console.log(
                "Flask response:",
                text
            );


            let prediction;

            try {

                prediction =
                    JSON.parse(text);

            } catch (e) {

                throw new Error(
                    "Flask returned an invalid response."
                );

            }


            // =====================================
            // BACKEND ERROR
            // =====================================

            if (!response.ok) {

                throw new Error(
                    prediction.error ||
                    "Prediction failed."
                );

            }


            // =====================================
            // GET PREDICTION
            // =====================================

            const predictionValue =
                Number(
                    prediction.prediction
                );


            const probability =
                Number(
                    prediction.cancellation_probability
                );


            const predictionLabel =
                prediction.prediction_label ||
                (
                    predictionValue === 1
                        ? "Cancelled"
                        : "Not Cancelled"
                );


            const riskLevel =
                prediction.risk_level ||
                "Low";


            // =====================================
            // RISK CSS
            // =====================================

            let riskClass =
                "risk-low";


            if (riskLevel === "High") {

                riskClass =
                    "risk-high";

            } else if (riskLevel === "Medium") {

                riskClass =
                    "risk-medium";

            }


            // =====================================
            // PREDICTION CSS
            // =====================================

            let predictionClass =
                "prediction-not-cancelled";


            if (predictionValue === 1) {

                predictionClass =
                    "prediction-cancelled";

            }


            // =====================================
            // DISPLAY RESULT
            // =====================================

            result.innerHTML = `

                <div class="result-card">

                    <h4 class="fw-bold mb-4">
                        📊 Prediction Result
                    </h4>

                    <hr>

                    <div class="mb-4">

                        <small class="text-muted">
                            Prediction
                        </small>

                        <div class="
                            prediction-success
                            ${predictionClass}
                        ">

                            ${predictionLabel}

                        </div>

                    </div>


                    <div class="mb-3">

                        <small class="text-muted">
                            Cancellation Probability
                        </small>

                        <div class="probability">

                            ${probability.toFixed(2)}%

                        </div>

                    </div>


                    <div
                        class="progress mb-4"
                        style="height:14px;"
                    >

                        <div
                            class="progress-bar"
                            role="progressbar"
                            style="
                                width:${Math.min(
                                    Math.max(
                                        probability,
                                        0
                                    ),
                                    100
                                )}%;
                            "
                        >
                        </div>

                    </div>


                    <div>

                        <small class="text-muted">
                            Risk Level
                        </small>

                        <br>

                        <span class="
                            risk-badge
                            ${riskClass}
                        ">

                            ${riskLevel}

                        </span>

                    </div>

                </div>

            `;


            // =====================================
            // SAVE DASHBOARD DATA
            // =====================================

            const record = {

                hotel:
                    data.hotel,

                lead_time:
                    data.lead_time,

                total_nights:
                    totalNights,

                prediction:
                    predictionValue,

                prediction_label:
                    predictionLabel,

                cancellation_probability:
                    probability,

                risk_level:
                    riskLevel,

                timestamp:
                    new Date().toISOString()
            };


            let history =
                JSON.parse(
                    localStorage.getItem(
                        "hotelPredictions"
                    )
                ) || [];


            history.push(record);


            localStorage.setItem(
                "hotelPredictions",
                JSON.stringify(history)
            );


        } catch (error) {

            clearTimeout(timeout);

            console.error(
                "Prediction error:",
                error
            );


            let message =
                error.message;


            if (error.name === "AbortError") {

                message =
                    "Prediction took too long. Check whether Flask is running.";
            }


            result.innerHTML = `

                <div class="alert alert-danger">

                    <strong>
                        ❌ Prediction Error
                    </strong>

                    <br><br>

                    ${message}

                    <hr>

                    <small>
                        Check the Flask PowerShell window
                        for the exact error.
                    </small>

                </div>

            `;


        } finally {

            clearTimeout(timeout);

            if (button) {

                button.disabled = false;

                button.innerHTML =
                    "🔍 Predict Cancellation";

            }

            if (loading) {

                loading.classList.add("d-none");

            }

        }

    });

});