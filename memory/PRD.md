# Bloom - AI Financial Mentor PRD

## Problem Statement
Build an AI Financial Mentor web app solving "dashboard fatigue" with a mentor-led conversational interface for first-time investors (ages 21-30). Product journey: Analysis → Education → Guidance.

## Architecture
- **Frontend**: React + Shadcn UI + Tailwind CSS + Framer Motion + Recharts
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **AI**: OpenAI GPT-4o
- **Auth**: JWT-based (python-jose + passlib/bcrypt)

## User Personas
- **Primary**: First-time investors aged 21-30 (students, young professionals)
- **Secondary**: Anyone wanting to learn personal finance basics

## Core Requirements
1. User authentication (register/login with JWT)
2. 5-step onboarding quiz (income, surplus, emergency fund, goal, risk comfort)
3. Dynamic compounding visualizer (10 years, 7% annual return)
4. GPT-powered AI mentor chat with ELI5 tone
5. Safety guardrails (emergency fund warning, no stock recommendations)
6. Mandatory disclaimer: "I am an AI educational assistant, not a licensed financial advisor"

## What's Been Implemented (March 2026)
- [x] Full auth system (register/login/logout/JWT)
- [x] 5-step conversational onboarding quiz with animations
- [x] MongoDB persistence (users, quiz_responses, chat_messages)
- [x] Dynamic compounding chart (AreaChart with gradient fills)
- [x] Dashboard with financial snapshot cards + emergency fund warning
- [x] AI chat interface with suggested prompts, typing indicator, clear history
- [x] Navbar with navigation and user dropdown
- [x] "Bloom" design system (warm cream, coral, lilac, glassmorphism)
- [x] Responsive design (mobile + desktop)
- [x] data-testid on all interactive elements

## MoSCoW Backlog

| Priority | User Story |
|----------|-----------|
| Must | As a new user, I want to complete an onboarding quiz so that the mentor understands my financial situation |
| Must | As a user, I want to chat with an AI mentor so that I can learn about finance in simple terms |
| Must | As a user, I want to see a compounding chart so that I understand how my savings can grow |
| Should | As a user, I want to reset my quiz so that I can update my financial profile |
| Could | As a user, I want to see personalized action plans so that I have clear next steps |

## Prioritized Backlog (P0/P1/P2)
- **P0**: All core features implemented ✅
- **P1**: Streaming AI responses, goal tracking dashboard, export chat history
- **P2**: Multiple chat sessions, financial calculators (loan, mortgage), dark mode toggle

## Known Issues
- OpenAI API quota exceeded on user's key - chat AI responses may fail until billing is resolved

## Next Tasks
1. Add streaming responses for real-time AI chat
2. Implement goal progress tracking
3. Add more financial calculators (loan, retirement, etc.)
4. Push-notification reminders for savings goals
