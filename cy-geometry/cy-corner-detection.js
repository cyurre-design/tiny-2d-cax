export function detectCornersShiTomasi(ctx, x0, y0, w, h, options = {}) {
    const { windowSize = 5, threshold = 10000, nmsRadius = 4 } = options;

    const imageData = ctx.getImageData(x0, y0, w, h);
    const { data } = imageData;

    const width = w;
    const height = h;

    // ---------------------------
    // 1️⃣ Grayscale
    // ---------------------------
    const gray = new Float32Array(width * height);

    for (let i = 0; i < width * height; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        //test...gray[i] = 0;
        gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // ---------------------------
    // 2️⃣ Sobel Gradients
    // ---------------------------
    const Ix = new Float32Array(width * height);
    const Iy = new Float32Array(width * height);

    const sobelX = [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1],
    ];

    const sobelY = [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1],
    ];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let gx = 0;
            let gy = 0;

            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const val = gray[(y + ky) * width + (x + kx)];
                    gx += val * sobelX[ky + 1][kx + 1];
                    gy += val * sobelY[ky + 1][kx + 1];
                }
            }

            const idx = y * width + x;
            Ix[idx] = gx;
            Iy[idx] = gy;
        }
    }

    // ---------------------------
    // 3️⃣ Shi-Tomasi score
    // ---------------------------
    const half = Math.floor(windowSize / 2);
    const R = new Float32Array(width * height);

    let maxResponse = 0;

    for (let y = half; y < height - half; y++) {
        for (let x = half; x < width - half; x++) {
            let Sxx = 0;
            let Syy = 0;
            let Sxy = 0;

            for (let wy = -half; wy <= half; wy++) {
                for (let wx = -half; wx <= half; wx++) {
                    const idx = (y + wy) * width + (x + wx);
                    const ix = Ix[idx];
                    const iy = Iy[idx];

                    Sxx += ix * ix;
                    Syy += iy * iy;
                    Sxy += ix * iy;
                }
            }

            const trace = Sxx + Syy;
            const det = Sxx * Syy - Sxy * Sxy;

            const sqrtTerm = Math.sqrt(Math.max(0, trace * trace - 4 * det));

            const lambda1 = (trace + sqrtTerm) / 2;
            const lambda2 = (trace - sqrtTerm) / 2;

            const score = Math.min(lambda1, lambda2);

            const idxCenter = y * width + x;
            R[idxCenter] = score;

            if (score > maxResponse) maxResponse = score;
        }
    }

    // ---------------------------
    // 4️⃣ Threshold relativo
    // ---------------------------
    //const threshold = maxResponse * kThreshold;
    //absoluto y pasado como parámetro
    // ---------------------------
    // 5️⃣ Non-Maximum Suppression
    // ---------------------------
    const corners = [];

    for (let y = nmsRadius; y < height - nmsRadius; y++) {
        for (let x = nmsRadius; x < width - nmsRadius; x++) {
            const idx = y * width + x;
            const value = R[idx];

            if (value <= threshold) continue;

            let isMax = true;

            for (let ny = -nmsRadius; ny <= nmsRadius && isMax; ny++) {
                for (let nx = -nmsRadius; nx <= nmsRadius; nx++) {
                    if (nx === 0 && ny === 0) continue;

                    const neighbor = R[(y + ny) * width + (x + nx)];

                    if (neighbor > value) {
                        isMax = false;
                        break;
                    }
                }
            }

            if (isMax) {
                corners.push({
                    x: x + x0,
                    y: y + y0,
                    score: value,
                });
            }
        }
    }

    return corners;
}
