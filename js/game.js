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
        // 检查是否有存档或新角色数据
        const savedState = localStorage.getItem('xjtu_game_state');
        const characterData = localStorage.getItem('xjtu_character');

        if (savedState) {
            // 继续游戏
            this.state = JSON.parse(savedState);
            this.selectedBackground = this.state.background;
            this.selectedCollege = this.state.college;
        } else if (characterData) {
            // 新游戏
            const character = JSON.parse(characterData);
            this.selectedBackground = character.background;
            this.selectedCollege = character.college;
            this.initGameState();
            localStorage.removeItem('xjtu_character');
        } else {
            // 没有数据，返回首页
            window.location.href = 'index.html';
            return;
        }

        this.bindEvents();
        this.loadSemesterCourses();
        this.updateUI();
    }

    // 绑定事件
    bindEvents() {
        // 游戏界面按钮
        document.getElementById('btn-menu').addEventListener('click', () => this.showGameMenu());
        document.getElementById('btn-next-turn').addEventListener('click', () => this.nextTurn());

        // 行动按钮
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => this.performAction(btn.dataset.action));
        });

        // 菜单按钮
        document.getElementById('btn-save').addEventListener('click', () => this.saveGame());
        document.getElementById('btn-view-achievements').addEventListener('click', () => {
            window.location.href = 'achievements.html?from=game';
        });
        document.getElementById('btn-view-courses').addEventListener('click', () => this.showCoursesModal());
        document.getElementById('btn-quit').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        document.getElementById('btn-close-menu').addEventListener('click', () => this.hideModal('game-menu'));

        // Modal关闭按钮
        document.getElementById('modal-close').addEventListener('click', () => this.hideModal('modal'));
        document.getElementById('modal-confirm').addEventListener('click', () => this.hideModal('modal'));
        document.getElementById('choice-close').addEventListener('click', () => this.hideModal('choice-modal'));
        document.getElementById('exam-confirm').addEventListener('click', () => this.hideModal('exam-modal'));
        
        // 事件结果确认按钮
        document.getElementById('result-confirm').addEventListener('click', () => {
            this.hideModal('event-result-modal');
            this.updateUI();
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
            totalCredits: 0,
            totalGradePoints: 0,

            // 状态标记
            inRelationship: false,
            nationalScholarship: false,
            westwardPath: false,
            volunteerHoursThisYear: 0,
            volunteerHoursThisSemester: 0,
            attendedClassThisTurn: false,
            studyLocation: null,
            location: college.campus || 'xingqing',

            // 毕设相关（大四用）
            thesisProgress: 0,

            // 行动记录
            actionsThisTurn: [],
            
            // 书院成就统计
            quickHealCount: 0,
            semesterGPA: 0
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

    // 加载当前学期课程
    loadSemesterCourses() {
        const yearKey = `year${this.state.year}`;
        const semester = this.getCurrentSemester();
        const effects = this.state.collegeEffects || {};

        if (this.state.year <= 3 && GameData.courses[yearKey] && GameData.courses[yearKey][semester]) {
            // 钱学森书院初始掌握度+15
            const initialMastery = effects.initialMastery || 0;
            
            this.state.currentCourses = GameData.courses[yearKey][semester].map(course => ({
                ...course,
                mastery: initialMastery,
                attendCount: 0,
                studyCount: 0
            }));
            
            // 钱学森书院额外课程 (+2门)
            if (effects.extraCourses > 0 && this.state.college === 'qianxuesen') {
                // 添加额外的高难度课程
                const extraCourses = [
                    { id: 'qian_advanced_math', name: '高等数学提高', credits: 4, difficulty: 'A', type: 'required' },
                    { id: 'qian_physics', name: '大学物理强化', credits: 3, difficulty: 'A', type: 'required' }
                ];
                extraCourses.forEach(course => {
                    this.state.currentCourses.push({
                        ...course,
                        mastery: initialMastery,
                        attendCount: 0,
                        studyCount: 0
                    });
                });
            }
        } else {
            this.state.currentCourses = [];
        }
    }

    // 获取当前学期
    getCurrentSemester() {
        const month = this.state.month;
        if (month >= 9 || month <= 1) return 'fall';
        if (month >= 2 && month <= 6) return 'spring';
        return 'summer';
    }

    // 更新UI
    updateUI() {
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

        // 更新课程列表
        this.updateCourseList();

        // 更新行动按钮状态
        this.updateActionButtons();

        // 检查约会按钮
        const dateBtn = document.getElementById('btn-date');
        if (this.state.inRelationship || this.state.charm >= 60) {
            dateBtn.style.display = 'flex';
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

        document.querySelectorAll('.action-btn').forEach(btn => {
            const action = btn.dataset.action;
            let disabled = false;

            switch (action) {
                case 'attend-class':
                    disabled = energy < this.getAttendClassEnergy();
                    break;
                case 'self-study':
                    disabled = energy < 3;
                    break;
                case 'club':
                case 'volunteer':
                    disabled = energy < 2;
                    break;
                case 'eat':
                    disabled = money < 30;
                    break;
                case 'entertainment':
                    disabled = money < 50;
                    break;
                case 'date':
                    disabled = money < 100 || (!this.state.inRelationship && this.state.charm < 60);
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
            case 'rest':
                this.doRest();
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

        // 记录上课
        AchievementSystem.recordAttendClass();
        AchievementSystem.resetLateWakeup(); // 上课说明早起了

        // 文治书院迟到判定
        if (this.state.college === 'wenzhi' && Math.random() < 0.05) {
            this.addLog('🏃 从西区赶到东区上课，迟到了！本次学习效果减半', 'warning');
            this.state.energy -= energyCost;
            this.state.currentCourses.forEach(course => {
                course.mastery += 2.5 * this.state.studyEfficiency;
                course.attendCount++;
            });
        } else {
            this.state.energy -= energyCost;
            this.state.currentCourses.forEach(course => {
                course.mastery += 5 * this.state.studyEfficiency;
                course.attendCount++;
            });
            this.addLog('📚 认真上了一天课，知识有所增长');
        }

        this.state.attendedClassThisTurn = true;
        this.state.actionsThisTurn.push('attend-class');

        // 检查行动后事件
        this.checkActionEvents('attend-class');
        
        // 检查成就
        AchievementSystem.checkAchievements(this.state);
        this.updateUI();
    }

    // 显示自习地点选择
    showStudyLocationChoice() {
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
                this.doSelfStudy(loc);
            });
            options.appendChild(btn);
        });

        document.getElementById('choice-title').textContent = '选择自习地点';
        this.showModal('choice-modal');
    }

    // 自习
    doSelfStudy(location) {
        if (this.state.energy < 3) {
            this.showMessage('体力不足', '你太累了，需要休息一下。');
            return;
        }

        this.state.energy -= 3;
        this.state.san -= location.sanLoss;
        this.state.studyLocation = location.id;

        let masteryGain = 8 * location.masteryBonus * this.state.studyEfficiency;

        // 书院特殊加成
        if (location.id === 'pinge' && this.state.college === 'zhongying') {
            AchievementSystem.recordPingeStudy();
            if (AchievementSystem.stats.pingeStudyCount >= 20) {
                AchievementSystem.unlock('pingeExpert');
            }
        }

        if (location.id === 'dong13' && this.state.college === 'nanyang') {
            AchievementSystem.recordDong13Study();
            // 东13保研加成
            if (Math.random() < 0.1) {
                this.addLog('✨ 在东13自习时，你仿佛感受到了保研的气息...', 'success');
                AchievementSystem.unlock('dong13Legend');
            }
        }

        // 主楼迷路判定
        if (location.id === 'mainBuilding' && Math.random() < (location.lostChance || 0)) {
            masteryGain *= 0.5;
            this.state.san -= 3;
            this.addLog('🌫️ 在主楼迷路了！浪费了不少时间...', 'warning');
            AchievementSystem.recordMainBuildingLost();
        }

        this.state.currentCourses.forEach(course => {
            course.mastery = Math.min(100, course.mastery + masteryGain);
            course.studyCount++;
        });

        this.addLog(`📖 在${location.name}自习，知识大幅增长`);
        this.state.actionsThisTurn.push('self-study');
        this.checkActionEvents('self-study');
        
        // 检查成就
        AchievementSystem.checkAchievements(this.state);
        this.updateUI();
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
        this.state.money -= entertainment.cost;
        
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
    showDateChoice() {
        if (!this.state.inRelationship && this.state.charm < 60) {
            this.showMessage('社交能力不足', '你需要先提高魅力值才能约会。');
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

    // 约会
    doDate(location) {
        this.state.money -= location.cost;
        this.state.san = Math.min(100, this.state.san + location.sanGain);
        const effects = this.state.collegeEffects || {};

        if (!this.state.inRelationship) {
            // 尝试脱单
            let successChance = Math.min(0.5, this.state.charm / 200);
            
            // 崇实书院脱单几率加成 (+20%)
            if (effects.loveChanceBonus) {
                successChance += effects.loveChanceBonus;
            }
            
            if (Math.random() < successChance) {
                this.state.inRelationship = true;
                AchievementSystem.stats.inRelationship = true;
                AchievementSystem.unlock('cupid');
                
                // 崇实书院专属成就
                if (this.state.college === 'chongshi') {
                    AchievementSystem.unlock('chongshiLove');
                }
                
                this.addLog('💕 表白成功！你脱单了！', 'success');
            } else {
                this.addLog(`${location.icon} 约会进行中，关系在慢慢升温...`);
                this.state.charm = Math.min(100, this.state.charm + 5);
            }
        } else {
            this.addLog(`${location.icon} 和对象去${location.name}约会，很开心`);
        }

        this.updateUI();
    }

    // 休息
    doRest() {
        this.state.san = Math.min(100, this.state.san + 5);
        this.addLog('😴 好好休息了一下');
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
    nextTurn() {
        // 检查体力是否耗尽
        if (this.state.energy <= 0) {
            AchievementSystem.recordExhaustion();
        }

        // 随机事件（旧系统）
        const randomEvent = EventSystem.rollEvent(this.state);
        if (randomEvent) {
            const changes = EventSystem.applyEventEffects(randomEvent, this.state);
            const message = EventSystem.generateEventMessage(randomEvent, changes);
            this.showEventModal(randomEvent, message);
        }

        // 月末结算事件
        const monthEndEvents = EventSystem.checkMonthEndEvents(this.state);
        monthEndEvents.forEach(event => {
            EventSystem.applyEventEffects(event, this.state);
            this.addLog(`${event.icon} ${event.name}`);
        });

        // === 新：月末随机事件系统 ===
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
        this.currentRandomEvent = event;
        
        // 设置事件信息
        document.getElementById('random-event-icon').textContent = event.icon;
        document.getElementById('random-event-title').textContent = event.name;
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

        // 检查成就
        AchievementSystem.checkAchievements(this.state);

        // 检查游戏结束条件
        if (this.checkGameOver()) {
            return;
        }

        this.updateUI();
    }

    // 推进月份
    advanceMonth() {
        this.state.month++;
        this.state.totalMonths++;

        // 月份循环
        if (this.state.month > 12) {
            this.state.month = 1;
        }

        // 检查学期转换
        if (this.state.month === 2) {
            // 春季学期开始
            this.loadSemesterCourses();
            this.addLog('📅 春季学期开始了', 'important');
        } else if (this.state.month === 7) {
            // 小学期
            this.startSummerTerm();
        } else if (this.state.month === 9) {
            // 新学年开始
            this.startNewYear();
        }

        // 检查期末考试
        if (this.state.month === 1 || this.state.month === 6) {
            this.doExam();
        }
    }

    // 开始小学期
    startSummerTerm() {
        const summerCourse = GameData.summerCourses[`year${this.state.year}`];
        if (summerCourse) {
            document.getElementById('summer-desc').textContent = 
                `七月炎炎，${summerCourse.name}开始了！这是必修的实践环节。`;
            
            const options = document.getElementById('summer-options');
            options.innerHTML = `
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
        const effects = this.state.collegeEffects || {};
        
        // 彭康书院夏季体育SAN恢复加成 (1.2倍)
        // 这里表现为SAN损失减少
        if (effects.summerSanMultiplier > 1 && this.state.college === 'pengkang') {
            sanLoss = Math.floor(sanLoss / effects.summerSanMultiplier);
            this.addLog('🥋 彭康书院体育底子好，小学期轻松应对！', 'success');
            
            // 检查太极成就
            AchievementSystem.stats.pengkangTaichiCount = (AchievementSystem.stats.pengkangTaichiCount || 0) + 1;
            if (AchievementSystem.stats.pengkangTaichiCount >= 10) {
                AchievementSystem.unlock('pengkangTaichi');
            }
        }
        
        this.state.san -= sanLoss;
        this.state.totalCredits += course.credits;
        this.addLog(`☀️ 完成了${course.name}，获得${course.credits}学分`, 'important');
        
        // 跳过8月
        this.state.month = 8;
    }

    // 开始新学年
    startNewYear() {
        this.state.year++;
        this.state.volunteerHoursThisYear = 0;

        if (this.state.year > 4) {
            // 游戏结束
            this.endGame();
            return;
        }

        if (this.state.year === 4) {
            // 大四，切换到创新港
            this.state.location = 'innovationPort';
            AchievementSystem.unlock('secondWestward');
            this.addLog('🏗️ 大四了！搬迁至创新港校区', 'important');
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
            // 计算最终分数
            const baseMastery = course.mastery;
            const randomFactor = (Math.random() - 0.5) * 20; // -10 到 +10 的随机浮动
            let finalScore = Math.max(0, Math.min(100, baseMastery + randomFactor));
            
            // 励志书院逻辑科目加成 (+20%)
            if (effects.logicGrowth > 1 && (course.type === 'logic' || course.name.includes('数学') || course.name.includes('物理'))) {
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
                grade,
                gradePoint,
                credits: course.credits,
                isRetake: this.state.retakeCourses.includes(course)
            });

            if (passed) {
                // 通过，计入总绩点
                this.state.totalCredits += course.credits;
                this.state.totalGradePoints += gradePoint * course.credits;
                semesterGradePoints += gradePoint * course.credits;
                semesterCredits += course.credits;
                
                // 记录考试通过（用于成就检测）
                const didAttend = course.attendCount > 0;
                AchievementSystem.recordExamPass(course.name, Math.round(finalScore), didAttend);
                
                // 如果是重修课程，从重修列表移除
                const retakeIndex = this.state.retakeCourses.indexOf(course);
                if (retakeIndex > -1) {
                    this.state.retakeCourses.splice(retakeIndex, 1);
                }
            } else {
                // 挂科
                this.state.failedCourses++;
                
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
            
            // 钱学森书院GPA无上限（但其他书院上限4.3）
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

        this.showModal('exam-modal');

        // 清空当前课程
        this.state.currentCourses = [];
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
        this.showModal('game-menu');
    }

    // 显示课程详情
    showCoursesModal() {
        this.hideModal('game-menu');
        
        let content = '<div class="course-detail-list">';
        
        if (this.state.currentCourses.length > 0) {
            content += '<h4>当前课程</h4>';
            this.state.currentCourses.forEach(c => {
                content += `
                    <div class="course-detail-item">
                        <strong>${c.name}</strong> (${c.credits}学分)<br>
                        掌握度: ${Math.round(c.mastery)}% | 上课: ${c.attendCount}次 | 自习: ${c.studyCount}次
                    </div>
                `;
            });
        }

        if (this.state.retakeCourses.length > 0) {
            content += '<h4 style="color: #F44336; margin-top: 15px;">重修课程</h4>';
            this.state.retakeCourses.forEach(c => {
                content += `
                    <div class="course-detail-item" style="border-color: #F44336;">
                        <strong>${c.name}</strong> (${c.credits}学分)<br>
                        掌握度: ${Math.round(c.mastery)}%
                    </div>
                `;
            });
        }

        content += `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                <strong>累计挂科:</strong> ${this.state.failedCourses}门<br>
                <strong>已获学分:</strong> ${this.state.totalCredits}
            </div>
        `;
        content += '</div>';

        document.getElementById('modal-title').textContent = '📚 课程详情';
        document.getElementById('modal-body').innerHTML = content;
        this.showModal('modal');
    }

    // 保存游戏
    saveGame() {
        localStorage.setItem('xjtu_game_state', JSON.stringify(this.state));
        this.hideModal('game-menu');
        this.showMessage('保存成功', '游戏进度已保存！');
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new XJTUSimulator();
});