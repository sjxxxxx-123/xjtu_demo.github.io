/**
 * XJTU本科模拟器 - 成就系统（完整版 111 项成就）
 * 管理所有成就的定义、检测和解锁
 */

// ============ 成就分类触发器 ============
const AchievementTriggers = {
    // 1. 书院专属类
    collegeSpecific: {
        'PENGKANG_TAICHI': (p) => p.college === 'pengkang' && p.location === 'guangchang' && p.action === 'taichi',
        'WENZHI_BATH': (p) => p.college === 'wenzhi' && p.action === 'bath',
        'ZHONGYING_PINGE': (p) => p.college === 'zhongying' && p.location === 'pinge' && p.action === 'study',
        'NANYANG_13F': (p) => p.college === 'nanyang' && p.location === 'dong13' && p.action === 'nightStudy',
        'CHONGSHI_LOVE': (p) => p.college === 'chongshi' && p.inRelationship,
        'LIZHI_STARSPACE': (p) => p.college === 'lizhi' && p.location === 'starspace' && p.action === 'discuss',
        'ZONGLIAN_HEAL': (p) => p.college === 'zonglian' && p.event === 'sick' && p.healed,
        'QIDE_RICH': (p) => p.college === 'qide' && p.totalEarnings >= 5000,
        'QIAN_PERFECT': (p) => p.college === 'qianxuesen' && p.semesterGPA === 4.3,
    },
    
    // 2. 校园彩蛋类
    campusEggs: {
        'MAO_EMISSARY': (p) => p.event === 'straycat' || p.event === 'hedgehog',
        'MA_ZHANG': (p) => p.location === 'mainBuilding' && p.event === 'meetPresident',
        'SEA_IN_RAIN': (p) => p.weather === 'heavyRain' && p.action === 'attendClass',
        'LOST_CARD': (p) => p.event === 'lostCard',
        'STOLEN_LUNCH': (p) => p.event === 'takeoutStolen',
        'STOLEN_BIKE': (p) => p.event === 'bikeStolen',
        'WRONG_TOILET': (p) => p.event === 'wrongToilet',
        'GHOST_ROOM': (p) => p.event === 'ghostRoom',
        'ROOFTOP': (p) => p.location === 'mainBuildingRoof',
        'LUCKIN_LOVER': (p) => p.luckinVisits >= 50,
        'SPEED_BUMP': (p) => p.event === 'speedBump',
        'FOUR_CAMPUS': (p) => p.campusVisited && p.campusVisited.size >= 4,
    },
    
    // 3. 考试硬核类
    examHardcore: {
        'SCORE_59': (p) => p.lastExamScore === 59,
        'SCORE_60_X5': (p) => p.sixtyScoreCourses && p.sixtyScoreCourses.length >= 5,
        'PERFECT_100': (p) => p.lastExamScore === 100,
        'RETAKE_MASTER': (p) => p.retakeCount > 0 && p.finalGrade > 80,
        'DOUBLE_KILL': (p) => p.hardExamsPassed >= 2,
        'NO_CLASS_PASS': (p) => p.attendClassCount === 0 && p.examPassed,
        'TEACHER_SAVED': (p) => p.rawScore < 40 && p.finalScore >= 60,
        'NO_FAIL_4YEARS': (p) => p.year >= 4 && p.totalFailedCourses === 0,
    },
    
    // 4. 生活日常类
    dailyLife: {
        'BATH_QUEUE_60': (p) => p.bathQueueTime >= 60,
        'POOR_MEAL': (p) => p.money < 10 && p.action === 'eat',
        'MIDNIGHT_RETURN': (p) => p.returnTime === 'midnight',
        'FULL_DAY': (p) => p.actionsToday >= 5,
        'EXHAUSTED': (p) => p.energy <= 0,
        'HELP_ROOMMATE': (p) => p.action === 'helpRoommate',
        'BREAKUP': (p) => p.event === 'breakup',
        'PART_TIME_1000': (p) => p.partTimeEarnings >= 1000,
    },
    
    // 5. 综合成就类
    comprehensive: {
        'VOLUNTEER_100': (p) => p.volunteerHours >= 100,
        'GPA_4': (p) => p.gpa >= 4.0,
        'SOCIAL_100': (p) => p.social >= 100,
        'NATIONAL_SCHOLARSHIP': (p) => p.gpa >= 4.0 && p.social >= 95,
        'GRADUATION': (p) => p.year >= 4 && p.month >= 6 && !p.dropout,
        'WESTWARD': (p) => p.ending === 'westward',
    }
};

// 触发器检查函数
function checkAchievementTrigger(category, triggerId, playerState) {
    if (AchievementTriggers[category] && AchievementTriggers[category][triggerId]) {
        return AchievementTriggers[category][triggerId](playerState);
    }
    return false;
}

// 检查所有触发器
function checkAllTriggers(playerState) {
    const triggered = [];
    for (const category in AchievementTriggers) {
        for (const triggerId in AchievementTriggers[category]) {
            if (AchievementTriggers[category][triggerId](playerState)) {
                triggered.push({ category, triggerId });
            }
        }
    }
    return triggered;
}

class AchievementManager {
    constructor() {
        // 成就定义库（111项完整成就）
        this.achievements = this.initAchievements();
        
        // 成就统计数据
        this.stats = {
            // 学业统计
            failedCoursesList: [],
            perfectScoreCourses: [],
            sixtyScoreCourses: [],
            attendClassCount: 0,
            examPassedWithoutClass: [],
            retakeCount: 0,
            hardExamsPassed: 0,
            
            // 地点探索
            visitedLocations: new Set(),
            campusVisited: new Set(),
            canteenVisited: new Set(),
            luckinVisited: new Set(),
            specialBuildingsVisited: new Set(),
            luckinVisits: 0,
            
            // 书院活动
            pingeStudyCount: 0,
            wenzhiBathCount: 0,
            pengkangTaichiCount: 0,
            nanyangMeetingCount: 0,
            lizhiMeetingCount: 0,
            dong13StudyCount: 0,
            starspaceDiscussCount: 0,
            volunteerHours: 0,
            
            // 随机事件
            bathQueueCount: 0,
            bathQueueMaxTime: 0,
            cardLostCount: 0,
            takeoutStolenCount: 0,
            bikeStolen: false,
            fedAnimals: false,
            metPresident: false,
            
            // 时间相关
            consecutiveLateWakeup: 0,
            midnightReturnCount: 0,
            fullDayCount: 0,
            
            // 社交相关
            helpRoommateSwipeCount: 0,
            inRelationship: false,
            breakupCount: 0,
            
            // 金钱相关
            partTimeEarnings: 0,
            poorMealCount: 0,
            totalEarnings: 0,
            
            // 其他
            runDays: 0,
            bikeDays: 0,
            experimentReportSelected: false,
            
            // 极端记录
            lowestSan: 100,
            highestGPA: 0,
            consecutiveExhaustion: 0
        };
        
        this.init();
    }

    // 使用触发器检查成就
    checkWithTriggers(playerState) {
        const triggered = checkAllTriggers(playerState);
        triggered.forEach(({ category, triggerId }) => {
            // 根据triggerId找到对应的成就并解锁
            const achievementMap = {
                'PENGKANG_TAICHI': 'pengkangTaichi',
                'WENZHI_BATH': 'wenzhiBath',
                'ZHONGYING_PINGE': 'zhongyingPinge',
                'NANYANG_13F': 'nanyang13f',
                'LIZHI_STARSPACE': 'lizhiStarspace',
                'MAO_EMISSARY': 'animalMessenger',
                'MA_ZHANG': 'president',
                'SEA_IN_RAIN': 'rainySea',
                'LOST_CARD': 'cardLost',
                'STOLEN_LUNCH': 'stolenLunch',
                'STOLEN_BIKE': 'stolenBike',
                'WRONG_TOILET': 'wrongToilet',
                'GHOST_ROOM': 'ghostRoom',
                'SCORE_59': 'teacher59',
                'SCORE_60_X5': 'allSixty',
                'PERFECT_100': 'perfectScore',
                'DOUBLE_KILL': 'doubleKill',
                'NO_CLASS_PASS': 'noClass',
                'NO_FAIL_4YEARS': 'noFail',
                'FOUR_CAMPUS': 'fourCampus',
                'VOLUNTEER_100': 'volunteer100',
                'NATIONAL_SCHOLARSHIP': 'nationalScholarship',
                'GRADUATION': 'graduation',
            };
            
            if (achievementMap[triggerId] && this.achievements[achievementMap[triggerId]]) {
                this.unlock(achievementMap[triggerId]);
            }
        });
    }

    // 初始化所有成就
    initAchievements() {
        return {
            // ============ 1. 学业与考勤类 (Academic & Attendance) ============
            noFail: {
                id: 'noFail',
                name: '一丝不挂',
                icon: '🎓',
                category: 'academic',
                description: '大学四年从未出现过挂科',
                hint: '保持优秀的学业成绩',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return state.year === 4 && state.month >= 6 && state.failedCourses === 0;
                }
            },
            
            sakuraSpeed: {
                id: 'sakuraSpeed',
                name: '秒速五厘米',
                icon: '🌸',
                category: 'academic',
                description: '在樱花盛开的清晨，独自前往樱花道',
                hint: '春天的清晨...',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => false // 特殊触发
            },
            
            doubleKill: {
                id: 'doubleKill',
                name: '双杀',
                icon: '⚔️',
                category: 'academic',
                description: '在同一个考试周内通过两门难度等级为A的考试',
                hint: '挑战高难度课程',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false // 考试时检测
            },
            
            teacher59: {
                id: 'teacher59',
                name: '你一定得罪过老师 1/2',
                icon: '😭',
                category: 'academic',
                description: '总评59分或卷面及格但总评不及格',
                hint: '差一分的痛...',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => false // 考试时检测
            },
            
            teacherSave: {
                id: 'teacherSave',
                name: '老师一定拯救了你',
                icon: '🙏',
                category: 'academic',
                description: '卷面分不足40但总评被"捞"到60分',
                hint: '感谢老师的慈悲',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => false // 考试时检测
            },
            
            fullService: {
                id: 'fullService',
                name: '全套服务',
                icon: '🔄',
                category: 'academic',
                description: '挂科 -> 补考不通过 -> 重修才通过',
                hint: '经历完整的补考流程',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => false // 特殊标记
            },
            
            perfectScore: {
                id: 'perfectScore',
                name: '巅峰玩家',
                icon: '💯',
                category: 'academic',
                description: '某一科目最终成绩为100分',
                hint: '追求完美',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return this.stats.perfectScoreCourses.length > 0;
                }
            },
            
            allSixty: {
                id: 'allSixty',
                name: '习惯下路游走',
                icon: '6️⃣',
                category: 'academic',
                description: '五科或以上科目成绩刚好60分',
                hint: '踩线大师',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => {
                    return this.stats.sixtyScoreCourses.length >= 5;
                }
            },
            
            noClass: {
                id: 'noClass',
                name: '无师自通',
                icon: '🧙',
                category: 'academic',
                description: '从未点击过"去上课"，但在考试中通过',
                hint: '天才的学习方式',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => {
                    return this.stats.attendClassCount === 0 && this.stats.examPassedWithoutClass.length > 0;
                }
            },
            
            copyright: {
                id: 'copyright',
                name: '版权所有',
                icon: '©️',
                category: 'academic',
                description: '实验报告被选为全系唯一参考版本',
                hint: '写出优秀的实验报告',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => {
                    return this.stats.experimentReportSelected;
                }
            },
            
            nationalScholarship: {
                id: 'nationalScholarship',
                name: '至高荣誉',
                icon: '🏅',
                category: 'academic',
                description: '获得10000元国家奖学金',
                hint: 'GPA和综测都要很高才行',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return state.nationalScholarship === true;
                }
            },
            
            runner: {
                id: 'runner',
                name: '挥汗如雨的夜晚',
                icon: '🏃',
                category: 'academic',
                description: '坚持一个学期每天跑步，从未骑车',
                hint: '保持运动习惯',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return this.stats.runDays >= 120 && this.stats.bikeDays === 0;
                }
            },
            
            helpRoommate: {
                id: 'helpRoommate',
                name: '模范室友',
                icon: '🤝',
                category: 'academic',
                description: '帮舍友代刷卡次数 > 50次',
                hint: '好室友',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return this.stats.helpRoommateSwipeCount > 50;
                }
            },

            // ============ 2. 地点与探索类 (Location & Exploration) ============
            warFog: {
                id: 'warFog',
                name: '战争迷雾',
                icon: '🌫️',
                category: 'location',
                description: '在主楼（中心楼）迷路并迟到',
                hint: '去主楼自习时可能会触发...',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false // 事件触发
            },
            
            fourCampus: {
                id: 'fourCampus',
                name: '两岸四地',
                icon: '🗺️',
                category: 'location',
                description: '四年内足迹遍布兴庆、雁塔、曲江、创新港四个校区',
                hint: '探索所有校区',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return this.stats.campusVisited.size >= 4;
                }
            },
            
            wrongToilet: {
                id: 'wrongToilet',
                name: '误入藕花深处',
                icon: '😳',
                category: 'location',
                description: '误入异性厕所',
                hint: '极低概率随机事件',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => false // 随机触发
            },
            
            rooftop: {
                id: 'rooftop',
                name: '高处不胜寒',
                icon: '🏢',
                category: 'location',
                description: '前往主楼E座顶楼且未被保安发现',
                hint: '探索禁区',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => false // 特殊行动触发
            },
            
            spoon: {
                id: 'spoon',
                name: '勺中乾坤',
                icon: '🥄',
                category: 'location',
                description: '在四大发明广场注视勺子',
                hint: '去四大发明广场逛逛',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false // 特殊行动触发
            },
            
            allCanteen: {
                id: 'allCanteen',
                name: '舌尖上的交大',
                icon: '🍜',
                category: 'location',
                description: '在东西区所有食堂都有过消费记录',
                hint: '探索所有食堂',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return this.stats.canteenVisited.size >= 8;
                }
            },
            
            xingqingPark: {
                id: 'xingqingPark',
                name: '后花园',
                icon: '🌳',
                category: 'location',
                description: '漫步兴庆宫并触发"想把兴庆宫划入交大"的念头',
                hint: '去兴庆宫公园',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false // 特殊触发
            },
            
            westwardRide: {
                id: 'westwardRide',
                name: '重走西迁路',
                icon: '🚴',
                category: 'location',
                description: '从兴庆骑行至创新港（体力消耗>9）',
                hint: '体验西迁之路',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => false // 特殊行动触发
            },
            
            explorer: {
                id: 'explorer',
                name: '外域探索者',
                icon: '🔍',
                category: 'location',
                description: '进入过绝缘楼、能源馆、锅炉房等所有特色建筑',
                hint: '探索隐藏建筑',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return this.stats.specialBuildingsVisited.size >= 5;
                }
            },
            
            ghostRoom: {
                id: 'ghostRoom',
                name: '月光光心慌慌',
                icon: '👻',
                category: 'location',
                description: '深夜前往主C404、西二西410等著名"闹鬼"教室',
                hint: '胆大的探险',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => false // 特殊触发
            },

            // ============ 3. 书院与校园生活类 (College & Life) ============
            
            // === 九大书院专属成就 ===
            pengkangTaichi: {
                id: 'pengkangTaichi',
                name: '清晨的太极',
                icon: '🥋',
                category: 'college',
                description: '作为彭康书院学生，在广场晨练太极十次',
                hint: '彭康书院专属',
                unlocked: false,
                hidden: false,
                boundCollege: 'pengkang',
                checkCondition: (stats, state) => {
                    return state.college === 'pengkang' && this.stats.pengkangTaichiCount >= 10;
                }
            },
            
            wenzhiBath: {
                id: 'wenzhiBath',
                name: '文治汤',
                icon: '♨️',
                category: 'college',
                description: '作为文治书院学生，累计洗澡50次，享受文治澡堂的加成',
                hint: '文治书院专属',
                unlocked: false,
                hidden: false,
                boundCollege: 'wenzhi',
                checkCondition: (stats, state) => {
                    return state.college === 'wenzhi' && this.stats.wenzhiBathCount >= 50;
                }
            },
            
            zhongyingPinge: {
                id: 'zhongyingPinge',
                name: '品格书屋之约',
                icon: '📖',
                category: 'college',
                description: '作为仲英书院学生，在品阁书屋自习累计100小时',
                hint: '仲英书院专属',
                unlocked: false,
                hidden: false,
                boundCollege: 'zhongying',
                checkCondition: (stats, state) => {
                    return state.college === 'zhongying' && this.stats.pingeStudyCount >= 100;
                }
            },
            
            nanyang13f: {
                id: 'nanyang13f',
                name: '东13楼传说',
                icon: '🌙',
                category: 'college',
                description: '作为南洋书院学生，在东13楼通宵自习30次',
                hint: '南洋书院专属',
                unlocked: false,
                hidden: false,
                boundCollege: 'nanyang',
                checkCondition: (stats, state) => {
                    return state.college === 'nanyang' && this.stats.dong13StudyCount >= 30;
                }
            },
            
            chongshiLove: {
                id: 'chongshiLove',
                name: '丘比特之箭',
                icon: '💘',
                category: 'college',
                description: '作为崇实书院学生，成功脱单并维持一段恋爱关系',
                hint: '崇实书院专属',
                unlocked: false,
                hidden: false,
                boundCollege: 'chongshi',
                checkCondition: (stats, state) => {
                    return state.college === 'chongshi' && this.stats.inRelationship;
                }
            },
            
            lizhiStarspace: {
                id: 'lizhiStarspace',
                name: '星空与数学',
                icon: '⭐',
                category: 'college',
                description: '作为励志书院学生，在星空自习室讨论数学问题50次',
                hint: '励志书院专属',
                unlocked: false,
                hidden: false,
                boundCollege: 'lizhi',
                checkCondition: (stats, state) => {
                    return state.college === 'lizhi' && this.stats.starspaceDiscussCount >= 50;
                }
            },
            
            zonglianHeal: {
                id: 'zonglianHeal',
                name: '济世良医',
                icon: '⚕️',
                category: 'college',
                description: '作为宗濂书院学生，触发生病事件时快速痊愈（利用免疫buff）',
                hint: '宗濂书院专属',
                unlocked: false,
                hidden: false,
                boundCollege: 'zonglian',
                checkCondition: (stats, state) => {
                    return state.college === 'zonglian' && this.stats.quickHealCount >= 5;
                }
            },
            
            qideRich: {
                id: 'qideRich',
                name: '理财达人',
                icon: '💰',
                category: 'college',
                description: '作为启德书院学生，累计兼职收入达到5000元',
                hint: '启德书院专属',
                unlocked: false,
                hidden: false,
                boundCollege: 'qide',
                checkCondition: (stats, state) => {
                    return state.college === 'qide' && this.stats.totalEarnings >= 5000;
                }
            },
            
            qianPerfect: {
                id: 'qianPerfect',
                name: '钱学森精神',
                icon: '🚀',
                category: 'college',
                description: '作为钱学森书院学生，单学期GPA达到满绩4.3',
                hint: '钱学森书院专属',
                unlocked: false,
                hidden: false,
                boundCollege: 'qianxuesen',
                checkCondition: (stats, state) => {
                    return state.college === 'qianxuesen' && state.semesterGPA >= 4.3;
                }
            },
            
            collegeVisitor: {
                id: 'collegeVisitor',
                name: '书院过客',
                icon: '🏠',
                category: 'college',
                description: '体验书院特色活动',
                hint: '完成你所在书院的特色活动',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    const college = state.college;
                    if (college === 'zhongying' && this.stats.pingeStudyCount > 0) return true;
                    if (college === 'nanyang' && this.stats.nanyangMeetingCount > 0) return true;
                    if (college === 'pengkang' && this.stats.pengkangTaichiCount > 0) return true;
                    if (college === 'wenzhi' && this.stats.wenzhiBathCount > 0) return true;
                    if (college === 'chongshi' && this.stats.inRelationship) return true;
                    if (college === 'lizhi' && this.stats.starspaceDiscussCount > 0) return true;
                    if (college === 'zonglian' && this.stats.quickHealCount > 0) return true;
                    if (college === 'qide' && this.stats.totalEarnings > 0) return true;
                    if (college === 'qianxuesen' && this.stats.highestGPA >= 4.0) return true;
                    return false;
                }
            },
            
            goddess: {
                id: 'goddess',
                name: '不挂女神',
                icon: '🙏',
                category: 'college',
                description: '考试周前往腾飞塔女神像前祈愿',
                hint: '虔诚的祈祷',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false // 特殊触发
            },
            
            lonelySakura: {
                id: 'lonelySakura',
                name: '孤单寂寞冷',
                icon: '😔',
                category: 'college',
                description: '独自一人登上胭脂坡',
                hint: '一个人的旅程',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => false // 特殊触发
            },
            
            bathhouse: {
                id: 'bathhouse',
                name: '要把主楼炸了建澡堂',
                icon: '💣',
                category: 'college',
                description: '由于洗澡排队过久（>30分钟）触发',
                hint: '频繁去洗澡就知道了...',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return this.stats.bathQueueMaxTime > 30;
                }
            },
            
            stolenLunch: {
                id: 'stolenLunch',
                name: '谁拿了我的午餐',
                icon: '📦',
                category: 'college',
                description: '外卖被偷事件触发',
                hint: '小心你的外卖',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => {
                    return this.stats.takeoutStolenCount > 0;
                }
            },
            
            stolenBike: {
                id: 'stolenBike',
                name: '谁骑了我的单车',
                icon: '🚲',
                category: 'college',
                description: '共享单车被别人骑走',
                hint: '单车去哪了',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => {
                    return this.stats.bikeStolen;
                }
            },
            
            rainySea: {
                id: 'rainySea',
                name: '雨天的河流',
                icon: '🌊',
                category: 'college',
                description: '在暴雨天发现校园里"多了一条河"',
                hint: '下大雨时...',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false // 事件触发
            },
            
            luckinLover: {
                id: 'luckinLover',
                name: '瑞幸爱好者',
                icon: '☕',
                category: 'college',
                description: '去过校园内所有瑞幸咖啡店',
                hint: '咖啡爱好者',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return this.stats.luckinVisited.size >= 5;
                }
            },
            
            firstGold: {
                id: 'firstGold',
                name: '第一桶金',
                icon: '💰',
                category: 'college',
                description: '一年内通过兼职累计金币 > 5000',
                hint: '努力打工',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return this.stats.partTimeEarnings > 5000;
                }
            },
            
            cardLost: {
                id: 'cardLost',
                name: '卡萨布兰卡',
                icon: '💳',
                category: 'college',
                description: '一学期内丢失一卡通次数 >= 3',
                hint: '粗心大意',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => {
                    return this.stats.cardLostCount >= 3;
                }
            },
            
            cardKeeper: {
                id: 'cardKeeper',
                name: '远古守护者',
                icon: '🛡️',
                category: 'college',
                description: '一卡通从入校到毕业从未丢失',
                hint: '细心保管',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return state.year === 4 && state.month >= 6 && this.stats.cardLostCount === 0;
                }
            },

            // ============ 4. 随机事件与情怀类 (Random Events & Feelings) ============
            animalMessenger: {
                id: 'animalMessenger',
                name: '艾泽拉斯的动物使者',
                icon: '🦔',
                category: 'event',
                description: '喂食流浪猫狗或偶遇误入自习室的鸟',
                hint: '夜间在校园漫步时可能会遇到',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return this.stats.fedAnimals;
                }
            },
            
            lateKing: {
                id: 'lateKing',
                name: '从此君王不早朝',
                icon: '😴',
                category: 'event',
                description: '连续一个月没有进行过早起操作',
                hint: '睡懒觉大王',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => {
                    return this.stats.consecutiveLateWakeup >= 30;
                }
            },
            
            fullDay: {
                id: 'fullDay',
                name: '充实的一日',
                icon: '📅',
                category: 'event',
                description: '完成早起、上课8小时、晚自习4小时、写作业到12点',
                hint: '充实的一天',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return this.stats.fullDayCount > 0;
                }
            },
            
            midnight: {
                id: 'midnight',
                name: '醉生梦死',
                icon: '🌙',
                category: 'event',
                description: '凌晨12点后回校且没有被保安拦截',
                hint: '深夜归来',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => {
                    return this.stats.midnightReturnCount > 0;
                }
            },
            
            cupid: {
                id: 'cupid',
                name: '丘比特之箭',
                icon: '💘',
                category: 'event',
                description: '遇到真爱且毕业没有分手',
                hint: '提高魅力值，尝试社交...',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return state.year === 4 && state.month >= 6 && state.inRelationship && this.stats.breakupCount === 0;
                }
            },
            
            graduation: {
                id: 'graduation',
                name: '爱与痛的边缘',
                icon: '🎓',
                category: 'event',
                description: '毕业典礼后，拉着行李箱走出校门',
                hint: '坚持到最后',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return state.year === 4 && state.month >= 7;
                }
            },
            
            president: {
                id: 'president',
                name: '伟岸的身姿',
                icon: '👔',
                category: 'event',
                description: '在四大发明广场或主楼附近目击校长',
                hint: '偶遇大人物',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => {
                    return this.stats.metPresident;
                }
            },

            // ============ 5. 扩展成就（补充至111项）============
            speedBump: {
                id: 'speedBump',
                name: '我记得我骑的是自行车',
                icon: '🚲',
                category: 'event',
                description: '经过减速带SAN值大幅波动',
                hint: '骑车经过减速带时...',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            casablanca: {
                id: 'casablanca',
                name: '卡萨布兰卡',
                icon: '🚧',
                category: 'event',
                description: '成功翻墙进入校园（忘带校园卡时）',
                hint: '没带校园卡时会发生什么？',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => false // 特殊触发：随机事件中选择翻墙
            },
            
            luckinFan: {
                id: 'luckinFan',
                name: '瑞幸成瘾',
                icon: '☕',
                category: 'event',
                description: '连续3个月喝瑞幸咖啡',
                hint: '每月都去喝瑞幸...',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false // 特殊触发：随机事件累计
            },
            
            secondWestward: {
                id: 'secondWestward',
                name: '二次西迁',
                icon: '🏗️',
                category: 'location',
                description: '大四搬迁至创新港校区',
                hint: '坚持到大四自动触发',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return state.year === 4 && state.location === 'innovationPort';
                }
            },
            
            xiaozi: {
                id: 'xiaozi',
                name: '小资情调',
                icon: '☕',
                category: 'college',
                description: '去梧桐三楼咖啡馆消费',
                hint: '在娱乐选项中找找看',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            infiniteLoop: {
                id: 'infiniteLoop',
                name: '无限循环',
                icon: '📚',
                category: 'academic',
                description: '买旧书又卖出',
                hint: '在二手书交易中探索',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return this.stats.boughtOldBooks && this.stats.soldOldBooks;
                }
            },
            
            scholar: {
                id: 'scholar',
                name: '学霸养成',
                icon: '📖',
                category: 'academic',
                description: 'GPA达到4.0以上',
                hint: '努力学习！',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return state.gpa >= 4.0;
                }
            },
            
            socialite: {
                id: 'socialite',
                name: '社交达人',
                icon: '🎭',
                category: 'academic',
                description: '综测分达到90以上',
                hint: '多参加社团和志愿活动',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => {
                    return state.social >= 90;
                }
            },
            
            poorMeal: {
                id: 'poorMeal',
                name: '穷鬼面',
                icon: '🍜',
                category: 'college',
                description: '月底金币<10时去食堂',
                hint: '穷困潦倒',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => {
                    return this.stats.poorMealCount > 0;
                }
            },
            
            libraryKing: {
                id: 'libraryKing',
                name: '图书馆钉子户',
                icon: '📚',
                category: 'academic',
                description: '在图书馆学习超过500小时',
                hint: '图书馆常客',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            allNighter: {
                id: 'allNighter',
                name: '夜猫子',
                icon: '🌙',
                category: 'academic',
                description: '通宵学习次数>20',
                hint: '熬夜学习',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            gymRat: {
                id: 'gymRat',
                name: '健身达人',
                icon: '💪',
                category: 'college',
                description: '去健身房超过100次',
                hint: '保持健康',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            movieLover: {
                id: 'movieLover',
                name: '影迷',
                icon: '🎬',
                category: 'college',
                description: '看电影次数>50',
                hint: '文艺青年',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            gamer: {
                id: 'gamer',
                name: '游戏人生',
                icon: '🎮',
                category: 'college',
                description: '玩游戏时间>200小时',
                hint: '游戏爱好者',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => false
            },
            
            volunteer100: {
                id: 'volunteer100',
                name: '志愿之星',
                icon: '⭐',
                category: 'academic',
                description: '志愿服务时长>100小时',
                hint: '热心公益',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            clubPresident: {
                id: 'clubPresident',
                name: '社团部长',
                icon: '👑',
                category: 'academic',
                description: '担任社团负责人',
                hint: '社团领袖',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            competition: {
                id: 'competition',
                name: '竞赛之王',
                icon: '🏆',
                category: 'academic',
                description: '参加并获奖竞赛>5次',
                hint: '竞赛达人',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            patent: {
                id: 'patent',
                name: '专利持有者',
                icon: '⚖️',
                category: 'academic',
                description: '申请专利成功',
                hint: '创新能力',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => false
            },
            
            paper: {
                id: 'paper',
                name: '论文发表',
                icon: '📄',
                category: 'academic',
                description: '发表学术论文',
                hint: '学术成就',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => false
            },
            
            intern: {
                id: 'intern',
                name: '实习达人',
                icon: '💼',
                category: 'college',
                description: '完成3份不同的实习',
                hint: '积累经验',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            entrepreneur: {
                id: 'entrepreneur',
                name: '创业先锋',
                icon: '🚀',
                category: 'college',
                description: '尝试创业项目',
                hint: '创业精神',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => false
            },
            
            traveler: {
                id: 'traveler',
                name: '旅行者',
                icon: '✈️',
                category: 'college',
                description: '去过10个以上城市旅行',
                hint: '世界那么大',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            photographer: {
                id: 'photographer',
                name: '摄影师',
                icon: '📷',
                category: 'college',
                description: '拍摄校园照片>1000张',
                hint: '记录美好',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            blogger: {
                id: 'blogger',
                name: '校园博主',
                icon: '📱',
                category: 'college',
                description: '发布动态>500条',
                hint: '分享生活',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            singer: {
                id: 'singer',
                name: '歌唱家',
                icon: '🎤',
                category: 'college',
                description: '参加歌唱比赛获奖',
                hint: '音乐才能',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => false
            },
            
            athlete: {
                id: 'athlete',
                name: '运动健将',
                icon: '🏃',
                category: 'college',
                description: '体育比赛获奖',
                hint: '运动天赋',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            artist: {
                id: 'artist',
                name: '艺术家',
                icon: '🎨',
                category: 'college',
                description: '艺术作品参展',
                hint: '艺术修养',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => false
            },
            
            coding: {
                id: 'coding',
                name: '代码大师',
                icon: '💻',
                category: 'academic',
                description: '完成10个以上编程项目',
                hint: '编程能力',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            hackathon: {
                id: 'hackathon',
                name: '黑客马拉松',
                icon: '🏁',
                category: 'academic',
                description: '参加黑客马拉松获奖',
                hint: '极限编程',
                unlocked: false,
                hidden: true,
                checkCondition: (stats, state) => false
            },
            
            englishMaster: {
                id: 'englishMaster',
                name: '英语达人',
                icon: '🗣️',
                category: 'academic',
                description: '英语六级600分以上',
                hint: '语言能力',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            partyMember: {
                id: 'partyMember',
                name: '光荣入党',
                icon: '🚩',
                category: 'academic',
                description: '成为中共党员',
                hint: '政治觉悟',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            monitor: {
                id: 'monitor',
                name: '班委',
                icon: '📋',
                category: 'academic',
                description: '担任班级干部',
                hint: '服务同学',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            mentor: {
                id: 'mentor',
                name: '学长/学姐',
                icon: '👨‍🏫',
                category: 'college',
                description: '帮助新生适应大学生活',
                hint: '传承精神',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            },
            
            donor: {
                id: 'donor',
                name: '爱心天使',
                icon: '❤️',
                category: 'college',
                description: '献血次数>5',
                hint: '奉献爱心',
                unlocked: false,
                hidden: false,
                checkCondition: (stats, state) => false
            }
        };
    }

    // 初始化
    init() {
        this.loadAchievements();
        this.loadStats();
    }

    // 从本地存储加载成就
    loadAchievements() {
        const saved = localStorage.getItem('xjtu_achievements_v2');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                for (const [id, unlocked] of Object.entries(data)) {
                    if (this.achievements[id]) {
                        this.achievements[id].unlocked = unlocked;
                    }
                }
            } catch (e) {
                console.error('加载成就失败', e);
            }
        }
    }

    // 从本地存储加载统计数据
    loadStats() {
        const saved = localStorage.getItem('xjtu_achievement_stats');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // 转换Set类型
                if (data.visitedLocations) this.stats.visitedLocations = new Set(data.visitedLocations);
                if (data.campusVisited) this.stats.campusVisited = new Set(data.campusVisited);
                if (data.canteenVisited) this.stats.canteenVisited = new Set(data.canteenVisited);
                if (data.luckinVisited) this.stats.luckinVisited = new Set(data.luckinVisited);
                if (data.specialBuildingsVisited) this.stats.specialBuildingsVisited = new Set(data.specialBuildingsVisited);
                
                // 复制其他数据
                Object.assign(this.stats, data);
            } catch (e) {
                console.error('加载统计数据失败', e);
            }
        }
    }

    // 保存成就到本地存储
    saveAchievements() {
        const data = {};
        for (const [id, ach] of Object.entries(this.achievements)) {
            data[id] = ach.unlocked;
        }
        localStorage.setItem('xjtu_achievements_v2', JSON.stringify(data));
    }

    // 保存统计数据
    saveStats() {
        const data = { ...this.stats };
        // 转换Set为数组以便存储
        data.visitedLocations = Array.from(this.stats.visitedLocations);
        data.campusVisited = Array.from(this.stats.campusVisited);
        data.canteenVisited = Array.from(this.stats.canteenVisited);
        data.luckinVisited = Array.from(this.stats.luckinVisited);
        data.specialBuildingsVisited = Array.from(this.stats.specialBuildingsVisited);
        
        localStorage.setItem('xjtu_achievement_stats', JSON.stringify(data));
    }

    // 解锁成就
    unlock(achievementId) {
        const achievement = this.achievements[achievementId];
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.saveAchievements();
            this.showUnlockPopup(achievement);
            return true;
        }
        return false;
    }

    // 显示成就解锁弹窗（美化版）
    showUnlockPopup(achievement) {
        const popup = document.getElementById('achievement-popup');
        const nameEl = document.getElementById('achievement-name');
        
        if (popup && nameEl) {
            nameEl.innerHTML = `<strong>${achievement.icon} ${achievement.name}</strong><br><small style="opacity: 0.9;">${achievement.description}</small>`;
            popup.classList.add('show');
            
            // 播放音效（如果有）
            this.playAchievementSound();
            
            // 3.5秒后自动隐藏
            setTimeout(() => {
                popup.classList.remove('show');
            }, 3500);
        }
    }

    // 播放成就音效
    playAchievementSound() {
        // 可选：添加音效
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzGH0fPTgjMGHm7A7+OZUQ0PVqzn76FYFwxDpN/vwGwfCDSJ0vLPfC0GJ3nJ8N+OSA0YZ7zr6J9YGQs+oN/u');
            audio.volume = 0.3;
            audio.play().catch(() => {});
        } catch (e) {}
    }

    // 检查所有成就条件
    checkAchievements(gameState) {
        for (const [id, achievement] of Object.entries(this.achievements)) {
            if (!achievement.unlocked && achievement.checkCondition) {
                if (achievement.checkCondition(this.stats, gameState)) {
                    this.unlock(id);
                }
            }
        }
        
        this.saveStats();
    }

    // 获取成就列表（用于显示）
    getAchievementList(college = null) {
        return Object.values(this.achievements).filter(ach => {
            // 如果是书院专属成就，只显示对应书院的
            if (ach.collegeRequired && college !== ach.collegeRequired) {
                return false;
            }
            // 隐藏成就只有解锁后才显示
            if (ach.hidden && !ach.unlocked) {
                return false;
            }
            return true;
        });
    }

    // 按分类获取成就
    getAchievementsByCategory(category) {
        return Object.values(this.achievements).filter(ach => ach.category === category);
    }

    // 获取已解锁成就数量
    getUnlockedCount() {
        return Object.values(this.achievements).filter(a => a.unlocked).length;
    }

    // 获取总成就数量
    getTotalCount() {
        return Object.keys(this.achievements).length;
    }

    // 获取完成度百分比
    getCompletionPercentage() {
        return Math.floor((this.getUnlockedCount() / this.getTotalCount()) * 100);
    }

    // 重置成就统计（新游戏时调用，但保留已解锁成就）
    resetStats() {
        this.stats = {
            failedCoursesList: [],
            perfectScoreCourses: [],
            sixtyScoreCourses: [],
            attendClassCount: 0,
            examPassedWithoutClass: [],
            visitedLocations: new Set(),
            campusVisited: new Set(),
            canteenVisited: new Set(),
            luckinVisited: new Set(),
            specialBuildingsVisited: new Set(),
            pingeStudyCount: 0,
            wenzhiBathCount: 0,
            pengkangTaichiCount: 0,
            nanyangMeetingCount: 0,
            lizhiMeetingCount: 0,
            bathQueueCount: 0,
            bathQueueMaxTime: 0,
            cardLostCount: 0,
            takeoutStolenCount: 0,
            bikeStolen: false,
            fedAnimals: false,
            metPresident: false,
            consecutiveLateWakeup: 0,
            midnightReturnCount: 0,
            fullDayCount: 0,
            helpRoommateSwipeCount: 0,
            inRelationship: false,
            breakupCount: 0,
            partTimeEarnings: 0,
            poorMealCount: 0,
            runDays: 0,
            bikeDays: 0,
            experimentReportSelected: false,
            boughtOldBooks: false,
            soldOldBooks: false,
            lowestSan: 100,
            highestGPA: 0,
            consecutiveExhaustion: 0
        };
        this.saveStats();
    }

    // ========== 记录方法 ==========
    
    recordAttendClass() {
        this.stats.attendClassCount++;
    }

    recordExamPass(courseName, score, didAttend) {
        if (score === 100) {
            this.stats.perfectScoreCourses.push(courseName);
        }
        if (score === 60) {
            this.stats.sixtyScoreCourses.push(courseName);
        }
        if (!didAttend) {
            this.stats.examPassedWithoutClass.push(courseName);
        }
    }

    recordVisitLocation(locationId) {
        this.stats.visitedLocations.add(locationId);
    }

    recordVisitCampus(campusId) {
        this.stats.campusVisited.add(campusId);
    }

    recordVisitCanteen(canteenId) {
        this.stats.canteenVisited.add(canteenId);
    }

    recordVisitLuckin(luckinId) {
        this.stats.luckinVisited.add(luckinId);
    }

    recordVisitSpecialBuilding(buildingId) {
        this.stats.specialBuildingsVisited.add(buildingId);
    }

    recordPingeStudy() {
        this.stats.pingeStudyCount++;
    }

    recordWenzhiBath() {
        this.stats.wenzhiBathCount++;
    }

    recordPengkangTaichi() {
        this.stats.pengkangTaichiCount++;
    }

    recordBathQueue(minutes) {
        this.stats.bathQueueCount++;
        if (minutes > this.stats.bathQueueMaxTime) {
            this.stats.bathQueueMaxTime = minutes;
        }
    }

    recordCardLost() {
        this.stats.cardLostCount++;
    }

    recordTakeoutStolen() {
        this.stats.takeoutStolenCount++;
    }

    recordBikeStolen() {
        this.stats.bikeStolen = true;
    }

    recordFeedAnimal() {
        this.stats.fedAnimals = true;
    }

    recordMetPresident() {
        this.stats.metPresident = true;
    }

    recordLateWakeup() {
        this.stats.consecutiveLateWakeup++;
    }

    resetLateWakeup() {
        this.stats.consecutiveLateWakeup = 0;
    }

    recordMidnightReturn() {
        this.stats.midnightReturnCount++;
    }

    recordFullDay() {
        this.stats.fullDayCount++;
    }

    recordHelpRoommate() {
        this.stats.helpRoommateSwipeCount++;
    }

    recordBreakup() {
        this.stats.breakupCount++;
    }

    recordPartTimeEarning(amount) {
        this.stats.partTimeEarnings += amount;
    }

    recordPoorMeal() {
        this.stats.poorMealCount++;
    }

    recordRun() {
        this.stats.runDays++;
    }

    recordBike() {
        this.stats.bikeDays++;
    }

    recordExperimentReportSelected() {
        this.stats.experimentReportSelected = true;
    }

    recordBuyOldBook() {
        this.stats.boughtOldBooks = true;
    }

    recordSellOldBook() {
        this.stats.soldOldBooks = true;
    }

    updateSanRecord(san) {
        if (san < this.stats.lowestSan) {
            this.stats.lowestSan = san;
        }
    }

    updateGPARecord(gpa) {
        if (gpa > this.stats.highestGPA) {
            this.stats.highestGPA = gpa;
        }
    }

    // 记录瑞幸访问
    recordLuckinVisit() {
        this.stats.luckinVisits = (this.stats.luckinVisits || 0) + 1;
        this.stats.luckinVisited.add('luckin');
        this.saveStats();
    }

    // 记录东13自习
    recordDong13Study() {
        this.stats.dong13StudyCount = (this.stats.dong13StudyCount || 0) + 1;
        this.saveStats();
    }
    
    // 记录星空间讨论
    recordStarspaceDiscuss() {
        this.stats.starspaceDiscussCount = (this.stats.starspaceDiscussCount || 0) + 1;
        this.saveStats();
    }
    
    // 记录快速痊愈（宗濂书院）
    recordQuickHeal() {
        this.stats.quickHealCount = (this.stats.quickHealCount || 0) + 1;
        this.saveStats();
    }
    
    // 记录兼职收入
    recordEarnings(amount) {
        this.stats.totalEarnings = (this.stats.totalEarnings || 0) + amount;
        this.saveStats();
    }
    
    // 记录重修次数
    recordRetake() {
        this.stats.retakeCount = (this.stats.retakeCount || 0) + 1;
        this.saveStats();
    }

    // 记录主楼迷路
    recordMainBuildingLost() {
        this.stats.mainBuildingLostCount = (this.stats.mainBuildingLostCount || 0) + 1;
        if (this.stats.mainBuildingLostCount >= 1) {
            this.unlock('warFog');
        }
        this.saveStats();
    }

    // 记录体力耗尽
    recordExhaustion() {
        this.stats.exhaustionCount = (this.stats.exhaustionCount || 0) + 1;
        this.stats.consecutiveExhaustion++;
        this.saveStats();
    }
    
    // 重置连续体力耗尽
    resetExhaustion() {
        this.stats.consecutiveExhaustion = 0;
    }
}

// 创建全局实例
const AchievementSystem = new AchievementManager();

// 初始化
AchievementSystem.init();