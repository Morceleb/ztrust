/**
 * 指纹相似度计算工具
 */

/**
 * 计算两个指纹的相似度
 * @param {string} fp1 - 指纹1
 * @param {string} fp2 - 指纹2
 * @returns {number} 相似度 (0-1)
 */
export function calculateFingerprintSimilarity(fp1, fp2) {
    if (!fp1 || !fp2) return 0;
    if (fp1 === fp2) return 1;

    // 使用 Jaccard 相似系数
    const set1 = new Set(fp1.split(''));
    const set2 = new Set(fp2.split(''));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
}

/**
 * 计算编辑距离相似度
 * @param {string} str1
 * @param {string} str2
 * @returns {number} 相似度 (0-1)
 */
export function levenshteinSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

    const len1 = str1.length;
    const len2 = str2.length;

    // 创建 DP 表
    const dp = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

    // 初始化
    for (let i = 0; i <= len1; i++) dp[i][0] = i;
    for (let j = 0; j <= len2; j++) dp[0][j] = j;

    // 填充表
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],     // 删除
                    dp[i][j - 1],     // 插入
                    dp[i - 1][j - 1]  // 替换
                );
            }
        }
    }

    const distance = dp[len1][len2];
    const maxLen = Math.max(len1, len2);

    return 1 - (distance / maxLen);
}

/**
 * 计算余弦相似度
 * @param {number[]} vec1
 * @param {number[]} vec2
 * @returns {number}
 */
export function cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

export default {
    calculateFingerprintSimilarity,
    levenshteinSimilarity,
    cosineSimilarity,
};
