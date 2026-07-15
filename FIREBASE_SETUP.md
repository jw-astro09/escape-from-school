# Firebase 설정

## 1. Authentication

Firebase Console의 **Authentication > Sign-in method**에서 다음 제공자를 활성화합니다.

- Email/Password
- Google

**Settings > Authorized domains**에 `jw-astro09.github.io`를 추가합니다.

## 2. Cloud Firestore

Firestore Database를 만든 뒤 `firestore.rules` 내용을 Rules 탭에 붙여 넣고 Publish합니다.

Firebase CLI를 사용하는 경우에는 프로젝트 루트에서 다음 명령으로 배포할 수 있습니다.

```powershell
firebase use escape-2026
firebase deploy --only firestore:rules
```

## 3. 관리자 지정

1. 관리자 계정으로 먼저 사이트에 로그인합니다.
2. Firebase Console의 Authentication에서 해당 계정의 **User UID**를 복사합니다.
3. Firestore에서 `admins` 컬렉션을 만들고, 문서 ID를 그 UID로 지정합니다.
4. 문서 필드에는 `role` 문자열 값 `admin`을 하나 추가합니다.

`admins/{UID}` 문서는 클라이언트에서 생성하거나 수정할 수 없습니다. 이 문서가 있는 계정만 Q&A 답변을 저장할 수 있습니다.
