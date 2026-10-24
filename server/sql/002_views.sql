-- 화면별 뷰 10개(v_record는 장면 3 테이블을 붙일 때 추가).
-- 뷰는 조인과 json 풀기만 하고, 계산 값은 서버가 테이블에 넣은 것을 그대로 읽는다.
-- 날짜는 'yyyy-mm-dd', 시각은 'hh:mm' 문자열로 내보내 화면에서 그대로 쓴다.
-- 정렬은 서버의 뷰 허용 목록(lib/views.ts)이 ORDER BY로 붙인다.

CREATE VIEW dbo.v_schedule AS
SELECT s.id AS session_id,
       o.child_id,
       o.name AS org_name,
       o.color,
       s.therapy,
       s.therapist,
       CONVERT(char(10), s.[date], 23) AS [date],
       CONVERT(char(5), s.start_time, 108) AS start_time,
       s.minutes,
       s.funding,
       s.status
FROM dbo.session s
JOIN dbo.organization o ON o.id = s.organization_id;
GO

CREATE VIEW dbo.v_voucher_summary AS
SELECT v.id AS voucher_month_id,
       v.child_id,
       v.program_name,
       CONVERT(char(7), v.[month], 23) AS [month],
       v.limit_amount,
       v.self_pay,
       v.used_amount,
       v.balance,
       v.days_left,
       (SELECT COUNT(*)
          FROM dbo.usage u
          JOIN dbo.organization o ON o.id = u.organization_id
         WHERE o.child_id = v.child_id
           AND u.[match] = N'확인 필요'
           AND u.used_at >= v.[month]
           AND u.used_at < DATEADD(month, 1, v.[month])) AS check_count
FROM dbo.voucher_month v;
GO

-- quote: 같은 날 같은 기관에서 온 결석·일정 변경·보강 문자(대조 근거)
CREATE VIEW dbo.v_usage AS
SELECT u.id AS usage_id,
       o.child_id,
       CONVERT(char(7), u.used_at, 23) AS [month],
       CONVERT(char(10), u.used_at, 23) AS used_at,
       o.name AS org_name,
       u.amount,
       u.source,
       u.[match],
       s.status AS session_status,
       msg.quote
FROM dbo.usage u
JOIN dbo.organization o ON o.id = u.organization_id
LEFT JOIN dbo.session s ON s.id = u.session_id
OUTER APPLY (
  SELECT TOP 1 COALESCE(i.quote, i.raw_text) AS quote
  FROM dbo.inbox_item i
  WHERE i.organization_id = u.organization_id
    AND i.occurs_on = CAST(u.used_at AS date)
    AND i.event_type IN (N'결석', N'일정 변경', N'보강')
  ORDER BY i.received_at DESC
) msg;
GO

CREATE VIEW dbo.v_radar AS
SELECT m.id AS match_id,
       m.child_id,
       p.id AS program_id,
       p.title,
       p.org_name,
       m.eligible,
       m.status,
       (SELECT STRING_AGG(r.[value], N' · ') FROM OPENJSON(m.reasons) r) AS reasons,
       CONVERT(char(10), p.deadline, 23) AS deadline,
       p.apply_channel,
       p.source_url
FROM dbo.program_match m
JOIN dbo.program p ON p.id = m.program_id
WHERE m.status <> N'숨김';
GO

CREATE VIEW dbo.v_deadline AS
SELECT d.child_id,
       N'서류 유효기간' AS kind,
       d.doc_type AS title,
       CONVERT(char(10), d.valid_until, 23) AS due_on,
       N'document' AS ref_table,
       d.id AS ref_id
FROM dbo.document d
WHERE d.valid_until IS NOT NULL
UNION ALL
SELECT m.child_id, N'신청 마감', p.title, CONVERT(char(10), p.deadline, 23), N'program', p.id
FROM dbo.program_match m
JOIN dbo.program p ON p.id = m.program_id
WHERE m.eligible IN (N'해당', N'해당 가능')
  AND m.status <> N'숨김'
  AND p.deadline IS NOT NULL
UNION ALL
SELECT a.child_id, N'결과 발표일', p.title, CONVERT(char(10), a.result_on, 23), N'application', a.id
FROM dbo.application a
JOIN dbo.program p ON p.id = a.program_id
WHERE a.result_on IS NOT NULL;
GO

-- preview_path: 서버 주소 뒤에 붙여 Embed에 넣는 공개 링크
CREATE VIEW dbo.v_application AS
SELECT a.id AS application_id,
       a.child_id,
       p.title AS program_title,
       p.org_name,
       a.status,
       CONVERT(char(16), a.submitted_at, 120) AS submitted_at,
       CONVERT(char(10), a.result_on, 23) AS result_on,
       N'/outputs/' + CONVERT(nvarchar(36), a.preview_token) AS preview_path
FROM dbo.application a
JOIN dbo.program p ON p.id = a.program_id;
GO

CREATE VIEW dbo.v_checklist AS
SELECT a.id AS application_id,
       a.child_id,
       c.doc_type,
       c.state,
       c.document_id
FROM dbo.application a
CROSS APPLY OPENJSON(a.checklist) WITH (
  doc_type nvarchar(50) '$.doc_type',
  state nvarchar(10) '$.state',
  document_id int '$.document_id'
) c;
GO

-- photo_path: 서버 주소 뒤에 붙여 Image에 넣는 공개 링크
CREATE VIEW dbo.v_document AS
SELECT d.id AS document_id,
       d.child_id,
       d.doc_type,
       CONVERT(char(10), d.issued_on, 23) AS issued_on,
       CONVERT(char(10), d.valid_until, 23) AS valid_until,
       N'/files/' + CONVERT(nvarchar(36), d.file_token) AS photo_path
FROM dbo.document d;
GO

-- source_quote: refs의 첫 inbox_item 원문(원문과 초안을 나란히 보여 줄 때)
CREATE VIEW dbo.v_approval AS
SELECT a.id AS approval_id,
       a.child_id,
       a.kind,
       a.title,
       a.draft_text,
       src.source_quote,
       a.status,
       CONVERT(char(16), a.decided_at, 120) AS decided_at
FROM dbo.approval a
OUTER APPLY (
  SELECT TOP 1 COALESCE(i.quote, i.raw_text) AS source_quote
  FROM OPENJSON(a.refs, '$.inbox_item') r
  JOIN dbo.inbox_item i ON i.id = TRY_CAST(r.[value] AS int)
  ORDER BY CAST(r.[key] AS int)
) src;
GO

-- 홈 카드 초안: 승인 대기 항목을 카드로 보여 주고, 최근 실행의 카운터를 붙인다.
-- 승인이 필요 없는 카드(T3 일정 변경, T4 영역 중복, T9 서류 만료)를 담을 곳은 아직 정하지 않았다.
CREATE VIEW dbo.v_home_card AS
SELECT a.id AS card_id,
       a.child_id,
       a.kind,
       a.title,
       a.draft_text AS description,
       src.source_quote,
       CASE a.kind
         WHEN N'확인 요청' THEN N'바우처 장부'
         WHEN N'보강 요청' THEN N'바우처 장부'
         WHEN N'신청 제출' THEN N'신청 진행'
         ELSE N'승인함'
       END AS link_screen,
       run.manual_steps,
       run.approvals
FROM dbo.approval a
OUTER APPLY (
  SELECT TOP 1 COALESCE(i.quote, i.raw_text) AS source_quote
  FROM OPENJSON(a.refs, '$.inbox_item') r
  JOIN dbo.inbox_item i ON i.id = TRY_CAST(r.[value] AS int)
  ORDER BY CAST(r.[key] AS int)
) src
OUTER APPLY (
  SELECT TOP 1 ar.manual_steps, ar.approvals
  FROM dbo.agent_run ar
  ORDER BY ar.started_at DESC
) run
WHERE a.status = N'대기';
GO
