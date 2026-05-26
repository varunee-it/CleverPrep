// ================= CHUNK TEXT =================

export const chunkText = (text, chunkSize = 500, overlap = 50) => {
    if (!text || text.length === 0) return [];

    const cleanedText = text
        .replace(/\s+/g, ' ')
        .replace(/\r\n/g, '\n')
        .trim();

    const paragraphs = cleanedText
        .split(/\n+/)
        .filter(p => p.trim().length > 0);

    const chunks = [];
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
        const words = paragraph.split(/\s+/);

        for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
            const chunkWords = words.slice(i, i + chunkSize);

            chunks.push({
                content: chunkWords.join(' '),
                chunkIndex: chunkIndex++,
                pageNumber: 1
            });

            if (i + chunkSize >= words.length) break;
        }
    }

    return chunks;
};



// ================= FIND RELEVANT CHUNKS =================

export const findRelevantChunks = (chunks, query, maxChunks = 3) => {
    if (!chunks || chunks.length === 0 || !query) return [];

    const stopWords = new Set([
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or',
        'but', 'in', 'with', 'to', 'for', 'as', 'of', 'by',
        'this', 'that', 'it'
    ]);

    const queryWords = query
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));

    if (queryWords.length === 0) {
        return chunks.slice(0, maxChunks);
    }

    const scoredChunks = chunks.map((chunk, index) => {
        const content = chunk.content.toLowerCase();
        let score = 0;

        for (const word of queryWords) {
            const exactMatches = (content.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
            score += exactMatches * 3;

            const partialMatches = (content.match(new RegExp(word, 'g')) || []).length;
            score += Math.max(0, partialMatches - exactMatches) * 1.5;
        }

        const uniqueWordsFound = queryWords.filter(word =>
            content.includes(word)
        ).length;

        score += uniqueWordsFound * 2;

        const normalizedScore = score / Math.sqrt(content.split(/\s+/).length);
        const positionBonus = 1 - (index / chunks.length) * 0.1;

        return {
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber,
            score: normalizedScore * positionBonus,
            matchedWords: uniqueWordsFound
        };
    });

    return scoredChunks
        .filter(chunk => chunk.matchedWords > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxChunks);
};