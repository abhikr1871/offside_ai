import os
import logging
from typing import Dict, Any, List
from app.db.vector_search import vector_search_manager

# Try imports for Vertex AI
try:
    import vertexai
    from vertexai.generative_models import GenerativeModel
    from vertexai.language_models import TextEmbeddingModel
    HAS_VERTEX_AI = True
except ImportError:
    HAS_VERTEX_AI = False

logger = logging.getLogger("offside_ai.rag_service")

# GCP Project details
PROJECT_ID = os.getenv("GCP_PROJECT")
LOCATION = os.getenv("GCP_LOCATION", "us-central1")

class RAGService:
    def __init__(self):
        self.vertex_initialized = False
        self.embedding_model = None
        self.llm_model = None

        if HAS_VERTEX_AI and PROJECT_ID:
            try:
                vertexai.init(project=PROJECT_ID, location=LOCATION)
                self.embedding_model = TextEmbeddingModel.from_pretrained("text-embedding-004")
                self.llm_model = GenerativeModel("gemini-1.5-pro") # Or gemini-3-pro when standard
                self.vertex_initialized = True
                logger.info("Successfully initialized GCP Vertex AI client.")
            except Exception as e:
                logger.error(f"Failed to initialize Vertex AI client: {e}. Falling back to mock RAG.")
        else:
            logger.info("GCP_PROJECT not configured. Running in Local Mock RAG Mode.")

    def _get_embedding(self, text: str) -> List[float]:
        """
        Generates 768-dimension embeddings using Vertex AI text-embedding-004.
        Returns empty list in mock mode.
        """
        if self.vertex_initialized and self.embedding_model:
            try:
                embeddings = self.embedding_model.get_embeddings([text])
                return embeddings[0].values
            except Exception as e:
                logger.error(f"Failed to generate embedding: {e}")
        return []

    async def answer_schedule_query(self, query: str) -> Dict[str, Any]:
        """
        Answers schedule queries using RAG (Retrieval-Augmented Generation).
        """
        # 1. Embed query
        query_vector = self._get_embedding(query)

        # 2. Retrieve top matching schedules
        retrieved_docs = await vector_search_manager.search_similar_schedules(
            query_vector=query_vector,
            query_text=query,
            limit=3
        )

        # 3. Generate response
        if self.vertex_initialized and self.llm_model:
            try:
                # Build context string
                context = "\n".join([
                    f"Match {doc['match_no']}: {doc['home_team']} vs {doc['away_team']} on {doc['date']} at {doc['time']} "
                    f"({doc['venue']}, {doc['city']}, {doc['country']}) - Stage: {doc['stage']}"
                    for doc in retrieved_docs
                ])

                # Construct prompt
                from app.db.vector_search import APP_MODE
                mode_name = "Club Football Leagues" if APP_MODE == "club" else "FIFA World Cup 2026"
                prompt = (
                    f"You are the Offside AI assistant for {mode_name}.\n"
                    f"Answer the user's question about the match schedule based ONLY on the verified schedule context below.\n"
                    f"If the answer is not in the context, politely state that you do not have that schedule information.\n\n"
                    f"--- VERIFIED SCHEDULE CONTEXT ---\n{context}\n\n"
                    f"User Query: {query}\n"
                    f"AI Answer:"
                )

                response = self.llm_model.generate_content(prompt)
                return {
                    "query": query,
                    "answer": response.text.strip(),
                    "sources": retrieved_docs,
                    "model_used": f"Gemini 1.5 Pro (Vertex AI - {mode_name})"
                }
            except Exception as e:
                logger.error(f"Vertex AI Generation failed: {e}. Falling back to mock answer generation.")

        # Local mock LLM generator fallback
        return self._generate_mock_answer(query, retrieved_docs)

    def _generate_mock_answer(self, query: str, retrieved_docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Simulates an LLM response generator based on retrieved schedule context.
        """
        from app.db.vector_search import APP_MODE
        
        context_items = []
        for doc in retrieved_docs:
            context_items.append(
                f"**Match {doc['match_no']} ({doc['stage']})**: **{doc['home_team']}** vs **{doc['away_team']}** "
                f"on {doc['date']} at {doc['time']} playing at **{doc['venue']}** in {doc['city']}, {doc['country']}."
            )
        
        context_str = "\n- ".join(context_items)
        q = query.lower()

        if APP_MODE == "club":
            if "final" in q or "champions league" in q or "cl" in q:
                cl_match = next((d for d in retrieved_docs if "champions league" in d["stage"].lower()), None)
                if cl_match:
                    answer = (
                        f"The **UEFA Champions League Final** (Match {cl_match['match_no']}) will be contested between "
                        f"**{cl_match['home_team']}** and **{cl_match['away_team']}** on **{cl_match['date']}** at "
                        f"**{cl_match['time']}** local time. It will take place at the iconic **{cl_match['venue']}** "
                        f"in {cl_match['city']}, {cl_match['country']}."
                    )
                else:
                    el_match = next((d for d in retrieved_docs if "europa league" in d["stage"].lower()), None)
                    if el_match:
                        answer = (
                            f"The **UEFA Europa League Final** (Match {el_match['match_no']}) is scheduled for "
                            f"**{el_match['date']}** at **{el_match['time']}** local time. It will feature "
                            f"**{el_match['home_team']}** vs **{el_match['away_team']}** at **{el_match['venue']}** in {el_match['city']}, {el_match['country']}."
                        )
                    else:
                        answer = "According to the club schedule, the UEFA Champions League Final takes place on May 30, 2026, featuring Real Madrid vs Manchester City at San Siro in Milan."
            elif "premier league" in q or "england" in q or "manchester" in q or "arsenal" in q or "chelsea" in q or "manchester city" in q:
                pl_matches = [d for d in retrieved_docs if "premier league" in d["stage"].lower()]
                if pl_matches:
                    match_details = "\n".join([f"- **{m['home_team']} vs {m['away_team']}** on {m['date']} at {m['time']} ({m['venue']})" for m in pl_matches])
                    answer = f"Here are the Premier League matches from the retrieved schedule context:\n\n{match_details}"
                else:
                    answer = "In the Premier League schedule, key matches include Manchester City vs Arsenal and Chelsea vs Manchester United on May 17, 2026."
            elif "laliga" in q or "spain" in q or "madrid" in q or "barcelona" in q or "real madrid" in q:
                ll_matches = [d for d in retrieved_docs if "laliga" in d["stage"].lower()]
                if ll_matches:
                    match_details = "\n".join([f"- **{m['home_team']} vs {m['away_team']}** on {m['date']} ({m['venue']})" for m in ll_matches])
                    answer = f"Here are the LaLiga matches found in the schedule:\n\n{match_details}"
                else:
                    answer = "A major LaLiga clash between Real Madrid and Barcelona is scheduled for May 10, 2026, at the Santiago Bernabeu in Madrid."
            elif "mls" in q or "miami" in q or "galaxy" in q or "lafc" in q:
                mls_matches = [d for d in retrieved_docs if "mls" in d["stage"].lower()]
                if mls_matches:
                    match_details = "\n".join([f"- **{m['home_team']} vs {m['away_team']}** on {m['date']} at {m['time']} ({m['venue']})" for m in mls_matches])
                    answer = f"Here are the MLS matches in the schedule:\n\n{match_details}"
                else:
                    answer = "Active MLS matches in May and June 2026 include Inter Miami vs LA Galaxy (May 30) and LAFC vs Seattle Sounders (June 6)."
            else:
                answer = (
                    f"Here is the relevant club schedule information matching your query:\n\n- {context_str}\n\n"
                    f"Which league, club, or upcoming fixture can I help you check next?"
                )
            
            return {
                "query": query,
                "answer": answer,
                "sources": retrieved_docs,
                "model_used": "Gemini 1.5 Pro (Simulated Club RAG)"
            }
        else:
            # World Cup simulated response generator
            if "final" in q:
                final_match = next((d for d in retrieved_docs if d["stage"].lower() == "final"), retrieved_docs[0])
                answer = (
                    f"The FIFA World Cup 2026 Final (Match {final_match['match_no']}) will take place on "
                    f"**{final_match['date']}** at **{final_match['time']}** local time. It will be hosted at "
                    f"**{final_match['venue']}** in {final_match['city']}, {final_match['country']}."
                )
            elif "mexico" in q:
                mex_matches = [d for d in retrieved_docs if d["home_team"].lower() == "mexico" or d["away_team"].lower() == "mexico"]
                if mex_matches:
                    answer = f"Mexico plays in the opening match of the World Cup on **{mex_matches[0]['date']}** at **{mex_matches[0]['time']}** at the historic **{mex_matches[0]['venue']}** in {mex_matches[0]['city']}."
                else:
                    answer = "Based on the schedule, Mexico will be playing their group stage matches starting June 11, 2026. The opening match is at Estadio Azteca."
            elif "united states" in q or "usa" in q:
                usa_matches = [d for d in retrieved_docs if "united states" in d["home_team"].lower() or "united states" in d["away_team"].lower()]
                if usa_matches:
                    answer = f"The United States starts their World Cup journey on **{usa_matches[0]['date']}** at **{usa_matches[0]['time']}** local time at **{usa_matches[0]['venue']}** in {usa_matches[0]['city']}."
                else:
                    answer = "The USA team plays their opening group stage match on June 12, 2026, at SoFi Stadium in Los Angeles, California."
            elif "toronto" in q or "canada" in q:
                can_matches = [d for d in retrieved_docs if d["home_team"].lower() == "canada" or d["away_team"].lower() == "canada"]
                if can_matches:
                    answer = f"Canada will host its opening match on **{can_matches[0]['date']}** at **{can_matches[0]['time']}** local time at **{can_matches[0]['venue']}** in {can_matches[0]['city']}."
                else:
                    answer = "Canada plays their first match on June 12, 2026, at BMO Field in Toronto, Ontario."
            else:
                answer = (
                    f"Here is the relevant schedule information matching your query:\n\n- {context_str}\n\n"
                    f"Is there any specific match, venue, or team you'd like more details on?"
                )

            return {
                "query": query,
                "answer": answer,
                "sources": retrieved_docs,
                "model_used": "Gemini 1.5 Pro (Simulated RAG)"
            }

rag_service = RAGService()
