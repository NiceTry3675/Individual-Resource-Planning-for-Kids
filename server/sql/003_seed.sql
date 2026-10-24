-- 시연 전에 미리 넣어 둘 가상 데이터(MVP 스펙 '가상 데이터' 절의 초안).
-- 장면 1의 이용 내역 6건, 장면 2의 등본처럼 시연 중에 넣는 입력은 여기에 넣지 않는다.
-- 금액·회기·문구는 시나리오 담당이 확정하면 그에 맞춰 고친다. 시연 날짜는 2026-10-24.

SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @child int, @a int, @b int, @c int, @school int;
DECLARE @absent int, @c_change int, @b_change int, @a_change int, @b_makeup int;

INSERT dbo.child (name, birth_date, grade, school_class, disability_type, region, income_bracket, guardian_name, guardian_phone, guardian_email)
VALUES (N'지우', '2019-03-15', 1, N'초등학교 1학년 특수학급', N'발달장애', N'시범 지역', N'기준 중위소득 120% 이하', N'김하늘(엄마, 가명)', N'010-0000-0000', N'ieum-demo@example.com');
SET @child = SCOPE_IDENTITY();

INSERT dbo.organization (child_id, name, kind, contact, color) VALUES (@child, N'A 언어센터', N'발달센터', N'02-000-0001', '#4C8BF5');
SET @a = SCOPE_IDENTITY();
INSERT dbo.organization (child_id, name, kind, contact, color) VALUES (@child, N'B 감각통합센터', N'발달센터', N'02-000-0002', '#F5A623');
SET @b = SCOPE_IDENTITY();
INSERT dbo.organization (child_id, name, kind, contact, color) VALUES (@child, N'C 놀이치료실', N'발달센터', N'02-000-0003', '#7ED321');
SET @c = SCOPE_IDENTITY();
INSERT dbo.organization (child_id, name, kind, contact, color) VALUES (@child, N'학교 특수학급', N'학교', N'02-000-0004', '#9B9B9B');
SET @school = SCOPE_IDENTITY();

-- 이번 달 센터 문자 12개(일정 변경 3, 결석 처리 1, 보강 안내 2, 공지 2, 치료 피드백 4). 이미 해석이 끝난 상태로 넣는다.
INSERT dbo.inbox_item (child_id, kind, raw_text, received_at, processed, event_type, organization_id, occurs_on, quote)
VALUES (@child, N'text', N'[C놀이치료실] 10/12(월) 센터 사정으로 휴무입니다. 지우 수업은 10/13(화) 17:00로 옮겨 진행할게요.', '2026-10-08 10:12', 1, N'일정 변경', @c, '2026-10-12', N'10/13(화) 17:00로 옮겨 진행');
SET @c_change = SCOPE_IDENTITY();
INSERT dbo.inbox_item (child_id, kind, raw_text, received_at, processed, event_type, organization_id, occurs_on, quote)
VALUES (@child, N'text', N'[B감각통합센터] 10/15(목) 지우 수업이 16:30으로 30분 늦춰집니다.', '2026-10-13 18:40', 1, N'일정 변경', @b, '2026-10-15', N'16:30으로 30분 늦춰집니다');
SET @b_change = SCOPE_IDENTITY();
INSERT dbo.inbox_item (child_id, kind, raw_text, received_at, processed, event_type, organization_id, occurs_on, quote)
VALUES (@child, N'text', N'[A언어센터] 10/27(화) 수업은 선생님 일정으로 16:30에 시작합니다.', '2026-10-22 15:05', 1, N'일정 변경', @a, '2026-10-27', N'16:30에 시작합니다');
SET @a_change = SCOPE_IDENTITY();
INSERT dbo.inbox_item (child_id, kind, raw_text, received_at, processed, event_type, organization_id, occurs_on, quote)
VALUES (@child, N'text', N'[A언어센터] 10/20(화) 지우 결석 처리되었습니다. 보강은 센터로 문의 주세요.', '2026-10-20 16:20', 1, N'결석', @a, '2026-10-20', N'10/20 지우 결석 처리되었습니다');
SET @absent = SCOPE_IDENTITY();
INSERT dbo.inbox_item (child_id, kind, raw_text, received_at, processed, event_type, organization_id, occurs_on, quote)
VALUES (@child, N'text', N'[B감각통합센터] 9월 결석분 보강은 10/10(토) 11:00에 진행합니다.', '2026-10-02 09:30', 1, N'보강', @b, '2026-10-10', N'10/10(토) 11:00에 진행');
SET @b_makeup = SCOPE_IDENTITY();
INSERT dbo.inbox_item (child_id, kind, raw_text, received_at, processed, event_type, organization_id, occurs_on, quote)
VALUES (@child, N'text', N'[A언어센터] 이번 달 보강 가능 시간 안내: 10/28(수) 16:00, 10/30(금) 15:00. 원하시면 회신 주세요.', '2026-10-21 11:00', 1, N'보강', @a, '2026-10-28', N'10/28(수) 16:00, 10/30(금) 15:00');
INSERT dbo.inbox_item (child_id, kind, raw_text, received_at, processed, event_type, organization_id, occurs_on, quote)
VALUES (@child, N'text', N'[C놀이치료실] 10/9(금) 한글날은 휴무입니다.', '2026-10-05 17:10', 1, N'공지', @c, '2026-10-09', N'10/9(금) 한글날은 휴무');
INSERT dbo.inbox_item (child_id, kind, raw_text, received_at, processed, event_type, organization_id, occurs_on, quote)
VALUES (@child, N'text', N'[A언어센터] 11월부터 건물 주차장 이용 시간이 18:00까지로 바뀝니다.', '2026-10-19 13:00', 1, N'공지', @a, '2026-11-01', N'주차장 이용 시간이 18:00까지로');
INSERT dbo.inbox_item (child_id, kind, raw_text, received_at, processed, event_type, organization_id, occurs_on, quote)
VALUES (@child, N'text', N'[C놀이치료실] 오늘 지우가 차례 지키기 놀이를 끝까지 해냈어요. 집에서도 보드게임으로 연습해 주세요.', '2026-10-05 17:00', 1, N'치료 피드백', @c, '2026-10-05', N'차례 지키기 놀이를 끝까지 해냈어요');
INSERT dbo.inbox_item (child_id, kind, raw_text, received_at, processed, event_type, organization_id, occurs_on, quote)
VALUES (@child, N'text', N'[A언어센터] 오늘은 두 단어 문장 만들기를 했어요. "엄마 물" 같은 표현이 늘었습니다.', '2026-10-06 16:50', 1, N'치료 피드백', @a, '2026-10-06', N'두 단어 문장 만들기');
INSERT dbo.inbox_item (child_id, kind, raw_text, received_at, processed, event_type, organization_id, occurs_on, quote)
VALUES (@child, N'text', N'[B감각통합센터] 그네 활동에서 균형 잡는 시간이 지난달보다 길어졌어요.', '2026-10-08 17:00', 1, N'치료 피드백', @b, '2026-10-08', N'균형 잡는 시간이 지난달보다 길어졌어요');
INSERT dbo.inbox_item (child_id, kind, raw_text, received_at, processed, event_type, organization_id, occurs_on, quote)
VALUES (@child, N'text', N'[A언어센터] 그림 카드 보고 이름 말하기 정답률이 80%까지 올랐어요.', '2026-10-13 16:50', 1, N'치료 피드백', @a, '2026-10-13', N'정답률이 80%까지');

-- 10월 회기(주간 일정 + 위 문자로 바뀐 것). 10/24 이전은 출석·결석·취소, 이후는 예정.
INSERT dbo.session (organization_id, therapy, therapist, [date], start_time, minutes, unit_price, funding, status, inbox_item_id) VALUES
  (@a, N'언어치료', N'언어치료사 A', '2026-10-06', '16:00', 40, 30000, N'바우처', N'출석', NULL),
  (@a, N'언어치료', N'언어치료사 A', '2026-10-13', '16:00', 40, 30000, N'바우처', N'출석', NULL),
  (@a, N'언어치료', N'언어치료사 A', '2026-10-20', '16:00', 40, 30000, N'바우처', N'결석', @absent),
  (@a, N'언어치료', N'언어치료사 A', '2026-10-27', '16:30', 40, 30000, N'바우처', N'예정', @a_change),
  (@b, N'감각통합', N'감각통합치료사 B', '2026-10-01', '16:00', 50, 40000, N'바우처', N'출석', NULL),
  (@b, N'감각통합', N'감각통합치료사 B', '2026-10-08', '16:00', 50, 40000, N'바우처', N'출석', NULL),
  (@b, N'감각통합', N'감각통합치료사 B', '2026-10-10', '11:00', 50, 40000, N'바우처', N'보강', @b_makeup),
  (@b, N'감각통합', N'감각통합치료사 B', '2026-10-15', '16:30', 50, 40000, N'바우처', N'출석', @b_change),
  (@b, N'감각통합', N'감각통합치료사 B', '2026-10-22', '16:00', 50, 40000, N'바우처', N'출석', NULL),
  (@b, N'감각통합', N'감각통합치료사 B', '2026-10-29', '16:00', 50, 40000, N'바우처', N'예정', NULL),
  (@c, N'놀이치료', N'놀이치료사 C', '2026-10-05', '16:00', 50, 50000, N'자부담', N'출석', NULL),
  (@c, N'놀이치료', N'놀이치료사 C', '2026-10-12', '16:00', 50, 50000, N'자부담', N'취소', @c_change),
  (@c, N'놀이치료', N'놀이치료사 C', '2026-10-13', '17:00', 50, 50000, N'자부담', N'보강', @c_change),
  (@c, N'놀이치료', N'놀이치료사 C', '2026-10-19', '16:00', 50, 50000, N'자부담', N'출석', NULL),
  (@c, N'놀이치료', N'놀이치료사 C', '2026-10-26', '16:00', 50, 50000, N'자부담', N'예정', NULL);

-- 이번 달 바우처 한도. 사용액·잔액·남은 날은 장면 1에서 서버가 계산한다.
INSERT dbo.voucher_month (child_id, program_name, [month], limit_amount, self_pay)
VALUES (@child, N'발달재활서비스', '2026-10-01', 200000, 0);

-- 서류함. 장면 2 공고가 요구하는 주민등록등본은 일부러 비워 둔다.
INSERT dbo.document (child_id, doc_type, issued_on, valid_until, file_ref) VALUES
  (@child, N'장애인증명서', '2026-09-15', '2026-12-14', N'seed/disability_certificate.png'),
  (@child, N'진단서', '2026-03-10', '2027-03-09', N'seed/diagnosis.png');

-- 시범 지역 공고 5건. 지우에게 해당하는 것은 첫 번째 하나다.
INSERT dbo.program (source, source_url, title, org_name, target_rule, deadline, apply_channel, required_docs) VALUES
  (N'board', N'https://example.org/notice/101', N'주말 사회성 교실 참여자 모집', N'가족복지관',
   N'{"grade_min": 1, "grade_max": 3, "disability": ["발달장애"], "region": "시범 지역"}', '2026-10-29', N'email',
   N'["참가 신청서", "장애인증명서", "주민등록등본"]'),
  (N'board', N'https://example.org/notice/102', N'청소년 진로 체험 캠프', N'청소년수련관',
   N'{"grade_min": 7, "grade_max": 9, "disability": ["발달장애", "지체장애"], "region": "시범 지역"}', '2026-11-05', N'online',
   N'["참가 신청서", "장애인증명서"]'),
  (N'board', N'https://example.org/notice/103', N'장애아동 미술 교실', N'다른 지역 장애인복지관',
   N'{"grade_min": 1, "grade_max": 6, "disability": ["발달장애"], "region": "다른 지역"}', '2026-11-02', N'visit',
   N'["참가 신청서", "장애인증명서", "주민등록등본"]'),
  (N'api', N'https://example.org/notice/104', N'시각장애 아동 점자 교실', N'시각장애인복지관',
   N'{"grade_min": 1, "grade_max": 6, "disability": ["시각장애"], "region": "시범 지역"}', '2026-11-10', N'email',
   N'["참가 신청서", "장애인증명서"]'),
  (N'api', N'https://example.org/notice/105', N'미취학 아동 놀이 발달 프로그램', N'육아종합지원센터',
   N'{"grade_min": 0, "grade_max": 0, "disability": ["발달장애"], "region": "시범 지역"}', '2026-10-31', N'online',
   N'["참가 신청서"]');

COMMIT TRANSACTION;
