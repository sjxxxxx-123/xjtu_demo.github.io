/**
 * XJTU本科模拟器 - 游戏数据配置
 * 包含角色、书院、课程、行动等所有游戏数据
 */

const GameData = {
    // 出身背景配置
    backgrounds: {
        normal: {
            id: 'normal',
            name: '萌新小白',
            icon: '🌱',
            description: '无修正，平衡开局',
            modifiers: {
                gpa: 0,
                san: 0,
                social: 0,
                money: 0,
                studyEfficiency: 1.0,
                socialEfficiency: 1.0,
                monthlyMoney: 800,
                failThreshold: 60
            }
        },
        prodigy: {
            id: 'prodigy',
            name: '少年班神童',
            icon: '🧒',
            description: 'GPA 3.5起步，学习效率+20%，社交-10',
            modifiers: {
                gpa: 0.5,
                san: 0,
                social: -10,
                money: 0,
                studyEfficiency: 1.2,
                socialEfficiency: 0.9,
                monthlyMoney: 800,
                failThreshold: 60
            }
        },
        qianban: {
            id: 'qianban',
            name: '钱班大佬',
            icon: '📚',
            description: '全属性+5，卷王模式（挂科阈值提高）',
            modifiers: {
                gpa: 0.1,
                san: 5,
                social: 5,
                money: 200,
                studyEfficiency: 1.0,
                socialEfficiency: 1.0,
                monthlyMoney: 800,
                failThreshold: 70 // 更高的挂科阈值
            }
        },
        rich: {
            id: 'rich',
            name: '富家子弟',
            icon: '💰',
            description: '金币+2000，每月生活费翻倍',
            modifiers: {
                gpa: 0,
                san: 0,
                social: 0,
                money: 2000,
                studyEfficiency: 1.0,
                socialEfficiency: 1.0,
                monthlyMoney: 1600,
                failThreshold: 60
            }
        }
    },

    // 书院配置 - 9大书院
    colleges: {
        pengkang: {
            id: 'pengkang',
            name: '彭康书院',
            icon: '🏛️',
            description: '皇家地理，历史沉淀',
            campus: 'xingqing',
            // 直接作为collegeEffects的属性
            attendClassEnergy: -1, // 上课体力-1
            summerSanMultiplier: 1.2, // 夏季SAN恢复加成
            buffs: [
                { type: 'attendClassEnergy', value: -1, name: '皇家地理', desc: '离主楼、中1-3、康桥最近，上课体力消耗-1' }
            ],
            debuffs: [
                { type: 'summerSan', value: 1.2, name: '历史沉淀', desc: '宿舍设施较老，但夏季体育课SAN恢复+20%' }
            ],
            specialActions: ['taichi'],
            boundAchievement: 'PENGKANG_TAICHI'
        },
        wenzhi: {
            id: 'wenzhi',
            name: '文治书院',
            icon: '🏫',
            description: '一等文治，澡堂特权',
            campus: 'xingqing',
            socialInit: 10, // 初始综测+10
            bathSanMultiplier: 2, // 洗澡SAN翻倍
            buffs: [
                { type: 'socialInit', value: 10, name: '一等文治', desc: '以"硬汉"和"规矩"著称，初始综测+10' },
                { type: 'bathSanMultiplier', value: 2, name: '澡堂特权', desc: '拥有专属小澡堂，洗澡SAN回复量翻倍' }
            ],
            debuffs: [
                { type: 'lateChance', value: 0.05, name: '西区遥远', desc: '去东区上课有5%概率迟到' }
            ],
            specialActions: ['xiaozaotang'],
            boundAchievement: 'WENZHI_BATH'
        },
        zhongying: {
            id: 'zhongying',
            name: '仲英书院',
            icon: '🤝',
            description: '英仔义工，品阁自习',
            campus: 'xingqing',
            volunteerEfficiency: 2.0, // 志愿收益翻倍
            volunteerRequired: 3, // 每学期必须3次志愿
            buffs: [
                { type: 'volunteerEfficiency', value: 2.0, name: '英仔义工', desc: '唐仲英基金会支持，志愿活动收益+100%' }
            ],
            debuffs: [
                { type: 'volunteerRequired', value: 3, name: '工时地狱', desc: '每学期必须固定消耗3点体力用于义工，否则无法参加评优' }
            ],
            specialActions: ['pinge'],
            boundAchievement: 'ZHONGYING_PINGE'
        },
        nanyang: {
            id: 'nanyang',
            name: '南洋书院',
            icon: '🎯',
            description: '硬核工科，13楼传说',
            campus: 'xingqing',
            gpaEfficiency: 1.15, // GPA效率+15%
            nightStudySanLoss: 3, // 通宵自习额外SAN损失
            buffs: [
                { type: 'gpaEfficiency', value: 1.15, name: '硬核工科', desc: '电信、电气大神聚集地，GPA提升速度+15%' }
            ],
            debuffs: [
                { type: 'nightStudySanLoss', value: 3, name: '13楼传说', desc: '内卷严重，深夜自习时SAN额外-3' }
            ],
            specialActions: ['dong13'],
            boundAchievement: 'NANYANG_13F'
        },
        chongshi: {
            id: 'chongshi',
            name: '崇实书院',
            icon: '🎨',
            description: '文法艺术，中楼沙龙',
            campus: 'xingqing',
            charmInit: 20, // 魅力+20
            socialEnergyCost: -1, // 社交体力-1
            loveChanceBonus: 0.2, // 脱单几率+20%
            buffs: [
                { type: 'charmInit', value: 20, name: '文法艺术', desc: '人文、设计、人居背景，魅力值初始+20' },
                { type: 'socialEnergyCost', value: -1, name: '中楼沙龙', desc: '进行社团/社交活动时，体力消耗-1' },
                { type: 'loveChanceBonus', value: 0.2, name: '脱单加成', desc: '表白成功几率+20%' }
            ],
            debuffs: [],
            specialActions: ['zhonglou'],
            boundAchievement: 'CUPID_ARROW'
        },
        lizhi: {
            id: 'lizhi',
            name: '励志书院',
            icon: '🔬',
            description: '理学基石，星空间',
            campus: 'xingqing',
            logicGrowth: 1.2, // 逻辑科目成绩+20%
            starspaceBonus: true, // 星空间加成
            buffs: [
                { type: 'logicGrowth', value: 1.2, name: '理学基石', desc: '数学、物理、生命学院，智力/逻辑科目成绩+20%' },
                { type: 'starspaceBonus', value: true, name: '星空间', desc: '在星空间讨论学习时，有概率获得额外Mastery+5' }
            ],
            debuffs: [],
            specialActions: ['starspace'],
            boundAchievement: 'LIZHI_STARSPACE'
        },
        zonglian: {
            id: 'zonglian',
            name: '宗濂书院',
            icon: '⚕️',
            description: '杏林春暖，医学特权',
            campus: 'yanta',
            sickImmunity: true, // 生病免疫
            crossCampusEnergy: 2, // 跨校区额外体力
            buffs: [
                { type: 'sickImmunity', value: true, name: '医学特权', desc: '触发"生病"事件时，瞬间康复且不扣除体力' }
            ],
            debuffs: [
                { type: 'crossCampusEnergy', value: 2, name: '两岸四地', desc: '去兴庆校区办事需额外消耗2点体力' }
            ],
            specialActions: [],
            boundAchievement: 'FOUR_CAMPUS'
        },
        qide: {
            id: 'qide',
            name: '启德书院',
            icon: '💼',
            description: '经管天下，商业头脑',
            campus: 'yanta',
            moneyEfficiency: 1.3, // 金币收益+30%
            crossCampusEnergy: 2, // 跨校区额外体力
            buffs: [
                { type: 'moneyEfficiency', value: 1.3, name: '商业头脑', desc: '兼职/金币收益+30%' }
            ],
            debuffs: [
                { type: 'crossCampusEnergy', value: 2, name: '两岸四地', desc: '去兴庆校区办事需额外消耗2点体力' }
            ],
            specialActions: [],
            boundAchievement: 'FOUR_CAMPUS'
        },
        qianxuesen: {
            id: 'qianxuesen',
            name: '钱学森书院',
            icon: '🚀',
            description: '顶天立地，极限内卷',
            campus: 'xingqing',
            initialMastery: 15, // 初始掌握度+15
            gpaNoLimit: true, // GPA无上限
            extraCourses: 2, // 额外2门课程
            gpaThreshold: 3.5, // GPA低于3.5被警告
            buffs: [
                { type: 'initialMastery', value: 15, name: '顶天立地', desc: '全校精英，所有学科初始Mastery+15' },
                { type: 'gpaNoLimit', value: true, name: 'GPA无上限', desc: 'GPA获取无上限限制' }
            ],
            debuffs: [
                { type: 'extraCourses', value: 2, name: '极限内卷', desc: '每学期强制增加两门高难度课程' },
                { type: 'gpaThreshold', value: 3.5, name: '谈话警告', desc: '若GPA低于3.5，会触发"谈话"事件，有被清退风险' }
            ],
            specialActions: [],
            boundAchievement: 'QIAN_PERFECT'
        }
    },

    // 课程配置 - 按学年学期分配
    courses: {
        year1: {
            fall: [
                { id: 'math1', name: '高等数学(上)', credits: 5, difficulty: 0.8 },
                { id: 'english1', name: '大学英语(一)', credits: 3, difficulty: 0.5 },
                { id: 'physics1', name: '大学物理(上)', credits: 4, difficulty: 0.7 },
                { id: 'programming', name: 'C语言程序设计', credits: 3, difficulty: 0.6 },
                { id: 'pe1', name: '体育(一)', credits: 1, difficulty: 0.3 }
            ],
            spring: [
                { id: 'math2', name: '高等数学(下)', credits: 5, difficulty: 0.85 },
                { id: 'english2', name: '大学英语(二)', credits: 3, difficulty: 0.5 },
                { id: 'physics2', name: '大学物理(下)', credits: 4, difficulty: 0.75 },
                { id: 'linear', name: '线性代数', credits: 3, difficulty: 0.7 },
                { id: 'pe2', name: '体育(二)', credits: 1, difficulty: 0.3 }
            ]
        },
        year2: {
            fall: [
                { id: 'probability', name: '概率论与数理统计', credits: 3, difficulty: 0.75 },
                { id: 'english3', name: '大学英语(三)', credits: 3, difficulty: 0.55 },
                { id: 'datastructure', name: '数据结构', credits: 4, difficulty: 0.8 },
                { id: 'circuit', name: '电路原理', credits: 4, difficulty: 0.85 },
                { id: 'pe3', name: '体育(三)', credits: 1, difficulty: 0.3 }
            ],
            spring: [
                { id: 'signals', name: '信号与系统', credits: 4, difficulty: 0.85 },
                { id: 'english4', name: '大学英语(四)', credits: 3, difficulty: 0.6 },
                { id: 'digital', name: '数字电路', credits: 3, difficulty: 0.75 },
                { id: 'os', name: '操作系统', credits: 3, difficulty: 0.8 },
                { id: 'pe4', name: '体育(四)', credits: 1, difficulty: 0.3 }
            ]
        },
        year3: {
            fall: [
                { id: 'network', name: '计算机网络', credits: 3, difficulty: 0.75 },
                { id: 'database', name: '数据库原理', credits: 3, difficulty: 0.7 },
                { id: 'microcomputer', name: '微机原理', credits: 3, difficulty: 0.8 },
                { id: 'algorithm', name: '算法设计与分析', credits: 3, difficulty: 0.85 },
                { id: 'elective1', name: '专业选修课(一)', credits: 2, difficulty: 0.6 }
            ],
            spring: [
                { id: 'software', name: '软件工程', credits: 3, difficulty: 0.65 },
                { id: 'ai', name: '人工智能导论', credits: 3, difficulty: 0.75 },
                { id: 'embedded', name: '嵌入式系统', credits: 3, difficulty: 0.8 },
                { id: 'elective2', name: '专业选修课(二)', credits: 2, difficulty: 0.6 },
                { id: 'elective3', name: '专业选修课(三)', credits: 2, difficulty: 0.6 }
            ]
        }
    },

    // 小学期课程
    summerCourses: {
        year1: { id: 'metalwork', name: '金工实习', credits: 2, energyCost: 8, sanLoss: 10 },
        year2: { id: 'electronics', name: '电子实习', credits: 2, energyCost: 8, sanLoss: 10 },
        year3: { id: 'production', name: '生产实习', credits: 3, energyCost: 10, sanLoss: 12 }
    },

    // 自习地点
    studyLocations: {
        library: {
            id: 'library',
            name: '钱学森图书馆',
            icon: '📚',
            masteryBonus: 1.2,
            sanLoss: 2,
            description: '效果好但人多，需要抢座位'
        },
        mainBuilding: {
            id: 'mainBuilding',
            name: '主楼自习室',
            icon: '🏢',
            masteryBonus: 1.0,
            sanLoss: 2,
            description: '普通自习室',
            lostChance: 0.1 // 迷路概率
        },
        pinge: {
            id: 'pinge',
            name: '品阁自习室',
            icon: '☕',
            masteryBonus: 1.15,
            sanLoss: 1,
            description: '仲英书院专属，环境优雅',
            collegeRequired: 'zhongying'
        },
        dong13: {
            id: 'dong13',
            name: '东13自习室',
            icon: '🎯',
            masteryBonus: 1.1,
            sanLoss: 2,
            description: '南洋书院附近，传说有保研加成',
            collegeRequired: 'nanyang',
            baoyanChance: 0.1
        }
    },

    // 娱乐活动
    entertainments: {
        kangqiao: {
            id: 'kangqiao',
            name: '康桥苑聚餐',
            icon: '🍜',
            cost: 50,
            sanGain: 8,
            description: '和朋友在康桥苑大吃一顿'
        },
        xingqing: {
            id: 'xingqing',
            name: '兴庆宫划船',
            icon: '🚣',
            cost: 60,
            sanGain: 15,
            description: '去兴庆宫公园划船放松',
            seasonBonus: { spring: 5, fall: 5 } // 春秋季节额外SAN
        },
        wutong: {
            id: 'wutong',
            name: '梧桐咖啡馆',
            icon: '☕',
            cost: 35,
            sanGain: 6,
            description: '去梧桐三楼咖啡馆享受小资时光',
            achievement: 'xiaozi'
        },
        game: {
            id: 'game',
            name: '打游戏',
            icon: '🎮',
            cost: 0,
            sanGain: 10,
            description: '在宿舍打一晚上游戏'
        },
        movie: {
            id: 'movie',
            name: '看电影',
            icon: '🎬',
            cost: 40,
            sanGain: 12,
            description: '去校外看一场电影'
        }
    },

    // 约会地点
    dateLocations: {
        mainBuildingE: {
            id: 'mainBuildingE',
            name: '主楼E顶楼',
            icon: '🌃',
            cost: 0,
            sanGain: 20,
            description: '俯瞰校园夜景，浪漫满分'
        },
        sakura: {
            id: 'sakura',
            name: '樱花道',
            icon: '🌸',
            cost: 0,
            sanGain: 25,
            description: '春天樱花盛开的浪漫小道',
            seasonRequired: [3, 4] // 只在3-4月可选
        },
        tengfei: {
            id: 'tengfei',
            name: '腾飞塔下',
            icon: '🗼',
            cost: 20,
            sanGain: 15,
            description: '交大地标，打卡约会'
        },
        dinner: {
            id: 'dinner',
            name: '校外约饭',
            icon: '🍽️',
            cost: 150,
            sanGain: 18,
            description: '去校外餐厅吃一顿大餐'
        }
    },

    // 年级名称
    yearNames: ['大一', '大二', '大三', '大四'],
    
    // 学期名称
    semesterNames: {
        fall: '秋季学期',
        spring: '春季学期',
        summer: '小学期'
    },

    // 月份到学期的映射
    monthToSemester: {
        9: 'fall', 10: 'fall', 11: 'fall', 12: 'fall', 1: 'fall',
        2: 'spring', 3: 'spring', 4: 'spring', 5: 'spring', 6: 'spring',
        7: 'summer', 8: 'summer'
    },

    // 结局配置
    endings: {
        dropout: {
            id: 'dropout',
            name: '光荣肄业',
            icon: '😢',
            description: '挂科太多或精神崩溃，遗憾离开交大...',
            condition: (stats) => stats.failedCourses > 5 || stats.san <= 0
        },
        normal: {
            id: 'normal',
            name: '普通打工人',
            icon: '👔',
            description: '顺利毕业，成为一名普通的社会人。虽然平凡，但也是一种成功。',
            condition: (stats) => stats.gpa >= 2.0 && stats.gpa < 3.5
        },
        postgraduate: {
            id: 'postgraduate',
            name: '保研本校',
            icon: '🎓',
            description: '优秀的成绩让你获得了保研资格，继续在交大深造！',
            condition: (stats) => stats.gpa >= 3.5 && stats.social >= 80
        },
        excellent: {
            id: 'excellent',
            name: '六边形战士',
            icon: '🏆',
            description: '学业、社交、科研全面发展！你是交大的骄傲，国奖大神！',
            condition: (stats) => stats.gpa >= 4.0 && stats.social >= 95 && stats.nationalScholarship
        },
        westward: {
            id: 'westward',
            name: '西迁传人',
            icon: '🌟',
            description: '你选择了支教或选调，继承西迁精神，到祖国最需要的地方去！',
            condition: (stats) => stats.westwardPath
        }
    },

    // GPA转换表
    gradeToGpa: {
        'A+': 4.3, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D': 1.0, 'F': 0
    },

    // 分数到等级的转换
    scoreToGrade: (score) => {
        if (score >= 95) return 'A+';
        if (score >= 90) return 'A';
        if (score >= 85) return 'A-';
        if (score >= 80) return 'B+';
        if (score >= 75) return 'B';
        if (score >= 70) return 'B-';
        if (score >= 65) return 'C+';
        if (score >= 60) return 'C';
        if (score >= 55) return 'C-';
        if (score >= 50) return 'D';
        return 'F';
    }
};

// 导出（如果需要模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameData;
}
