// 字符串相似度（Levenshtein）
export function stringSimilarity(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;

    const dp = Array(a.length + 1).fill(null).map(() =>
        Array(b.length + 1).fill(null)
    );

    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            );
        }
    }

    const distance = dp[a.length][b.length];
    return 1 - distance / Math.max(a.length, b.length);
}

// Canvas 相似度
export function compareCanvas(a, b) {
    return stringSimilarity(a, b);
}

// WebGL 相似度
export function compareWebGL(a, b) {
    return (
        stringSimilarity(a.vendor, b.vendor) * 0.5 +
        stringSimilarity(a.renderer, b.renderer) * 0.5
    );
}

// Audio 相似度（数值差异）
export function compareAudio(a, b) {
    if (a === b) return 1;
    const diff = Math.abs(a - b);
    return Math.max(0, 1 - diff / 100000); // 可调
}

// 字体相似度（Jaccard）
export function compareFonts(a, b) {
    const setA = new Set(a.split(','));
    const setB = new Set(b.split(','));

    const intersection = [...setA].filter(x => setB.has(x)).length;
    const union = new Set([...setA, ...setB]).size;

    return union === 0 ? 1 : intersection / union;
}

// 基础信息相似度
export function compareBasic(a, b) {
    let score = 0;
    const keys = ["userAgent", "language", "platform", "screen", "timezone"];
    keys.forEach(k => {
        if (a[k] === b[k]) score += 1;
    });
    return score / keys.length;
}

// 最终加权得分
export function computeTotalScore(scores) {
    return (
        scores.canvas * 0.25 +
        scores.webgl * 0.25 +
        scores.audio * 0.20 +
        scores.fonts * 0.15 +
        scores.basic * 0.15
    );
}
