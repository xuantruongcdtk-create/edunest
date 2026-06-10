-- =============================================================================
-- EduNest — Full Database Schema
-- 27 tables · RLS policies · Indexes · Triggers
-- Run once against a fresh Supabase project
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS  (idempotent — safe to re-run)
-- =============================================================================
DO $$ BEGIN CREATE TYPE public.user_role AS ENUM ('parent','teacher','bgh','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.plan_tier AS ENUM ('free','basic','pro','school');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.plan_status AS ENUM ('active','expired','trial','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.subject_enum AS ENUM (
  'math','literature','english','physics',
  'chemistry','biology','history','geography','civics','informatics'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.period_type AS ENUM ('weekly','monthly','semester');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.quiz_difficulty AS ENUM ('easy','medium','hard');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.quiz_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.payment_provider AS ENUM ('momo','vnpay','payos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.payment_status AS ENUM ('pending','success','failed','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.alert_severity AS ENUM ('info','warning','danger');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.alert_type AS ENUM (
  'score_drop','missed_quiz','burnout_risk','improvement','goal_reached'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.burnout_risk AS ENUM ('low','medium','high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.learning_style AS ENUM ('visual','auditory','reading','kinesthetic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.notif_channel AS ENUM ('push','email','in_app');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.notif_status AS ENUM ('pending','sent','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.invite_status AS ENUM ('pending','accepted','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.referral_status AS ENUM ('pending','converted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.ocr_status AS ENUM ('queued','processing','done','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.export_format AS ENUM ('pdf','excel');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.sub_status AS ENUM ('active','cancelled','past_due','trialing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- DROP ALL TABLES (clean slate — CASCADE handles FK order automatically)
-- =============================================================================
DROP TABLE IF EXISTS public.ocr_jobs              CASCADE;
DROP TABLE IF EXISTS public.report_exports        CASCADE;
DROP TABLE IF EXISTS public.audit_logs            CASCADE;
DROP TABLE IF EXISTS public.feature_flags         CASCADE;
DROP TABLE IF EXISTS public.school_invites        CASCADE;
DROP TABLE IF EXISTS public.referrals             CASCADE;
DROP TABLE IF EXISTS public.subscriptions         CASCADE;
DROP TABLE IF EXISTS public.payment_transactions  CASCADE;
DROP TABLE IF EXISTS public.push_tokens           CASCADE;
DROP TABLE IF EXISTS public.notifications         CASCADE;
DROP TABLE IF EXISTS public.alerts                CASCADE;
DROP TABLE IF EXISTS public.study_sessions        CASCADE;
DROP TABLE IF EXISTS public.weekly_summaries      CASCADE;
DROP TABLE IF EXISTS public.learning_dna          CASCADE;
DROP TABLE IF EXISTS public.coach_conversations   CASCADE;
DROP TABLE IF EXISTS public.quiz_attempts         CASCADE;
DROP TABLE IF EXISTS public.quiz_assignments      CASCADE;
DROP TABLE IF EXISTS public.quiz_questions        CASCADE;
DROP TABLE IF EXISTS public.quizzes               CASCADE;
DROP TABLE IF EXISTS public.score_targets         CASCADE;
DROP TABLE IF EXISTS public.score_records         CASCADE;
DROP TABLE IF EXISTS public.teacher_students      CASCADE;
DROP TABLE IF EXISTS public.class_memberships     CASCADE;
DROP TABLE IF EXISTS public.children              CASCADE;
DROP TABLE IF EXISTS public.classes               CASCADE;
DROP TABLE IF EXISTS public.profiles              CASCADE;
DROP TABLE IF EXISTS public.schools               CASCADE;

-- =============================================================================
-- TABLE 1: profiles  (extends auth.users 1-to-1)
-- =============================================================================
CREATE TABLE public.profiles (
  id                uuid         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             text         NOT NULL UNIQUE,
  full_name         text         NOT NULL,
  role              public.user_role  NOT NULL DEFAULT 'parent',
  avatar_url        text,
  phone             text,
  school_id         uuid,                          -- FK added after TABLE 2
  plan_tier         public.plan_tier   NOT NULL DEFAULT 'free',
  plan_status       public.plan_status NOT NULL DEFAULT 'trial',
  plan_expires_at   timestamptz,
  referral_code     text         NOT NULL UNIQUE
                    DEFAULT upper(substring(gen_random_uuid()::text FROM 1 FOR 8)),
  referred_by       uuid         REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE 2: schools
-- =============================================================================
CREATE TABLE public.schools (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text         NOT NULL,
  address           text,
  district          text,
  province          text         NOT NULL DEFAULT 'Hà Nội',
  phone             text,
  website           text,
  plan_tier         public.plan_tier NOT NULL DEFAULT 'free',
  plan_expires_at   timestamptz,
  student_count     integer      NOT NULL DEFAULT 0 CHECK (student_count >= 0),
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS fk_profiles_school;
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_school
  FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;

-- =============================================================================
-- TABLE 3: classes
-- =============================================================================
CREATE TABLE public.classes (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         uuid         REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id        uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name              text         NOT NULL,          -- "12A1"
  grade             smallint     NOT NULL CHECK (grade BETWEEN 1 AND 12),
  academic_year     text         NOT NULL,          -- "2025-2026"
  student_count     integer      NOT NULL DEFAULT 0,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE 4: children
-- =============================================================================
CREATE TABLE public.children (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id         uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name         text         NOT NULL,
  grade             smallint     NOT NULL CHECK (grade BETWEEN 1 AND 12),
  school_id         uuid         REFERENCES public.schools(id) ON DELETE SET NULL,
  avatar_url        text,
  date_of_birth     date,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE 5: class_memberships
-- =============================================================================
CREATE TABLE public.class_memberships (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id          uuid         NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  child_id          uuid         NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  joined_at         timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (class_id, child_id)
);

-- =============================================================================
-- TABLE 6: teacher_students  (direct link, without a class)
-- =============================================================================
CREATE TABLE public.teacher_students (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id        uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id          uuid         NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  subject           public.subject_enum,             -- NULL = all subjects
  created_at        timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, child_id, subject)
);

-- =============================================================================
-- TABLE 7: score_records
-- =============================================================================
CREATE TABLE public.score_records (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id          uuid         NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  created_by        uuid         NOT NULL REFERENCES public.profiles(id),
  subject           public.subject_enum NOT NULL,
  score             numeric(5,2) NOT NULL CHECK (score >= 0),
  max_score         numeric(5,2) NOT NULL DEFAULT 10 CHECK (max_score > 0),
  period_type       public.period_type  NOT NULL,
  semester          smallint     NOT NULL CHECK (semester IN (1,2)),
  academic_year     text         NOT NULL,
  exam_date         date         NOT NULL,
  source            text         NOT NULL DEFAULT 'manual'
                    CHECK (source IN ('manual','ocr')),
  pdf_url           text,
  ocr_job_id        uuid,                            -- FK added after TABLE 27
  created_at        timestamptz  NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE 8: score_targets  (parent-set goals per subject)
-- =============================================================================
CREATE TABLE public.score_targets (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id          uuid         NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  set_by            uuid         NOT NULL REFERENCES public.profiles(id),
  subject           public.subject_enum NOT NULL,
  target_score      numeric(5,2) NOT NULL CHECK (target_score BETWEEN 0 AND 10),
  academic_year     text         NOT NULL,
  semester          smallint     NOT NULL CHECK (semester IN (1,2)),
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (child_id, subject, academic_year, semester)
);

-- =============================================================================
-- TABLE 9: quizzes
-- =============================================================================
CREATE TABLE public.quizzes (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id        uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id         uuid         REFERENCES public.schools(id) ON DELETE SET NULL,
  title             text         NOT NULL,
  subject           public.subject_enum    NOT NULL,
  grade             smallint     NOT NULL CHECK (grade BETWEEN 1 AND 12),
  difficulty        public.quiz_difficulty NOT NULL DEFAULT 'medium',
  status            public.quiz_status     NOT NULL DEFAULT 'draft',
  question_count    smallint     NOT NULL DEFAULT 10 CHECK (question_count > 0),
  time_limit_minutes smallint    NOT NULL DEFAULT 15 CHECK (time_limit_minutes > 0),
  due_date          timestamptz,
  ai_generated      boolean      NOT NULL DEFAULT false,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE 10: quiz_questions
-- =============================================================================
CREATE TABLE public.quiz_questions (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id           uuid         NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text     text         NOT NULL,
  options           jsonb        NOT NULL DEFAULT '[]',   -- string[4]
  correct_index     smallint     NOT NULL CHECK (correct_index >= 0),
  explanation       text,
  order_index       smallint     NOT NULL DEFAULT 0,
  created_at        timestamptz  NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE 11: quiz_assignments  (quiz → class)
-- =============================================================================
CREATE TABLE public.quiz_assignments (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id           uuid         NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  class_id          uuid         NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  assigned_by       uuid         NOT NULL REFERENCES public.profiles(id),
  due_date          timestamptz,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (quiz_id, class_id)
);

-- =============================================================================
-- TABLE 12: quiz_attempts
-- =============================================================================
CREATE TABLE public.quiz_attempts (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id           uuid         NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id        uuid         NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  answers           jsonb        NOT NULL DEFAULT '[]',   -- number[]
  score             smallint     NOT NULL CHECK (score >= 0),
  max_score         smallint     NOT NULL CHECK (max_score > 0),
  time_taken_seconds integer     NOT NULL DEFAULT 0 CHECK (time_taken_seconds >= 0),
  completed_at      timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (quiz_id, student_id)
);

-- =============================================================================
-- TABLE 13: coach_conversations
-- =============================================================================
CREATE TABLE public.coach_conversations (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id          uuid         REFERENCES public.children(id) ON DELETE SET NULL,
  messages          jsonb        NOT NULL DEFAULT '[]',  -- CoachMessage[]
  message_count     integer      NOT NULL DEFAULT 0,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE 14: learning_dna
-- =============================================================================
CREATE TABLE public.learning_dna (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id          uuid         NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  academic_year     text         NOT NULL,
  dominant_style    public.learning_style NOT NULL DEFAULT 'reading',
  burnout_risk      public.burnout_risk   NOT NULL DEFAULT 'low',
  strengths         public.subject_enum[] NOT NULL DEFAULT '{}',
  weaknesses        public.subject_enum[] NOT NULL DEFAULT '{}',
  consistency_score smallint     NOT NULL DEFAULT 0
                    CHECK (consistency_score BETWEEN 0 AND 100),
  improvement_rate  numeric(5,2) NOT NULL DEFAULT 0,
  computed_at       timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (child_id, academic_year)
);

-- =============================================================================
-- TABLE 15: weekly_summaries
-- =============================================================================
CREATE TABLE public.weekly_summaries (
  id                    uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id              uuid         NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  week_start            date         NOT NULL,
  subject_scores        jsonb        NOT NULL DEFAULT '[]',  -- SubjectScore[]
  quiz_completion_rate  numeric(5,2) NOT NULL DEFAULT 0
                        CHECK (quiz_completion_rate BETWEEN 0 AND 100),
  study_time_minutes    integer      NOT NULL DEFAULT 0,
  learning_dna_id       uuid         REFERENCES public.learning_dna(id) ON DELETE SET NULL,
  ai_insight            text,
  created_at            timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (child_id, week_start)
);

-- =============================================================================
-- TABLE 16: study_sessions
-- =============================================================================
CREATE TABLE public.study_sessions (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id          uuid         NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  subject           public.subject_enum,
  started_at        timestamptz  NOT NULL,
  ended_at          timestamptz,
  duration_minutes  integer      GENERATED ALWAYS AS (
    CASE WHEN ended_at IS NOT NULL
         THEN EXTRACT(EPOCH FROM (ended_at - started_at))::integer / 60
    END
  ) STORED,
  source            text         NOT NULL DEFAULT 'app'
                    CHECK (source IN ('app','mobile')),
  created_at        timestamptz  NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE 17: alerts
-- =============================================================================
CREATE TABLE public.alerts (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id          uuid         REFERENCES public.children(id) ON DELETE CASCADE,
  type              public.alert_type     NOT NULL,
  severity          public.alert_severity NOT NULL DEFAULT 'info',
  title             text         NOT NULL,
  body              text         NOT NULL,
  is_read           boolean      NOT NULL DEFAULT false,
  read_at           timestamptz,
  created_at        timestamptz  NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE 18: notifications
-- =============================================================================
CREATE TABLE public.notifications (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel           public.notif_channel NOT NULL,
  status            public.notif_status  NOT NULL DEFAULT 'pending',
  title             text         NOT NULL,
  body              text         NOT NULL,
  data              jsonb        NOT NULL DEFAULT '{}',
  sent_at           timestamptz,
  error             text,
  created_at        timestamptz  NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE 19: push_tokens  (Expo push notification tokens)
-- =============================================================================
CREATE TABLE public.push_tokens (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token             text         NOT NULL UNIQUE,
  device_type       text         NOT NULL CHECK (device_type IN ('ios','android','web')),
  is_active         boolean      NOT NULL DEFAULT true,
  last_used_at      timestamptz,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

-- =============================================================================
-- TABLE 20: payment_transactions
-- =============================================================================
CREATE TABLE public.payment_transactions (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  provider          public.payment_provider NOT NULL,
  provider_tx_id    text         NOT NULL UNIQUE,
  amount_vnd        integer      NOT NULL CHECK (amount_vnd > 0),
  plan_tier         public.plan_tier NOT NULL,
  status            public.payment_status NOT NULL DEFAULT 'pending',
  metadata          jsonb        NOT NULL DEFAULT '{}',
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE 21: subscriptions
-- =============================================================================
CREATE TABLE public.subscriptions (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_tier         public.plan_tier   NOT NULL,
  status            public.sub_status  NOT NULL DEFAULT 'trialing',
  started_at        timestamptz  NOT NULL DEFAULT now(),
  expires_at        timestamptz,
  cancelled_at      timestamptz,
  payment_tx_id     uuid         REFERENCES public.payment_transactions(id),
  renewal_count     smallint     NOT NULL DEFAULT 0,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE 22: referrals
-- =============================================================================
CREATE TABLE public.referrals (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id       uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id       uuid         NOT NULL UNIQUE
                    REFERENCES public.profiles(id) ON DELETE CASCADE,
  status            public.referral_status NOT NULL DEFAULT 'pending',
  reward_granted    boolean      NOT NULL DEFAULT false,
  reward_granted_at timestamptz,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  CHECK (referrer_id <> referred_id)
);

-- =============================================================================
-- TABLE 23: school_invites
-- =============================================================================
CREATE TABLE public.school_invites (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         uuid         NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  invited_by        uuid         NOT NULL REFERENCES public.profiles(id),
  invitee_email     text         NOT NULL,
  invitee_role      public.user_role NOT NULL DEFAULT 'teacher',
  token             text         NOT NULL UNIQUE
                    DEFAULT encode(gen_random_bytes(24), 'hex'),
  status            public.invite_status NOT NULL DEFAULT 'pending',
  expires_at        timestamptz  NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at       timestamptz,
  created_at        timestamptz  NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE 24: feature_flags
-- =============================================================================
CREATE TABLE public.feature_flags (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  key               text         NOT NULL UNIQUE,
  enabled           boolean      NOT NULL DEFAULT false,
  description       text,
  rollout_pct       smallint     NOT NULL DEFAULT 100
                    CHECK (rollout_pct BETWEEN 0 AND 100),
  allowed_roles     public.user_role[]  DEFAULT NULL,  -- NULL = all roles
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE 25: audit_logs
-- =============================================================================
CREATE TABLE public.audit_logs (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id          uuid         REFERENCES public.profiles(id) ON DELETE SET NULL,
  action            text         NOT NULL,          -- "flag.update", "user.ban"
  resource_type     text         NOT NULL,
  resource_id       text,
  old_data          jsonb,
  new_data          jsonb,
  ip_address        inet,
  user_agent        text,
  created_at        timestamptz  NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE 26: report_exports
-- =============================================================================
CREATE TABLE public.report_exports (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by      uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id          uuid         REFERENCES public.children(id) ON DELETE SET NULL,
  format            public.export_format NOT NULL DEFAULT 'pdf',
  period_start      date         NOT NULL,
  period_end        date         NOT NULL,
  file_url          text,
  status            text         NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','done','failed')),
  error             text,
  completed_at      timestamptz,
  created_at        timestamptz  NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE 27: ocr_jobs
-- =============================================================================
CREATE TABLE public.ocr_jobs (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by       uuid         NOT NULL REFERENCES public.profiles(id),
  child_id          uuid         NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  pdf_url           text         NOT NULL,
  status            public.ocr_status NOT NULL DEFAULT 'queued',
  extracted_data    jsonb,                           -- raw Vision API response
  score_record_ids  uuid[]       DEFAULT '{}',       -- created score_records
  error             text,
  processed_at      timestamptz,
  created_at        timestamptz  NOT NULL DEFAULT now()
);

-- deferred FK from score_records → ocr_jobs
ALTER TABLE public.score_records DROP CONSTRAINT IF EXISTS fk_score_records_ocr_job;
ALTER TABLE public.score_records
  ADD CONSTRAINT fk_score_records_ocr_job
  FOREIGN KEY (ocr_job_id) REFERENCES public.ocr_jobs(id) ON DELETE SET NULL;


-- =============================================================================
-- INDEXES
-- =============================================================================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role         ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id    ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_tier    ON public.profiles(plan_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_referral     ON public.profiles(referral_code);

-- schools
CREATE INDEX IF NOT EXISTS idx_schools_province      ON public.schools(province);

-- classes
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id    ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id     ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade_year    ON public.classes(grade, academic_year);

-- children
CREATE INDEX IF NOT EXISTS idx_children_parent_id    ON public.children(parent_id);
CREATE INDEX IF NOT EXISTS idx_children_school_id    ON public.children(school_id);
CREATE INDEX IF NOT EXISTS idx_children_grade        ON public.children(grade);

-- class_memberships
CREATE INDEX IF NOT EXISTS idx_cm_class_id           ON public.class_memberships(class_id);
CREATE INDEX IF NOT EXISTS idx_cm_child_id           ON public.class_memberships(child_id);

-- teacher_students
CREATE INDEX IF NOT EXISTS idx_ts_teacher_id         ON public.teacher_students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ts_child_id           ON public.teacher_students(child_id);

-- score_records
CREATE INDEX IF NOT EXISTS idx_scores_child_year     ON public.score_records(child_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_scores_subject        ON public.score_records(subject);
CREATE INDEX IF NOT EXISTS idx_scores_exam_date      ON public.score_records(exam_date DESC);
CREATE INDEX IF NOT EXISTS idx_scores_created_by     ON public.score_records(created_by);

-- score_targets
CREATE INDEX IF NOT EXISTS idx_st_child_id           ON public.score_targets(child_id);

-- quizzes
CREATE INDEX IF NOT EXISTS idx_quizzes_teacher_id    ON public.quizzes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_status        ON public.quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_grade ON public.quizzes(subject, grade);

-- quiz_questions
CREATE INDEX IF NOT EXISTS idx_qq_quiz_order         ON public.quiz_questions(quiz_id, order_index);

-- quiz_assignments
CREATE INDEX IF NOT EXISTS idx_qassign_quiz_id       ON public.quiz_assignments(quiz_id);
CREATE INDEX IF NOT EXISTS idx_qassign_class_id      ON public.quiz_assignments(class_id);

-- quiz_attempts
CREATE INDEX IF NOT EXISTS idx_qa_student_id         ON public.quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_qa_quiz_id            ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_qa_completed          ON public.quiz_attempts(completed_at DESC);

-- coach_conversations
CREATE INDEX IF NOT EXISTS idx_cc_user_id            ON public.coach_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_cc_child_id           ON public.coach_conversations(child_id);
CREATE INDEX IF NOT EXISTS idx_cc_updated_at         ON public.coach_conversations(updated_at DESC);

-- learning_dna
CREATE INDEX IF NOT EXISTS idx_dna_child_year        ON public.learning_dna(child_id, academic_year);

-- weekly_summaries
CREATE INDEX IF NOT EXISTS idx_ws_child_id           ON public.weekly_summaries(child_id);
CREATE INDEX IF NOT EXISTS idx_ws_week_start         ON public.weekly_summaries(week_start DESC);

-- study_sessions
CREATE INDEX IF NOT EXISTS idx_ss_child_id           ON public.study_sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_ss_started_at         ON public.study_sessions(started_at DESC);

-- alerts
CREATE INDEX IF NOT EXISTS idx_alerts_user_id        ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_child_id       ON public.alerts(child_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unread         ON public.alerts(user_id) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_alerts_created        ON public.alerts(created_at DESC);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notif_user_id         ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_pending         ON public.notifications(status) WHERE status = 'pending';

-- push_tokens
CREATE INDEX IF NOT EXISTS idx_pt_user_active        ON public.push_tokens(user_id) WHERE is_active;

-- payment_transactions
CREATE INDEX IF NOT EXISTS idx_pay_user_id           ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pay_status            ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pay_provider_tx       ON public.payment_transactions(provider_tx_id);

-- subscriptions
CREATE INDEX IF NOT EXISTS idx_sub_user_id           ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_status            ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_sub_expires_at        ON public.subscriptions(expires_at) WHERE status = 'active';

-- referrals
CREATE INDEX IF NOT EXISTS idx_ref_referrer_id       ON public.referrals(referrer_id);

-- school_invites
CREATE INDEX IF NOT EXISTS idx_si_school_id          ON public.school_invites(school_id);
CREATE INDEX IF NOT EXISTS idx_si_token              ON public.school_invites(token);
CREATE INDEX IF NOT EXISTS idx_si_email_pending      ON public.school_invites(invitee_email) WHERE status = 'pending';

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_al_actor_id           ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_al_resource           ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_al_created_at         ON public.audit_logs(created_at DESC);

-- report_exports
CREATE INDEX IF NOT EXISTS idx_re_requested_by       ON public.report_exports(requested_by);
CREATE INDEX IF NOT EXISTS idx_re_status_pending     ON public.report_exports(status)
  WHERE status IN ('pending','processing');

-- ocr_jobs
CREATE INDEX IF NOT EXISTS idx_ocr_child_id          ON public.ocr_jobs(child_id);
CREATE INDEX IF NOT EXISTS idx_ocr_status_queue      ON public.ocr_jobs(status)
  WHERE status IN ('queued','processing');


-- =============================================================================
-- HELPER FUNCTIONS  (SECURITY DEFINER — called inside RLS policies)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_parent_of(p_child_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.children
    WHERE id = p_child_id AND parent_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.teaches_child(p_child_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_memberships cm
    JOIN public.classes c ON c.id = cm.class_id
    WHERE cm.child_id = p_child_id AND c.teacher_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.teacher_students
    WHERE child_id = p_child_id AND teacher_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.child_in_my_school(p_child_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.children ch
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE ch.id = p_child_id
      AND ch.school_id IS NOT NULL
      AND ch.school_id = p.school_id
  )
$$;


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- ── profiles ──────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: own"
  ON public.profiles FOR ALL
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: same school read"
  ON public.profiles FOR SELECT
  USING (
    school_id IS NOT NULL
    AND school_id = public.get_my_school_id()
  );

-- ── schools ───────────────────────────────────────────────────────────────────
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schools: any auth can read"
  ON public.schools FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "schools: bgh/admin update own"
  ON public.schools FOR UPDATE
  USING (
    id = public.get_my_school_id()
    AND public.get_my_role() IN ('bgh','admin')
  );

-- ── classes ───────────────────────────────────────────────────────────────────
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classes: teacher or school member read"
  ON public.classes FOR SELECT
  USING (
    teacher_id = auth.uid()
    OR school_id = public.get_my_school_id()
  );

CREATE POLICY "classes: teacher manage own"
  ON public.classes FOR ALL
  USING  (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- ── children ──────────────────────────────────────────────────────────────────
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "children: parent full access"
  ON public.children FOR ALL
  USING  (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "children: teacher read"
  ON public.children FOR SELECT
  USING (public.teaches_child(id));

CREATE POLICY "children: bgh read school"
  ON public.children FOR SELECT
  USING (
    school_id = public.get_my_school_id()
    AND public.get_my_role() IN ('bgh','admin')
  );

-- ── class_memberships ─────────────────────────────────────────────────────────
ALTER TABLE public.class_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cm: teacher of class"
  ON public.class_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "cm: parent read own child"
  ON public.class_memberships FOR SELECT
  USING (public.is_parent_of(child_id));

-- ── teacher_students ──────────────────────────────────────────────────────────
ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ts: teacher manage own"
  ON public.teacher_students FOR ALL
  USING  (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "ts: parent read"
  ON public.teacher_students FOR SELECT
  USING (public.is_parent_of(child_id));

-- ── score_records ─────────────────────────────────────────────────────────────
ALTER TABLE public.score_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scores: parent full access own child"
  ON public.score_records FOR ALL
  USING  (public.is_parent_of(child_id))
  WITH CHECK (public.is_parent_of(child_id));

CREATE POLICY "scores: teacher read+insert own students"
  ON public.score_records FOR SELECT
  USING (public.teaches_child(child_id));

CREATE POLICY "scores: teacher insert"
  ON public.score_records FOR INSERT
  WITH CHECK (public.teaches_child(child_id));

CREATE POLICY "scores: bgh read school"
  ON public.score_records FOR SELECT
  USING (
    public.get_my_role() IN ('bgh','admin')
    AND public.child_in_my_school(child_id)
  );

-- ── score_targets ─────────────────────────────────────────────────────────────
ALTER TABLE public.score_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "st: parent full access own child"
  ON public.score_targets FOR ALL
  USING  (public.is_parent_of(child_id) AND set_by = auth.uid())
  WITH CHECK (public.is_parent_of(child_id));

CREATE POLICY "st: teacher read"
  ON public.score_targets FOR SELECT
  USING (public.teaches_child(child_id));

-- ── quizzes ───────────────────────────────────────────────────────────────────
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quizzes: teacher manage own"
  ON public.quizzes FOR ALL
  USING  (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "quizzes: read published"
  ON public.quizzes FOR SELECT
  USING (status = 'published');

-- ── quiz_questions ────────────────────────────────────────────────────────────
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qq: teacher of quiz"
  ON public.quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE id = quiz_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "qq: read published quiz"
  ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE id = quiz_id AND status = 'published'
    )
  );

-- ── quiz_assignments ──────────────────────────────────────────────────────────
ALTER TABLE public.quiz_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qassign: assigner manage"
  ON public.quiz_assignments FOR ALL
  USING  (assigned_by = auth.uid())
  WITH CHECK (assigned_by = auth.uid());

CREATE POLICY "qassign: class teacher read"
  ON public.quiz_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND teacher_id = auth.uid()
    )
  );

-- ── quiz_attempts ─────────────────────────────────────────────────────────────
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qa: parent read own child"
  ON public.quiz_attempts FOR SELECT
  USING (public.is_parent_of(student_id));

CREATE POLICY "qa: parent insert on behalf of child"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (public.is_parent_of(student_id));

CREATE POLICY "qa: teacher read own quiz"
  ON public.quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE id = quiz_id AND teacher_id = auth.uid()
    )
  );

-- ── coach_conversations ───────────────────────────────────────────────────────
ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cc: own user"
  ON public.coach_conversations FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── learning_dna ──────────────────────────────────────────────────────────────
ALTER TABLE public.learning_dna ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dna: parent read own child"
  ON public.learning_dna FOR SELECT
  USING (public.is_parent_of(child_id));

CREATE POLICY "dna: teacher read"
  ON public.learning_dna FOR SELECT
  USING (public.teaches_child(child_id));

CREATE POLICY "dna: bgh read school"
  ON public.learning_dna FOR SELECT
  USING (
    public.get_my_role() IN ('bgh','admin')
    AND public.child_in_my_school(child_id)
  );

-- ── weekly_summaries ──────────────────────────────────────────────────────────
ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws: parent read own child"
  ON public.weekly_summaries FOR SELECT
  USING (public.is_parent_of(child_id));

CREATE POLICY "ws: teacher read"
  ON public.weekly_summaries FOR SELECT
  USING (public.teaches_child(child_id));

-- ── study_sessions ────────────────────────────────────────────────────────────
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ss: parent full access"
  ON public.study_sessions FOR ALL
  USING  (public.is_parent_of(child_id))
  WITH CHECK (public.is_parent_of(child_id));

CREATE POLICY "ss: teacher read"
  ON public.study_sessions FOR SELECT
  USING (public.teaches_child(child_id));

-- ── alerts ────────────────────────────────────────────────────────────────────
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts: own user"
  ON public.alerts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "alerts: mark read"
  ON public.alerts FOR UPDATE
  USING (user_id = auth.uid());

-- ── notifications ─────────────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif: own user"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- ── push_tokens ───────────────────────────────────────────────────────────────
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pt: own user"
  ON public.push_tokens FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── payment_transactions ──────────────────────────────────────────────────────
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pay: own user read"
  ON public.payment_transactions FOR SELECT
  USING (user_id = auth.uid());

-- ── subscriptions ─────────────────────────────────────────────────────────────
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub: own user read"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- ── referrals ─────────────────────────────────────────────────────────────────
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref: referrer or referred"
  ON public.referrals FOR SELECT
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- ── school_invites ────────────────────────────────────────────────────────────
ALTER TABLE public.school_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "si: bgh manage own school"
  ON public.school_invites FOR ALL
  USING (
    school_id = public.get_my_school_id()
    AND public.get_my_role() IN ('bgh','admin')
  );

CREATE POLICY "si: invitee read by email"
  ON public.school_invites FOR SELECT
  USING (
    invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    AND status = 'pending'
  );

-- ── feature_flags ─────────────────────────────────────────────────────────────
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ff: any auth read"
  ON public.feature_flags FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "ff: admin manage"
  ON public.feature_flags FOR ALL
  USING (public.get_my_role() = 'admin');

-- ── audit_logs ────────────────────────────────────────────────────────────────
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "al: admin read"
  ON public.audit_logs FOR SELECT
  USING (public.get_my_role() = 'admin');

-- ── report_exports ────────────────────────────────────────────────────────────
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "re: own user"
  ON public.report_exports FOR ALL
  USING  (requested_by = auth.uid())
  WITH CHECK (requested_by = auth.uid());

-- ── ocr_jobs ──────────────────────────────────────────────────────────────────
ALTER TABLE public.ocr_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ocr: parent of child"
  ON public.ocr_jobs FOR ALL
  USING  (public.is_parent_of(child_id))
  WITH CHECK (public.is_parent_of(child_id) AND uploaded_by = auth.uid());


-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','schools','classes','children','score_targets',
    'quizzes','coach_conversations','payment_transactions',
    'subscriptions','feature_flags'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_set_updated_at ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_set_updated_at
       BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- Auto-create profile on Supabase auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'parent')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auth_users_create_profile ON auth.users;
CREATE TRIGGER trg_auth_users_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Keep coach_conversations.message_count accurate
CREATE OR REPLACE FUNCTION public.sync_message_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.message_count = jsonb_array_length(COALESCE(NEW.messages, '[]'));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cc_sync_message_count ON public.coach_conversations;
CREATE TRIGGER trg_cc_sync_message_count
  BEFORE INSERT OR UPDATE OF messages ON public.coach_conversations
  FOR EACH ROW EXECUTE FUNCTION public.sync_message_count();

-- Keep classes.student_count accurate
CREATE OR REPLACE FUNCTION public.sync_class_student_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.classes
    SET student_count = student_count + 1
    WHERE id = NEW.class_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.classes
    SET student_count = GREATEST(0, student_count - 1)
    WHERE id = OLD.class_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_cm_sync_student_count ON public.class_memberships;
CREATE TRIGGER trg_cm_sync_student_count
  AFTER INSERT OR DELETE ON public.class_memberships
  FOR EACH ROW EXECUTE FUNCTION public.sync_class_student_count();

-- Auto-set alerts.read_at when is_read flipped to true
CREATE OR REPLACE FUNCTION public.set_alert_read_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_read AND NOT OLD.is_read THEN
    NEW.read_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_alerts_set_read_at ON public.alerts;
CREATE TRIGGER trg_alerts_set_read_at
  BEFORE UPDATE OF is_read ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_alert_read_at();


-- =============================================================================
-- SEED: feature_flags defaults
-- =============================================================================
INSERT INTO public.feature_flags (key, enabled, description, rollout_pct) VALUES
  ('coach_ai',           true,  'AI coaching chat (EduCoach)',            100),
  ('quiz_generation',    true,  'AI quiz generation for teachers',         100),
  ('ocr_upload',         false, 'PDF score upload with Google Vision OCR',   0),
  ('weekly_summaries',   false, 'Automated weekly AI summary emails',        0),
  ('leaderboard',        false, 'Student leaderboard — Học Vị module',       0),
  ('push_notifications', false, 'Expo push notifications',                   0),
  ('referral_rewards',   false, 'Referral reward credits',                   0)
ON CONFLICT (key) DO NOTHING;
