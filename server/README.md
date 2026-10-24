# 이음 에이전트 서버

플렉스튜디오 화면이 이벤트 스크립트의 fetch로 부르는 API입니다. 설계는 [연동 계획](../이음-연동-계획.md)과 [MVP 스펙](../이음-MVP-스펙.md#api)을 따릅니다.

- 배포 주소: `https://ieum-agent-server.vercel.app` (Vercel `ieum-agent-server`, 루트 디렉터리 `server`)
- 지금 있는 API: `GET /health`, `GET /views/{뷰}?조건=값`
- 모든 API는 `X-Api-Key` 헤더가 필요합니다(`/health` 제외). 허용 Origin은 `CORS_ORIGINS`로 정합니다.

## 환경 변수

| 이름 | 값 |
| --- | --- |
| `DB_SERVER`, `DB_NAME` | `ieum-sql-d09cb3.database.windows.net`, `ieum` |
| `DB_USER`, `DB_PASSWORD` | `ieum_app` 계정 |
| `IEUM_API_KEY` | 화면 스크립트에 넣는 시연용 서버 키 |
| `CORS_ORIGINS` | 쉼표로 구분한 허용 Origin. 기본 `https://scenario.flextudio.com` |

값은 `~/.config/ieum/azure-sql.env`에 있고 저장소에는 올리지 않습니다. Vercel에는 `vercel env add`로 넣습니다.

## DB 스키마 적용

`sql/`의 파일을 번호 순서대로 빈 DB에 한 번 적용합니다. 관리자 계정으로 실행합니다.

```bash
set -a; . ~/.config/ieum/azure-sql.env; set +a
DB_USER="$DB_ADMIN_USER" DB_PASSWORD="$DB_ADMIN_PASSWORD" npm run db:apply
```

## 배포

저장소 루트에서 실행합니다(프로젝트의 루트 디렉터리가 `server`라서).

```bash
vercel deploy --prod
```
