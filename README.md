# DocuMind

**DocuMind** is a Full-Stack web application demonstrating **document understanding with AI** using a **RAG (Retrieval-Augmented Generation) pattern**. Users can upload documents (PDF or text) and ask questions about their content. The system generates embeddings for semantic search and returns relevant information.

This project focuses on **prompt engineering**, AI-assisted retrieval, and clean Full-Stack design.

---

## 🧩 Key Features

- **Document Upload:** Users can upload PDF or text files.
- **Semantic Search (RAG):** Text chunks are embedded using Azure OpenAI embeddings (stubbed for portfolio). Cosine similarity retrieves relevant chunks for questions.
- **QA with AI:** Users ask natural language questions, system finds relevant document content and answers.
- **Dependency Injection:** All services are registered via DI for clean separation and easy testing.
- **Portfolio-safe:** Stub mode returns dummy embeddings so no API calls or costs occur.
- **Frontend UX:** Accessible citation cards, typing indicators, and clean layout using React + TypeScript.

---

## 🛠️ Tech Stack

- **Backend:** .NET 8, C#, Clean Architecture, Dependency Injection
- **AI / Embeddings:** Azure OpenAI (text-embedding-ada-002) — stubbed for portfolio
- **Storage:** Azure Blob Storage (documents stored securely)
- **Frontend:** React + TypeScript, CSS animations, accessible UI
- **Testing / Demo:** In-memory vector index for fast semantic search
- **Pattern:** Retrieval-Augmented Generation (RAG), Cosine Similarity, Prompt Engineering

---

## ⚙️ How DocuMind Works

1. **Document Upload Flow**
    - Users upload a document.
    - The backend splits the document into chunks (~500 words each) for embeddings.
    - In **stub mode**, embeddings are dummy vectors (`float[1536]`).
    - Chunks are stored in `InMemoryVectorIndexService`.

2. **Question Flow**
    - User asks a question.
    - The system embeds the question (stub in portfolio).
    - Retrieves top-matching chunks using **cosine similarity**( When a user asks something, I compare it with the document content and pick the parts that are most similar, so the system answers based on the right context ).
    - Returns a summary answer (stubbed or real OpenAI chat service later).

3. **Prompt Engineering**
    - You can see in `AskQuestionUseCase` how questions + context are combined into prompts for the AI.
    - Prompts are crafted to maximize relevant, concise answers.
    - Clear separation between **retrieval logic** and **prompt generation**.
    - Demonstrates practical use of prompt templates with AI for structured QA.

---
## 📂 Project Structure
The project follows a **Clean Architecture approach**, separating concerns between API, application logic, infrastructure, and domain layers:

<img width="247" height="189" alt="image" src="https://github.com/user-attachments/assets/1af577e6-04c6-4073-b4f0-aa1dcb79835a" />


---

## ⚡ Setup Instructions (Local / Portfolio Mode)

1. Clone the repo:
```bash
git clone https://github.com/YourUsername/DocuMind.git
cd DocuMind/backend/src/DocuMind.Api
Set environment to development:

FOR THE BACKEND USE THAT IN THE TERMINAL
cd ./src/DocuMind.Api
$Env:ASPNETCORE_ENVIRONMENT="Development"
dotnet restore
dotnet run

FOR THE FRONTEND USE THAT IN THE TERMINAL
cd ./frontend
npm install
npm start
