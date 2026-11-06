/* 倾学 · 数据层
 * 课程要求 / 知识点 / 60 份配套材料 / 30 名模拟学生 / 模拟学习记录（含质量缺陷）
 * 内置数据为按赛题数据字典结构生成的合成演示数据，不含真实学生信息。
 */
window.SLC = window.SLC || {};
(function (S) {
  'use strict';

  S.meta = {
    appName: '倾学',
    subtitle: '学习投入诊断与个性化伴学智能体',
    version: '1.0.0',
    datasetLabel: '七年级数学 · 演示数据集',
    scope: '有理数 · 一元一次方程 · 几何图形初步',
    dataNote: '内置数据为依据赛题数据字典结构生成的合成演示数据，不对应任何真实学生；正式评测数据可通过“数据导入”整包替换，分析逻辑不变。',
    courseSource: '《义务教育数学课程标准（2022 年版）》第三学段（7—9 年级）内容要求；人教版《数学》七年级上册',
    generatedAt: '2026-10-30'
  };

  S.topics = [
    {
      id: 'T1', name: '有理数', short: '数的扩充与运算', color: '#2563eb', tint: '#eef4ff', book: '人教版七年级上册 第一章',
      intro: '从生活情境中的正负数出发，建立数轴与绝对值等工具，完成有理数四则运算与乘方混合运算的规则建构，是后续方程与函数学习的运算基础。',
      ideas: ['正负数的现实意义', '数轴与绝对值', '四则运算法则', '乘方与混合运算'],
      focus: '符号规则的建立与运算顺序的稳定执行'
    },
    {
      id: 'T2', name: '一元一次方程', short: '模型建构与求解', color: '#0d9488', tint: '#e8f7f5', book: '人教版七年级上册 第三章',
      intro: '以等式性质为依据，通过合并同类项、移项、去括号、去分母形成解方程的一般程序，并把程序用于和差倍分、行程、工程、销售等实际问题的建模。',
      ideas: ['方程与解的意义', '等式性质', '解方程程序', '实际问题建模'],
      focus: '从“算”到“列”的模型意识与检验习惯'
    },
    {
      id: 'T3', name: '几何图形初步', short: '图形语言与推理', color: '#7c3aed', tint: '#f2edff', book: '人教版七年级上册 第四章',
      intro: '从立体与平面图形的整体观察进入直线、射线、线段与角的研究，学习用图形语言与“因为……所以……”的规范格式表达简单的几何推理。',
      ideas: ['图形观察与想象', '直线射线线段', '角的度量与关系', '规范推理表达'],
      focus: '图形语言的准确性与推理步骤的可追溯'
    }
  ];

  S.kps = [
    { id: 'R1', topicId: 'T1', name: '正负数与数轴', importance: 2, prerequisites: [], desc: '用正负数刻画相反意义的量，用数轴表示并比较有理数。' },
    { id: 'R2', topicId: 'T1', name: '相反数与绝对值', importance: 2, prerequisites: ['R1'], desc: '理解相反数、绝对值的几何意义，会求值与比较大小。' },
    { id: 'R3', topicId: 'T1', name: '有理数加减法', importance: 3, prerequisites: ['R2'], desc: '依据符号与绝对值确定结果，完成加减混合运算。' },
    { id: 'R4', topicId: 'T1', name: '有理数乘除法', importance: 3, prerequisites: ['R3'], desc: '掌握乘除法则与倒数，处理多因数符号问题。' },
    { id: 'R5', topicId: 'T1', name: '乘方与混合运算', importance: 3, prerequisites: ['R4'], desc: '理解乘方意义，按运算顺序完成含乘方的混合运算。' },
    { id: 'R6', topicId: 'T1', name: '科学记数法与近似数', importance: 1, prerequisites: ['R5'], desc: '用 10 的幂表示较大数，说明近似数的精确度。' },
    { id: 'E1', topicId: 'T2', name: '方程与等式性质', importance: 2, prerequisites: [], desc: '识别一元一次方程，依据等式性质进行同解变形。' },
    { id: 'E2', topicId: 'T2', name: '合并同类项与移项', importance: 3, prerequisites: ['E1'], desc: '通过移项、合并同类项把方程化为 x = a 的形式。' },
    { id: 'E3', topicId: 'T2', name: '去括号与去分母', importance: 3, prerequisites: ['E2'], desc: '处理含括号或含分母的方程，注意符号与最小公倍数。' },
    { id: 'E4', topicId: 'T2', name: '实际问题与方程', importance: 3, prerequisites: ['E3', 'R4'], desc: '设元、找等量关系、列方程并检验结果的实际意义。' },
    { id: 'G1', topicId: 'T3', name: '几何图形认识', importance: 1, prerequisites: [], desc: '认识常见立体与平面图形，能从不同方向观察与想象。' },
    { id: 'G2', topicId: 'T3', name: '直线射线线段', importance: 3, prerequisites: ['G1'], desc: '掌握概念与基本事实，进行线段的和差与中点计算。' },
    { id: 'G3', topicId: 'T3', name: '角的度量与关系', importance: 3, prerequisites: ['G2'], desc: '度分秒换算、角的比较与计算，理解余角与补角。' },
    { id: 'G4', topicId: 'T3', name: '几何推理表达', importance: 2, prerequisites: ['G1', 'G2', 'G3'], desc: '用“因为……所以……”格式书写简单推理。' }
  ];

  S.requirements = [
    {
      id: 'REQ-T1-01', topicId: 'T1', kpIds: ['R1'], level: '理解',
      text: '理解正数、负数和有理数的意义，会用数轴上的点表示有理数，能借助数轴比较有理数的大小。',
      source: '课程标准·第三学段“数与代数”内容要求（有理数）；人教版七上第一章 1.1、1.2.2',
      locator: 'KB-T1-01｜教材 1.1 正数和负数、1.2.2 数轴',
      note: '数轴是后续理解相反数、绝对值的直观工具，建议先建立“数—点”对应。'
    },
    {
      id: 'REQ-T1-02', topicId: 'T1', kpIds: ['R2'], level: '掌握',
      text: '理解相反数和绝对值的意义，会求一个有理数的相反数与绝对值，能利用绝对值比较两个负数的大小。',
      source: '课程标准·第三学段“数与代数”内容要求（有理数）；人教版七上 1.2.3、1.2.4',
      locator: 'KB-T1-02｜教材 1.2.3 相反数、1.2.4 绝对值',
      note: '绝对值既是“距离”也是运算中确定结果的工具，是加减法则的直接前提。'
    },
    {
      id: 'REQ-T1-03', topicId: 'T1', kpIds: ['R3'], level: '掌握',
      text: '掌握有理数加法与减法法则，能准确进行有理数的加减混合运算，能运用运算律简化计算。',
      source: '课程标准·第三学段“数与代数”内容要求（有理数）；人教版七上 1.3',
      locator: 'KB-T1-03｜教材 1.3.1—1.3.2',
      note: '减法统一为“加上相反数”，与相反数、绝对值知识直接相连。'
    },
    {
      id: 'REQ-T1-04', topicId: 'T1', kpIds: ['R4'], level: '掌握',
      text: '掌握有理数乘法与除法法则，理解倒数的概念，能进行有理数的乘除运算并处理多个因数的符号。',
      source: '课程标准·第三学段“数与代数”内容要求（有理数）；人教版七上 1.4',
      locator: 'KB-T1-04｜教材 1.4.1—1.4.2',
      note: '乘除符号规则与加减符号规则容易混淆，需对比辨析。'
    },
    {
      id: 'REQ-T1-05', topicId: 'T1', kpIds: ['R5'], level: '掌握',
      text: '理解乘方的意义，掌握有理数混合运算的顺序，能进行含乘方的四则混合运算。',
      source: '课程标准·第三学段“数与代数”内容要求（有理数）；人教版七上 1.5',
      locator: 'KB-T1-05｜教材 1.5.1—1.5.3',
      note: '乘方优先于乘除、乘除优先于加减，是混合运算错误的高发点。'
    },
    {
      id: 'REQ-T1-06', topicId: 'T1', kpIds: ['R6'], level: '理解',
      text: '会用科学记数法表示绝对值较大的数，能结合实例说明近似数的精确程度。',
      source: '课程标准·第三学段“数与代数”内容要求（有理数）；人教版七上“科学记数法与近似数”',
      locator: 'KB-T1-06｜教材“科学记数法与近似数”',
      note: '以 10 的幂为基础，与乘方意义直接相关；本主题材料较少，需注意证据充分性。'
    },
    {
      id: 'REQ-T2-01', topicId: 'T2', kpIds: ['E1'], level: '理解',
      text: '理解方程、一元一次方程与方程的解的概念，能判断一个式子是否为一元一次方程，能检验一个数是否为方程的解。',
      source: '课程标准·第三学段“数与代数”内容要求（方程与方程组）；人教版七上 3.1',
      locator: 'KB-T2-01｜教材 3.1.1—3.1.2',
      note: '“解”是使等式成立的值，检验习惯应贯穿整个解方程过程。'
    },
    {
      id: 'REQ-T2-02', topicId: 'T2', kpIds: ['E2'], level: '掌握',
      text: '掌握等式的性质，会用合并同类项与移项的方法解一元一次方程。',
      source: '课程标准·第三学段“数与代数”内容要求（方程与方程组）；人教版七上 3.2',
      locator: 'KB-T2-02｜教材 3.2 解一元一次方程（一）',
      note: '移项的依据是等式性质 1，必须变号；这是解方程程序的第一道关口。'
    },
    {
      id: 'REQ-T2-03', topicId: 'T2', kpIds: ['E3'], level: '掌握',
      text: '掌握去括号、去分母的方法，能规范地解含括号或含分母的一元一次方程。',
      source: '课程标准·第三学段“数与代数”内容要求（方程与方程组）；人教版七上 3.3',
      locator: 'KB-T2-03｜教材 3.3 解一元一次方程（二）',
      note: '去分母时每一项都要乘最小公倍数，分子是多项式时需加括号，与去括号规则联合使用。'
    },
    {
      id: 'REQ-T2-04', topicId: 'T2', kpIds: ['E4'], level: '运用',
      text: '能根据实际问题中的数量关系列出一元一次方程，解决和差倍分、行程、工程、销售等问题，并检验结果的实际意义。',
      source: '课程标准·第三学段“数与代数”内容要求（方程与方程组）；人教版七上 3.4',
      locator: 'KB-T2-04｜教材 3.4 实际问题与一元一次方程',
      note: '建模依赖解方程技能（E3），同时涉及有理数运算（R4），需在建议中安排先后。'
    },
    {
      id: 'REQ-T2-05', topicId: 'T2', kpIds: ['E4'], level: '理解',
      text: '能在具体情境中说明设未知数与列方程的依据，能用文字、表格或图示表示数量关系。',
      source: '课程标准·第三学段“数与代数”学业要求（模型观念）；人教版七上 3.4',
      locator: 'KB-T2-05｜教材 3.4 例 1—例 4 的情境分析',
      note: '与 REQ-T2-04 同属实际问题，但侧重“表达依据”，建议配合口头或书面说明类任务。'
    },
    {
      id: 'REQ-T3-01', topicId: 'T3', kpIds: ['G1'], level: '理解',
      text: '认识常见的立体图形与平面图形，能描述它们的特征，能想象从不同方向观察物体得到的平面图形。',
      source: '课程标准·第三学段“图形与几何”内容要求（图形的性质）；人教版七上 4.1',
      locator: 'KB-T3-01｜教材 4.1 几何图形',
      note: '整体观察是研究线、角等要素的起点，与后续三视图学习相连。'
    },
    {
      id: 'REQ-T3-02', topicId: 'T3', kpIds: ['G2'], level: '掌握',
      text: '掌握直线、射线、线段的概念与表示方法，理解“两点确定一条直线”“两点之间线段最短”的基本事实。',
      source: '课程标准·第三学段“图形与几何”内容要求（图形的性质）；人教版七上 4.2',
      locator: 'KB-T3-02｜教材 4.2 直线、射线、线段',
      note: '基本事实是后续所有几何推理的公共前提，应能用自己的语言表述。'
    },
    {
      id: 'REQ-T3-03', topicId: 'T3', kpIds: ['G2'], level: '掌握',
      text: '理解两点之间的距离与线段中点的意义，能进行线段的和、差计算。',
      source: '课程标准·第三学段“图形与几何”内容要求（图形的性质）；人教版七上 4.2',
      locator: 'KB-T3-03｜教材 4.2 线段的中点与和差',
      note: '线段中点模型会迁移到角的平分线，属于同构关系。'
    },
    {
      id: 'REQ-T3-04', topicId: 'T3', kpIds: ['G3'], level: '掌握',
      text: '理解角的度量单位及度、分、秒的换算，会进行角的比较与简单计算，理解余角和补角的意义。',
      source: '课程标准·第三学段“图形与几何”内容要求（图形的性质）；人教版七上 4.3',
      locator: 'KB-T3-04｜教材 4.3 角',
      note: '度分秒是六十进制，与有理数运算规则不同，需要专门辨析。'
    },
    {
      id: 'REQ-T3-05', topicId: 'T3', kpIds: ['G4'], level: '理解',
      text: '能用“因为……所以……”的规范格式表达简单的几何推理过程，说明每一步的依据。',
      source: '课程标准·第三学段“图形与几何”学业要求（推理能力）；人教版七上 4.2—4.3 例题',
      locator: 'KB-T3-05｜教材例题中的“因为……所以……”书写示范',
      note: '本主题相关材料偏少，判断时需结合课堂口头表达等补充观察。'
    }
  ];

  S.links = [
    { from: 'R1', to: 'R2', type: '前置支撑', note: '数轴上的位置关系是理解相反数、绝对值几何意义的直观基础。' },
    { from: 'R2', to: 'R3', type: '前置支撑', note: '绝对值决定加减结果中“数值部分”的大小与符号判断。' },
    { from: 'R3', to: 'R4', type: '前置支撑', note: '加减运算的符号处理经验迁移到乘除运算的多因数符号判断。' },
    { from: 'R4', to: 'R5', type: '前置支撑', note: '乘除是混合运算的组成单元，乘方优先于乘除。' },
    { from: 'R5', to: 'R6', type: '前置支撑', note: '10 的幂的表示依赖乘方意义，是科学记数法的写法基础。' },
    { from: 'E1', to: 'E2', type: '前置支撑', note: '等式性质是移项、合并同类项的依据，不理解性质就只会机械变号。' },
    { from: 'E2', to: 'E3', type: '前置支撑', note: '先去括号/去分母，再按移项、合并同类项完成求解程序。' },
    { from: 'E3', to: 'E4', type: '前置支撑', note: '实际问题列出方程后，仍需依靠解方程程序得到答案。' },
    { from: 'R4', to: 'E4', type: '横向关联', note: '销售、行程、工程问题中的比例与乘除运算直接调用有理数乘除。' },
    { from: 'G1', to: 'G2', type: '前置支撑', note: '对图形整体的观察为抽象出直线、射线、线段等要素做准备。' },
    { from: 'G2', to: 'G3', type: '前置支撑', note: '线段中点、和差关系与角的平分线、角度计算同构，可迁移。' },
    { from: 'G3', to: 'G4', type: '前置支撑', note: '角度计算是规范书写“因为……所以……”推理的主要载体。' },
    { from: 'R2', to: 'G2', type: '横向关联', note: '两点间距离用绝对值刻画，数与形的距离概念在此汇合。' }
  ];

  S.materials = [
    { id: 'MAT-T1-01', topicId: 'T1', kpIds: ['R1'], type: '例题', difficulty: 1, estMin: 3, title: '正负数的意义', stem: '如果收入 100 元记作 +100 元，那么支出 60 元记作______元。', answer: '-60', source: '配套材料演示编号' },
    { id: 'MAT-T1-02', topicId: 'T1', kpIds: ['R1'], type: '练习', difficulty: 1, estMin: 3, title: '数轴上的距离', stem: '数轴上点 A 表示 -2，点 B 表示 3，A、B 两点之间的距离是______。', answer: '5', source: '配套材料演示编号' },
    { id: 'MAT-T1-03', topicId: 'T1', kpIds: ['R1'], type: '变式', difficulty: 2, estMin: 4, title: '数轴上的对称点', stem: '在数轴上，与表示数 -1 的点距离为 3 的点表示的数是______。', answer: '-4 或 2', source: '按规则登记的自编变式' },
    { id: 'MAT-T1-04', topicId: 'T1', kpIds: ['R1', 'R2'], type: '探究', difficulty: 3, estMin: 6, title: '绝对值与大小关系的综合', stem: '若 |a| = 3，|b| = 2，且 a < b，求 a + b 的所有可能值。', answer: '-1 或 -5', source: '按规则登记的自编探究' },
    { id: 'MAT-T1-05', topicId: 'T1', kpIds: ['R2'], type: '例题', difficulty: 1, estMin: 3, title: '相反数与绝对值', stem: '-5 的相反数是______，绝对值是______。', answer: '5；5', source: '配套材料演示编号' },
    { id: 'MAT-T1-06', topicId: 'T1', kpIds: ['R2'], type: '练习', difficulty: 1, estMin: 2, title: '由绝对值求原数', stem: '若 |x| = 7，则 x = ______。', answer: '7 或 -7', source: '配套材料演示编号' },
    { id: 'MAT-T1-07', topicId: 'T1', kpIds: ['R2'], type: '变式', difficulty: 2, estMin: 4, title: '非负性求和', stem: '已知 |a - 2| + |b + 3| = 0，求 a + b 的值。', answer: '-1', source: '按规则登记的自编变式' },
    { id: 'MAT-T1-08', topicId: 'T1', kpIds: ['R2'], type: '错因诊断', difficulty: 2, estMin: 4, title: '多重符号化简', stem: '化简 |-(-6)|。某同学得到 -6，请指出错误原因并给出正确结果。', answer: '正确结果为 6；错误在于把绝对值当作括号逐层去掉。', source: '按规则登记的错误样例' },
    { id: 'MAT-T1-09', topicId: 'T1', kpIds: ['R3'], type: '例题', difficulty: 1, estMin: 3, title: '同号相加', stem: '计算：(-3) + (-5) = ______。', answer: '-8', source: '配套材料演示编号' },
    { id: 'MAT-T1-10', topicId: 'T1', kpIds: ['R3'], type: '练习', difficulty: 1, estMin: 2, title: '异号相加', stem: '计算：(-7) + (+4) = ______。', answer: '-3', source: '配套材料演示编号' },
    { id: 'MAT-T1-11', topicId: 'T1', kpIds: ['R3'], type: '练习', difficulty: 1, estMin: 2, title: '减法转加法', stem: '计算：5 - (-8) = ______。', answer: '13', source: '配套材料演示编号' },
    { id: 'MAT-T1-12', topicId: 'T1', kpIds: ['R3'], type: '变式', difficulty: 2, estMin: 4, title: '加减混合运算', stem: '计算：(-2.5) + 3.4 - (-1.6) = ______。', answer: '2.5', source: '按规则登记的自编变式' },
    { id: 'MAT-T1-13', topicId: 'T1', kpIds: ['R3'], type: '探究', difficulty: 3, estMin: 7, title: '正负交替求和', stem: '计算：1 - 2 + 3 - 4 + … + 99 - 100。', answer: '-50', source: '按规则登记的自编探究' },
    { id: 'MAT-T1-14', topicId: 'T1', kpIds: ['R4'], type: '例题', difficulty: 1, estMin: 3, title: '同号相乘', stem: '计算：(-3) × (-4) = ______。', answer: '12', source: '配套材料演示编号' },
    { id: 'MAT-T1-15', topicId: 'T1', kpIds: ['R4'], type: '练习', difficulty: 1, estMin: 2, title: '异号相除', stem: '计算：(-18) ÷ 6 = ______。', answer: '-3', source: '配套材料演示编号' },
    { id: 'MAT-T1-16', topicId: 'T1', kpIds: ['R4'], type: '练习', difficulty: 2, estMin: 3, title: '多因数符号', stem: '计算：(-2) × 3 × (-5) = ______。', answer: '30', source: '配套材料演示编号' },
    { id: 'MAT-T1-17', topicId: 'T1', kpIds: ['R4'], type: '变式', difficulty: 2, estMin: 4, title: '分数乘法', stem: '计算：(-3/4) × (-8/9) = ______。', answer: '2/3', source: '按规则登记的自编变式' },
    { id: 'MAT-T1-18', topicId: 'T1', kpIds: ['R4'], type: '错因诊断', difficulty: 3, estMin: 5, title: '除法与倒数', stem: '计算 -6 ÷ (-1/3)。某同学得到 -2，请指出错误原因并给出正确结果。', answer: '正确结果 18；错误在于把除以分数当成乘以分数。', source: '按规则登记的错误样例' },
    { id: 'MAT-T1-19', topicId: 'T1', kpIds: ['R5'], type: '例题', difficulty: 1, estMin: 3, title: '乘方的意义', stem: '计算：(-2)^3 = ______。', answer: '-8', source: '配套材料演示编号' },
    { id: 'MAT-T1-20', topicId: 'T1', kpIds: ['R5'], type: '练习', difficulty: 2, estMin: 3, title: '乘方与加减', stem: '计算：-3^2 + (-2)^2 = ______。', answer: '-5', source: '配套材料演示编号' },
    { id: 'MAT-T1-21', topicId: 'T1', kpIds: ['R5'], type: '变式', difficulty: 2, estMin: 4, title: '幂的符号规律', stem: '计算：(-1)^{2026} + (-1)^{2025} = ______。', answer: '0', source: '按规则登记的自编变式' },
    { id: 'MAT-T1-22', topicId: 'T1', kpIds: ['R5', 'R4'], type: '探究', difficulty: 3, estMin: 7, title: '含乘方的混合运算', stem: '计算：(-2)^2 ÷ (-1/2)^3 × (-1)^{2026}。', answer: '-32', source: '按规则登记的自编探究' },
    { id: 'MAT-T1-23', topicId: 'T1', kpIds: ['R6'], type: '例题', difficulty: 1, estMin: 3, title: '科学记数法', stem: '把 350000 用科学记数法表示为______。', answer: '3.5×10^5', source: '配套材料演示编号' },
    { id: 'MAT-T1-24', topicId: 'T1', kpIds: ['R6'], type: '练习', difficulty: 2, estMin: 3, title: '近似数的精确度', stem: '近似数 3.60 万精确到______位。', answer: '百位（即 36000 中的百位）', source: '配套材料演示编号' },

    { id: 'MAT-T2-01', topicId: 'T2', kpIds: ['E1'], type: '例题', difficulty: 1, estMin: 3, title: '识别一元一次方程', stem: '下列各式中，是一元一次方程的是（ ）。①3x-1 ②2+3=5 ③x+5=8 ④x>1', answer: '③', source: '配套材料演示编号' },
    { id: 'MAT-T2-02', topicId: 'T2', kpIds: ['E1'], type: '练习', difficulty: 1, estMin: 3, title: '由解求参数', stem: '若 x = 2 是方程 3x - a = 4 的解，则 a = ______。', answer: '2', source: '配套材料演示编号' },
    { id: 'MAT-T2-03', topicId: 'T2', kpIds: ['E1'], type: '练习', difficulty: 2, estMin: 3, title: '等式性质的应用', stem: '若 2x - 1 = 5，则 2x = ______。', answer: '6', source: '配套材料演示编号' },
    { id: 'MAT-T2-04', topicId: 'T2', kpIds: ['E1'], type: '变式', difficulty: 2, estMin: 3, title: '同解变形', stem: '由等式 x - 3 = 4 两边同时加 3，得到______。', answer: 'x = 7', source: '按规则登记的自编变式' },
    { id: 'MAT-T2-05', topicId: 'T2', kpIds: ['E2'], type: '例题', difficulty: 1, estMin: 3, title: '移项与合并', stem: '解方程：2x + 3 = 11。', answer: 'x = 4', source: '配套材料演示编号' },
    { id: 'MAT-T2-06', topicId: 'T2', kpIds: ['E2'], type: '练习', difficulty: 1, estMin: 2, title: '合并同类项', stem: '解方程：5x - 2x = 9。', answer: 'x = 3', source: '配套材料演示编号' },
    { id: 'MAT-T2-07', topicId: 'T2', kpIds: ['E2'], type: '练习', difficulty: 2, estMin: 4, title: '含未知数项移项', stem: '解方程：3x - 5 = 2x + 1。', answer: 'x = 6', source: '配套材料演示编号' },
    { id: 'MAT-T2-08', topicId: 'T2', kpIds: ['E2'], type: '变式', difficulty: 2, estMin: 4, title: '小数系数方程', stem: '解方程：0.5x - 1 = 2 - 0.3x。', answer: 'x = 3.75', source: '按规则登记的自编变式' },
    { id: 'MAT-T2-09', topicId: 'T2', kpIds: ['E3'], type: '例题', difficulty: 1, estMin: 4, title: '去括号解方程', stem: '解方程：2(x + 3) = 10。', answer: 'x = 2', source: '配套材料演示编号' },
    { id: 'MAT-T2-10', topicId: 'T2', kpIds: ['E3'], type: '练习', difficulty: 2, estMin: 5, title: '两边含括号', stem: '解方程：3(x - 1) = 2(x + 2)。', answer: 'x = 7', source: '配套材料演示编号' },
    { id: 'MAT-T2-11', topicId: 'T2', kpIds: ['E3'], type: '练习', difficulty: 2, estMin: 4, title: '含分母的方程', stem: '解方程：(x - 1)/2 = 5。', answer: 'x = 11', source: '配套材料演示编号' },
    { id: 'MAT-T2-12', topicId: 'T2', kpIds: ['E3'], type: '变式', difficulty: 3, estMin: 6, title: '双分母方程', stem: '解方程：(2x - 1)/3 - (x + 2)/2 = 1。', answer: 'x = 14', source: '按规则登记的自编变式' },
    { id: 'MAT-T2-13', topicId: 'T2', kpIds: ['E4'], type: '例题', difficulty: 1, estMin: 4, title: '和差倍分问题', stem: '某数的 3 倍加上 5 等于 20，求这个数。', answer: '5', source: '配套材料演示编号' },
    { id: 'MAT-T2-14', topicId: 'T2', kpIds: ['E4'], type: '练习', difficulty: 2, estMin: 5, title: '积分问题', stem: '篮球比赛胜 1 场得 2 分、负 1 场得 1 分。某队赛 10 场共得 16 分，胜了几场？', answer: '6 场', source: '配套材料演示编号' },
    { id: 'MAT-T2-15', topicId: 'T2', kpIds: ['E4', 'R4'], type: '练习', difficulty: 2, estMin: 5, title: '销售打折问题', stem: '某商品进价 80 元，按标价打八折出售仍获利 16 元，求标价。', answer: '120 元', source: '配套材料演示编号' },
    { id: 'MAT-T2-16', topicId: 'T2', kpIds: ['E4'], type: '练习', difficulty: 2, estMin: 5, title: '相遇问题', stem: '甲、乙两人同时从相距 20 km 的两地相向而行，甲速 5 km/h，乙速 3 km/h，几小时后相遇？', answer: '2.5 h', source: '配套材料演示编号' },
    { id: 'MAT-T2-17', topicId: 'T2', kpIds: ['E4'], type: '变式', difficulty: 3, estMin: 6, title: '工程问题', stem: '一项工作甲单独做 10 天完成，乙单独做 15 天完成，两人合作几天完成？', answer: '6 天', source: '按规则登记的自编变式' },
    { id: 'MAT-T2-18', topicId: 'T2', kpIds: ['E4'], type: '变式', difficulty: 3, estMin: 5, title: '人数分配问题', stem: '某班 45 人，男生比女生多 3 人，男生有多少人？', answer: '24 人', source: '按规则登记的自编变式' },
    { id: 'MAT-T2-19', topicId: 'T2', kpIds: ['E4'], type: '错因诊断', difficulty: 3, estMin: 5, title: '连续偶数的设元', stem: '求两个连续偶数的和是 26 时的较小数。某同学设较小数为 x，列式 x + (x + 1) = 26，请指出错误并改正。', answer: '应列 x + (x + 2) = 26，较小数为 12。', source: '按规则登记的错误样例' },
    { id: 'MAT-T2-20', topicId: 'T2', kpIds: ['E4'], type: '探究', difficulty: 3, estMin: 7, title: '租车方案问题', stem: '研学租车：每车坐 45 人则 15 人无座；每车坐 50 人则空 10 个座位。共有多少辆车？', answer: '5 辆', source: '按规则登记的自编探究' },

    { id: 'MAT-T3-01', topicId: 'T3', kpIds: ['G1'], type: '例题', difficulty: 1, estMin: 3, title: '识别棱柱', stem: '下列几何体中，属于棱柱的是（ ）。A. 圆锥 B. 三棱柱 C. 球 D. 圆柱', answer: 'B', source: '配套材料演示编号' },
    { id: 'MAT-T3-02', topicId: 'T3', kpIds: ['G1'], type: '练习', difficulty: 1, estMin: 2, title: '正方体的要素', stem: '一个正方体有______个面，______条棱，______个顶点。', answer: '6；12；8', source: '配套材料演示编号' },
    { id: 'MAT-T3-03', topicId: 'T3', kpIds: ['G1'], type: '练习', difficulty: 2, estMin: 3, title: '从不同方向观察', stem: '从不同方向观察一个圆柱，得到的平面图形可能是______（写出两种）。', answer: '长方形、圆（俯视）', source: '配套材料演示编号' },
    { id: 'MAT-T3-04', topicId: 'T3', kpIds: ['G1'], type: '变式', difficulty: 2, estMin: 4, title: '正方体的截面', stem: '用平面截正方体，截面不可能是（ ）。A. 三角形 B. 正方形 C. 五边形 D. 七边形', answer: 'D', source: '按规则登记的自编变式' },
    { id: 'MAT-T3-05', topicId: 'T3', kpIds: ['G2'], type: '例题', difficulty: 1, estMin: 2, title: '基本事实', stem: '两点确定______条直线。', answer: '1', source: '配套材料演示编号' },
    { id: 'MAT-T3-06', topicId: 'T3', kpIds: ['G2'], type: '练习', difficulty: 1, estMin: 2, title: '线段中点', stem: '点 C 是线段 AB 的中点，AB = 8 cm，则 AC = ______ cm。', answer: '4', source: '配套材料演示编号' },
    { id: 'MAT-T3-07', topicId: 'T3', kpIds: ['G2'], type: '练习', difficulty: 2, estMin: 4, title: '线段的和差', stem: '线段 AB = 10，点 C 在 AB 上，AC = 4，M 是 BC 的中点，求 AM。', answer: '7', source: '配套材料演示编号' },
    { id: 'MAT-T3-08', topicId: 'T3', kpIds: ['G2'], type: '变式', difficulty: 3, estMin: 5, title: '点与直线计数', stem: '平面内有 4 个点，任意三点不共线，过其中两点画直线，最多可画______条。', answer: '6', source: '按规则登记的自编变式' },
    { id: 'MAT-T3-09', topicId: 'T3', kpIds: ['G3'], type: '例题', difficulty: 1, estMin: 2, title: '角的单位', stem: '1 平角 = ______°，1 周角 = ______°。', answer: '180；360', source: '配套材料演示编号' },
    { id: 'MAT-T3-10', topicId: 'T3', kpIds: ['G3'], type: '练习', difficulty: 1, estMin: 3, title: '求余角', stem: '35°30′ 的余角是______。', answer: '54°30′', source: '配套材料演示编号' },
    { id: 'MAT-T3-11', topicId: 'T3', kpIds: ['G3'], type: '练习', difficulty: 2, estMin: 3, title: '补角计算', stem: '若 ∠1 与 ∠2 互补，∠1 = 72°，则 ∠2 = ______。', answer: '108°', source: '配套材料演示编号' },
    { id: 'MAT-T3-12', topicId: 'T3', kpIds: ['G3'], type: '变式', difficulty: 2, estMin: 5, title: '余补角关系', stem: '一个角的补角是它的余角的 3 倍，求这个角。', answer: '45°', source: '按规则登记的自编变式' },
    { id: 'MAT-T3-13', topicId: 'T3', kpIds: ['G4'], type: '例题', difficulty: 2, estMin: 4, title: '规范书写推理', stem: '补全推理：因为点 C 是 AB 的中点，所以______。', answer: 'AC = BC = AB/2', source: '配套材料演示编号' },
    { id: 'MAT-T3-14', topicId: 'T3', kpIds: ['G4', 'G3'], type: '练习', difficulty: 2, estMin: 4, title: '角平分线推理', stem: '已知 ∠AOB = 90°，OC 平分 ∠AOB，则 ∠AOC = ______。', answer: '45°', source: '配套材料演示编号' },
    { id: 'MAT-T3-15', topicId: 'T3', kpIds: ['G4', 'G2'], type: '练习', difficulty: 2, estMin: 4, title: '线段和的说理', stem: '点 B 在线段 AC 上，AB = 3，BC = 5，则 AC = ______，理由是______。', answer: '8；AC = AB + BC（线段的和）', source: '配套材料演示编号' },
    { id: 'MAT-T3-16', topicId: 'T3', kpIds: ['G4'], type: '探究', difficulty: 3, estMin: 6, title: '线段计数的一般化', stem: '一条直线上有 n 个点，共可组成多少条线段？用含 n 的式子表示。', answer: 'n(n-1)/2', source: '按规则登记的自编探究' }
  ];

  S.students = [
    { id: 'S-01', name: '模拟学生S01', classId: 'C1', class: '七年级1班', practice: '高', ability: 0.86 },
    { id: 'S-02', name: '模拟学生S02', classId: 'C1', class: '七年级1班', practice: '中', ability: 0.72 },
    { id: 'S-03', name: '模拟学生S03', classId: 'C1', class: '七年级1班', practice: '中', ability: 0.58 },
    { id: 'S-04', name: '模拟学生S04', classId: 'C1', class: '七年级1班', practice: '低', ability: 0.44 },
    { id: 'S-05', name: '模拟学生S05', classId: 'C1', class: '七年级1班', practice: '高', ability: 0.79 },
    { id: 'S-06', name: '模拟学生S06', classId: 'C1', class: '七年级1班', practice: '中', ability: 0.64 },
    { id: 'S-07', name: '模拟学生S07', classId: 'C1', class: '七年级1班', practice: '低', ability: 0.52 },
    { id: 'S-08', name: '模拟学生S08', classId: 'C1', class: '七年级1班', practice: '高', ability: 0.88 },
    { id: 'S-09', name: '模拟学生S09', classId: 'C1', class: '七年级1班', practice: '中', ability: 0.67 },
    { id: 'S-10', name: '模拟学生S10', classId: 'C1', class: '七年级1班', practice: '低', ability: 0.49 },
    { id: 'S-11', name: '模拟学生S11', classId: 'C2', class: '七年级2班', practice: '高', ability: 0.83 },
    { id: 'S-12', name: '模拟学生S12', classId: 'C2', class: '七年级2班', practice: '中', ability: 0.61 },
    { id: 'S-13', name: '模拟学生S13', classId: 'C2', class: '七年级2班', practice: '低', ability: 0.47 },
    { id: 'S-14', name: '模拟学生S14', classId: 'C2', class: '七年级2班', practice: '中', ability: 0.75 },
    { id: 'S-15', name: '模拟学生S15', classId: 'C2', class: '七年级2班', practice: '高', ability: 0.90 },
    { id: 'S-16', name: '模拟学生S16', classId: 'C2', class: '七年级2班', practice: '中', ability: 0.56 },
    { id: 'S-17', name: '模拟学生S17', classId: 'C2', class: '七年级2班', practice: '中', ability: 0.69 },
    { id: 'S-18', name: '模拟学生S18', classId: 'C2', class: '七年级2班', practice: '低', ability: 0.41 },
    { id: 'S-19', name: '模拟学生S19', classId: 'C2', class: '七年级2班', practice: '高', ability: 0.77 },
    { id: 'S-20', name: '模拟学生S20', classId: 'C2', class: '七年级2班', practice: '中', ability: 0.53 },
    { id: 'S-21', name: '模拟学生S21', classId: 'C3', class: '七年级3班', practice: '高', ability: 0.92 },
    { id: 'S-22', name: '模拟学生S22', classId: 'C3', class: '七年级3班', practice: '中', ability: 0.66 },
    { id: 'S-23', name: '模拟学生S23', classId: 'C3', class: '七年级3班', practice: '低', ability: 0.45 },
    { id: 'S-24', name: '模拟学生S24', classId: 'C3', class: '七年级3班', practice: '高', ability: 0.81 },
    { id: 'S-25', name: '模拟学生S25', classId: 'C3', class: '七年级3班', practice: '中', ability: 0.62 },
    { id: 'S-26', name: '模拟学生S26', classId: 'C3', class: '七年级3班', practice: '中', ability: 0.71 },
    { id: 'S-27', name: '模拟学生S27', classId: 'C3', class: '七年级3班', practice: '低', ability: 0.38 },
    { id: 'S-28', name: '模拟学生S28', classId: 'C3', class: '七年级3班', practice: '高', ability: 0.85 },
    { id: 'S-29', name: '模拟学生S29', classId: 'C3', class: '七年级3班', practice: '中', ability: 0.57 },
    { id: 'S-30', name: '模拟学生S30', classId: 'C3', class: '七年级3班', practice: '低', ability: 0.48 }
  ];

  S.dictionary = [
    { field: '记录编号', type: 'string', required: true, desc: '学习记录的唯一致标识，用于复核与去重', example: 'R-0001' },
    { field: '学生编号', type: 'string', required: true, desc: '关联学生表的主键', example: 'S-01' },
    { field: '材料编号', type: 'string', required: true, desc: '关联课程材料表的主键', example: 'MAT-T1-01' },
    { field: '作答结果', type: 'enum', required: true, desc: '正确 / 错误 / 未作答 / 待评分；导入时兼容 1、0、对、错', example: '正确' },
    { field: '评分状态', type: 'enum', required: false, desc: '已评分 / 未评分；缺省按作答结果推断', example: '已评分' },
    { field: '作答时间', type: 'datetime', required: false, desc: '允许缺失；缺失记录保留但不参与时间维度分析', example: '2026-10-12 19:20' },
    { field: '学生编号（学生表）', type: 'string', required: true, desc: '学生表主键', example: 'S-01' },
    { field: '群体编号', type: 'string', required: false, desc: '班级或学习小组编号，缺失归入“未分组”', example: 'C1' },
    { field: '练习量', type: 'enum', required: false, desc: '高 / 中 / 低；缺失时按记录条数推断', example: '中' },
    { field: '材料编号（材料表）', type: 'string', required: true, desc: '材料表主键', example: 'MAT-T2-05' },
    { field: '知识点', type: 'string', required: false, desc: '多个知识点用顿号分隔，须与知识点编码表一致', example: 'E2、E3' },
    { field: '材料类型', type: 'enum', required: false, desc: '例题 / 练习 / 变式 / 探究 / 错因诊断', example: '练习' }
  ];

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var PREVALENCE = { R1: 0.85, R2: 0.85, R3: 1.0, R4: 1.0, R5: 0.85, R6: 0.32, E1: 0.8, E2: 0.95, E3: 0.9, E4: 0.85, G1: 0.7, G2: 0.8, G3: 0.8, G4: 0.35 };

  S.buildDemoRecords = function () {
    var rand = mulberry32(20261105);
    var records = [];
    var seq = 0;
    var days = ['2026-09-22', '2026-09-29', '2026-10-06', '2026-10-13', '2026-10-20', '2026-10-27'];

    S.students.forEach(function (stu, sIdx) {
      var r = mulberry32(1000 + sIdx * 37);
      var offset = {};
      S.kps.forEach(function (kp) { offset[kp.id] = (r() - 0.5) * 0.34; });
      var weakTopic = ['T1', 'T2', 'T3'][sIdx % 3];
      S.kps.forEach(function (kp) {
        if (kp.topicId === weakTopic) offset[kp.id] -= 0.10 + r() * 0.10;
      });

      var baseN = stu.practice === '高' ? 26 + Math.floor(r() * 5) : stu.practice === '中' ? 17 + Math.floor(r() * 5) : 7 + Math.floor(r() * 4);
      var used = {};
      var unansweredP = stu.practice === '低' ? 0.09 : 0.035;

      while (Object.keys(used).length < baseN) {
        var pool = S.materials.filter(function (m) { return !used[m.id]; });
        if (!pool.length) break;
        var weights = pool.map(function (m) { return PREVALENCE[m.kpIds[0]] || 0.5; });
        var sum = weights.reduce(function (a, b) { return a + b; }, 0);
        var pick = r() * sum, idx = 0;
        for (var i = 0; i < pool.length; i++) { pick -= weights[i]; if (pick <= 0) { idx = i; break; } }
        var m = pool[idx];
        used[m.id] = true;

        var kpId = m.kpIds[0];
        var p = stu.ability + offset[kpId] + (m.difficulty === 1 ? 0.06 : m.difficulty === 3 ? -0.13 : 0);
        p = Math.max(0.04, Math.min(0.98, p));

        var result, status = '已评分';
        if (r() < unansweredP) { result = '未作答'; }
        else if (r() < p) { result = '正确'; }
        else { result = '错误'; }
        if (result !== '未作答' && (m.type === '探究' || m.type === '变式') && r() < 0.04) {
          result = '待评分'; status = '未评分';
        }
        seq += 1;
        records.push({
          id: 'R-' + String(seq).padStart(4, '0'),
          studentId: stu.id, materialId: m.id,
          result: result, status: status, attempt: 1,
          submittedAt: days[Math.floor(r() * days.length)] + ' ' + String(9 + Math.floor(r() * 10)).padStart(2, '0') + ':' + String(Math.floor(r() * 60)).padStart(2, '0'),
          source: '模拟数据'
        });
      }
    });

    var anomalies = [];
    function clone(src, patch) {
      var c = {};
      for (var k in src) c[k] = src[k];
      for (var p in patch) c[p] = patch[p];
      return c;
    }
    var n = records.length;
    [0.12, 0.28, 0.41, 0.55, 0.68, 0.83].forEach(function (f) {
      anomalies.push(clone(records[Math.floor(n * f)], {}));
    });
    [0.08, 0.19, 0.34, 0.47, 0.74].forEach(function (f, i) {
      anomalies.push(clone(records[Math.floor(n * f)], { id: 'R-9' + (910 + i), studentId: '' }));
    });
    [0.15, 0.44, 0.87].forEach(function (f, i) {
      anomalies.push(clone(records[Math.floor(n * f)], { id: 'R-9' + (920 + i), materialId: 'MAT-099' }));
    });
    [0.22, 0.63].forEach(function (f, i) {
      anomalies.push(clone(records[Math.floor(n * f)], { id: 'R-9' + (930 + i), studentId: 'S-99' }));
    });
    [0.31, 0.58, 0.79].forEach(function (f, i) {
      anomalies.push(clone(records[Math.floor(n * f)], { id: 'R-9' + (940 + i), result: '未登记', status: '' }));
    });
    [0.05, 0.26, 0.61, 0.92].forEach(function (f, i) {
      anomalies.push(clone(records[Math.floor(n * f)], { id: 'R-9' + (950 + i), submittedAt: '' }));
    });

    var all = records.concat(anomalies);
    for (var i = all.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = all[i]; all[i] = all[j]; all[j] = t;
    }
    return all;
  };
})(window.SLC);
