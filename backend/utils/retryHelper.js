export const withRetry = async (fn, maxRetries, retryDelays, onRetry, timeoutMs = 60000) => {
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('API_TIMEOUT')), timeoutMs);
            });
            return await Promise.race([fn(), timeoutPromise]);
        } catch (error) {
            attempt++;
            if (attempt > maxRetries) {
                throw error;
            }
            if (onRetry) {
                await onRetry(attempt, maxRetries, error);
            }
            const delay = retryDelays[attempt - 1] || 1000;
            await new Promise(res => setTimeout(res, delay));
        }
    }
};

export const getErrorCode = (error, defaultCode = 'UNKNOWN_ERROR') => {
    if (error.message === 'API_TIMEOUT') return 'API_TIMEOUT';
    if (error.status === 429 || error?.response?.status === 429 || error.message?.includes('429')) return 'API_RATE_LIMIT';
    if (error.message?.toLowerCase().includes('database') || error.name === 'MongoError') return 'DATABASE_ERROR';
    if (error.message?.toLowerCase().includes('pdf') || error.message?.toLowerCase().includes('document')) return 'PDF_PARSE_ERROR';
    if (error.message?.toLowerCase().includes('tts') || error.message?.toLowerCase().includes('audio') || error.message?.toLowerCase().includes('ffmpeg')) return 'TTS_ERROR';
    if (error.message?.toLowerCase().includes('gemini') || error.message?.toLowerCase().includes('model') || error.message?.toLowerCase().includes('google')) return 'GEMINI_ERROR';
    return defaultCode;
};
