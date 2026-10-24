-- 이음 MVP 스키마: 시연(장면 1·2)에 쓰는 테이블 12개.
-- 빈 DB에 ieumadmin으로 한 번 적용한다. 규칙은 MVP 스펙의 '데이터' 절을 따른다.

CREATE TABLE dbo.child (
  id int IDENTITY PRIMARY KEY,
  name nvarchar(50) NOT NULL,
  birth_date date NOT NULL,
  grade tinyint NULL,
  school_class nvarchar(50) NULL,
  disability_type nvarchar(50) NULL,
  region nvarchar(50) NULL,
  income_bracket nvarchar(50) NULL,
  guardian_name nvarchar(50) NULL,
  guardian_phone nvarchar(20) NULL,
  guardian_email nvarchar(200) NULL
);

CREATE TABLE dbo.organization (
  id int IDENTITY PRIMARY KEY,
  child_id int NOT NULL REFERENCES dbo.child (id),
  name nvarchar(100) NOT NULL,
  kind nvarchar(10) NOT NULL CHECK (kind IN (N'발달센터', N'병원', N'학교', N'교육청', N'주민센터', N'복지관')),
  contact nvarchar(100) NULL,
  color char(7) NULL
);

CREATE TABLE dbo.inbox_item (
  id int IDENTITY PRIMARY KEY,
  child_id int NOT NULL REFERENCES dbo.child (id),
  kind nvarchar(10) NOT NULL CHECK (kind IN (N'text', N'photo', N'file', N'note')),
  raw_text nvarchar(max) NULL,
  file_ref nvarchar(400) NULL,
  received_at datetime2(0) NOT NULL DEFAULT SYSDATETIME(),
  processed bit NOT NULL DEFAULT 0,
  event_type nvarchar(10) NULL CHECK (event_type IN (N'일정 변경', N'결석', N'이용 내역', N'보강', N'공지', N'치료 피드백', N'서류', N'담당자 변경')),
  organization_id int NULL REFERENCES dbo.organization (id),
  occurs_on date NULL,
  amount int NULL,
  quote nvarchar(max) NULL,
  confidence decimal(4, 3) NULL
);

CREATE TABLE dbo.program (
  id int IDENTITY PRIMARY KEY,
  source nvarchar(10) NOT NULL CHECK (source IN (N'api', N'board')),
  source_url nvarchar(400) NULL,
  title nvarchar(200) NOT NULL,
  org_name nvarchar(100) NULL,
  target_rule nvarchar(max) NULL CHECK (ISJSON(target_rule) = 1),
  deadline date NULL,
  apply_channel nvarchar(10) NULL CHECK (apply_channel IN (N'email', N'online', N'visit', N'gov24')),
  required_docs nvarchar(max) NULL CHECK (ISJSON(required_docs) = 1),
  fetched_at datetime2(0) NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE dbo.session (
  id int IDENTITY PRIMARY KEY,
  organization_id int NOT NULL REFERENCES dbo.organization (id),
  therapy nvarchar(50) NOT NULL,
  therapist nvarchar(50) NULL,
  [date] date NOT NULL,
  start_time time(0) NOT NULL,
  minutes smallint NOT NULL,
  unit_price int NULL,
  funding nvarchar(10) NULL CHECK (funding IN (N'바우처', N'교육청', N'자부담')),
  status nvarchar(10) NOT NULL CHECK (status IN (N'예정', N'출석', N'결석', N'취소', N'보강')),
  inbox_item_id int NULL REFERENCES dbo.inbox_item (id)
);

-- used_amount, balance, days_left는 서버가 계산해 넣는다.
CREATE TABLE dbo.voucher_month (
  id int IDENTITY PRIMARY KEY,
  child_id int NOT NULL REFERENCES dbo.child (id),
  program_name nvarchar(100) NOT NULL,
  [month] date NOT NULL,
  limit_amount int NOT NULL,
  self_pay int NOT NULL DEFAULT 0,
  used_amount int NULL,
  balance int NULL,
  days_left smallint NULL
);

CREATE TABLE dbo.usage (
  id int IDENTITY PRIMARY KEY,
  organization_id int NOT NULL REFERENCES dbo.organization (id),
  session_id int NULL REFERENCES dbo.session (id),
  used_at datetime2(0) NOT NULL,
  amount int NOT NULL,
  source nvarchar(10) NOT NULL CHECK (source IN (N'연동', N'캡처')),
  inbox_item_id int NULL REFERENCES dbo.inbox_item (id),
  [match] nvarchar(10) NULL CHECK ([match] IN (N'일치', N'확인 필요', N'미확인'))
);

-- file_token: 키 없이 여는 공개 링크(/files/{token})용.
CREATE TABLE dbo.document (
  id int IDENTITY PRIMARY KEY,
  child_id int NOT NULL REFERENCES dbo.child (id),
  doc_type nvarchar(50) NOT NULL,
  issued_on date NULL,
  valid_until date NULL,
  file_ref nvarchar(400) NULL,
  file_token uniqueidentifier NOT NULL DEFAULT NEWID() UNIQUE,
  fields nvarchar(max) NULL CHECK (ISJSON(fields) = 1)
);

CREATE TABLE dbo.program_match (
  id int IDENTITY PRIMARY KEY,
  program_id int NOT NULL REFERENCES dbo.program (id),
  child_id int NOT NULL REFERENCES dbo.child (id),
  eligible nvarchar(10) NOT NULL CHECK (eligible IN (N'해당', N'해당 가능', N'비해당')),
  reasons nvarchar(max) NULL CHECK (ISJSON(reasons) = 1),
  status nvarchar(10) NOT NULL DEFAULT N'새 알림' CHECK (status IN (N'새 알림', N'관심', N'신청', N'숨김'))
);

-- checklist: [{"doc_type": "장애인증명서", "state": "있음", "document_id": 1}, ...]
-- preview_token: 키 없이 여는 신청서 미리보기(/outputs/{token})용.
CREATE TABLE dbo.application (
  id int IDENTITY PRIMARY KEY,
  program_id int NOT NULL REFERENCES dbo.program (id),
  child_id int NOT NULL REFERENCES dbo.child (id),
  form_draft nvarchar(max) NULL CHECK (ISJSON(form_draft) = 1),
  checklist nvarchar(max) NULL CHECK (ISJSON(checklist) = 1),
  status nvarchar(10) NOT NULL DEFAULT N'준비' CHECK (status IN (N'준비', N'승인 대기', N'제출', N'접수', N'보완 요청', N'선정', N'미선정')),
  submitted_at datetime2(0) NULL,
  result_on date NULL,
  preview_token uniqueidentifier NOT NULL DEFAULT NEWID() UNIQUE
);

-- refs: {"inbox_item": [id, ...], "session": [...], "usage": [...], "program": [...]}
CREATE TABLE dbo.approval (
  id int IDENTITY PRIMARY KEY,
  child_id int NOT NULL REFERENCES dbo.child (id),
  kind nvarchar(10) NOT NULL CHECK (kind IN (N'확인 요청', N'보강 요청', N'신청 제출', N'문서 공유')),
  title nvarchar(200) NOT NULL,
  draft_text nvarchar(max) NULL,
  refs nvarchar(max) NULL CHECK (ISJSON(refs) = 1),
  status nvarchar(10) NOT NULL DEFAULT N'대기' CHECK (status IN (N'대기', N'승인', N'고쳐서 승인', N'보류', N'보냄')),
  decided_at datetime2(0) NULL
);

CREATE TABLE dbo.agent_run (
  id int IDENTITY PRIMARY KEY,
  [trigger] nvarchar(50) NOT NULL,
  input_ids nvarchar(400) NULL,
  steps nvarchar(max) NULL CHECK (ISJSON(steps) = 1),
  manual_steps smallint NULL,
  approvals smallint NULL,
  status nvarchar(20) NOT NULL,
  started_at datetime2(0) NOT NULL DEFAULT SYSDATETIME(),
  finished_at datetime2(0) NULL
);
