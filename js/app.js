import {
    openCamera,
    stopCamera,
    captureFrame
} from "./camera.js";

import {
    analyzeImage
} from "./vision.js";

import {
    setStatus,
    showScore
} from "./ui.js";


const scanButton =
    document.getElementById("scanButton");

const captureButton =
    document.getElementById("captureButton");

const canvas =
    document.getElementById("snapshot");


let video = null;

let cameraStream = null;


/*
 * Start camera.
 */
scanButton.onclick = async () => {

    try {

        if (!video) {

            video =
                document.createElement(
                    "video"
                );

            video.id =
                "camera";

            video.autoplay =
                true;

            video.playsInline =
                true;


            document
                .querySelector(".app")
                .insertBefore(
                    video,
                    captureButton
                );

        }


        canvas.style.display =
            "none";

        video.style.display =
            "block";


        setStatus(
            "Starting camera..."
        );


        cameraStream =
            await openCamera(
                video
            );


        captureButton.style.display =
            "block";

        scanButton.style.display =
            "none";


        setStatus(
            "Point the camera at the dominoes, then tap Capture."
        );

    }

    catch (error) {

        console.error(
            "Camera error:",
            error
        );


        setStatus(
            "Unable to start the camera."
        );

    }

};


/*
 * Capture and analyze.
 */
captureButton.onclick = () => {

    if (!video) {

        return;

    }


    /*
     * Capture current camera frame.
     */
    captureFrame(
        video,
        canvas
    );


    /*
     * Stop camera.
     */
    stopCamera(
        cameraStream
    );


    cameraStream =
        null;


    video.style.display =
        "none";

    canvas.style.display =
        "block";


    setStatus(
        "Analyzing dominoes..."
    );


    /*
     * Run the same detector used
     * by test.html.
     */
    try {

        const result =
            analyzeImage(
                canvas
            );


        showScore(
            result.score,
            result.pipCount
        );


        setStatus(
            "Scan complete."
        );

    }

    catch (error) {

        console.error(
            "Analysis error:",
            error
        );


        setStatus(
            "Unable to analyze the image."
        );

    }


    /*
     * Prepare for another scan.
     */
    captureButton.textContent =
        "Scan Another Hand";


    captureButton.onclick =
        () => {

            location.reload();

        };

};