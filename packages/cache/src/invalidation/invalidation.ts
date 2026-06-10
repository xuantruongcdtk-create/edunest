import { cacheDel, cacheDelPattern } from '../operations/cache.ops'
import { CacheKeys } from '../keys/cache.keys'

export async function invalidateChildCache(childId: string, userId: string): Promise<void> {
  await Promise.all([
    cacheDel(CacheKeys.learningDNA(childId)),
    cacheDel(CacheKeys.subjectScores(childId)),
    cacheDelPattern(`summary:${childId}:*`),
    cacheDel(CacheKeys.parentDashboard(userId, childId)),
  ])
}

export async function invalidateTeacherCache(teacherId: string): Promise<void> {
  await Promise.all([
    cacheDel(CacheKeys.teacherDashboard(teacherId)),
    cacheDel(CacheKeys.quizList(teacherId)),
  ])
}

export async function invalidateSchoolCache(schoolId: string): Promise<void> {
  await cacheDel(CacheKeys.schoolKPI(schoolId))
}

export async function invalidateFeatureFlags(): Promise<void> {
  await cacheDel(CacheKeys.featureFlags())
}
