<div align="center">

![Wordmark Logo of HumanLayer](http://cdn.oyster-iot.cloud/gohumanloop-logo.svg)

<b face="雅黑">Human X Agent 协作平台</b>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

`GoHumanLoopHub` 是作为 [`GoHumanLoop`](https://github.com/ptonlix/gohumanloop) SDK 的官方服务平台，专门用于处理人机协同的请求，提供了用户管理、API 密钥管理、任务数据、协同请求管理等功能。

> 💡 **GoHumanLoop**: A Python library empowering AI agents to dynamically request human input (approval/feedback/conversation) at critical stages. Core features:
>
> - `Human-in-the-loop control`: Lets AI agent systems pause and escalate >decisions, enhancing safety and trust.
> - `Multi-channel integration`: Supports Terminal, Email, API, and frameworks like LangGraph/CrewAI.
> - `Flexible workflows`: Combines automated reasoning with human oversight for reliable AI operations.
>
> Ensures responsible AI deployment by bridging autonomous agents and human judgment.

## 🛠️ 技术栈&特性

- ⚡ [**FastAPI**](https://fastapi.tiangolo.com) —— 用于 Python 后端 API。

  - 🧰 [SQLModel](https://sqlmodel.tiangolo.com) —— Python 中的 SQL 数据库交互（ORM）。
  - 🔍 [Pydantic](https://docs.pydantic.dev) —— 被 FastAPI 使用，用于数据验证和配置管理。
  - 💾 [PostgreSQL](https://www.postgresql.org) —— 作为 SQL 数据库。
  - 🔄 [Alembic](https://alembic.sqlalchemy.org) —— 数据库迁移工具。
  - 🔥 [Redis](https://redis.io) —— 用于缓存和会话存储。
  - 📖 [mongodb](https://www.mongodb.com/) —— 用于存储任务数据。

- 🚀 [React](https://react.dev) —— 用于前端开发。

  - 💃 使用 TypeScript、Hooks、Vite 等现代前端技术栈。
  - 🎨 [Chakra UI](https://chakra-ui.com) —— 前端组件库。
  - 🤖 自动生成的前端客户端。
  - 🧪 [Playwright](https://playwright.dev) —— 端到端测试。
  - 🦇 支持深色模式（Dark Mode）。

- 🐋 [Docker Compose](https://www.docker.com) —— 用于开发和生产环境部署。
- 🔒 默认启用安全的密码哈希。
- 🔑 JWT（JSON Web Token）身份认证。
- 📫 基于电子邮件的密码找回功能。
- ✅ 使用 [Pytest](https://pytest.org) 进行测试。
- 📞 [Traefik](https://traefik.io) —— 作为反向代理/负载均衡器。
- 🚢 使用 Docker Compose 部署说明，包括如何设置前端 Traefik 代理以自动处理 HTTPS 证书。
- 🏭 基于 GitHub Actions 的 CI（持续集成）和 CD（持续部署）。

## 🚀 部署与使用

- 确保已安装 Docker 和 Docker Compose。
- 克隆此仓库：`git clone https://github.com/ptonlix/gohumanloophub.git`
- 进入项目目录：`cd gohumanloophub`
- 复制示例环境变量文件：`cp .env.example .env`
- 编辑 `.env` 文件，配置数据库连接、Redis 连接等。
- 启动服务：`docker compose up -d`
- 访问前端应用：`http://localhost:5173`
- 访问 API 文档：`http://localhost:8000/docs`
- 注册一个账号并登录。
- 创建一个 API 密钥。
- 开始使用 [`GoHumanLoop`](https://github.com/ptonlix/gohumanloop) SDK 开发对应的智能体。
- 查看 [`GoHumanLoop`](https://github.com/ptonlix/gohumanloop) 文档了解更多信息。
- 在人机协同列表中，查看并操作 SDK 传输上来的人机协同请求。
- 查看任务数据列表，查看 SDK 同步传输上来的任务数据。

## 📚 整体架构设计

<div align="center">
	<img height=360 src="http://cdn.oyster-iot.cloud/202508130024371.png"><br>
    <b face="雅黑">GoHumanLoop与GoHumanLoopHub架构关系</b>
</div>

### 架构说明

1. 基于 LangGraph、CrewAI 等 Agent 框架构建的智能体时，使用`GoHumanLoop`SDK 能更好进行人机协同，特别是在类似 Manus 长耗时场景，需要异步与 Agent 进行交互的场景，通过简单的封装即可增强人机协同能力
2. `GoHumanLoop`内部提供 HumanLoop 任务管理器和请求处理提供者(Provider),通过 API 方式与 GoHumanLoopHub 进行交互
3. `GoHumanLoopHub`还能与飞书、企业微信等进行集成，实现与飞书、企业微信等应用的无缝对接。需要依赖一层转换层，目前已提供对应的服务程序例子[gohumanloop-feishu](https://github.com/ptonlix/gohumanloop-feishu)和[gohumanloop-wework](https://github.com/ptonlix/gohumanloop-wework) 后续还会继续拓展其它 OA 平台，让人机协同更好的集成到业务当中
4. 管理人员通过`GoHumanLoopHub`提供的 API 接口，Agent 进行交互，提供用户信息、反馈、审批等信息。
5. `GoHumanLoopHub`还提供了任务数据管理功能，Agent 可以将任务数据同步到`GoHumanLoopHub`中，方便后续分析和管理。

## 🤝 参与贡献

GoHumanLoopHub 和文档均开源，我们欢迎以问题、文档和 PR 等形式做出贡献。

## 📱 联系方式

<img height=300 src="http://cdn.oyster-iot.cloud/202505231802103.png"/>

🎉 如果你对本项目感兴趣，欢迎扫码联系作者交流
