let stream = null;

export async function openCamera(videoElement) {

    stream = await navigator.mediaDevices.getUserMedia({

        video: {
            facingMode: "environment"
        },

        audio: false

    });

    videoElement.srcObject = stream;

    await videoElement.play();

}

export function stopCamera() {

    if (!stream) return;

    stream.getTracks().forEach(track => track.stop());

}

export function captureFrame(video, canvas) {

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0);

}