export function setStatus(message) {

    const status =
        document.getElementById(
            "status"
        );


    if (!status) {

        return;

    }


    status.textContent =
        message;

}


export function showScore(
    score,
    pipCount = score
) {

    const result =
        document.getElementById(
            "result"
        );


    if (!result) {

        return;

    }


    result.style.display =
        "block";


    result.innerHTML = `

        <div class="score-number">
            ${score}
        </div>

        <div class="score-label">
            Points
        </div>

        <div class="detection-info">
            ${pipCount} pips detected
        </div>

    `;

}