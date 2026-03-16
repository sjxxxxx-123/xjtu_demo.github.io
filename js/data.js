// author: sjxxxx
/**
 * 鲜椒本科模拟器 - 游戏数据配置
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
            description: '坐拥兴庆C位，出门即是康桥。当你挥起金工实习的小锤，才听懂这历史沉淀的回响。',
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
            description: '号称一等文治，却需练就横穿东西区的腿力。在唐公园的晚风里，没人比你更懂距离产生美。',
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
            description: '品阁的咖啡香气，掩不住理工男的荷尔蒙。在为之光照耀下，只有兄弟情谊比综测分更坚固。',
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
            description: '紧邻梧桐的碳水快乐，难挡东十三的保研诱惑。这里的灯光，见证过无数个凌晨四点的代码。',
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
            description: '以画笔重构世界的人文飞地。唯有通宵赶图的深夜，你才会思考发际线与艺术哪个更重要。',
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
            description: '这里没有早睡，只有早起。在西工大隔壁仰望星空，用钢铁意志证明：不谈恋爱的大学生活更加硬核。',
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
            description: '雁塔校区的最后倔强。在福尔马林与《系统解剖学》的夹击下，发量是衡量学术水平的唯一标准。',
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
            description: '为了挤上早八的校车，你练就了短跑国家队的爆发力。在这里，每一张钞票和每一根血管都被解构得明明白白。',
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
            description: '如果GPA 3.8是普通人的天花板，那只是这里新生的起跑线。哪怕是做梦，梦里都在推导拉格朗日中值定理。',
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
                { id: 'math1', name: '高等数学(上)', credits: 5, difficulty: 0.8, type: 'major' },
                { id: 'english1', name: '大学英语(一)', credits: 3, difficulty: 0.5, type: 'general' },
                { id: 'physics1', name: '大学物理(上)', credits: 4, difficulty: 0.7, type: 'major' },
                { id: 'programming', name: 'C语言程序设计', credits: 3, difficulty: 0.6, type: 'major' },
                { id: 'pe1', name: '体育(一)', credits: 1, difficulty: 0.3, type: 'pe' }
            ],
            spring: [
                { id: 'math2', name: '高等数学(下)', credits: 5, difficulty: 0.85, type: 'major' },
                { id: 'english2', name: '大学英语(二)', credits: 3, difficulty: 0.5, type: 'general' },
                { id: 'physics2', name: '大学物理(下)', credits: 4, difficulty: 0.75, type: 'major' },
                { id: 'linear', name: '线性代数', credits: 3, difficulty: 0.7, type: 'major' },
                { id: 'pe2', name: '体育(二)', credits: 1, difficulty: 0.3, type: 'pe' }
            ]
        },
        year2: {
            fall: [
                { id: 'probability', name: '概率论与数理统计', credits: 3, difficulty: 0.75, type: 'major' },
                { id: 'english3', name: '大学英语(三)', credits: 3, difficulty: 0.55, type: 'general' },
                { id: 'datastructure', name: '数据结构', credits: 4, difficulty: 0.8, type: 'major' },
                { id: 'circuit', name: '电路原理', credits: 4, difficulty: 0.85, type: 'major' },
                { id: 'pe3', name: '体育(三)', credits: 1, difficulty: 0.3, type: 'pe' }
            ],
            spring: [
                { id: 'signals', name: '信号与系统', credits: 4, difficulty: 0.85, type: 'major' },
                { id: 'english4', name: '大学英语(四)', credits: 3, difficulty: 0.6, type: 'general' },
                { id: 'digital', name: '数字电路', credits: 3, difficulty: 0.75, type: 'major' },
                { id: 'os', name: '操作系统', credits: 3, difficulty: 0.8, type: 'major' },
                { id: 'pe4', name: '体育(四)', credits: 1, difficulty: 0.3, type: 'pe' }
            ]
        },
        year3: {
            fall: [
                { id: 'network', name: '计算机网络', credits: 3, difficulty: 0.75, type: 'major' },
                { id: 'database', name: '数据库原理', credits: 3, difficulty: 0.7, type: 'major' },
                { id: 'microcomputer', name: '微机原理', credits: 3, difficulty: 0.8, type: 'major' },
                { id: 'algorithm', name: '算法设计与分析', credits: 3, difficulty: 0.85, type: 'major' },
                { id: 'elective1', name: '专业选修课(一)', credits: 2, difficulty: 0.6, type: 'elective' }
            ],
            spring: [
                { id: 'software', name: '软件工程', credits: 3, difficulty: 0.65, type: 'major' },
                { id: 'ai', name: '人工智能导论', credits: 3, difficulty: 0.75, type: 'major' },
                { id: 'embedded', name: '嵌入式系统', credits: 3, difficulty: 0.8, type: 'major' },
                { id: 'elective2', name: '专业选修课(二)', credits: 2, difficulty: 0.6, type: 'elective' },
                { id: 'elective3', name: '专业选修课(三)', credits: 2, difficulty: 0.6, type: 'elective' }
            ]
        }
    },

    // 小学期课程 - 通用
    summerCourses: {
        year1: { id: 'metalwork', name: '金工实习', credits: 2, energyCost: 8, sanLoss: 10 },
        year2: { id: 'electronics', name: '电子实习', credits: 2, energyCost: 8, sanLoss: 10 },
        year3: { id: 'production', name: '生产实习', credits: 3, energyCost: 10, sanLoss: 12 }
    },

    // 书院个性化小学期课程
    collegeSummerCourses: {
        pengkang: {
            year1: { id: 'metalwork_pk', name: '金工实习(打小锤子)', credits: 2, energyCost: 10, sanLoss: 15, description: '彭康传统，打小锤子打到手疼' },
            year2: { id: 'thermlab', name: '热力学实验周', credits: 2, energyCost: 8, sanLoss: 12 },
            year3: { id: 'production', name: '生产实习', credits: 3, energyCost: 10, sanLoss: 12 }
        },
        wenzhi: {
            year1: { id: 'metalwork_wz', name: '金工实习(打小锤子)', credits: 2, energyCost: 10, sanLoss: 15, description: '机械学子必经之路' },
            year2: { id: 'cadweek', name: '机械制图周', credits: 2, energyCost: 8, sanLoss: 15, description: '画图画到颈椎疼' },
            year3: { id: 'production', name: '生产实习', credits: 3, energyCost: 10, sanLoss: 12 }
        },
        nanyang: {
            year1: { id: 'programming_week', name: '程序设计周', credits: 2, energyCost: 8, sanLoss: 12, description: '写代码写到眼花' },
            year2: { id: 'circuit_week', name: '电路实验周', credits: 2, energyCost: 10, sanLoss: 18, description: '深夜调电路' },
            year3: { id: 'production', name: '生产实习', credits: 3, energyCost: 10, sanLoss: 12 }
        },
        zhongying: {
            year1: { id: 'programming_week_zy', name: '程序设计周', credits: 2, energyCost: 8, sanLoss: 12, description: 'Teamwork写代码' },
            year2: { id: 'management_practice', name: '管理实践周', credits: 2, energyCost: 6, sanLoss: 8, description: '小组合作项目' },
            year3: { id: 'social_practice', name: '社会实践', credits: 3, energyCost: 8, sanLoss: 10, description: '调研与实习' }
        },
        chongshi: {
            year1: { id: 'social_practice_cs', name: '社会实践', credits: 2, energyCost: 6, sanLoss: 8, description: '田野调研' },
            year2: { id: 'design_week', name: '设计周', credits: 2, energyCost: 8, sanLoss: 15, description: '熬夜画图赶稿' },
            year3: { id: 'art_practice', name: '艺术实践', credits: 3, energyCost: 8, sanLoss: 12 }
        },
        lizhi: {
            year1: { id: 'math_seminar', name: '数学研讨班', credits: 2, energyCost: 6, sanLoss: 10, description: '纯逻辑挑战' },
            year2: { id: 'physics_exp', name: '物理实验强化', credits: 2, energyCost: 8, sanLoss: 12 },
            year3: { id: 'research_training', name: '科研训练', credits: 3, energyCost: 10, sanLoss: 15 }
        },
        zonglian: {
            year1: { id: 'anatomy_practice', name: '解剖实习', credits: 2, energyCost: 8, sanLoss: 15, description: '背诵地狱开始' },
            year2: { id: 'clinical_practice', name: '临床见习', credits: 2, energyCost: 10, sanLoss: 12 },
            year3: { id: 'hospital_intern', name: '医院实习', credits: 3, energyCost: 12, sanLoss: 15 }
        },
        qide: {
            year1: { id: 'social_practice_qd', name: '社会实践', credits: 2, energyCost: 6, sanLoss: 8, description: '商业调研' },
            year2: { id: 'business_simulation', name: '商业模拟', credits: 2, energyCost: 6, sanLoss: 8, description: '模拟经营' },
            year3: { id: 'internship', name: '企业实习', credits: 3, energyCost: 8, sanLoss: 10 }
        },
        qianxuesen: {
            year1: { id: 'research_intro', name: '科研训练(基础)', credits: 2, energyCost: 10, sanLoss: 15, description: '提前进实验室' },
            year2: { id: 'research_advanced', name: '科研训练(进阶)', credits: 2, energyCost: 10, sanLoss: 18, description: '论文与项目' },
            year3: { id: 'research_project', name: '科研创新项目', credits: 3, energyCost: 12, sanLoss: 20 }
        }
    },

    // 书院专属核心课程
    collegeCourses: {
        // 钱学森书院 - 困难模式
        qianxuesen: {
            year1: {
                fall: [
                    { id: 'qxs_engmath1', name: '工程数学集群(上)', credits: 5, difficulty: 0.95, type: 'college_core', decayRate: 1.5, description: '难度A+，掌握度衰减快' },
                    { id: 'qxs_mechanics', name: '力学分析基础', credits: 4, difficulty: 0.9, type: 'college_core', decayRate: 1.3 }
                ],
                spring: [
                    { id: 'qxs_engmath2', name: '工程数学集群(下)', credits: 5, difficulty: 0.95, type: 'college_core', decayRate: 1.5 },
                    { id: 'qxs_quantum', name: '量子物理初步', credits: 4, difficulty: 0.95, type: 'college_core', decayRate: 1.4 }
                ]
            },
            year2: {
                fall: [
                    { id: 'qxs_thermo', name: '工程热力学', credits: 4, difficulty: 0.9, type: 'college_core', decayRate: 1.3 },
                    { id: 'qxs_materials', name: '材料力学', credits: 4, difficulty: 0.85, type: 'college_core' }
                ],
                spring: [
                    { id: 'qxs_control', name: '自动控制原理', credits: 4, difficulty: 0.9, type: 'college_core', decayRate: 1.3 },
                    { id: 'qxs_electromagnetic', name: '电磁场理论', credits: 4, difficulty: 0.9, type: 'college_core' }
                ]
            },
            year3: {
                fall: [
                    { id: 'qxs_aerospace', name: '航空航天概论', credits: 3, difficulty: 0.8, type: 'college_core' },
                    { id: 'qxs_numerical', name: '数值分析', credits: 3, difficulty: 0.85, type: 'college_core' }
                ],
                spring: [
                    { id: 'qxs_system', name: '系统工程', credits: 3, difficulty: 0.8, type: 'college_core' },
                    { id: 'qxs_optimization', name: '最优化方法', credits: 3, difficulty: 0.85, type: 'college_core' }
                ]
            }
        },

        // 南洋书院 - 电信/电气/计算机
        nanyang: {
            year1: {
                fall: [
                    { id: 'ny_circuit1', name: '电路分析基础(上)', credits: 4, difficulty: 0.85, type: 'college_core', labIntensive: true },
                    { id: 'ny_cpp', name: 'C++程序设计', credits: 3, difficulty: 0.7, type: 'college_core' }
                ],
                spring: [
                    { id: 'ny_circuit2', name: '电路分析基础(下)', credits: 4, difficulty: 0.9, type: 'college_core', labIntensive: true },
                    { id: 'ny_digital', name: '数字逻辑', credits: 3, difficulty: 0.75, type: 'college_core' }
                ]
            },
            year2: {
                fall: [
                    { id: 'ny_signals', name: '信号与系统', credits: 4, difficulty: 0.9, type: 'college_core', labIntensive: true },
                    { id: 'ny_analog', name: '模拟电子技术', credits: 4, difficulty: 0.85, type: 'college_core' }
                ],
                spring: [
                    { id: 'ny_microcomputer', name: '微机原理与接口', credits: 4, difficulty: 0.85, type: 'college_core', labIntensive: true },
                    { id: 'ny_electromagnetic', name: '电磁场与电磁波', credits: 3, difficulty: 0.85, type: 'college_core' }
                ]
            },
            year3: {
                fall: [
                    { id: 'ny_dsp', name: '数字信号处理', credits: 3, difficulty: 0.85, type: 'college_core' },
                    { id: 'ny_communication', name: '通信原理', credits: 4, difficulty: 0.8, type: 'college_core' }
                ],
                spring: [
                    { id: 'ny_embedded', name: '嵌入式系统设计', credits: 3, difficulty: 0.8, type: 'college_core', labIntensive: true },
                    { id: 'ny_vlsi', name: 'VLSI设计基础', credits: 3, difficulty: 0.85, type: 'college_core' }
                ]
            }
        },

        // 彭康书院 - 能源/动力/理学
        pengkang: {
            year1: {
                fall: [
                    { id: 'pk_mechanics1', name: '理论力学(上)', credits: 4, difficulty: 0.8, type: 'college_core', calcIntensive: true },
                    { id: 'pk_drawing', name: '工程制图', credits: 3, difficulty: 0.65, type: 'college_core' }
                ],
                spring: [
                    { id: 'pk_mechanics2', name: '理论力学(下)', credits: 4, difficulty: 0.85, type: 'college_core', calcIntensive: true },
                    { id: 'pk_materials', name: '材料力学', credits: 4, difficulty: 0.8, type: 'college_core' }
                ]
            },
            year2: {
                fall: [
                    { id: 'pk_thermo', name: '工程热力学', credits: 4, difficulty: 0.9, type: 'college_core', calcIntensive: true, isMountain: true },
                    { id: 'pk_fluid', name: '流体力学', credits: 4, difficulty: 0.85, type: 'college_core', calcIntensive: true, isMountain: true }
                ],
                spring: [
                    { id: 'pk_heat', name: '传热学', credits: 4, difficulty: 0.9, type: 'college_core', calcIntensive: true, isMountain: true },
                    { id: 'pk_machine', name: '机械设计基础', credits: 3, difficulty: 0.75, type: 'college_core' }
                ]
            },
            year3: {
                fall: [
                    { id: 'pk_turbine', name: '汽轮机原理', credits: 3, difficulty: 0.8, type: 'college_core' },
                    { id: 'pk_boiler', name: '锅炉原理', credits: 3, difficulty: 0.8, type: 'college_core' }
                ],
                spring: [
                    { id: 'pk_power', name: '热力发电厂', credits: 3, difficulty: 0.75, type: 'college_core' },
                    { id: 'pk_nuclear', name: '核能概论', credits: 3, difficulty: 0.8, type: 'college_core' }
                ]
            }
        },

        // 文治书院 - 机械/材料
        wenzhi: {
            year1: {
                fall: [
                    { id: 'wz_drawing1', name: '机械制图(上)', credits: 4, difficulty: 0.7, type: 'college_core', tiring: true, neckStrain: true },
                    { id: 'wz_mechanics1', name: '理论力学(上)', credits: 4, difficulty: 0.8, type: 'college_core' }
                ],
                spring: [
                    { id: 'wz_drawing2', name: '机械制图(下)', credits: 4, difficulty: 0.75, type: 'college_core', tiring: true, neckStrain: true },
                    { id: 'wz_mechanics2', name: '理论力学(下)', credits: 4, difficulty: 0.85, type: 'college_core' }
                ]
            },
            year2: {
                fall: [
                    { id: 'wz_materials_science', name: '材料科学基础', credits: 4, difficulty: 0.8, type: 'college_core' },
                    { id: 'wz_matmechanics', name: '材料力学', credits: 4, difficulty: 0.85, type: 'college_core', calcIntensive: true }
                ],
                spring: [
                    { id: 'wz_machinedesign', name: '机械设计', credits: 4, difficulty: 0.8, type: 'college_core', tiring: true },
                    { id: 'wz_manufacture', name: '机械制造基础', credits: 3, difficulty: 0.75, type: 'college_core' }
                ]
            },
            year3: {
                fall: [
                    { id: 'wz_control', name: '机械控制工程', credits: 3, difficulty: 0.8, type: 'college_core' },
                    { id: 'wz_cad', name: 'CAD/CAM技术', credits: 3, difficulty: 0.7, type: 'college_core', tiring: true }
                ],
                spring: [
                    { id: 'wz_robot', name: '机器人技术', credits: 3, difficulty: 0.75, type: 'college_core' },
                    { id: 'wz_auto', name: '自动化制造系统', credits: 3, difficulty: 0.75, type: 'college_core' }
                ]
            }
        },

        // 仲英书院 - 软件/化生/管理
        zhongying: {
            year1: {
                fall: [
                    { id: 'zy_datastructure', name: '数据结构', credits: 4, difficulty: 0.8, type: 'college_core', teamwork: true },
                    { id: 'zy_java', name: 'Java程序设计', credits: 3, difficulty: 0.7, type: 'college_core' }
                ],
                spring: [
                    { id: 'zy_management', name: '管理学原理', credits: 3, difficulty: 0.6, type: 'college_core', teamwork: true },
                    { id: 'zy_database', name: '数据库原理', credits: 3, difficulty: 0.75, type: 'college_core' }
                ]
            },
            year2: {
                fall: [
                    { id: 'zy_organic', name: '有机化学实验', credits: 4, difficulty: 0.75, type: 'college_core', teamwork: true, labIntensive: true },
                    { id: 'zy_software', name: '软件工程', credits: 3, difficulty: 0.7, type: 'college_core', teamwork: true }
                ],
                spring: [
                    { id: 'zy_accounting', name: '会计学基础', credits: 3, difficulty: 0.65, type: 'college_core' },
                    { id: 'zy_biochem', name: '生物化学', credits: 4, difficulty: 0.8, type: 'college_core' }
                ]
            },
            year3: {
                fall: [
                    { id: 'zy_project', name: '项目管理', credits: 3, difficulty: 0.65, type: 'college_core', teamwork: true },
                    { id: 'zy_ai', name: '人工智能导论', credits: 3, difficulty: 0.75, type: 'college_core' }
                ],
                spring: [
                    { id: 'zy_marketing', name: '市场营销', credits: 3, difficulty: 0.6, type: 'college_core', teamwork: true },
                    { id: 'zy_bigdata', name: '大数据分析', credits: 3, difficulty: 0.75, type: 'college_core' }
                ]
            }
        },

        // 励志书院 - 数学/物理
        lizhi: {
            year1: {
                fall: [
                    { id: 'lz_analysis1', name: '数学分析(上)', credits: 5, difficulty: 0.9, type: 'college_core', logicBased: true },
                    { id: 'lz_algebra1', name: '高等代数(上)', credits: 4, difficulty: 0.85, type: 'college_core', logicBased: true }
                ],
                spring: [
                    { id: 'lz_analysis2', name: '数学分析(下)', credits: 5, difficulty: 0.95, type: 'college_core', logicBased: true },
                    { id: 'lz_algebra2', name: '高等代数(下)', credits: 4, difficulty: 0.9, type: 'college_core', logicBased: true }
                ]
            },
            year2: {
                fall: [
                    { id: 'lz_analysis3', name: '数学分析(续)', credits: 4, difficulty: 0.95, type: 'college_core', logicBased: true },
                    { id: 'lz_abstract', name: '抽象代数', credits: 4, difficulty: 0.95, type: 'college_core', logicBased: true }
                ],
                spring: [
                    { id: 'lz_topology', name: '点集拓扑', credits: 3, difficulty: 0.9, type: 'college_core', logicBased: true },
                    { id: 'lz_ode', name: '常微分方程', credits: 3, difficulty: 0.85, type: 'college_core', logicBased: true }
                ]
            },
            year3: {
                fall: [
                    { id: 'lz_pde', name: '偏微分方程', credits: 3, difficulty: 0.9, type: 'college_core', logicBased: true },
                    { id: 'lz_functional', name: '泛函分析', credits: 3, difficulty: 0.95, type: 'college_core', logicBased: true }
                ],
                spring: [
                    { id: 'lz_probability', name: '概率论', credits: 3, difficulty: 0.85, type: 'college_core', logicBased: true },
                    { id: 'lz_numanalysis', name: '数值分析', credits: 3, difficulty: 0.8, type: 'college_core' }
                ]
            }
        },

        // 崇实书院 - 文法/建筑/设计
        chongshi: {
            year1: {
                fall: [
                    { id: 'cs_arch1', name: '建筑设计初步', credits: 4, difficulty: 0.65, type: 'college_core', timeConsuming: true, allNighter: true },
                    { id: 'cs_law', name: '法理学', credits: 3, difficulty: 0.6, type: 'college_core' }
                ],
                spring: [
                    { id: 'cs_arthistory', name: '中外艺术史', credits: 3, difficulty: 0.55, type: 'college_core' },
                    { id: 'cs_sketch', name: '设计素描', credits: 3, difficulty: 0.6, type: 'college_core', timeConsuming: true }
                ]
            },
            year2: {
                fall: [
                    { id: 'cs_arch2', name: '建筑设计(一)', credits: 4, difficulty: 0.7, type: 'college_core', timeConsuming: true, allNighter: true },
                    { id: 'cs_civil', name: '民法学', credits: 3, difficulty: 0.65, type: 'college_core' }
                ],
                spring: [
                    { id: 'cs_urban', name: '城市规划原理', credits: 3, difficulty: 0.65, type: 'college_core' },
                    { id: 'cs_design', name: '视觉传达设计', credits: 3, difficulty: 0.6, type: 'college_core', timeConsuming: true }
                ]
            },
            year3: {
                fall: [
                    { id: 'cs_arch3', name: '建筑设计(二)', credits: 4, difficulty: 0.75, type: 'college_core', timeConsuming: true, allNighter: true },
                    { id: 'cs_criminal', name: '刑法学', credits: 3, difficulty: 0.7, type: 'college_core' }
                ],
                spring: [
                    { id: 'cs_interior', name: '室内设计', credits: 3, difficulty: 0.65, type: 'college_core', timeConsuming: true },
                    { id: 'cs_landscape', name: '景观设计', credits: 3, difficulty: 0.65, type: 'college_core' }
                ]
            }
        },

        // 宗濂书院 - 基础医学/临床
        zonglian: {
            year1: {
                fall: [
                    { id: 'zl_anatomy', name: '系统解剖学', credits: 5, difficulty: 0.8, type: 'college_core', memorize: true, examWeekDouble: true },
                    { id: 'zl_histology', name: '组织学与胚胎学', credits: 3, difficulty: 0.75, type: 'college_core', memorize: true }
                ],
                spring: [
                    { id: 'zl_physiology', name: '生理学', credits: 4, difficulty: 0.85, type: 'college_core', memorize: true, examWeekDouble: true },
                    { id: 'zl_cellbio', name: '细胞生物学', credits: 3, difficulty: 0.75, type: 'college_core' }
                ]
            },
            year2: {
                fall: [
                    { id: 'zl_biochem', name: '生物化学', credits: 5, difficulty: 0.9, type: 'college_core', memorize: true, examWeekDouble: true },
                    { id: 'zl_pathology', name: '病理学', credits: 4, difficulty: 0.85, type: 'college_core', memorize: true }
                ],
                spring: [
                    { id: 'zl_pharmacology', name: '药理学', credits: 4, difficulty: 0.85, type: 'college_core', memorize: true },
                    { id: 'zl_immunology', name: '免疫学', credits: 3, difficulty: 0.8, type: 'college_core' }
                ]
            },
            year3: {
                fall: [
                    { id: 'zl_diagnostics', name: '诊断学', credits: 4, difficulty: 0.8, type: 'college_core', memorize: true },
                    { id: 'zl_internal', name: '内科学', credits: 4, difficulty: 0.85, type: 'college_core', memorize: true }
                ],
                spring: [
                    { id: 'zl_surgery', name: '外科学', credits: 4, difficulty: 0.85, type: 'college_core', memorize: true },
                    { id: 'zl_pediatrics', name: '儿科学', credits: 3, difficulty: 0.75, type: 'college_core' }
                ]
            }
        },

        // 启德书院 - 经管/口腔
        qide: {
            year1: {
                fall: [
                    { id: 'qd_accounting', name: '会计学', credits: 4, difficulty: 0.65, type: 'college_core', gpaMoneyBonus: true },
                    { id: 'qd_microecon', name: '微观经济学', credits: 3, difficulty: 0.7, type: 'college_core' }
                ],
                spring: [
                    { id: 'qd_macroecon', name: '宏观经济学', credits: 3, difficulty: 0.7, type: 'college_core' },
                    { id: 'qd_oral_anatomy', name: '口腔解剖生理学', credits: 4, difficulty: 0.75, type: 'college_core', memorize: true }
                ]
            },
            year2: {
                fall: [
                    { id: 'qd_finance', name: '财务管理', credits: 3, difficulty: 0.7, type: 'college_core', gpaMoneyBonus: true },
                    { id: 'qd_oral_material', name: '口腔材料学', credits: 3, difficulty: 0.7, type: 'college_core' }
                ],
                spring: [
                    { id: 'qd_statistics', name: '统计学', credits: 3, difficulty: 0.7, type: 'college_core' },
                    { id: 'qd_oral_histo', name: '口腔组织病理学', credits: 3, difficulty: 0.75, type: 'college_core' }
                ]
            },
            year3: {
                fall: [
                    { id: 'qd_investment', name: '投资学', credits: 3, difficulty: 0.7, type: 'college_core', gpaMoneyBonus: true },
                    { id: 'qd_oral_prosth', name: '口腔修复学', credits: 3, difficulty: 0.75, type: 'college_core' }
                ],
                spring: [
                    { id: 'qd_corporate', name: '公司金融', credits: 3, difficulty: 0.7, type: 'college_core' },
                    { id: 'qd_oral_surgery', name: '口腔颌面外科', credits: 3, difficulty: 0.8, type: 'college_core' }
                ]
            }
        }
    },

    // 通识必修课（每学期1门）
    generalCourses: {
        year1: {
            fall: { id: 'math_general1', name: '高等数学(上)', credits: 5, difficulty: 0.8, type: 'general_required' },
            spring: { id: 'math_general2', name: '高等数学(下)', credits: 5, difficulty: 0.85, type: 'general_required' }
        },
        year2: {
            fall: { id: 'physics_general1', name: '大学物理(上)', credits: 4, difficulty: 0.75, type: 'general_required' },
            spring: { id: 'physics_general2', name: '大学物理(下)', credits: 4, difficulty: 0.8, type: 'general_required' }
        },
        year3: {
            fall: { id: 'english_advanced', name: '学术英语', credits: 2, difficulty: 0.6, type: 'general_required' },
            spring: { id: 'politics', name: '毛概', credits: 3, difficulty: 0.5, type: 'general_required' }
        }
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
            cost: 30,
            sanGain: 10,
            description: '在宿舍打一晚上游戏（网费/皮肤开销）'
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
