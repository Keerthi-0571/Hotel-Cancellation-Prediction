document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // GET SAVED PREDICTIONS
    // ==========================================

    let predictions = [];

    try {
        predictions =
            JSON.parse(
                localStorage.getItem("hotelPredictions")
            ) || [];
    } catch (error) {
        console.error("Error reading prediction history:", error);
        predictions = [];
    }

    console.log("Saved predictions:", predictions);


    // ==========================================
    // BASIC COUNTS
    // ==========================================

    const total = predictions.length;

    const cancelled =
        predictions.filter(function (p) {
            return Number(p.prediction) === 1;
        }).length;

    const notCancelled =
        total - cancelled;

    const cancellationRate =
        total > 0
            ? ((cancelled / total) * 100).toFixed(1)
            : "0.0";


    // ==========================================
    // RISK COUNTS
    // ==========================================

    const highRisk =
        predictions.filter(function (p) {
            return String(p.risk_level).toLowerCase() === "high";
        }).length;

    const mediumRisk =
        predictions.filter(function (p) {
            return String(p.risk_level).toLowerCase() === "medium";
        }).length;

    const lowRisk =
        predictions.filter(function (p) {
            return String(p.risk_level).toLowerCase() === "low";
        }).length;


    // ==========================================
    // UPDATE DASHBOARD CARDS
    // ==========================================

    const totalElement =
        document.getElementById("totalPredictions");

    const cancelledElement =
        document.getElementById("cancelledBookings");

    const notCancelledElement =
        document.getElementById("notCancelledBookings");

    const rateElement =
        document.getElementById("cancellationRate");

    const highElement =
        document.getElementById("highRisk");

    const mediumElement =
        document.getElementById("mediumRisk");

    const lowElement =
        document.getElementById("lowRisk");


    if (totalElement) {
        totalElement.textContent = total;
    }

    if (cancelledElement) {
        cancelledElement.textContent = cancelled;
    }

    if (notCancelledElement) {
        notCancelledElement.textContent = notCancelled;
    }

    if (rateElement) {
        rateElement.textContent =
            cancellationRate + "%";
    }

    if (highElement) {
        highElement.textContent = highRisk;
    }

    if (mediumElement) {
        mediumElement.textContent = mediumRisk;
    }

    if (lowElement) {
        lowElement.textContent = lowRisk;
    }


    // ==========================================
    // CANCELLATION CHART
    // ==========================================

    const cancellationCanvas =
        document.getElementById("cancellationChart");


    if (
        cancellationCanvas &&
        typeof Chart !== "undefined"
    ) {

        new Chart(
            cancellationCanvas,
            {
                type: "doughnut",

                data: {

                    labels: [
                        "Cancelled",
                        "Not Cancelled"
                    ],

                    datasets: [
                        {
                            data: [
                                cancelled,
                                notCancelled
                            ]
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            position: "bottom"
                        }

                    }
                }
            }
        );
    }


    // ==========================================
    // RISK CHART
    // ==========================================

    const riskCanvas =
        document.getElementById("riskChart");


    if (
        riskCanvas &&
        typeof Chart !== "undefined"
    ) {

        new Chart(
            riskCanvas,
            {
                type: "bar",

                data: {

                    labels: [
                        "High",
                        "Medium",
                        "Low"
                    ],

                    datasets: [
                        {
                            label: "Predictions",

                            data: [
                                highRisk,
                                mediumRisk,
                                lowRisk
                            ]
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            }
        );
    }


    // ==========================================
    // PREDICTION HISTORY
    // ==========================================

    const historyBody =
        document.getElementById("predictionHistory");

    const noHistory =
        document.getElementById("noHistory");


    if (historyBody) {

        historyBody.innerHTML = "";


        // ======================================
        // NO HISTORY
        // ======================================

        if (predictions.length === 0) {

            if (noHistory) {
                noHistory.style.display = "block";
            }

            historyBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="text-center text-muted py-4"
                    >
                        No predictions yet.
                    </td>
                </tr>
            `;

        }


        // ======================================
        // SHOW HISTORY
        // ======================================

        else {

            if (noHistory) {
                noHistory.style.display = "none";
            }


            predictions
                .slice()
                .reverse()
                .forEach(function (p, index) {


                    // ==========================
                    // DATE
                    // ==========================

                    let date = "-";

                    if (p.timestamp) {

                        const dateObject =
                            new Date(p.timestamp);

                        if (!isNaN(dateObject.getTime())) {

                            date =
                                dateObject.toLocaleString();
                        }
                    }


                    // ==========================
                    // PROBABILITY
                    // ==========================

                    let probability = "0.00";

                    if (
                        p.cancellation_probability !== undefined &&
                        p.cancellation_probability !== null
                    ) {

                        probability =
                            Number(
                                p.cancellation_probability
                            ).toFixed(2);
                    }


                    // ==========================
                    // PREDICTION LABEL
                    // ==========================

                    let predictionLabel =
                        p.prediction_label;

                    if (!predictionLabel) {

                        if (
                            Number(p.prediction) === 1
                        ) {

                            predictionLabel =
                                "Cancelled";

                        } else {

                            predictionLabel =
                                "Not Cancelled";
                        }
                    }


                    // ==========================
                    // RISK
                    // ==========================

                    const risk =
                        p.risk_level || "-";


                    // ==========================
                    // HOTEL
                    // ==========================

                    const hotel =
                        p.hotel || "-";


                    // ==========================
                    // LEAD TIME
                    // ==========================

                    const leadTime =
                        p.lead_time !== undefined &&
                        p.lead_time !== null
                            ? p.lead_time
                            : "-";


                    // ==========================
                    // BADGE CLASSES
                    // ==========================

                    let predictionClass =
                        "badge-not-cancelled";

                    if (
                        String(predictionLabel)
                            .toLowerCase()
                            .includes("cancelled") &&
                        !String(predictionLabel)
                            .toLowerCase()
                            .includes("not")
                    ) {

                        predictionClass =
                            "badge-cancelled";
                    }


                    let riskClass = "badge-low";

                    if (
                        String(risk)
                            .toLowerCase() === "high"
                    ) {

                        riskClass =
                            "badge-high";

                    } else if (
                        String(risk)
                            .toLowerCase() === "medium"
                    ) {

                        riskClass =
                            "badge-medium";
                    }


                    // ==========================
                    // CREATE ROW
                    // ==========================

                    historyBody.innerHTML += `

                        <tr>

                            <td>
                                ${predictions.length - index}
                            </td>

                            <td>
                                ${hotel}
                            </td>

                            <td>
                                ${leadTime}
                            </td>

                            <td>
                                <span class="badge ${predictionClass}">
                                    ${predictionLabel}
                                </span>
                            </td>

                            <td>
                                <strong>
                                    ${probability}%
                                </strong>
                            </td>

                            <td>
                                <span class="badge ${riskClass}">
                                    ${risk}
                                </span>
                            </td>

                            <td>
                                ${date}
                            </td>

                        </tr>

                    `;
                });
        }
    }


    // ==========================================
    // FINISHED
    // ==========================================

    console.log(
        "Dashboard loaded successfully."
    );

    console.log(
        "Total predictions:",
        predictions.length
    );

});


// ==========================================
// CLEAR HISTORY
// ==========================================

function clearHistory() {

    if (
        !confirm(
            "Are you sure you want to clear all prediction history?"
        )
    ) {
        return;
    }


    localStorage.removeItem(
        "hotelPredictions"
    );


    location.reload();
}