-- Yapply schema. Only the backend (secret key → service_role) touches these tables.

create table company (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  company_id uuid not null unique default gen_random_uuid(),
  username text not null unique,
  email text not null,
  hashed_password text not null,
  disabled boolean not null default false
);

create table roles (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  company_id uuid not null references company(company_id) on delete cascade,
  title text not null,
  department text,
  description text,
  requirements text,
  vapi_workflow_id text
);
create index on roles(company_id);

create table questions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  role_id bigint not null references roles(id) on delete cascade,
  question_text text not null,
  question_type text not null,
  difficulty text not null
);
create index on questions(role_id);

create table interviews (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  company_id uuid not null references company(company_id) on delete cascade,
  candidate_name text not null,
  candidate_email text,
  candidate_phone text not null,
  position text,
  status text not null default 'Pending',
  interview_date date,
  interview_time time,
  call_id text,
  transcript text,
  ai_evaluation jsonb,
  vapi_workflow_id text,
  is_sample boolean not null default false
);
create index on interviews(company_id);
create index on interviews(candidate_email);

create table usage_counters (
  day date not null,
  action text not null,
  count int not null default 0,
  primary key (day, action)
);

create table demo_workflows (
  role_title text primary key,
  vapi_workflow_id text not null
);

alter table company enable row level security;
alter table roles enable row level security;
alter table questions enable row level security;
alter table interviews enable row level security;
alter table usage_counters enable row level security;
alter table demo_workflows enable row level security;

create function consume_quota(p_action text, p_limit int) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  if p_limit <= 0 then
    return false;
  end if;
  insert into usage_counters (day, action, count)
  values ((now() at time zone 'utc')::date, p_action, 1)
  on conflict (day, action) do update
    set count = usage_counters.count + 1
    where usage_counters.count < p_limit
  returning count into v_count;
  return v_count is not null;
end $$;

create function reset_demo() returns void
language plpgsql security definer set search_path = public as $$
declare
  v_company uuid;
  v_ml_role bigint;
  v_fe_role bigint;
  v_ml_workflow text;
  v_fe_workflow text;
begin
  select company_id into v_company from company where username = 'yapply';
  if v_company is null then
    raise exception 'Demo company "yapply" is missing. Run seed.sql first.';
  end if;

  select vapi_workflow_id into v_ml_workflow from demo_workflows where role_title = 'ML/AI Intern';
  select vapi_workflow_id into v_fe_workflow from demo_workflows where role_title = 'Frontend Engineer';

  delete from interviews where company_id = v_company;
  delete from roles where company_id = v_company;

  insert into roles (company_id, title, department, description, requirements, vapi_workflow_id)
  values (v_company, 'ML/AI Intern', 'Engineering',
          'Summer internship building and evaluating machine learning models with the applied AI team.',
          'Python; PyTorch or TensorFlow; model evaluation fundamentals',
          v_ml_workflow)
  returning id into v_ml_role;

  insert into roles (company_id, title, department, description, requirements, vapi_workflow_id)
  values (v_company, 'Frontend Engineer', 'Engineering',
          'Build the React dashboards companies use to schedule and review AI interviews.',
          'React; TypeScript; accessibility; REST APIs',
          v_fe_workflow)
  returning id into v_fe_role;

  insert into questions (role_id, question_text, question_type, difficulty) values
    (v_ml_role, 'Can you walk me through a machine learning project you''ve worked on from start to finish?', 'behavioral', 'medium'),
    (v_ml_role, 'How do you decide which machine learning model to use for a given problem?', 'text', 'medium'),
    (v_ml_role, 'What experience do you have with popular ML frameworks like TensorFlow or PyTorch?', 'text', 'easy'),
    (v_ml_role, 'How do you approach evaluating the performance of an ML model?', 'text', 'medium'),
    (v_ml_role, 'What recent developments in AI or ML excite you the most, and why?', 'behavioral', 'easy'),
    (v_fe_role, 'How would you structure state for a dashboard that lists and filters hundreds of interviews?', 'coding', 'medium'),
    (v_fe_role, 'How do you make a data-heavy table usable with a keyboard and a screen reader?', 'text', 'medium'),
    (v_fe_role, 'Tell me about a time you pushed back on a design or product decision. What happened?', 'behavioral', 'medium'),
    (v_fe_role, 'How would you debug a React page that re-renders far more often than expected?', 'coding', 'hard');

  insert into interviews (company_id, candidate_name, candidate_email, candidate_phone, position, status,
                          interview_date, interview_time, call_id, transcript, ai_evaluation, vapi_workflow_id, is_sample)
  values
    (v_company, 'Jordan Rivera', 'candidate@example.com', '+15555550100', 'ML/AI Intern', 'Scheduled',
     current_date + 2, '14:00', null, null, null, v_ml_workflow, true),
    (v_company, 'Priya Natarajan', 'priya.natarajan@example.com', '+15555550101', 'Frontend Engineer', 'Pending',
     null, null, null, null, null, v_fe_workflow, true),
    (v_company, 'Sam Okafor', 'sam.okafor@example.com', '+15555550102', 'ML/AI Intern', 'Completed',
     current_date - 3, '10:30', 'sample-call-1',
     $transcript$AI: Hi Sam, thanks for joining. Can you walk me through a machine learning project you've worked on from start to finish?
User: Sure. I built a model that flags duplicate support tickets. I labeled about four thousand ticket pairs, used TF-IDF with logistic regression as a baseline, then fine-tuned a small sentence-transformer, which lifted F1 from 0.71 to 0.86.
AI: How did you decide the transformer was worth the extra cost?
User: I measured latency on real traffic. It stayed under 40 milliseconds on CPU, and the precision gain cut manual triage by about a third.
AI: How do you approach evaluating the performance of an ML model?
User: I use a time-based split so future tickets never leak into training, track precision and recall separately because false merges cost more than misses, and review a sample of errors by hand each release.
AI: Thanks Sam, that's all the questions I have.$transcript$,
     jsonb_build_object(
       'technical_score', 88,
       'technical_comment', 'Chose a sensible baseline before fine-tuning and quantified the gain in F1. Clear grasp of the modelling trade-offs.',
       'communication_score', 84,
       'communication_comment', 'Answers were structured and concrete, with numbers to support each claim.',
       'problem_solving_score', 87,
       'problem_solving_comment', 'Framed the cost of false merges versus misses and chose metrics to match.',
       'experience_score', 78,
       'experience_comment', 'One substantial end-to-end project; limited evidence of production ownership beyond it.',
       'leadership_score', 70,
       'leadership_comment', 'No direct leadership examples; showed ownership of the evaluation process.',
       'adaptability_score', 85,
       'adaptability_comment', 'Moved from classical methods to transformers when the data justified it.',
       'overall_score', 86,
       'overall_comment', 'Strong intern candidate with rigorous evaluation habits and measurable results.',
       'recommendation', 'Hire',
       'key_strengths', 'Evaluation rigour; metric selection; clear communication'
     ),
     v_ml_workflow, true),
    (v_company, 'Lena Fischer', 'lena.fischer@example.com', '+15555550103', 'Frontend Engineer', 'Completed',
     current_date - 1, '16:00', 'sample-call-2',
     $transcript$AI: Hi Lena, thanks for making time. How would you structure state for a dashboard that lists and filters hundreds of interviews?
User: I would probably keep everything in one big context and filter in the component.
AI: What happens to performance as the list grows?
User: I have not really measured it. I think React is fast enough for a few hundred rows.
AI: How do you make a data-heavy table usable with a keyboard and a screen reader?
User: I would add aria labels to the buttons. I have not tested with a screen reader before.
AI: Thanks Lena, that's all the questions I have.$transcript$,
     jsonb_build_object(
       'technical_score', 62,
       'technical_comment', 'Proposed a single global context without considering memoisation, URL state, or server-side filtering.',
       'communication_score', 70,
       'communication_comment', 'Honest and direct, but answers stayed high level.',
       'problem_solving_score', 55,
       'problem_solving_comment', 'Did not reason about how the approach behaves as data grows.',
       'experience_score', 60,
       'experience_comment', 'Little evidence of performance or accessibility work in past projects.',
       'leadership_score', 52,
       'leadership_comment', 'No examples of leading or influencing technical decisions.',
       'adaptability_score', 58,
       'adaptability_comment', 'Open about gaps but did not describe how she would close them.',
       'overall_score', 58,
       'overall_comment', 'Not yet ready for this role; performance and accessibility fundamentals need growth.',
       'recommendation', 'No Hire',
       'key_strengths', 'Candour about gaps; clear communication'
     ),
     v_fe_workflow, true);
end $$;

revoke execute on function consume_quota(text, int) from public, anon, authenticated;
revoke execute on function reset_demo() from public, anon, authenticated;
