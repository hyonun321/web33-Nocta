<div align="center">

  ![image](https://github.com/user-attachments/assets/092d9872-7c7c-475c-88bb-f251abd84f49)
  <br>
  ![image](https://github.com/user-attachments/assets/dba641b3-417d-4bb6-9c87-4cfc78d8324c)
  <br>
 

</div>

<div align="center">

## 📑 문서 작성이 더 편하고 즐거워진다

  <a href="https://nocta.site" title="🌌 밤하늘의 별빛처럼, 자유로운 인터랙션 실시간 에디터"><strong>배포 사이트</strong></a>

**🤔 하나의 문서를 작성하면서 다른 문서도 함께 보고 싶었던 적 있으신가요?**

문서 작성할 때 여러 창을 띄워두고 번거롭게 작업하셨던 불편함이 있었죠.

기존 에디터들은 하나의 창에 갇혀있어서, 참고할 내용이 있을 때마다 창을 이동해야 했어요.

Nocta는 에디터에 새로운 바람을 불어넣었어요.

**탭 브라우징으로 여러 문서를 자유롭게 넘나들 수 있고, 인터랙티브한 요소들로 문서 작성이 더 흥미롭게 변화됩니다.**

Nocta에서 단순한 기록을 넘어, 새로운 글쓰기 경험을 시작하세요.

[노션](https://abrupt-feta-9a9.notion.site/web33-12a9ff1b21c38003b600f57baa654626?pvs=4) 

[기획](https://abrupt-feta-9a9.notion.site/12a9ff1b21c380b4b3bafc3af92b2a25?pvs=4) | [디자인](https://abrupt-feta-9a9.notion.site/12f9ff1b21c380459f74f7a2e4fb7a93?pvs=4)

[개발위키](https://abrupt-feta-9a9.notion.site/12a9ff1b21c380f2a490deae65256639?pvs=4) | [DB스키마](https://abrupt-feta-9a9.notion.site/DB-708e1cf3c1454b3c950bff67d0924dde?pvs=4) | [백로그](https://abrupt-feta-9a9.notion.site/12e9ff1b21c380ecb202f869f6ad040e?pvs=4)

 [그라운드룰](https://abrupt-feta-9a9.notion.site/12a9ff1b21c3807ca2b8e308178e5c2f?pvs=4) | [스크럼회의록](https://abrupt-feta-9a9.notion.site/12a9ff1b21c38087848fcd2d37445005?pvs=4) | [스프린트회의록](https://abrupt-feta-9a9.notion.site/12a9ff1b21c380ac876cdd60332f5826?pvs=4) | [회고록](https://abrupt-feta-9a9.notion.site/12a9ff1b21c380959d92e485fcc94f8a?pvs=4)
 
 <a href="https://hits.seeyoufarm.com"><img src="https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fboostcampwm-2024%2Fweb33-Nocta&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=hits&edge_flat=false"/></a>

</div>




## 🚩 목차

- [Nocta만의 차별점](#-nocta만의-차별점)
- [기술스택](#-기술-스택)
- [시스템 아키텍처 다이어그램](#시스템-아키텍처-다이어그램)
- [프로젝트 시작 가이드](#-프로젝트-시작-가이드)


## ✨ Nocta만의 차별점

### 1. 페이지 생성, 드래그 앤 드랍

사이드바의 페이지 추가 버튼을 통해 페이지를 생성하고 관리할 수 있습니다.

![111111](https://github.com/user-attachments/assets/7bbbd091-a906-49b1-8043-13240bdf2f5b)

### 2. 탭 브라우징: 최소화 최대화 리사이즈

각각의 문서를 탭브라우징 방식으로 관리할 수 있습니다. 크기를 조절하거나 드래그 앤 드랍을 통해 원하는 위치에 위치시킬 수 있습니다.

![22222](https://github.com/user-attachments/assets/7355a84a-7ff5-44c5-a3d0-24840a468818)

### 3. 실시간 마크다운 편집

마크다운 문법을 입력하면 실시간으로 마크다운 문법으로 변환합니다.

![33333](https://github.com/user-attachments/assets/ffcf7fa5-9436-4e6b-b38f-6fbf9e813cb5)

### 4.실시간 동시편집(구현중)

하나의 문서를 여러 사용자가 동시에 편집이 가능합니다. CRDT 알고리즘을 통해 실시간 변경사항을 모든 사용자에게 반영합니다.


## 🔧 기술 스택

**Common**

<div align="left"> <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=TypeScript&logoColor=white"/> <img src="https://img.shields.io/badge/Prettier-F7B93E?style=flat-square&logo=Prettier&logoColor=black"/> <img src="https://img.shields.io/badge/ESLint-4B32C3?style=flat-square&logo=ESLint&logoColor=white"/> <img src="https://img.shields.io/badge/Jest-C21325?style=flat-square&logo=Jest&logoColor=white"/> <img src="https://img.shields.io/badge/PNPM-F69220?style=flat-square&logo=PNPM&logoColor=white"/> <img src="https://img.shields.io/badge/Playwright-2EAD33?style=flat-square&logo=Playwright&logoColor=white"/> </div>

**Frontend**

<div align="left"> <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=React&logoColor=black"/> <img src="https://img.shields.io/badge/React_Query-FF4154?style=flat-square&logo=ReactQuery&logoColor=white"/> <img src="https://img.shields.io/badge/Zustand-764ABC?style=flat-square&logo=Zustand&logoColor=white"/> <img src="https://img.shields.io/badge/Panda_CSS-06B6D4?style=flat-square&logo=PandaCSS&logoColor=white"/> <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=Vite&logoColor=white"/> </div>

**Backend**

<div align="left"> <img src="https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=NestJS&logoColor=white"/> <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=MongoDB&logoColor=white"/> </div>

**Infra**

<div align="left"> <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=Docker&logoColor=white"/> <img src="https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=Nginx&logoColor=white"/> <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=GitHubActions&logoColor=white"/> <img src="https://img.shields.io/badge/NCloud-03C75A?style=flat-square&logo=Naver&logoColor=white"/> </div>

## 시스템 아키텍처 다이어그램

![image](https://github.com/user-attachments/assets/ab96462b-5f38-4dd9-9c72-984829fa873d)


## 📅 프로젝트 기간

> 2024.10.28 ~ 2024.12.06

## 🌱 팀원 소개

|                                김현훈                                 |                                민연규                                 |                                 민정우                                 |                                  장서윤                                   |
| :-------------------------------------------------------------------: | :-------------------------------------------------------------------: | :--------------------------------------------------------------------: | :-----------------------------------------------------------------------: |
| <img src="https://github.com/hyonun321.png" width="100" height="100"> | <img src="https://github.com/Ludovico7.png" width="100" height="100"> | <img src="https://github.com/minjungw00.png" width="100" height="100"> | <img src="https://github.com/pipisebastian.png" width="100" height="100"> |
|                                 FE+BE                                 |                                  FE                                   |                                   BE                                   |                                    FE                                     |
|              [@hyonun321](https://github.com/hyonun321)               |              [@Ludovico7](https://github.com/Ludovico7)               |              [@minjungw00](https://github.com/minjungw00)              |            [@pipisebastian](https://github.com/pipisebastian)             |


## 🔗 프로젝트 링크

| 노션                                                                                       | 디자인    |
| :----------------------------------------------------------------------------------------- | :-------- |
| [Notion](https://abrupt-feta-9a9.notion.site/web33-12a9ff1b21c38003b600f57baa654626?pvs=4) |  |


## 🚀 프로젝트 시작 가이드

```bash
# 저장소 복제
git clone https://github.com/boostcampwm-2024/web33-boostproject.git

# 의존성 설치
pnpm install

# 프로덕션 빌드
pnpm run build

# 프로젝트 개발 모드 실행
# Frontend: http://localhost:5173/
# Backend: http://localhost:3000/
pnpm run dev

# 프로젝트 Docker 빌드 후 실행 (http://localhost/)
docker-compose up -d --build
```




