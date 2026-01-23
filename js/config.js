// author: sjxxxx
window.GAME_CONFIG = {
    AI_PROVIDER: 'modelscope',
    API_KEY: typeof process !== 'undefined' && process.env.MODELSCOPE_KEY 
        ? process.env.MODELSCOPE_KEY 
        : (typeof window !== 'undefined' && window.__MODELSCOPE_KEY__ 
            ? window.__MODELSCOPE_KEY__ 
            : ''),
    API_ENDPOINT: 'https://api-inference.modelscope.cn/v1/chat/completions',
    AI_MODEL: 'deepseek-ai/DeepSeek-V3.2'
};