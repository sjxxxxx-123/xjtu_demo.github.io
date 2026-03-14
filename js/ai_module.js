// author: sjxxxx
/**
 * AI API 接入模块 - 鲜椒本科模拟器
 * 处理与 LLM (Gemini/OpenAI) 的交互，生成动态随机事件
 */

const AIModule = (function() {
    // API 配置
    const DEFAULT_API_KEY = '';
    const DEFAULT_API_ENDPOINT = 'https://api-inference.modelscope.cn/v1/chat/completions';
    const REQUEST_TIMEOUT_BASE_MS = 35000;
    const REQUEST_TIMEOUT_MAX_MS = 90000;
    let API_KEY = DEFAULT_API_KEY;
    let API_PROVIDER = 'modelscope'; // 强制使用 modelscope
    let API_ENDPOINT = DEFAULT_API_ENDPOINT; // ModelScope API Inference
    
    // 多模型配置列表
    const AVAILABLE_MODELS = [
        'deepseek-ai/DeepSeek-V3.2',
        'inclusionAI/Ling-2.5-IT',
        'inclusionAI/Ring-2.5-IT',
        'MiniMax/MiniMax-M2.5',
        'THUDM/GLM-5',
        'THUDM/GLM-4.7-Flash',
        'Qwen/Qwen2.5-72B-Instruct',
        'Qwen/Qwen2.5-32B-Instruct',
        'Qwen/Qwen2.5-14B-Instruct',
        'Qwen/Qwen3-14B',
        'Qwen/QwQ-32B',
        'Qwen/Qwen3-32B',
        'ZhipuAI/GLM-4.7-Flash'
    ];
    
    let currentModelIndex = 0;
    let API_MODEL = AVAILABLE_MODELS[currentModelIndex];
    
    // 模型失败记录（避免频繁重试同一个失败的模型）
    const modelFailureTime = {};
    const modelBlockedUntil = {};
    const permanentlyUnsupportedModels = new Set();
    const MODEL_STATS_KEY = 'xjtu_ai_model_stats';
    const MODEL_FILTERS_KEY = 'xjtu_ai_model_filters';
    const MAX_ATTEMPTS_PER_REQUEST = 6;
    const RATE_LIMIT_COOLDOWN_MS = 10 * 60 * 1000;
    const DAILY_QUOTA_COOLDOWN_MS = 24 * 60 * 60 * 1000;
    const modelStats = {};
    let endingBiographyInFlight = null;

    function loadModelStats() {
        try {
            const raw = localStorage.getItem(MODEL_STATS_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                Object.assign(modelStats, parsed);
            }
        } catch (e) {
            console.warn('读取模型性能统计失败，已忽略:', e);
        }
    }

    function saveModelStats() {
        try {
            localStorage.setItem(MODEL_STATS_KEY, JSON.stringify(modelStats));
        } catch (e) {
            console.warn('保存模型性能统计失败，已忽略:', e);
        }
    }

    function loadModelFilters() {
        try {
            const raw = localStorage.getItem(MODEL_FILTERS_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return;

            if (parsed.modelBlockedUntil && typeof parsed.modelBlockedUntil === 'object') {
                Object.assign(modelBlockedUntil, parsed.modelBlockedUntil);
            }

            if (Array.isArray(parsed.permanentlyUnsupportedModels)) {
                parsed.permanentlyUnsupportedModels.forEach((model) => permanentlyUnsupportedModels.add(model));
            }
        } catch (e) {
            console.warn('读取模型过滤状态失败，已忽略:', e);
        }
    }

    function saveModelFilters() {
        try {
            localStorage.setItem(MODEL_FILTERS_KEY, JSON.stringify({
                modelBlockedUntil,
                permanentlyUnsupportedModels: Array.from(permanentlyUnsupportedModels)
            }));
        } catch (e) {
            console.warn('保存模型过滤状态失败，已忽略:', e);
        }
    }

    function getNowMs() {
        return (typeof performance !== 'undefined' && performance.now)
            ? performance.now()
            : Date.now();
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function normalizeApiKey(rawKey) {
        const text = String(rawKey || '').trim();
        if (!text) return '';

        return text
            .replace(/^['"]+|['"]+$/g, '')
            .replace(/^bearer\s+/i, '')
            .trim();
    }

    function normalizeApiEndpoint(rawEndpoint) {
        let endpoint = String(rawEndpoint || '').trim();
        if (!endpoint) return DEFAULT_API_ENDPOINT;

        endpoint = endpoint.replace(/\s+/g, '').replace(/\/+$/, '');
        if (/\/v1\/chat\/completions$/i.test(endpoint)) return endpoint;
        if (/\/chat\/completions$/i.test(endpoint)) return endpoint;
        if (/\/v1$/i.test(endpoint)) return `${endpoint}/chat/completions`;
        if (/^https?:\/\/[^/]+$/i.test(endpoint)) return `${endpoint}/v1/chat/completions`;
        return endpoint;
    }

    function createTaggedError(message, code, status) {
        const error = new Error(message);
        if (code) error.code = code;
        if (typeof status === 'number') error.status = status;
        return error;
    }

    async function fetchWithTimeout(url, options, timeoutMs) {
        if (typeof AbortController === 'undefined' || !timeoutMs || timeoutMs <= 0) {
            return await fetch(url, options);
        }

        const controller = new AbortController();
        const timerId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            return await fetch(url, { ...options, signal: controller.signal });
        } catch (error) {
            if (error && error.name === 'AbortError') {
                throw createTaggedError(`请求超时（>${Math.round(timeoutMs / 1000)}秒）`, 'REQUEST_TIMEOUT');
            }
            throw error;
        } finally {
            clearTimeout(timerId);
        }
    }

    function isRequestTimeoutError(error) {
        return !!error && (error.code === 'REQUEST_TIMEOUT' || error.name === 'AbortError');
    }

    function recordModelLatency(model, latencyMs, success = true) {
        if (!model || typeof latencyMs !== 'number' || !Number.isFinite(latencyMs)) return;

        const prev = modelStats[model] || { avgLatency: latencyMs, count: 0, failCount: 0 };
        const nextCount = (prev.count || 0) + (success ? 1 : 0);
        const nextAvg = success
            ? (((prev.avgLatency || latencyMs) * (prev.count || 0) + latencyMs) / Math.max(1, nextCount))
            : (prev.avgLatency || latencyMs);

        modelStats[model] = {
            avgLatency: Math.round(nextAvg),
            count: nextCount,
            failCount: (prev.failCount || 0) + (success ? 0 : 1),
            lastLatency: Math.round(latencyMs),
            updatedAt: Date.now()
        };

        saveModelStats();
    }

    function getModelScore(model) {
        const stats = modelStats[model];
        const baseLatency = stats && typeof stats.avgLatency === 'number' ? stats.avgLatency : 2000;
        const sampleBonus = stats && stats.count ? Math.max(0, 300 - stats.count * 10) : 400;
        const failPenalty = stats && stats.failCount ? Math.min(1500, stats.failCount * 120) : 0;
        return baseLatency + sampleBonus + failPenalty;
    }

    function getRankedModels(excludedModels) {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const excludedSet = excludedModels instanceof Set ? excludedModels : new Set();

        const candidates = AVAILABLE_MODELS.filter((model) => {
            if (excludedSet.has(model)) return false;
            if (permanentlyUnsupportedModels.has(model)) return false;
            if (modelBlockedUntil[model] && now < modelBlockedUntil[model]) return false;
            return true;
        });
        candidates.sort((a, b) => {
            const aInCooldown = modelFailureTime[a] && (now - modelFailureTime[a]) <= oneHour ? 1 : 0;
            const bInCooldown = modelFailureTime[b] && (now - modelFailureTime[b]) <= oneHour ? 1 : 0;
            if (aInCooldown !== bInCooldown) return aInCooldown - bInCooldown;
            return getModelScore(a) - getModelScore(b);
        });
        return candidates;
    }

    function pickFastestModel(excludeModel) {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        const selectable = AVAILABLE_MODELS.filter((model) => model !== excludeModel);
        const healthyModels = selectable.filter((model) => {
            return !modelFailureTime[model] || (now - modelFailureTime[model]) > oneHour;
        });

        const candidatePool = healthyModels.length > 0 ? healthyModels : selectable;
        if (candidatePool.length === 0) {
            return API_MODEL;
        }

        candidatePool.sort((a, b) => getModelScore(a) - getModelScore(b));
        return candidatePool[0];
    }

    // 尝试从全局配置加载
    function loadConfig() {
        // 优先读取 localStorage (用户手动输入)
        const savedKey = localStorage.getItem('xjtu_ai_key');
        const normalizedSavedKey = normalizeApiKey(savedKey);
        
        // 如果存储中有 Key，使用存储的 Key，其余使用默认值或存储值
        if (normalizedSavedKey) {
            API_KEY = normalizedSavedKey;
            if (savedKey !== normalizedSavedKey) {
                localStorage.setItem('xjtu_ai_key', normalizedSavedKey);
            }
            // 允许用户覆盖 Endpoint，否则使用默认的代理地址
            const savedEndpoint = localStorage.getItem('xjtu_ai_endpoint');
            API_ENDPOINT = normalizeApiEndpoint(savedEndpoint || DEFAULT_API_ENDPOINT);
            return;
        }

        // 其次读取 config.js (本地开发环境)
        if (typeof window !== 'undefined' && window.GAME_CONFIG) {
            API_KEY = normalizeApiKey(window.GAME_CONFIG.API_KEY) || API_KEY;
            API_ENDPOINT = normalizeApiEndpoint(window.GAME_CONFIG.API_ENDPOINT || API_ENDPOINT);
            API_MODEL = window.GAME_CONFIG.AI_MODEL || API_MODEL;
        }
    }

    // 移除多余的 updateEndpointDefault，因为现在只有一个默认来源
    // 初始化加载
    loadModelStats();
    loadModelFilters();
    loadConfig();

    /**
     * 保存用户配置
     */
    function saveUserConfig(key, provider, endpoint) {
        const normalizedKey = normalizeApiKey(key);
        localStorage.setItem('xjtu_ai_key', normalizedKey);
        
        // 立即更新内存中的API_KEY
        API_KEY = normalizedKey;
        
        // 处理endpoint：如果用户提供了非空endpoint则使用，否则使用默认值
        if (endpoint && endpoint.trim() !== '') {
            API_ENDPOINT = normalizeApiEndpoint(endpoint);
            localStorage.setItem('xjtu_ai_endpoint', API_ENDPOINT);
        } else {
            localStorage.removeItem('xjtu_ai_endpoint');
            // 确保使用默认endpoint
            API_ENDPOINT = DEFAULT_API_ENDPOINT;
        }
        
        console.log('AI配置已保存并立即生效:', { 
            hasKey: !!API_KEY, 
            endpoint: API_ENDPOINT,
            model: API_MODEL 
        });
    }
    
    /**
     * 切换到下一个可用模型
     */
    function switchToNextModel() {
        currentModelIndex = (currentModelIndex + 1) % AVAILABLE_MODELS.length;
        API_MODEL = AVAILABLE_MODELS[currentModelIndex];
        console.log(`已切换到下一个模型: ${API_MODEL}`);
        return API_MODEL;
    }

    /**
     * 标记模型失败
     */
    function markModelFailure(model, error) {
        modelFailureTime[model] = Date.now();
        recordModelLatency(model, 6000, false);
        console.warn(`模型 ${model} 失败:`, error);
    }

    function handleModelError(model, statusCode, errText) {
        const text = String(errText || '').toLowerCase();
        let filterUpdated = false;

        if (statusCode === 429) {
            const isDailyQuotaExceeded = text.includes("today's quota") || text.includes('try again tomorrow');
            modelBlockedUntil[model] = Date.now() + (isDailyQuotaExceeded ? DAILY_QUOTA_COOLDOWN_MS : RATE_LIMIT_COOLDOWN_MS);
            filterUpdated = true;
        }
        if (
            text.includes('invalid model id') ||
            text.includes('no provider supported') ||
            text.includes('has no provider supported') ||
            text.includes('unsupported model')
        ) {
            permanentlyUnsupportedModels.add(model);
            filterUpdated = true;
        }

        if (filterUpdated) {
            saveModelFilters();
        }
    }

    /**
     * 获取当前配置
     */
    function getCurrentConfig() {
        return {
            key: API_KEY,
            provider: API_PROVIDER,
            endpoint: API_ENDPOINT
        };
    }
    
    // 系统预设 Prompt - 核心人设
    const SYSTEM_PROMPT = `你是一个在鲜椒待了十年的老学长。你的任务是生成一个随机事件。

【个性化要求】
- 结合玩家的年级、月份、书院、GPA、SAN、金钱、精力等信息，生成贴合处境的事件。
- 大一偏萌新/社团拉新/迷路；高年级偏竞赛、实习、毕设、保研/出国/工作抉择。
- 不同书院要体现气质：南洋(工科实验)、文治(人文)、仲英(志愿)、启德(经金)、钱学森(学霸科研)。
- 语气自然像真实校园插曲，不要模板化重复句式。

【强相关性约束】
- 事件中的人物、地点、社团、称谓必须与玩家当前的书院/背景/校区/最近行动强相关，不得凭空出现无关书院或陌生角色。
- 如玩家开启新档或更换书院，只依据当前输入的角色信息生成事件，禁止引用旧存档或上一位角色的元素。

【重要】你必须严格按照以下格式返回，只返回JSON，不要包含任何其他文本：

{
    "event_text": "简短的事件描述（50-100字）",
    "effects": {
        "gpa": 0,
        "san": 0,
        "stamina": 0,
        "money": 0,
        "social_score": 0
    },
    "achievement_id": null
}

【事件类型参考】
- 学业相关：挂科、高分、缺课被点名等
- 日常相关：食堂排队、宿舍生活、谈恋爱等
- 校园活动：学生会、竞赛、演唱会等
- 校园梗：电路之王、主楼迷宫、表白墙等

【属性范围】
- gpa: -0.5 到 +0.5
- san: -20 到 +20（精神值）
- stamina: -20 到 +20（体力）
- money: -500 到 +500（金钱）
- social_score: -10 到 +10（社交分）`;

    const BIOGRAPHY_SYSTEM_PROMPT = `你是太史公，为鲜椒本科模拟器的结局撰写人物小传。

【核心约束 - 必须遵守】
- 小传中必须准确使用玩家的真实名字，不能用"其人""某生"等代称逃避
- 书院名称必须准确使用（只能是钱学森、南洋、崇实、仲英、励志、文治、宗濂、启德）
- 专业/背景必须与玩家真实选择一致，不能虚构或改动
- 时间跨度必须真实（从大一9月开始，严格按月计算到毕业月份）
【写作风格】
- 采用古文碑帖风，夹少量白话，读起来庄重而不晦涩。
- 故事中必须清晰出现玩家的真实名字和所在书院名称。
- 结局描述要与玩家最终的GPA、SAN值、综测相符，不能虚构。
- 小传正文禁止出现英文单词；仅允许缩写（如 GPA、SAN）。
- 小传正文必须分段书写，采用文言叙事节奏（每段约2-3句）。

【重要】必须严格返回 JSON，不要包含任何其他文本，且body必须包含玩家名字、书院、专业、时间和成绩。`;

    /**
     * 设置 API Key
     * @param {string} key 
     * @param {string} provider 'gemini' | 'openai'
     */
    function setApiKey(key, provider = 'gemini') {
        API_KEY = normalizeApiKey(key);
        API_PROVIDER = provider;
        if (provider === 'gemini') {
            API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        } else if (provider === 'openai') {
            API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
        }
    }

    /**
     * A. 状态封装函数
     * 将游戏当前状态转换为自然语言描述
     */
    function getGameStateSummary() {
        const state = (window.game && window.game.state) ? window.game.state : null;
        if (!state) return "大萌新一个，刚刚入学。";

        const backgroundInfo = (window.GameData && window.GameData.backgrounds) ? window.GameData.backgrounds[state.background] : null;
        const collegeInfo = (window.GameData && window.GameData.colleges) ? window.GameData.colleges[state.college] : null;
        const backgroundName = (backgroundInfo && backgroundInfo.name) ? backgroundInfo.name : (state.background || '未知背景');
        const collegeName = (collegeInfo && collegeInfo.name) ? collegeInfo.name : (state.college || '未知书院');
        const campusName = (collegeInfo && collegeInfo.campus) ? collegeInfo.campus : (state.campus || '未知校区');
        const stateSignature = `${backgroundName}|${collegeName}|year${state.year}|month${state.month}|total${state.totalMonths || 0}`;

        const yearMap = { 1: "大一", 2: "大二", 3: "大三", 4: "大四" };
        const month = state.month;
        const year = yearMap[state.year] || "大四+";
        const college = collegeName;
        
        // 评价 GPA
        let gpaDesc = "一般";
        if (state.gpa >= 3.8) gpaDesc = "学神级别";
        else if (state.gpa >= 3.0) gpaDesc = "还不错";
        else if (state.gpa >= 2.0) gpaDesc = "在及格线边缘疯狂试探";
        else gpaDesc = "惨不忍睹，濒临退学";

        // 评价 SAN 值
        let sanDesc = "精神焕发";
        if (state.san < 20) sanDesc = "精神崩溃，在深夜网抑云";
        else if (state.san < 50) sanDesc = "压力山大，发际线后移中";
        
        // 近期事件 (Mock logic, ideal to have a history log)
        const recentActionIdx = Math.floor(Math.random() * 3);
        const recentActions = [
            "刚从图书馆出来",
            "刚在宿舍睡了一整天",
            "正在去教二上课的路上"
        ];
        
        // 组合描述
        return `玩家当前是${year}学生，就读于${college}（校区：${campusName}），背景：${backgroundName}。目前是${month}月。
        学业状况：GPA ${state.gpa.toFixed(2)} (${gpaDesc})。
        精神状态：SAN值 ${state.san} (${sanDesc})。
        金钱：${state.money}元。
        状态：${recentActions[recentActionIdx]}。
        当前存档签名：${stateSignature}（仅围绕此角色生成事件，禁止引用其他角色或旧存档）。`;
    }

    /**
     * B. 异步 API 调用函数
     * 获取 AI 生成的随机事件
     */
    async function fetchAIEvent(retryCount = 0) {
        // 再次尝试加载配置（防止初始化时没有，后来用户设置了）
        if (!API_KEY) loadConfig();

        if (!API_KEY) {
            console.warn("AI API Key未设置");
            // 抛出特定错误供 UI 捕获并显示设置弹窗
            throw new Error("MISSING_API_KEY");
        }

        const stateSummary = getGameStateSummary();
        const currentState = (window.game && window.game.state) ? window.game.state : null;
        const backgroundInfo = (window.GameData && window.GameData.backgrounds && currentState) ? window.GameData.backgrounds[currentState.background] : null;
        const collegeInfo = (window.GameData && window.GameData.colleges && currentState) ? window.GameData.colleges[currentState.college] : null;
        const backgroundName = backgroundInfo && backgroundInfo.name ? backgroundInfo.name : (currentState ? currentState.background : '未知背景');
        const collegeName = collegeInfo && collegeInfo.name ? collegeInfo.name : (currentState ? currentState.college : '未知书院');
        const stateSignature = currentState ? `${backgroundName}|${collegeName}|year${currentState.year}|month${currentState.month}|total${currentState.totalMonths || 0}` : 'unknown';

        const userPrompt = `基于以下玩家状态生成一个随机事件：\n${stateSummary}\n【关联性提醒】当前角色：背景=${backgroundName}，书院=${collegeName}，存档签名=${stateSignature}。事件涉及的角色/元素必须与该角色强相关，严禁混入其他书院或旧存档角色。`;
        const maxRetries = Math.min(AVAILABLE_MODELS.length, MAX_ATTEMPTS_PER_REQUEST);
        const startModelIndex = currentModelIndex;
        let lastError = null;

        for (let attempt = retryCount; attempt < maxRetries; attempt++) {
            const modelIndex = (startModelIndex + attempt) % AVAILABLE_MODELS.length;
            const selectedModel = AVAILABLE_MODELS[modelIndex];
            currentModelIndex = modelIndex;
            API_MODEL = selectedModel;

            try {
                let responseData;
                console.log(`正在使用模型 ${selectedModel} 生成事件...`);
                const startedAt = getNowMs();
                const timeoutMs = Math.min(REQUEST_TIMEOUT_MAX_MS, REQUEST_TIMEOUT_BASE_MS + attempt * 6000);

                const response = await fetchWithTimeout(API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`
                    },
                    body: JSON.stringify({
                        model: selectedModel,
                        messages: [
                            { role: "system", content: SYSTEM_PROMPT },
                            { role: "user", content: userPrompt }
                        ],
                        temperature: 1.0,
                        stream: false
                    })
                }, timeoutMs);

                if (!response.ok) {
                    const errText = await response.text();
                    markModelFailure(selectedModel, `HTTP ${response.status}`);
                    lastError = new Error(`API Error: ${response.status} - ${errText}`);
                    console.warn(`模型 ${selectedModel} 请求失败，尝试切换其他模型...`);
                    if (response.status === 429) {
                        await sleep(300 + Math.floor(Math.random() * 500));
                    }
                    continue;
                }

                const data = await response.json();
                recordModelLatency(selectedModel, getNowMs() - startedAt, true);
                const content = data.choices[0].message.content;

                let jsonStr = content.trim();
                jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
                const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                }
                jsonStr = jsonStr.replace(/:\s*\+(\d)/g, ': $1');
                jsonStr = jsonStr.replace(/,\s*\+(\d)/g, ', $1');

                try {
                    responseData = JSON.parse(jsonStr);
                } catch (parseError) {
                    console.error("JSON Parse Error. Raw content:", content);
                    console.error("Cleaned JSON:", jsonStr);
                    markModelFailure(selectedModel, parseError.message || 'JSON Parse Error');
                    lastError = new Error(`Invalid JSON format from AI: ${parseError.message}`);
                    continue;
                }

                if (!responseData || !responseData.event_text) {
                    markModelFailure(selectedModel, 'missing event_text');
                    lastError = new Error("Invalid AI Response format: missing event_text");
                    continue;
                }

                return responseData;
            } catch (error) {
                markModelFailure(selectedModel, error && error.message ? error.message : error);
                lastError = error;
                if (isRequestTimeoutError(error)) {
                    console.warn(`模型 ${selectedModel} 响应超时，尝试切换其他模型...`);
                    await sleep(400 + Math.floor(Math.random() * 600));
                } else {
                    console.warn(`模型 ${selectedModel} 调用异常，尝试切换其他模型...`);
                }
            }
        }

        console.error("Fetch AI Event Failed:", lastError);
        throw (lastError || new Error('所有模型均调用失败'));
    }

    function buildEndingBiographyPrompt(input) {
        const state = input && input.state ? input.state : {};
        const toNumber = (value, digits) => {
            if (typeof value !== 'number') return '未知';
            if (typeof digits === 'number') return value.toFixed(digits);
            return String(value);
        };

        // 计算实际经过的时间跨度
        const totalMonths = state.totalMonths || 0;
        const monthsAtEnd = 9 + totalMonths; // 从9月开始
        const yearsAtEnd = Math.floor((monthsAtEnd - 1) / 12) + 1;
        const finalMonth = ((monthsAtEnd - 1) % 12) + 1;
        const monthName = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'][finalMonth - 1];
        const yearName = ['大一', '大二', '大三', '大四'][yearsAtEnd - 1] || '毕业后';

        // 获取书院和背景的中文名称
        const collegeNameMap = {
            'pengkang': '彭康书院',
            'wenchi': '文治书院',
            'nanyang': '南洋书院',
            'qianxuesen': '钱学森书院',
            'zhongying': '仲英书院',
            'lezhi': '励志书院',
            'chongshi': '崇实书院',
            'zongzhe': '宗濂书院',
            'qide': '启德书院'
        };
        const backgroundNameMap = {
            'top': '高分考生',
            'normal': '普通学生',
            'low': '低分生',
            'abroad': '留学生',
            'athlete': '运动员'
        };

        const collegeName = collegeNameMap[state.college] || state.college || '某书院';
        const backgroundName = backgroundNameMap[state.background] || state.background || '学生';
        const playerName = state.name || '某生';

        const summaryLines = [
            `【玩家信息】`,
            `姓名: ${playerName}（必须在小传中使用此名字）`,
            `书院: ${collegeName}（必须出现在小传中）`,
            `背景: ${backgroundName}`,
            `专业/类别: ${state.discipline || '未指定'}`,
            ``,
            `【时间信息】`,
            `入学: 大一9月`,
            `毕业: ${yearName}${monthName}`,
            `经历时间: ${totalMonths}个月`,
            ``,
            `【最终成绩】`,
            `GPA: ${toNumber(state.gpa, 2)}`,
            `综测分数: ${toNumber(state.social)}`,
            `精神值SAN: ${toNumber(state.san)}`,
            `挂科次数: ${toNumber(state.failedCourses)}`,
            ``,
            `【结局类型】`,
            `类型: ${input && input.endingType ? input.endingType : 'unknown'}`,
            `结局标题: ${input && input.endingTitle ? input.endingTitle : '未知结局'}`,
            `结局描述: ${input && input.endingDesc ? input.endingDesc : '无'}`
        ];

        return `请基于以下信息为该玩家撰写古文风格的人物小传。\n${summaryLines.join('\n')}\n\n【重要提示】\n撰写时必须：\n1. 使用玩家真实姓名"${playerName}"，不能用代称\n2. 明确提及所在书院"${collegeName}"\n3. 反映真实的专业背景"${backgroundName}"\n4. 时间因果必须符（大一入学→${yearName}${monthName}毕业，共${totalMonths}月）\n5. 成绩数据要体现在叙事中（GPA ${toNumber(state.gpa, 2)}，综测${toNumber(state.social)}）\n6. 小传中禁止出现英文单词，仅允许缩写（如 GPA、SAN）\n7. 小传正文必须分段，采用文言文叙事节奏，每段2-3句`;
    }

    function safeParseJsonMaybe(text) {
        try {
            return JSON.parse(text);
        } catch (e) {
            return null;
        }
    }

    function sanitizeEnglishWordsKeepAbbr(text) {
        const source = String(text || '');
        return source
            .replace(/[A-Za-z][A-Za-z0-9'_-]*/g, (word) => {
                const isAbbreviation = /^[A-Z0-9]{2,6}$/.test(word);
                return isAbbreviation ? word : '';
            })
            .replace(/\[\s*\]/g, '')
            .replace(/\[[^\]\n]{1,24}\]/g, (block) => {
                const hasChinese = /[\u4e00-\u9fa5]/.test(block);
                return hasChinese ? block : '';
            })
            .replace(/[\[\]]/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    function getDefaultClassicalBody() {
        return [
            '　　其人初入杏坛，怀志而行。虽历风雨，未改初心。',
            '　　行年既进，得失互见；困而知返，学而后成。',
            '　　及其回首来路，心有定见，亦足自立于世。'
        ].join('\n');
    }

    function formatClassicalParagraphs(text, sentencePerParagraph = 2) {
        const source = String(text || '').replace(/\r/g, '').trim();
        if (!source) return source;

        const sentenceRegex = /[^。！？；!?;\n]+[。！？；!?;]?/g;
        const rawSentences = source.match(sentenceRegex) || [source];
        const sentences = rawSentences
            .map((item) => item.replace(/\n+/g, '').trim())
            .filter(Boolean)
            .map((item) => item.replace(/[!?;]/g, '。'));

        if (sentences.length <= sentencePerParagraph) {
            return `　　${sentences.join('')}`;
        }

        const paragraphs = [];
        for (let index = 0; index < sentences.length; index += sentencePerParagraph) {
            const chunk = sentences.slice(index, index + sentencePerParagraph).join('');
            if (chunk.trim()) {
                paragraphs.push(`　　${chunk}`);
            }
        }

        return paragraphs.join('\n');
    }

    function sanitizeBiographyFields(bio) {
        if (!bio || typeof bio !== 'object') return bio;
        const sanitizedBody = formatClassicalParagraphs(sanitizeEnglishWordsKeepAbbr(bio.body), 2);
        const bodyCore = String(sanitizedBody || '').replace(/[\s\n　。？！；、,:：]/g, '');
        return {
            ...bio,
            title: sanitizeEnglishWordsKeepAbbr(bio.title),
            body: bodyCore.length >= 12 ? sanitizedBody : getDefaultClassicalBody(),
            quote: sanitizeEnglishWordsKeepAbbr(bio.quote),
            preface: sanitizeEnglishWordsKeepAbbr(bio.preface),
            epilogue_title: sanitizeEnglishWordsKeepAbbr(bio.epilogue_title),
            epilogue: sanitizeEnglishWordsKeepAbbr(bio.epilogue),
            signature: sanitizeEnglishWordsKeepAbbr(bio.signature)
        };
    }

    function normalizeBiographyResponse(rawContent) {
        const text = String(rawContent || '').trim();
        if (!text) return null;

        let parsed = null;
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            parsed = safeParseJsonMaybe(jsonMatch[0]);
        }

        if (!parsed) {
            return sanitizeBiographyFields({
                title: '结局小传',
                body: cleaned
            });
        }

        const body = parsed.body || parsed.content || parsed.text || parsed.biography || parsed.story || '';
        const title = parsed.title || parsed.heading || '结局小传';

        if (!body || String(body).trim() === '') {
            return null;
        }

        return sanitizeBiographyFields({
            title,
            body: String(body).trim(),
            quote: parsed.quote,
            preface: parsed.preface,
            epilogue_title: parsed.epilogue_title,
            epilogue: parsed.epilogue,
            signature: parsed.signature
        });
    }

    /**
     * 生成结局人物小传
     */
    async function fetchEndingBiography(input, retryCount = 0) {
        if (endingBiographyInFlight) {
            return await endingBiographyInFlight;
        }

        endingBiographyInFlight = (async () => {
        if (!API_KEY) loadConfig();

        if (!API_KEY) {
            console.warn("AI API Key未设置");
            throw new Error("MISSING_API_KEY");
        }

        const userPrompt = buildEndingBiographyPrompt(input || {});
        const maxRetries = Math.min(AVAILABLE_MODELS.length, MAX_ATTEMPTS_PER_REQUEST);
        const startModelIndex = currentModelIndex;
        let lastError = null;

        for (let attempt = retryCount; attempt < maxRetries; attempt++) {
            const modelIndex = (startModelIndex + attempt) % AVAILABLE_MODELS.length;
            const selectedModel = AVAILABLE_MODELS[modelIndex];
            currentModelIndex = modelIndex;
            API_MODEL = selectedModel;

            try {
                let responseData;
                console.log(`正在使用模型 ${selectedModel} 生成结局小传...`);
                const startedAt = getNowMs();
                const timeoutMs = Math.min(REQUEST_TIMEOUT_MAX_MS, REQUEST_TIMEOUT_BASE_MS + attempt * 6000);

                const response = await fetchWithTimeout(API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`
                    },
                    body: JSON.stringify({
                        model: selectedModel,
                        messages: [
                            { role: "system", content: BIOGRAPHY_SYSTEM_PROMPT },
                            { role: "user", content: userPrompt }
                        ],
                        temperature: 0.9,
                        stream: false,
                        ...(selectedModel.includes('Qwen/Qwen3') ? { enable_thinking: false } : {})
                    })
                }, timeoutMs);

                if (!response.ok) {
                    const errText = await response.text();
                    markModelFailure(selectedModel, `HTTP ${response.status}`);
                    lastError = new Error(`API Error: ${response.status} - ${errText}`);
                    console.warn(`模型 ${selectedModel} 请求失败，尝试切换其他模型...`);
                    if (response.status === 429) {
                        await sleep(300 + Math.floor(Math.random() * 500));
                    }
                    continue;
                }

                const data = await response.json();
                recordModelLatency(selectedModel, getNowMs() - startedAt, true);
                const content = data.choices[0].message.content;

                responseData = normalizeBiographyResponse(content);

                if (!responseData || !responseData.body) {
                    console.error("Biography Normalize Error. Raw content:", content);
                    markModelFailure(selectedModel, 'missing body after normalization');
                    lastError = new Error("Invalid AI Response format: missing body");
                    continue;
                }

                return responseData;
            } catch (error) {
                markModelFailure(selectedModel, error && error.message ? error.message : error);
                lastError = error;
                if (isRequestTimeoutError(error)) {
                    console.warn(`模型 ${selectedModel} 响应超时，尝试切换其他模型...`);
                    await sleep(400 + Math.floor(Math.random() * 600));
                } else {
                    console.warn(`模型 ${selectedModel} 调用异常，尝试切换其他模型...`);
                }
            }
        }

        console.error("Fetch Ending Biography Failed:", lastError);
        throw (lastError || new Error('所有模型均调用失败'));
        })();

        try {
            return await endingBiographyInFlight;
        } finally {
            endingBiographyInFlight = null;
        }
    }

    // ===== 恋爱系统 v2 - AI 生成逻辑 =====

    // 候选对象数量与 game.js XianjaoSimulator.LOVE_CANDIDATE_COUNT 保持同步（当前 = 6）
    const LOVE_CANDIDATE_COUNT_AI = 6;

    /** 恋爱候选对象生成 System Prompt（支持 6 人，A/B/C 各 2 名）*/
    const LOVE_CANDIDATE_SYSTEM_PROMPT = `你是鲜椒本科模拟器的恋爱系统策划。请根据玩家信息生成6个有档次差异的恋爱候选对象（A、B、C档各2人）。

【字段要求】
- id: 按顺序填 "candidate_a" / "candidate_a2" / "candidate_b" / "candidate_b2" / "candidate_c" / "candidate_c2"
- name: 中文姓名，符合大学生，6人各不相同
- college: 必须是西安交大9大书院之一（彭康/文治/仲英/南洋/崇实/励志/宗濂/启德/钱学森书院）
- gender: "男" 或 "女"（默认与玩家异性，最多1个同性候选且 isSpecial=true）
- money: 数字（A档2000-3500，B档3500-6000，C档7000-12000）
- reputation: 数字（A档35-55，B档55-75，C档75-95）
- personality: 2-4个性格标签，用"·"分隔，各人要有差异
- unlockTier: A档填"A"，B档填"B"，C档填"C"
- storySeed: 一句话描述相识场景，各人要不同
- isSpecial: 布尔值（仅允许最多1个同性候选为true，其余全为false）

【重要】只返回JSON，不要包含其他文本：
{"candidates":[{"id":"candidate_a","name":"...","college":"...","gender":"...","money":0,"reputation":0,"personality":"...","unlockTier":"A","storySeed":"...","isSpecial":false},...]}`;

    /** 恋爱剧情生成 System Prompt */
    const LOVE_STORY_SYSTEM_PROMPT = `你是鲜椒本科模拟器的恋爱剧情编剧。根据候选对象和互动场景生成一段自然真实的恋爱剧情。

【要求】
- summary：50-80字，用第二人称"你"，要有画面感
- choices：2个选项，各有不同效果
- effects字段可包含：affinity(好感度+数字), san(SAN+数字), gpa(GPA微量), reputation(声望)

【重要】只返回JSON：
{"title":"剧情标题(4-8字)","summary":"剧情描述...","choices":[{"id":"a","text":"选项文字","effects":{"affinity":8,"san":3}},{"id":"b","text":"选项文字","effects":{"affinity":12}}]}`;

    /**
     * 生成恋爱候选对象（恋爱系统v2）
     * @param {Object} playerInfo - 玩家信息
     * @param {Array} fallbackCandidates - 本地fallback候选对象（API失败时使用验证）
     * @returns {Array|null} - 3个候选对象，或 null（失败时由调用方使用fallback）
     */
    async function fetchLoveCandidates(playerInfo, fallbackCandidates) {
        if (!API_KEY) loadConfig();
        if (!API_KEY) {
            console.warn('AI API Key未设置，使用fallback候选对象');
            return null;
        }

        const collegeNameMap = {
            'pengkang': '彭康书院', 'wenzhi': '文治书院', 'zhongying': '仲英书院',
            'nanyang': '南洋书院', 'chongshi': '崇实书院', 'lizhi': '励志书院',
            'zonglian': '宗濂书院', 'qide': '启德书院', 'qianxuesen': '钱学森书院'
        };
        const collegeName = collegeNameMap[playerInfo.college] || playerInfo.college;
        // 归一化：兼容 game.js 传来的 'male'/'female'/'男'/'女' 等各种形式
        const _pg = playerInfo.gender || '';
        const playerGender = (_pg === 'female' || _pg === '女') ? '女' : '男';
        const mainTargetGender = playerGender === '女' ? '男' : '女';

        const userPrompt = `玩家信息：书院=${collegeName}，性别=${playerGender}，大${playerInfo.year}，GPA=${(playerInfo.gpa||3).toFixed(2)}，声望=${playerInfo.reputation||50}，综测=${playerInfo.social||60}，金币=${playerInfo.money||1000}。
生成6个候选对象（A/B/C档各2人），主要性别为${mainTargetGender}，允许最多1个特殊同性候选对象（isSpecial:true）。A档容易解锁（低属性），B档中等，C档需要高声望+高GPA。每人性格、书院、故事各不相同。`;

        const maxRetries = 3;
        const attemptedModels = new Set();

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const selectedModel = selectBestModelForRequest(attemptedModels);
            if (!selectedModel) break;
            attemptedModels.add(selectedModel);

            try {
                const startedAt = getNowMs();
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
                    body: JSON.stringify({
                        model: selectedModel,
                        messages: [
                            { role: 'system', content: LOVE_CANDIDATE_SYSTEM_PROMPT },
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: 0.9, stream: false
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    handleModelError(selectedModel, response.status, errText);
                    markModelFailure(selectedModel, errText);
                    continue;
                }

                const data = await response.json();
                recordModelLatency(selectedModel, getNowMs() - startedAt, true);
                const content = data.choices[0].message.content;

                let jsonStr = content.trim().replace(/```json/g, '').replace(/```/g, '').trim();
                const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
                if (jsonMatch) jsonStr = jsonMatch[0];

                const parsed = JSON.parse(jsonStr);
                if (parsed && Array.isArray(parsed.candidates) && parsed.candidates.length >= 3) {
                    // id 顺序与 unlockTier 的对应关系（6 人版）
                    const idList  = ['candidate_a','candidate_a2','candidate_b','candidate_b2','candidate_c','candidate_c2'];
                    const tierMap = { candidate_a:'A', candidate_a2:'A', candidate_b:'B', candidate_b2:'B', candidate_c:'C', candidate_c2:'C' };

                    // 取前 LOVE_CANDIDATE_COUNT_AI 个，不足则用 fallback 补齐
                    const raw = parsed.candidates.slice(0, LOVE_CANDIDATE_COUNT_AI);
                    while (raw.length < LOVE_CANDIDATE_COUNT_AI) {
                        const fi = raw.length;
                        raw.push(fallbackCandidates && fallbackCandidates[fi] ? fallbackCandidates[fi] : { id: idList[fi] });
                    }

                    return raw.map((c, i) => {
                        const fb = fallbackCandidates && fallbackCandidates[i];
                        const expectedId = idList[i];
                        return {
                            id: expectedId,                           // 强制使用预期 id，避免 AI 乱填
                            name: c.name || (fb ? fb.name : '未知'),
                            college: c.college || (fb ? fb.college : '南洋书院'),
                            gender: c.gender || mainTargetGender,
                            money: Number(c.money) || (fb ? fb.money : 3000),
                            reputation: Number(c.reputation) || (fb ? fb.reputation : 50),
                            personality: c.personality || (fb ? fb.personality : '阳光开朗'),
                            unlockTier: tierMap[expectedId] || (fb ? fb.unlockTier : 'A'),
                            storySeed: c.storySeed || (fb ? fb.storySeed : '在校园中偶然相遇'),
                            isSpecial: Boolean(c.isSpecial)
                        };
                    });
                }
            } catch (e) {
                markModelFailure(selectedModel, e && e.message ? e.message : e);
                console.warn(`恋爱候选对象AI生成失败 (${selectedModel}):`, e);
            }
        }
        return null;
    }

    /**
     * 生成恋爱剧情事件（恋爱系统v2）
     * @param {Object} candidate - 候选对象信息
     * @param {Object} context - 互动上下文 {college, year, month, interactionType}
     * @returns {Object|null} - {title, summary, choices} 或 null
     */
    async function fetchLoveStory(candidate, context) {
        if (!API_KEY) loadConfig();
        if (!API_KEY) return null;

        const interactionNameMap = {
            mainbuilding_e: '主楼E顶楼约会', tengfei: '腾飞塔下约会', dinner_out: '校外约饭',
            library_together: '图书馆双人自习', classroom_empty: '主楼空教室自习',
            college_discussion: '书院讨论区', qujiang_walk: '曲江散步',
            city_wall_night: '城墙夜游', short_trip: '周边短途旅游'
        };

        const userPrompt = `候选对象：${candidate.name}（${candidate.college}，${candidate.gender}，性格：${candidate.personality}）。故事背景：${candidate.storySeed}。互动场景：${interactionNameMap[context.interactionType] || context.interactionType}。当前时间：大${context.year}，${context.month}月。请生成符合这个场景的恋爱剧情，要体现候选对象的性格特点。`;

        const maxRetries = 3;
        const attemptedModels = new Set();

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const selectedModel = selectBestModelForRequest(attemptedModels);
            if (!selectedModel) break;
            attemptedModels.add(selectedModel);

            try {
                const startedAt = getNowMs();
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
                    body: JSON.stringify({
                        model: selectedModel,
                        messages: [
                            { role: 'system', content: LOVE_STORY_SYSTEM_PROMPT },
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: 1.0, stream: false
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    handleModelError(selectedModel, response.status, errText);
                    markModelFailure(selectedModel, errText);
                    continue;
                }

                const data = await response.json();
                recordModelLatency(selectedModel, getNowMs() - startedAt, true);
                const content = data.choices[0].message.content;

                let jsonStr = content.trim().replace(/```json/g, '').replace(/```/g, '').trim();
                const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
                if (jsonMatch) jsonStr = jsonMatch[0];

                const parsed = JSON.parse(jsonStr);
                if (parsed && parsed.title && parsed.summary && Array.isArray(parsed.choices)) {
                    return {
                        title: parsed.title,
                        summary: parsed.summary,
                        choices: parsed.choices.map(c => ({
                            id: c.id || 'a',
                            text: c.text || '…',
                            effects: c.effects || {}
                        }))
                    };
                }
            } catch (e) {
                markModelFailure(selectedModel, e && e.message ? e.message : e);
                console.warn(`恋爱剧情AI生成失败 (${selectedModel}):`, e);
            }
        }
        return null;
    }

    /**
     * C. 结构化 JSON 处理逻辑
     * 应用 AI 生成的事件效果
     */
    function applyAIEvent(aiEventData) {
        if (!aiEventData || !window.gameState) return false;

        // 1. 更新数值
        const effects = aiEventData.effects || {};
        const changes = [];

        if (effects.gpa) {
            window.gameState.gpa = Math.max(0, Math.min(4.3, window.gameState.gpa + effects.gpa));
            changes.push(`GPA ${effects.gpa > 0 ? '+' : ''}${effects.gpa}`);
        }
        if (effects.san) {
            window.gameState.san = Math.max(0, Math.min(100, window.gameState.san + effects.san));
            changes.push(`SAN ${effects.san > 0 ? '+' : ''}${effects.san}`);
        }
        if (effects.stamina) { // 映射到 energy (game.js 中用的是 energy)
            window.gameState.energy = Math.max(0, Math.min(100, window.gameState.energy + effects.stamina));
            changes.push(`精力 ${effects.stamina > 0 ? '+' : ''}${effects.stamina}`);
        }
        if (effects.money) {
            window.gameState.money += effects.money;
            changes.push(`金钱 ${effects.money > 0 ? '+' : ''}${effects.money}`);
        }
        if (effects.social_score) {
            window.gameState.social = Math.max(0, Math.min(100, (window.gameState.social || 0) + effects.social_score));
            changes.push(`综测 ${effects.social_score > 0 ? '+' : ''}${effects.social_score}`);
        }
        
        // 2. 更新 UI (假设 game.js 有 updateUI 函数)
        if (typeof updateUI === 'function') {
            updateUI();
        }

        // 3. 尝试解锁成就
        if (aiEventData.achievement_id && window.AchievementSystem) {
            // 这里假设 AchievementSystem 有 unlock 方法
            // 实际可能需要根据 ID 查找并解锁
            // window.AchievementSystem.unlock(aiEventData.achievement_id);
            console.log(`AI 建议解锁成就: ${aiEventData.achievement_id}`);
        }

        return {
            title: "命运的随机波动",
            description: aiEventData.event_text,
            effects: changes,
            isAI: true
        };
    }

    // 暴露接口
    return {
        setApiKey,
        getGameStateSummary,
        fetchAIEvent,
        fetchEndingBiography,
        applyAIEvent,
        saveUserConfig,
        getCurrentConfig,
        switchToNextModel,
        // 恋爱系统 v2
        fetchLoveCandidates,
        fetchLoveStory,
        getCurrentModel: () => API_MODEL,
        getAvailableModels: () => AVAILABLE_MODELS,
        setModel: (modelName) => {
            const index = AVAILABLE_MODELS.indexOf(modelName);
            if (index !== -1) {
                currentModelIndex = index;
                API_MODEL = modelName;
                console.log(`手动切换到模型: ${API_MODEL}`);
                return true;
            }
            return false;
        }
    };
})();

// 如果在浏览器环境，挂载到 window
if (typeof window !== 'undefined') {
    window.AIModule = AIModule;
}
