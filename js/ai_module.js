/**
 * AI API 接入模块 - XJTU本科模拟器
 * 处理与 LLM (Gemini/OpenAI) 的交互，生成动态随机事件
 */

const AIModule = (function() {
    // API 配置
    let API_KEY = null;
    let API_PROVIDER = 'modelscope'; // 强制使用 modelscope
    let API_ENDPOINT = 'https://api-inference.modelscope.cn/v1/chat/completions'; // ModelScope API Inference
    let API_MODEL = 'deepseek-ai/DeepSeek-V3.2';

    // 尝试从全局配置加载
    function loadConfig() {
        // 优先读取 localStorage (用户手动输入)
        const savedKey = localStorage.getItem('xjtu_ai_key');
        
        // 如果存储中有 Key，使用存储的 Key，其余使用默认值或存储值
        if (savedKey) {
            API_KEY = savedKey;
            // 允许用户覆盖 Endpoint，否则使用默认的代理地址
            const savedEndpoint = localStorage.getItem('xjtu_ai_endpoint');
            if (savedEndpoint) API_ENDPOINT = savedEndpoint;
            return;
        }

        // 其次读取 config.js (本地开发环境)
        if (typeof window !== 'undefined' && window.GAME_CONFIG) {
            API_KEY = window.GAME_CONFIG.API_KEY;
            API_ENDPOINT = window.GAME_CONFIG.API_ENDPOINT || API_ENDPOINT;
            API_MODEL = window.GAME_CONFIG.AI_MODEL || API_MODEL;
        }
    }

    // 移除多余的 updateEndpointDefault，因为现在只有一个默认来源
    // 初始化加载
    loadConfig();

    /**
     * 保存用户配置
     */
    function saveUserConfig(key, provider, endpoint) {
        localStorage.setItem('xjtu_ai_key', key);
        // provider 不再需要保存，固定为 modelscope
        if (endpoint) localStorage.setItem('xjtu_ai_endpoint', endpoint);
        else localStorage.removeItem('xjtu_ai_endpoint'); // 如果没有提供，移除存储，使用默认
        
        // 重新加载
        loadConfig();
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
    const SYSTEM_PROMPT = `你是一个在西安交通大学（XJTU）待了十年的老学长。你的任务是生成一个随机事件。

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

    /**
     * 设置 API Key
     * @param {string} key 
     * @param {string} provider 'gemini' | 'openai'
     */
    function setApiKey(key, provider = 'gemini') {
        API_KEY = key;
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

        const yearMap = { 1: "大一", 2: "大二", 3: "大三", 4: "大四" };
        const month = state.month;
        const year = yearMap[state.year] || "大四+";
        const college = state.college || "未知书院";
        
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
        return `玩家当前是${year}学生，就读于${college}。目前是${month}月。
        学业状况：GPA ${state.gpa.toFixed(2)} (${gpaDesc})。
        精神状态：SAN值 ${state.san} (${sanDesc})。
        金钱：${state.money}元。
        状态：${recentActions[recentActionIdx]}。`;
    }

    /**
     * B. 异步 API 调用函数
     * 获取 AI 生成的随机事件
     */
    async function fetchAIEvent() {
        // 再次尝试加载配置（防止初始化时没有，后来用户设置了）
        if (!API_KEY) loadConfig();

        if (!API_KEY) {
            console.warn("AI API Key未设置");
            // 抛出特定错误供 UI 捕获并显示设置弹窗
            throw new Error("MISSING_API_KEY");
        }

        const stateSummary = getGameStateSummary();
        const userPrompt = `基于以下玩家状态生成一个随机事件：\n${stateSummary}`;

        try {
            let responseData;
            
            // 统一使用 OpenAI 格式 (DeepSeek 兼容)
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: API_MODEL,
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 1.0,
                    stream: false
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errText}`);
            }
            const data = await response.json();
            const content = data.choices[0].message.content;
            
            // 清理内容：移除markdown标记和多余空白
            let jsonStr = content.trim();
            jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
            
            // 如果内容中包含多个JSON对象，提取第一个完整的JSON
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }
            
            // 解析JSON
            try {
                responseData = JSON.parse(jsonStr);
            } catch (parseError) {
                console.error("JSON Parse Error. Raw content:", content);
                console.error("Cleaned JSON:", jsonStr);
                throw new Error(`Invalid JSON format from AI: ${parseError.message}`);
            }

            // 基础校验
            if (!responseData || !responseData.event_text) {
                throw new Error("Invalid AI Response format: missing event_text");
            }

            return responseData;

        } catch (error) {
            console.error("Fetch AI Event Failed:", error);
            // 抛出错误以便上层处理（显示设置弹窗等）
            throw error;
        }
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
            title: "🔮 命运的随机波动",
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
        applyAIEvent,
        saveUserConfig,
        getCurrentConfig
    };
})();

// 如果在浏览器环境，挂载到 window
if (typeof window !== 'undefined') {
    window.AIModule = AIModule;
}
