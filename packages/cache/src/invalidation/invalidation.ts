import { cacheDel, cacheDelPattern } from '../operations/cache.ops'
import { CacheKeys } from '../keys/cache.keys'

async function safeInvalidate(...ops: Promise<unknown>[]): Promise<void> {
  await Promise.allSettled(ops)
}

export async function invalidateChildCache(childId: string, userId: string): Promise<void> {
  await safeInvalidate(
    cacheDel(CacheKeys.learningDNA(childId)),
    cacheDel(CacheKeys.subjectScores(childId)),
    cacheDelPattern(`summary:${childId}:*`),
    cacheDel(CacheKeys.parentDashboard(userId, childId)),
  )
}

export async function invalidateTeacherCache(teacherId: string): Promise<void> {
  await safeInvalidate(
    cacheDel(CacheKeys.teacherDashboard(teacherId)),
    cacheDel(CacheKeys.quizList(teacherId)),
  )
}

export async function invalidateSchoolCache(schoolId: string): Promise<void> {
  await safeInvalidate(cacheDel(CacheKeys.schoolKPI(schoolId)))
}

export async function invalidateFeatureFlags(): Promise<void> {
  await safeInvalidate(cacheDel(CacheKeys.featureFlags()))
}
