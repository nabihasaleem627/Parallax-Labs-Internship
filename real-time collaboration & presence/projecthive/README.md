# ProjectHive — University Project Workspace

A web-based workspace concept for university students and project supervisors to coordinate academic projects and collaborate on shared project content.

**Internship task:** Week 4 — Real-Time Collaboration & Presence  
**Repository folder:** `real-time collaboration & presence/projecthive`

## Overview

ProjectHive is intended to make academic project collaboration clearer and more coordinated. Its Week 4 focus is real-time collaboration: keeping collaborators informed about activity, synchronizing shared changes, and handling connection interruptions gracefully.

> **Implementation note:** This README describes the project goals and setup structure. Confirm the actual features, technology choices, environment variables, and npm scripts in the source code before submitting the project.

## Goals

- Support collaboration on shared project content.
- Show which collaborators are currently active.
- Provide typing or activity indicators where implemented.
- Save edits reliably and communicate save status.
- Handle concurrent edits and potential conflicts safely.
- Show connection status and recover from temporary disconnections.
- Test event broadcasting and synchronization behavior.

## Project Structure

```text
projecthive/
├── client/     # Frontend application
├── server/     # Backend application
└── README.md   # Project documentation
```

Additional configuration, test, and environment files may be present.

## Technology Stack

The application is split into a client and a server. Record the exact frameworks, libraries, database, real-time transport, and testing tools used by checking the relevant source files and each `package.json`.

Do not list a technology as implemented unless it is actually used in this project.

## Prerequisites

Install the tools required by the project's actual implementation. If both applications use Node.js, install a compatible Node.js LTS release and npm.

## Getting Started

### 1. Open the project directory

From the repository root:

```powershell
cd "real-time collaboration & presence\projecthive"
```

### 2. Install dependencies

Install client dependencies:

```powershell
cd client
npm install
```

In a separate terminal, install server dependencies:

```powershell
cd "real-time collaboration & presence\projecthive\server"
npm install
```

### 3. Configure environment variables

Review the server and client configuration to identify the required environment variables. Create local environment files using the names expected by the application and provide the necessary development values.

Never commit secrets, passwords, private API keys, or production credentials. If the project includes an `.env.example`, use it as the starting point.

### 4. Run the applications

Check the `scripts` section in `client/package.json` and `server/package.json`, then run the scripts defined by the project. For example, if a `dev` script exists, use:

```powershell
npm run dev
```

Run the client and server in separate terminals if the project requires both processes. Follow any project-specific configuration documented in the source.

## Real-Time Collaboration Scope

The Week 4 task focuses on the following behaviors, where implemented:

- **Presence:** indicate which collaborators are active in a workspace.
- **Typing indicators:** show when a collaborator is entering content.
- **Synchronization:** broadcast and apply shared updates across connected clients.
- **Saving:** communicate save status and persist changes reliably.
- **Conflict handling:** avoid silently losing changes when users edit concurrently.
- **Connection recovery:** handle temporary disconnections and reconnect when supported.
- **Testing:** verify event delivery and state consistency.

## Testing

Run the test scripts defined in the relevant `package.json` files. Tests should cover, where applicable:

- Real-time event broadcasting.
- Synchronization between multiple clients.
- Presence and typing events.
- Concurrent edits and conflict handling.
- Reconnection and offline/online state transitions.

Document any additional test commands that the project provides.

## Security and Reliability

- Validate incoming data on the server.
- Authenticate users and authorize access to workspaces where required.
- Avoid exposing secrets in client-side code or committing private environment files.
- Handle connection failures and invalid updates gracefully.
- Ensure changes are validated before being persisted.

## Current Status

This repository contains the ProjectHive client/server project structure. Update this section with the verified implementation status before submission, including completed features, known limitations, and test results.

## Author

**Nabiha Saleem**  
**Program:** Parallax Labs Internship  
**Task:** Week 4 — Real-Time Collaboration & Presence
