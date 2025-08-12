# GoHumanLoop Hub [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<div align="center">

![Wordmark Logo of HumanLayer](http://cdn.oyster-iot.cloud/gohumanloop-logo.svg)

<b face="Microsoft YaHei">Human X Agent Collaboration Platform</b>

</div>

`GoHumanLoopHub` serves as the official server Platform for the [`GoHumanLoop`](https://github.com/ptonlix/gohumanloop) SDK, dedicated to handling human–AI collaboration requests. It provides features such as user management, API key management, task data management, and collaborative request management.

> 💡 **GoHumanLoop**: A Python library empowering AI agents to dynamically request human input (approval/feedback/conversation) at critical stages. Core features:
>
> - `Human-in-the-loop control`: Lets AI agent systems pause and escalate decisions, enhancing safety and trust.
> - `Multi-channel integration`: Supports Terminal, Email, API, and frameworks like LangGraph/CrewAI.
> - `Flexible workflows`: Combines automated reasoning with human oversight for reliable AI operations.
>
> Ensures responsible AI deployment by bridging autonomous agents and human judgment.

## 🛠️ Tech Stack & Features

- ⚡ [**FastAPI**](https://fastapi.tiangolo.com) — Python backend API.

  - 🧰 [SQLModel](https://sqlmodel.tiangolo.com) — SQL database interactions in Python (ORM).
  - 🔍 [Pydantic](https://docs.pydantic.dev) — Used by FastAPI for data validation and settings management.
  - 💾 [PostgreSQL](https://www.postgresql.org) — SQL database.
  - 🔄 [Alembic](https://alembic.sqlalchemy.org) — Database migration tool.
  - 🔥 [Redis](https://redis.io) — For caching and session storage.
  - 📖 [MongoDB](https://www.mongodb.com/) — For storing task data.

- 🚀 [React](https://react.dev) — Frontend development.

  - 💃 Modern frontend stack using TypeScript, Hooks, Vite, etc.
  - 🎨 [Chakra UI](https://chakra-ui.com) — UI component library.
  - 🤖 Auto-generated frontend client.
  - 🧪 [Playwright](https://playwright.dev) — End-to-end testing.
  - 🦇 Dark Mode support.

- 🐋 [Docker Compose](https://www.docker.com) — For development and production deployment.
- 🔒 Secure password hashing enabled by default.
- 🔑 JWT (JSON Web Token) authentication.
- 📫 Password recovery via email.
- ✅ Testing with [Pytest](https://pytest.org).
- 📞 [Traefik](https://traefik.io) — Reverse proxy/load balancer.
- 🚢 Deployment instructions using Docker Compose, including frontend Traefik proxy setup for automatic HTTPS certificates.
- 🏭 CI/CD with GitHub Actions.

## 🚀 Deployment & Usage

- Make sure Docker and Docker Compose are installed.
- Clone the repository: `git clone https://github.com/ptonlix/gohumanloophub.git`
- Enter the project directory: `cd gohumanloophub`
- Copy the sample environment variables file: `cp .env.example .env`
- Edit `.env` to configure database connection, Redis connection, etc.
- Start the service: `docker compose up -d`
- Access the frontend: `http://localhost:5173`
- Access API docs: `http://localhost:8000/docs`
- Register an account and log in.
- Create an API key.
- Start developing agents with the [`GoHumanLoop`](https://github.com/ptonlix/gohumanloop) SDK.
- Refer to the [`GoHumanLoop`](https://github.com/ptonlix/gohumanloop) documentation for more details.
- In the Human–AI Collaboration list, view and manage collaboration requests sent by the SDK.
- In the Task Data list, view task data synchronized from the SDK.

## 📚 Overall Architecture Design

<div align="center">
	<img height=300 src="http://cdn.oyster-iot.cloud/202508130024371.png"><br>
    <b face="Microsoft YaHei">Architecture Relationship between GoHumanLoop and GoHumanLoopHub</b>
</div>

### Architecture Description

1. When building agents based on frameworks like LangGraph or CrewAI, using the `GoHumanLoop` SDK enables better human–AI collaboration. It is especially suited for long-running scenarios like Manus, where asynchronous interaction with agents is required, and can enhance collaboration through simple integration.
2. Inside `GoHumanLoop`, the HumanLoop Task Manager and Request Providers interact with GoHumanLoopHub via API.
3. `GoHumanLoopHub` can also integrate with platforms like Feishu (Lark) and WeCom (WeChat Work) through a conversion layer. Examples are provided in [gohumanloop-feishu](https://github.com/ptonlix/gohumanloop-feishu) and [gohumanloop-wework](https://github.com/ptonlix/gohumanloop-wework). More OA platform integrations will be added to embed human–AI collaboration deeper into business workflows.
4. Administrators can use the APIs provided by `GoHumanLoopHub` to interact with agents, supplying user information, feedback, approvals, etc.
5. `GoHumanLoopHub` also offers task data management. Agents can synchronize task data to the hub for subsequent analysis and management.

## 🤝 Contributing

GoHumanLoopHub and its documentation are open-source. Contributions in the form of issues, documentation, and pull requests are welcome.

## 📱 Contact

<img height=300 src="http://cdn.oyster-iot.cloud/202505231802103.png"/>

🎉 If you’re interested in this project, feel free to scan the QR code to contact the author.
