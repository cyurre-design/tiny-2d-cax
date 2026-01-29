/**
 * Calcula las líneas tangentes comunes entre dos círculos.
 * @param {number} x1 Coordenada X del centro del primer círculo.
 * @param {number} y1 Coordenada Y del centro del primer círculo.
 * @param {number} r1 Radio del primer círculo.
 * @param {number} x2 Coordenada X del centro del segundo círculo.
 * @param {number} y2 Coordenada Y del centro del segundo círculo.
 * @param {number} r2 Radio del segundo círculo.
 * @returns {Array<Object>} Un array de objetos que representan las líneas tangentes ({a, b, c}).
 */
export function commonTangentLines(x1, y1, r1, x2, y2, r2) {
    const results = [];

    // Calcula delta1 para tangentes externas y delta2 para tangentes internas
    // Se usa el teorema de Pitágoras y la distancia entre centros
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distSq = dx * dx + dy * dy;

    // Caso para tangentes externas (suma de radios)
    const delta1 = distSq - (r1 + r2) * (r1 + r2);
    // Caso para tangentes internas (diferencia de radios)
    const delta2 = distSq - (r1 - r2) * (r1 - r2);

    const p1 = r1 * (x1 * x2 + y1 * y2 - x2 * x2 - y2 * y2);
    const p2 = r2 * (x1 * x1 + y1 * y1 - x1 * x2 - y1 * y2);
    const q = x1 * y2 - x2 * y1;

    // Función auxiliar para añadir líneas al resultado
    function addLine(a, b, c) {
        // Normalizar la línea para evitar coeficientes minúsculos o gigantes
        const invMag = 1 / Math.sqrt(a * a + b * b);
        results.push({ a: a * invMag, b: b * invMag, c: c * invMag });
    }

    if (delta1 >= 0) {
        const sqrtDelta1 = Math.sqrt(delta1);
        // Dos tangentes externas
        addLine((x2 - x1) * (r1 + r2) + (y1 - y2) * sqrtDelta1, (y2 - y1) * (r1 + r2) + (x2 - x1) * sqrtDelta1, p1 + p2 + q * sqrtDelta1);
        addLine((x2 - x1) * (r1 + r2) - (y1 - y2) * sqrtDelta1, (y2 - y1) * (r1 + r2) - (x2 - x1) * sqrtDelta1, p1 + p2 - q * sqrtDelta1);
    }

    if (delta2 >= 0) {
        const sqrtDelta2 = Math.sqrt(delta2);
        // Dos tangentes internas
        addLine((x2 - x1) * (r1 - r2) + (y1 - y2) * sqrtDelta2, (y2 - y1) * (r1 - r2) + (x2 - x1) * sqrtDelta2, p1 - p2 + q * sqrtDelta2);
        addLine((x2 - x1) * (r1 - r2) - (y1 - y2) * sqrtDelta2, (y2 - y1) * (r1 - r2) + (x2 - x1) * sqrtDelta2, p1 - p2 - q * sqrtDelta2);
    }

    return results;
}
