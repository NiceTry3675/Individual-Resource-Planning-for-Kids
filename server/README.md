# 이음 에이전트 서버

플렉스튜디오 화면이 이벤트 스크립트의 fetch로 부르는 API입니다. 설계는 [연동 계획](../이음-연동-계획.md)과 [MVP 스펙](../이음-MVP-스펙.md#api)을 따릅니다.

- 배포 주소: `https://ieum-agent-server.vercel.app` (Vercel `ieum-agent-server`, 루트 디렉터리 `server`)
- 지금 있는 API:
  - `GET /health`
  - `GET /views/{뷰}?조건=값`: 화면별 뷰 조회
  - `GET /profile`, `POST /profile`: 아이 프로필(프론트 `Profile` 형태)
  - `GET /documents`: 서류함
  - `POST /inbox` `{texts: string[]}`: 문자 접수, run id를 돌려줌
  - `GET /runs/{id}`: 접수한 문자를 OpenAI(`OPENAI_MODEL`, 기본 gpt-6.1-sol)로 해석해 inbox_item에 반영하고 결과를 돌려줌. 25초 안에 끝나지 않거나 실패하면 규칙 기반 대체 결과를 씀
- 모든 API는 `X-Api-Key` 헤더가 필요합니다(`/health` 제외). 허용 Origin은 `CORS_ORIGINS`로 정합니다.

## 환경 변수

| 이름 | 값 |
| --- | --- |
| `DB_SERVER`, `DB_NAME` | `ieum-sql-d09cb3.database.windows.net`, `ieum` |
| `DB_USER`, `DB_PASSWORD` | `ieum_app` 계정 |
| `IEUM_API_KEY` | 화면 스크립트에 넣는 시연용 서버 키 |
| `CORS_ORIGINS` | 쉼표로 구분한 허용 Origin. `https://*.flextudio.com`처럼 하위 도메인 와일드카드 가능. 지금 값은 `https://scenario.flextudio.com,https://*.flextudio.com,http://localhost:5173` |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | 문자 해석에 쓰는 OpenAI 키와 모델(`gpt-6.1-sol`) |

값은 `~/.config/ieum/azure-sql.env`에 있고 저장소에는 올리지 않습니다. Vercel에는 `vercel env add`로 넣습니다.

## DB 스키마 적용

`sql/`의 파일을 번호 순서대로 빈 DB에 한 번 적용합니다. 관리자 계정으로 실행합니다.

```bash
set -a; . ~/.config/ieum/azure-sql.env; set +a
DB_USER="$DB_ADMIN_USER" DB_PASSWORD="$DB_ADMIN_PASSWORD" npm run db:apply
```

시연 데이터만 처음 상태로 되돌릴 때(스키마는 그대로):

```bash
DB_USER="$DB_ADMIN_USER" DB_PASSWORD="$DB_ADMIN_PASSWORD" node scripts/apply-sql.mjs scripts/reset-data.sql sql/003_seed.sql
```

## 배포

저장소 루트에서 실행합니다(프로젝트의 루트 디렉터리가 `server`라서).

```bash
vercel deploy --prod
```
