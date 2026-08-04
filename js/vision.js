export function analyzeImage(canvas) {

    const ctx = canvas.getContext("2d");

    const image = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const pixels = image.data;

    let brightPixels = 0;

    for (let i = 0; i < pixels.length; i += 4) {

        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        const brightness = (r + g + b) / 3;

        if (brightness > 200) {

            brightPixels++;

            pixels[i] = 255;
            pixels[i + 1] = 0;
            pixels[i + 2] = 0;

        }

    }

    ctx.putImageData(image, 0, 0);

    return brightPixels;

}