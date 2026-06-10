export const CacheKeys = {
  // ── Dashboards ──────────────────────────────────────────────────────────────
  parentDashboard:  (userId: string, childId: string) => `dash:ph:${userId}:${childId}`,
  teacherDashboard: (teacherId: string)               => `dash:gv:${teacherId}`,
  bghDashboard:     (schoolId: string)                => `dash:bgh:${schoolId}`,

  // ── Learning DNA ─────────────────────────────────────────────────────────────
  learningDNA:      (childId: string)                 => `dna:${childId}`,

  // ── Summaries & Scores ───────────────────────────────────────────────────────
  weeklySummary:    (childId: string, weekStart: string) => `summary:${childId}:${weekStart}`,
  subjectScores:    (childId: string)                 => `scores:${childId}`,

  // ── Quiz ─────────────────────────────────────────────────────────────────────
  quizList:         (teacherId: string)               => `quiz:list:${teacherId}`,
  quizDetail:       (quizId: string)                  => `quiz:${quizId}`,

  // ── Feature flags ────────────────────────────────────────────────────────────
  featureFlags:     ()                                => `flags:all`,
  featureFlag:      (key: string)                     => `flags:${key}`,

  // ── Rate limiting ────────────────────────────────────────────────────────────
  rateLimit:        (userId: string, action: string)  => `rl:${action}:${userId}`,
  rateLimitAnon:    (ip: string,     action: string)  => `rl:${action}:anon:${ip}`,

  // ── BGH ──────────────────────────────────────────────────────────────────────
  schoolKPI:        (schoolId: string)                => `kpi:${schoolId}`,
} as const

/** TTL constants in seconds */
export const TTL = {
  dashboard:     60 * 5,        // 5 min
  learningDNA:   60 * 60,       // 1 h
  weeklySummary: 60 * 60 * 24,  // 24 h
  featureFlags:  60 * 10,       // 10 min
  schoolKPI:     60 * 15,       // 15 min
  quizList:      60 * 2,        // 2 min
} as const
