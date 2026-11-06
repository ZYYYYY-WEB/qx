/* 倾学 · 推理引擎：清洗 → 个体/群体学情 → 掌握度 → 建议 → 核对 */
window.SLC = window.SLC || {};
(function (S) {
  'use strict';

  S.LEVELS = {
    mastered: { label: '已掌握', cls: 'ok' },
    consolidate: { label: '待巩固', cls: 'warn' },
    weak: { label: '薄弱', cls: 'bad' },
    unverified: { label: '证据不足', cls: 'grey' },
    none: { label: '无记录', cls: 'grey' }
  };

  var RESULT_MAP = {
    '正确': '正确', '对': '正确', '1': '正确',
    '错误': '错误', '错': '错误', '0': '错误',
    '未作答': '未作答', '未答': '未作答', '空': '未作答',
    '待评分': '待评分', '未评分': '待评分', '未登记': '待评分'
  };
  var PRIOR_WEIGHT = 2, MASTER_LINE = 0.85, CONSOLIDATE_LINE = 0.60, STABLE_N = 3;

  S.pct = function (v, d) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    return (v * 100).toFixed(d === undefined ? 0 : d) + '%';
  };
  S.levelOf = function (mastery, n) {
    if (!n) return 'none';
    if (n < STABLE_N) return 'unverified';
    if (mastery >= MASTER_LINE) return 'mastered';
    if (mastery >= CONSOLIDATE_LINE) return 'consolidate';
    return 'weak';
  };

  /* 清洗 */
  S.cleanRecords = function (records, studentMap, materialMap) {
    var q = {
      total: records.length, usable: 0, excluded: 0,
      flags: { missingStudent: 0, missingMaterial: 0, orphanStudent: 0, orphanMaterial: 0, duplicate: 0, invalidResult: 0, missingTime: 0 },
      rules: [], bySource: { '模拟数据': 0, '补充记录': 0, '导入数据': 0 }
    };
    var seenIds = {}, seenKeys = {}, cleaned = [];

    records.forEach(function (raw) {
      var r = {
        id: raw.id, studentId: String(raw.studentId || '').trim(), materialId: String(raw.materialId || '').trim(),
        result: String(raw.result || '').trim(), status: raw.status || '', attempt: raw.attempt || 1,
        submittedAt: raw.submittedAt || '', source: raw.source || '导入数据', note: raw.note || ''
      };
      if (!r.studentId) { q.flags.missingStudent++; q.excluded++; return; }
      if (!r.materialId) { q.flags.missingMaterial++; q.excluded++; return; }
      if (!studentMap[r.studentId]) { q.flags.orphanStudent++; q.excluded++; return; }
      if (!materialMap[r.materialId]) { q.flags.orphanMaterial++; q.excluded++; return; }

      var key = r.studentId + '|' + r.materialId + '|' + r.attempt;
      if (seenIds[r.id] || seenKeys[key]) { q.flags.duplicate++; q.excluded++; return; }
      seenIds[r.id] = true; seenKeys[key] = true;

      var norm = RESULT_MAP[r.result];
      if (!norm && r.result) norm = RESULT_MAP[r.result.toLowerCase()];
      if (!norm) { q.flags.invalidResult++; q.excluded++; return; }
      r.result = norm;
      r.status = (norm === '待评分') ? '未评分' : (r.status || '已评分');
      if (!r.submittedAt) { q.flags.missingTime++; r.flag = '时间缺失'; }

      r.graded = (norm === '正确' || norm === '错误');
      r.answered = (norm !== '未作答');
      r.correct = norm === '正确';
      if (q.bySource[r.source] === undefined) q.bySource[r.source] = 0;
      q.bySource[r.source]++;
      q.usable++;
      cleaned.push(r);
    });

    q.rules = [
      { name: '完整性缺失（学生编号 / 材料编号为空）', count: q.flags.missingStudent + q.flags.missingMaterial, handling: '无法归属到具体学生或材料，整条剔除，并计入缺失说明。' },
      { name: '关联失败（学生或材料不在基础表）', count: q.flags.orphanStudent + q.flags.orphanMaterial, handling: '不能与课程材料或学生建立联系，剔除；不据此推断任何学习结论。' },
      { name: '重复记录（重复编号或重复作答键）', count: q.flags.duplicate, handling: '保留首次出现的记录，其余剔除；重复不影响统计口径。' },
      { name: '取值异常（作答结果不在约定取值域）', count: q.flags.invalidResult, handling: '剔除该记录，不把异常值当作错误作答；同时提示数据提供方核查。' },
      { name: '时间字段缺失', count: q.flags.missingTime, handling: '保留记录参与掌握度统计，仅不参与时间维度分析，并标记“时间缺失”。' }
    ];
    q.usableRate = q.total ? q.usable / q.total : 0;
    q.cleaned = cleaned;
    return q;
  };

  S.adjustmentRecords = function (state, limit) {
    var adj = (state.adjustments || []).slice(0, limit === undefined ? undefined : limit);
    return adj.map(function (a, i) {
      return {
        id: 'ADJ-' + String(i + 1).padStart(3, '0'),
        studentId: a.studentId, materialId: a.materialId,
        result: a.result, status: (a.result === '待评分' ? '未评分' : '已评分'),
        attempt: a.attempt || 1, submittedAt: a.at, source: '补充记录', note: a.note || ''
      };
    });
  };

  /* 模型 */
  S.buildModel = function (state, adjLimit) {
    var students = state.students, materials = state.materials;
    var studentMap = {}, materialMap = {};
    students.forEach(function (s) { studentMap[s.id] = s; });
    materials.forEach(function (m) { materialMap[m.id] = m; });

    var rawRecords = state.records.concat(S.adjustmentRecords(state, adjLimit));
    var quality = S.cleanRecords(rawRecords, studentMap, materialMap);
    var records = quality.cleaned;
    delete quality.cleaned;

    var byStudent = {}, byStudentMaterial = {};
    records.forEach(function (r) {
      (byStudent[r.studentId] = byStudent[r.studentId] || []).push(r);
      byStudentMaterial[r.studentId] = byStudentMaterial[r.studentId] || {};
      byStudentMaterial[r.studentId][r.materialId] = r;
    });

    var profiles = students.map(function (stu) {
      var list = byStudent[stu.id] || [];
      var graded = list.filter(function (r) { return r.graded; });
      var correct = graded.filter(function (r) { return r.correct; }).length;
      var overallRate = graded.length ? correct / graded.length : null;
      var prior = overallRate === null ? 0.55 : overallRate;

      var kps = {};
      S.kps.forEach(function (kp) {
        var kpRecs = list.filter(function (r) {
          var m = materialMap[r.materialId];
          return m && m.kpIds.indexOf(kp.id) >= 0;
        });
        var kGraded = kpRecs.filter(function (r) { return r.graded; });
        var c = kGraded.filter(function (r) { return r.correct; }).length;
        var rate = kGraded.length ? c / kGraded.length : null;
        var mastery = (c + PRIOR_WEIGHT * prior) / (kGraded.length + PRIOR_WEIGHT);
        kps[kp.id] = {
          id: kp.id, name: kp.name, topicId: kp.topicId,
          n: kGraded.length, correct: c, wrong: kGraded.length - c,
          unanswered: kpRecs.filter(function (r) { return r.result === '未作答'; }).length,
          pending: kpRecs.filter(function (r) { return r.result === '待评分'; }).length,
          total: kpRecs.length, rate: rate, mastery: mastery,
          level: S.levelOf(mastery, kGraded.length),
          tentative: (kGraded.length > 0 && kGraded.length < STABLE_N)
            ? (mastery >= MASTER_LINE ? 'mastered' : mastery >= CONSOLIDATE_LINE ? 'consolidate' : 'weak') : null,
          recordIds: kpRecs.map(function (r) { return r.id; }),
          materialIds: kpRecs.map(function (r) { return r.materialId; }),
          coverage: kGraded.length >= STABLE_N ? '充分' : kGraded.length ? '有限' : '无'
        };
      });

      var topicStats = S.topics.map(function (t) {
        var ids = S.kps.filter(function (k) { return k.topicId === t.id; }).map(function (k) { return k.id; });
        var ev = ids.map(function (i) { return kps[i]; }).filter(function (k) { return k.n >= 1; });
        var mean = ev.length ? ev.reduce(function (a, k) { return a + k.mastery; }, 0) / ev.length : null;
        var n = ev.reduce(function (a, k) { return a + k.n; }, 0);
        var c = ev.reduce(function (a, k) { return a + k.correct; }, 0);
        return { id: t.id, name: t.name, color: t.color, mastery: mean, n: n, rate: n ? c / n : null, covered: ev.length, total: ids.length };
      });

      var strengths = [], weaknesses = [], unverified = [];
      S.kps.forEach(function (kp) {
        var st = kps[kp.id];
        if (st.level === 'mastered') strengths.push(st);
        else if (st.level === 'weak' || st.level === 'consolidate') weaknesses.push(st);
        if (st.n < STABLE_N) unverified.push(st);
      });
      weaknesses.sort(function (a, b) { return a.mastery - b.mastery; });

      var coverageCount = S.kps.filter(function (kp) { return kps[kp.id].n >= 1; }).length;
      var answered = list.filter(function (r) { return r.answered; }).length;

      return {
        id: stu.id, name: stu.name, classId: stu.classId, class: stu.class, practice: stu.practice,
        records: list, graded: graded,
        overall: {
          total: list.length, graded: graded.length, correct: correct, rate: overallRate,
          answeredRate: list.length ? answered / list.length : null,
          unanswered: list.filter(function (r) { return r.result === '未作答'; }).length,
          pending: list.filter(function (r) { return r.result === '待评分'; }).length
        },
        kps: kps, topicStats: topicStats, strengths: strengths, weaknesses: weaknesses, unverified: unverified,
        coverage: { kps: coverageCount, total: S.kps.length, ratio: coverageCount / S.kps.length },
        attention: weaknesses.filter(function (k) {
          var kp = S.kps.filter(function (x) { return x.id === k.id; })[0];
          return kp.importance >= 3;
        }).length,
        hasAdjustment: list.some(function (r) { return r.source === '补充记录'; })
      };
    });

    var profById = {};
    profiles.forEach(function (p) { profById[p.id] = p; });

    var classIds = students.map(function (s) { return s.classId; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var classes = classIds.map(function (cid) {
      var members = profiles.filter(function (p) { return p.classId === cid; });
      var rates = members.map(function (p) { return p.overall.rate; }).filter(function (v) { return v !== null; });
      var avgRate = rates.length ? rates.reduce(function (a, b) { return a + b; }, 0) / rates.length : null;
      var cover = members.length ? members.reduce(function (a, p) { return a + p.coverage.ratio; }, 0) / members.length : 0;
      var kps = {};
      S.kps.forEach(function (kp) {
        var assessed = members.filter(function (p) { return p.kps[kp.id].n >= 1; });
        var stable = assessed.filter(function (p) { return p.kps[kp.id].n >= STABLE_N; });
        var mean = assessed.length ? assessed.reduce(function (a, p) { return a + p.kps[kp.id].mastery; }, 0) / assessed.length : null;
        var weak = assessed.filter(function (p) { return p.kps[kp.id].level === 'weak'; }).length;
        kps[kp.id] = {
          mean: mean, assessed: assessed.length, stable: stable.length,
          weakShare: assessed.length ? weak / assessed.length : 0,
          coverageRate: members.length ? assessed.length / members.length : 0
        };
      });
      return { id: cid, name: members[0] ? members[0].class : cid, n: members.length, avgRate: avgRate, coverage: cover, kps: kps, members: members.map(function (p) { return p.id; }) };
    });

    var commonIssues = [], evidenceGaps = [], differences = [];
    S.kps.forEach(function (kp) {
      var assessed = profiles.filter(function (p) { return p.kps[kp.id].n >= 1; });
      var mean = assessed.length ? assessed.reduce(function (a, p) { return a + p.kps[kp.id].mastery; }, 0) / assessed.length : null;
      var weakCount = assessed.filter(function (p) { return p.kps[kp.id].level === 'weak'; }).length;
      var unver = profiles.filter(function (p) { return p.kps[kp.id].n < STABLE_N; }).length;
      var totalN = profiles.reduce(function (a, p) { return a + p.kps[kp.id].n; }, 0);
      var coverRate = profiles.length ? assessed.length / profiles.length : 0;
      if (assessed.length >= 5 && mean !== null && (mean < 0.62 || weakCount / assessed.length >= 0.4)) {
        commonIssues.push({ id: kp.id, name: kp.name, topicId: kp.topicId, mean: mean, weakShare: weakCount / assessed.length, weakCount: weakCount, assessed: assessed.length });
      }
      if (assessed.length >= 1 && (coverRate < 0.6 || totalN < 10)) {
        evidenceGaps.push({ id: kp.id, name: kp.name, topicId: kp.topicId, unverified: unver, assessed: assessed.length, totalN: totalN, coverage: coverRate });
      }
      var means = classes.map(function (c) { return c.kps[kp.id].assessed >= 3 ? c.kps[kp.id].mean : null; }).filter(function (v) { return v !== null; });
      if (means.length >= 2) {
        var spread = Math.max.apply(null, means) - Math.min.apply(null, means);
        if (spread >= 0.10) differences.push({ id: kp.id, name: kp.name, spread: spread, detail: classes.map(function (c) { return c.name + ' ' + S.pct(c.kps[kp.id].mean, 0); }).join(' · ') });
      }
    });
    commonIssues.sort(function (a, b) { return a.mean - b.mean; });

    var classRates = classes.map(function (c) { return c.avgRate; }).filter(function (v) { return v !== null; });
    var classSpread = classRates.length >= 2 ? Math.max.apply(null, classRates) - Math.min.apply(null, classRates) : 0;
    var practiceGroups = ['高', '中', '低'].map(function (lv) {
      var ms = profiles.filter(function (p) { return p.practice === lv && p.overall.rate !== null; });
      var mean = ms.length ? ms.reduce(function (a, p) { return a + p.overall.rate; }, 0) / ms.length : null;
      return { level: lv, n: ms.length, mean: mean };
    });

    var overall = {
      students: profiles.length, records: rawRecords.length, usable: records.length,
      graded: records.filter(function (r) { return r.graded; }).length,
      unanswered: records.filter(function (r) { return r.result === '未作答'; }).length,
      pending: records.filter(function (r) { return r.result === '待评分'; }).length,
      avgRate: (function () {
        var withR = profiles.filter(function (p) { return p.overall.rate !== null; });
        return withR.length ? withR.reduce(function (a, p) { return a + p.overall.rate; }, 0) / withR.length : null;
      })(),
      coverage: profiles.reduce(function (a, p) { return a + p.coverage.ratio; }, 0) / (profiles.length || 1),
      attention: profiles.filter(function (p) { return p.attention >= 2 || p.coverage.ratio < 0.4; }).length,
      commonIssues: commonIssues.length, evidenceGaps: evidenceGaps.length,
      adjustments: (state.adjustments || []).length, classSpread: classSpread
    };

    return {
      state: state, adjLimit: adjLimit, students: profiles, byId: profById, classes: classes,
      records: records, gradedRecords: records.filter(function (r) { return r.graded; }),
      byStudent: byStudent, byStudentMaterial: byStudentMaterial, materials: materialMap,
      quality: quality, commonIssues: commonIssues, evidenceGaps: evidenceGaps, differences: differences,
      practiceGroups: practiceGroups, overall: overall
    };
  };

  var TYPE_ORDER = {
    remedial: { '错因诊断': 0, '例题': 1, '练习': 2, '变式': 3, '探究': 4 },
    consolidate: { '例题': 0, '练习': 1, '错因诊断': 2, '变式': 3, '探究': 4 },
    extend: { '变式': 0, '探究': 1, '练习': 2, '例题': 3, '错因诊断': 4 }
  };

  function pickMaterials(model, prof, kpId, stage, limit) {
    var list = S.materials.filter(function (m) { return m.kpIds.indexOf(kpId) >= 0; });
    var stuRecs = model.byStudentMaterial[prof.id] || {};
    list.sort(function (a, b) {
      var ar = stuRecs[a.id], br = stuRecs[b.id];
      var aw = ar && ar.result === '错误' ? 0 : ar && ar.result === '未作答' ? 1 : ar && ar.result === '正确' ? 5 : 2;
      var bw = br && br.result === '错误' ? 0 : br && br.result === '未作答' ? 1 : br && br.result === '正确' ? 5 : 2;
      if (aw !== bw) return aw - bw;
      var at = (TYPE_ORDER[stage] || TYPE_ORDER.consolidate)[a.type] || 3;
      var bt = (TYPE_ORDER[stage] || TYPE_ORDER.consolidate)[b.type] || 3;
      if (at !== bt) return at - bt;
      return a.difficulty - b.difficulty;
    });
    var picked = [];
    for (var i = 0; i < list.length && picked.length < limit; i++) {
      var rec = stuRecs[list[i].id];
      if (rec && rec.result === '正确' && picked.length >= 1) continue;
      picked.push(list[i]);
    }
    return picked;
  }

  function evidenceFor(model, prof, kpId, materialId) {
    var kp = prof.kps[kpId];
    var recs = (model.byStudent[prof.id] || []).filter(function (r) { return r.materialId === materialId; });
    return {
      kpId: kpId, kpName: kp.name,
      summary: kp.n ? ('已评分 ' + kp.n + ' 条，正确 ' + kp.correct + ' 条，掌握度 ' + kp.mastery.toFixed(2)) : '暂无已评分记录',
      recordIds: recs.map(function (r) { return r.id + '（' + r.result + '）'; }),
      n: kp.n, correct: kp.correct, mastery: kp.mastery, level: kp.level
    };
  }

  function reasonFor(prof, kpId, m, stage) {
    var k = prof.kps[kpId], head;
    if (k.n === 0) head = '该知识点暂无评分记录，先完成诊断性材料以获取证据，暂不判定为未掌握';
    else if (k.n < STABLE_N) head = '该知识点证据有限（' + k.n + ' 条），初判正确率 ' + S.pct(k.rate, 0) + '，需补充观察后再调整';
    else head = '该知识点已评分 ' + k.n + ' 条，正确率 ' + S.pct(k.rate, 0) + '，掌握度 ' + k.mastery.toFixed(2) + '（' + S.LEVELS[k.level].label + '）';
    var why = {
      remedial: '处于前置知识补建环节，先修正典型错误再进入后续内容',
      consolidate: '针对薄弱环节的核心练习，按“讲解—模仿—独立完成”顺序推进',
      extend: '在已具备基础后做变式迁移，检验规则在新情境中的稳定性'
    }[stage];
    var reqs = S.requirements.filter(function (r) { return r.kpIds.indexOf(kpId) >= 0; }).map(function (r) { return r.id; });
    return head + '；' + why + '。材料为' + m.type + '（难度 ' + m.difficulty + '，约 ' + m.estMin + ' 分钟），对应要求 ' + (reqs.join('、') || '—') + '。';
  }

  function addItem(model, prof, kpId, m, stage, used, pool) {
    if (used[m.id]) return;
    used[m.id] = true;
    pool.push({
      materialId: m.id, title: m.title, type: m.type, difficulty: m.difficulty, estMin: m.estMin,
      kpId: kpId, kpName: prof.kps[kpId].name, stage: stage,
      reason: reasonFor(prof, kpId, m, stage), evidence: evidenceFor(model, prof, kpId, m.id)
    });
  }

  /* 建议 */
  S.recommend = function (model, studentId) {
    var prof = model.byId[studentId];
    if (!prof) return null;

    var kpOrder = S.kps.map(function (k) { return k.id; });
    var evaluated = S.kps.map(function (kp) { return prof.kps[kp.id]; });
    var diagnostics = evaluated.filter(function (k) {
      var kp = S.kps.filter(function (x) { return x.id === k.id; })[0];
      return k.n < STABLE_N && kp.importance >= 2;
    }).sort(function (a, b) { return b.n - a.n; });
    var weak = evaluated.filter(function (k) { return k.level === 'weak'; }).sort(function (a, b) { return a.mastery - b.mastery; });
    var consolidate = evaluated.filter(function (k) { return k.level === 'consolidate'; }).sort(function (a, b) { return a.mastery - b.mastery; });
    var mastered = evaluated.filter(function (k) { return k.level === 'mastered'; });

    var prereqIds = [];
    weak.concat(consolidate).forEach(function (k) {
      var kp = S.kps.filter(function (x) { return x.id === k.id; })[0];
      kp.prerequisites.forEach(function (pid) {
        if (prof.kps[pid] && prof.kps[pid].mastery < 0.70 && prereqIds.indexOf(pid) < 0) prereqIds.push(pid);
      });
    });
    prereqIds = prereqIds.filter(function (pid) { return prof.kps[pid].level !== 'mastered'; })
      .sort(function (a, b) { return kpOrder.indexOf(a) - kpOrder.indexOf(b); });

    var phases = [], used = {};
    if (prereqIds.length) {
      var preItems = [];
      prereqIds.slice(0, 2).forEach(function (pid) {
        pickMaterials(model, prof, pid, 'remedial', 2).forEach(function (m) { addItem(model, prof, pid, m, 'remedial', used, preItems); });
      });
      if (preItems.length) phases.push({
        key: 'remedial', title: '阶段一 · 前置知识补建',
        goal: '先补齐影响后续学习的前置知识点，降低后续练习的挫败感与错误迁移。',
        kpIds: prereqIds.slice(0, 2), items: preItems
      });
    }
    if (weak.length) {
      var coreItems = [];
      weak.slice(0, 2).forEach(function (k) {
        pickMaterials(model, prof, k.id, 'consolidate', 2).forEach(function (m) { addItem(model, prof, k.id, m, 'consolidate', used, coreItems); });
      });
      if (coreItems.length) phases.push({
        key: 'consolidate', title: '阶段二 · 薄弱内容巩固',
        goal: '针对正确率最低的知识点，用讲解性材料与同类练习形成稳定程序。',
        kpIds: weak.slice(0, 2).map(function (k) { return k.id; }), items: coreItems
      });
    }
    var extendItems = [];
    consolidate.slice(0, 2).forEach(function (k) {
      pickMaterials(model, prof, k.id, 'extend', 1).forEach(function (m) { addItem(model, prof, k.id, m, 'extend', used, extendItems); });
    });
    if (!extendItems.length && mastered.length) {
      var target = mastered.sort(function (a, b) { return b.mastery - a.mastery; })[0];
      pickMaterials(model, prof, target.id, 'extend', 1).forEach(function (m) { addItem(model, prof, target.id, m, 'extend', used, extendItems); });
    }
    if (extendItems.length) phases.push({
      key: 'extend', title: '阶段三 · 变式迁移与提升',
      goal: '把已建立的规则迁移到新情境，检验稳定性和表达完整性。',
      kpIds: consolidate.slice(0, 2).map(function (k) { return k.id; }), items: extendItems
    });

    var diagItems = [];
    diagnostics.slice(0, 2).forEach(function (k) {
      pickMaterials(model, prof, k.id, 'consolidate', 1).forEach(function (m) { addItem(model, prof, k.id, m, 'diagnose', used, diagItems); });
    });

    var totalMin = phases.concat([{ items: diagItems }]).reduce(function (a, p) {
      return a + p.items.reduce(function (x, it) { return x + it.estMin; }, 0);
    }, 0);

    var teacherNotes = [
      '时间安排：建议分 2 次完成（每次约 ' + Math.max(15, Math.round(totalMin / 2 / 5) * 5) + ' 分钟），阶段一、二优先，阶段三可视课堂时间弹性处理。',
      '观察点：阶段二完成后，重点关注同类题中的符号处理与运算顺序是否稳定；记录错误类型而不只统计对错。'
    ];
    if (prof.kps['E4'] && prof.kps['E4'].n >= STABLE_N && prof.kps['E4'].mastery < 0.6) {
      teacherNotes.push('建模类问题（E4）表现偏弱时，可先让学生口述“设什么、等量关系是什么”，再动笔列式，减少直接套公式。');
    }
    if (prof.coverage.ratio < 0.5) {
      teacherNotes.push('该生可评估知识点仅覆盖 ' + Math.round(prof.coverage.ratio * 100) + '%，建议先完成诊断任务，两周内补 3—5 条有效记录后再复核建议。');
    }
    if (prof.overall.unanswered >= 3) {
      teacherNotes.push('存在 ' + prof.overall.unanswered + ' 条“未作答”记录，需区分“时间不足”“不会做”“未提交”，不宜直接记为未掌握。');
    }
    teacherNotes.push('调整条件：若阶段二同类练习正确率达到 80% 以上，可跳过阶段三第 1 项；若仍低于 50%，回到阶段一重做错因诊断材料。');

    var sb = [];
    sb.push(prof.name + '（' + prof.class + '）共 ' + prof.overall.total + ' 条记录，可评分 ' + prof.overall.graded + ' 条，整体正确率 ' + S.pct(prof.overall.rate, 0) + '。');
    if (prof.strengths.length) sb.push('相对稳定的知识点为' + prof.strengths.slice(0, 3).map(function (k) { return k.name; }).join('、') + '。');
    if (weak.length) sb.push('需要优先巩固的是' + weak.slice(0, 2).map(function (k) { return k.name + '（掌握度 ' + k.mastery.toFixed(2) + '）'; }).join('、') + '。');
    if (diagnostics.length) sb.push(diagnostics.slice(0, 2).map(function (k) { return k.name; }).join('、') + ' 的评分记录不足 3 条，本次不作掌握与否的结论，先安排诊断任务。');
    sb.push('建议按“前置补建—薄弱巩固—变式迁移”的顺序完成 ' + (phases.reduce(function (a, p) { return a + p.items.length; }, 0) + diagItems.length) + ' 项任务，预计 ' + totalMin + ' 分钟。');

    return {
      student: prof, phases: phases, diagnostics: diagItems, weak: weak, consolidate: consolidate,
      teacherNotes: teacherNotes, summary: sb.join(''), totalMin: totalMin,
      stats: {
        graded: prof.overall.graded, rate: prof.overall.rate, coverage: prof.coverage.ratio,
        items: phases.reduce(function (a, p) { return a + p.items.length; }, 0) + diagItems.length
      }
    };
  };

  /* 核对 */
  S.traceability = function (model, studentId, topicId) {
    var prof = model.byId[studentId];
    if (!prof) return [];
    var rec = S.recommend(model, studentId), rows = [];
    S.requirements.filter(function (r) { return !topicId || r.topicId === topicId; }).forEach(function (req) {
      var kpStats = req.kpIds.map(function (kid) { return prof.kps[kid]; });
      var n = kpStats.reduce(function (a, k) { return a + k.n; }, 0);
      var c = kpStats.reduce(function (a, k) { return a + k.correct; }, 0);
      var materials = S.materials.filter(function (m) {
        return m.kpIds.some(function (kid) { return req.kpIds.indexOf(kid) >= 0; });
      });
      var recItems = [];
      rec.phases.concat([{ items: rec.diagnostics }]).forEach(function (p) {
        p.items.forEach(function (it) { if (req.kpIds.indexOf(it.kpId) >= 0) recItems.push(it.materialId); });
      });
      var level = kpStats.length === 1 ? kpStats[0].level
        : (n >= STABLE_N ? (c / n >= MASTER_LINE ? 'mastered' : c / n >= CONSOLIDATE_LINE ? 'consolidate' : 'weak') : (n ? 'unverified' : 'none'));
      rows.push({
        reqId: req.id, reqText: req.text, levelReq: req.level, topicId: req.topicId,
        kpIds: req.kpIds, kpNames: kpStats.map(function (k) { return k.name; }),
        n: n, correct: c, rate: n ? c / n : null,
        mastery: kpStats.length === 1 ? kpStats[0].mastery : (n ? kpStats.reduce(function (a, k) { return a + k.mastery; }, 0) / kpStats.length : null),
        level: level, levelLabel: S.LEVELS[level].label,
        materialIds: materials.map(function (m) { return m.id; }).slice(0, 6), materialTotal: materials.length,
        suggestionIds: recItems.filter(function (v, i, a) { return a.indexOf(v) === i; }),
        evidenceRecordIds: kpStats[0] ? kpStats[0].recordIds.slice(0, 8) : [],
        source: req.source, locator: req.locator
      });
    });
    return rows;
  };

  S.keyStats = function (model, studentId) {
    var q = model.quality, o = model.overall, prof = studentId ? model.byId[studentId] : null;
    var rows = [
      { name: '输入记录总数', value: q.total, method: '导入/内置记录逐条计数，含重复与异常记录', where: '数据导入 › 质量报告' },
      { name: '可用记录数', value: q.usable, method: '剔除完整性缺失、关联失败、重复与取值异常后的记录数', where: '学情诊断 › 数据质量' },
      { name: '记录可用率', value: S.pct(q.usableRate, 1), method: '可用记录数 ÷ 输入记录总数', where: '概览 › 数据质量' },
      { name: '已评分记录数', value: o.graded, method: '作答结果为“正确”或“错误”的记录', where: '学情诊断 › 数据质量' },
      { name: '未作答记录数', value: o.unanswered, method: '作答结果为“未作答”，计入完成情况但不计入正确率', where: '学情诊断 › 数据质量' },
      { name: '待评分记录数', value: o.pending, method: '需要人工或规则评分，暂不参与掌握度估计', where: '学情诊断 › 数据质量' },
      { name: '群体平均正确率', value: S.pct(o.avgRate, 1), method: '各学生正确率（正确数÷已评分数）的算术平均', where: '学情诊断 › 群体分析' },
      { name: '知识点平均覆盖率', value: S.pct(o.coverage, 1), method: '有至少 1 条已评分记录的知识点数 ÷ 14，再对学生取平均', where: '学情诊断 › 群体分析' },
      { name: '共性问题知识点数', value: o.commonIssues, method: '已评估人数 ≥5 且（平均掌握度 <0.62 或薄弱占比 ≥40%）', where: '学情诊断 › 群体分析' },
      { name: '证据不足知识点数', value: o.evidenceGaps, method: '有评分记录学生不足 60% 或总评分记录少于 10 条的知识点数', where: '学情诊断 › 群体分析' }
    ];
    if (prof) {
      rows.push({ name: '该生已评分记录', value: prof.overall.graded, method: '该生记录中结果为正确或错误的条数', where: '学情诊断 › 个体画像' });
      rows.push({ name: '该生整体正确率', value: S.pct(prof.overall.rate, 1), method: '该生正确记录数 ÷ 已评分记录数', where: '学情诊断 › 个体画像' });
      rows.push({ name: '该生可评估知识点', value: prof.coverage.kps + ' / 14', method: '至少 1 条已评分记录的知识点数', where: '学情诊断 › 个体画像' });
    }
    return rows;
  };

  S.diffRecommendation = function (before, after) {
    var bIds = {}, aIds = {};
    (before ? before.phases.concat([{ items: before.diagnostics }]) : []).forEach(function (p) {
      p.items.forEach(function (it) { bIds[it.materialId] = it; });
    });
    (after ? after.phases.concat([{ items: after.diagnostics }]) : []).forEach(function (p) {
      p.items.forEach(function (it) { aIds[it.materialId] = it; });
    });
    var added = Object.keys(aIds).filter(function (id) { return !bIds[id]; }).map(function (id) { return aIds[id]; });
    var removed = Object.keys(bIds).filter(function (id) { return !aIds[id]; }).map(function (id) { return bIds[id]; });
    var kept = Object.keys(aIds).filter(function (id) { return bIds[id]; }).length;
    var changes = [];
    if (before && after) {
      S.kps.forEach(function (kp) {
        var b = before.student.kps[kp.id], a = after.student.kps[kp.id];
        if (Math.abs(a.mastery - b.mastery) > 0.001 || a.level !== b.level) {
          changes.push({
            id: kp.id, name: kp.name, before: b.mastery, after: a.mastery,
            beforeN: b.n, afterN: a.n, beforeLevel: b.level, afterLevel: a.level, delta: a.mastery - b.mastery
          });
        }
      });
    }
    return { added: added, removed: removed, kept: kept, changes: changes };
  };
})(window.SLC);
