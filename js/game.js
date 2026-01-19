/**
 * XJTU本科模拟器 - 游戏主逻辑
 * 核心游戏循环、状态管理、UI交互
 */

class XJTUSimulator {
    constructor() {
        // 游戏状态
        this.state = null;
        this.selectedBackground = null;
        this.selectedCollege = null;
        
        // 初始化
        this.init();
    }

    // 初始化游戏
    init() {
        // 强制会话/刷新检查：必须从 index/character 跳转且是一次性令牌
        if (!sessionStorage.getItem('valid_session')) {
            console.warn('Illegal access or refresh detected. Redirecting to index.');
            window.location.href = 'index.html';
            return;
        }
        // 消费令牌，使得刷新页面后令牌失效，强制跳转
        sessionStorage.removeItem('valid_session');

        // 标记从game.html启动
        sessionStorage.setItem('game_active', 'true');
        
        // 检查是否有存档或新角色数据
        const savedState = localStorage.getItem('xjtu_game_state');
        const characterData = localStorage.getItem('xjtu_character');

        // 如果是直接刷新页面（没有新角色数据），尝试读取存档
        if (savedState && !characterData) {
            // 继续游戏
            this.state = JSON.parse(savedState);
            this.normalizeStateIntegers();
            this.selectedBackground = this.state.background;
            this.selectedCollege = this.state.college;
        } else if (characterData) {
            // 新游戏
            const character = JSON.parse(characterData);
            this.selectedBackground = character.background;
            this.selectedCollege = character.college;
            this.initGameState();
            this.normalizeStateIntegers();
            localStorage.removeItem('xjtu_character');
        } else {
            // 没有数据，说明既不是继续游戏也不是新游戏，可能是非法访问或数据丢失，返回首页
            window.location.href = 'index.html';
            return;
        }
        
        this.bindEvents();
        
        // 确保正确加载当前学期课程
        if (!this.state.currentCourses || this.state.currentCourses.length === 0) {
             this.loadSemesterCourses();
        }

        this.updateUI();
    }

    // 绑定事件
    bindEvents() {
        // 游戏界面按钮
        const btnMenu = document.getElementById('btn-menu');
        if (btnMenu) btnMenu.addEventListener('click', () => this.showGameMenu());
        
        const btnNextTurn = document.getElementById('btn-next-turn');
        if (btnNextTurn) btnNextTurn.addEventListener('click', () => this.nextTurn());

        // 行动按钮
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => this.performAction(btn.dataset.action));
        });

        // 菜单按钮
        const btnSave = document.getElementById('btn-save');
        if (btnSave) btnSave.addEventListener('click', () => {
             localStorage.setItem('xjtu_game_state', JSON.stringify(this.state));
             this.hideModal('game-menu');
             this.showMessage('保存成功', '游戏状态已更新');
        });
        
        // 设置按钮
        const settingsBtn = document.getElementById('btn-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.hideModal('game-menu');
                this.showSettingsModal();
            });
        }
        
        // 个人经历按钮
        const btnViewProfile = document.getElementById('btn-view-profile');
        if (btnViewProfile) {
            btnViewProfile.addEventListener('click', () => {
                console.log('Button btn-view-profile clicked');
                this.showProfileModal();
            });
        }

        const btnViewAchievements = document.getElementById('btn-view-achievements');
        if (btnViewAchievements) {
            btnViewAchievements.addEventListener('click', () => {
                 window.location.href = 'achievements.html?from=game';
            });
        }
            
        const btnQuit = document.getElementById('btn-quit');
        if (btnQuit) {
            btnQuit.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
        
        const btnCloseMenu = document.getElementById('btn-close-menu');
        if (btnCloseMenu) btnCloseMenu.addEventListener('click', () => this.hideModal('game-menu'));

        // Modal关闭按钮
        // 绑定所有 modal-close 类的按钮
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', function() {
                // 查找最近的 modal 父元素
                const modal = this.closest('.modal');
                if (modal) modal.classList.remove('active');
            });
        });
        
        // 绑定 specific modal confirm butons
        const modalConfirm = document.getElementById('modal-confirm');
        if (modalConfirm) modalConfirm.addEventListener('click', () => this.hideModal('modal'));
        
        const choiceClose = document.getElementById('choice-close');
        if (choiceClose) choiceClose.addEventListener('click', () => this.hideModal('choice-modal'));
        
        // 设置 Modal 相关
        const settingsClose = document.getElementById('settings-close');
        if (settingsClose) settingsClose.addEventListener('click', () => this.hideModal('settings-modal'));
        
        const settingsSave = document.getElementById('settings-save');
        if (settingsSave) {
            settingsSave.addEventListener('click', () => {
                // 移除 provider 选择
                const keyElem = document.getElementById('setting-api-key');
                const endpointElem = document.getElementById('setting-endpoint');
                
                const key = keyElem ? keyElem.value : '';
                const endpoint = endpointElem ? endpointElem.value : '';
                
                if (key) {
                    // 保存到 AI 模块，provider 固定为 deepseek
                    AIModule.saveUserConfig(key, 'deepseek', endpoint);
                    // 显示提示
                    this.showMessage('设置已保存', '配置已更新，将在下次请求时生效。');
                    this.hideModal('settings-modal');
                } else {
                    alert('请输入 API Key');
                }
            });
        }

        const examConfirm = document.getElementById('exam-confirm');
        if (examConfirm) examConfirm.addEventListener('click', () => this.handleExamConfirm());
        
        // 补考相关按钮
        const makeupConfirm = document.getElementById('makeup-confirm');
        if (makeupConfirm) makeupConfirm.addEventListener('click', () => this.confirmMakeupExam());
        
        const makeupResultConfirm = document.getElementById('makeup-result-confirm');
        if (makeupResultConfirm) makeupResultConfirm.addEventListener('click', () => this.hideModal('makeup-exam-result-modal'));
        
        // 事件结果确认按钮
        const resultConfirm = document.getElementById('result-confirm');
        if (resultConfirm) {
            resultConfirm.addEventListener('click', () => {
                this.hideModal('event-result-modal');
                this.updateUI();
            });
        }
        
        // ========== 新系统事件绑定 ==========
        // 选课确认按钮
        const confirmBiddingBtn = document.getElementById('confirm-bidding');
        if (confirmBiddingBtn) {
            confirmBiddingBtn.addEventListener('click', () => this.processCourseBidding());
        }
        
        // 体测确认按钮
        const physicalTestConfirmBtn = document.getElementById('physical-test-confirm');
        if (physicalTestConfirmBtn) {
            physicalTestConfirmBtn.addEventListener('click', () => this.hideModal('physical-test-modal'));
        }
        
        // 长远规划选择按钮
        document.querySelectorAll('.career-choice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const career = btn.dataset.career;
                this.selectCareerPath(career);
            });
        });
    }

    // 显示Modal
    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    // 隐藏Modal
    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    // 显示设置弹窗
    showSettingsModal() {
        // 读取当前配置回显
        const config = AIModule.getCurrentConfig();
        // 移除 provider 回显
        document.getElementById('setting-api-key').value = config.key || '';
        document.getElementById('setting-endpoint').value = config.endpoint || '';
        
        this.showModal('settings-modal');
    }

    // 初始化游戏状态
    initGameState() {
        const bg = GameData.backgrounds[this.selectedBackground];
        const college = GameData.colleges[this.selectedCollege];

        // 获取书院buff/debuff数值
        const getBuff = (type) => college.buffs?.find(b => b.type === type)?.value || 0;
        const getDebuff = (type) => college.debuffs?.find(d => d.type === type)?.value || 0;

        this.state = {
            // 基础属性
            gpa: 3.0 + bg.modifiers.gpa,
            san: 80 + bg.modifiers.san,
            energy: 10,
            maxEnergy: 10,
            social: 60 + bg.modifiers.social + (college.socialInit || 0), // 文治社交初始+10
            money: 1000 + bg.modifiers.money,
            charm: 50 + (college.charmInit || 0), // 崇实魅力初始+20

            // 时间
            year: 1,
            month: 9,
            totalMonths: 0,

            // 角色信息
            background: this.selectedBackground,
            college: this.selectedCollege,
            campus: college.campus || 'xingqing', // 校区

            // 效率修正
            studyEfficiency: bg.modifiers.studyEfficiency,
            socialEfficiency: bg.modifiers.socialEfficiency,
            gpaEfficiency: college.gpaEfficiency || 1, // 南洋GPA+15%
            monthlyMoney: bg.modifiers.monthlyMoney,
            failThreshold: bg.modifiers.failThreshold,
            
            // 书院特殊效果
            collegeEffects: {
                attendClassEnergy: college.attendClassEnergy || 0, // 彭康上课体力-1
                bathSanMultiplier: college.bathSanMultiplier || 1, // 文治澡堂2x
                summerSanMultiplier: college.summerSanMultiplier || 1, // 彭康夏季SAN*1.2
                volunteerEfficiency: college.volunteerEfficiency || 1, // 仲英志愿2x
                nightStudySanLoss: college.nightStudySanLoss || 0, // 南洋通宵SAN额外-3
                loveChanceBonus: college.loveChanceBonus || 0, // 崇实脱单+20%
                socialEnergyCost: college.socialEnergyCost || 0, // 崇实社交体力-1
                logicGrowth: college.logicGrowth || 1, // 励志逻辑科目+20%
                sickImmunity: college.sickImmunity || false, // 宗濂生病免疫
                crossCampusEnergy: college.crossCampusEnergy || 0, // 宗濂/启德跨校区+2体力
                moneyEfficiency: college.moneyEfficiency || 1, // 启德兼职收入+30%
                initialMastery: college.initialMastery || 0, // 钱班初始掌握+15
                gpaNoLimit: college.gpaNoLimit || false, // 钱班4.3无上限
                extraCourses: college.extraCourses || 0, // 钱班额外+2门课
                gpaThreshold: college.gpaThreshold || 0, // 钱班GPA低于3.5被清退
                volunteerRequired: college.volunteerRequired || 0, // 仲英每学期志愿3次
            },

            // 课程相关
            currentCourses: [],
            completedCourses: [],
            failedCourses: 0,
            retakeCourses: [],
            makeupCourses: [], // 补考课程列表（仅专业课）
            totalCredits: 0,
            totalGradePoints: 0,

            // 状态标记
            inRelationship: false,
            loveUnlockedColleges: [], // 已解锁恋爱的书院列表
            nationalScholarship: false,
            westwardPath: false,
            volunteerHoursThisYear: 0,
            volunteerHoursThisSemester: 0,
            attendedClassThisTurn: false,
            studyLocation: null,
            location: college.campus || 'xingqing',
            
            // 竞赛/科研相关
            competitionCount: 0,
            competitionWins: 0,
            researchExp: 0,
            researchPapers: 0,
            parttimeCount: 0,

            // 毕设相关（大四用）
            thesisProgress: 0,

            // 行动记录
            actionsThisTurn: [],
            
            // 书院成就统计
            quickHealCount: 0,
            semesterGPA: 0,
            
            // ========== 新增高阶系统状态 ==========
            // 体测系统
            maxEnergy: 10, // 体力上限
            runCountThisMonth: 0, // 本月跑步次数
            physicalTestPassed: true, // 体测是否通过
            physicalTestFailedThisYear: false, // 本学年体测是否挂过
            
            // 抢课系统
            courseBiddingDone: false, // 本学期是否完成选课
            courseWeights: { easy: 0, hard: 0, interest: 0 }, // 选课权重分配
            hardCourseDebuff: false, // 是否有硬课debuff（体力消耗+20%）
            
            // 长远规划系统（大三下开启）
            careerPath: null, // 'postgrad' | 'abroad' | 'job' | null
            careerProgress: {
                postgrad: { advisor: false, dachuang: 0, competition: 0 },
                abroad: { toefl: 0, gre: 0, application: 0 },
                job: { internship: 0, interview: 0, offer: false }
            },
            
            // BBS舆论系统
            reputation: 50, // 校园声望 0-100
            bbsEvents: [], // BBS事件列表
            scandalCount: 0, // 丑闻次数
            
            // 恋爱系统增强
            relationshipStage: 'single', // 'single' | 'crush' | 'confession' | 'dating' | 'breakup'
            relationshipMonth: 0, // 恋爱持续月数
            
            // 创新港debuff
            iHarbourDebuff: false // 创新港进城难debuff
        };

        // 钱学森书院特殊初始化
        if (this.selectedCollege === 'qianxuesen') {
            // 课程初始掌握度+15
            this.state.initialMastery = 15;
        }

        // 加载当前学期课程
        this.loadSemesterCourses();

        // 重置成就统计
        AchievementSystem.resetStats();
    }

    // 加载当前学期课程 - 使用书院专属课程系统
    loadSemesterCourses() {
        const yearKey = `year${this.state.year}`;
        const semester = this.getCurrentSemester();
        const effects = this.state.collegeEffects || {};
        const college = this.state.college;

        if (this.state.year <= 3) {
            // 钱学森书院初始掌握度+15
            const initialMastery = effects.initialMastery || 0;
            
            this.state.currentCourses = [];
            
            // 1. 添加1门通识必修课
            if (GameData.generalCourses && GameData.generalCourses[yearKey] && GameData.generalCourses[yearKey][semester]) {
                const generalCourse = GameData.generalCourses[yearKey][semester];
                this.state.currentCourses.push({
                    ...generalCourse,
                    mastery: initialMastery,
                    attendCount: 0,
                    studyCount: 0,
                    isGeneral: true
                });
            }
            
            // 2. 添加2门书院专属核心课程
            if (GameData.collegeCourses && GameData.collegeCourses[college] && 
                GameData.collegeCourses[college][yearKey] && GameData.collegeCourses[college][yearKey][semester]) {
                const collegeCourses = GameData.collegeCourses[college][yearKey][semester];
                collegeCourses.forEach(course => {
                    // 应用书院Buff到课程
                    const modifiedCourse = this.applyCollegeCourseBuffs(course, college);
                    this.state.currentCourses.push({
                        ...modifiedCourse,
                        mastery: initialMastery,
                        attendCount: 0,
                        studyCount: 0,
                        isCollegeCore: true
                    });
                });
            } else {
                // 如果没有专属课程数据，使用旧版通用课程
                if (GameData.courses[yearKey] && GameData.courses[yearKey][semester]) {
                    const fallbackCourses = GameData.courses[yearKey][semester].slice(0, 2);
                    fallbackCourses.forEach(course => {
                        this.state.currentCourses.push({
                            ...course,
                            mastery: initialMastery,
                            attendCount: 0,
                            studyCount: 0
                        });
                    });
                }
            }
            
            // 3. 钱学森书院额外课程 (+1门高难度课程)
            if (this.state.college === 'qianxuesen' && effects.extraCourses > 0) {
                const extraCourses = this.getQianExtraCourses(this.state.year, semester);
                if (extraCourses) {
                    this.state.currentCourses.push({
                        ...extraCourses,
                        mastery: initialMastery + 15, // 钱班初始掌握度高
                        attendCount: 0,
                        studyCount: 0,
                        isExtra: true
                    });
                }
            }
            
            // 4. 添加体育课（每学期都有）
            if (this.state.year <= 2) {
                const peIndex = (this.state.year - 1) * 2 + (semester === 'spring' ? 2 : 1);
                this.state.currentCourses.push({
                    id: `pe${peIndex}`,
                    name: `体育(${['一', '二', '三', '四'][peIndex - 1]})`,
                    credits: 1,
                    difficulty: 0.3,
                    type: 'pe',
                    mastery: 20,
                    attendCount: 0,
                    studyCount: 0
                });
            }
            
            this.addLog(`📚 新学期开始！本学期共${this.state.currentCourses.length}门课程`);
        } else {
            this.state.currentCourses = [];
        }
    }
    
    // 应用书院课程Buff
    applyCollegeCourseBuffs(course, college) {
        const modifiedCourse = { ...course };
        
        // 各书院特殊效果
        switch (college) {
            case 'qianxuesen':
                // 钱学森书院：掌握度衰减快
                modifiedCourse.masteryDecayRate = course.decayRate || 1.5;
                break;
                
            case 'nanyang':
                // 南洋书院：实验课多，可能触发深夜调电路事件
                if (course.labIntensive) {
                    modifiedCourse.labEventChance = 0.2;
                }
                break;
                
            case 'pengkang':
                // 彭康书院：计算量大，智力不足效率减半
                if (course.calcIntensive) {
                    modifiedCourse.requiresIntelligence = true;
                }
                if (course.isMountain) {
                    modifiedCourse.description = '三座大山之一';
                }
                break;
                
            case 'wenzhi':
                // 文治书院：消耗体力，可能颈椎劳损
                if (course.neckStrain) {
                    modifiedCourse.neckStrainChance = 0.15;
                }
                if (course.tiring) {
                    modifiedCourse.extraEnergyCost = 1;
                }
                break;
                
            case 'zhongying':
                // 仲英书院：Teamwork课程，可能遇到猪队友
                if (course.teamwork) {
                    modifiedCourse.pigTeammateChance = 0.2;
                }
                break;
                
            case 'lizhi':
                // 励志书院：逻辑课程，掌握度增长靠自习触发
                if (course.logicBased) {
                    modifiedCourse.attendGainMultiplier = 0.5; // 上课增长减半
                    modifiedCourse.studyGainMultiplier = 1.5; // 自习增长加成
                    modifiedCourse.studyTriggerChance = 0.3; // 自习触发几率
                }
                break;
                
            case 'chongshi':
                // 崇实书院：耗时但不太挂科
                if (course.timeConsuming) {
                    modifiedCourse.difficulty = Math.max(0.4, course.difficulty - 0.1);
                }
                if (course.allNighter) {
                    modifiedCourse.allNighterChance = 0.25;
                }
                break;
                
            case 'zonglian':
                // 宗濂书院：背诵地狱，考试周体力消耗翻倍
                if (course.memorize) {
                    modifiedCourse.examWeekEnergyMultiplier = 2;
                    modifiedCourse.memorizeIntensive = true;
                }
                break;
                
            case 'qide':
                // 启德书院：GPA越高兼职收益越高
                if (course.gpaMoneyBonus) {
                    modifiedCourse.moneyBonusOnPass = true;
                }
                break;
        }
        
        return modifiedCourse;
    }
    
    // 钱学森书院额外课程
    getQianExtraCourses(year, semester) {
        const extraCourses = {
            year1: {
                fall: { id: 'qxs_extra_phys', name: '大学物理强化', credits: 3, difficulty: 0.9, type: 'extra', decayRate: 1.3 },
                spring: { id: 'qxs_extra_chem', name: '普通化学强化', credits: 3, difficulty: 0.85, type: 'extra' }
            },
            year2: {
                fall: { id: 'qxs_extra_prog', name: '程序设计强化', credits: 3, difficulty: 0.85, type: 'extra' },
                spring: { id: 'qxs_extra_math', name: '复变函数', credits: 3, difficulty: 0.9, type: 'extra' }
            },
            year3: {
                fall: { id: 'qxs_extra_lab', name: '创新实验', credits: 2, difficulty: 0.8, type: 'extra' },
                spring: { id: 'qxs_extra_thesis', name: '学术论文写作', credits: 2, difficulty: 0.7, type: 'extra' }
            }
        };
        const yearKey = `year${year}`;
        return extraCourses[yearKey] ? extraCourses[yearKey][semester] : null;
    }

    // 获取当前学期
    getCurrentSemester() {
        const month = this.state.month;
        if (month >= 9 || month <= 1) return 'fall';
        if (month >= 2 && month <= 6) return 'spring';
        return 'summer';
    }

    // 规范数值为整数并做上下限裁剪，避免出现小数显示
    normalizeStateIntegers() {
        if (!this.state) return;

        const clamp = (val, min, max) => Math.min(max, Math.max(min, Math.round(val)));

        // 核心状态
        this.state.maxEnergy = clamp(this.state.maxEnergy || 10, 1, 20);
        this.state.energy = clamp(this.state.energy || 0, 0, this.state.maxEnergy);
        this.state.san = clamp(this.state.san || 0, 0, 100);
        this.state.social = clamp(this.state.social || 0, 0, 100);
        this.state.charm = clamp(this.state.charm || 0, 0, 100);
        this.state.reputation = clamp(this.state.reputation || 50, 0, 100);
        this.state.money = Math.max(0, Math.round(this.state.money || 0));

        // 计数型字段
        const counterKeys = [
            'runCountThisMonth', 'totalRunCount', 'volunteerHoursThisYear', 'volunteerHoursThisSemester',
            'parttimeCount', 'competitionCount', 'competitionWins', 'researchExp', 'researchPapers',
            'failedCourses', 'totalMonths'
        ];
        counterKeys.forEach(key => {
            if (typeof this.state[key] === 'number') {
                this.state[key] = Math.max(0, Math.round(this.state[key]));
            }
        });
    }

    // 更新UI
    updateUI() {
        // 先清理小数，确保展示为整数
        this.normalizeStateIntegers();

        // 更新时间显示
        document.getElementById('current-year').textContent = GameData.yearNames[this.state.year - 1];
        document.getElementById('current-month').textContent = `${this.state.month}月`;
        document.getElementById('current-semester').textContent = GameData.semesterNames[this.getCurrentSemester()];
        document.getElementById('current-location').textContent = this.state.location === 'innovationPort' ? '创新港校区' : '兴庆校区';

        // 更新属性显示
        const gpaDisplay = this.state.gpa.toFixed(2);
        document.getElementById('stat-gpa').textContent = `${gpaDisplay}/4.3`;
        document.getElementById('bar-gpa').style.width = `${(this.state.gpa / 4.3) * 100}%`;

        document.getElementById('stat-san').textContent = `${Math.round(this.state.san)}/100`;
        document.getElementById('bar-san').style.width = `${this.state.san}%`;

        document.getElementById('stat-energy').textContent = `${this.state.energy}/${this.state.maxEnergy}`;
        document.getElementById('bar-energy').style.width = `${(this.state.energy / this.state.maxEnergy) * 100}%`;

        document.getElementById('stat-social').textContent = Math.round(this.state.social);
        document.getElementById('bar-social').style.width = `${this.state.social}%`;

        document.getElementById('stat-money').textContent = `💰 ${Math.round(this.state.money)}`;
        
        // 更新声望显示
        const repEl = document.getElementById('stat-reputation');
        const repBar = document.getElementById('bar-reputation');
        if (repEl && repBar) {
            repEl.textContent = `${Math.round(this.state.reputation || 50)}/100`;
            repBar.style.width = `${this.state.reputation || 50}%`;
        }

        // 更新课程列表
        this.updateCourseList();

        // 更新行动按钮状态
        this.updateActionButtons();

        // 检查约会按钮
        const dateBtn = document.getElementById('btn-date');
        if (this.isLoveModuleUnlocked() && this.state.inRelationship) {
            dateBtn.style.display = 'flex';
        } else {
            dateBtn.style.display = 'none';
        }
        
        // 更新BBS滚动条
        this.updateBBSScroll();
        
        // 更新长远规划面板
        if (this.state.careerPath) {
            const careerPanel = document.getElementById('career-panel');
            if (careerPanel) {
                careerPanel.style.display = 'block';
                this.updateCareerPanel();
            }
            const careerBtn = document.getElementById('btn-career');
            if (careerBtn) {
                careerBtn.style.display = 'flex';
            }
        }
        
        // 显示跑步按钮（始终可见）
        const runBtn = document.getElementById('btn-run');
        if (runBtn) {
            runBtn.style.display = 'flex';
        }
    }

    // 更新课程列表
    updateCourseList() {
        const courseList = document.getElementById('course-list');
        courseList.innerHTML = '';

        this.state.currentCourses.forEach(course => {
            const courseEl = document.createElement('div');
            courseEl.className = `course-item${course.failed ? ' failed' : ''}`;
            courseEl.innerHTML = `
                <div class="course-name">${course.name}</div>
                <div class="course-mastery">掌握度: ${Math.round(course.mastery)}%</div>
                <div class="course-mastery-bar">
                    <div class="course-mastery-fill" style="width: ${course.mastery}%"></div>
                </div>
            `;
            courseList.appendChild(courseEl);
        });

        // 显示重修课程
        if (this.state.retakeCourses.length > 0) {
            const retakeHeader = document.createElement('div');
            retakeHeader.innerHTML = '<h4 style="color: #F44336; margin: 10px 0;">📚 重修课程</h4>';
            courseList.appendChild(retakeHeader);

            this.state.retakeCourses.forEach(course => {
                const courseEl = document.createElement('div');
                courseEl.className = 'course-item failed';
                courseEl.innerHTML = `
                    <div class="course-name">${course.name} (重修)</div>
                    <div class="course-mastery">掌握度: ${Math.round(course.mastery)}%</div>
                    <div class="course-mastery-bar">
                        <div class="course-mastery-fill" style="width: ${course.mastery}%"></div>
                    </div>
                `;
                courseList.appendChild(courseEl);
            });
        }
    }

    // 更新行动按钮状态
    updateActionButtons() {
        const energy = this.state.energy;
        const money = this.state.money;
        const inExamRush = this.isExamRushMode();

        document.querySelectorAll('.action-btn').forEach(btn => {
            const action = btn.dataset.action;
            let disabled = false;

            // 考试冲刺模式限制
            if (inExamRush) {
                const allowedActions = ['attend-class', 'self-study', 'rest', 'bath', 'eat'];
                if (!allowedActions.includes(action)) {
                    disabled = true;
                    btn.title = '考试冲刺模式中不可用';
                }
            }

            switch (action) {
                case 'attend-class':
                    disabled = disabled || energy < this.getAttendClassEnergy();
                    break;
                case 'self-study':
                    disabled = disabled || energy < 3;
                    break;
                case 'club':
                case 'volunteer':
                    disabled = disabled || energy < 2;
                    break;
                case 'parttime':
                    disabled = disabled || energy < 4;
                    break;
                case 'competition':
                    disabled = disabled || energy < 4;
                    break;
                case 'research':
                    disabled = disabled || energy < 3 || this.state.year < 2;
                    break;
                case 'eat':
                    disabled = disabled || money < 15;
                    break;
                case 'entertainment':
                    disabled = disabled || money < 50;
                    break;
                case 'date':
                    disabled = disabled || money < 100 || (!this.state.inRelationship && this.state.charm < 60);
                    break;
                case 'love':
                    // 恋爱按钮总是显示（但可能禁用）
                    const loveUnlocked = this.isLoveModuleUnlocked();
                    disabled = disabled || !loveUnlocked;
                    if (!loveUnlocked) {
                        this.showLoveUnlockTooltip(btn);
                    }
                    break;
                case 'run':
                    disabled = disabled || energy < 1;
                    break;
                case 'career':
                    disabled = disabled || this.state.year < 3;
                    break;
            }

            btn.disabled = disabled;
        });
    }

    // 获取上课消耗的体力
    getAttendClassEnergy() {
        let energy = 2;
        const effects = this.state.collegeEffects || {};
        
        // 彭康书院地利人和 (体力-1)
        if (effects.attendClassEnergy) {
            energy += effects.attendClassEnergy;
        }
        
        return Math.max(1, energy);
    }

    // 执行行动
    performAction(action) {
        switch (action) {
            case 'attend-class':
                this.attendClass();
                break;
            case 'self-study':
                this.showStudyLocationChoice();
                break;
            case 'club':
                this.doClub();
                break;
            case 'volunteer':
                this.doVolunteer();
                break;
            case 'parttime':
                this.doParttime();
                break;
            case 'competition':
                this.showCompetitionChoice();
                break;
            case 'research':
                this.doResearch();
                break;
            case 'eat':
                this.showEatChoice();
                break;
            case 'entertainment':
                this.showEntertainmentChoice();
                break;
            case 'bath':
                this.doBath();
                break;
            case 'date':
                this.showDateChoice();
                break;
            case 'love':
                this.showLoveChoice();
                break;
            case 'rest':
                this.doRest();
                break;
            // 新增高阶系统
            case 'run':
                this.doRun();
                break;
            case 'career':
                this.showCareerChoice();
                break;
            // 毕设相关
            case 'thesis-work':
                this.doThesisWork();
                break;
            case 'thesis-meeting':
                this.doThesisMeeting();
                break;
            case 'thesis-rest':
                this.doThesisRest();
                break;
            case 'thesis-city':
                this.doThesisCity();
                break;
        }
    }

    // 去上课
    attendClass() {
        const energyCost = this.getAttendClassEnergy();
        if (this.state.energy < energyCost) {
            this.showMessage('体力不足', '你太累了，需要休息一下。');
            return;
        }

        if (this.state.currentCourses.length === 0) {
            this.showMessage('没有课程', '当前没有需要上的课程。');
            return;
        }

        // 显示课程选择界面
        this.showCourseChoice('attend');
    }
    
    // 显示课程选择界面
    showCourseChoice(actionType) {
        const options = document.getElementById('choice-options');
        options.innerHTML = '';
        
        // 添加"全部课程"选项
        const allBtn = document.createElement('button');
        allBtn.className = 'choice-btn';
        const monthMultiplier = (this.state.month === 1 || this.state.month === 6) ? 4 : 2;
        const baseGain = actionType === 'attend' ? 3 : 5;
        const displayGain = baseGain * monthMultiplier;
        const monthTip = (this.state.month === 1 || this.state.month === 6) ? '📝 期末月加成！' : '';
        allBtn.innerHTML = `
            <div class="choice-btn-name">📚 全部课程</div>
            <div class="choice-btn-desc">每门课程均衡学习，掌握度+${displayGain} ${monthTip}</div>
        `;
        allBtn.addEventListener('click', () => {
            this.hideModal('choice-modal');
            if (actionType === 'attend') {
                this.doAttendClassAll();
            } else {
                this.doSelfStudyAll();
            }
        });
        options.appendChild(allBtn);
        
        // 添加各门课程选项
        this.state.currentCourses.forEach((course, index) => {
            const difficultyText = course.difficulty >= 0.8 ? '困难' : course.difficulty >= 0.6 ? '中等' : '简单';
            const difficultyColor = course.difficulty >= 0.8 ? '#F44336' : course.difficulty >= 0.6 ? '#FF9800' : '#4CAF50';
            
            // 根据课程类型显示标签
            let typeText = '选修课';
            let typeColor = '#9E9E9E';
            if (course.isCollegeCore || course.type === 'college_core') {
                typeText = '📌 书院核心课';
                typeColor = '#9C27B0';
            } else if (course.isGeneral || course.type === 'general_required') {
                typeText = '📖 通识必修';
                typeColor = '#2196F3';
            } else if (course.type === 'pe') {
                typeText = '🏃 体育课';
                typeColor = '#4CAF50';
            } else if (course.type === 'major') {
                typeText = '专业课';
                typeColor = '#FF9800';
            }
            
            // 显示课程特殊属性
            let specialTags = '';
            if (course.labIntensive) specialTags += '<span class="special-tag lab">实验密集</span>';
            if (course.calcIntensive) specialTags += '<span class="special-tag calc">计算密集</span>';
            if (course.memorize) specialTags += '<span class="special-tag memo">背诵地狱</span>';
            if (course.teamwork) specialTags += '<span class="special-tag team">团队作业</span>';
            if (course.logicBased) specialTags += '<span class="special-tag logic">逻辑挑战</span>';
            if (course.timeConsuming) specialTags += '<span class="special-tag time">耗时较长</span>';
            
            const btn = document.createElement('button');
            btn.className = 'choice-btn' + (course.isCollegeCore ? ' college-core' : '');
            btn.innerHTML = `
                <div class="choice-btn-name">
                    <span>${course.name}</span>
                    <span class="course-type-tag" style="background: ${difficultyColor}20; color: ${difficultyColor}">${difficultyText}</span>
                </div>
                <div class="choice-btn-desc">
                    <span style="color: ${typeColor}">${typeText}</span> | 当前掌握: ${Math.round(course.mastery)}%
                    ${specialTags ? '<br>' + specialTags : ''}
                </div>
            `;
            btn.addEventListener('click', () => {
                this.hideModal('choice-modal');
                if (actionType === 'attend') {
                    this.doAttendClassFocused(index);
                } else {
                    this.doSelfStudyFocused(index);
                }
            });
            options.appendChild(btn);
        });
        
        // 重修课程也可以选择
        if (this.state.retakeCourses && this.state.retakeCourses.length > 0) {
            const retakeHeader = document.createElement('div');
            retakeHeader.className = 'choice-section-header';
            retakeHeader.innerHTML = '<h4 style="color: #F44336; margin: 15px 0 10px;">📚 重修课程</h4>';
            options.appendChild(retakeHeader);
            
            this.state.retakeCourses.forEach((course, index) => {
                const btn = document.createElement('button');
                btn.className = 'choice-btn retake';
                btn.innerHTML = `
                    <div class="choice-btn-name">${course.name} (重修)</div>
                    <div class="choice-btn-desc">当前掌握: ${Math.round(course.mastery)}% | 重点学习掌握+${actionType === 'attend' ? '8' : '12'}</div>
                `;
                btn.addEventListener('click', () => {
                    this.hideModal('choice-modal');
                    if (actionType === 'attend') {
                        this.doAttendClassRetake(index);
                    } else {
                        this.doSelfStudyRetake(index);
                    }
                });
                options.appendChild(btn);
            });
        }
        
        document.getElementById('choice-title').textContent = actionType === 'attend' ? '选择上课方式' : '选择自习课程';
        this.showModal('choice-modal');
    }
    
    // 全部课程上课（均衡学习）
    doAttendClassAll() {
        const energyCost = this.getAttendClassEnergy();
        this.state.energy -= energyCost;
        
        // 记录上课
        AchievementSystem.recordAttendClass();
        AchievementSystem.resetLateWakeup();

        // 文治书院迟到判定
        let masteryGain = 3.0 * this.state.studyEfficiency;  // 进一步提高到 3.0
        // 期末月（1月和6月）翻两倍，平时翻一倍
        const monthMultiplier = (this.state.month === 1 || this.state.month === 6) ? 4 : 2;
        masteryGain *= monthMultiplier;
        let lateToClass = false;
        if (this.state.college === 'wenzhi' && Math.random() < 0.05) {
            this.addLog('🏃 从西区赶到东区上课，迟到了！本次学习效果减半', 'warning');
            masteryGain = masteryGain / 2;
            lateToClass = true;
        } else {
            this.addLog('📚 认真上了一天课，所有课程都有所进步');
        }
        
        this.state.currentCourses.forEach(course => {
            // 根据难度调整掌握度增加
            let difficultyFactor = 1 - (course.difficulty - 0.5) * 0.3;
            let courseGain = masteryGain * difficultyFactor;
            
            // 应用书院课程特效
            courseGain = this.applyCollegeLearningEffects(course, courseGain, 'attend');
            
            course.mastery = Math.min(100, course.mastery + courseGain);
            course.attendCount++;
        });
        
        // 触发书院特殊事件
        this.checkCollegeCourseEvents('attend');

        this.state.attendedClassThisTurn = true;
        this.state.actionsThisTurn.push('attend-class');
        this.checkActionEvents('attend-class');
        AchievementSystem.checkAchievements(this.state);
        this.updateUI();
    }
    
    // 重点课程上课
    doAttendClassFocused(courseIndex) {
        const energyCost = this.getAttendClassEnergy();
        this.state.energy -= energyCost;
        
        AchievementSystem.recordAttendClass();
        AchievementSystem.resetLateWakeup();
        
        const focusedCourse = this.state.currentCourses[courseIndex];
        let focusedGain = 8 * this.state.studyEfficiency;  // 进一步提高到 8.0
        let otherGain = 1.5 * this.state.studyEfficiency;  // 进一步提高到 1.5
        // 期末月（1月和6月）翻两倍，平时翻一倍
        const monthMultiplier = (this.state.month === 1 || this.state.month === 6) ? 4 : 2;
        focusedGain *= monthMultiplier;
        otherGain *= monthMultiplier;
        
        // 文治书院迟到判定
        if (this.state.college === 'wenzhi' && Math.random() < 0.05) {
            this.addLog('🏃 从西区赶到东区上课，迟到了！', 'warning');
            focusedGain = focusedGain / 2;
            otherGain = otherGain / 2;
        }
        
        this.state.currentCourses.forEach((course, idx) => {
            let difficultyFactor = 1 - (course.difficulty - 0.5) * 0.3;
            let courseGain;
            
            if (idx === courseIndex) {
                courseGain = focusedGain * difficultyFactor;
                courseGain = this.applyCollegeLearningEffects(course, courseGain, 'attend');
                course.mastery = Math.min(100, course.mastery + courseGain);
            } else {
                courseGain = otherGain * difficultyFactor;
                course.mastery = Math.min(100, course.mastery + courseGain);
            }
            course.attendCount++;
        });
        
        // 触发书院特殊事件
        this.checkCollegeCourseEvents('attend', focusedCourse);
        
        this.addLog(`📚 重点听了『${focusedCourse.name}』的课，该课程掌握度大幅提升！`);
        
        this.state.attendedClassThisTurn = true;
        this.state.actionsThisTurn.push('attend-class');
        this.checkActionEvents('attend-class');
        AchievementSystem.checkAchievements(this.state);
        this.updateUI();
    }
    
    // 重修课程上课
    doAttendClassRetake(courseIndex) {
        const energyCost = this.getAttendClassEnergy();
        this.state.energy -= energyCost;
        
        const course = this.state.retakeCourses[courseIndex];
        const difficultyFactor = 1 - (course.difficulty - 0.5) * 0.3;
        let gain = 10 * this.state.studyEfficiency * difficultyFactor;  // 提高重修课上课增益到 10
        // 期末月（1月和6月）翻两倍，平时翻一倍
        const monthMultiplier = (this.state.month === 1 || this.state.month === 6) ? 4 : 2;
        gain *= monthMultiplier;
        
        course.mastery = Math.min(100, course.mastery + gain);
        course.attendCount++;
        
        this.addLog(`📚 重修课『${course.name}』，这次一定要过！`);
        
        this.state.attendedClassThisTurn = true;
        this.state.actionsThisTurn.push('attend-class');
        AchievementSystem.checkAchievements(this.state);
        this.updateUI();
    }
    
    // 应用书院课程学习特效
    applyCollegeLearningEffects(course, baseGain, actionType) {
        let gain = baseGain;
        const college = this.state.college;
        
        // 励志书院：逻辑课程上课效率减半，自习效率提升
        if (course.logicBased) {
            if (actionType === 'attend') {
                gain *= (course.attendGainMultiplier || 0.5);
            } else if (actionType === 'study') {
                gain *= (course.studyGainMultiplier || 1.5);
                // 触发几率额外加成
                if (Math.random() < (course.studyTriggerChance || 0.3)) {
                    gain *= 1.5;
                    this.addLog('💡 灵光一闪，突然理解了某个抽象概念！', 'success');
                }
            }
        }
        
        // 彭康书院：计算密集课程需要智力
        if (course.calcIntensive && college === 'pengkang') {
            // 假设智力与GPA相关
            if (this.state.gpa < 3.0) {
                gain *= 0.6;
                this.addLog('🤯 计算量太大了，感觉脑子不够用...', 'warning');
            }
        }
        
        // 钱学森书院：难度高但初始掌握度高
        if (course.decayRate && course.decayRate > 1 && college === 'qianxuesen') {
            // 掌握度增长正常，但显示警告
            if (course.mastery > 50 && Math.random() < 0.1) {
                this.addLog('⚠️ 课程难度极高，需要保持高强度学习！', 'warning');
            }
        }
        
        // 启德书院：GPA关联收益
        if (course.moneyBonusOnPass && college === 'qide') {
            // 在课程通过时会获得金币奖励（在考试逻辑中处理）
        }
        
        return gain;
    }
    
    // 检查书院课程特殊事件
    checkCollegeCourseEvents(actionType, focusedCourse = null) {
        const college = this.state.college;
        const course = focusedCourse || this.state.currentCourses[0];
        
        // 南洋书院：实验课触发深夜调电路/Debug
        if (college === 'nanyang' && course && course.labIntensive) {
            if (Math.random() < 0.2) {
                this.addLog('🔧 深夜调电路/Debug到凌晨，SAN值暴跌但掌握度大增！', 'warning');
                this.state.san -= 8;
                if (course) course.mastery = Math.min(100, course.mastery + 10);
            }
        }
        
        // 文治书院：绘图课颈椎劳损
        if (college === 'wenzhi' && course && course.neckStrain) {
            if (Math.random() < 0.15) {
                this.addLog('😵 画图太久，颈椎劳损！本回合体力上限-1', 'warning');
                this.state.neckStrainDebuff = true;
                this.state.maxEnergy = Math.max(5, (this.state.maxEnergy || 10) - 1);
            }
        }
        
        // 仲英书院：Teamwork遇到猪队友
        if (college === 'zhongying' && course && course.teamwork) {
            if (Math.random() < 0.2 && this.state.social < 60) {
                this.addLog('🐷 小组作业遇到猪队友，SAN值大跌！', 'warning');
                this.state.san -= 10;
            } else if (this.state.social >= 80) {
                this.addLog('👥 组队顺利，团队合作愉快！', 'success');
                this.state.san += 2;
            }
        }
        
        // 崇实书院：熬夜画图/赶稿
        if (college === 'chongshi' && course && course.allNighter) {
            if (Math.random() < 0.25) {
                this.addLog('🌙 熬夜赶稿到天亮，SAN值波动剧烈...', 'warning');
                this.state.san -= 5;
                this.state.energy -= 2;
                if (course) course.mastery = Math.min(100, course.mastery + 8);
            }
        }
        
        // 宗濂书院：背诵地狱
        if (college === 'zonglian' && course && course.memorize) {
            // 考试周体力消耗翻倍在其他地方处理
            if (Math.random() < 0.15) {
                this.addLog('📖 疯狂背书中...医学生的日常', 'info');
            }
        }
    }

    // 显示自习地点选择
    showStudyLocationChoice() {
        if (this.state.energy < 3) {
            this.showMessage('体力不足', '你太累了，需要休息一下。');
            return;
        }
        
        const options = document.getElementById('choice-options');
        options.innerHTML = '';

        const locations = Object.values(GameData.studyLocations);
        locations.forEach(loc => {
            // 检查书院限制
            if (loc.collegeRequired && loc.collegeRequired !== this.state.college) {
                return;
            }

            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerHTML = `
                <div class="choice-btn-name">${loc.icon} ${loc.name}</div>
                <div class="choice-btn-desc">${loc.description}</div>
            `;
            btn.addEventListener('click', () => {
                this.hideModal('choice-modal');
                this.selectStudyLocation(loc);
            });
            options.appendChild(btn);
        });

        document.getElementById('choice-title').textContent = '选择自习地点';
        this.showModal('choice-modal');
    }
    
    // 选择地点后，选择要自习的课程
    selectStudyLocation(location) {
        this.pendingStudyLocation = location;
        this.showCourseChoice('study');
    }

    // 全部课程自习
    doSelfStudyAll() {
        const location = this.pendingStudyLocation;
        
        this.state.energy -= 3;
        this.state.san -= location.sanLoss;
        this.state.studyLocation = location.id;

        let masteryGain = 5.0 * location.masteryBonus * this.state.studyEfficiency;  // 进一步提高到 5.0
        // 期末月（1月和6月）翻两倍，平时翻一倍
        const monthMultiplier = (this.state.month === 1 || this.state.month === 6) ? 4 : 2;
        masteryGain *= monthMultiplier;

        // 书院特殊加成
        this.applyStudyLocationBonus(location);

        // 主楼迷路判定
        if (location.id === 'mainBuilding' && Math.random() < (location.lostChance || 0)) {
            masteryGain *= 0.5;
            this.state.san -= 3;
            this.addLog('🌫️ 在主楼迷路了！浪费了不少时间...', 'warning');
            AchievementSystem.recordMainBuildingLost();
        }

        this.state.currentCourses.forEach(course => {
            const difficultyFactor = 1 - (course.difficulty - 0.5) * 0.3;
            course.mastery = Math.min(100, course.mastery + masteryGain * difficultyFactor);
            course.studyCount++;
        });

        this.addLog(`📖 在${location.name}复习所有课程，知识稳步增长`);
        this.state.actionsThisTurn.push('self-study');
        this.checkActionEvents('self-study');
        AchievementSystem.checkAchievements(this.state);
        this.updateUI();
    }
    
    // 重点课程自习
    doSelfStudyFocused(courseIndex) {
        const location = this.pendingStudyLocation;
        const focusedCourse = this.state.currentCourses[courseIndex];
        
        this.state.energy -= 3;
        this.state.san -= location.sanLoss;
        this.state.studyLocation = location.id;

        let focusedGain = 11 * location.masteryBonus * this.state.studyEfficiency;  // 进一步提高到 11.0
        let otherGain = 1.5 * location.masteryBonus * this.state.studyEfficiency;  // 进一步提高到 1.5
        // 期末月（1月和6月）翻两倍，平时翻一倍
        const monthMultiplier = (this.state.month === 1 || this.state.month === 6) ? 4 : 2;
        focusedGain *= monthMultiplier;
        otherGain *= monthMultiplier;

        // 书院特殊加成
        this.applyStudyLocationBonus(location);

        // 主楼迷路判定
        if (location.id === 'mainBuilding' && Math.random() < (location.lostChance || 0)) {
            focusedGain *= 0.5;
            otherGain *= 0.5;
            this.state.san -= 3;
            this.addLog('🌫️ 在主楼迷路了！浪费了不少时间...', 'warning');
            AchievementSystem.recordMainBuildingLost();
        }

        this.state.currentCourses.forEach((course, idx) => {
            const difficultyFactor = 1 - (course.difficulty - 0.5) * 0.3;
            if (idx === courseIndex) {
                course.mastery = Math.min(100, course.mastery + focusedGain * difficultyFactor);
            } else {
                course.mastery = Math.min(100, course.mastery + otherGain * difficultyFactor);
            }
            course.studyCount++;
        });

        this.addLog(`📖 在${location.name}专注复习『${focusedCourse.name}』，该课程掌握度大幅提升！`);
        this.state.actionsThisTurn.push('self-study');
        this.checkActionEvents('self-study');
        AchievementSystem.checkAchievements(this.state);
        this.updateUI();
    }
    
    // 重修课程自习
    doSelfStudyRetake(courseIndex) {
        const location = this.pendingStudyLocation;
        const course = this.state.retakeCourses[courseIndex];
        
        this.state.energy -= 3;
        this.state.san -= location.sanLoss;
        
        const difficultyFactor = 1 - (course.difficulty - 0.5) * 0.3;
        let gain = 15 * location.masteryBonus * this.state.studyEfficiency * difficultyFactor;  // 提高重修课自习增益到 15
        // 期末月（1月和6月）翻两倍，平时翻一倍
        const monthMultiplier = (this.state.month === 1 || this.state.month === 6) ? 4 : 2;
        gain *= monthMultiplier;
        
        course.mastery = Math.min(100, course.mastery + gain);
        course.studyCount++;
        
        this.addLog(`📖 在${location.name}努力复习重修课『${course.name}』`);
        this.state.actionsThisTurn.push('self-study');
        AchievementSystem.checkAchievements(this.state);
        this.updateUI();
    }
    
    // 自习地点特殊加成
    applyStudyLocationBonus(location) {
        if (location.id === 'pinge' && this.state.college === 'zhongying') {
            AchievementSystem.recordPingeStudy();
            if (AchievementSystem.stats.pingeStudyCount >= 20) {
                AchievementSystem.unlock('pingeExpert');
            }
        }

        if (location.id === 'dong13' && this.state.college === 'nanyang') {
            AchievementSystem.recordDong13Study();
            if (Math.random() < 0.1) {
                this.addLog('✨ 在东13自习时，你仿佛感受到了保研的气息...', 'success');
                AchievementSystem.unlock('dong13Legend');
            }
        }
    }

    // 旧版自习方法保留兼容
    doSelfStudy(location) {
        this.pendingStudyLocation = location;
        this.doSelfStudyAll();
    }

    // 搞社团
    doClub() {
        const effects = this.state.collegeEffects || {};
        let energyCost = 2;
        
        // 崇实书院社交体力消耗-1
        if (effects.socialEnergyCost) {
            energyCost += effects.socialEnergyCost;
        }
        energyCost = Math.max(1, energyCost);
        
        if (this.state.energy < energyCost) {
            this.showMessage('体力不足', '你太累了，需要休息一下。');
            return;
        }

        this.state.energy -= energyCost;
        this.state.san += 3;
        
        let socialGain = 5 * this.state.socialEfficiency;
        this.state.social = Math.min(100, this.state.social + socialGain);

        if (effects.socialEnergyCost < 0) {
            this.addLog('🎭 崇实中楼沙龙加持，社团活动省力又愉快！');
        } else {
            this.addLog('🎭 参加社团活动，认识了新朋友');
        }
        
        this.state.actionsThisTurn.push('club');
        
        // 检查成就
        AchievementSystem.checkAchievements(this.state);
        this.updateUI();
    }

    // 做志愿
    doVolunteer() {
        if (this.state.energy < 2) {
            this.showMessage('体力不足', '你太累了，需要休息一下。');
            return;
        }

        this.state.energy -= 2;
        const effects = this.state.collegeEffects || {};
        
        // 仲英书院志愿效率加成 (2倍综测)
        let socialGain = 8 * this.state.socialEfficiency * (effects.volunteerEfficiency || 1);
        this.state.social = Math.min(100, this.state.social + socialGain);
        this.state.volunteerHoursThisYear++;
        this.state.volunteerHoursThisSemester = (this.state.volunteerHoursThisSemester || 0) + 1;

        if (effects.volunteerEfficiency > 1) {
            this.addLog('🤝 完成志愿服务，仲英品格加持，综测分大幅提升！');
            // 仲英品阁成就检查
            if (this.state.volunteerHoursThisSemester >= 10) {
                AchievementSystem.unlock('zhongyingPinge');
            }
        } else {
            this.addLog('🤝 完成志愿服务，综测分提升');
        }
        
        this.state.actionsThisTurn.push('volunteer');
        this.checkActionEvents('volunteer');
        
        // 检查成就
        AchievementSystem.checkAchievements(this.state);
        this.updateUI();
    }

    // 显示吃饭选择
    showEatChoice() {
        const options = document.getElementById('choice-options');
        options.innerHTML = '';

        const eatOptions = [
            { id: 'canteen', name: '去食堂', icon: '🍜', cost: 15, san: 3 },
            { id: 'kangqiao', name: '康桥苑聚餐', icon: '🍖', cost: 50, san: 8 },
            { id: 'takeout', name: '点外卖', icon: '📦', cost: 25, san: 2 }
        ];

        eatOptions.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.disabled = this.state.money < opt.cost;
            btn.innerHTML = `
                <div class="choice-btn-name">${opt.icon} ${opt.name}</div>
                <div class="choice-btn-desc">花费 ${opt.cost} 金币，SAN +${opt.san}</div>
            `;
            btn.addEventListener('click', () => {
                this.hideModal('choice-modal');
                this.doEat(opt);
            });
            options.appendChild(btn);
        });

        document.getElementById('choice-title').textContent = '选择用餐方式';
        this.showModal('choice-modal');
    }

    // 吃饭
    doEat(option) {
        // 记录贫困餐
        if (this.state.money < 10) {
            AchievementSystem.recordPoorMeal();
        }
        
        this.state.money -= option.cost;
        this.state.san = Math.min(100, this.state.san + option.san);
        this.addLog(`${option.icon} ${option.name}，心情不错`);
        
        // 检查成就
        AchievementSystem.checkAchievements(this.state);
        this.updateUI();
    }

    // 显示娱乐选择
    showEntertainmentChoice() {
        const options = document.getElementById('choice-options');
        options.innerHTML = '';

        Object.values(GameData.entertainments).forEach(ent => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.disabled = this.state.money < ent.cost;
            btn.innerHTML = `
                <div class="choice-btn-name">${ent.icon} ${ent.name}</div>
                <div class="choice-btn-desc">${ent.description}<br>花费 ${ent.cost} 金币，SAN +${ent.sanGain}</div>
            `;
            btn.addEventListener('click', () => {
                this.hideModal('choice-modal');
                this.doEntertainment(ent);
            });
            options.appendChild(btn);
        });

        document.getElementById('choice-title').textContent = '选择娱乐活动';
        this.showModal('choice-modal');
    }

    // 娱乐
    doEntertainment(entertainment) {
        let cost = entertainment.cost;
        
        // 创新港debuff：娱乐花费×2
        if (this.state.iHarbourDebuff) {
            cost = Math.floor(cost * 2);
            this.addLog('🚌 从创新港进城花费翻倍...', 'warning');
        }
        
        this.state.money -= cost;
        
        let sanGain = entertainment.sanGain;
        // 季节加成
        if (entertainment.seasonBonus) {
            const season = this.getSeason();
            if (entertainment.seasonBonus[season]) {
                sanGain += entertainment.seasonBonus[season];
            }
        }

        this.state.san = Math.min(100, this.state.san + sanGain);

        // 成就触发
        if (entertainment.achievement) {
            AchievementSystem.unlock(entertainment.achievement);
        }

        this.addLog(`${entertainment.icon} ${entertainment.name}，放松身心`);
        this.updateUI();
    }

    // 获取当前季节
    getSeason() {
        const month = this.state.month;
        if ([3, 4, 5].includes(month)) return 'spring';
        if ([6, 7, 8].includes(month)) return 'summer';
        if ([9, 10, 11].includes(month)) return 'fall';
        return 'winter';
    }

    // 洗澡
    doBath() {
        let sanGain = 8;
        const effects = this.state.collegeEffects || {};

        // 文治书院小澡堂加成 (2倍SAN恢复)
        if (effects.bathSanMultiplier > 1) {
            sanGain *= effects.bathSanMultiplier;
            AchievementSystem.recordWenzhiBath();
            this.addLog('🚿 去文治小澡堂洗澡，舒服极了！(SAN恢复翻倍)');
            
            // 书院过客成就
            if (AchievementSystem.stats.wenzhiBathCount >= 1) {
                AchievementSystem.unlock('collegeVisitor');
            }
            // 文治汤成就
            if (AchievementSystem.stats.wenzhiBathCount >= 50) {
                AchievementSystem.unlock('wenzhiBath');
            }
        } else {
            // 非文治可能排队
            if (Math.random() < 0.2) {
                const queueTime = Math.floor(Math.random() * 60) + 10; // 10-70分钟
                AchievementSystem.recordBathQueue(queueTime);
                sanGain -= 3;
                this.addLog(`🚿 洗澡排了很久的队（${queueTime}分钟）...`, 'warning');
            } else {
                this.addLog('🚿 洗了个舒服的澡');
            }
        }

        this.state.san = Math.min(100, this.state.san + sanGain);
        this.state.actionsThisTurn.push('bath');
        this.checkActionEvents('bath');
        
        // 检查成就
        AchievementSystem.checkAchievements(this.state);
        this.updateUI();
    }

    // 显示约会选择
    // 检查恋爱模块是否解锁
    isLoveModuleUnlocked() {
        const college = this.state.college;
        const stats = AchievementSystem.stats || {};
        
        // 如果已经在谈恋爱，直接返回true
        if (this.state.inRelationship) return true;
        
        // 已解锁标记（避免重复检查）
        if (this.state.loveModuleUnlocked === true) return true;
        
        let unlocked = false;
        let unlockedReason = '';
        
        switch (college) {
            case 'qianxuesen': // 钱班 - GPA≥3.5 且竞赛获奖≥1 或研究经验≥10
                if ((this.state.gpa >= 3.5 && this.state.competitionWins >= 1) || this.state.researchExp >= 10) {
                    unlocked = true;
                    unlockedReason = '🧪 科研才子相识在实验室...';
                }
                break;
                
            case 'nanyang': // 南洋 - 声望≥50 且兼职≥5 或综测≥70
                if ((this.state.reputation >= 50 && this.state.parttimeCount >= 5) || this.state.social >= 70) {
                    unlocked = true;
                    unlockedReason = '⚙️ 工程师在创新中相遇...';
                }
                break;
                
            case 'pengkang': // 彭康 - 体力上限≥12 且本年跑步≥15 或声望≥60 且志愿≥3
                const runCountThisYear = this.state.runCountThisMonth || 0; // 简化计算
                if ((this.state.maxEnergy >= 12 && runCountThisYear >= 15) || (this.state.reputation >= 60 && this.state.volunteerHoursThisSemester >= 3)) {
                    unlocked = true;
                    unlockedReason = '🏃 运动健儿在操场相遇...';
                }
                break;
                
            case 'wenzhi': // 文治 - 社团≥10 且声望≥55 或SAN≥85 且综测≥75
                const clubCount = stats.clubActivities || 0;
                if ((clubCount >= 10 && this.state.reputation >= 55) || (this.state.san >= 85 && this.state.social >= 75)) {
                    unlocked = true;
                    unlockedReason = '🎨 艺术相伴，浪漫绽放...';
                }
                break;
                
            case 'zhongying': // 仲英 - 本年志愿≥20 且声望≥65 或综测≥80
                if ((this.state.volunteerHoursThisYear >= 20 && this.state.reputation >= 65) || this.state.social >= 80) {
                    unlocked = true;
                    unlockedReason = '🤝 志愿者在公益中相识...';
                }
                break;
                
            case 'lizhi': // 励志 - 竞赛≥2 且GPA≥3.4 或论文≥1
                if ((this.state.competitionWins >= 2 && this.state.gpa >= 3.4) || this.state.researchPapers >= 1) {
                    unlocked = true;
                    unlockedReason = '📐 数学天才的灵感碰撞...';
                }
                break;
                
            case 'chongshi': // 崇实 - 社团≥8 且声望≥50 或综测≥65 且活动≥15
                const clubCount2 = stats.clubActivities || 0;
                const totalActivities = (clubCount2 || 0) + (this.state.parttimeCount || 0) + (this.state.competitionCount || 0);
                if ((clubCount2 >= 8 && this.state.reputation >= 50) || (this.state.social >= 65 && totalActivities >= 15)) {
                    unlocked = true;
                    unlockedReason = '💬 社交达人在聚会中相识...';
                }
                break;
                
            case 'zonglian': // 宗濂 - GPA≥3.3 且志愿≥5 或声望≥70 且综测≥70
                if ((this.state.gpa >= 3.3 && this.state.volunteerHoursThisSemester >= 5) || (this.state.reputation >= 70 && this.state.social >= 70)) {
                    unlocked = true;
                    unlockedReason = '👼 医学天使的温柔相伴...';
                }
                break;
                
            case 'qide': // 启德 - 金币≥5000 且声望≥60 或兼职≥15 且综测≥70
                if ((this.state.money >= 5000 && this.state.reputation >= 60) || (this.state.parttimeCount >= 15 && this.state.social >= 70)) {
                    unlocked = true;
                    unlockedReason = '💼 精英在高雅生活中相识...';
                }
                break;
        }
        
        // 第一次解锁时显示提示
        if (unlocked && !this.state.loveModuleUnlocked) {
            this.state.loveModuleUnlocked = true;
            setTimeout(() => {
                this.addLog(`💕 ${unlockedReason}恋爱模块已解锁！`, 'success');
            }, 500);
        }
        
        return unlocked;
    }

    showDateChoice() {
        // 检查恋爱模块是否解锁
        if (!this.isLoveModuleUnlocked()) {
            this.showDateLockMessage();
            return;
        }

        const options = document.getElementById('choice-options');
        options.innerHTML = '';

        Object.values(GameData.dateLocations).forEach(loc => {
            // 检查季节限制
            if (loc.seasonRequired && !loc.seasonRequired.includes(this.state.month)) {
                return;
            }

            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.disabled = this.state.money < loc.cost;
            btn.innerHTML = `
                <div class="choice-btn-name">${loc.icon} ${loc.name}</div>
                <div class="choice-btn-desc">${loc.description}<br>${loc.cost > 0 ? `花费 ${loc.cost} 金币，` : ''}SAN +${loc.sanGain}</div>
            `;
            btn.addEventListener('click', () => {
                this.hideModal('choice-modal');
                this.doDate(loc);
            });
            options.appendChild(btn);
        });

        document.getElementById('choice-title').textContent = '选择约会地点';
        this.showModal('choice-modal');
    }
    
    // 显示恋爱模块锁定原因
    showDateLockMessage() {
        const college = this.state.college;
        let lockMsg = '恋爱模块未解锁。需要满足以下条件之一：\n\n';
        
        switch (college) {
            case 'qianxuesen':
                lockMsg += '• GPA ≥ 3.5 且竞赛获奖 ≥ 1 次\n• 或研究经验 ≥ 10';
                break;
            case 'nanyang':
                lockMsg += '• 声望 ≥ 50 且兼职工作 ≥ 5 次\n• 或综测 ≥ 70';
                break;
            case 'pengkang':
                lockMsg += '• 体力上限 ≥ 12 且本年跑步 ≥ 15 次\n• 或声望 ≥ 60 且志愿 ≥ 3 次';
                break;
            case 'wenzhi':
                lockMsg += '• 社团活动 ≥ 10 次且声望 ≥ 55\n• 或 SAN值 ≥ 85 且综测 ≥ 75';
                break;
            case 'zhongying':
                lockMsg += '• 本年志愿时数 ≥ 20 小时且声望 ≥ 65\n• 或综测 ≥ 80';
                break;
            case 'lizhi':
                lockMsg += '• 竞赛获奖 ≥ 2 次且 GPA ≥ 3.4\n• 或发表论文 ≥ 1 篇';
                break;
            case 'chongshi':
                lockMsg += '• 社团活动 ≥ 8 次且声望 ≥ 50\n• 或综测 ≥ 65 且各类活动 ≥ 15 次';
                break;
            case 'zonglian':
                lockMsg += '• GPA ≥ 3.3 且志愿 ≥ 5 次\n• 或声望 ≥ 70 且综测 ≥ 70';
                break;
            case 'qide':
                lockMsg += '• 金币 ≥ 5000 且声望 ≥ 60\n• 或兼职 ≥ 15 次且综测 ≥ 70';
                break;
        }
        
        document.getElementById('modal-title').textContent = '💔 恋爱模块未解锁';
        document.getElementById('modal-body').innerHTML = `<p>${lockMsg.replace(/\n/g, '<br>')}</p>`;
        this.showModal('modal');
    }

    // 显示恋爱解锁进度 Tooltip
    showLoveUnlockTooltip(btn) {
        const college = this.state.college;
        const conditions = this.getLoveUnlockConditions(college);
        
        // 只创建HTML tooltip，不创建title属性
        let html = '<div class="tooltip-content">';
        html += '<strong>❤️ 恋爱解锁条件</strong><br>';
        
        conditions.forEach((condition) => {
            const metA = this.checkConditionMet(condition.condA, college);
            const metB = condition.condB ? this.checkConditionMet(condition.condB, college) : false;
            const mainMet = metA && (condition.condB ? metB : true);
            
            html += `<div style="margin-bottom: 6px;">`;
            html += `<span ${metA ? 'style="color: #90EE90;"' : ''}>✓ ${condition.nameA}</span>`;
            if (condition.condB) {
                html += ` 且 <span ${metB ? 'style="color: #90EE90;"' : ''}>✓ ${condition.nameB}</span>`;
            }
            html += `</div>`;
            
            if (condition.alternativeName) {
                html += `<div style="color: #FFD700; font-size: 0.85rem; margin-bottom: 6px;">或</div>`;
                html += `<div style="margin-bottom: 6px;">`;
                if (!mainMet) {
                    html += `<span>💡 ${condition.alternativeName}</span>`;
                } else {
                    html += `<span style="color: #90EE90;">✓ 已满足条件</span>`;
                }
                html += `</div>`;
            }
        });
        
        html += '</div>';
        
        // 移除之前的tooltip
        let existingTooltip = btn.querySelector('.love-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        
        // 添加新的tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'love-tooltip';
        tooltip.innerHTML = html;
        btn.appendChild(tooltip);
    }

    // 获取书院的恋爱解锁条件详情
    getLoveUnlockConditions(college) {
        const conditions = {
            qianxuesen: [
                {
                    nameA: `GPA ≥ 3.5 (现在: ${this.state.gpa.toFixed(2)})`,
                    nameB: `竞赛获奖 ≥ 1 (现在: ${this.state.competitionWins})`,
                    alternativeName: `研究经验 ≥ 10 (现在: ${this.state.researchExp})`,
                    condA: { type: 'gpa', value: 3.5 },
                    condB: { type: 'competitionWins', value: 1 }
                }
            ],
            nanyang: [
                {
                    nameA: `声望 ≥ 50 (现在: ${this.state.reputation})`,
                    nameB: `兼职工作 ≥ 5 (现在: ${this.state.parttimeCount})`,
                    alternativeName: `综测 ≥ 70 (现在: ${this.state.social})`,
                    condA: { type: 'reputation', value: 50 },
                    condB: { type: 'parttimeCount', value: 5 }
                }
            ],
            pengkang: [
                {
                    nameA: `体力上限 ≥ 12 (现在: ${this.state.maxEnergy})`,
                    nameB: `本年跑步 ≥ 15 (现在: ${this.state.annualRuns || 0})`,
                    alternativeName: `声望 ≥ 60 且志愿 ≥ 3`,
                    condA: { type: 'maxEnergy', value: 12 },
                    condB: { type: 'annualRuns', value: 15 }
                }
            ],
            wenzhi: [
                {
                    nameA: `社团活动 ≥ 10 (现在: ${this.state.clubCount || 0})`,
                    nameB: `声望 ≥ 55 (现在: ${this.state.reputation})`,
                    alternativeName: `SAN值 ≥ 85 且综测 ≥ 75`,
                    condA: { type: 'clubCount', value: 10 },
                    condB: { type: 'reputation', value: 55 }
                }
            ],
            zhongying: [
                {
                    nameA: `本年志愿 ≥ 20 (现在: ${this.state.volunteerHoursThisYear})`,
                    nameB: `声望 ≥ 65 (现在: ${this.state.reputation})`,
                    alternativeName: `综测 ≥ 80 (现在: ${this.state.social})`,
                    condA: { type: 'volunteerHoursThisYear', value: 20 },
                    condB: { type: 'reputation', value: 65 }
                }
            ],
            lizhi: [
                {
                    nameA: `竞赛获奖 ≥ 2 (现在: ${this.state.competitionWins})`,
                    nameB: `GPA ≥ 3.4 (现在: ${this.state.gpa.toFixed(2)})`,
                    alternativeName: `发表论文 ≥ 1 (现在: ${this.state.researchPapers})`,
                    condA: { type: 'competitionWins', value: 2 },
                    condB: { type: 'gpa', value: 3.4 }
                }
            ],
            chongshi: [
                {
                    nameA: `社团活动 ≥ 8 (现在: ${this.state.clubCount || 0})`,
                    nameB: `声望 ≥ 50 (现在: ${this.state.reputation})`,
                    alternativeName: `综测 ≥ 65 且各类活动 ≥ 15`,
                    condA: { type: 'clubCount', value: 8 },
                    condB: { type: 'reputation', value: 50 }
                }
            ],
            zonglian: [
                {
                    nameA: `GPA ≥ 3.3 (现在: ${this.state.gpa.toFixed(2)})`,
                    nameB: `志愿 ≥ 5 (现在: ${this.state.volunteerHoursThisYear})`,
                    alternativeName: `声望 ≥ 70 且综测 ≥ 70`,
                    condA: { type: 'gpa', value: 3.3 },
                    condB: { type: 'volunteerHoursThisYear', value: 5 }
                }
            ],
            qide: [
                {
                    nameA: `金币 ≥ 5000 (现在: ${this.state.money})`,
                    nameB: `声望 ≥ 60 (现在: ${this.state.reputation})`,
                    alternativeName: `兼职 ≥ 15 且综测 ≥ 70`,
                    condA: { type: 'money', value: 5000 },
                    condB: { type: 'reputation', value: 60 }
                }
            ]
        };
        return conditions[college] || [];
    }

    // 检查单个条件是否满足
    checkConditionMet(cond, college) {
        if (!cond) return false;
        const state = this.state;
        
        switch (cond.type) {
            case 'gpa':
                return state.gpa >= cond.value;
            case 'reputation':
                return state.reputation >= cond.value;
            case 'competitionWins':
                return state.competitionWins >= cond.value;
            case 'researchExp':
                return state.researchExp >= cond.value;
            case 'parttimeCount':
                return state.parttimeCount >= cond.value;
            case 'maxEnergy':
                return state.maxEnergy >= cond.value;
            case 'annualRuns':
                return (state.annualRuns || 0) >= cond.value;
            case 'clubCount':
                return (state.clubCount || 0) >= cond.value;
            case 'volunteerHoursThisYear':
                return state.volunteerHoursThisYear >= cond.value;
            case 'researchPapers':
                return state.researchPapers >= cond.value;
            case 'money':
                return state.money >= cond.value;
            case 'san':
                return state.san >= cond.value;
            case 'social':
                return state.social >= cond.value;
            default:
                return false;
        }
    }

    // 显示恋爱选择菜单
    showLoveChoice() {
        if (!this.isLoveModuleUnlocked()) {
            this.showDateLockMessage();
            return;
        }

        // 如果已经有感情对象，显示约会选项
        if (this.state.inRelationship) {
            this.showDateChoice();
        } else {
            // 否则提示已解锁可以尝试脱单
            const options = document.getElementById('choice-options');
            options.innerHTML = '';

            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerHTML = `
                <div class="choice-btn-name">💕 开始约会</div>
                <div class="choice-btn-desc">恭喜你！恋爱模块已解锁，点击此选项开始约会吧</div>
            `;
            btn.addEventListener('click', () => {
                this.hideModal('choice-modal');
                this.showDateChoice();
            });
            options.appendChild(btn);

            document.getElementById('choice-title').textContent = '恋爱模块已解锁';
            this.showModal('choice-modal');
        }
    }

    // 约会
    doDate(location) {
        this.state.money -= location.cost;
        this.state.san = Math.min(100, this.state.san + location.sanGain);
        const effects = this.state.collegeEffects || {};
        const college = this.state.college;

        if (!this.state.inRelationship) {
            // 尝试脱单，应用书院特定的加成
            let successChance = Math.min(0.5, this.state.charm / 200);
            
            // 书院特定的脱单加成
            const loveBonus = this.getCollegeLoveBonus();
            successChance += loveBonus;
            successChance = Math.min(0.9, successChance); // 最多90%成功率
            
            if (Math.random() < successChance) {
                this.state.inRelationship = true;
                AchievementSystem.stats.inRelationship = true;
                AchievementSystem.unlock('cupid');
                
                // 书院特定成就和特效
                this.applyCollegeLoveSuccess();
                
                this.addLog('💕 表白成功！你脱单了！', 'success');
            } else {
                this.addLog(`${location.icon} 约会进行中，关系在慢慢升温...`);
                this.state.charm = Math.min(100, this.state.charm + 5);
            }
        } else {
            this.addLog(`${location.icon} 和对象去${location.name}约会，很开心`);
            // 已有对象时的约会效果
            this.applyCollegeLoveEffect();
        }

        this.updateUI();
    }
    
    // 获取书院特定的脱单加成
    getCollegeLoveBonus() {
        switch (this.state.college) {
            case 'qianxuesen': return 0.25;  // 钱班 +25%
            case 'chongshi': return 0.25;    // 崇实 +25%
            case 'zhongying': return 0.22;   // 仲英 +22%
            case 'pengkang': return 0.20;    // 彭康 +20%
            case 'qide': return 0.19;        // 启德 +19%
            case 'wenzhi': return 0.18;      // 文治 +18%
            case 'zonglian': return 0.17;    // 宗濂 +17%
            case 'lizhi': return 0.16;       // 励志 +16%
            case 'nanyang': return 0.15;     // 南洋 +15%
            default: return 0.15;
        }
    }
    
    // 脱单成功时的书院特效
    applyCollegeLoveSuccess() {
        const college = this.state.college;
        
        switch (college) {
            case 'qianxuesen': // 钱班 - 科研加成
                this.state.gpa = Math.min(4.3, this.state.gpa + 0.1);
                this.addLog('🧪 对象是学霸，学术水平又提升了！', 'success');
                break;
                
            case 'nanyang': // 南洋 - 金币奖励
                this.state.money += 100;
                this.addLog('⚙️ 对象赚了不少钱，和你分享~', 'success');
                break;
                
            case 'pengkang': // 彭康 - 体力上限提升
                this.state.maxEnergy = Math.min(15, this.state.maxEnergy + 1);
                this.addLog('🏃 运动伙伴让你身体更强健！', 'success');
                break;
                
            case 'wenzhi': // 文治 - SAN恢复翻倍
                this.state.san = Math.min(100, this.state.san + 20);
                this.addLog('🎨 艺术相伴，心灵得到治愈！', 'success');
                break;
                
            case 'zhongying': // 仲英 - 综测提升
                this.state.social = Math.min(100, this.state.social + 10);
                this.addLog('🤝 志愿者伙伴一起奉献，综测上升！', 'success');
                break;
                
            case 'lizhi': // 励志 - 学习效率提升
                this.state.studyEfficiency = Math.min(2.0, this.state.studyEfficiency + 0.1);
                this.addLog('📐 和学霸一起，学习效率倍增！', 'success');
                break;
                
            case 'chongshi': // 崇实 - 声望提升
                this.changeReputation(10, '脱单成功');
                this.addLog('💬 恋爱开花，校园里都知道了！', 'success');
                break;
                
            case 'zonglian': // 宗濂 - 体力恢复
                this.state.energy = Math.min(this.state.maxEnergy, this.state.energy + 5);
                this.addLog('👼 温柔的陪伴让你精力充沛！', 'success');
                break;
                
            case 'qide': // 启德 - 金币优惠
                this.state.money += 200;
                this.addLog('💼 精英约会，经济生活改善！', 'success');
                break;
        }
    }
    
    // 约会时的书院特效（已有对象）
    applyCollegeLoveEffect() {
        const college = this.state.college;
        
        switch (college) {
            case 'qianxuesen': // 钱班 - GPA微幅提升
                this.state.gpa = Math.min(4.3, this.state.gpa + 0.02);
                break;
                
            case 'nanyang': // 南洋 - 金币小额奖励
                this.state.money += 20;
                break;
                
            case 'pengkang': // 彭康 - 体力上限微幅提升
                if (Math.random() < 0.1) {
                    this.state.maxEnergy = Math.min(15, this.state.maxEnergy + 1);
                }
                break;
                
            case 'wenzhi': // 文治 - SAN恢复加倍
                this.state.san = Math.min(100, this.state.san + 10);
                break;
                
            case 'zhongying': // 仲英 - 综测小幅提升
                this.state.social = Math.min(100, this.state.social + 3);
                break;
                
            case 'lizhi': // 励志 - 随机灵感事件
                if (Math.random() < 0.2) {
                    this.addLog('💡 讨论中突然想到解题思路！', 'success');
                }
                break;
                
            case 'chongshi': // 崇实 - 声望微幅提升
                this.changeReputation(2, '约会散步');
                break;
                
            case 'zonglian': // 宗濂 - SAN恢复加成
                this.state.san = Math.min(100, this.state.san + 8);
                break;
                
            case 'qide': // 启德 - 消费打折
                // 已在location.cost里体现
                this.addLog('💰 精英约会，花钱更划算～', 'info');
                break;
        }
    }

    // 休息
    doRest() {
        this.state.san = Math.min(100, this.state.san + 5);
        this.addLog('😴 好好休息了一下');
        this.updateUI();
    }


    
    // 声望变化
    changeReputation(amount, reason) {
        const oldRep = this.state.reputation;
        this.state.reputation = Math.max(0, Math.min(100, this.state.reputation + amount));
        
        if (amount > 0) {
            this.addLog(`📈 ${reason}，声望+${amount}`, 'success');
            this.addBBSEvent('positive', `【好评】${reason}`);
        } else {
            this.addLog(`📉 ${reason}，声望${amount}`, 'warning');
            this.addBBSEvent('negative', `【热议】${reason}`);
            this.state.scandalCount++;
        }
        
        // 检查声望相关成就
        if (this.state.reputation >= 90) {
            AchievementSystem.unlock('campusStar');
        }
        if (this.state.scandalCount >= 3) {
            AchievementSystem.unlock('infamous');
        }
    }



    // 兼职打工
    doParttime() {
        if (this.state.energy < 4) {
            this.showMessage('体力不足', '你太累了，需要休息一下。');
            return;
        }

        this.state.energy -= 4;
        const effects = this.state.collegeEffects || {};
        
        // 随机收入 60-140，避免早期经济过快膨胀
        let income = Math.floor(Math.random() * 80) + 60;
        
        // 启德书院兼职收入+30%
        if (effects.moneyEfficiency > 1) {
            income = Math.floor(income * effects.moneyEfficiency);
            this.addLog(`💼 兼职工作完成，启德理财buff加持！获得 ${income} 金币`, 'success');
        } else {
            this.addLog(`💼 兼职工作完成，获得 ${income} 金币`);
        }
        
        this.state.money += income;
        this.state.parttimeCount = (this.state.parttimeCount || 0) + 1;
        this.state.san -= 3; // 工作更累
        
        // 就业路线进度
        if (this.state.careerPath === 'job') {
            const progress = this.state.careerProgress.job;
            progress.internship = Math.min(3, (progress.internship || 0) + 0.3);
            progress.interview = Math.min(100, (progress.interview || 0) + 5);
            
            // 实习够多就能拿到offer
            if (progress.internship >= 3 && progress.interview >= 80 && !progress.offer) {
                progress.offer = true;
                this.addLog('💼 恭喜！你拿到了正式工作Offer！', 'success');
                AchievementSystem.unlock('jobOffer');
                this.addBBSEvent('工作Offer');
            }
        }
        
        // 记录兼职收入用于成就
        AchievementSystem.stats.totalEarnings = (AchievementSystem.stats.totalEarnings || 0) + income;
        
        // 检查成就
        if (this.state.parttimeCount >= 20) {
            AchievementSystem.unlock('partTimeKing');
        }
        
        this.state.actionsThisTurn.push('parttime');
        AchievementSystem.checkAchievements(this.state);
        this.updateCareerPanel();
        this.updateUI();
    }

    // 显示竞赛选择
    showCompetitionChoice() {
        const options = document.getElementById('choice-options');
        options.innerHTML = '';

        const competitions = [
            { id: 'math', name: '数学建模竞赛', icon: '📐', difficulty: 'hard', reward: { social: 15, gpa: 0.1 }, san: -8 },
            { id: 'program', name: '程序设计竞赛', icon: '💻', difficulty: 'hard', reward: { social: 15, gpa: 0.1 }, san: -8 },
            { id: 'robot', name: '机器人大赛', icon: '🤖', difficulty: 'medium', reward: { social: 10, gpa: 0.05 }, san: -6 },
            { id: 'english', name: '英语竞赛', icon: '🔤', difficulty: 'easy', reward: { social: 8, gpa: 0.03 }, san: -4 },
            { id: 'debate', name: '辩论赛', icon: '🎤', difficulty: 'medium', reward: { social: 12, charm: 5 }, san: -5 }
        ];

        competitions.forEach(comp => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.disabled = this.state.energy < 4;
            btn.innerHTML = `
                <div class="choice-btn-name">${comp.icon} ${comp.name}</div>
                <div class="choice-btn-desc">难度: ${comp.difficulty === 'hard' ? '困难' : comp.difficulty === 'medium' ? '中等' : '简单'}<br>SAN ${comp.san}，获奖可得综测+${comp.reward.social}</div>
            `;
            btn.addEventListener('click', () => {
                this.hideModal('choice-modal');
                this.doCompetition(comp);
            });
            options.appendChild(btn);
        });

        document.getElementById('choice-title').textContent = '选择竞赛项目';
        this.showModal('choice-modal');
    }

    // 参加竞赛
    doCompetition(competition) {
        if (this.state.energy < 4) {
            this.showMessage('体力不足', '竞赛需要充沛的精力！');
            return;
        }

        this.state.energy -= 4;
        this.state.san += competition.san;
        this.state.competitionCount = (this.state.competitionCount || 0) + 1;

        // 根据难度和GPA计算获奖概率
        let winChance = 0.3;
        if (competition.difficulty === 'easy') winChance = 0.5;
        else if (competition.difficulty === 'hard') winChance = 0.2;
        
        // GPA加成
        winChance += (this.state.gpa - 3.0) * 0.1;
        winChance = Math.min(0.8, Math.max(0.1, winChance));

        if (Math.random() < winChance) {
            // 获奖
            this.state.competitionWins = (this.state.competitionWins || 0) + 1;
            if (competition.reward.social) {
                this.state.social = Math.min(100, this.state.social + competition.reward.social);
            }
            if (competition.reward.gpa) {
                this.state.gpa = Math.min(4.3, this.state.gpa + competition.reward.gpa);
            }
            if (competition.reward.charm) {
                this.state.charm = Math.min(100, this.state.charm + competition.reward.charm);
            }
            this.addLog(`🏆 ${competition.name}获奖！综测和能力都提升了！`, 'success');
            this.addBBSEvent('竞赛获奖');
            
            // 保研路线加分
            if (this.state.careerPath === 'postgrad') {
                const progress = this.state.careerProgress.postgrad;
                progress.competition = (progress.competition || 0) + 10;
                this.addLog('🎓 竞赛获奖为保研加分！', 'success');
            }
            
            // 检查竞赛成就
            if (this.state.competitionWins >= 3) {
                AchievementSystem.unlock('competitionMaster');
            }
        } else {
            this.addLog(`${competition.icon} 参加了${competition.name}，虽然没获奖但收获了经验`);
            this.state.social = Math.min(100, this.state.social + 2);
        }

        this.state.actionsThisTurn.push('competition');
        AchievementSystem.checkAchievements(this.state);
        this.updateCareerPanel();
        this.updateUI();
    }

    // 科研实习
    doResearch() {
        let energyCost = 3;
        
        // 创新港debuff：体力消耗×1.5
        if (this.state.iHarbourDebuff) {
            energyCost = Math.ceil(energyCost * 1.5);
        }
        
        if (this.state.energy < energyCost) {
            this.showMessage('体力不足', '科研需要专注力！');
            return;
        }

        // 大一不能科研
        if (this.state.year === 1) {
            this.showMessage('时机未到', '大一新生建议先打好基础，大二再考虑科研。');
            return;
        }

        this.state.energy -= energyCost;
        this.state.san -= 3;
        this.state.researchExp = (this.state.researchExp || 0) + 1;
        
        // 保研路线进度
        if (this.state.careerPath === 'postgrad') {
            const progress = this.state.careerProgress.postgrad;
            if (!progress.advisor && this.state.researchExp >= 5) {
                progress.advisor = true;
                this.addLog('🎓 导师对你印象不错，愿意收你为研究生！', 'success');
                AchievementSystem.unlock('postgradSuccess');
            }
            progress.dachuang = Math.min(1, (progress.dachuang || 0) + 0.1);
        }

        // 累计科研经验到一定程度可以发论文
        if (this.state.researchExp >= 10 && Math.random() < 0.2) {
            this.state.researchPapers = (this.state.researchPapers || 0) + 1;
            this.state.social = Math.min(100, this.state.social + 20);
            this.addLog('📝 科研成果发表论文！综测分大幅提升！', 'success');
            AchievementSystem.unlock('researcher');
            this.addBBSEvent('论文发表');
        } else if (this.state.researchExp >= 5 && Math.random() < 0.3) {
            this.state.social = Math.min(100, this.state.social + 5);
            this.addLog('🔬 科研项目取得进展，导师很满意');
        } else {
            this.addLog('🔬 在实验室学习科研方法，积累经验中...');
        }

        this.state.actionsThisTurn.push('research');
        AchievementSystem.checkAchievements(this.state);
        this.updateCareerPanel();
        this.updateUI();
    }

    // 检查行动后事件
    checkActionEvents(action) {
        const events = EventSystem.checkActionEvents(action, this.state);
        events.forEach(event => {
            const changes = EventSystem.applyEventEffects(event, this.state);
            const message = EventSystem.generateEventMessage(event, changes);
            this.showEventModal(event, message);
        });
    }

    // 显示事件弹窗
    showEventModal(event, message) {
        document.getElementById('modal-title').textContent = `${event.icon} ${event.name}`;
        document.getElementById('modal-body').innerHTML = `<p>${message.replace(/\n/g, '<br>')}</p>`;
        this.showModal('modal');
    }

    // 下一回合
    async nextTurn() {
        // 检查体力是否耗尽
        if (this.state.energy <= 0) {
            AchievementSystem.recordExhaustion();
        }

        // 月末结算事件 (Month End Check)
        const monthEndEvents = EventSystem.checkMonthEndEvents(this.state);
        monthEndEvents.forEach(event => {
            EventSystem.applyEventEffects(event, this.state);
            this.addLog(`${event.icon} ${event.name}`);
        });

        // 尝试触发 AI 随机事件 (AI Event)
        let aiEvent = null;
        try {
            const config = AIModule.getCurrentConfig();
            // 只有当配置了 Key 且随机概率满足时(例如 30%) 尝试调用 AI
            // 这里为了演示，只要有 Key 就尝试调，或者可以配合 RandomEventManager 混合使用
            if (config.key && Math.random() < 0.4) { 
                console.log('Attempting AI Event Generation...');
                this.showMessage('AI正在思考...', '正在生成本月随机事件，请稍候...');
                const aiResult = await AIModule.fetchAIEvent();
                console.log('AI Result:', aiResult);
                
                if (aiResult) {
                    // 构造符合游戏事件格式的对象
                    aiEvent = {
                        id: `ai_${Date.now()}`,
                        name: '校园奇遇 (AI)',
                        icon: '🤖',
                        description: aiResult.event_text,
                        options: [
                            {
                                text: '我知道了',
                                effects: aiResult.effects
                            }
                        ]
                    };
                    // 关闭等待提示
                    this.hideModal('modal'); 
                }
            }
        } catch (e) {
            console.warn('AI通过API生成事件失败，回退到本地事件库:', e);
            this.hideModal('modal'); // 确保关闭等待提示
        }

        if (aiEvent) {
            this.showRandomEventModal(aiEvent);
            return;
        }

        // === 原有逻辑：本地随机事件系统 (Fallback) ===
        const monthlyEvent = RandomEventManager.rollMonthlyEvent(this.state);
        if (monthlyEvent) {
            this.showRandomEventModal(monthlyEvent);
            return; // 等待玩家选择后再继续
        }

        // 继续正常流程
        this.continueNextTurn();
    }
    
    // 显示月末随机事件弹窗
    showRandomEventModal(event) {
        console.log('Showing Random Event:', event); // Debug infos
        this.currentRandomEvent = event;
        
        // 设置事件信息
        const iconEl = document.getElementById('random-event-icon');
        const titleEl = document.getElementById('random-event-title');
        const descEl = document.getElementById('random-event-desc'); // ID from second modal
        
        if (iconEl) iconEl.textContent = event.icon;
        if (titleEl) titleEl.textContent = event.name;
        if (descEl) descEl.textContent = event.description;
        
        console.log('Event elements updated:', {icon: !!iconEl, title: !!titleEl, desc: !!descEl});
        document.getElementById('random-event-desc').textContent = event.description;
        
        // 生成选项按钮
        const optionsContainer = document.getElementById('random-event-options');
        optionsContainer.innerHTML = '';
        
        event.options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'event-option-btn';
            
            // 生成效果提示
            const hints = [];
            if (option.effects.money) hints.push(`金币${option.effects.money > 0 ? '+' : ''}${option.effects.money}`);
            if (option.effects.san) hints.push(`SAN${option.effects.san > 0 ? '+' : ''}${option.effects.san}`);
            if (option.effects.energy) hints.push(`体力${option.effects.energy > 0 ? '+' : ''}${option.effects.energy}`);
            if (option.effects.social) hints.push(`综测${option.effects.social > 0 ? '+' : ''}${option.effects.social}`);
            
            btn.innerHTML = `
                <div class="event-option-icon">${option.icon}</div>
                <div class="event-option-content">
                    <div class="event-option-text">${option.text}</div>
                    <div class="event-option-hint">${hints.join(' | ') || '无明显影响'}</div>
                </div>
            `;
            
            btn.addEventListener('click', () => this.selectRandomEventOption(index));
            optionsContainer.appendChild(btn);
        });
        
        this.showModal('random-event-modal');
    }
    
    // 选择随机事件选项
    selectRandomEventOption(optionIndex) {
        const event = this.currentRandomEvent;
        const option = event.options[optionIndex];
        
        // 隐藏事件弹窗
        this.hideModal('random-event-modal');
        
        // 应用效果
        const result = RandomEventManager.applyOptionEffects(option, this.state);
        
        // 标记一次性事件
        if (event.once) {
            RandomEventManager.markEventTriggered(event.id);
        }
        
        // 生成并添加日志
        const logText = RandomEventManager.generateLogText(event, option, result, this.state);
        this.addLog(logText, result.achievement ? 'success' : 'normal');
        
        // 显示结果弹窗
        this.showEventResultModal(result);
    }
    
    // 显示事件结果弹窗
    showEventResultModal(result) {
        // 设置结果图标
        const hasPositive = Object.values(result.changes).some(v => v > 0);
        const hasNegative = Object.values(result.changes).some(v => v < 0);
        let icon = '✨';
        if (hasNegative && !hasPositive) icon = '😢';
        else if (hasPositive && !hasNegative) icon = '🎉';
        else if (hasPositive && hasNegative) icon = '🤔';
        
        document.getElementById('result-icon').textContent = icon;
        document.getElementById('result-message').textContent = result.message;
        
        // 生成效果标签
        const effectsContainer = document.getElementById('result-effects');
        effectsContainer.innerHTML = '';
        
        // 成就提示
        if (result.achievement) {
            const achievementData = AchievementSystem.achievements[result.achievement];
            if (achievementData) {
                const achievementDiv = document.createElement('div');
                achievementDiv.className = 'result-achievement';
                achievementDiv.innerHTML = `
                    <span class="result-achievement-icon">🏆</span>
                    <span class="result-achievement-text">成就解锁：${achievementData.name}</span>
                `;
                effectsContainer.appendChild(achievementDiv);
            }
        }
        
        // 效果标签
        const effectTags = [];
        if (result.changes.san) {
            effectTags.push({
                text: `SAN ${result.changes.san > 0 ? '+' : ''}${result.changes.san}`,
                type: result.changes.san > 0 ? 'positive' : 'negative'
            });
        }
        if (result.changes.energy) {
            effectTags.push({
                text: `体力 ${result.changes.energy > 0 ? '+' : ''}${result.changes.energy}`,
                type: result.changes.energy > 0 ? 'positive' : 'negative'
            });
        }
        if (result.changes.money) {
            effectTags.push({
                text: `金币 ${result.changes.money > 0 ? '+' : ''}${result.changes.money}`,
                type: result.changes.money > 0 ? 'positive' : 'negative'
            });
        }
        if (result.changes.social) {
            effectTags.push({
                text: `综测 ${result.changes.social > 0 ? '+' : ''}${result.changes.social}`,
                type: result.changes.social > 0 ? 'positive' : 'negative'
            });
        }
        if (result.changes.charm) {
            effectTags.push({
                text: `魅力 ${result.changes.charm > 0 ? '+' : ''}${result.changes.charm}`,
                type: result.changes.charm > 0 ? 'positive' : 'negative'
            });
        }
        if (result.changes.mastery) {
            effectTags.push({
                text: `掌握度 ${result.changes.mastery > 0 ? '+' : ''}${result.changes.mastery}`,
                type: result.changes.mastery > 0 ? 'positive' : 'negative'
            });
        }
        
        effectTags.forEach(tag => {
            const span = document.createElement('span');
            span.className = `effect-tag ${tag.type}`;
            span.textContent = tag.text;
            effectsContainer.appendChild(span);
        });
        
        this.showModal('event-result-modal');
        
        // 结果确认后继续游戏流程
        document.getElementById('result-confirm').onclick = () => {
            this.hideModal('event-result-modal');
            this.continueNextTurn();
        };
    }
    
    // 继续下一回合流程（事件处理后调用）
    continueNextTurn() {
        // 前进一个月
        this.advanceMonth();

        // 重置每回合状态
        this.state.energy = this.state.maxEnergy;
        this.state.attendedClassThisTurn = false;
        this.state.actionsThisTurn = [];
        
        // 清除临时加成
        if (this.state.tempStudyBoost) {
            delete this.state.tempStudyBoost;
        }

        // 恋爱加成
        if (this.state.inRelationship) {
            this.state.san = Math.min(100, this.state.san + 1);
            this.state.money -= 50; // 恋爱消费
        }

        // 更新SAN记录
        AchievementSystem.updateSanRecord(this.state.san);
        
        // 自动保存游戏状态 (静默保存，不弹窗)
        this.saveGame(true);

        // 检查成就
        AchievementSystem.checkAchievements(this.state);

        // 检查游戏结束条件
        if (this.checkGameOver()) {
            return;
        }

        this.updateUI();
    }

    // 每月知识遗忘衰减
    applyMonthlyMasteryDecay() {
        // 先保证体力上限等核心数值为整数
        this.normalizeStateIntegers();

        const decayCourseList = (list) => {
            if (!list) return;
            list.forEach(course => {
                const difficulty = course.difficulty || 0.6;
                const baseDecay = 4 + Math.max(0, (difficulty - 0.5) * 10);
                const masteryFactor = course.mastery >= 80 ? 1.25 : course.mastery >= 50 ? 1 : 0.7;
                const decayRate = course.masteryDecayRate || 1;
                const decay = baseDecay * masteryFactor * decayRate;
                course.mastery = Math.max(0, course.mastery - decay);
            });
        };

        decayCourseList(this.state.currentCourses);
        decayCourseList(this.state.retakeCourses);
    }

    // 推进月份
    advanceMonth() {
        this.state.month++;
        this.state.totalMonths++;

        // 确保基础数值先被规整，避免前期动作带来的小数残留
        this.normalizeStateIntegers();

        this.applyMonthlyMasteryDecay();

        // 月份循环
        if (this.state.month > 12) {
            this.state.month = 1;
        }

        // 检查学期转换
        if (this.state.month === 2) {
            // 春季学期开始 - 先进行补考
            if (this.state.makeupCourses && this.state.makeupCourses.length > 0) {
                this.doMakeupExam();
            }
            this.loadSemesterCourses();
            this.addLog('📅 春季学期开始了', 'important');
            
            // 情人节检查
            this.checkValentineDay();
            
            // 大三下学期开启长远规划
            if (this.state.year === 3 && !this.state.careerPath) {
                this.addLog('🎯 大三下学期了，是时候考虑未来方向了！', 'important');
                setTimeout(() => this.showCareerChoice(), 1000);
            }
            
            // 学期初选课
            if (!this.state.courseBiddingDone) {
                setTimeout(() => this.showCourseBidding(), 500);
            }
        } else if (this.state.month === 7) {
            // 暑假小学期与DLC
            this.startSummerTerm();
        } else if (this.state.month === 12) {
            // 寒假特殊DLC
            this.startWinterBreak();
        } else if (this.state.month === 9) {
            // 新学年开始 - 先进行补考
            if (this.state.makeupCourses && this.state.makeupCourses.length > 0) {
                this.doMakeupExam();
            }
            this.startNewYear();
            
            // 重置学期选课状态
            this.state.courseBiddingDone = false;
            this.state.hardCourseDebuff = false;
            
            // 学期初选课
            if (this.state.year <= 3) {
                setTimeout(() => this.showCourseBidding(), 500);
            }
        }
        
        // 体测检查（5月和10月）
        if (this.state.month === 5 || this.state.month === 10) {
            this.checkPhysicalTest();
        }

        // 检查期末考试
        if (this.state.month === 1 || this.state.month === 6) {
            this.doExam();
        }
        
        // 考试周前一个月进行强化提示和选项
        if ((this.state.month === 5 || this.state.month === 11) && !this.state.examWeekWarningShown) {
            this.state.examWeekWarningShown = true;
            setTimeout(() => this.showExamWeekWarning(), 500);
        } else if (this.state.month !== 5 && this.state.month !== 11) {
            this.state.examWeekWarningShown = false;
        }
    }

    // 开始小学期 - 使用书院个性化课程
    startSummerTerm() {
        const college = this.state.college;
        const yearKey = `year${this.state.year}`;
        
        // 优先使用书院专属小学期课程
        let summerCourse;
        if (GameData.collegeSummerCourses && GameData.collegeSummerCourses[college] && 
            GameData.collegeSummerCourses[college][yearKey]) {
            summerCourse = GameData.collegeSummerCourses[college][yearKey];
        } else {
            summerCourse = GameData.summerCourses[yearKey];
        }
        
        if (summerCourse) {
            const collegeName = GameData.colleges[college]?.name || '书院';
            let descText = `七月炎炎，${summerCourse.name}开始了！`;
            if (summerCourse.description) {
                descText += summerCourse.description;
            }
            
            document.getElementById('summer-desc').textContent = descText;
            
            const options = document.getElementById('summer-options');
            options.innerHTML = `
                <div class="summer-course-info">
                    <div class="summer-college-tag">${collegeName}专属</div>
                </div>
                <button class="choice-btn" id="summer-confirm">
                    <div class="choice-btn-name">📋 开始${summerCourse.name}</div>
                    <div class="choice-btn-desc">消耗体力 ${summerCourse.energyCost}，SAN -${summerCourse.sanLoss}，获得 ${summerCourse.credits} 学分</div>
                </button>
            `;

            document.getElementById('summer-confirm').addEventListener('click', () => {
                this.hideModal('summer-modal');
                this.completeSummerCourse(summerCourse);
            });

            this.showModal('summer-modal');
        }
    }

    // 完成小学期课程
    completeSummerCourse(course) {
        let sanLoss = course.sanLoss;
        let energyCost = course.energyCost;
        const effects = this.state.collegeEffects || {};
        const college = this.state.college;
        
        // 彭康书院夏季体育SAN恢复加成 (1.2倍)
        if (effects.summerSanMultiplier > 1 && college === 'pengkang') {
            sanLoss = Math.floor(sanLoss / effects.summerSanMultiplier);
            this.addLog('🥋 彭康书院体育底子好，小学期轻松应对！', 'success');
            
            AchievementSystem.stats.pengkangTaichiCount = (AchievementSystem.stats.pengkangTaichiCount || 0) + 1;
            if (AchievementSystem.stats.pengkangTaichiCount >= 10) {
                AchievementSystem.unlock('pengkangTaichi');
            }
        }
        
        // 书院个性化小学期特效
        switch (college) {
            case 'pengkang':
            case 'wenzhi':
                // 金工实习（打小锤子）
                if (course.id && course.id.includes('metalwork')) {
                    this.addLog('🔨 打小锤子打到手疼，但也是一种特别的体验', 'info');
                    if (Math.random() < 0.3) {
                        this.addLog('🎯 打出了完美的六边形！工艺满分', 'success');
                        this.state.social += 2;
                    }
                }
                break;
                
            case 'nanyang':
            case 'zhongying':
                // 程序设计周
                if (course.id && course.id.includes('programming')) {
                    this.addLog('💻 写代码写到眼花，但收获满满', 'info');
                    if (Math.random() < 0.2) {
                        this.addLog('🐛 Debug到凌晨3点终于找到Bug！', 'warning');
                        sanLoss += 5;
                    }
                }
                break;
                
            case 'chongshi':
            case 'qide':
                // 社会实践
                if (course.id && course.id.includes('social_practice')) {
                    this.addLog('📊 社会调研收获颇丰', 'info');
                    this.state.social += 5;
                    if (college === 'qide') {
                        const bonus = Math.floor(this.state.gpa * 30);
                        this.state.money += bonus;
                        this.addLog(`💰 调研项目获得奖励 ${bonus} 金币`, 'success');
                    }
                }
                break;
                
            case 'qianxuesen':
                // 科研训练
                if (course.id && course.id.includes('research')) {
                    this.addLog('🔬 科研训练让你提前体验了科研生活', 'info');
                    this.state.researchExp = (this.state.researchExp || 0) + 20;
                    if (Math.random() < 0.15) {
                        this.addLog('🎉 小学期科研成果显著，导师表扬！', 'success');
                        this.state.social += 3;
                    }
                }
                break;
                
            case 'zonglian':
                // 医学实习
                if (course.id && (course.id.includes('anatomy') || course.id.includes('clinical'))) {
                    this.addLog('🏥 医学实习让你对生命有了更深的敬畏', 'info');
                    energyCost += 2; // 医学生更累
                }
                break;
                
            case 'lizhi':
                // 数学研讨班
                if (course.id && course.id.includes('math_seminar')) {
                    this.addLog('📐 数学研讨班上与大佬们思维碰撞', 'info');
                    if (Math.random() < 0.2) {
                        this.addLog('💡 某个问题突然想通了！', 'success');
                        this.state.studyEfficiency = Math.min(2.0, this.state.studyEfficiency + 0.05);
                    }
                }
                break;
        }
        
        this.state.san -= sanLoss;
        this.state.energy = Math.max(0, this.state.energy - energyCost);
        this.state.totalCredits += course.credits;
        this.addLog(`☀️ 完成了${course.name}，获得${course.credits}学分`, 'important');
        
        // 跳过8月
        this.state.month = 8;
    }

    // 开始寒假 - 特殊DLC系统
    startWinterBreak() {
        const college = this.state.college;
        const year = this.state.year;
        
        // 寒假只有大一大二大三有效果（大四没有，因为在做毕设）
        if (year >= 4) {
            this.addLog('❄️ 大四了，寒假继续做毕设...', 'info');
            return;
        }

        // 寒假选择弹窗
        const options = document.getElementById('choice-options');
        if (!options) return;
        options.innerHTML = '';

        const winterOptions = [
            {
                id: 'stay_home',
                icon: '🏡',
                name: '回家陪家人',
                desc: '与家人共度新年，温暖而治愈',
                effects: { san: 15, energy: 5, money: -50 },
                requirement: null,
                collegeBuff: null
            },
            {
                id: 'internship',
                icon: '💼',
                name: '寒假实习',
                desc: '利用假期争取实习机会，赚取生活费',
                effects: { money: 300, san: -5, charm: 3 },
                requirement: 'year2',
                collegeBuff: 'qide'  // 启德书院特别加成
            },
            {
                id: 'learning',
                icon: '📚',
                name: '宅在宿舍学习',
                desc: '利用假期为下学期预习或补习课程',
                effects: { mastery: 15, san: -8, energy: 3 },
                requirement: null,
                collegeBuff: 'qianxuesen'  // 钱班特别加成
            },
            {
                id: 'travel',
                icon: '✈️',
                name: '出去旅游',
                desc: '利用假期去远方旅行，开阔眼界',
                effects: { san: 10, charm: 5, money: -100, reputation: 3 },
                requirement: 'money_200',
                collegeBuff: null
            },
            {
                id: 'volunteer',
                icon: '🤝',
                name: '寒假志愿服务',
                desc: '参加返乡志愿服务，帮助留守儿童',
                effects: { social: 10, reputation: 8, san: 8 },
                requirement: null,
                collegeBuff: 'zhongying'  // 仲英书院特别加成
            },
            {
                id: 'tech_camp',
                icon: '🤖',
                name: '技术冬令营',
                desc: '参加院校举办的科技冬令营，提升技能',
                effects: { researchExp: 30, money: -50, san: -3 },
                requirement: 'year2',
                collegeBuff: 'qianxuesen'  // 钱班特别加成
            }
        ];

        // 根据年级和条件过滤选项
        const availableOptions = winterOptions.filter(opt => {
            if (opt.requirement === 'year2' && year < 2) return false;
            if (opt.requirement === 'money_200' && this.state.money < 200) return false;
            return true;
        });

        availableOptions.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            
            // 检查是否有书院加成
            let buffText = '';
            let hasBuff = false;
            if (opt.collegeBuff && opt.collegeBuff === college) {
                buffText = ' ⭐ 书院加成！';
                hasBuff = true;
            }
            
            btn.innerHTML = `
                <div class="choice-btn-name">${opt.icon} ${opt.name}${buffText}</div>
                <div class="choice-btn-desc">${opt.desc}</div>
            `;
            btn.addEventListener('click', () => {
                this.hideModal('choice-modal');
                this.doWinterBreakActivity(opt);
            });
            options.appendChild(btn);
        });

        document.getElementById('choice-title').textContent = '❄️ 寒假怎么过？';
        this.showModal('choice-modal');
    }

    // 执行寒假活动
    doWinterBreakActivity(activity) {
        const college = this.state.college;
        const hasBuff = activity.collegeBuff && activity.collegeBuff === college;
        
        // 应用基础效果
        const effects = { ...activity.effects };
        
        // 应用书院加成
        if (hasBuff) {
            switch (college) {
                case 'qide':
                    // 启德：兼职收入额外+30%
                    if (activity.id === 'internship') {
                        effects.money = Math.floor(effects.money * 1.3);
                        this.addLog('💰 启德实习优势，收入特别丰厚！', 'success');
                    }
                    break;
                case 'qianxuesen':
                    // 钱班：学习掌握度翻倍
                    if (activity.id === 'learning') {
                        effects.mastery = (effects.mastery || 0) * 2;
                        this.addLog('📚 钱班学霸加持，学习效率翻倍！', 'success');
                    } else if (activity.id === 'tech_camp') {
                        effects.researchExp = (effects.researchExp || 0) * 1.5;
                        this.addLog('🤖 钱班科研积累深厚，冬令营收获巨大！', 'success');
                    }
                    break;
                case 'zhongying':
                    // 仲英：志愿综测加成
                    if (activity.id === 'volunteer') {
                        effects.social = (effects.social || 0) * 1.5;
                        this.addLog('🤝 仲英志愿品德加持，综测提升显著！', 'success');
                    }
                    break;
            }
        }

        // 应用效果到状态
        if (effects.san) {
            this.state.san = Math.min(100, Math.max(0, this.state.san + effects.san));
        }
        if (effects.energy) {
            this.state.energy = Math.min(this.state.maxEnergy, this.state.energy + effects.energy);
        }
        if (effects.money) {
            this.state.money = Math.max(0, this.state.money + effects.money);
        }
        if (effects.charm) {
            this.state.charm = Math.min(100, this.state.charm + effects.charm);
        }
        if (effects.reputation) {
            this.changeReputation(effects.reputation, `寒假${activity.name}`);
        }
        if (effects.social) {
            this.state.social = Math.min(100, this.state.social + effects.social);
        }
        if (effects.researchExp) {
            this.state.researchExp = (this.state.researchExp || 0) + effects.researchExp;
        }
        if (effects.mastery) {
            // 为所有课程增加掌握度
            this.state.currentCourses.forEach(course => {
                course.mastery = Math.min(100, course.mastery + effects.mastery);
            });
        }

        // 特殊活动特效
        const logs = {
            stay_home: `🏡 回家陪了家人一个完整的春节，感受到了家的温暖`,
            internship: `💼 经过寒假实习，你的实践能力得到了提升`,
            learning: `📚 利用寒假时间预习下学期内容，充分准备`,
            travel: `✈️ 去远方旅行开阔了眼界，回来后精神焕发`,
            volunteer: `🤝 寒假志愿服务让你收获了很多感动`,
            tech_camp: `🤖 参加冬令营学到了最新的技术和思想`
        };

        this.addLog(logs[activity.id] || `完成了寒假活动：${activity.name}`, 'important');

        // 寒假成就检查
        if (activity.id === 'stay_home') {
            AchievementSystem.unlock('homecoming');
        } else if (activity.id === 'tech_camp' && college === 'qianxuesen') {
            AchievementSystem.unlock('techCampExcellent');
        }

        this.normalizeStateIntegers();
        this.updateUI();
    }

    // 显示考试周前警告与冲刺选项
    showExamWeekWarning() {
        const month = this.state.month;
        const nextMonth = month === 5 ? 6 : 1;
        
        // 计算哪些课程可能不及格
        const failRiskCourses = this.state.currentCourses.filter(c => c.mastery < 50);
        
        let warningMsg = `📚 下个月就要进行期${month === 5 ? '末' : '末'}考试了！<br>`;
        if (failRiskCourses.length > 0) {
            warningMsg += `<strong>⚠️ 以下课程掌握度较低，需要加强复习：</strong><br>`;
            failRiskCourses.forEach(c => {
                warningMsg += `• ${c.name}: ${Math.round(c.mastery)}%<br>`;
            });
        } else {
            warningMsg += `✅ 你的课程掌握度都不错，可以放心准备考试！<br>`;
        }
        
        warningMsg += `<br><strong>你可以选择：</strong><br>`;
        warningMsg += `1️⃣ 继续正常学习和工作<br>`;
        warningMsg += `2️⃣ 进入"考试冲刺模式"（禁用娱乐、兼职等，专注复习）`;
        
        document.getElementById('modal-title').textContent = '📝 考试在即';
        document.getElementById('modal-body').innerHTML = warningMsg;
        
        const footer = document.getElementById('modal-footer');
        footer.innerHTML = `
            <button class="btn btn-secondary" id="normal-mode-btn">继续原计划</button>
            <button class="btn btn-primary" id="exam-rush-btn">进入冲刺模式</button>
        `;
        
        document.getElementById('normal-mode-btn').addEventListener('click', () => {
            this.hideModal('modal');
        });
        
        document.getElementById('exam-rush-btn').addEventListener('click', () => {
            this.state.examRushMode = true;
            this.hideModal('modal');
            this.addLog('📚 进入考试冲刺模式！本月只能复习和休息', 'important');
            this.updateActionButtons();
        });
        
        this.showModal('modal');
    }

    // 检查考试冲刺模式限制
    isExamRushMode() {
        return this.state.examRushMode === true;
    }

    // 开始新学年
    startNewYear() {
        this.state.examRushMode = false;  // 新学年关闭冲刺模式
        this.state.year++;
        this.state.volunteerHoursThisYear = 0;
        this.state.physicalTestFailedThisYear = false; // 重置本年体测状态

        if (this.state.year > 4) {
            // 游戏结束
            this.endGame();
            return;
        }

        if (this.state.year === 4) {
            // 大四，切换到创新港
            this.state.location = 'innovationPort';
            this.state.iHarbourDebuff = true; // 开启创新港debuff
            AchievementSystem.unlock('secondWestward');
            this.addLog('🏗️ 大四了！搬迁至创新港校区', 'important');
            this.addLog('🚌 创新港进城不便：娱乐花费×2，体力消耗×1.5', 'warning');
            this.showScreen('thesis-screen');
            this.updateThesisUI();
        } else {
            this.loadSemesterCourses();
            this.addLog(`📅 ${GameData.yearNames[this.state.year - 1]}秋季学期开始了`, 'important');
        }
    }

    // 进行考试
    doExam() {
        const results = [];
        const allCourses = [...this.state.currentCourses, ...this.state.retakeCourses];
        const effects = this.state.collegeEffects || {};
        
        let semesterGradePoints = 0;
        let semesterCredits = 0;

        allCourses.forEach(course => {
            const isRetake = this.state.retakeCourses.includes(course);
            
            // 计算最终分数
            const baseMastery = course.mastery;
            const randomFactor = (Math.random() - 0.5) * 20; // -10 到 +10 的随机浮动
            let finalScore = Math.max(0, Math.min(100, baseMastery + randomFactor));
            
            // 励志书院逻辑科目加成 (+20%)
            if (effects.logicGrowth > 1 && (course.type === 'logic' || course.logicBased || course.name.includes('数学') || course.name.includes('代数') || course.name.includes('分析'))) {
                finalScore = Math.min(100, finalScore * effects.logicGrowth);
            }
            
            const passed = finalScore >= this.state.failThreshold;
            const grade = GameData.scoreToGrade(finalScore);
            let gradePoint = GameData.gradeToGpa[grade];
            
            // 南洋书院GPA效率加成 (+15%)
            if (effects.gpaEfficiency > 1) {
                gradePoint = Math.min(4.3, gradePoint * effects.gpaEfficiency);
            }

            results.push({
                course: course.name,
                score: Math.round(finalScore),
                passed,
                grade: isRetake ? (passed ? '通过' : '不通过') : grade,
                gradePoint: isRetake ? (passed ? 1.0 : 0) : gradePoint,
                credits: course.credits,
                type: course.type || 'major',
                isRetake: isRetake,
                isCollegeCore: course.isCollegeCore || course.type === 'college_core'
            });

            if (passed) {
                // 通过，计入总绩点
                const actualGradePoint = isRetake ? 1.0 : gradePoint;
                this.state.totalCredits += course.credits;
                this.state.totalGradePoints += actualGradePoint * course.credits;
                semesterGradePoints += actualGradePoint * course.credits;
                semesterCredits += course.credits;
                
                // 记录考试通过
                const didAttend = course.attendCount > 0;
                AchievementSystem.recordExamPass(course.name, Math.round(finalScore), didAttend);
                
                // 书院核心课满绩检查
                if ((course.isCollegeCore || course.type === 'college_core') && finalScore >= 95) {
                    this.state.collegeCorePerfectCount = (this.state.collegeCorePerfectCount || 0) + 1;
                }
                
                // 启德书院：GPA关联金币奖励
                if (this.state.college === 'qide' && course.moneyBonusOnPass) {
                    const bonus = Math.floor(this.state.gpa * 20);
                    this.state.money += bonus;
                    this.addLog(`💰 专业课通过，获得 ${bonus} 金币奖励`, 'success');
                }
                
                // 如果是重修课程，从重修列表移除
                const retakeIndex = this.state.retakeCourses.indexOf(course);
                if (retakeIndex > -1) {
                    this.state.retakeCourses.splice(retakeIndex, 1);
                }
            } else {
                // 挂科
                this.state.failedCourses++;
                
                // 书院核心课挂科额外惩罚
                if (course.isCollegeCore || course.type === 'college_core') {
                    this.state.social = Math.max(0, this.state.social - 5);
                    this.addLog(`😰 挂掉书院核心课『${course.name}』，综测分 -5`, 'warning');
                    
                    // 记录挂科核心课
                    this.state.failedCollegeCoreCourses = this.state.failedCollegeCoreCourses || [];
                    this.state.failedCollegeCoreCourses.push(course.name);
                    
                    // 检查成就：你一定得罪过老师2
                    AchievementSystem.unlock('offendTeacher2');
                }
                
                // 如果不是重修，添加到重修列表
                if (!this.state.retakeCourses.includes(course)) {
                    this.state.retakeCourses.push({
                        ...course,
                        mastery: 0,
                        attendCount: 0,
                        studyCount: 0
                    });
                }
            }
        });

        // 更新GPA
        if (this.state.totalCredits > 0) {
            let gpa = this.state.totalGradePoints / this.state.totalCredits;
            
            // 钱学森书院GPA无上限
            if (!effects.gpaNoLimit) {
                gpa = Math.min(4.3, gpa);
            }
            
            this.state.gpa = gpa;
        }
        
        // 计算本学期GPA
        if (semesterCredits > 0) {
            this.state.semesterGPA = semesterGradePoints / semesterCredits;
            
            // 钱学森书院满绩成就
            if (this.state.college === 'qianxuesen' && this.state.semesterGPA >= 4.3) {
                AchievementSystem.unlock('qianPerfect');
            }
            
            // 检查书院核心课全满绩成就
            const collegeCoreCount = this.state.currentCourses.filter(c => c.isCollegeCore || c.type === 'college_core').length;
            if (this.state.collegeCorePerfectCount >= collegeCoreCount && collegeCoreCount > 0) {
                AchievementSystem.unlock('professionalExcellence');
                this.state.collegeCorePerfectCount = 0; // 重置
            }
            
            // 钱学森书院GPA检查 (低于3.5被清退)
            if (effects.gpaThreshold > 0 && this.state.gpa < effects.gpaThreshold) {
                this.addLog('⚠️ 钱学森书院GPA低于3.5，面临清退警告！', 'danger');
                // 给予一次机会
                if (this.state.qianWarning) {
                    this.addLog('💔 连续两学期GPA不达标，被钱学森书院清退...', 'danger');
                    this.endGame('dropout');
                    return;
                }
                this.state.qianWarning = true;
            } else {
                this.state.qianWarning = false;
            }
        }

        // 更新GPA记录
        AchievementSystem.updateGPARecord(this.state.gpa);
        
        // 检查成就
        AchievementSystem.checkAchievements(this.state);

        // 显示考试结果
        this.showExamResults(results);
    }

    // 显示考试结果
    showExamResults(results) {
        const container = document.getElementById('exam-results');
        container.innerHTML = '';

        let passCount = 0;
        let failCount = 0;
        this.lastExamResults = results; // 存储考试结果用于补考选择

        results.forEach(r => {
            if (r.passed) passCount++;
            else failCount++;

            const item = document.createElement('div');
            item.className = 'exam-item';
            item.innerHTML = `
                <div>
                    <div class="exam-course">${r.course}${r.isRetake ? ' (重修)' : ''}</div>
                    <div class="exam-score">分数: ${r.score} | 等级: ${r.grade}</div>
                </div>
                <div class="exam-result ${r.passed ? 'pass' : 'fail'}">
                    ${r.passed ? '通过' : '挂科'}
                </div>
            `;
            container.appendChild(item);
        });

        // 添加汇总
        const summary = document.createElement('div');
        summary.className = 'exam-item';
        summary.innerHTML = `
            <div>
                <div class="exam-course">本学期汇总</div>
                <div class="exam-score">当前GPA: ${this.state.gpa.toFixed(2)}</div>
            </div>
            <div>
                <span style="color: #4CAF50;">通过 ${passCount}</span> / 
                <span style="color: #F44336;">挂科 ${failCount}</span>
            </div>
        `;
        container.appendChild(summary);

        // 如果有挂科，提示可以补考
        if (failCount > 0) {
            const makeupHint = document.createElement('div');
            makeupHint.className = 'makeup-hint-box';
            makeupHint.innerHTML = `
                <p style="color: #FF9800; margin-top: 15px;">
                    💡 提示：挂科课程可以选择补考或缓考，点击确认后进入选择界面
                </p>
            `;
            container.appendChild(makeupHint);
        }

        this.showModal('exam-modal');

        // 不再这里清空课程，在确认后处理
    }
    
    // 处理考试确认
    handleExamConfirm() {
        this.hideModal('exam-modal');
        
        // 检查是否有挂科课程
        const failedResults = this.lastExamResults?.filter(r => !r.passed) || [];
        
        if (failedResults.length > 0) {
            // 显示挂科处理界面
            this.showMakeupExamChoice(failedResults);
        } else {
            // 没有挂科，清空课程继续
            this.state.currentCourses = [];
        }
    }
    
    // 显示挂科处理选择（只有专业课可以补考）
    showMakeupExamChoice(failedCourses) {
        const container = document.getElementById('makeup-courses');
        container.innerHTML = '';
        
        this.makeupSelections = {}; // 存储用户选择
        
        // 分类挂科课程
        const majorCourses = failedCourses.filter(c => c.type === 'major');
        const otherCourses = failedCourses.filter(c => c.type !== 'major');
        
        // 专业课可以选择补考或重修
        if (majorCourses.length > 0) {
            const majorHeader = document.createElement('div');
            majorHeader.className = 'makeup-section-header';
            majorHeader.innerHTML = '<h4>📚 专业课（可申请补考）</h4>';
            container.appendChild(majorHeader);
            
            majorCourses.forEach((course, index) => {
                const item = document.createElement('div');
                item.className = 'makeup-course-item';
                item.innerHTML = `
                    <div class="makeup-course-info">
                        <div class="makeup-course-name">${course.course}</div>
                        <div class="makeup-course-score">原分数: ${course.score}</div>
                    </div>
                    <div class="makeup-course-options">
                        <label class="makeup-option">
                            <input type="radio" name="makeup-major-${index}" value="makeup" checked>
                            <span class="option-text">📝 申请补考</span>
                            <span class="option-desc">开学初进行，通过按60分计，不通过则重修</span>
                        </label>
                        <label class="makeup-option">
                            <input type="radio" name="makeup-major-${index}" value="retake">
                            <span class="option-text">📚 直接重修</span>
                            <span class="option-desc">下学期重新学习，正常计分</span>
                        </label>
                    </div>
                `;
                
                // 绑定选择事件
                item.querySelectorAll('input[type="radio"]').forEach(radio => {
                    radio.addEventListener('change', () => {
                        this.makeupSelections[`major-${index}`] = {
                            course: course,
                            choice: radio.value
                        };
                    });
                });
                
                // 默认选择补考
                this.makeupSelections[`major-${index}`] = {
                    course: course,
                    choice: 'makeup'
                };
                
                container.appendChild(item);
            });
        }
        
        // 非专业课只能重修
        if (otherCourses.length > 0) {
            const otherHeader = document.createElement('div');
            otherHeader.className = 'makeup-section-header';
            otherHeader.innerHTML = '<h4>📖 通识课/体育课（需重修）</h4>';
            container.appendChild(otherHeader);
            
            otherCourses.forEach((course) => {
                const item = document.createElement('div');
                item.className = 'makeup-course-item retake-only';
                item.innerHTML = `
                    <div class="makeup-course-info">
                        <div class="makeup-course-name">${course.course}</div>
                        <div class="makeup-course-score">原分数: ${course.score}</div>
                    </div>
                    <div class="makeup-course-status">
                        <span class="status-tag">📚 下学期重修</span>
                    </div>
                `;
                container.appendChild(item);
            });
        }
        
        this.showModal('makeup-exam-modal');
    }
    
    // 确认挂科处理
    confirmMakeupExam() {
        this.hideModal('makeup-exam-modal');
        
        const makeupList = [];
        
        // 只处理专业课的选择
        Object.entries(this.makeupSelections).forEach(([key, selection]) => {
            if (key.startsWith('major-') && selection.choice === 'makeup') {
                makeupList.push(selection.course);
            }
            // retake的已经在doExam中加入retakeCourses了
        });
        
        // 存储补考课程
        if (makeupList.length > 0) {
            this.state.makeupCourses = makeupList.map(c => ({
                name: c.course,
                credits: c.credits,
                type: c.type,
                originalScore: c.score,
                mastery: Math.max(40, c.score) // 补考前保留原有掌握度
            }));
            this.addLog(`📝 ${makeupList.length}门专业课将在开学初补考`);
        }
        
        // 清空当前课程
        this.state.currentCourses = [];
    }
    
    // 进行补考（在新学期开始时调用）
    doMakeupExam() {
        if (!this.state.makeupCourses || this.state.makeupCourses.length === 0) {
            return;
        }
        
        const results = [];
        const makeupCourses = [...this.state.makeupCourses];
        
        makeupCourses.forEach(course => {
            // 补考判定：基于原分数+复习效果
            const baseMastery = course.mastery;
            const randomFactor = (Math.random() - 0.3) * 15; // 略微有利的随机
            let finalScore = Math.max(0, Math.min(100, baseMastery + randomFactor));
            
            const passed = finalScore >= this.state.failThreshold;
            
            results.push({
                course: course.name,
                score: passed ? 60 : Math.round(finalScore), // 通过显示60，不通过显示实际分数
                passed,
                credits: course.credits
            });
            
            if (passed) {
                // 补考通过，按60分(D等级)计入GPA
                const gradePoint = GameData.gradeToGpa['D'] || 1.0;
                this.state.totalCredits += course.credits;
                this.state.totalGradePoints += gradePoint * course.credits;
                
                // 从重修列表移除
                const idx = this.state.retakeCourses.findIndex(r => r.name === course.name);
                if (idx > -1) {
                    this.state.retakeCourses.splice(idx, 1);
                    this.state.failedCourses = Math.max(0, this.state.failedCourses - 1);
                }
                
                this.addLog(`✅ ${course.name}补考通过（60分）！`, 'success');
            } else {
                // 补考不通过，保持在重修列表中
                this.addLog(`❌ ${course.name}补考未通过，需要重修`, 'warning');
            }
        });
        
        // 更新GPA
        if (this.state.totalCredits > 0) {
            this.state.gpa = Math.min(4.3, this.state.totalGradePoints / this.state.totalCredits);
        }
        
        // 清空补考列表
        this.state.makeupCourses = [];
        
        // 显示补考结果
        this.showMakeupExamResults(results);
    }
    
    // 显示补考结果
    showMakeupExamResults(results) {
        const container = document.getElementById('makeup-exam-results');
        container.innerHTML = '';
        
        let passCount = 0;
        let failCount = 0;
        
        results.forEach(r => {
            if (r.passed) passCount++;
            else failCount++;
            
            const item = document.createElement('div');
            item.className = 'exam-item';
            item.innerHTML = `
                <div>
                    <div class="exam-course">${r.course} (补考)</div>
                    <div class="exam-score">分数: ${r.score}</div>
                </div>
                <div class="exam-result ${r.passed ? 'pass' : 'fail'}">
                    ${r.passed ? '通过' : '未通过'}
                </div>
            `;
            container.appendChild(item);
        });
        
        const summary = document.createElement('div');
        summary.className = 'exam-item';
        summary.innerHTML = `
            <div>
                <div class="exam-course">补考汇总</div>
                <div class="exam-score">当前GPA: ${this.state.gpa.toFixed(2)}</div>
            </div>
            <div>
                <span style="color: #4CAF50;">通过 ${passCount}</span> / 
                <span style="color: #F44336;">未通过 ${failCount}</span>
            </div>
        `;
        container.appendChild(summary);
        
        this.showModal('makeup-exam-result-modal');
    }

    // 检查游戏结束
    checkGameOver() {
        // 精神崩溃
        if (this.state.san <= 0) {
            this.addLog('💔 SAN值归零，精神崩溃...', 'danger');
            this.endGame('dropout');
            return true;
        }

        // 挂科太多
        if (this.state.failedCourses > 5) {
            this.addLog('📚 挂科太多，无法毕业...', 'danger');
            this.endGame('dropout');
            return true;
        }

        // 进入大四毕设模式
        if (this.state.year === 4 && this.state.month >= 9) {
            this.saveGame();
            window.location.href = 'thesis.html';
            return true;
        }

        return false;
    }

    // 结束游戏
    endGame(forcedEnding = null) {
        let endingType = forcedEnding;

        if (!endingType) {
            // 根据状态判定结局
            if (this.state.gpa >= 4.0 && this.state.social >= 95 && this.state.nationalScholarship) {
                endingType = 'excellent';
            } else if (this.state.westwardPath) {
                endingType = 'westward';
            } else if (this.state.gpa >= 3.5 && this.state.social >= 80) {
                endingType = 'postgraduate';
            } else if (this.state.gpa >= 2.0) {
                endingType = 'normal';
            } else {
                endingType = 'dropout';
            }
        }

        // 毕业成就
        if (endingType !== 'dropout') {
            AchievementSystem.unlock('graduation');
        }

        // 保存状态后跳转到结局页面
        this.saveGame();
        window.location.href = 'ending.html?type=' + endingType;
    }

    // 毕设相关方法
    updateThesisUI() {
        document.getElementById('thesis-year').textContent = '大四';
        document.getElementById('thesis-month').textContent = `${this.state.month}月`;
        document.getElementById('thesis-progress-bar').style.width = `${this.state.thesisProgress}%`;
        document.getElementById('thesis-progress-value').textContent = `${this.state.thesisProgress}%`;
        document.getElementById('thesis-san').textContent = `${Math.round(this.state.san)}/100`;
        document.getElementById('thesis-money').textContent = `💰 ${Math.round(this.state.money)}`;
    }

    doThesisWork() {
        this.state.thesisProgress = Math.min(100, this.state.thesisProgress + 10);
        this.state.san -= 5;
        this.addLog('💻 努力做毕设，进度推进中...');
        this.updateThesisUI();
        this.checkThesisEnd();
    }

    doThesisMeeting() {
        this.state.thesisProgress = Math.min(100, this.state.thesisProgress + 5);
        this.state.san -= 3;
        this.addLog('👨‍🏫 和导师开会讨论，获得了一些指导');
        this.updateThesisUI();
        this.checkThesisEnd();
    }

    doThesisRest() {
        this.state.money -= 50;
        this.state.san = Math.min(100, this.state.san + 10);
        this.addLog('☕ 在创新港休息放松');
        this.updateThesisUI();
    }

    doThesisCity() {
        this.state.money -= 80; // 二次西迁debuff
        this.state.san = Math.min(100, this.state.san + 15);
        this.addLog('🚌 坐校车进城，虽然远但很开心');
        this.updateThesisUI();
    }

    checkThesisEnd() {
        if (this.state.thesisProgress >= 100) {
            this.addLog('🎉 毕设完成！准备答辩！', 'success');
            this.endGame();
        }
        
        if (this.state.san <= 0) {
            this.endGame('dropout');
        }
    }

    // 添加日志
    addLog(message, type = '') {
        const logContent = document.getElementById('log-content');
        const entry = document.createElement('p');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;
        logContent.insertBefore(entry, logContent.firstChild);

        // 限制日志数量
        while (logContent.children.length > 50) {
            logContent.removeChild(logContent.lastChild);
        }
    }

    // 显示消息弹窗
    showMessage(title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = `<p>${content}</p>`;
        this.showModal('modal');
    }

    // 显示游戏菜单
    showGameMenu() {
        const menu = document.getElementById('game-menu');
        if (!menu) return;

        const content = menu.querySelector('.menu-content');
        if (content) {
            // 确保有标题并可见
            let h3 = content.querySelector('h3');
            if (!h3) {
                h3 = document.createElement('h3');
                content.insertBefore(h3, content.firstChild);
            }
            if (!h3.textContent || !h3.textContent.trim()) h3.textContent = '游戏菜单';
            try {
                h3.style.color = getComputedStyle(document.documentElement).getPropertyValue('--xjtu-blue') || '#003E7E';
            } catch (e) {}

            // 如果按钮丢失或未绑定，则填充默认按钮并绑定事件
            const needsRebuild = !content.querySelector('#btn-save') || !content.querySelector('#btn-close-menu');
            if (needsRebuild) {
                content.innerHTML = `
                    <h3>游戏菜单</h3>
                    <div class="menu-buttons">
                        <button id="btn-save" class="btn btn-secondary">💾 保存游戏</button>
                        <button id="btn-view-achievements" class="btn btn-secondary">🏆 查看成就</button>
                        <button id="btn-view-courses" class="btn btn-secondary">📚 课程详情</button>
                        <button id="btn-quit" class="btn btn-danger">🚪 退出游戏</button>
                    </div>
                    <button id="btn-close-menu" class="btn btn-primary">继续游戏</button>
                `;

                // 重新绑定菜单内的按钮
                const btnSave = document.getElementById('btn-save');
                if (btnSave) btnSave.addEventListener('click', () => this.saveGame());
                const btnViewAchievements = document.getElementById('btn-view-achievements');
                if (btnViewAchievements) btnViewAchievements.addEventListener('click', () => { window.location.href = 'achievements.html?from=game'; });
                const btnViewCourses = document.getElementById('btn-view-courses');
                if (btnViewCourses) btnViewCourses.addEventListener('click', () => this.showCoursesModal());
                const btnQuit = document.getElementById('btn-quit');
                if (btnQuit) btnQuit.addEventListener('click', () => { window.location.href = 'index.html'; });
                const btnCloseMenu = document.getElementById('btn-close-menu');
                if (btnCloseMenu) btnCloseMenu.addEventListener('click', () => this.hideModal('game-menu'));
            }
        }

        // 隐藏其他可能打开的弹窗，避免被覆盖或样式冲突
        document.querySelectorAll('.modal.active').forEach(m => {
            if (m.id !== 'game-menu') m.classList.remove('active');
        });

        this.showModal('game-menu');
    }

    // 显示课程详情
    // 显示个人经历/档案 Modal
    showProfileModal() {
        console.log('Opening Profile Modal...');
        try {
            this.hideModal('game-menu');
            
            if (!this.state) {
                console.error('State is null');
                return;
            }

            const collegeName = GameData.colleges[this.state.college] ? GameData.colleges[this.state.college].name : '未知书院';
            const gpa = (this.state.gpa || 0).toFixed(2);
            const san = Math.round(this.state.san || 0);
            const energy = Math.round(this.state.energy || 0);
            const money = this.state.money || 0;
            
            // 生成个人总结文案
            let summaryText = `你现在是 <strong>${collegeName}</strong> 的大${['一','二','三','四'][this.state.year-1] || 'N'}学生。`;
            
            if (gpa >= 3.8) summaryText += ` 你的学业表现<strong>非常优异</strong> (GPA ${gpa})，是大家眼中的学霸。`;
            else if (gpa >= 3.0) summaryText += ` 你的成绩<strong>中规中矩</strong> (GPA ${gpa})，保持着稳定的节奏。`;
            else summaryText += ` 你的学业<strong>稍显吃力</strong> (GPA ${gpa})，需要加油了。`;
            
            if (this.state.inRelationship) summaryText += ` 生活上，你正在享受一段<strong>甜蜜的恋爱</strong>。`;
            else summaryText += ` 生活上，你目前<strong>单身</strong>，专注于提升自我。`;
            
            if (san < 40) summaryText += ` 最近你的<strong>精神状态不太好</strong>，注意休息。`;
            else if (energy < 3) summaryText += ` 你的<strong>体力透支</strong>严重，不要太拼了。`;
            else summaryText += ` 你的状态看起来<strong>很不错</strong>。`;


        // 构建弹窗内容
        let content = `
            <div class="profile-container" style="padding: 10px;">
                <div class="profile-header" style="text-align:center; margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px;">
                    <div style="font-size:3rem; margin-bottom:10px;">🎓</div>
                    <h3 style="color:#003E7E; margin:0;">我的大学档案</h3>
                    <p style="color:#666; font-size:0.9rem;">${this.state.year}年级 ${this.state.month}月</p>
                </div>

                <div class="profile-summary" style="background:#f0f7ff; padding:15px; border-radius:8px; margin-bottom:20px; line-height:1.6;">
                    ${summaryText}
                </div>

                <ul class="nav nav-tabs" style="display:flex; border-bottom:1px solid #ddd; margin-bottom:15px; padding:0; list-style:none;">
                    <li style="margin-right:5px;"><a href="#" onclick="document.querySelectorAll('.tab-pane').forEach(el=>el.style.display='none'); document.getElementById('tab-courses').style.display='block'; return false;" style="padding:8px 15px; display:block; text-decoration:none; color:#003E7E; border:1px solid #ddd; border-bottom:none; border-radius:4px 4px 0 0; background:#fff;">课程学业</a></li>
                    <li><a href="#" onclick="document.querySelectorAll('.tab-pane').forEach(el=>el.style.display='none'); document.getElementById('tab-stats').style.display='block'; return false;" style="padding:8px 15px; display:block; text-decoration:none; color:#003E7E; border:1px solid #ddd; border-bottom:none; border-radius:4px 4px 0 0; background:#f9f9f9;">详细属性</a></li>
                </ul>

                <div id="tab-courses" class="tab-pane">
                    <div class="course-detail-list">
        `;
        
        // 插入原有课程列表逻辑
        if (this.state.currentCourses.length > 0) {
            content += '<h4>📚 当前学期课程</h4>';
            this.state.currentCourses.forEach(c => {
                const difficultyText = c.difficulty >= 0.8 ? '困难' : c.difficulty >= 0.6 ? '中等' : '简单';
                const difficultyColor = c.difficulty >= 0.8 ? '#F44336' : c.difficulty >= 0.6 ? '#FF9800' : '#4CAF50';
                const typeText = c.type === 'major' ? '专业课' : c.type === 'pe' ? '体育课' : c.type === 'general' ? '通识课' : '选修课';
                const masteryColor = c.mastery >= 80 ? '#4CAF50' : c.mastery >= 50 ? '#FF9800' : '#F44336';
                
                content += `
                    <div class="course-detail-item">
                        <div class="course-header">
                            <strong>${c.name}</strong>
                            <span class="course-tags">
                                <span class="tag" style="background: ${difficultyColor}20; color: ${difficultyColor}">${difficultyText}</span>
                                <span class="tag" style="background: var(--xjtu-blue); color: white;">${typeText}</span>
                            </span>
                        </div>
                        <div class="course-info">
                            <span>📖 ${c.credits}学分</span>
                            <span>📝 上课${c.attendCount}次</span>
                            <span>✏️ 自习${c.studyCount}次</span>
                        </div>
                        <div class="mastery-bar">
                            <div class="mastery-label">掌握度: <span style="color: ${masteryColor}">${Math.round(c.mastery)}%</span></div>
                            <div class="mastery-progress">
                                <div class="mastery-fill" style="width: ${c.mastery}%; background: ${masteryColor}"></div>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            content += '<p style="text-align:center; color:#999; padding:20px;">当前没有进行中的课程</p>';
        }

        if (this.state.retakeCourses && this.state.retakeCourses.length > 0) {
            content += '<h4 style="color: #F44336; margin-top: 15px;">🔄 重修课程</h4>';
            this.state.retakeCourses.forEach(c => {
                // ...existing code for retake...
                const masteryColor = c.mastery >= 60 ? '#4CAF50' : '#F44336';
                content += `
                    <div class="course-detail-item retake">
                        <div class="course-header">
                            <strong>${c.name}</strong>
                            <span class="tag" style="background: #F4433620; color: #F44336">重修</span>
                        </div>
                        <div class="mastery-bar">
                            <div class="mastery-label">掌握度: <span style="color: ${masteryColor}">${Math.round(c.mastery)}%</span></div>
                            <div class="mastery-progress">
                                <div class="mastery-fill" style="width: ${c.mastery}%; background: ${masteryColor}"></div>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        content += `
                    </div>
                </div>

                <div id="tab-stats" class="tab-pane" style="display:none;">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div class="stat-box" style="background:#fff; border:1px solid #eee; padding:10px; border-radius:8px; text-align:center;">
                            <div style="font-size:2rem;">💰</div>
                            <div style="font-weight:bold; color:#f0ad4e;">${money}</div>
                            <div style="font-size:0.8rem; color:#666;">金币</div>
                        </div>
                        <div class="stat-box" style="background:#fff; border:1px solid #eee; padding:10px; border-radius:8px; text-align:center;">
                            <div style="font-size:2rem;">🧠</div>
                            <div style="font-weight:bold; color:#5cb85c;">${san}/100</div>
                            <div style="font-size:0.8rem; color:#666;">SAN值</div>
                        </div>
                        <div class="stat-box" style="background:#fff; border:1px solid #eee; padding:10px; border-radius:8px; text-align:center;">
                            <div style="font-size:2rem;">⚡</div>
                            <div style="font-weight:bold; color:#0275d8;">${energy}/${this.state.maxEnergy}</div>
                            <div style="font-size:0.8rem; color:#666;">体力</div>
                        </div>
                        <div class="stat-box" style="background:#fff; border:1px solid #eee; padding:10px; border-radius:8px; text-align:center;">
                            <div style="font-size:2rem;">🤝</div>
                            <div style="font-weight:bold; color:#d9534f;">${Math.round(this.state.social || 0)}</div>
                            <div style="font-size:0.8rem; color:#666;">社交能力</div>
                        </div>
                    </div>
                    <div style="margin-top:20px;">
                        <h4>📊 综合统计</h4>
                        <ul style="font-size:0.9rem; color:#555; line-height:1.8;">
                            <li>已修总学分: ${this.state.totalCredits || 0}</li>
                            <li>挂科数量: ${this.state.failedCourses || 0}</li>
                            <li>获得成就: ${AchievementSystem && AchievementSystem.achievements ? Object.values(AchievementSystem.achievements).filter(a => a.unlocked).length : 0} 个</li>
                            <li>科研经历: ${this.state.researchExp || 0} 点</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // 使用通用Modal显示
        const resultModal = document.getElementById('exam-modal'); // 复用一个大点的 modal
        if (resultModal) {
            resultModal.querySelector('.modal-title').innerText = '👤 个人经历';
            resultModal.querySelector('.modal-body').innerHTML = content;
            resultModal.querySelector('.modal-footer').innerHTML = '<button class="btn btn-primary" onclick="document.getElementById(\'exam-modal\').classList.remove(\'active\')">关闭</button>';
            this.showModal('exam-modal');
        } else {
            console.error('Modal template not found');
        }
        } catch (error) {
            console.error('Error showing profile modal:', error);
            this.showMessage('错误', '无法打开个人经历页面，请重试或刷新游戏。');
        }
    }
    
    // ========== 新增高阶系统函数 ==========
    
    // 操场跑步
    doRun() {
        if (this.state.energy < 1) {
            this.showMessage('体力不足', '你太累了，需要休息一下。');
            return;
        }
        
        this.state.energy -= 1;
        this.state.runCountThisMonth = (this.state.runCountThisMonth || 0) + 1;
        this.state.totalRunCount = (this.state.totalRunCount || 0) + 1;
        this.state.staminaProgress = this.state.staminaProgress || 0; // 累积小数进度，避免上限出现小数
        
        // 随机事件
        const random = Math.random();
        if (random < 0.1) {
            // 没带卡白跑
            this.addLog('😅 跑步打卡发现没带校园卡...白跑了', 'warning');
            this.state.runCountThisMonth = Math.max(0, this.state.runCountThisMonth - 1);
        } else if (random < 0.15) {
            // 表白墙求婚堵路
            this.addLog('💕 操场上有人求婚堵路，围观了一会儿', 'info');
            this.state.san += 2;
            this.addBBSEvent('求婚现场');
        } else if (random < 0.2) {
            // 偶遇明星跑者
            this.addLog('⭐ 偶遇学校运动明星，一起跑步！', 'success');
            this.state.staminaProgress += 0.3;
        } else {
            // 正常跑步
            this.addLog('🏃 跑步打卡完成！身体变得更强健了');
            
            // 累计跑步提高体力上限
            if (this.state.runCountThisMonth >= 3) {
                const oldMax = this.state.maxEnergy;
                this.state.staminaProgress += 0.2;
                if (this.state.staminaProgress >= 1) {
                    const gain = Math.floor(this.state.staminaProgress);
                    this.state.staminaProgress -= gain;
                    this.state.maxEnergy = Math.min(15, this.state.maxEnergy + gain);
                }
                if (this.state.maxEnergy > oldMax) {
                    this.addLog('💪 坚持锻炼，体力上限提升！', 'success');
                }
            }
        }

        // 任何来源的进度都只提升整数上限，清理小数
        if (this.state.staminaProgress >= 1) {
            const gain = Math.floor(this.state.staminaProgress);
            this.state.staminaProgress -= gain;
            this.state.maxEnergy = Math.min(15, this.state.maxEnergy + gain);
        }
        this.state.maxEnergy = Math.min(15, Math.round(this.state.maxEnergy));
        
        // 检查跑步成就
        if (this.state.totalRunCount >= 100) {
            AchievementSystem.unlock('marathonRunner');
        }

        // 运行完毕立即规范数值，确保体力上限为整数
        this.normalizeStateIntegers();
        this.updateUI();
    }
    
    // 体测检查（5月/10月触发）
    checkPhysicalTest() {
        const staminaOK = this.state.maxEnergy >= 12;
        const runOK = this.state.runCountThisMonth >= 3;
        
        // 更新体测状态显示
        const staminaValue = document.getElementById('test-stamina-value');
        const staminaResult = document.getElementById('test-stamina-result');
        const runValue = document.getElementById('test-run-value');
        const runResult = document.getElementById('test-run-result');
        const warning = document.getElementById('test-warning');
        
        if (staminaValue) staminaValue.textContent = `${Math.round(this.state.maxEnergy)}/12`;
        if (staminaResult) staminaResult.textContent = staminaOK ? '✅' : '❌';
        if (runValue) runValue.textContent = `${this.state.runCountThisMonth || 0}/3`;
        if (runResult) runResult.textContent = runOK ? '✅' : '❌';
        
        const passed = staminaOK && runOK;
        this.state.physicalTestPassed = passed;
        
        if (passed) {
            document.getElementById('physical-test-desc').textContent = '恭喜！你的体测达标了！';
            if (warning) warning.style.display = 'none';
            this.addLog('🏃 体测通过！继续保持！', 'success');
        } else {
            document.getElementById('physical-test-desc').textContent = '糟糕！你的体测可能不达标...';
            if (warning) warning.style.display = 'block';
            this.state.physicalTestFailedThisYear = true;
            
            // 惩罚：综测-5，SAN-10
            this.state.social = Math.max(0, this.state.social - 5);
            this.state.san = Math.max(0, this.state.san - 10);
            this.addLog('😫 体测不达标！综测分-5，SAN-10', 'danger');
            
            AchievementSystem.unlock('physicalTestFail');
        }
        
        // 重置本月跑步次数
        this.state.runCountThisMonth = 0;
        
        this.showModal('physical-test-modal');
    }
    
    // 显示选课博弈界面
    showCourseBidding() {
        if (this.state.year > 3) return; // 大四不需要选课
        
        // 重置滑块值
        document.getElementById('weight-easy').value = 34;
        document.getElementById('weight-hard').value = 33;
        document.getElementById('weight-interest').value = 33;
        this.updateBiddingTotal();
        
        this.showModal('course-bidding-modal');
    }
    
    // 更新选课权重总和显示
    updateBiddingTotal() {
        const easy = parseInt(document.getElementById('weight-easy').value) || 0;
        const hard = parseInt(document.getElementById('weight-hard').value) || 0;
        const interest = parseInt(document.getElementById('weight-interest').value) || 0;
        const total = easy + hard + interest;
        
        // 更新显示的值
        const sliders = document.querySelectorAll('.weight-slider');
        sliders.forEach(slider => {
            const valueSpan = slider.nextElementSibling;
            if (valueSpan) valueSpan.textContent = slider.value;
        });
        
        // 更新总权重
        const totalEl = document.getElementById('total-weight');
        if (totalEl) {
            totalEl.textContent = total;
            totalEl.style.color = total === 100 ? 'green' : 'red';
        }
    }
    
    // 处理选课确认
    processCourseBidding() {
        const easy = parseInt(document.getElementById('weight-easy').value) || 0;
        const hard = parseInt(document.getElementById('weight-hard').value) || 0;
        const interest = parseInt(document.getElementById('weight-interest').value) || 0;
        const total = easy + hard + interest;
        
        if (total !== 100) {
            this.showMessage('权重分配错误', '总权重必须为100！');
            return;
        }
        
        this.state.courseWeights = { easy, hard, interest };
        this.state.courseBiddingDone = true;
        
        // 根据权重应用效果
        if (hard >= 50) {
            this.state.hardCourseDebuff = true;
            this.addLog('⚠️ 选了很多硬课，学习体力消耗+20%', 'warning');
        }
        
        if (easy >= 50) {
            this.addLog('🌊 选了很多水课，GPA提升会更容易', 'info');
        }
        
        if (interest >= 50) {
            this.addLog('🎨 选了很多兴趣课，心情会更好', 'info');
            this.state.san += 5;
        }
        
        this.hideModal('course-bidding-modal');
        this.addLog(`📋 选课完成！水课${easy}%/硬课${hard}%/兴趣课${interest}%`, 'important');
        this.updateUI();
    }
    
    // 显示长远规划选择
    showCareerChoice() {
        if (this.state.careerPath) {
            this.showMessage('已选择方向', `你已经选择了${this.getCareerName(this.state.careerPath)}路线。`);
            return;
        }
        this.showModal('career-choice-modal');
    }
    
    // 获取规划方向名称
    getCareerName(path) {
        const names = {
            postgrad: '保研深造',
            abroad: '出国留学',
            job: '就业工作'
        };
        return names[path] || '未知';
    }
    
    // 选择长远规划
    selectCareerPath(path) {
        this.state.careerPath = path;
        this.hideModal('career-choice-modal');
        
        // 初始化对应路径的进度
        switch (path) {
            case 'postgrad':
                this.addLog('🎓 选择保研深造路线！开始联系导师吧！', 'important');
                this.state.careerProgress.postgrad = { advisor: false, dachuang: 0, competition: 0 };
                break;
            case 'abroad':
                this.addLog('✈️ 选择出国留学路线！准备好钱包和英语！', 'important');
                this.state.careerProgress.abroad = { toefl: 0, gre: 0, application: 0 };
                // 出国路线金币消耗翻倍
                this.addLog('⚠️ 注意：出国准备费用较高，各项花费翻倍', 'warning');
                break;
            case 'job':
                this.addLog('💼 选择就业工作路线！开始积累实习经验！', 'important');
                this.state.careerProgress.job = { internship: 0, interview: 0, offer: false };
                break;
        }
        
        // 显示长远规划面板和按钮
        const careerPanel = document.getElementById('career-panel');
        const careerBtn = document.getElementById('btn-career');
        if (careerPanel) careerPanel.style.display = 'block';
        if (careerBtn) careerBtn.style.display = 'flex';
        
        this.updateCareerPanel();
        this.updateUI();
    }
    
    // 更新长远规划面板
    updateCareerPanel() {
        const infoEl = document.getElementById('career-info');
        const progressEl = document.getElementById('career-progress');
        
        if (!this.state.careerPath || !infoEl || !progressEl) return;
        
        infoEl.innerHTML = `<span class="career-path">📍 ${this.getCareerName(this.state.careerPath)}</span>`;
        
        let progressHTML = '';
        const progress = this.state.careerProgress[this.state.careerPath];
        
        switch (this.state.careerPath) {
            case 'postgrad':
                progressHTML = `
                    <div class="career-progress-item">导师联系: ${progress.advisor ? '✅' : '❌'}</div>
                    <div class="career-progress-item">大创项目: ${progress.dachuang}/1</div>
                    <div class="career-progress-item">竞赛加分: ${progress.competition}</div>
                `;
                break;
            case 'abroad':
                progressHTML = `
                    <div class="career-progress-item">托福: ${progress.toefl}/100</div>
                    <div class="career-progress-item">GRE: ${progress.gre}/100</div>
                    <div class="career-progress-item">申请进度: ${progress.application}%</div>
                `;
                break;
            case 'job':
                progressHTML = `
                    <div class="career-progress-item">实习经历: ${progress.internship}/3</div>
                    <div class="career-progress-item">面试技巧: ${progress.interview}%</div>
                    <div class="career-progress-item">Offer: ${progress.offer ? '✅' : '❌'}</div>
                `;
                break;
        }
        
        progressEl.innerHTML = progressHTML;
    }
    
    // 更新BBS滚动条
    updateBBSScroll() {
        const scrollEl = document.getElementById('bbs-scroll');
        if (!scrollEl) return;
        
        // 生成BBS内容
        const bbsMessages = this.generateBBSMessages();
        scrollEl.innerHTML = `<span class="bbs-item">${bbsMessages.join(' | ')}</span>`;
    }
    
    // 生成BBS消息
    generateBBSMessages() {
        const messages = [];
        
        // 根据游戏状态生成消息
        if (this.state.gpa >= 4.0) {
            messages.push('📚 学霸出没！某同学GPA突破4.0');
        }
        if (this.state.inRelationship) {
            messages.push('💕 表白墙新增脱单喜报！');
        }
        if (this.state.competitionWins > 0) {
            messages.push(`🏆 恭喜同学在竞赛中获奖！`);
        }
        if (this.state.reputation >= 80) {
            messages.push('⭐ 校园名人榜更新！');
        }
        if (this.state.reputation <= 20) {
            messages.push('👀 吃瓜群众正在围观...');
        }
        
        // 添加随机消息
        const randomMessages = [
            '🍜 康桥苑推出新菜品！',
            '📅 图书馆座位又被占了...',
            '🎭 新社团招新中！',
            '🌸 樱花大道好美啊！',
            '😴 DDL 战士集合！',
            '📖 期末考试复习资料分享',
            '🏃 操场夜跑约吗？',
            '☕ 梧桐三楼咖啡打折！'
        ];
        
        while (messages.length < 3) {
            const randomMsg = randomMessages[Math.floor(Math.random() * randomMessages.length)];
            if (!messages.includes(randomMsg)) {
                messages.push(randomMsg);
            }
        }
        
        return messages.slice(0, 5);
    }
    
    // 添加BBS事件（影响声望）
    addBBSEvent(eventType, isPositive = true) {
        this.state.bbsEvents = this.state.bbsEvents || [];
        this.state.bbsEvents.push({ type: eventType, positive: isPositive, month: this.state.month });
        
        // 声望变化
        const change = isPositive ? 5 : -10;
        this.state.reputation = Math.max(0, Math.min(100, (this.state.reputation || 50) + change));
        
        if (!isPositive) {
            this.state.scandalCount = (this.state.scandalCount || 0) + 1;
            if (this.state.scandalCount >= 3) {
                AchievementSystem.unlock('infamous');
            }
        }
        
        if (this.state.reputation >= 90) {
            AchievementSystem.unlock('campusStar');
        }
    }
    
    // 情人节检查（2月）
    checkValentineDay() {
        if (this.state.month === 2) {
            if (!this.state.inRelationship) {
                this.state.san = Math.max(0, this.state.san - 10);
                this.addLog('💔 情人节单身狗受到暴击，SAN -10', 'warning');
                this.addBBSEvent('单身狗哀嚎', false);
            } else {
                this.state.san = Math.min(100, this.state.san + 10);
                this.addLog('💕 情人节和对象甜蜜度过，SAN +10', 'success');
            }
        }
    }

    // 保存游戏
    saveGame(silent = false) {
        localStorage.setItem('xjtu_game_state', JSON.stringify(this.state));
        if (!silent) {
            this.hideModal('game-menu');
            this.showMessage('保存成功', '游戏进度已保存！');
        }
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new XJTUSimulator();
});