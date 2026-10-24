-- 시연 전에 미리 넣어 둘 가상 데이터. 값은 프론트 목업(이음/src/mocks/ieum.ts)과 맞춘다.
-- 회기·이용 내역·장면 입력은 지금 프론트 목업이 들고 있어 여기에 넣지 않는다.
-- 넘기기로 들어온 문자는 POST /inbox가 inbox_item에 쌓는다.

SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @child int;

INSERT dbo.child (name, birth_date, grade, school_class, disability_type, region, income_bracket, guardian_name, guardian_phone, guardian_email)
VALUES (N'지우', '2019-05-14', 1, N'특수학급', N'발달장애', N'시범구', N'2구간', N'지우 엄마', N'010-1234-5678', NULL);
SET @child = SCOPE_IDENTITY();

INSERT dbo.organization (child_id, name, kind, contact, color) VALUES
  (@child, N'A 언어센터', N'발달센터', NULL, '#4C8BF5'),
  (@child, N'B 감각통합센터', N'발달센터', NULL, '#F5A623'),
  (@child, N'C 놀이치료실', N'발달센터', NULL, '#7ED321'),
  (@child, N'학교 특수학급', N'학교', NULL, '#9B9B9B');

INSERT dbo.voucher_month (child_id, program_name, [month], limit_amount, self_pay)
VALUES (@child, N'발달재활 바우처', '2026-10-01', 350000, 0);

-- 서류함. 시범구 주말 사회성 프로그램이 요구하는 장애인증명서는 일부러 비워 둔다.
INSERT dbo.document (child_id, doc_type, issued_on, valid_until, file_ref) VALUES
  (@child, N'복지카드 사본', '2026-03-12', NULL, N'복지카드_사본.jpg'),
  (@child, N'진단서', '2025-11-11', '2026-11-10', N'진단서.pdf');

-- 시범 지역 공고 5건. 지우에게 해당하는 것은 첫 번째 하나다.
INSERT dbo.program (source, source_url, title, org_name, target_rule, deadline, apply_channel, required_docs) VALUES
  (N'board', N'https://example.org/ieum-sample/notice-1', N'주말 사회성 프로그램 참여자 모집', N'시범구청 복지과',
   N'{"grade_min": 1, "grade_max": 3, "disability": ["발달장애"], "region": "시범구"}', '2026-11-06', N'email',
   N'["참가 신청서", "복지카드 사본", "장애인증명서"]'),
  (N'board', N'https://example.org/ieum-sample/notice-2', N'중학생 진로 체험 캠프', N'시범구 장애인복지관',
   N'{"grade_min": 7, "grade_max": 9, "disability": ["발달장애", "지체장애"], "region": "시범구"}', '2026-11-13', N'online',
   N'["참가 신청서"]'),
  (N'board', N'https://example.org/ieum-sample/notice-3', N'영유아 부모교육 프로그램', N'시범구 건강가정지원센터',
   N'{"grade_min": 0, "grade_max": 0, "disability": ["발달장애"], "region": "시범구"}', '2026-11-20', N'visit',
   N'["참가 신청서"]'),
  (N'api', N'https://example.org/ieum-sample/notice-4', N'청각장애 아동 보청기 지원', N'시범구청 장애인복지과',
   N'{"grade_min": 0, "grade_max": 12, "disability": ["청각장애"], "region": "시범구"}', '2026-12-04', N'gov24',
   N'["지원 신청서", "장애인증명서"]'),
  (N'board', N'https://example.org/ieum-sample/notice-5', N'이웃구 방과후 돌봄 교실', N'이웃구 복지관',
   N'{"grade_min": 1, "grade_max": 6, "disability": ["발달장애"], "region": "이웃구"}', '2026-11-27', N'online',
   N'["참가 신청서"]');

COMMIT TRANSACTION;
