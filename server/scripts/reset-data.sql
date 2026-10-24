-- 시연 데이터를 모두 지우고 id를 처음부터 다시 매긴다. 스키마는 그대로 둔다.
-- 이 파일 다음에 sql/003_seed.sql을 적용한다:
--   DB_USER="$DB_ADMIN_USER" DB_PASSWORD="$DB_ADMIN_PASSWORD" node scripts/apply-sql.mjs scripts/reset-data.sql sql/003_seed.sql

SET XACT_ABORT ON;
BEGIN TRANSACTION;

DELETE dbo.agent_run;
DELETE dbo.approval;
DELETE dbo.application;
DELETE dbo.program_match;
DELETE dbo.usage;
DELETE dbo.session;
DELETE dbo.voucher_month;
DELETE dbo.document;
DELETE dbo.inbox_item;
DELETE dbo.program;
DELETE dbo.organization;
DELETE dbo.child;

-- 한 번이라도 행이 들어갔던 테이블만 0으로 되돌린다(새 테이블에 RESEED 0을 하면 첫 id가 0이 된다).
DECLARE @t sysname;
DECLARE tables CURSOR LOCAL FAST_FORWARD FOR
  SELECT OBJECT_SCHEMA_NAME(object_id) + '.' + OBJECT_NAME(object_id)
  FROM sys.identity_columns
  WHERE OBJECTPROPERTY(object_id, 'IsUserTable') = 1 AND last_value IS NOT NULL;
OPEN tables;
FETCH NEXT FROM tables INTO @t;
WHILE @@FETCH_STATUS = 0
BEGIN
  DBCC CHECKIDENT (@t, RESEED, 0) WITH NO_INFOMSGS;
  FETCH NEXT FROM tables INTO @t;
END;
CLOSE tables;
DEALLOCATE tables;

COMMIT TRANSACTION;
