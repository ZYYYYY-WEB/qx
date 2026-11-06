/* 倾学 · 应用层 */
(function () {
  'use strict';
  var S = window.SLC;
  var STORAGE_KEY = 'slc.dataset.v1';

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pct(v, d) { return S.pct(v, d); }

  var state = {
    students: clone(S.students),
    materials: S.materials,
    records: S.buildDemoRecords(),
    adjustments: [],
    source: 'demo'
  };
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) { saved = null; }
  if (saved && saved.records && saved.students) {
    state.students = saved.students;
    state.records = saved.records;
    state.adjustments = saved.adjustments || [];
    state.source = saved.source || 'imported';
  }

  var version = 1, cache = null, cacheV = -1;
  function model() {
    if (!cache || cacheV !== version) { cache = S.buildModel(state); cacheV = version; }
    return cache;
  }
  function bump() { version++; }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        students: state.students, records: state.records,
        adjustments: state.adjustments, source: state.source, at: new Date().toISOString()
      }));
    } catch (e) { toast('本地保存失败：浏览器存储空间不足'); }
  }

  var ui = {
    view: 'overview', student: 'S-12', diagTab: 'profile',
    topic: 'T1', traceTopic: '全部', cmpA: 'S-12', cmpB: 'S-24',
    search: '', fTopic: '全部', fType: '全部', fDiff: '全部',
    importReport: null, adjustResult: null,
    studentMinutes: 0,
    role: null,
    chatOpen: false,
    chatChips: ['整体学情分析', '需重点关注的学生', 'S-12 的知识点掌握情况', '个性化学习建议', '数据质量情况', '掌握度计算方法'],
    chat: [{ role: 'bot', html: '<p>你好，我是小倾。可查询：指定学生的知识点掌握情况与学习建议、群体共性薄弱点、数据质量、指标计算口径与建议调整方法。</p>' }]
  };

  var VIEWS = {
    overview: ['总览', '学习投入诊断总览'],
    student: ['学生中心', '个人练习记录与学习计划'],
    curriculum: ['课程要求', '学习内容与课程要求'],
    diagnosis: ['学情分析', '个体与群体学情分析'],
    recommend: ['学习建议', '个性化学习建议'],
    trace: ['依据核对', '学习要求 — 已有表现 — 学习建议'],
    import: ['数据管理', '数据导入与字段校验']
  };

  /* ------------------------------ 通用组件 ------------------------------ */
  function chip(level) {
    var L = S.LEVELS[level] || S.LEVELS.none;
    return '<span class="chip chip--' + L.cls + '">' + L.label + '</span>';
  }
  function bar(v) {
    var w = v === null || v === undefined ? 0 : Math.max(0, Math.min(1, v)) * 100;
    return '<span class="bar"><i style="width:' + w.toFixed(1) + '%"></i></span>';
  }
  function heat(v, n) {
    if (!n) return 'background:#f1f5f9;color:#94a3b8';
    if (v < 0.6) return 'background:#fee2e2;color:#991b1b';
    if (v < 0.72) return 'background:#fef3c7;color:#92400e';
    if (v < 0.85) return 'background:#ecfccb;color:#3f6212';
    return 'background:#dcfce7;color:#166534';
  }
  function topicName(id) {
    var t = S.topics.filter(function (x) { return x.id === id; })[0];
    return t ? t.name : id;
  }
  function kpName(id) {
    var k = S.kps.filter(function (x) { return x.id === id; })[0];
    return k ? k.name : id;
  }
  function studentSelect(value, act) {
    var groups = {};
    state.students.forEach(function (s) {
      groups[s.classId] = groups[s.classId] || { name: s.class, list: [] };
      groups[s.classId].list.push(s);
    });
    var html = '<select class="select" data-act="' + act + '">';
    Object.keys(groups).forEach(function (cid) {
      html += '<optgroup label="' + esc(groups[cid].name) + '">';
      groups[cid].list.forEach(function (s) {
        html += '<option value="' + s.id + '"' + (s.id === value ? ' selected' : '') + '>' + s.id + ' · ' + esc(s.name) + '</option>';
      });
      html += '</optgroup>';
    });
    return html + '</select>';
  }
  function topicSelect(value, act) {
    return '<select class="select" data-act="' + act + '">' + S.topics.map(function (t) {
      return '<option value="' + t.id + '"' + (t.id === value ? ' selected' : '') + '>' + t.name + '</option>';
    }).join('') + '</select>';
  }
  function section(title, sub, body, extra) {
    return '<section class="card ' + (extra || '') + '">' +
      '<div class="card__head"><div><h3>' + title + '</h3>' + (sub ? '<p>' + sub + '</p>' : '') + '</div></div>' +
      '<div class="card__body">' + body + '</div></section>';
  }
  function donut(value, label, color) {
    var r = 46, c = 2 * Math.PI * r, v = value === null ? 0 : Math.max(0, Math.min(1, value));
    return '<div class="donut"><svg viewBox="0 0 120 120">' +
      '<circle cx="60" cy="60" r="' + r + '" class="donut__track"/>' +
      '<circle cx="60" cy="60" r="' + r + '" class="donut__val" stroke="' + color + '" stroke-dasharray="' + (c * v).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 60 60)"/>' +
      '</svg><div class="donut__text"><b>' + (value === null ? '—' : pct(value, 0)) + '</b><span>' + label + '</span></div></div>';
  }
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function modal(title, body) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modal').hidden = false;
  }
  function closeModal() { document.getElementById('modal').hidden = true; }
  function download(name, text, mime) {
    var blob = new Blob(['\uFEFF' + text], { type: mime || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 200);
    toast('已导出：' + name);
  }
  function csv(rows) {
    return rows.map(function (r) {
      return r.map(function (v) { return '"' + String(v === undefined || v === null ? '' : v).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\r\n');
  }
  function stamp() {
    var d = new Date();
    return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  }

  /* ------------------------------ 概览 ------------------------------ */
  function renderOverview() {
    var m = model(), o = m.overall;
    var kpi = [
      { k: '学生', v: o.students, n: '分布于 3 个教学班' },
      { k: '练习记录', v: o.records, n: o.usable + ' 条可用于分析' },
      { k: '已评分记录', v: o.graded, n: '用于计算正确率' },
      { k: '平均正确率', v: pct(o.avgRate, 1), n: '先按学生计算再取平均' },
      { k: '知识点覆盖率', v: pct(o.coverage, 1), n: '已有练习记录的知识点占比' },
      { k: '需关注学生', v: o.attention, n: '薄弱知识点较多或练习量偏低' }
    ];
    var hero = '<div class="hero">' +
      '<div class="hero__tag">赛题 10 · 倾学</div>' +
      '<h1>看见每一次学习投入，<br>让学习建议有据可查</h1>' +
      '<p>' + S.meta.scope + '｜内置 ' + S.materials.length + ' 份配套材料、' + o.students + ' 名模拟学生、' + o.records +
      ' 条练习记录。倾学以学生日常练习记录为基础，梳理学习内容与课程要求，分析个体与群体学情，并生成可追溯的个性化学习建议。全部计算在浏览器本地完成，数据不上传。</p>' +
      '<div class="hero__tags"><span>学习投入可视化</span><span>个体与群体分析</span><span>建议可执行</span><span>结论可追溯</span></div></div>';

    var kpis = '<div class="kpi-grid">' + kpi.map(function (x) {
      return '<div class="kpi"><span class="kpi__k">' + x.k + '</span><b class="kpi__v">' + x.v + '</b><span class="kpi__n">' + x.n + '</span></div>';
    }).join('') + '</div>';

    var q = m.quality;
    var qbody = '<div class="quality">' +
      '<div class="quality__donut">' + donut(q.usableRate, '可用记录比例', '#2563eb') + '</div>' +
      '<div class="quality__list">' +
      '<div class="qrow"><span>接收记录</span><b>' + q.total + '</b></div>' +
      '<div class="qrow"><span>剔除记录</span><b>' + q.excluded + '</b></div>' +
      '<div class="qrow"><span>未作答（保留）</span><b>' + o.unanswered + '</b></div>' +
      '<div class="qrow"><span>待评分（保留）</span><b>' + o.pending + '</b></div>' +
      '<p class="tip">记录不足不等于未掌握：证据不足的知识点仅标记为“证据不足”，不判定为薄弱。</p>' +
      '</div></div>';

    var issues = m.commonIssues.slice(0, 5);
    var issueBody = issues.length ? '<div class="issue-list">' + issues.map(function (x) {
      return '<div class="issue"><div class="issue__top"><span class="mono">' + x.id + '</span><b>' + x.name + '</b>' +
        '<span class="sub">' + x.assessed + ' 人有练习记录 · 其中 ' + pct(x.weakShare, 0) + ' 掌握不稳定</span></div>' +
        '<div class="bar-row">' + bar(x.mean) + '<span>' + x.mean.toFixed(2) + '</span></div></div>';
    }).join('') + '</div>' : '<p class="muted">当前数据未发现群体共性薄弱点。</p>';

    var cases = pickCases(m);
    var caseCards = '<div class="case-grid">' + cases.map(function (p) {
      return '<div class="case" data-act="open-student" data-id="' + p.id + '">' +
        '<div class="case__head"><b>' + p.id + '</b><span class="sub">' + p.class + ' · 练习量' + p.practice + '</span></div>' +
        '<div class="case__stat"><span>正确率</span><b>' + pct(p.overall.rate, 0) + '</b></div>' +
        '<div class="case__stat"><span>知识点覆盖</span><b>' + p.coverage.kps + ' / 14</b></div>' +
        '<div class="case__tags">' + chip(p.weaknesses.length ? 'weak' : (p.coverage.ratio < 0.5 ? 'unverified' : 'mastered')) + '</div>' +
        '<span class="link">查看学习建议</span></div>';
    }).join('') + '</div>';

    return hero + kpis +
      '<div class="two-col">' + section('数据质量检查', '清洗规则与保留口径见“学情分析 · 数据质量”', qbody) +
      section('群体共性薄弱点', '以至少 5 人有练习记录的知识点为统计范围，平均掌握度偏低或四成以上学生掌握不稳定', issueBody) + '</div>' +
      section('典型案例对比', '覆盖不同学习表现与记录完整程度，可直接进入学习建议页对比', caseCards) +
      '<div class="notice">' + esc(S.meta.dataNote) + ' 课程要求依据：' + esc(S.meta.courseSource) + '。</div>';
  }
  function pickCases(m) {
    var withData = m.students.filter(function (p) { return p.overall.rate !== null; });
    var sorted = withData.slice().sort(function (a, b) { return a.overall.rate - b.overall.rate; });
    var low = sorted[0], high = sorted[sorted.length - 1];
    var mid = sorted[Math.floor(sorted.length / 2)];
    var out = [low, mid, high].filter(Boolean).filter(function (p, i, a) { return a.indexOf(p) === i; });
    return out;
  }

  /* ------------------------------ 学生中心 ------------------------------ */
  var STUDENT_KEY = 'slc.student.v1';

  function studentProgress() {
    try { return JSON.parse(localStorage.getItem(STUDENT_KEY) || '{}') || {}; } catch (e) { return {}; }
  }

  function toggleStudentDone(sid, mid) {
    var all = studentProgress();
    var done = all[sid] || {};
    var wasDone = !!done[mid];
    if (wasDone) delete done[mid];
    else done[mid] = 1;
    all[sid] = done;
    try { localStorage.setItem(STUDENT_KEY, JSON.stringify(all)); } catch (e) {}
    toast(wasDone ? '已取消完成标记' : '已标记为已完成');
    render();
  }

  function studentPhaseLabel(key) {
    if (key === 'remedial') return '基础巩固';
    if (key === 'consolidate') return '弱项强化';
    if (key === 'extend') return '迁移拓展';
    return '今日任务';
  }

  function studentPlan(rec, minutes) {
    var all = [];
    (rec.diagnostics || []).forEach(function (it) {
      all.push({ item: it, phase: '观察任务' });
    });
    rec.phases.forEach(function (ph) {
      ph.items.forEach(function (it) { all.push({ item: it, phase: studentPhaseLabel(ph.key) }); });
    });
    if (!minutes) {
      return { list: all, total: all.reduce(function (a, x) { return a + x.item.estMin; }, 0), skipped: 0 };
    }
    var list = [], sum = 0, skipped = 0;
    all.forEach(function (x) {
      if (sum + x.item.estMin <= minutes) { list.push(x); sum += x.item.estMin; }
      else skipped++;
    });
    return { list: list, total: sum, skipped: skipped };
  }

  function studentReason(prof, item) {
    var k = prof.kps[item.kpId];
    if (!k) return '该知识点暂无记录，建议先完成两道基础题进行初步观察。';
    if (k.n === 0) return '该知识点暂无练习记录，建议先完成两道基础题进行初步观察。';
    if (k.n < 3) return '该知识点仅有 ' + k.n + ' 条评分记录，需补充练习后再作判断。';
    if (k.level === 'weak') return '该知识点正确率为 ' + S.pct(k.rate, 0) + '，建议先巩固基础步骤。';
    if (k.level === 'consolidate') return '该知识点正确率为 ' + S.pct(k.rate, 0) + '，完成两道同类题可进一步稳定。';
    return '该知识点掌握较稳定，建议通过变式题进行迁移检验。';
  }

  function openPractice(id) {
    var mat = S.materials.filter(function (x) { return x.id === id; })[0];
    if (!mat) return;
    var topic = S.topics.filter(function (t) { return t.id === mat.topicId; })[0];
    modal('练习材料 · ' + mat.title,
      '<div class="material-head"><span class="tag tag--line">' + esc(mat.type) + '</span>' +
      '<span class="tag">' + esc(topic ? topic.name : mat.topicId) + '</span>' +
      '<span class="tag">' + mat.kpIds.join('、') + '</span>' +
      '<span class="sub">约 ' + mat.estMin + ' 分钟 · 难度 ' + '★★★'.slice(0, mat.difficulty) + '</span></div>' +
      '<p class="material-stem">' + esc(mat.stem) + '</p>' +
      '<p class="practice-hint">请先独立完成，再核对参考答案。</p>' +
      '<button class="btn btn--primary" data-act="reveal-answer">查看参考答案</button>' +
      '<div class="practice-answer" id="practiceAnswer" hidden><p class="material-answer"><b>参考答案：</b>' + esc(mat.answer) + '</p>' +
      '<p class="sub">题目来源：' + esc(mat.source) + '</p></div>' +
      '<div class="practice-check" id="practiceCheck" hidden><p class="practice-check__q">请对照参考答案进行自评。</p>' +
      '<div class="practice-check__btns">' +
      '<button class="btn btn--ok" data-act="self-report" data-id="' + mat.id + '" data-result="正确">正确</button>' +
      '<button class="btn btn--bad" data-act="self-report" data-id="' + mat.id + '" data-result="错误">错误</button>' +
      '<button class="btn btn--ghost" data-act="self-report" data-id="' + mat.id + '" data-result="">不确定</button>' +
      '</div><p class="sub">提交后将更新练习记录与今日计划，并标注来源为“学生自评”。</p></div>');
  }

  function reportPractice(mid, result) {
    closeModal();
    if (!result) {
      toast('本次练习已保留，可稍后再次完成');
      return;
    }
    var sid = ui.student;
    var attempt = 1;
    state.records.forEach(function (r) {
      if (r.studentId === sid && r.materialId === mid) attempt = Math.max(attempt, (r.attempt || 1) + 1);
    });
    var d = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var at = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    state.records.push({
      id: 'SR-' + d.getTime() + '-' + Math.random().toString(16).slice(2, 6),
      studentId: sid, materialId: mid, result: result, status: '已评分',
      attempt: attempt, submittedAt: at, source: '学生自评', note: '做完后自己对照答案'
    });
    var all = studentProgress();
    var done = all[sid] || {};
    done[mid] = 1;
    all[sid] = done;
    try { localStorage.setItem(STUDENT_KEY, JSON.stringify(all)); } catch (e) {}
    bump(); save();
    toast(result === '正确' ? '已记录为正确，学习计划已更新' : '已记录为错误，学习计划已调整');
    render();
  }

  function renderStudent() {
    var m = model();
    var p = m.byId[ui.student];
    var rec = S.recommend(m, ui.student);
    var done = studentProgress()[ui.student] || {};
    var plan = studentPlan(rec, ui.studentMinutes);
    var doneCount = plan.list.filter(function (x) { return done[x.item.materialId]; }).length;

    var need = [], cons = [], unsure = [];
    Object.keys(p.kps).forEach(function (k) {
      var x = p.kps[k];
      if (x.tentative || x.n === 0 || x.level === 'unverified' || x.level === 'none') { unsure.push(x); return; }
      if (x.level === 'weak') need.push(x);
      else if (x.level === 'consolidate') cons.push(x);
    });

    function stateCard(cls, title, n, names, tip) {
      return '<div class="student-state student-state--' + cls + '"><span class="student-state__k">' + title + '</span><b>' + n +
        ' 个</b><p>' + (names.length ? esc(names.slice(0, 4).join('、')) : tip) + '</p></div>';
    }

    var kpi = [
      { k: '练习记录', v: p.overall.total, n: '含未作答与待评分' },
      { k: '已评分', v: p.overall.graded, n: '用于判断掌握情况' },
      { k: '正确率', v: p.overall.rate === null ? '—' : S.pct(p.overall.rate, 0), n: '仅统计已评分记录' },
      { k: '知识点覆盖', v: p.coverage.kps + ' / ' + S.kps.length, n: '共 ' + S.kps.length + ' 个知识点' },
      { k: '练习量', v: p.practice, n: '按题量分为高 / 中 / 低' },
      { k: '今日完成', v: doneCount + '/' + plan.list.length, n: '完成标记仅存于本设备' }
    ];

    var timeChips = [0, 15, 25, 40].map(function (v) {
      return '<button class="time-chip' + (ui.studentMinutes === v ? ' is-active' : '') + '" data-act="student-time" data-min="' + v + '">' +
        (v ? v + ' 分钟' : '不限时长') + '</button>';
    }).join('');

    var hero = '<div class="student-hero"><div class="student-hero__main">' +
      '<span class="student-hero__tag">学生中心 · 个人学习概览</span>' +
      '<h2>你好，' + esc(p.name || p.id) + '</h2>' +
      '<p>此处汇总你的练习记录与今日学习计划。请按优先级完成，完成后核对参考答案。</p>' +
      '<div class="student-hero__chips">' +
      '<button data-act="student-chat" data-q="我的薄弱点">查询：薄弱知识点</button>' +
      '<button data-act="student-chat" data-q="我今天该练什么？">查询：今日学习任务</button>' +
      '<button data-act="student-chat" data-q="我的投入情况">查询：学习投入情况</button></div></div>' +
      '<div class="student-hero__side"><label>选择学生编号（演示）</label>' + studentSelect(ui.student, 'student-me') +
      '<label>今日可用学习时长</label><div class="time-chips">' + timeChips + '</div></div></div>';

    var kpiHtml = '<div class="kpi-grid">' + kpi.map(function (x) {
      return '<div class="kpi"><span class="kpi__k">' + x.k + '</span><b class="kpi__v">' + x.v + '</b><span class="kpi__n">' + x.n + '</span></div>';
    }).join('') + '</div>';

    var states = '<div class="student-states">' +
      stateCard('weak', '待巩固知识点', need.length, need.map(function (x) { return x.name; }), '暂无待巩固知识点') +
      stateCard('cons', '需强化知识点', cons.length, cons.map(function (x) { return x.name; }), '暂无需强化知识点') +
      stateCard('unsure', '证据不足知识点', unsure.length, [], '评分记录少于 3 条，暂不判定') +
      '</div>';

    var cards = plan.list.map(function (x) {
      var it = x.item;
      var isDone = !!done[it.materialId];
      return '<article class="study-card' + (isDone ? ' is-done' : '') + '">' +
        '<div class="study-card__top"><span class="study-card__phase">' + esc(x.phase) + '</span>' +
        '<span class="study-card__min">约 ' + it.estMin + ' 分钟</span></div>' +
        '<h4>' + esc(it.title) + '</h4>' +
        '<p class="study-card__why">' + esc(studentReason(p, it)) + '</p>' +
        '<div class="study-card__meta"><span>' + esc(it.kpName) + '</span><span>' + esc(it.type) + '</span><span>' + it.materialId + '</span></div>' +
        '<div class="study-card__actions">' +
        '<button class="btn btn--primary" data-act="start-practice" data-id="' + it.materialId + '">' + (isDone ? '再做一次' : '开始练习') + '</button>' +
        '<button class="btn btn--ghost" data-act="mark-done" data-sid="' + ui.student + '" data-id="' + it.materialId + '">' + (isDone ? '取消完成' : '标记完成') + '</button>' +
        '</div></article>';
    }).join('');

    var progressHtml = plan.list.length ? '<div class="study-progress"><span class="study-progress__num"><b>' + doneCount + '</b>/' +
      plan.list.length + ' 项已完成</span><span class="bar"><i style="width:' + Math.round(doneCount / plan.list.length * 100) + '%"></i></span></div>' : '';

    var planBody;
    if (cards) {
      planBody = progressHtml + '<div class="study-grid">' + cards + '</div>';
    } else if (ui.studentMinutes && plan.skipped) {
      planBody = '<div class="notice">当前时长不足以完成全部任务。可切换“不限时长”查看完整计划，或将可用时长调整为 25 分钟。</div>';
    } else {
      planBody = '<div class="notice">暂无新增任务。可从“证据不足”的知识点中选择一项，完成两道基础练习以补充证据。</div>';
    }

    return hero + kpiHtml +
      section('当前学习状况', '仅统计个人练习记录；证据不足的知识点暂不判定', states) +
      section('今日学习任务', '按基础巩固、弱项强化、迁移拓展的顺序排列；时间有限时优先完成靠前任务', planBody) +
      '<div class="student-note">完成标记仅保存在本设备，不影响教师端数据；更换设备后需重新标记。</div>';
  }

  function renderCurriculum() {
    var t = S.topics.filter(function (x) { return x.id === ui.topic; })[0];
    var kps = S.kps.filter(function (k) { return k.topicId === ui.topic; });
    var reqs = S.requirements.filter(function (r) { return r.topicId === ui.topic; });
    var tabs = '<div class="tabs">' + S.topics.map(function (x) {
      return '<button class="tab' + (x.id === ui.topic ? ' is-active' : '') + '" data-act="topic" data-topic="' + x.id + '">' +
        '<b>' + x.name + '</b><span>' + x.short + '</span></button>';
    }).join('') + '</div>';

    var intro = '<div class="topic-intro" style="border-color:' + t.color + '22;background:' + t.tint + '">' +
      '<div class="topic-intro__main"><span class="mono">' + t.id + '</span><h2>' + t.name + '</h2><p>' + t.intro + '</p>' +
      '<div class="pill-row">' + t.ideas.map(function (i) { return '<span class="pill">' + i + '</span>'; }).join('') + '</div></div>' +
      '<div class="topic-intro__side"><div class="mini"><span>知识点</span><b>' + kps.length + '</b></div>' +
      '<div class="mini"><span>课程要求</span><b>' + reqs.length + '</b></div>' +
      '<div class="mini"><span>配套材料</span><b>' + S.materials.filter(function (m) { return m.topicId === ui.topic; }).length + '</b></div>' +
      '<div class="mini"><span>学习重点</span><b class="small">' + t.focus + '</b></div></div></div>';

    var reqCards = reqs.map(function (r) {
      var mats = S.materials.filter(function (m) { return m.kpIds.some(function (k) { return r.kpIds.indexOf(k) >= 0; }); });
      return '<article class="req-card"><div class="req-card__top">' +
        '<span class="req-card__id">' + r.id + '</span>' +
        '<span class="level level--' + r.level + '">' + r.level + '</span>' +
        '<button class="req-card__mats" data-act="show-req-materials" data-req="' + r.id + '">' + mats.length + ' 份材料</button></div>' +
        '<p class="req-card__text">' + esc(r.text) + '</p>' +
        '<div class="req-card__kps">' + r.kpIds.map(function (k) { return '<span class="tag">' + k + ' ' + kpName(k) + '</span>'; }).join('') + '</div>' +
        '<div class="req-card__foot"><span>' + esc(r.source) + '</span><span>' + esc(r.locator) + '</span></div>' +
        (r.note ? '<p class="req-card__note">' + esc(r.note) + '</p>' : '') + '</article>';
    }).join('');
    var reqTable = '<div class="req-grid">' + reqCards + '</div>';

    var links = S.links.filter(function (l) {
      var a = S.kps.filter(function (k) { return k.id === l.from; })[0];
      var b = S.kps.filter(function (k) { return k.id === l.to; })[0];
      return a && b && (a.topicId === ui.topic || b.topicId === ui.topic);
    });
    var linkRows = links.map(function (l) {
      return '<tr><td class="mono">' + l.from + ' → ' + l.to + '</td><td>' + kpName(l.from) + ' → ' + kpName(l.to) + '</td>' +
        '<td><span class="tag tag--' + (l.type === '前置支撑' ? 'solid' : 'line') + '">' + l.type + '</span></td><td>' + esc(l.note) + '</td></tr>';
    }).join('');

    return tabs + intro +
      section('学习内容与要求清单', '每条要求均可回溯到课标表述、教材章节与配套材料编号', reqTable) +
      section('必要联系与学习进阶', '前置支撑关系决定建议的先后顺序', '<div class="cmap-wrap">' + conceptMap(ui.topic) + '</div>' +
        '<div class="table-wrap"><table class="table table--compact"><thead><tr><th>关系</th><th>知识点</th><th>类型</th><th>说明</th></tr></thead><tbody>' + linkRows + '</tbody></table></div>') +
      section('配套材料库', '共 ' + S.materials.length + ' 份材料，可按主题、类型、难度与关键词筛选', renderMaterialFilters() + '<div id="matTable"></div>');
  }

  function renderMaterialFilters() {
    var types = ['全部', '例题', '练习', '变式', '探究', '错因诊断'];
    var diffs = [['全部', '全部难度'], ['1', '难度 1'], ['2', '难度 2'], ['3', '难度 3']];
    return '<div class="filters">' +
      '<select class="select select--sm" data-act="f-topic"><option value="全部">全部主题</option>' +
      S.topics.map(function (t) { return '<option value="' + t.id + '"' + (ui.fTopic === t.id ? ' selected' : '') + '>' + t.name + '</option>'; }).join('') + '</select>' +
      '<select class="select select--sm" data-act="f-type">' + types.map(function (x) {
        return '<option value="' + x + '"' + (ui.fType === x ? ' selected' : '') + '>' + x + '</option>';
      }).join('') + '</select>' +
      '<select class="select select--sm" data-act="f-diff">' + diffs.map(function (x) {
        return '<option value="' + x[0] + '"' + (ui.fDiff === x[0] ? ' selected' : '') + '>' + x[1] + '</option>';
      }).join('') + '</select>' +
      '<input class="input" id="matSearch" placeholder="搜索材料编号、标题、题干…" value="' + esc(ui.search) + '">' +
      '<span class="sub" id="matCount"></span></div>';
  }

  function renderMaterialTable() {
    var m = model();
    var usage = {};
    m.records.forEach(function (r) { usage[r.materialId] = (usage[r.materialId] || 0) + 1; });
    var list = S.materials.filter(function (mat) {
      if (ui.fTopic !== '全部' && mat.topicId !== ui.fTopic) return false;
      if (ui.fType !== '全部' && mat.type !== ui.fType) return false;
      if (ui.fDiff !== '全部' && String(mat.difficulty) !== ui.fDiff) return false;
      if (ui.search) {
        var q = ui.search.toLowerCase();
        if ((mat.id + mat.title + mat.stem + mat.answer + mat.kpIds.join('')).toLowerCase().indexOf(q) < 0) return false;
      }
      return true;
    });
    var rows = list.map(function (mat) {
      return '<tr><td class="mono">' + mat.id + '</td><td><b>' + esc(mat.title) + '</b><div class="sub">' + esc(mat.stem.slice(0, 42)) + (mat.stem.length > 42 ? '…' : '') + '</div></td>' +
        '<td>' + topicName(mat.topicId) + '</td><td>' + mat.kpIds.map(function (k) { return '<span class="tag">' + k + '</span>'; }).join('') + '</td>' +
        '<td><span class="tag tag--line">' + mat.type + '</span></td><td class="num">' + '★'.repeat(mat.difficulty) + '</td>' +
        '<td class="num">' + (usage[mat.id] || 0) + '</td>' +
        '<td><button class="link" data-act="show-material" data-id="' + mat.id + '">详情</button></td></tr>';
    }).join('');
    var el = document.getElementById('matTable');
    if (el) el.innerHTML = '<div class="table-wrap table--tall"><table class="table table--compact"><thead><tr><th>编号</th><th>材料</th><th>主题</th><th>知识点</th><th>类型</th><th>难度</th><th>使用</th><th></th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="8" class="empty">没有符合条件的材料</td></tr>') + '</tbody></table></div>';
    var c = document.getElementById('matCount');
    if (c) c.textContent = '共 ' + list.length + ' 份';
  }

  function conceptMap(topicId) {
    var nodes = S.kps.filter(function (k) { return k.topicId === topicId; });
    var ext = [];
    nodes.forEach(function (n) {
      n.prerequisites.forEach(function (p) {
        var pk = S.kps.filter(function (x) { return x.id === p; })[0];
        if (pk && pk.topicId !== topicId && !ext.some(function (e) { return e.id === p; })) ext.push(pk);
      });
    });
    var all = ext.concat(nodes);
    var nw = 128, gap = 22, W = 20 + all.length * (nw + gap), H = 150;
    var pos = {};
    all.forEach(function (n, i) { pos[n.id] = { x: 10 + i * (nw + gap), y: 48, w: nw, h: 56 }; });
    var paths = '';
    all.forEach(function (n) {
      n.prerequisites.forEach(function (p) {
        if (!pos[p]) return;
        var a = pos[p], b = pos[n.id];
        var x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
        paths += '<path class="cmap__edge" d="M' + x1 + ' ' + y1 + ' C' + (x1 + 16) + ' ' + y1 + ', ' + (x2 - 16) + ' ' + y2 + ', ' + x2 + ' ' + y2 + '" marker-end="url(#arrow-' + topicId + ')"/>';
      });
    });
    var boxes = all.map(function (n) {
      var t = S.topics.filter(function (x) { return x.id === n.topicId; })[0];
      var p = pos[n.id], external = n.topicId !== topicId;
      return '<g><rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="10" fill="#fff" stroke="' + t.color + '" stroke-width="1.4"' + (external ? ' stroke-dasharray="4 3"' : '') + '/>' +
        '<text x="' + (p.x + 10) + '" y="' + (p.y + 20) + '" class="cmap__id" fill="' + t.color + '">' + n.id + (external ? ' · 跨主题' : '') + '</text>' +
        '<text x="' + (p.x + 10) + '" y="' + (p.y + 40) + '" class="cmap__name">' + esc(n.name.length > 9 ? n.name.slice(0, 9) + '…' : n.name) + '</text></g>';
    }).join('');
    return '<svg class="cmap" viewBox="0 0 ' + W + ' ' + H + '" style="min-width:' + W + 'px">' +
      '<defs><marker id="arrow-' + topicId + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">' +
      '<path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>' + paths + boxes + '</svg>';
  }

  /* ------------------------------ 学情诊断 ------------------------------ */
  function renderDiagnosis() {
    var m = model(), p = m.byId[ui.student] || m.students[0];
    var tabs = '<div class="subnav">' + [['profile', '个体画像'], ['group', '群体分析'], ['quality', '数据质量']].map(function (x) {
      return '<button class="subnav__item' + (ui.diagTab === x[0] ? ' is-active' : '') + '" data-act="diag-tab" data-tab="' + x[0] + '">' + x[1] + '</button>';
    }).join('') + '</div>';
    var selector = '<div class="control-bar">' + studentSelect(p.id, 'diag-student') +
      '<span class="tag tag--line">' + p.class + '</span><span class="tag tag--line">练习量 ' + p.practice + '</span>' +
      '<span class="tag tag--line">已评分 ' + p.overall.graded + ' 条</span>' +
      '<span class="grow"></span><button class="link" data-act="export-csv-profile">导出全部画像 CSV</button></div>';
    if (ui.diagTab === 'profile') return selector + tabs + profileView(m, p);
    if (ui.diagTab === 'group') return selector + tabs + groupView(m);
    return selector + tabs + qualityView(m, p);
  }

  function profileView(m, p) {
    var rec = S.recommend(m, p.id);
    var topicCards = '<div class="topic-cards">' + p.topicStats.map(function (t) {
      return '<div class="topic-card" style="border-top-color:' + t.color + '">' +
        '<div class="topic-card__head"><b>' + t.name + '</b><span class="sub">' + t.covered + '/' + t.total + ' 个知识点有证据</span></div>' +
        '<div class="topic-card__rate">' + (t.mastery === null ? '—' : t.mastery.toFixed(2)) + '</div>' +
        '<div class="bar-row">' + bar(t.mastery) + '</div>' +
        '<div class="topic-card__foot"><span>正确率 ' + pct(t.rate, 0) + '</span><span>已评分 ' + t.n + '</span></div></div>';
    }).join('') + '</div>';

    var rows = S.kps.map(function (kp) {
      var k = p.kps[kp.id];
      return '<tr><td><span class="tag">' + kp.topicId + '</span></td><td><b>' + kp.name + '</b><div class="sub">' + esc(kp.desc) + '</div></td>' +
        '<td class="num">' + k.n + '</td><td class="num">' + pct(k.rate, 0) + '</td>' +
        '<td class="num bar-cell">' + bar(k.mastery) + '<span>' + k.mastery.toFixed(2) + '</span></td>' +
        '<td>' + chip(k.level) + (k.tentative ? '<div class="sub">初判 ' + S.LEVELS[k.tentative].label + '</div>' : '') + '</td>' +
        '<td class="sub">' + k.coverage + '</td>' +
        '<td><button class="link" data-act="show-evidence" data-student="' + p.id + '" data-kp="' + kp.id + '">' + k.recordIds.length + ' 条</button></td></tr>';
    }).join('');

    var strengths = '<div class="insight insight--ok"><h4>相对优势</h4>' +
      (p.strengths.length ? p.strengths.slice(0, 4).map(function (k) { return '<div class="insight__row"><span>' + k.name + '</span><b>' + k.mastery.toFixed(2) + '</b></div>'; }).join('') : '<p class="muted">暂无达到掌握线的知识点。</p>') + '</div>';
    var weaks = '<div class="insight insight--bad"><h4>需要巩固</h4>' +
      (p.weaknesses.length ? p.weaknesses.slice(0, 4).map(function (k) { return '<div class="insight__row"><span>' + k.name + '</span><b>' + k.mastery.toFixed(2) + '</b></div>'; }).join('') : '<p class="muted">暂未发现稳定证据支持的薄弱点。</p>') + '</div>';
    var gaps = '<div class="insight insight--grey"><h4>证据不足</h4>' +
      (p.unverified.length ? p.unverified.slice(0, 4).map(function (k) { return '<div class="insight__row"><span>' + k.name + '</span><b>' + k.n + ' 条</b></div>'; }).join('') : '<p class="muted">知识点证据覆盖充分。</p>') + '</div>';

    var head = '<div class="profile-head">' +
      '<div class="profile-head__main"><div class="profile-head__id">' + p.id + '</div><div><h2>' + p.name + '</h2><p class="sub">' + p.class + ' · 练习量' + p.practice + ' · 共 ' + p.overall.total + ' 条记录</p></div></div>' +
      '<div class="profile-head__stats">' +
      '<div class="stat"><span>整体正确率</span><b>' + pct(p.overall.rate, 0) + '</b></div>' +
      '<div class="stat"><span>已评分</span><b>' + p.overall.graded + '</b></div>' +
      '<div class="stat"><span>知识点覆盖</span><b>' + p.coverage.kps + '/14</b></div>' +
      '<div class="stat"><span>未作答</span><b>' + p.overall.unanswered + '</b></div>' +
      '</div></div>';
    var narrative = '<div class="narrative"><b>个体学情摘要</b><p>' + esc(rec.summary) + '</p></div>';

    return head + narrative + topicCards + section('知识点掌握明细', '掌握度 = 收缩估计，评分记录少于 3 条标记为“证据不足”', '<div class="table-wrap table--tall"><table class="table table--compact"><thead><tr><th>主题</th><th>知识点</th><th>已评分</th><th>正确率</th><th>掌握度</th><th>结论</th><th>覆盖</th><th>证据</th></tr></thead><tbody>' + rows + '</tbody></table></div>') +
      '<div class="insight-grid">' + strengths + weaks + gaps + '</div>';
  }

  function groupView(m) {
    var classCards = '<div class="class-grid">' + m.classes.map(function (c) {
      return '<div class="class-card"><div class="class-card__head"><b>' + c.name + '</b><span class="sub">' + c.n + ' 名学生</span></div>' +
        '<div class="class-card__main">' + donut(c.avgRate, '平均正确率', '#2563eb') + '</div>' +
        '<div class="qrow"><span>知识点覆盖</span><b>' + pct(c.coverage, 0) + '</b></div></div>';
    }).join('') + '</div>';

    var heatRows = m.students.slice().sort(function (a, b) {
      return a.classId.localeCompare(b.classId) || (b.overall.rate || 0) - (a.overall.rate || 0);
    }).map(function (p) {
      return '<tr><td class="mono">' + p.id + '</td><td class="sub">' + p.class.replace('七年级', '') + '</td>' +
        S.kps.map(function (kp) {
          var k = p.kps[kp.id];
          return '<td class="heat" style="' + heat(k.mastery, k.n) + '" title="' + kp.name + '：掌握度 ' + (k.n ? k.mastery.toFixed(2) : '无记录') + '，已评分 ' + k.n + ' 条">' + (k.n ? k.mastery.toFixed(2).slice(1) : '—') + '</td>';
        }).join('') + '<td class="num">' + pct(p.overall.rate, 0) + '</td></tr>';
    }).join('');
    var heatTable = '<div class="table-wrap table--tall"><table class="table table--heat"><thead><tr><th>学生</th><th>班</th>' +
      S.kps.map(function (k) { return '<th title="' + k.name + '">' + k.id + '</th>'; }).join('') + '<th>正确率</th></tr></thead><tbody>' + heatRows + '</tbody></table></div>' +
      '<p class="tip">单元格为掌握度（显示值去掉前导 0）；灰色 = 无已评分记录，不据此判定未掌握。知识点编码：' +
      S.kps.map(function (k) { return k.id + ' ' + k.name; }).join('；') + '。</p>';

    var classRows = S.kps.map(function (kp) {
      return '<tr><td class="mono">' + kp.id + '</td><td>' + kp.name + '</td>' + m.classes.map(function (c) {
        var v = c.kps[kp.id].mean;
        return '<td class="num" style="' + heat(v, v !== null ? 1 : 0) + '">' + (v === null ? '—' : v.toFixed(2)) + '</td>';
      }).join('') + '<td class="num">' + (function () {
        var vs = m.classes.map(function (c) { return c.kps[kp.id].mean; }).filter(function (v) { return v !== null; });
        return vs.length >= 2 ? (Math.max.apply(null, vs) - Math.min.apply(null, vs)).toFixed(2) : '—';
      })() + '</td></tr>';
    }).join('');
    var classTable = '<div class="table-wrap"><table class="table table--compact"><thead><tr><th>编码</th><th>知识点</th>' +
      m.classes.map(function (c) { return '<th>' + c.name + '</th>'; }).join('') + '<th>极差</th></tr></thead><tbody>' + classRows + '</tbody></table></div>';

    var common = m.commonIssues.length ? '<ul class="plain">' + m.commonIssues.slice(0, 6).map(function (x) {
      return '<li><b>' + x.name + '</b>（' + x.id + '）：平均掌握度 ' + x.mean.toFixed(2) + '，' + x.assessed + ' 人已评估，其中 ' + x.weakCount + ' 人处于薄弱区。</li>';
    }).join('') + '</ul>' : '<p class="muted">未检出满足阈值的共性问题。</p>';
    var gaps = m.evidenceGaps.length ? '<ul class="plain">' + m.evidenceGaps.map(function (x) {
      return '<li><b>' + x.name + '</b>：仅 ' + x.assessed + '/' + m.students.length + ' 人有评分记录（共 ' + x.totalN + ' 条），暂不形成群体结论，建议补充诊断性任务。</li>';
    }).join('') + '</ul>' : '<p class="muted">知识点证据覆盖充分。</p>';
    var diffs = m.differences.length ? '<ul class="plain">' + m.differences.map(function (x) {
      return '<li><b>' + x.name + '</b>：班级间平均掌握度极差 ' + x.spread.toFixed(2) + '（' + x.detail + '）。</li>';
    }).join('') + '</ul>' : '<p class="muted">班级间未出现 ≥0.10 的掌握度差异。</p>';

    var practice = '<div class="practice">' + m.practiceGroups.map(function (g) {
      return '<div class="practice__row"><span class="tag">练习量 ' + g.level + '</span><span class="sub">' + g.n + ' 人</span><div class="bar-row">' + bar(g.mean) + '</div><b>' + pct(g.mean, 0) + '</b></div>';
    }).join('') + '</div><p class="tip">该比较为群体层面的关联观察，不作为“练习量导致成绩”的因果结论。</p>';

    return classCards +
      section('学生 × 知识点 掌握度热力图', '用于快速定位班内差异与证据空白', heatTable) +
      section('班级 × 知识点 平均掌握度', '仅统计各有评分记录的学生；末列为班级间极差', classTable) +
      '<div class="two-col">' + section('共性问题', '已评估 ≥5 人且平均掌握度 <0.62 或薄弱占比 ≥40%', common) +
      section('证据缺口', '有评分记录学生 <60% 或总评分 <10 条的知识点', gaps) + '</div>' +
      '<div class="two-col">' + section('值得关注的差异', '班级间极差 ≥0.10', diffs) +
      section('练习量与正确率（关联观察）', '描述性统计，不推断因果', practice) + '</div>';
  }

  function qualityView(m, p) {
    var q = m.quality;
    var summary = '<div class="quality">' +
      '<div class="quality__donut">' + donut(q.usableRate, '记录可用率', '#2563eb') + '</div>' +
      '<div class="quality__list">' +
      '<div class="qrow"><span>输入记录总数</span><b>' + q.total + '</b></div>' +
      '<div class="qrow"><span>可用记录数</span><b>' + q.usable + '</b></div>' +
      '<div class="qrow"><span>剔除记录数</span><b>' + q.excluded + '</b></div>' +
      '<div class="qrow"><span>已评分 / 未作答 / 待评分</span><b>' + m.overall.graded + ' / ' + m.overall.unanswered + ' / ' + m.overall.pending + '</b></div>' +
      '<div class="qrow"><span>记录来源</span><b>' + Object.keys(q.bySource).filter(function (k) { return q.bySource[k]; }).map(function (k) { return k + ' ' + q.bySource[k]; }).join(' · ') + '</b></div>' +
      '</div></div>';
    var ruleRows = q.rules.map(function (r) {
      return '<tr><td>' + r.name + '</td><td class="num">' + r.count + '</td><td>' + r.handling + '</td></tr>';
    }).join('');
    var adjRows = state.adjustments.length ? state.adjustments.map(function (a, i) {
      return '<tr><td class="mono">ADJ-' + String(i + 1).padStart(3, '0') + '</td><td>' + a.studentId + '</td><td class="mono">' + a.materialId + '</td>' +
        '<td>' + chip(a.result === '正确' ? 'mastered' : a.result === '错误' ? 'weak' : 'unverified') + '</td><td class="sub">' + esc(a.note || '—') + '</td><td class="sub">' + esc(a.at) + '</td></tr>';
    }).join('') : '<tr><td colspan="6" class="empty">暂无教师补充记录。可在“学习建议”页添加，用于展示建议的调整过程。</td></tr>';

    return section('数据质量报告', '所有清洗动作可复现，原始记录不被修改，仅在本页生成分析用数据集', summary) +
      section('清洗规则与处理方式', '按“完整性 → 关联性 → 重复性 → 取值规范性”顺序执行', '<div class="table-wrap"><table class="table table--compact"><thead><tr><th>检查项</th><th>命中条数</th><th>处理方式</th></tr></thead><tbody>' + ruleRows + '</tbody></table></div>') +
      section('教师补充记录', '用于展示“补充记录 → 重新诊断 → 建议调整”的闭环', '<div class="table-wrap"><table class="table table--compact"><thead><tr><th>编号</th><th>学生</th><th>材料</th><th>结果</th><th>备注</th><th>时间</th></tr></thead><tbody>' + adjRows + '</tbody></table></div>') +
      section('该生记录清单（前 20 条）', '逐条可核对，包含被标记“时间缺失”的记录', studentRecordsTable(m, p));
  }

  function studentRecordsTable(m, p) {
    var list = p.records.slice(0, 20);
    if (!list.length) return '<p class="empty">该生暂无记录。</p>';
    return '<div class="table-wrap"><table class="table table--compact"><thead><tr><th>记录编号</th><th>材料</th><th>知识点</th><th>作答结果</th><th>时间</th><th>来源</th></tr></thead><tbody>' +
      list.map(function (r) {
        var mat = m.materials[r.materialId];
        return '<tr><td class="mono">' + r.id + '</td><td class="mono">' + r.materialId + '</td><td>' + (mat ? mat.kpIds.join('、') : '—') + '</td>' +
          '<td>' + chip(r.result === '正确' ? 'mastered' : r.result === '错误' ? 'weak' : 'unverified') + ' <span class="sub">' + r.result + '</span></td>' +
          '<td class="sub">' + (r.submittedAt || '时间缺失') + '</td><td class="sub">' + r.source + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ------------------------------ 个性化建议 ------------------------------ */
  function renderRecommend() {
    var m = model(), p = m.byId[ui.student] || m.students[0];
    var rec = S.recommend(m, p.id);
    var head = '<div class="control-bar">' + studentSelect(p.id, 'rec-student') +
      '<span class="tag tag--line">' + p.class + '</span>' +
      '<span class="tag tag--line">正确率 ' + pct(p.overall.rate, 0) + '</span>' +
      '<span class="tag tag--line">知识点覆盖 ' + p.coverage.kps + '/14</span>' +
      '<span class="grow"></span>' +
      '<button class="btn btn--ghost btn--sm" data-act="export-rec">导出建议 JSON</button>' +
      '<button class="btn btn--ghost btn--sm" data-act="export-csv-profile">导出画像 CSV</button></div>';

    var summary = '<div class="rec-summary"><div class="rec-summary__main"><h3>' + p.name + ' 的个性化学习建议</h3><p>' + esc(rec.summary) + '</p></div>' +
      '<div class="rec-summary__stats">' +
      '<div class="stat"><span>任务数</span><b>' + rec.stats.items + '</b></div>' +
      '<div class="stat"><span>预计用时</span><b>' + rec.totalMin + '′</b></div>' +
      '<div class="stat"><span>薄弱点</span><b>' + rec.weak.length + '</b></div>' +
      '<div class="stat"><span>证据不足</span><b>' + rec.diagnostics.length + '</b></div>' +
      '</div></div>';

    var phases = rec.phases.map(function (ph, i) {
      return '<div class="phase"><div class="phase__head"><span class="phase__num">' + (i + 1) + '</span>' +
        '<div><h3>' + ph.title + '</h3><p>' + ph.goal + '</p></div>' +
        '<span class="sub">' + ph.items.reduce(function (a, it) { return a + it.estMin; }, 0) + ' 分钟</span></div>' +
        '<div class="task-list">' + ph.items.map(function (it, j) { return taskCard(it, j, p.id); }).join('') + '</div></div>';
    }).join('');

    var diag = rec.diagnostics.length ? '<div class="phase phase--grey"><div class="phase__head"><span class="phase__num">＋</span>' +
      '<div><h3>补充观察任务</h3><p>以下知识点评分记录不足 3 条，暂不判定为未掌握。先补充证据，再根据结果调整建议。</p></div></div>' +
      '<div class="task-list">' + rec.diagnostics.map(function (it, j) { return taskCard(it, j, p.id); }).join('') + '</div></div>' : '';

    var notes = '<ul class="plain notes">' + rec.teacherNotes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>';

    var adjForm = '<div class="adjust"><div class="adjust__form">' +
      '<label>材料<select class="select select--sm" id="adjMaterial">' +
      S.materials.map(function (mat) { return '<option value="' + mat.id + '">' + mat.id + ' · ' + esc(mat.title) + '（' + mat.type + '）</option>'; }).join('') + '</select></label>' +
      '<label>结果<select class="select select--sm" id="adjResult"><option value="正确">正确</option><option value="错误">错误</option><option value="未作答">未作答</option><option value="待评分">待评分</option></select></label>' +
      '<label class="grow">观察备注<input class="input" id="adjNote" placeholder="如：符号仍出错，需回顾绝对值相关知识点"></label>' +
      '<button class="btn btn--primary btn--sm" data-act="apply-adjust">记录并重算</button></div>' +
      '<p class="tip">补充记录将以“补充记录”来源写入当前数据集，并立即重算掌握度与学习建议；可撤销最近一次操作。</p>' +
      (state.adjustments.length ? '<button class="link link--danger" data-act="undo-adjust">撤销最近一次补充记录</button>' : '') + '</div>';

    var adjDiff = '';
    if (ui.adjustResult) {
      var d = ui.adjustResult.diff;
      adjDiff = '<div class="diff"><h4>调整前后对比</h4>' +
        '<div class="diff__chips"><span>新增任务 ' + d.added.length + '</span><span>移除任务 ' + d.removed.length + '</span><span>保留 ' + d.kept + '</span></div>' +
        (d.changes.length ? '<div class="table-wrap"><table class="table table--compact"><thead><tr><th>知识点</th><th>调整前</th><th>调整后</th><th>变化</th><th>结论</th></tr></thead><tbody>' +
          d.changes.map(function (c) {
            return '<tr><td>' + c.name + '</td><td class="num">' + c.before.toFixed(2) + '（' + c.beforeN + ' 条）</td>' +
              '<td class="num">' + c.after.toFixed(2) + '（' + c.afterN + ' 条）</td>' +
              '<td class="num" style="color:' + (c.delta >= 0 ? '#15803d' : '#b91c1c') + '">' + (c.delta >= 0 ? '+' : '') + c.delta.toFixed(2) + '</td>' +
              '<td>' + chip(c.beforeLevel) + ' → ' + chip(c.afterLevel) + '</td></tr>';
          }).join('') + '</tbody></table></div>' : '<p class="muted">掌握度未发生显著变化，建议内容沿用原方案。</p>') +
        (d.added.length ? '<p class="sub">新增：' + d.added.map(function (x) { return x.materialId + ' ' + x.title; }).join('；') + '</p>' : '') +
        (d.removed.length ? '<p class="sub">移除：' + d.removed.map(function (x) { return x.materialId + ' ' + x.title; }).join('；') + '</p>' : '') +
        '</div>';
    }

    return head + summary + phases + diag +
      '<div class="two-col">' + section('教师调整建议', '可直接用于课堂实施与个别化辅导', notes) +
      section('补充记录与重新诊断', '呈现“反馈—调整”的闭环流程', adjForm + adjDiff) + '</div>';
  }

  function taskCard(it, idx, sid) {
    var stars = '★★★'.slice(0, it.difficulty);
    return '<div class="task"><div class="task__top"><span class="task__idx">' + (idx + 1) + '</span>' +
      '<div class="task__title"><b>' + esc(it.title) + '</b><span class="mono">' + it.materialId + '</span></div>' +
      '<span class="tag tag--line">' + it.type + '</span><span class="sub">难度 ' + stars + ' · ' + it.estMin + ' 分钟</span></div>' +
      '<div class="task__meta">知识点：' + it.kpName + '（' + it.kpId + '）｜依据：' + esc(it.evidence.summary) + '</div>' +
      '<p class="task__reason">' + esc(it.reason) + '</p>' +
      '<div class="task__actions">' +
      '<button class="link" data-act="show-evidence" data-student="' + sid + '" data-kp="' + it.kpId + '">查看证据（' + it.evidence.recordIds.length + ' 条）</button>' +
      '<button class="link" data-act="show-material" data-id="' + it.materialId + '">材料详情</button></div></div>';
  }

  /* ------------------------------ 结果核对 ------------------------------ */
  function renderTrace() {
    var m = model();
    var rows = S.traceability(m, ui.student, ui.traceTopic === '全部' ? null : ui.traceTopic);
    var traceRows = rows.map(function (r) {
      return '<tr><td class="mono">' + r.reqId + '</td><td>' + esc(r.reqText) + '<div class="sub">' + esc(r.locator) + '</div></td>' +
        '<td>' + r.levelReq + '</td><td>' + r.kpNames.join('、') + '</td>' +
        '<td><span class="num">' + (r.n ? r.n + ' 条 / ' + pct(r.rate, 0) + ' / ' + r.mastery.toFixed(2) : '无记录') + '</span><br>' + chip(r.level) + '</td>' +
        '<td class="sub">' + (r.materialIds.length ? r.materialIds.slice(0, 3).join('、') + '（共 ' + r.materialTotal + '）' : '—') + '</td>' +
        '<td class="mono small">' + (r.suggestionIds.length ? r.suggestionIds.join('、') : '—') + '</td>' +
        '<td class="sub">' + (r.evidenceRecordIds.length ? r.evidenceRecordIds.slice(0, 4).join('、') : '—') + '</td></tr>';
    }).join('');

    var keyRows = S.keyStats(m, ui.student).map(function (r) {
      return '<tr><td>' + r.name + '</td><td class="num"><b>' + r.value + '</b></td><td class="sub">' + r.method + '</td><td class="sub">' + r.where + '</td></tr>';
    }).join('');

    return '<div class="control-bar">' + studentSelect(ui.student, 'trace-student') +
      '<select class="select" data-act="trace-topic"><option value="全部"' + (ui.traceTopic === '全部' ? ' selected' : '') + '>全部主题</option>' +
      S.topics.map(function (t) { return '<option value="' + t.id + '"' + (ui.traceTopic === t.id ? ' selected' : '') + '>' + t.name + '</option>'; }).join('') + '</select>' +
      '<span class="grow"></span><button class="btn btn--ghost btn--sm" data-act="export-trace">导出核对包</button></div>' +
      '<div class="two-col">' + caseCard(ui.cmpA, '案例 A', 'cmp-a') + caseCard(ui.cmpB, '案例 B', 'cmp-b') + '</div>' +
      section('建议差异说明', '对比两名学生的证据结构与建议重点，检验建议是否“因人而异”', diffNarrative(m)) +
      section('“学习要求 — 已有表现 — 学习建议”核对表', '每条要求均可回溯到知识点证据与具体材料编号', '<div class="table-wrap table--tall"><table class="table table--compact"><thead><tr><th>要求</th><th>学习内容与要求</th><th>水平</th><th>知识点</th><th>已有表现（条数 / 正确率 / 掌握度）</th><th>对应材料</th><th>本次建议</th><th>证据记录</th></tr></thead><tbody>' + traceRows + '</tbody></table></div>') +
      section('关键统计核对', '每个指标都给出计算方式与可在界面复核的位置', '<div class="table-wrap"><table class="table table--compact"><thead><tr><th>指标</th><th>取值</th><th>计算方式</th><th>复核位置</th></tr></thead><tbody>' + keyRows + '</tbody></table></div>') +
      section('结果适用范围与限制', '评审复核时的边界说明', '<div class="scope-grid">' +
        '<div class="scope-item"><span>数据范围</span><p>基于 <b>' + m.quality.usable + '</b> 条可用记录，不含剔除的 ' + m.quality.excluded + ' 条。</p></div>' +
        '<div class="scope-item"><span>估计口径</span><p>掌握度为“正确率 + 先验收缩”估计值，仅用于教学排序参考。</p></div>' +
        '<div class="scope-item"><span>证据不足</span><p>少于 3 条不判定掌握与否，缺少记录不解释为未掌握。</p></div>' +
        '<div class="scope-item"><span>建议依据</span><p>每条建议可回溯到学习要求、材料编号与记录。</p></div>' +
        '<div class="scope-item"><span>数据性质</span><p>内置为合成演示数据；导入正式数据后结论自动更新。</p></div>' +
        '</div>');
  }

  function caseCard(sid, role, act) {
    var m = model(), p = m.byId[sid] || m.students[0];
    var rec = S.recommend(m, p.id);
    var topWeak = rec.weak.slice(0, 3);
    return '<div class="card case-card"><div class="card__head"><div><h3>' + role + ' · ' + p.id + '</h3><p>' + p.class + ' · 练习量' + p.practice + '</p></div>' +
      '<div class="case-card__sel">' + studentSelect(p.id, act) + '</div></div>' +
      '<div class="card__body"><div class="stat-row"><div class="stat"><span>整体正确率</span><b>' + pct(p.overall.rate, 0) + '</b></div>' +
      '<div class="stat"><span>已评分</span><b>' + p.overall.graded + '</b></div>' +
      '<div class="stat"><span>知识点覆盖</span><b>' + p.coverage.kps + '/14</b></div>' +
      '<div class="stat"><span>建议任务</span><b>' + rec.stats.items + '</b></div></div>' +
      '<div class="case-block"><span class="sub">优先巩固</span><p>' + (topWeak.length ? topWeak.map(function (k) { return k.name + '（' + k.mastery.toFixed(2) + '）'; }).join('、') : '暂无明显薄弱点，以迁移任务为主') + '</p></div>' +
      '<div class="case-block"><span class="sub">建议结构</span><p>' + (rec.phases.length ? rec.phases.map(function (ph) { return ph.title.replace(/^阶段[一二三] · /, ''); }).join(' → ') : '拓展任务') + '</p></div>' +
      '<div class="case-block"><span class="sub">证据充分性</span><p>' + (rec.diagnostics.length ? '有 ' + rec.diagnostics.length + ' 个知识点需补充观察记录' : '主要知识点均有 ≥3 条评分记录') + '</p></div>' +
      '<div class="case-block"><span class="sub">首个任务</span><p>' + (rec.phases[0] ? rec.phases[0].items[0].materialId + ' · ' + rec.phases[0].items[0].title : (rec.diagnostics[0] ? rec.diagnostics[0].materialId + ' · ' + rec.diagnostics[0].title : '—')) + '</p></div>' +
      '</div></div>';
  }

  function diffNarrative(m) {
    var a = m.byId[ui.cmpA], b = m.byId[ui.cmpB];
    if (!a || !b) return '<p class="muted">请选择两名学生。</p>';
    var ra = S.recommend(m, a.id), rb = S.recommend(m, b.id);
    var setA = ra.weak.slice(0, 2).map(function (k) { return k.name; });
    var setB = rb.weak.slice(0, 2).map(function (k) { return k.name; });
    var diff = [];
    if (Math.abs((a.overall.rate || 0) - (b.overall.rate || 0)) >= 0.05) {
      diff.push(a.id + ' 的整体正确率为 ' + pct(a.overall.rate, 0) + '，' + b.id + ' 为 ' + pct(b.overall.rate, 0) + '，差距 ' + pct(Math.abs(a.overall.rate - b.overall.rate), 0) + '。');
    }
    if (setA.join() !== setB.join()) {
      diff.push('薄弱点不同：' + a.id + ' 集中在' + (setA.join('、') || '—') + '，' + b.id + ' 集中在' + (setB.join('、') || '—') + '，因此建议的起点与材料选择不同。');
    } else {
      diff.push('两人的优先巩固点相同，但证据条数与正确率不同，任务数量与难度分配仍需区分。');
    }
    if (ra.diagnostics.length !== rb.diagnostics.length) {
      diff.push('证据充分性不同：' + a.id + ' 有 ' + ra.diagnostics.length + ' 个知识点需补充观察，' + b.id + ' 为 ' + rb.diagnostics.length + ' 个。');
    }
    diff.push('建议并非按固定模板套用：阶段划分由“前置是否达成—薄弱是否稳定—是否具备迁移基础”逐条判断。');
    return '<div class="narrative"><p>' + diff.join('</p><p>') + '</p></div>';
  }

  /* ------------------------------ 数据导入 ------------------------------ */
  function renderImport() {
    var status = '<div class="dataset-status"><div class="stat"><span>当前数据来源</span><b>' + (state.source === 'demo' ? '内置演示数据' : '本地导入数据') + '</b></div>' +
      '<div class="stat"><span>学生</span><b>' + state.students.length + '</b></div>' +
      '<div class="stat"><span>记录</span><b>' + state.records.length + '</b></div>' +
      '<div class="stat"><span>补充记录</span><b>' + state.adjustments.length + '</b></div>' +
      '<div class="stat"><span>本地保存</span><b>' + (saved ? '已启用' : '未写入') + '</b></div></div>';

    var report = '';
    if (ui.importReport) {
      var r = ui.importReport;
      report = '<div class="import-report ' + (r.ok ? 'is-ok' : 'is-bad') + '"><h4>' + (r.ok ? '导入完成' : '导入未生效') + '：' + esc(r.type) + ' · ' + esc(r.fileName) + '</h4>' +
        '<p>读取 ' + r.rows + ' 行，有效 ' + r.accepted + ' 行' + (r.warnings.length ? '，提示 ' + r.warnings.length + ' 条' : '') + '。</p>' +
        (r.errors.length ? '<div class="table-wrap"><table class="table table--compact"><thead><tr><th>行号</th><th>问题</th></tr></thead><tbody>' +
          r.errors.slice(0, 12).map(function (e) { return '<tr><td class="num">' + e.row + '</td><td>' + esc(e.msg) + '</td></tr>'; }).join('') +
          '</tbody></table></div>' : '') +
        (r.warnings.length ? '<ul class="plain">' + r.warnings.slice(0, 8).map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>' : '') +
        '</div>';
    }

    var upload = '<div class="upload-grid">' +
      '<div class="upload"><h4>学习记录 CSV</h4><p class="sub">必需字段：记录编号、学生编号、材料编号、作答结果。可选：评分状态、作答时间。</p>' +
      '<div class="upload__actions"><input type="file" id="fileRecords" accept=".csv,text/csv" hidden>' +
      '<button class="btn btn--primary btn--sm" data-act="pick-records">选择文件</button>' +
      '<button class="link" data-act="tpl-records">下载记录模板</button></div>' +
      '<div class="sub" id="fileRecordsName">尚未选择文件</div></div>' +
      '<div class="upload"><h4>学生信息 CSV</h4><p class="sub">必需字段：学生编号。可选：姓名、群体编号、班级名称、练习量。</p>' +
      '<div class="upload__actions"><input type="file" id="fileStudents" accept=".csv,text/csv" hidden>' +
      '<button class="btn btn--primary btn--sm" data-act="pick-students">选择文件</button>' +
      '<button class="link" data-act="tpl-students">下载学生模板</button></div>' +
      '<div class="sub" id="fileStudentsName">尚未选择文件</div></div>' +
      '</div>';

    var dict = '<div class="table-wrap table--tall"><table class="table table--compact"><thead><tr><th>字段</th><th>类型</th><th>必填</th><th>含义与取值</th><th>示例</th></tr></thead><tbody>' +
      S.dictionary.map(function (d) {
        return '<tr><td class="mono">' + d.field + '</td><td>' + d.type + '</td><td>' + (d.required ? '<span class="chip chip--warn">必填</span>' : '可空') + '</td><td>' + esc(d.desc) + '</td><td class="mono">' + esc(d.example) + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    return section('当前数据集', '数据仅保存在本机浏览器（localStorage），不上传任何服务器', status +
      '<div class="control-bar"><button class="btn btn--ghost btn--sm" data-act="reset-data">恢复内置演示数据</button>' +
      '<button class="btn btn--ghost btn--sm" data-act="export-records-csv">导出清洗后记录 CSV</button></div>') +
      section('导入数据（可替换为赛题正式数据包）', '导入后所有学情、建议、核对结果即时重算；解析与校验均在本地完成', upload + report) +
      section('数据字典与字段说明', '与赛题数据包字段口径保持一致，便于对接正式数据', dict) +
      '<div class="notice">导入说明：作答结果支持“正确/错误/未作答/待评分”，也兼容 1、0、对、错；无法关联到学生或材料的记录会在质量报告中被明确剔除，不会被当作错误作答。CSV 需为 UTF-8 编码，首行为表头。</div>';
  }

  /* ------------------------------ 证据与材料 ------------------------------ */
  function openEvidence(sid, kpId) {
    var m = model(), p = m.byId[sid], kp = p.kps[kpId];
    var recs = p.records.filter(function (r) {
      var mat = m.materials[r.materialId];
      return mat && mat.kpIds.indexOf(kpId) >= 0;
    });
    var rows = recs.map(function (r) {
      var mat = m.materials[r.materialId];
      return '<tr><td class="mono">' + r.id + '</td><td class="mono">' + r.materialId + '</td><td>' + (mat ? esc(mat.title) : '—') + '</td>' +
        '<td>' + chip(r.result === '正确' ? 'mastered' : r.result === '错误' ? 'weak' : 'unverified') + ' ' + r.result + '</td>' +
        '<td class="sub">' + (r.submittedAt || '时间缺失') + '</td><td class="sub">' + r.source + '</td></tr>';
    }).join('');
    modal('证据链 · ' + p.id + ' · ' + kp.name,
      '<div class="evidence-head"><div class="stat"><span>已评分</span><b>' + kp.n + '</b></div>' +
      '<div class="stat"><span>正确</span><b>' + kp.correct + '</b></div>' +
      '<div class="stat"><span>正确率</span><b>' + pct(kp.rate, 0) + '</b></div>' +
      '<div class="stat"><span>掌握度</span><b>' + kp.mastery.toFixed(2) + '</b></div>' +
      '<div class="stat"><span>结论</span><b>' + S.LEVELS[kp.level].label + '</b></div></div>' +
      '<p class="sub">计算：掌握度 = (正确 ' + kp.correct + ' + 2 × 先验) ÷ (已评分 ' + kp.n + ' + 2)。缺少记录不解释为未掌握。</p>' +
      '<div class="table-wrap"><table class="table table--compact"><thead><tr><th>记录编号</th><th>材料</th><th>材料标题</th><th>作答结果</th><th>时间</th><th>来源</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6" class="empty">该知识点暂无记录</td></tr>') + '</tbody></table></div>');
  }

  function openMaterial(id) {
    var m = model();
    var mat = S.materials.filter(function (x) { return x.id === id; })[0];
    if (!mat) return;
    var reqs = S.requirements.filter(function (r) { return r.kpIds.some(function (k) { return mat.kpIds.indexOf(k) >= 0; }); });
    var usage = m.records.filter(function (r) { return r.materialId === id; });
    var correct = usage.filter(function (r) { return r.result === '正确'; }).length;
    modal('材料详情 · ' + mat.id,
      '<div class="material-head"><span class="tag tag--line">' + mat.type + '</span><span class="tag">' + topicName(mat.topicId) + '</span>' +
      '<span class="tag">' + mat.kpIds.join('、') + '</span><span class="sub">难度 ' + '★★★'.slice(0, mat.difficulty) + ' · 约 ' + mat.estMin + ' 分钟</span></div>' +
      '<h3 class="material-title">' + esc(mat.title) + '</h3><p class="material-stem">' + esc(mat.stem) + '</p>' +
      '<p class="material-answer"><b>参考答案：</b>' + esc(mat.answer) + '</p>' +
      '<p class="sub">材料来源：' + esc(mat.source) + '</p>' +
      '<div class="mini-table"><div class="qrow"><span>关联课程要求</span><b>' + (reqs.map(function (r) { return r.id; }).join('、') || '—') + '</b></div>' +
      '<div class="qrow"><span>使用记录</span><b>' + usage.length + ' 条（正确 ' + correct + ' 条）</b></div></div>');
  }

  function openReqMaterials(reqId) {
    var req = S.requirements.filter(function (r) { return r.id === reqId; })[0];
    var list = S.materials.filter(function (m) { return m.kpIds.some(function (k) { return req.kpIds.indexOf(k) >= 0; }); });
    modal('要求对应材料 · ' + reqId,
      '<p class="sub">' + esc(req.text) + '</p><div class="table-wrap"><table class="table table--compact"><thead><tr><th>编号</th><th>标题</th><th>类型</th><th>难度</th></tr></thead><tbody>' +
      list.map(function (m) { return '<tr><td class="mono">' + m.id + '</td><td>' + esc(m.title) + '</td><td>' + m.type + '</td><td>' + '★'.repeat(m.difficulty) + '</td></tr>'; }).join('') +
      '</tbody></table></div>');
  }

  function openStudent(sid) {
    ui.student = sid;
    ui.view = 'recommend';
    render();
  }

  /* ------------------------------ 调整闭环 ------------------------------ */
  function applyAdjustment() {
    var sid = ui.student;
    var mid = document.getElementById('adjMaterial').value;
    var result = document.getElementById('adjResult').value;
    var note = document.getElementById('adjNote').value.trim();
    var before = S.buildModel(state);
    var prev = S.recommend(before, sid);
    var attempt = 1;
    (before.byStudent[sid] || []).forEach(function (r) {
      if (r.materialId === mid) attempt = Math.max(attempt, r.attempt + 1);
    });
    state.adjustments.push({
      studentId: sid, materialId: mid, result: result, note: note, attempt: attempt,
      at: new Date().toLocaleString('zh-CN', { hour12: false })
    });
    bump(); save();
    var after = model();
    ui.adjustResult = { before: prev, after: S.recommend(after, sid), diff: S.diffRecommendation(prev, S.recommend(after, sid)) };
    render();
    toast('已追加补充记录并重算建议');
  }

  function undoAdjustment() {
    if (!state.adjustments.length) return;
    state.adjustments.pop();
    bump(); save(); ui.adjustResult = null; render();
    toast('已撤销最近一次补充记录');
  }

  /* ------------------------------ 导入 / 导出 ------------------------------ */
  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, '');
    var rows = [], row = [], cur = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += c;
      } else {
        if (c === '"') q = true;
        else if (c === ',') { row.push(cur); cur = ''; }
        else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
        else if (c === '\r') { }
        else cur += c;
      }
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.join('').trim() !== ''; });
  }
  function normHead(h) { return String(h).replace(/\s/g, '').replace(/[（）()]/g, '').toLowerCase(); }
  function colIndex(head, names) {
    for (var i = 0; i < names.length; i++) {
      var idx = head.indexOf(normHead(names[i]));
      if (idx >= 0) return idx;
    }
    return -1;
  }

  function importRecordsFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var rows = parseCSV(String(reader.result));
      var report = { type: '学习记录', fileName: file.name, rows: Math.max(0, rows.length - 1), accepted: 0, errors: [], warnings: [], ok: false };
      if (rows.length < 2) { report.errors.push({ row: 0, msg: '文件为空或缺少数据行' }); ui.importReport = report; render(); return; }
      var head = rows[0].map(normHead);
      var iId = colIndex(head, ['记录编号', 'recordId', '记录ID']);
      var iStu = colIndex(head, ['学生编号', 'studentId', '学生ID']);
      var iMat = colIndex(head, ['材料编号', 'materialId', '材料ID']);
      var iRes = colIndex(head, ['作答结果', '结果', 'result']);
      var iStatus = colIndex(head, ['评分状态', 'status']);
      var iTime = colIndex(head, ['作答时间', '时间', 'submittedAt']);
      var iAtt = colIndex(head, ['作答次数', 'attempt', '次数']);
      if (iStu < 0 || iMat < 0 || iRes < 0) {
        report.errors.push({ row: 1, msg: '缺少必需列：学生编号 / 材料编号 / 作答结果' });
        ui.importReport = report; render(); return;
      }
      var stuIds = {}, matIds = {};
      state.students.forEach(function (s) { stuIds[s.id] = true; });
      S.materials.forEach(function (m) { matIds[m.id] = true; });
      var records = [], unknownStu = {}, unknownMat = {};
      rows.slice(1).forEach(function (r, i) {
        var line = i + 2;
        var sid = (r[iStu] || '').trim(), mid = (r[iMat] || '').trim();
        if (!sid || !mid) { report.errors.push({ row: line, msg: '学生编号或材料编号为空' }); return; }
        if (!stuIds[sid]) unknownStu[sid] = (unknownStu[sid] || 0) + 1;
        if (!matIds[mid]) unknownMat[mid] = (unknownMat[mid] || 0) + 1;
        records.push({
          id: (iId >= 0 ? r[iId] : '').trim() || ('IMP-' + String(line).padStart(4, '0')),
          studentId: sid, materialId: mid,
          result: (r[iRes] || '').trim(),
          status: iStatus >= 0 ? (r[iStatus] || '').trim() : '',
          submittedAt: iTime >= 0 ? (r[iTime] || '').trim() : '',
          attempt: iAtt >= 0 ? (parseInt(r[iAtt], 10) || 1) : 1,
          source: '导入数据'
        });
        report.accepted++;
      });
      Object.keys(unknownStu).forEach(function (k) { report.warnings.push('学生编号 ' + k + ' 不在学生表，相关 ' + unknownStu[k] + ' 条记录会被清洗剔除'); });
      Object.keys(unknownMat).forEach(function (k) { report.warnings.push('材料编号 ' + k + ' 不在材料表，相关 ' + unknownMat[k] + ' 条记录会被清洗剔除'); });
      report.ok = records.length > 0;
      if (report.ok) {
        state.records = records; state.source = 'imported'; state.adjustments = [];
        bump(); save();
      }
      ui.importReport = report; render();
    };
    reader.readAsText(file, 'utf-8');
  }

  function importStudentsFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var rows = parseCSV(String(reader.result));
      var report = { type: '学生信息', fileName: file.name, rows: Math.max(0, rows.length - 1), accepted: 0, errors: [], warnings: [], ok: false };
      if (rows.length < 2) { report.errors.push({ row: 0, msg: '文件为空或缺少数据行' }); ui.importReport = report; render(); return; }
      var head = rows[0].map(normHead);
      var iId = colIndex(head, ['学生编号', 'studentId', '学生ID']);
      var iName = colIndex(head, ['姓名', 'name']);
      var iClass = colIndex(head, ['班级名称', '班级', 'class']);
      var iGroup = colIndex(head, ['群体编号', '班级编号', 'classId']);
      var iPrac = colIndex(head, ['练习量', 'practice']);
      if (iId < 0) { report.errors.push({ row: 1, msg: '缺少必需列：学生编号' }); ui.importReport = report; render(); return; }
      var students = [];
      rows.slice(1).forEach(function (r, i) {
        var id = (r[iId] || '').trim();
        if (!id) { report.errors.push({ row: i + 2, msg: '学生编号为空' }); return; }
        var gid = (iGroup >= 0 ? (r[iGroup] || '').trim() : '') || 'C1';
        students.push({
          id: id,
          name: (iName >= 0 ? (r[iName] || '').trim() : '') || ('学生' + id),
          classId: gid,
          class: (iClass >= 0 ? (r[iClass] || '').trim() : '') || (gid + '班'),
          practice: (iPrac >= 0 ? (r[iPrac] || '').trim() : '') || '中',
          ability: 0.6
        });
        report.accepted++;
      });
      if (!students.length) { report.errors.push({ row: 0, msg: '未解析到有效学生' }); ui.importReport = report; render(); return; }
      report.ok = true;
      state.students = students;
      /* 学生表变化后，剔除无法关联的记录与补充记录 */
      var keep = {};
      students.forEach(function (s) { keep[s.id] = true; });
      state.records = state.records.filter(function (r) { return keep[r.studentId]; });
      state.adjustments = state.adjustments.filter(function (a) { return keep[a.studentId]; });
      if (!keep[ui.student]) ui.student = students[0].id;
      state.source = 'imported';
      bump(); save();
      ui.importReport = report; render();
    };
    reader.readAsText(file, 'utf-8');
  }

  function templateRecords() {
    var rows = [['记录编号', '学生编号', '材料编号', '作答结果', '评分状态', '作答时间'],
      ['R-DEMO-001', 'S-01', 'MAT-T1-09', '正确', '已评分', '2026-10-12 19:20'],
      ['R-DEMO-002', 'S-04', 'MAT-T2-05', '错误', '已评分', '2026-10-13 20:05'],
      ['R-DEMO-003', 'S-27', 'MAT-T3-06', '未作答', '已评分', '']];
    download('学习记录导入模板.csv', csv(rows), 'text/csv;charset=utf-8');
  }
  function templateStudents() {
    var rows = [['学生编号', '姓名', '群体编号', '班级名称', '练习量'],
      ['S-01', '模拟学生S01', 'C1', '七年级1班', '高'],
      ['S-02', '模拟学生S02', 'C1', '七年级1班', '中']];
    download('学生信息导入模板.csv', csv(rows), 'text/csv;charset=utf-8');
  }

  function exportBundle() {
    var m = model();
    var bundle = {
      meta: {
        app: S.meta.appName, version: S.meta.version, exportedAt: new Date().toISOString(),
        datasetSource: state.source === 'demo' ? '内置演示数据' : '本地导入数据',
        note: S.meta.dataNote, courseSource: S.meta.courseSource
      },
      curriculum: { topics: S.topics, kps: S.kps, requirements: S.requirements, links: S.links },
      dataset: { students: state.students, materials: S.materials, records: m.records, adjustments: state.adjustments },
      analysis: {
        overall: m.overall, quality: m.quality, classes: m.classes,
        students: m.students.map(function (p) {
          return {
            id: p.id, name: p.name, classId: p.classId, class: p.class, practice: p.practice,
            overall: p.overall, coverage: p.coverage,
            kps: S.kps.map(function (kp) {
              var k = p.kps[kp.id];
              return { id: k.id, name: k.name, n: k.n, correct: k.correct, rate: k.rate, mastery: k.mastery, level: k.level, tentative: k.tentative };
            })
          };
        }),
        commonIssues: m.commonIssues, evidenceGaps: m.evidenceGaps, differences: m.differences
      },
      recommendations: m.students.map(function (p) { return S.recommend(m, p.id); }),
      traceability: { studentId: ui.student, topicId: ui.traceTopic, rows: S.traceability(m, ui.student, ui.traceTopic === '全部' ? null : ui.traceTopic) },
      verification: { keyStats: S.keyStats(m, ui.student) }
    };
    download('倾学_任务成果包_' + stamp() + '.json', JSON.stringify(bundle, null, 2), 'application/json');
  }

  function exportRecommendation() {
    var m = model(), rec = S.recommend(m, ui.student);
    download('学习建议_' + ui.student + '_' + stamp() + '.json', JSON.stringify({
      generatedAt: new Date().toISOString(),
      studentId: ui.student, summary: rec.summary, phases: rec.phases, diagnostics: rec.diagnostics,
      teacherNotes: rec.teacherNotes, stats: rec.stats
    }, null, 2), 'application/json');
  }

  function exportProfilesCSV() {
    var m = model();
    var rows = [['学生编号', '班级', '练习量', '记录数', '已评分', '正确率', '覆盖知识点数', '薄弱知识点', '待巩固知识点', '证据不足知识点']];
    m.students.forEach(function (p) {
      rows.push([
        p.id, p.class, p.practice, p.overall.total, p.overall.graded, pct(p.overall.rate, 1),
        p.coverage.kps,
        p.weaknesses.filter(function (k) { return k.level === 'weak'; }).map(function (k) { return k.id + ' ' + k.name; }).join('；'),
        p.weaknesses.filter(function (k) { return k.level === 'consolidate'; }).map(function (k) { return k.id + ' ' + k.name; }).join('；'),
        p.unverified.map(function (k) { return k.id + ' ' + k.name; }).join('；')
      ]);
    });
    download('学生学情画像_' + stamp() + '.csv', csv(rows), 'text/csv;charset=utf-8');
  }

  function exportTrace() {
    var m = model();
    var rows = S.traceability(m, ui.student, ui.traceTopic === '全部' ? null : ui.traceTopic);
    download('结果核对_' + ui.student + '_' + stamp() + '.json', JSON.stringify({
      studentId: ui.student, topicId: ui.traceTopic, rows: rows, keyStats: S.keyStats(m, ui.student),
      scope: '基于当前数据集的可用记录；掌握度为收缩估计；证据不足不作薄弱结论。'
    }, null, 2), 'application/json');
  }

  function exportRecordsCSV() {
    var m = model();
    var rows = [['记录编号', '学生编号', '材料编号', '作答结果', '评分状态', '作答时间', '作答次数', '来源']];
    m.records.forEach(function (r) {
      rows.push([r.id, r.studentId, r.materialId, r.result, r.status, r.submittedAt, r.attempt, r.source]);
    });
    download('清洗后学习记录_' + stamp() + '.csv', csv(rows), 'text/csv;charset=utf-8');
  }

  /* ------------------------------ 渲染入口 ------------------------------ */
  var renderers = {
    overview: renderOverview, student: renderStudent, curriculum: renderCurriculum, diagnosis: renderDiagnosis,
    recommend: renderRecommend, trace: renderTrace, import: renderImport
  };

  function render() {
    document.body.classList.toggle('role-gate', !ui.role);
    document.body.classList.toggle('role-teacher', ui.role === 'teacher');
    document.body.classList.toggle('role-student', ui.role === 'student');
    var gate = document.getElementById('gate');
    if (gate) gate.hidden = !!ui.role;
    document.getElementById('brandSub').textContent = ui.role === 'student' ? '我的学习空间' : '让每一次学习投入被看见';
    document.getElementById('modeBadge').textContent = ui.role === 'student' ? '学生端' : '教师端';
    var meta = VIEWS[ui.view];
    document.getElementById('crumb').textContent = meta[0];
    document.getElementById('pageTitle').textContent = meta[1];
    document.getElementById('sourceBadge').textContent = state.source === 'demo' ? '内置演示数据' : '导入数据';
    Array.prototype.forEach.call(document.querySelectorAll('.nav__item'), function (b) {
      b.classList.toggle('is-active', b.dataset.view === ui.view);
    });
    Object.keys(renderers).forEach(function (v) {
      var el = document.getElementById('view-' + v);
      if (v === ui.view) { el.hidden = false; el.innerHTML = renderers[v](); }
      else el.hidden = true;
    });
    if (ui.view === 'curriculum') renderMaterialTable();
    renderChat();
  }

  /* ------------------------------ 学伴问答 ------------------------------ */
  function renderChat() {
    var panel = document.getElementById('chatPanel');
    if (!panel) return;
    panel.hidden = !ui.chatOpen;
    document.getElementById('chatFab').classList.toggle('is-open', ui.chatOpen);
    var body = document.getElementById('chatBody');
    body.innerHTML = ui.chat.map(function (msg) {
      return '<div class="chat-msg chat-msg--' + msg.role + '">' + msg.html + '</div>';
    }).join('');
    document.getElementById('chatChips').innerHTML = (ui.chatChips || []).map(function (q) {
      return '<button data-act="chat-ask" data-q="' + esc(q) + '">' + esc(q) + '</button>';
    }).join('');
    body.scrollTop = body.scrollHeight;
  }

  function chatAsk(q) {
    var text = String(q || '').trim();
    if (!text) return;
    ui.chat.push({ role: 'user', html: esc(text) });
    var ans = chatAnswer(text);
    ui.chat.push({ role: 'bot', html: ans.html });
    ui.chatChips = ans.chips || ui.chatChips;
    if (ui.chat.length > 30) ui.chat = ui.chat.slice(-30);
    renderChat();
    var input = document.getElementById('chatInput');
    if (input && ui.chatOpen) input.focus();
  }

  function chatGo(label, act, key, value) {
    return '<button class="chat-action" data-act="' + act + '"' +
      (key ? ' data-' + key + '="' + esc(value) + '"' : '') + '>' + esc(label) + '</button>';
  }

  function detectStudent(text) {
    var hit = text.match(/s[-\s]?0?(\d{1,2})/i);
    var n = hit ? parseInt(hit[1], 10) : null;
    if (n === null) {
      var alt = text.match(/(\d{1,2})\s*号/);
      if (alt) n = parseInt(alt[1], 10);
    }
    if (n === null || n < 1) return null;
    var sid = 'S-' + (n < 10 ? '0' + n : n);
    return model().byId[sid] ? sid : null;
  }

  function chatAnswer(text) {
    var t = String(text).trim();
    var m = model();
    var sid = detectStudent(t);
    if (sid) return chatStudent(m, sid);
    var minHit = t.match(/(\d{1,3})\s*分钟/);
    if (minHit) return chatTime(m, parseInt(minHit[1], 10));
    if (/我的|我该|我要|我今天/.test(t)) return chatStudent(m, ui.student);
    if (/你好|您好|hi|hello|在吗|你是谁|能做什么|帮助|怎么用|功能/.test(t)) return chatHello();
    if (/谁.*关注|关注.*谁|风险|重点关注|名单/.test(t)) return chatAttention(m);
    if (/共性|群体|班级|整体|总体|学习投入/.test(t)) return chatGroup(m);
    if (/数据|质量|清洗|缺失|重复|异常|可用率/.test(t)) return chatQuality(m);
    if (/掌握度|指标|阈值|怎么算|计算|证据不足/.test(t)) return chatMetric();
    if (/材料|题目|练习|资源/.test(t)) return chatMaterials(m);
    if (/调整|补充|重算|重新诊断|新记录/.test(t)) return chatAdjust(m);
    if (/要求|课标|知识点|内容/.test(t)) return chatCurriculum(m);
    if (/依据|为什么|追溯|怎么得出/.test(t)) return chatBasis(m);
    if (/建议|今日任务|怎么补|提升|怎么学|练什么/.test(t)) return chatAdvice(m);
    return chatFallback();
  }

  function chatHello() {
    return {
      html: '<p>我是小倾，可基于当前数据提供本地即时回答，无需联网。可查询：</p><ul class="chat-list">' +
        '<li>指定学生的知识点掌握情况与学习建议（如 <b>S-12</b>）；</li>' +
        '<li>群体共性薄弱点与需重点关注的学生；</li>' +
        '<li>数据完整性与指标计算口径；</li>' +
        '<li>补充记录后学习建议的调整过程。</li></ul>',
      chips: ['S-12 的知识点掌握情况', '需重点关注的学生', '群体共性薄弱点', '数据质量情况', '掌握度计算方法']
    };
  }

  function chatStudent(m, sid) {
    var p = m.byId[sid];
    var rec = S.recommend(m, sid);
    var need = [], cons = [], unsure = [];
    Object.keys(p.kps).forEach(function (k) {
      var x = p.kps[k];
      if (x.tentative || x.n === 0 || x.level === 'unverified' || x.level === 'none') {
        unsure.push(x.name + '（评分记录 ' + x.n + ' 条）');
        return;
      }
      if (x.level === 'weak') need.push(x.name + '（正确率 ' + S.pct(x.rate, 0) + '，评分记录 ' + x.n + ' 条）');
      else if (x.level === 'consolidate') cons.push(x.name + '（正确率 ' + S.pct(x.rate, 0) + '）');
    });
    var diag = rec.diagnostics && rec.diagnostics.length ? '<li><b>观察任务</b>：' +
      rec.diagnostics.slice(0, 2).map(function (it) { return esc(it.title) + '（' + it.materialId + '，约 ' + it.estMin + ' 分钟）'; }).join('；') + '</li>' : '';
    var plan = rec.phases.map(function (ph) {
      return '<li><b>' + studentPhaseLabel(ph.key) + '</b>：' + ph.items.slice(0, 2).map(function (it) {
        return esc(it.title) + '（' + it.materialId + '，约 ' + it.estMin + ' 分钟）';
      }).join('；') + '</li>';
    }).join('');
    var rate = p.overall.rate === null ? '暂无可用数据' : S.pct(p.overall.rate, 0);
    return {
      html: '<p><b>' + p.id + '</b>：练习记录 ' + p.overall.total + ' 条，已评分 ' + p.overall.graded +
        ' 条，正确率 ' + rate + '；' + S.kps.length + ' 个知识点中已练习 ' + p.coverage.kps + ' 个。</p>' +
        '<p><b>待巩固</b>：' + (need.length ? need.join('、') : '暂无') + '</p>' +
        '<p><b>需强化</b>：' + (cons.length ? cons.join('、') : '暂无') + '</p>' +
        (unsure.length ? '<p><b>证据不足</b>：' + unsure.join('、') + '</p>' : '') +
        (diag || plan ? '<ul class="chat-list">' + diag + plan + '</ul>' : '<p>暂无新增任务。</p>') +
        '<p class="chat-foot">评分记录少于 3 条的知识点仅作初步观察，不判定为掌握或薄弱。</p>' +
        chatGo('查看完整学习计划', 'chat-student', 'student', sid),
      chips: ['今日学习任务', '建议依据是什么？', '我的学习投入情况']
    };
  }

  function chatTime(m, minutes) {
    var rec = S.recommend(m, ui.student);
    var plan = studentPlan(rec, minutes);
    var lines = plan.list.map(function (x) {
      return '<li><b>' + esc(x.phase) + '</b>：' + esc(x.item.title) + '（' + x.item.materialId + '，约 ' + x.item.estMin + ' 分钟）</li>';
    }).join('');
    return {
      html: '<p>若本次可用学习时长为 <b>' + minutes + ' 分钟</b>，建议安排如下：</p>' +
        (lines ? '<ul class="chat-list">' + lines + '</ul>' : '<p>当前时长不足以完成现有任务，建议预留 25 分钟以上；也可先完成 1 道基础题进行初步观察。</p>') +
        '<p class="chat-foot">完成一项后再进行下一项，无需一次完成全部任务。</p>' +
        chatGo('打开今日学习计划', 'chat-student', 'student', ui.student),
      chips: ['我的薄弱点', '今日学习任务', '25 分钟如何安排？']
    };
  }

  function chatAttention(m) {
    var list = m.students.filter(function (p) { return p.overall.graded >= 4; })
      .sort(function (a, b) {
        return (a.overall.rate === null ? 2 : a.overall.rate) - (b.overall.rate === null ? 2 : b.overall.rate);
      }).slice(0, 3);
    var rows = list.map(function (p) {
      var weak = Object.keys(p.kps).filter(function (k) { return p.kps[k].level === 'weak'; })
        .map(function (k) { return p.kps[k].name; });
      return '<li><b>' + p.id + '</b>（' + esc(p.classId) + ' 班，正确率 ' +
        (p.overall.rate === null ? '—' : S.pct(p.overall.rate, 0)) + '，知识点覆盖 ' + p.coverage.kps + ' / ' + S.kps.length + '）：' +
        (weak.length ? '待巩固 ' + weak.slice(0, 2).join('、') : '练习量偏低，建议持续观察') + '</li>';
    }).join('');
    return {
      html: '<p>按正确率与知识点覆盖排序，建议优先关注以下学生：</p><ul class="chat-list">' + rows + '</ul>' +
        '<p class="chat-foot">名单仅基于现有记录；练习量偏低不等同于学习表现薄弱。</p>' +
        chatGo('查看群体分析', 'nav', 'view', 'diagnosis'),
      chips: ['整体学情分析', 'S-12 的知识点掌握情况', '群体共性薄弱点']
    };
  }

  function chatGroup(m) {
    var issues = m.commonIssues.slice(0, 3).map(function (x) {
      return '<li><b>' + x.name + '</b>：整体掌握度为 ' + x.mean.toFixed(2) + '（满分 1），' + x.assessed + ' 人有练习记录，其中 ' + S.pct(x.weakShare, 0) + ' 掌握不稳定</li>';
    }).join('');
    var gaps = m.evidenceGaps.map(function (x) {
      return '<li><b>' + x.name + '</b>：仅 ' + x.assessed + '/' + m.students.length + ' 人有练习记录，暂不判定</li>';
    }).join('');
    var pg = m.practiceGroups.map(function (g) { return esc(g.level) + '练习量 ' + S.pct(g.mean, 0) + '（' + g.n + ' 人）'; }).join('；');
    var cls = m.classes.map(function (c) { return c.id + ' 班 ' + S.pct(c.avgRate, 0); }).join(' · ');
    return {
      html: '<p>共 ' + m.students.length + ' 名学生、' + m.quality.usable + ' 条可用记录；平均正确率 ' + S.pct(m.overall.avgRate, 0) + '，知识点覆盖率 ' + S.pct(m.overall.coverage, 0) + '。</p>' +
        (issues ? '<p><b>群体共性薄弱知识点</b></p><ul class="chat-list">' + issues + '</ul>' : '<p>当前暂无群体共性薄弱知识点。</p>') +
        (gaps ? '<p><b>证据不足、暂不判定</b></p><ul class="chat-list">' + gaps + '</ul>' : '') +
        '<p><b>练习量分布</b>：' + pg + '</p><p><b>各班正确率</b>：' + cls + '</p>' +
        chatGo('查看群体分析', 'nav', 'view', 'diagnosis'),
      chips: ['需重点关注的学生', '数据质量情况', '掌握度计算方法']
    };
  }

  function chatQuality(m) {
    var hits = m.quality.rules.filter(function (r) { return r.count > 0; })
      .map(function (r) { return '<li>' + esc(r.name) + '：' + r.count + ' 条，' + esc(r.handling) + '</li>'; }).join('');
    return {
      html: '<p>接收 ' + m.quality.total + ' 条，可用 <b>' + m.quality.usable + '</b> 条（' + S.pct(m.quality.usableRate, 1) + '），剔除 ' + m.quality.excluded + ' 条。</p>' +
        (hits ? '<ul class="chat-list">' + hits + '</ul>' : '<p>未发现需要清洗的记录。</p>') +
        '<p class="chat-foot">未作答与待评分记录予以保留，但不计入正确率；记录不足不等同于未掌握。</p>' +
        chatGo('查看数据质量明细', 'nav', 'view', 'diagnosis'),
      chips: ['整体学情分析', 'S-12 的知识点掌握情况', '建议调整方式']
    };
  }

  function chatMetric() {
    return {
      html: '<p><b>掌握度</b>为 0—1 之间的估计值：综合多次评分结果，并对评分记录较少的知识点作保守修正。</p>' +
        '<p>0.85 及以上判定为已掌握，0.60—0.85 为待巩固，0.60 以下为薄弱；评分记录少于 3 条仅作初步判断，暂不下结论。</p>' +
        '<p>未作答与待评分记录不计入正确率。</p>' +
        chatGo('查看依据核对', 'nav', 'view', 'trace'),
      chips: ['数据质量情况', '群体共性薄弱点', 'S-12 的知识点掌握情况']
    };
  }

  function chatMaterials(m) {
    var types = {};
    S.materials.forEach(function (mm) { types[mm.type] = (types[mm.type] || 0) + 1; });
    var typeText = Object.keys(types).map(function (k) { return k + ' ' + types[k] + ' 份'; }).join(' · ');
    var rec = S.recommend(m, ui.student);
    var picks = [];
    rec.phases.forEach(function (ph) {
      ph.items.slice(0, 1).forEach(function (it) { picks.push(esc(it.title) + '（' + it.materialId + '，' + it.estMin + ' 分钟）'); });
    });
    return {
      html: '<p>共 <b>' + S.materials.length + '</b> 份配套材料：' + typeText + '。</p>' +
        '<p><b>' + ui.student + '</b> 优先推荐材料：</p><ul class="chat-list">' + picks.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
        chatGo('查看完整学习计划', 'chat-student', 'student', ui.student),
      chips: ['今日学习任务', 'S-12 的知识点掌握情况', '整体学情分析']
    };
  }

  function chatAdjust(m) {
    return {
      html: '<p>教师补充记录后，系统将立即重新计算并展示调整前后的变化：</p><ul class="chat-list">' +
        '<li>在“学习建议”页选择学生与材料，填写作答结果（正确 / 错误 / 未作答）；</li>' +
        '<li>点击“记录并重算”，学习计划与薄弱知识点将同步更新；</li>' +
        '<li>在“调整前后对比”中查看任务变化。</li></ul>' +
        '<p class="chat-foot">当前已补充 ' + state.adjustments.length + ' 条记录。</p>' +
        chatGo('前往学习建议', 'chat-student', 'student', ui.student),
      chips: ['今日学习任务', '数据质量情况', '掌握度计算方法']
    };
  }

  function chatCurriculum(m) {
    var topics = S.topics.map(function (t) { return t.name + '（' + S.kps.filter(function (k) { return k.topicId === t.id; }).length + ' 个知识点）'; }).join('；');
    return {
      html: '<p>范围：' + esc(S.meta.scope) + '。</p><p>共整理 <b>' + S.kps.length + '</b> 个知识点、<b>' +
        S.requirements.length + '</b> 条课程要求、<b>' + S.links.length + '</b> 条知识点联系和 <b>' + S.materials.length + '</b> 份配套材料。</p>' +
        '<p>' + topics + '</p>' + chatGo('查看学习内容与课程要求', 'nav', 'view', 'curriculum'),
      chips: ['整体学情分析', 'S-12 的知识点掌握情况', '材料选用依据']
    };
  }

  function chatBasis(m) {
    var rec = S.recommend(m, ui.student);
    var p = m.byId[ui.student];
    var sample = null;
    rec.phases.some(function (ph) { if (ph.items.length) { sample = ph.items[0]; return true; } return false; });
    return {
      html: '<p>建议顺序为“基础巩固 — 弱项强化 — 迁移拓展”；材料优先选用存在错误记录的知识点，已稳定掌握的材料不重复安排。</p>' +
        (sample ? '<p>以 <b>' + ui.student + '</b> 的首项任务为例：<b>' + esc(sample.title) + '</b>（' + sample.materialId + '，' + sample.estMin +
          ' 分钟）。' + esc(studentReason(p, sample)) + '</p>' : '') +
        '<p class="chat-foot">每项建议对应的课程要求与作答记录，均可在依据核对页查询。</p>' +
        chatGo('查看依据核对表', 'nav', 'view', 'trace'),
      chips: ['S-12 的知识点掌握情况', '掌握度计算方法', '材料选用依据']
    };
  }

  function chatAdvice(m) {
    var rec = S.recommend(m, ui.student);
    var diag = rec.diagnostics && rec.diagnostics.length ? '<li><b>观察任务</b>：' +
      rec.diagnostics.slice(0, 2).map(function (it) { return esc(it.title) + '（' + it.materialId + '，约 ' + it.estMin + ' 分钟）'; }).join('；') + '</li>' : '';
    var steps = rec.phases.map(function (ph) {
      return '<li><b>' + studentPhaseLabel(ph.key) + '</b>：' + ph.items.slice(0, 2).map(function (it) { return esc(it.title) + '（' + it.materialId + '）'; }).join('；') + '</li>';
    }).join('');
    return {
      html: '<p><b>' + ui.student + '</b> 的今日学习建议如下（累计约 ' + rec.totalMin + ' 分钟）：</p>' +
        (diag || steps ? '<ul class="chat-list">' + diag + steps + '</ul>' : '<p>暂无新增任务。可从“证据不足”的知识点中选择一项，完成两道基础练习以补充证据。</p>') +
        '<p class="chat-foot">时间有限时优先完成靠前任务，其余可顺延至次日。</p>' +
        chatGo('查看完整学习计划', 'chat-student', 'student', ui.student),
      chips: ['建议依据是什么？', '材料选用依据', '建议调整方式']
    };
  }

  function chatFallback() {
    return {
      html: '<p>我可回答学情分析与学习建议相关问题，例如：指定学生的知识点掌握情况、今日学习任务、群体共性薄弱点、数据完整性、指标计算口径等。</p>',
      chips: ['整体学情分析', '需重点关注的学生', 'S-12 的知识点掌握情况', '数据质量情况', '掌握度计算方法']
    };
  }

  /* ------------------------------ 事件 ------------------------------ */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var act = t.dataset.act;
    switch (act) {
      case 'nav': ui.view = t.dataset.view; render(); break;
      case 'chat-toggle': ui.chatOpen = !ui.chatOpen; renderChat(); break;
      case 'chat-ask': chatAsk(t.dataset.q); break;
      case 'chat-student':
        ui.student = t.dataset.student;
        ui.view = ui.role === 'student' ? 'student' : 'recommend';
        ui.adjustResult = null;
        ui.chatOpen = false;
        render();
        renderChat();
        break;
      case 'switch-role':
        ui.role = t.dataset.role === 'student' ? 'student' : 'teacher';
        ui.view = ui.role === 'student' ? 'student' : 'overview';
        ui.chatOpen = false;
        renderChat();
        render();
        break;
      case 'enter-role':
        ui.role = t.dataset.role === 'student' ? 'student' : 'teacher';
        ui.view = ui.role === 'student' ? 'student' : 'overview';
        ui.chatOpen = false;
        renderChat();
        render();
        break;
      case 'student-time': ui.studentMinutes = parseInt(t.dataset.min, 10) || 0; render(); break;
      case 'start-practice': openPractice(t.dataset.id); break;
      case 'mark-done': toggleStudentDone(t.dataset.sid, t.dataset.id); break;
      case 'student-chat': ui.chatOpen = true; chatAsk(t.dataset.q); break;
      case 'reveal-answer':
        var answer = document.getElementById('practiceAnswer');
        if (answer) answer.hidden = false;
        var check = document.getElementById('practiceCheck');
        if (check) check.hidden = false;
        t.hidden = true;
        break;
      case 'self-report': reportPractice(t.dataset.id, t.dataset.result); break;
      case 'diag-tab': ui.diagTab = t.dataset.tab; render(); break;
      case 'topic': ui.topic = t.dataset.topic; render(); break;
      case 'show-evidence': openEvidence(t.dataset.student, t.dataset.kp); break;
      case 'show-material': openMaterial(t.dataset.id); break;
      case 'show-req-materials': openReqMaterials(t.dataset.req); break;
      case 'open-student': openStudent(t.dataset.id); break;
      case 'close-modal': closeModal(); break;
      case 'print': window.print(); break;
      case 'export-bundle': exportBundle(); break;
      case 'export-rec': exportRecommendation(); break;
      case 'export-csv-profile': exportProfilesCSV(); break;
      case 'export-trace': exportTrace(); break;
      case 'export-records-csv': exportRecordsCSV(); break;
      case 'apply-adjust': applyAdjustment(); break;
      case 'undo-adjust': undoAdjustment(); break;
      case 'pick-records': document.getElementById('fileRecords').click(); break;
      case 'pick-students': document.getElementById('fileStudents').click(); break;
      case 'tpl-records': templateRecords(); break;
      case 'tpl-students': templateStudents(); break;
      case 'reset-data':
        if (window.confirm('恢复内置演示数据？当前导入的数据与补充记录将被清除。')) {
          state.students = clone(S.students);
          state.materials = S.materials;
          state.records = S.buildDemoRecords();
          state.adjustments = [];
          state.source = 'demo';
          ui.student = 'S-12'; ui.cmpA = 'S-12'; ui.cmpB = 'S-24'; ui.traceTopic = '全部';
          ui.importReport = null; ui.adjustResult = null;
          bump(); save(); render(); toast('已恢复内置演示数据');
        }
        break;
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    switch (t.dataset.act) {
      case 'diag-student': ui.student = t.value; render(); break;
      case 'student-me': ui.student = t.value; ui.adjustResult = null; render(); break;
      case 'rec-student': ui.student = t.value; ui.adjustResult = null; render(); break;
      case 'trace-student': ui.student = t.value; render(); break;
      case 'trace-topic': ui.traceTopic = t.value; render(); break;
      case 'cmp-a': ui.cmpA = t.value; render(); break;
      case 'cmp-b': ui.cmpB = t.value; render(); break;
      case 'f-topic': ui.fTopic = t.value; renderMaterialTable(); break;
      case 'f-type': ui.fType = t.value; renderMaterialTable(); break;
      case 'f-diff': ui.fDiff = t.value; renderMaterialTable(); break;
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'matSearch') { ui.search = e.target.value; renderMaterialTable(); }
  });

  var chatForm = document.getElementById('chatForm');
  if (chatForm) chatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var input = document.getElementById('chatInput');
    var value = input.value.trim();
    if (!value) return;
    input.value = '';
    chatAsk(value);
  });

  document.addEventListener('change', function (e) {
    if (e.target.id === 'fileRecords' && e.target.files[0]) {
      document.getElementById('fileRecordsName').textContent = e.target.files[0].name;
      importRecordsFile(e.target.files[0]);
    }
    if (e.target.id === 'fileStudents' && e.target.files[0]) {
      document.getElementById('fileStudentsName').textContent = e.target.files[0].name;
      importStudentsFile(e.target.files[0]);
    }
  });

  render();
})();
