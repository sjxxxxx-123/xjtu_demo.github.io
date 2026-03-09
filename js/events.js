// author: sjxxxx
/**
 * 鲜椒本科模拟器 - 随机事件系统
 * 管理所有随机事件的触发和处理
 */

const EventSystem = {
    // 随机事件库
    events: {
        // 校园生活事件
        straycat: {
            id: 'straycat',
            name: '校园流浪猫',
            icon: '🐱',
            description: '你在去自习的路上遇到了一只可爱的流浪猫，它蹭了蹭你的腿。',
            probability: 0.08,
            effects: { san: 5 },
            achievement: 'animalMessenger',
            conditions: {}
        },
        
        hedgehog: {
            id: 'hedgehog',
            name: '校园刺猬',
            icon: '🦔',
            description: '夜晚在校园散步时，你发现了一只小刺猬在草丛中穿行！',
            probability: 0.05,
            effects: { san: 8 },
            achievement: 'animalMessenger',
            conditions: { nightOnly: true }
        },
        
        speedBump: {
            id: 'speedBump',
            name: '减速带惊魂',
            icon: '🚲',
            description: '骑车飞速冲过减速带，你的灵魂仿佛被震出了身体...',
            probability: 0.1,
            effects: { san: -3 },
            achievement: 'speedBump',
            conditions: {}
        },
        
        spoonSquare: {
            id: 'spoonSquare',
            name: '勺子广场',
            icon: '🥄',
            description: '路过四大发明广场，你仔细观察了那个神秘的"勺子"雕塑，陷入了沉思...',
            probability: 0.06,
            effects: { san: 2 },
            achievement: 'spoon',
            conditions: {}
        },
        
        rainNoUmbrella: {
            id: 'rainNoUmbrella',
            name: '突然下雨',
            icon: '🌧️',
            description: '上课途中突然下起大雨，你没带伞被淋成了落汤鸡。',
            probability: 0.08,
            effects: { san: -5, energy: -1 },
            conditions: { season: [3, 4, 5, 6, 7, 8] } // 春夏季节
        },
        
        canteenCrowded: {
            id: 'canteenCrowded',
            name: '食堂爆满',
            icon: '🍜',
            description: '下课后去食堂，人山人海，排了半小时才吃上饭。',
            probability: 0.1,
            effects: { san: -3, energy: -1 },
            conditions: {}
        },
        
        findMoney: {
            id: 'findMoney',
            name: '意外之财',
            icon: '💰',
            description: '在图书馆捡到了一张没有标记的饭卡，里面还有些余额...',
            probability: 0.03,
            effects: { money: 50 },
            conditions: {}
        },
        
        lostCard: {
            id: 'lostCard',
            name: '饭卡丢失',
            icon: '😱',
            description: '糟糕！你发现饭卡不见了，只好去补办一张。',
            probability: 0.05,
            effects: { money: -30, san: -5 },
            achievement: 'cardLost',
            conditions: {},
            onTrigger: () => AchievementSystem.recordCardLost()
        },
        
        getSick: {
            id: 'getSick',
            name: '身体不适',
            icon: '🤒',
            description: '你感冒了，需要去校医院看病休息。',
            probability: 0.06,
            effects: { san: -8, energy: -2 },
            conditions: { season: [11, 12, 1, 2, 3] }, // 冬春季节容易生病
            collegeSpecial: 'zonglian' // 宗濂书院免疫
        },
        
        dormitoryParty: {
            id: 'dormitoryParty',
            name: '宿舍卧谈会',
            icon: '🌙',
            description: '室友们聊天聊到深夜，虽然很困但很开心。',
            probability: 0.08,
            effects: { san: 8, energy: -1 },
            conditions: {}
        },
        
        examRumor: {
            id: 'examRumor',
            name: '考试传闘',
            icon: '📝',
            description: '听说这门课的老师出题特别难，你开始有些紧张...',
            probability: 0.1,
            effects: { san: -5 },
            conditions: { examSeason: true }
        },
        
        libraryFull: {
            id: 'libraryFull',
            name: '图书馆爆满',
            icon: '📚',
            description: '考试周的图书馆人满为患，你转了半天才找到位置。',
            probability: 0.15,
            effects: { energy: -1 },
            conditions: { examSeason: true }
        },
        
        // 季节相关事件
        cherryBlossom: {
            id: 'cherryBlossom',
            name: '樱花盛开',
            icon: '🌸',
            description: '校园里的樱花开了！你驻足欣赏了这美丽的景色。',
            probability: 0.3,
            effects: { san: 10 },
            conditions: { month: [3, 4] }
        },
        
        hotSummer: {
            id: 'hotSummer',
            name: '酷暑难耐',
            icon: '☀️',
            description: '西安的夏天实在太热了，你感觉自己快要融化...',
            probability: 0.2,
            effects: { san: -5, energy: -1 },
            conditions: { month: [6, 7, 8] }
        },
        
        coldWinter: {
            id: 'coldWinter',
            name: '寒风刺骨',
            icon: '❄️',
            description: '冬天的早课实在太冷了，你差点没爬起来。',
            probability: 0.15,
            effects: { san: -3 },
            conditions: { month: [12, 1, 2] }
        },
        
        autumnLeaves: {
            id: 'autumnLeaves',
            name: '金秋落叶',
            icon: '🍂',
            description: '校园里铺满了金黄的落叶，秋意正浓。',
            probability: 0.2,
            effects: { san: 5 },
            conditions: { month: [10, 11] }
        },
        
        // 学业相关事件
        teacherPraise: {
            id: 'teacherPraise',
            name: '老师表扬',
            icon: '👏',
            description: '老师在课堂上表扬了你的回答，你感到很有成就感！',
            probability: 0.08,
            effects: { san: 10, social: 2 },
            conditions: { afterClass: true }
        },
        
        groupProject: {
            id: 'groupProject',
            name: '小组作业',
            icon: '👥',
            description: '被分配了小组作业，你需要和组员们协调合作。',
            probability: 0.1,
            effects: { energy: -1, social: 3 },
            conditions: {}
        },
        
        allNighter: {
            id: 'allNighter',
            name: '通宵复习',
            icon: '📖',
            description: '考试临近，你和室友们通宵复习，效率感人...',
            probability: 0.1,
            effects: { san: -10, energy: -3 },
            mastery: 15, // 增加当前课程掌握度
            conditions: { examSeason: true }
        },
        
        // 社交事件
        clubRecruit: {
            id: 'clubRecruit',
            name: '社团招新',
            icon: '🎭',
            description: '路过活动中心，各种社团在热情招新，你被拉去填了好几张表。',
            probability: 0.1,
            effects: { social: 5 },
            conditions: { month: [9, 10] }
        },
        
        oldFriend: {
            id: 'oldFriend',
            name: '偶遇老友',
            icon: '👋',
            description: '在校园里偶遇了高中同学，你们聊了很久。',
            probability: 0.05,
            effects: { san: 8 },
            conditions: {}
        },
        
        confession: {
            id: 'confession',
            name: '收到表白',
            icon: '💌',
            description: '有人悄悄给你塞了一封情书...',
            probability: 0.03,
            effects: { san: 10, charm: 5 },
            conditions: { charm: 50 }
        },
        
        // 特殊事件
        scholarshipNews: {
            id: 'scholarshipNews',
            name: '奖学金评选',
            icon: '🏆',
            description: '学院开始评选奖学金，你需要准备相关材料。',
            probability: 0.2,
            effects: { san: -3 },
            conditions: { month: [10, 11] }
        },
        
        internshipInfo: {
            id: 'internshipInfo',
            name: '实习信息',
            icon: '💼',
            description: '收到了一条不错的实习信息，你开始考虑是否要申请...',
            probability: 0.1,
            effects: {},
            conditions: { year: [3, 4] }
        },
        
        graduateInfo: {
            id: 'graduateInfo',
            name: '保研信息',
            icon: '🎓',
            description: '看到保研名单公布，你开始关注自己的排名...',
            probability: 0.15,
            effects: { san: -5 },
            conditions: { year: [3], month: [9, 10] }
        },
        
        // 创新港特殊事件
        busLate: {
            id: 'busLate',
            name: '校车迟到',
            icon: '🚌',
            description: '等校车等了很久，差点赶不上导师的meeting...',
            probability: 0.15,
            effects: { san: -8 },
            conditions: { location: 'innovationPort' }
        },
        
        cityTrip: {
            id: 'cityTrip',
            name: '进城购物',
            icon: '🛍️',
            description: '好不容易进趟城，你疯狂购物补给物资。',
            probability: 0.1,
            effects: { san: 15, money: -200 },
            conditions: { location: 'innovationPort' }
        },
        
        // 成就相关事件
        takeoutStolen: {
            id: 'takeoutStolen',
            name: '外卖失踪',
            icon: '🍱',
            description: '你的外卖在架子上不翼而飞了！只能再点一份...',
            probability: 0.04,
            effects: { san: -10, money: -25 },
            achievement: 'stolenLunch',
            conditions: {},
            onTrigger: () => AchievementSystem.recordTakeoutStolen()
        },
        
        bikeStolen: {
            id: 'bikeStolen',
            name: '自行车失踪',
            icon: '🚲',
            description: '停在楼下的自行车不见了！只能走着去上课了...',
            probability: 0.03,
            effects: { san: -15, money: -100 },
            achievement: 'stolenBike',
            conditions: {},
            onTrigger: () => AchievementSystem.recordBikeStolen()
        },
        
        wrongToilet: {
            id: 'wrongToilet',
            name: '误入厕所',
            icon: '🚻',
            description: '迷迷糊糊走进了厕所...等等，这里好像不太对？！',
            probability: 0.02,
            effects: { san: -20 },
            achievement: 'wrongToilet',
            conditions: {}
        },
        
        ghostRoom: {
            id: 'ghostRoom',
            name: '鬼楼传说',
            icon: '👻',
            description: '深夜自习途中，你不小心走进了传说中闹鬼的教室...',
            probability: 0.02,
            effects: { san: -15 },
            achievement: 'ghostRoom',
            conditions: { nightOnly: true }
        },
        
        rooftop: {
            id: 'rooftop',
            name: '天台时光',
            icon: '🌃',
            description: '你爬上了主楼E顶楼，俯瞰整个校园，心情舒畅。',
            probability: 0.03,
            effects: { san: 15 },
            achievement: 'rooftop',
            conditions: {}
        },
        
        meetPresident: {
            id: 'meetPresident',
            name: '偶遇校长',
            icon: '👔',
            description: '在校园里偶遇了校长！他亲切地和你打了个招呼。',
            probability: 0.01,
            effects: { san: 20, social: 5 },
            achievement: 'president',
            conditions: {},
            onTrigger: () => AchievementSystem.recordMetPresident()
        },
        
        rainySea: {
            id: 'rainySea',
            name: '雨后交大海',
            icon: '🌊',
            description: '暴雨过后，校园变成了汪洋大海，你艰难地涉水前行...',
            probability: 0.08,
            effects: { san: -5, energy: -1 },
            achievement: 'rainySea',
            conditions: { month: [6, 7, 8] }
        },
        
        luckinCoffee: {
            id: 'luckinCoffee',
            name: '瑞幸优惠',
            icon: '☕',
            description: '领到了瑞幸咖啡的优惠券，赶紧去喝一杯提神！',
            probability: 0.1,
            effects: { san: 5, energy: 1, money: -10 },
            conditions: {},
            onTrigger: () => AchievementSystem.recordLuckinVisit()
        },
        
        helpRoommate: {
            id: 'helpRoommate',
            name: '帮室友带饭',
            icon: '🍚',
            description: '室友太忙了，你帮他去食堂打饭顺便刷了个卡。',
            probability: 0.06,
            effects: { social: 3, money: -15 },
            conditions: {},
            onTrigger: () => AchievementSystem.recordHelpRoommate()
        },
        
        partTimeJob: {
            id: 'partTimeJob',
            name: '兼职机会',
            icon: '💼',
            description: '发现了一个校内兼职的机会，你决定试试看。',
            probability: 0.05,
            effects: { money: 100, energy: -2 },
            conditions: {},
            onTrigger: () => AchievementSystem.recordPartTimeEarning(100)
        },
        
        breakup: {
            id: 'breakup',
            name: '感情危机',
            icon: '💔',
            description: '你和对象发生了严重的争吵...',
            probability: 0.03,
            effects: { san: -30 },
            conditions: { inRelationship: true },
            onTrigger: () => AchievementSystem.recordBreakup()
        }
    },

    // 检查事件是否满足触发条件
    checkConditions(event, gameState) {
        const conditions = event.conditions;
        
        // 检查月份条件
        if (conditions.month && !conditions.month.includes(gameState.month)) {
            return false;
        }
        
        // 检查年份条件
        if (conditions.year && !conditions.year.includes(gameState.year)) {
            return false;
        }
        
        // 检查季节条件
        if (conditions.season && !conditions.season.includes(gameState.month)) {
            return false;
        }
        
        // 检查考试季节
        if (conditions.examSeason) {
            const examMonths = [1, 6, 7, 12];
            if (!examMonths.includes(gameState.month)) {
                return false;
            }
        }
        
        // 检查地点条件
        if (conditions.location && conditions.location !== gameState.location) {
            return false;
        }
        
        // 检查魅力值条件
        if (conditions.charm && gameState.charm < conditions.charm) {
            return false;
        }
        
        // 检查上课后条件
        if (conditions.afterClass && !gameState.attendedClassThisTurn) {
            return false;
        }
        
        // 检查夜晚条件
        if (conditions.nightOnly && !gameState.isNight) {
            return false;
        }
        
        // 检查恋爱状态
        if (conditions.inRelationship && !gameState.inRelationship) {
            return false;
        }
        
        return true;
    },

    // 获取可能触发的事件列表
    getEligibleEvents(gameState) {
        return Object.values(this.events).filter(event => 
            this.checkConditions(event, gameState)
        );
    },

    // 随机触发事件
    rollEvent(gameState) {
        const eligibleEvents = this.getEligibleEvents(gameState);
        const effects = gameState.collegeEffects || {};
        
        for (const event of eligibleEvents) {
            if (Math.random() < event.probability) {
                // 宗濂书院生病免疫检查
                if (event.collegeSpecial === 'zonglian' && effects.sickImmunity) {
                    // 宗濂书院触发生病事件时瞬间康复
                    AchievementSystem.recordQuickHeal();
                    
                    // 检查宗濂书院成就
                    if (AchievementSystem.stats.quickHealCount >= 5) {
                        AchievementSystem.unlock('zonglianHeal');
                    }
                    
                    return {
                        id: 'zonglianHeal',
                        name: '医学特权',
                        icon: '⚕️',
                        description: '你感觉身体有些不适，但凭借医学知识快速调理好了自己！',
                        effects: { san: 2 }, // 反而加点SAN
                        achievement: 'zonglianHeal'
                    };
                }
                
                return event;
            }
        }
        
        return null;
    },

    // 应用事件效果
    applyEventEffects(event, gameState) {
        const effects = event.effects;
        const changes = {};
        
        if (effects.san) {
            gameState.san = Math.max(0, Math.min(100, gameState.san + effects.san));
            changes.san = effects.san;
        }
        
        if (effects.energy) {
            const energyCap = gameState.maxEnergy || 15;
            gameState.energy = Math.max(0, Math.min(energyCap, gameState.energy + effects.energy));
            changes.energy = effects.energy;
        }
        
        if (effects.money) {
            gameState.money = Math.max(0, gameState.money + effects.money);
            changes.money = effects.money;
        }
        
        if (effects.social) {
            gameState.social = Math.max(0, Math.min(100, gameState.social + effects.social));
            changes.social = effects.social;
        }
        
        if (effects.charm) {
            gameState.charm = Math.max(0, Math.min(100, (gameState.charm || 0) + effects.charm));
            changes.charm = effects.charm;
        }
        
        // 触发成就
        if (event.achievement) {
            AchievementSystem.unlock(event.achievement);
        }
        
        // 调用自定义触发函数（用于记录统计数据）
        if (event.onTrigger && typeof event.onTrigger === 'function') {
            event.onTrigger(gameState);
        }
        
        // 增加课程掌握度
        if (event.mastery && gameState.currentCourses) {
            const course = gameState.currentCourses[0];
            if (course) {
                course.mastery = Math.min(100, (course.mastery || 0) + event.mastery);
                changes.mastery = event.mastery;
            }
        }
        
        return changes;
    },

    // 生成事件描述文本
    generateEventMessage(event, changes) {
        let message = `${event.icon} ${event.name}\n${event.description}`;
        
        const changeTexts = [];
        if (changes.san) {
            changeTexts.push(`SAN ${changes.san > 0 ? '+' : ''}${changes.san}`);
        }
        if (changes.energy) {
            changeTexts.push(`体力 ${changes.energy > 0 ? '+' : ''}${changes.energy}`);
        }
        if (changes.money) {
            changeTexts.push(`金币 ${changes.money > 0 ? '+' : ''}${changes.money}`);
        }
        if (changes.social) {
            changeTexts.push(`综测 ${changes.social > 0 ? '+' : ''}${changes.social}`);
        }
        if (changes.mastery) {
            changeTexts.push(`掌握度 +${changes.mastery}`);
        }
        
        if (changeTexts.length > 0) {
            message += `\n【${changeTexts.join('，')}】`;
        }
        
        return message;
    },

    // 处理特定行动后的事件检查
    checkActionEvents(action, gameState) {
        const events = [];
        
        switch (action) {
            case 'self-study':
                // 自习时可能遇到的事件
                if (gameState.studyLocation === 'mainBuilding' && Math.random() < 0.1) {
                    events.push({
                        id: 'mainBuildingLost',
                        name: '主楼迷路',
                        icon: '🌫️',
                        description: '在主楼复杂的走廊里迷了路，浪费了不少时间...',
                        effects: { san: -5, energy: -1 },
                        achievement: 'warFog'
                    });
                    AchievementSystem.recordMainBuildingLost();
                }
                break;
                
            case 'bath':
                // 洗澡排队事件
                if (Math.random() < 0.2) {
                    events.push({
                        id: 'bathQueue',
                        name: '洗澡排队',
                        icon: '🚿',
                        description: '澡堂人太多了，排了半个小时的队...',
                        effects: { san: -3 }
                    });
                    AchievementSystem.recordBathQueue();
                }
                break;
                
            case 'volunteer':
                // 志愿活动事件
                if (Math.random() < 0.15) {
                    events.push({
                        id: 'volunteerThanks',
                        name: '志愿感谢',
                        icon: '🤝',
                        description: '帮助的人对你表达了真诚的感谢，你感到很温暖。',
                        effects: { san: 5, social: 3 }
                    });
                }
                break;
        }
        
        return events;
    },

    // 月末结算时的特殊事件
    checkMonthEndEvents(gameState) {
        const events = [];
        const effects = gameState.collegeEffects || {};
        
        // 计算生活费金额（启德书院金币收益+30%）
        let monthlyIncome = gameState.monthlyMoney;
        if (effects.moneyEfficiency > 1) {
            monthlyIncome = Math.floor(monthlyIncome * effects.moneyEfficiency);
        }
        
        // 生活费发放
        events.push({
            id: 'monthlyMoney',
            name: '生活费到账',
            icon: '💰',
            description: effects.moneyEfficiency > 1 
                ? `本月生活费已到账（启德书院理财加成！）` 
                : `本月生活费已到账`,
            effects: { money: monthlyIncome }
        });
        
        // 启德书院记录收入
        if (effects.moneyEfficiency > 1) {
            AchievementSystem.recordEarnings(monthlyIncome);
            
            // 检查理财达人成就
            if (AchievementSystem.stats.totalEarnings >= 5000) {
                AchievementSystem.unlock('qideRich');
            }
        }
        
        // 期末考试月
        if (gameState.month === 1 || gameState.month === 6) {
            events.push({
                id: 'examTime',
                name: '期末考试周',
                icon: '📝',
                description: '期末考试周来临，准备好迎接挑战了吗？',
                effects: { san: -10 }
            });
        }
        
        // 书院特殊事件
        if (gameState.college === 'pengkang' && [6, 7, 8].includes(gameState.month)) {
            events.push({
                id: 'pengkangHeat',
                name: '彭康酷暑',
                icon: '🥵',
                description: '彭康书院的老旧设施让夏天更加难熬...',
                effects: { san: -2 }
            });
        }
        
        // 仲英义工检查（学年末）
        if (gameState.college === 'zhongying' && gameState.month === 8) {
            if (gameState.volunteerHoursThisYear < 5) {
                events.push({
                    id: 'volunteerPenalty',
                    name: '义工时长不足',
                    icon: '⚠️',
                    description: '仲英书院义工时长未达标，综测分受到严重影响！',
                    effects: { social: -30 }
                });
            }
        }
        
        // 南洋脱发事件（学期末）
        if (gameState.college === 'nanyang' && (gameState.month === 1 || gameState.month === 6)) {
            if (Math.random() < 0.5) {
                events.push({
                    id: 'hairLoss',
                    name: '脱发危机',
                    icon: '👴',
                    description: '高强度学习让你的发际线又后退了一些...',
                    effects: { charm: -5 }
                });
            }
        }
        
        return events;
    }
};

// ============================================
// 月末常规随机事件系统 - RandomEventManager
// ============================================
const RandomEventManager = {
    // 触发概率：60%
    triggerChance: 0.6,
    
    // 已触发的一次性事件（本轮游戏不再重复）
    triggeredOnceEvents: new Set(),
    
    // 事件库
    monthlyEvents: {
        // ============ 1. 校园生活类 ============
        takeoutStolen: {
            id: 'takeoutStolen',
            name: '深夜外卖被偷',
            icon: '📦',
            category: 'campus',
            description: '你的外卖放在宿舍楼下，回来发现不翼而飞了...',
            weight: 1,
            options: [
                {
                    text: '算了，再买一份',
                    icon: '💸',
                    effects: { money: -20, san: 2 },
                    message: '花钱消灾，心情反而好了一点'
                },
                {
                    text: '去保卫处查监控',
                    icon: '🔍',
                    effects: { energy: -2, san: -5 },
                    special: {
                        type: 'chance',
                        chance: 0.05,
                        successEffects: { san: 10 },
                        successMessage: '竟然真的找到了小偷！',
                        successAchievement: 'stolenLunch',
                        failMessage: '监控模糊看不清，白跑一趟...'
                    }
                }
            ]
        },
        
        speedBumpEvent: {
            id: 'speedBumpEvent',
            name: '校园减速带惊魂',
            icon: '🚲',
            category: 'campus',
            description: '骑着共享单车飞驰在校园里，前方出现一排减速带！',
            weight: 1,
            options: [
                {
                    text: '加速冲过去！',
                    icon: '💨',
                    effects: { san: -5 },
                    special: {
                        type: 'chance',
                        chance: 0.3,
                        successEffects: {},
                        successMessage: '你飞了起来！灵魂出窍的感觉...',
                        successAchievement: 'speedBump',
                        failMessage: '震得屁股疼，但成功冲过去了'
                    }
                },
                {
                    text: '捏刹车慢慢过',
                    icon: '🛑',
                    effects: {},
                    message: '稳稳当当，什么事都没有'
                }
            ]
        },
        
        darkCuisine: {
            id: 'darkCuisine',
            name: '在梧桐苑吃到"黑暗料理"',
            icon: '🍽️',
            category: 'campus',
            description: '打开餐盘，你看到了一道颜色可疑的菜品...',
            weight: 1,
            options: [
                {
                    text: '忍痛吃完',
                    icon: '😖',
                    effects: { energy: 2, san: -5 },
                    message: '虽然味道奇怪，但确实饱了...'
                },
                {
                    text: '倒掉去吃康桥',
                    icon: '🚶',
                    effects: { money: -15, san: 2 },
                    message: '康桥的饭菜果然还是香啊'
                }
            ]
        },
        
        // ============ 2. 学业挑战类 ============
        perfectDataSuspect: {
            id: 'perfectDataSuspect',
            name: '实验报告数据太完美被质疑',
            icon: '📊',
            category: 'academic',
            description: '大雾实验的报告提交后，老师把你叫到办公室，说数据"太过完美"...',
            weight: 1,
            options: [
                {
                    text: '据理力争',
                    icon: '💪',
                    effects: { social: 2 },
                    message: '你条理清晰地解释了实验过程，老师被说服了',
                    special: {
                        type: 'mastery',
                        value: 5
                    }
                },
                {
                    text: '低头认错，重做实验',
                    icon: '😔',
                    effects: { energy: -3 },
                    message: '你花了一整天重做实验，虽然累但学到了更多',
                    achievement: 'copyright'
                }
            ]
        },
        
        suddenRollCall: {
            id: 'suddenRollCall',
            name: '选修课老师突然点名',
            icon: '📢',
            category: 'academic',
            description: '选修课老师突然宣布要点名...',
            weight: 1.2,
            options: [
                {
                    text: '此时你正好在宿舍睡觉',
                    icon: '😴',
                    effects: { san: -5 },
                    special: {
                        type: 'mastery',
                        value: -10
                    },
                    message: '老师记下了你的名字，期末成绩可能受影响...'
                },
                {
                    text: '此时你正在教室',
                    icon: '✋',
                    effects: {},
                    special: {
                        type: 'mastery',
                        value: 5
                    },
                    message: '老师记住了你积极的态度！'
                }
            ]
        },
        
        luckyLibrarySeat: {
            id: 'luckyLibrarySeat',
            name: '在钱图抢到了带插座的座位',
            icon: '🔌',
            category: 'academic',
            description: '考试周的钱学森图书馆人满为患，你竟然抢到了传说中带插座的宝座！',
            weight: 0.8,
            options: [
                {
                    text: '疯狂学习',
                    icon: '📚',
                    effects: { san: -5 },
                    special: {
                        type: 'studyBoost',
                        value: 1.5,
                        message: '本月学习效率提高50%！'
                    },
                    message: '你进入了心流状态，知识疯狂涌入大脑'
                },
                {
                    text: '用来给手机充电玩游戏',
                    icon: '📱',
                    effects: { san: 10 },
                    special: {
                        type: 'mastery',
                        value: -5
                    },
                    message: '玩得很开心，但复习进度落下了...'
                }
            ]
        },
        
        // ============ 3. 社交与书院类 ============
        collegeMixer: {
            id: 'collegeMixer',
            name: '邻近书院举办联谊活动',
            icon: '🎉',
            category: 'social',
            description: '听说隔壁书院要举办联谊舞会，邀请了各书院同学参加...',
            weight: 1,
            options: [
                {
                    text: '盛装出席',
                    icon: '👔',
                    effects: { money: -50, social: 5 },
                    special: {
                        type: 'chance',
                        chance: 0.15,
                        successEffects: { charm: 10 },
                        successMessage: '你在舞会上遇到了心仪的人，交换了联系方式！',
                        successFlag: 'loveInterest',
                        failMessage: '虽然没有遇到特别的人，但交到了几个朋友'
                    }
                },
                {
                    text: '在宿舍打游戏',
                    icon: '🎮',
                    effects: { san: 5, social: -2 },
                    message: '游戏真好玩，谁要去什么联谊'
                }
            ]
        },
        
        volunteerUrgent: {
            id: 'volunteerUrgent',
            name: '义工工时告急',
            icon: '⏰',
            category: 'social',
            description: '学期末了，你发现义工工时还差很多！',
            weight: 1,
            collegeBoost: { zhongying: 2 }, // 仲英书院触发率翻倍
            options: [
                {
                    text: '周末去图书馆搬书',
                    icon: '📚',
                    effects: { energy: -4, social: 10 },
                    message: '虽然累得腰酸背痛，但工时终于补齐了'
                },
                {
                    text: '找学长代刷',
                    icon: '🤫',
                    effects: { money: -100 },
                    special: {
                        type: 'chance',
                        chance: 0.2,
                        successEffects: { social: 5 },
                        successMessage: '学长帮你搞定了，感谢好人',
                        failEffects: { social: -50, san: -20 },
                        failMessage: '被辅导员发现了！综测分大幅下降！'
                    }
                }
            ]
        },
        
        // ============ 4. 特殊交大梗类 ============
        floodedCampus: {
            id: 'floodedCampus',
            name: '暴雨导致主教学区积水',
            icon: '🌊',
            category: 'xjtu',
            description: '连续暴雨后，主楼前的路变成了一片"汪洋"...',
            weight: 0.8,
            conditions: { month: [6, 7, 8, 9] }, // 夏秋季节
            options: [
                {
                    text: '脱鞋涉水去上课',
                    icon: '🦶',
                    effects: { san: -10 },
                    message: '鞋袜全湿，但你还是准时到了教室',
                    achievement: 'rainySea'
                },
                {
                    text: '回宿舍"划船"',
                    icon: '🚣',
                    effects: { energy: -2, san: 10 },
                    message: '逃课一次又何妨，这种天气就该摸鱼'
                }
            ]
        },
        
        goddessBlessing: {
            id: 'goddessBlessing',
            name: '腾飞塔下的"不挂女神"显灵',
            icon: '🗿',
            category: 'xjtu',
            description: '考试周临近，你路过腾飞塔，忽然感觉那座雕像在对你微笑...',
            weight: 0.6,
            once: true, // 本轮游戏只触发一次
            conditions: { month: [1, 6, 12] }, // 考试月
            options: [
                {
                    text: '虔诚膜拜',
                    icon: '🙏',
                    effects: { money: -5, san: 5 },
                    special: {
                        type: 'examBonus',
                        value: 0.05,
                        message: '心中感到一丝安宁，仿佛考试会顺利'
                    },
                    message: '你买了一束花献上，心里踏实多了',
                    achievement: 'goddess'
                },
                {
                    text: '走近观察构造',
                    icon: '🔍',
                    effects: {},
                    special: {
                        type: 'mastery',
                        value: 3
                    },
                    message: '从艺术角度分析了雕塑的结构，似乎理解了什么'
                }
            ]
        },
        
        noCardEntry: {
            id: 'noCardEntry',
            name: '由于没带一卡通进不去校门',
            icon: '🎫',
            category: 'xjtu',
            description: '晚归后发现一卡通忘在宿舍了，保安叔叔不让进...',
            weight: 0.7,
            options: [
                {
                    text: '给室友打电话求救',
                    icon: '📞',
                    effects: { social: 1 },
                    message: '室友冒着寒风给你送来了卡，好兄弟！'
                },
                {
                    text: '绕道小北门尝试潜入',
                    icon: '🏃',
                    effects: { energy: -1 },
                    special: {
                        type: 'chance',
                        chance: 0.5,
                        successEffects: { san: 5 },
                        successMessage: '你成功翻墙进去了！',
                        successAchievement: 'casablanca',
                        failEffects: { san: -10 },
                        failMessage: '被巡逻保安发现，挨了一顿批评教育...'
                    }
                }
            ]
        },
        
        luckinAddiction: {
            id: 'luckinAddiction',
            name: '瑞幸咖啡买一送一',
            icon: '☕',
            category: 'campus',
            description: '手机弹出瑞幸的优惠券，买一送一的诱惑太大了...',
            weight: 0.9,
            options: [
                {
                    text: '拉室友一起买',
                    icon: '👥',
                    effects: { money: -15, san: 5, social: 1 },
                    message: '和室友一起喝咖啡聊天，感情更好了',
                    onSelect: () => AchievementSystem.recordLuckinVisit()
                },
                {
                    text: '忍住不买',
                    icon: '✋',
                    effects: { san: -2 },
                    message: '钱包保住了，但心里空空的'
                }
            ]
        },
        
        oldBookTrade: {
            id: 'oldBookTrade',
            name: '学长在群里卖二手书',
            icon: '📖',
            category: 'academic',
            description: '毕业学长在群里低价出售专业课教材和笔记...',
            weight: 0.8,
            options: [
                {
                    text: '赶紧下单抢购',
                    icon: '💰',
                    effects: { money: -30 },
                    special: {
                        type: 'mastery',
                        value: 8
                    },
                    message: '拿到了学长的笔记，上面全是重点标注！'
                },
                {
                    text: '去图书馆借就行',
                    icon: '📚',
                    effects: {},
                    message: '图书馆的书也够用了'
                }
            ]
        }
    },
    
    // 初始化
    init() {
        const saved = localStorage.getItem('xjtu_triggered_events');
        if (saved) {
            this.triggeredOnceEvents = new Set(JSON.parse(saved));
        }
    },
    
    // 保存状态
    save() {
        localStorage.setItem('xjtu_triggered_events', 
            JSON.stringify([...this.triggeredOnceEvents]));
    },
    
    // 重置（新游戏时调用）
    reset() {
        this.triggeredOnceEvents.clear();
        this.save();
    },
    
    // 检查事件条件
    checkConditions(event, gameState) {
        if (!event.conditions) return true;
        
        // 月份条件
        if (event.conditions.month && !event.conditions.month.includes(gameState.month)) {
            return false;
        }
        
        // 一次性事件检查
        if (event.once && this.triggeredOnceEvents.has(event.id)) {
            return false;
        }
        
        return true;
    },
    
    // 计算事件权重
    getEventWeight(event, gameState) {
        let weight = event.weight || 1;
        
        // 书院加成
        if (event.collegeBoost && event.collegeBoost[gameState.college]) {
            weight *= event.collegeBoost[gameState.college];
        }
        
        return weight;
    },
    
    // 获取可触发的事件列表
    getEligibleEvents(gameState) {
        return Object.values(this.monthlyEvents).filter(event => 
            this.checkConditions(event, gameState)
        );
    },
    
    // 按权重随机选择事件
    selectRandomEvent(gameState) {
        const eligible = this.getEligibleEvents(gameState);
        if (eligible.length === 0) return null;
        
        // 计算总权重
        let totalWeight = 0;
        const weightedEvents = eligible.map(event => {
            const weight = this.getEventWeight(event, gameState);
            totalWeight += weight;
            return { event, weight };
        });
        
        // 按权重随机选择
        let random = Math.random() * totalWeight;
        for (const { event, weight } of weightedEvents) {
            random -= weight;
            if (random <= 0) return event;
        }
        
        return eligible[0];
    },
    
    // 月末触发检查
    rollMonthlyEvent(gameState) {
        // 60%概率触发
        if (Math.random() > this.triggerChance) {
            return null;
        }
        
        return this.selectRandomEvent(gameState);
    },
    
    // 应用选项效果
    applyOptionEffects(option, gameState) {
        const changes = { ...option.effects };
        let message = option.message || '';
        let achievement = option.achievement;
        
        // 处理特殊效果
        if (option.special) {
            const special = option.special;
            
            switch (special.type) {
                case 'chance':
                    // 概率事件
                    if (Math.random() < special.chance) {
                        // 成功
                        Object.assign(changes, special.successEffects || {});
                        message = special.successMessage || message;
                        if (special.successAchievement) {
                            achievement = special.successAchievement;
                        }
                        if (special.successFlag) {
                            gameState[special.successFlag] = true;
                        }
                    } else {
                        // 失败
                        if (special.failEffects) {
                            Object.assign(changes, special.failEffects);
                        }
                        message = special.failMessage || message;
                    }
                    break;
                    
                case 'mastery':
                    // 掌握度变化
                    changes.mastery = special.value;
                    break;
                    
                case 'studyBoost':
                    // 学习效率加成
                    gameState.tempStudyBoost = special.value;
                    message += ` ${special.message || ''}`;
                    break;
                    
                case 'examBonus':
                    // 考试运气加成
                    gameState.examLuckBonus = (gameState.examLuckBonus || 0) + special.value;
                    message += ` ${special.message || ''}`;
                    break;
            }
        }
        
        // 应用基础效果
        if (changes.san) {
            gameState.san = Math.max(0, Math.min(100, gameState.san + changes.san));
        }
        if (changes.energy) {
            const energyCap = gameState.maxEnergy || 15;
            gameState.energy = Math.max(0, Math.min(energyCap, gameState.energy + changes.energy));
        }
        if (changes.money) {
            gameState.money = Math.max(0, gameState.money + changes.money);
        }
        if (changes.social) {
            gameState.social = Math.max(0, Math.min(100, gameState.social + changes.social));
        }
        if (changes.charm) {
            gameState.charm = Math.max(0, Math.min(100, (gameState.charm || 50) + changes.charm));
        }
        if (changes.mastery && gameState.currentCourses) {
            gameState.currentCourses.forEach(course => {
                course.mastery = Math.max(0, Math.min(100, course.mastery + changes.mastery));
            });
        }
        
        // 触发成就
        if (achievement) {
            AchievementSystem.unlock(achievement);
        }
        
        // 调用自定义回调
        if (option.onSelect && typeof option.onSelect === 'function') {
            option.onSelect(gameState);
        }
        
        return { changes, message, achievement };
    },
    
    // 标记一次性事件已触发
    markEventTriggered(eventId) {
        this.triggeredOnceEvents.add(eventId);
        this.save();
    },
    
    // 生成日志文本
    generateLogText(event, option, result, gameState) {
        const yearName = GameData.yearNames[gameState.year - 1];
        const monthStr = `${gameState.month}月`;
        
        let logText = `[${yearName} ${monthStr}] `;
        
        // 添加效果变化
        const effectParts = [];
        if (result.changes.san) {
            effectParts.push(`SAN${result.changes.san > 0 ? '+' : ''}${result.changes.san}`);
        }
        if (result.changes.energy) {
            effectParts.push(`体力${result.changes.energy > 0 ? '+' : ''}${result.changes.energy}`);
        }
        if (result.changes.money) {
            effectParts.push(`金币${result.changes.money > 0 ? '+' : ''}${result.changes.money}`);
        }
        if (result.changes.social) {
            effectParts.push(`综测${result.changes.social > 0 ? '+' : ''}${result.changes.social}`);
        }
        if (result.changes.mastery) {
            effectParts.push(`掌握度${result.changes.mastery > 0 ? '+' : ''}${result.changes.mastery}`);
        }
        
        logText += result.message;
        if (effectParts.length > 0) {
            logText += ` (${effectParts.join(', ')})`;
        }
        
        return logText;
    }
};

// 初始化
RandomEventManager.init();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventSystem, RandomEventManager };
}
