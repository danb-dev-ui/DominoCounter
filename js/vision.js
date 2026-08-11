//
// Domino Counter
// Version 0.6.4
// Targeted Green Pip Detection
//
// Based on Version 0.6.2.
//
// The primary detector uses local contrast to find
// colored/dark pips against the white domino surface.
//
// Version 0.6.4 adds a narrowly targeted detector
// for the green pips used in this particular domino set.
//
// The green detector requires:
//   - strong green coloration
//   - reasonable pip brightness
//   - substantial WHITE DOMINO SURFACE surrounding it
//
// This prevents the green table from being treated
// as a pip.
//

const WHITE_SATURATION_MAX = 100;
const WHITE_BRIGHTNESS_MIN = 100;

const WHITE_WINDOW = 15;
const BRIGHTNESS_WINDOW = 21;

const MIN_WHITE_RATIO = 0.15;
const MIN_LOCAL_CONTRAST = 35;


/*
 * Green pip detection settings.
 *
 * These are intentionally much more restrictive
 * than a general color detector.
 */
const MIN_GREEN_SATURATION = 110;
const MIN_GREEN_BRIGHTNESS = 45;
const MAX_GREEN_BRIGHTNESS = 190;

const GREEN_CONTEXT_RADIUS = 25;
const GREEN_CENTER_RADIUS = 12;

const MIN_GREEN_WHITE_RING = 0.55;


/*
 * Pip size limits.
 */
const MIN_PIP_AREA = 20;
const MAX_PIP_AREA = 500;

const MIN_PIP_SIZE = 4;
const MAX_PIP_SIZE = 30;

const MAX_PIP_ASPECT_RATIO = 2.2;


/*
 * Convert RGB into perceived brightness.
 */
function getBrightness(r, g, b) {

    return (
        0.299 * r +
        0.587 * g +
        0.114 * b
    );

}


/*
 * Calculate saturation.
 */
function getSaturation(r, g, b) {

    const max =
        Math.max(r, g, b);

    const min =
        Math.min(r, g, b);

    if (max === 0) {

        return 0;

    }

    return (
        (max - min) /
        max
    ) * 255;

}


/*
 * Build grayscale and white masks.
 */
function buildImageData(
    data,
    width,
    height
) {

    const pixelCount =
        width * height;

    const gray =
        new Uint8Array(
            pixelCount
        );

    const whiteMask =
        new Uint8Array(
            pixelCount
        );


    for (
        let i = 0, p = 0;
        i < pixelCount;
        i++, p += 4
    ) {

        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];


        const brightness =
            getBrightness(
                r,
                g,
                b
            );


        const saturation =
            getSaturation(
                r,
                g,
                b
            );


        gray[i] =
            Math.round(
                brightness
            );


        /*
         * White domino surfaces generally have:
         *
         * - relatively high brightness
         * - relatively low saturation
         */
        if (
            brightness >=
                WHITE_BRIGHTNESS_MIN &&

            saturation <=
                WHITE_SATURATION_MAX
        ) {

            whiteMask[i] = 1;

        }

    }


    return {
        gray,
        whiteMask
    };

}


/*
 * Build an integral image.
 *
 * Integral images allow us to calculate
 * local averages efficiently.
 */
function buildIntegralImage(
    values,
    width,
    height
) {

    const stride =
        width + 1;


    const integral =
        new Float64Array(
            stride *
            (height + 1)
        );


    for (
        let y = 1;
        y <= height;
        y++
    ) {

        let rowSum = 0;


        for (
            let x = 1;
            x <= width;
            x++
        ) {

            const sourceIndex =
                (y - 1) *
                width +
                (x - 1);


            rowSum +=
                values[
                    sourceIndex
                ];


            const index =
                y * stride +
                x;


            integral[index] =
                integral[
                    index - stride
                ] +
                rowSum;

        }

    }


    return integral;

}


/*
 * Get an average value from an integral image.
 */
function getAverage(
    integral,
    width,
    height,
    x1,
    y1,
    x2,
    y2
) {

    x1 =
        Math.max(
            0,
            x1
        );

    y1 =
        Math.max(
            0,
            y1
        );

    x2 =
        Math.min(
            width - 1,
            x2
        );

    y2 =
        Math.min(
            height - 1,
            y2
        );


    const stride =
        width + 1;


    const a =
        y1 * stride +
        x1;

    const b =
        y1 * stride +
        (x2 + 1);

    const c =
        (y2 + 1) * stride +
        x1;

    const d =
        (y2 + 1) * stride +
        (x2 + 1);


    const sum =
        integral[d] -
        integral[b] -
        integral[c] +
        integral[a];


    const area =
        (x2 - x1 + 1) *
        (y2 - y1 + 1);


    return sum / area;

}


/*
 * Calculate the amount of white domino surface
 * surrounding a possible green pip.
 *
 * We use a large outer area and remove the
 * center area so the green pip itself does not
 * count against the surrounding-white measurement.
 */
function getWhiteRingRatio(
    whiteIntegral,
    width,
    height,
    x,
    y
) {

    const outer =
        GREEN_CONTEXT_RADIUS;

    const inner =
        GREEN_CENTER_RADIUS;


    const outerX1 =
        Math.max(
            0,
            x - outer
        );

    const outerY1 =
        Math.max(
            0,
            y - outer
        );

    const outerX2 =
        Math.min(
            width - 1,
            x + outer
        );

    const outerY2 =
        Math.min(
            height - 1,
            y + outer
        );


    const outerArea =
        (
            outerX2 -
            outerX1 +
            1
        ) *
        (
            outerY2 -
            outerY1 +
            1
        );


    const outerAverage =
        getAverage(
            whiteIntegral,
            width,
            height,
            outerX1,
            outerY1,
            outerX2,
            outerY2
        );


    /*
     * Convert average back into an approximate
     * white-pixel count.
     */
    const outerWhite =
        outerAverage *
        outerArea;


    const innerX1 =
        Math.max(
            0,
            x - inner
        );

    const innerY1 =
        Math.max(
            0,
            y - inner
        );

    const innerX2 =
        Math.min(
            width - 1,
            x + inner
        );

    const innerY2 =
        Math.min(
            height - 1,
            y + inner
        );


    const innerArea =
        (
            innerX2 -
            innerX1 +
            1
        ) *
        (
            innerY2 -
            innerY1 +
            1
        );


    const innerAverage =
        getAverage(
            whiteIntegral,
            width,
            height,
            innerX1,
            innerY1,
            innerX2,
            innerY2
        );


    const innerWhite =
        innerAverage *
        innerArea;


    const ringArea =
        outerArea -
        innerArea;


    if (ringArea <= 0) {

        return 0;

    }


    return (
        outerWhite -
        innerWhite
    ) / ringArea;

}


/*
 * Build a mask containing likely pip pixels.
 */
function buildPipCandidateMask(
    data,
    gray,
    whiteIntegral,
    grayIntegral,
    width,
    height
) {

    const mask =
        new Uint8Array(
            width * height
        );


    const whiteRadius =
        Math.floor(
            WHITE_WINDOW / 2
        );


    const brightnessRadius =
        Math.floor(
            BRIGHTNESS_WINDOW / 2
        );


    for (
        let y = 0;
        y < height;
        y++
    ) {

        for (
            let x = 0;
            x < width;
            x++
        ) {

            const index =
                y * width +
                x;


            /*
             * The original 0.6.2 test:
             *
             * Is this pixel near enough to
             * white domino surface?
             */
            const whiteRatio =
                getAverage(
                    whiteIntegral,
                    width,
                    height,
                    x - whiteRadius,
                    y - whiteRadius,
                    x + whiteRadius,
                    y + whiteRadius
                );


            /*
             * If the immediate neighborhood has
             * no white domino surface, skip it.
             */
            if (
                whiteRatio <
                MIN_WHITE_RATIO
            ) {

                /*
                 * We still allow the specialized
                 * green detector to examine this
                 * pixel below.
                 */

            }


            const p =
                index * 4;


            const r =
                data[p];

            const g =
                data[p + 1];

            const b =
                data[p + 2];


            const brightness =
                gray[index];


            const saturation =
                getSaturation(
                    r,
                    g,
                    b
                );


            /*
             * ------------------------------------------------
             * DETECTOR #1
             * Original local-contrast detector
             * ------------------------------------------------
             */

            const localBrightness =
                getAverage(
                    grayIntegral,
                    width,
                    height,
                    x - brightnessRadius,
                    y - brightnessRadius,
                    x + brightnessRadius,
                    y + brightnessRadius
                );


            const contrast =
                localBrightness -
                brightness;


            const contrastMatch =
                whiteRatio >=
                    MIN_WHITE_RATIO &&

                contrast >=
                    MIN_LOCAL_CONTRAST;


            /*
             * ------------------------------------------------
             * DETECTOR #2
             * Targeted green-pip detector
             * ------------------------------------------------
             *
             * Green pips in this domino set are:
             *
             * - strongly green
             * - moderately/darkly bright
             * - surrounded by white domino
             *
             * The green table is also green, but it does
             * NOT have the large white ring around it.
             */


            const stronglyGreen =
                saturation >=
                    MIN_GREEN_SATURATION &&

                g > r * 1.20 &&

                g > b * 1.20;


            const reasonableGreenBrightness =
                brightness >=
                    MIN_GREEN_BRIGHTNESS &&

                brightness <=
                    MAX_GREEN_BRIGHTNESS;


            let greenPipMatch = false;


            if (
                stronglyGreen &&
                reasonableGreenBrightness
            ) {

                const whiteRingRatio =
                    getWhiteRingRatio(
                        whiteIntegral,
                        width,
                        height,
                        x,
                        y
                    );


                greenPipMatch =
                    whiteRingRatio >=
                    MIN_GREEN_WHITE_RING;

            }


            /*
             * A pixel belongs to a pip if either:
             *
             * 1. It passes the original contrast test
             *
             * OR
             *
             * 2. It is a strongly green pip surrounded
             *    by white domino surface.
             */

            if (
                contrastMatch ||
                greenPipMatch
            ) {

                mask[index] = 1;

            }

        }

    }


    return mask;

}


/*
 * Find connected components in the pip mask.
 */
function findConnectedComponents(
    mask,
    width,
    height
) {

    const visited =
        new Uint8Array(
            mask.length
        );


    const components = [];


    const queueX =
        new Int32Array(
            mask.length
        );

    const queueY =
        new Int32Array(
            mask.length
        );


    const directions = [

        [-1, -1],
        [0, -1],
        [1, -1],

        [-1, 0],
        [1, 0],

        [-1, 1],
        [0, 1],
        [1, 1]

    ];


    for (
        let y = 0;
        y < height;
        y++
    ) {

        for (
            let x = 0;
            x < width;
            x++
        ) {

            const startIndex =
                y * width +
                x;


            if (
                !mask[startIndex] ||
                visited[startIndex]
            ) {

                continue;

            }


            let head = 0;
            let tail = 0;


            queueX[tail] =
                x;

            queueY[tail] =
                y;

            tail++;


            visited[startIndex] =
                1;


            let area = 0;

            let sumX = 0;
            let sumY = 0;

            let minX = x;
            let maxX = x;

            let minY = y;
            let maxY = y;


            while (
                head < tail
            ) {

                const currentX =
                    queueX[head];

                const currentY =
                    queueY[head];

                head++;


                area++;

                sumX +=
                    currentX;

                sumY +=
                    currentY;


                minX =
                    Math.min(
                        minX,
                        currentX
                    );

                maxX =
                    Math.max(
                        maxX,
                        currentX
                    );

                minY =
                    Math.min(
                        minY,
                        currentY
                    );

                maxY =
                    Math.max(
                        maxY,
                        currentY
                    );


                for (
                    const direction
                    of directions
                ) {

                    const nextX =
                        currentX +
                        direction[0];

                    const nextY =
                        currentY +
                        direction[1];


                    if (
                        nextX < 0 ||
                        nextX >= width ||
                        nextY < 0 ||
                        nextY >= height
                    ) {

                        continue;

                    }


                    const nextIndex =
                        nextY * width +
                        nextX;


                    if (
                        mask[nextIndex] &&
                        !visited[nextIndex]
                    ) {

                        visited[nextIndex] =
                            1;


                        queueX[tail] =
                            nextX;

                        queueY[tail] =
                            nextY;

                        tail++;

                    }

                }

            }


            const componentWidth =
                maxX -
                minX +
                1;


            const componentHeight =
                maxY -
                minY +
                1;


            const aspectRatio =
                Math.max(
                    componentWidth,
                    componentHeight
                ) /
                Math.min(
                    componentWidth,
                    componentHeight
                );


            /*
             * Keep only components that resemble
             * individual round pips.
             *
             * The long black center line fails
             * this test.
             */
            if (

                area >=
                    MIN_PIP_AREA &&

                area <=
                    MAX_PIP_AREA &&

                componentWidth >=
                    MIN_PIP_SIZE &&

                componentWidth <=
                    MAX_PIP_SIZE &&

                componentHeight >=
                    MIN_PIP_SIZE &&

                componentHeight <=
                    MAX_PIP_SIZE &&

                aspectRatio <=
                    MAX_PIP_ASPECT_RATIO

            ) {

                components.push({

                    area,

                    x:
                        sumX / area,

                    y:
                        sumY / area,

                    width:
                        componentWidth,

                    height:
                        componentHeight

                });

            }

        }

    }


    return components;

}


/*
 * Main image-analysis function.
 */
export function analyzeImage(canvas) {

    const ctx =
        canvas.getContext(
            "2d",
            {
                willReadFrequently:
                    true
            }
        );


    const width =
        canvas.width;

    const height =
        canvas.height;


    const image =
        ctx.getImageData(
            0,
            0,
            width,
            height
        );


    const data =
        image.data;


    /*
     * Build grayscale and white information.
     */
    const {
        gray,
        whiteMask
    } =
        buildImageData(
            data,
            width,
            height
        );


    /*
     * Build integral images.
     */
    const whiteIntegral =
        buildIntegralImage(
            whiteMask,
            width,
            height
        );


    const grayIntegral =
        buildIntegralImage(
            gray,
            width,
            height
        );


    /*
     * Find candidate pip pixels.
     */
    const candidateMask =
        buildPipCandidateMask(
            data,
            gray,
            whiteIntegral,
            grayIntegral,
            width,
            height
        );


    /*
     * Convert connected pixels into
     * individual pip objects.
     */
    const pips =
        findConnectedComponents(
            candidateMask,
            width,
            height
        );


    /*
     * Draw diagnostic circles around
     * every detected pip.
     */
    ctx.save();

    ctx.strokeStyle =
        "red";

    ctx.lineWidth =
        3;


    for (
        const pip of pips
    ) {

        const radius =
            Math.max(
                6,
                Math.min(
                    12,
                    Math.max(
                        pip.width,
                        pip.height
                    ) / 2 + 2
                )
            );


        ctx.beginPath();


        ctx.arc(
            pip.x,
            pip.y,
            radius,
            0,
            Math.PI * 2
        );


        ctx.stroke();

    }


    ctx.restore();


    console.log(
        `Domino Counter: detected ${pips.length} pips`
    );


    return {

        pipCount:
            pips.length,

        score:
            pips.length,

        pips

    };

}