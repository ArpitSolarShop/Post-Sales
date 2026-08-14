from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_postgres.vectorstores import PGVector
from langchain_anthropic import ChatAnthropic
from sqlalchemy import create_engine

app = FastAPI(title="AI Service")

# Setup PostgreSQL connection
CONNECTION_STRING = os.getenv("DATABASE_URL")
if CONNECTION_STRING and CONNECTION_STRING.startswith("postgresql://"):
    CONNECTION_STRING = CONNECTION_STRING.replace("postgresql://", "postgresql+psycopg://")

# Engine for pgvector
engine = create_engine(CONNECTION_STRING)

# Using local sentence-transformers model for embeddings
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

collection_name = "documents"

# Initialize PGVector
vectorstore = PGVector(
    embeddings=embeddings,
    collection_name=collection_name,
    connection=engine,
    use_jsonb=True,
)

class DocumentInput(BaseModel):
    content: str
    metadata: Dict[str, Any] = {}

class QueryInput(BaseModel):
    query: str

@app.post("/embed")
def embed_document(doc: DocumentInput):
    try:
        vectorstore.add_texts(
            texts=[doc.content],
            metadatas=[doc.metadata]
        )
        return {"status": "success", "message": "Document embedded and stored in pgvector."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
def query_documents(q: QueryInput):
    try:
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
        
        # We assume ANTHROPIC_API_KEY is set in .env
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key or api_key == "your-anthropic-api-key":
            return {"error": "Anthropic API Key is missing or invalid in .env"}

        docs = retriever.invoke(q.query)
        context = "\n".join([doc.page_content for doc in docs])
        
        llm = ChatAnthropic(model="claude-3-haiku-20240307", api_key=api_key)
        
        prompt = (
            "You are an assistant for question-answering tasks. "
            "Use the following pieces of retrieved context to answer the question. "
            "If you don't know the answer, say that you don't know."
            f"\n\nContext:\n{context}\n\nQuestion: {q.query}"
        )

        response = llm.invoke(prompt)
        
        return {
            "answer": response.content,
            "context": [doc.page_content for doc in docs]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
