import {
    openCamera,
    stopCamera,
    captureFrame
} from "./camera.js";

import {
    setStatus
} from "./ui.js";

const scanButton = document.getElementById("scanButton");
const captureButton = document.getElementById("captureButton");
const canvas = document.getElementById("snapshot");

let video = null;

function resetApplication() {

    canvas.style.display = "none";

    captureButton.style.display = "none";
    captureButton.textContent = "Capture";

    scanButton.style.display = "block";

    setStatus("");

}

scanButton.onclick = async () => {

    if (!video) {

        video = document.createElement("video");

        video.id = "camera";
        video.autoplay = true;
        video.playsInline = true;

        document
            .querySelector(".app")
            .insertBefore(video, captureButton);

    }

    canvas.style.display = "none";
    video.style.display = "block";

    await openCamera(video);

    captureButton.style.display = "block";
    scanButton.style.display = "none";

    setStatus("Tap Capture when ready.");

};

captureButton.onclick = () => {

    if (captureButton.textContent === "Scan Another Hand") {

        resetApplication();

        return;

    }

    captureFrame(video, canvas);

    stopCamera();

    video.style.display = "none";
    canvas.style.display = "block";

    captureButton.textContent = "Scan Another Hand";

    setStatus("Image captured.");

};