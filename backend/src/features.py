from __future__ import annotations

JD_QUERY = """
Senior AI Engineer Founding AI Engineer production machine learning systems
candidate matching search ranking retrieval semantic search embeddings vector
databases hybrid search recommendation systems Python ML infrastructure
evaluation metrics NDCG MRR MAP A/B testing product engineering startup
founding team mindset retrieval quality experimentation scalable backend data
pipelines Elasticsearch OpenSearch FAISS Milvus Qdrant Pinecone Weaviate
LLM RAG fine tuning model deployment offline online evaluation.
"""

CAREER_EVIDENCE_KEYWORDS = [
    "production ml", "production machine learning", "deployed model", "model deployment",
    "ranking system", "learning to rank", "search ranking", "candidate matching",
    "matching system", "retrieval", "semantic search", "hybrid search", "vector search",
    "embedding", "embeddings", "recommendation", "recommender", "recommendation engine",
    "rag", "vector database", "faiss", "milvus", "qdrant", "pinecone", "weaviate",
    "elasticsearch", "opensearch", "ml pipeline", "feature pipeline", "data pipeline",
    "model serving", "inference", "mlflow", "airflow", "spark", "kafka",
    "ndcg", "mrr", "map", "a/b test", "ab test", "experiment", "evaluation framework",
    "offline benchmark", "online metric", "relevance", "recruiter", "marketplace",
]

CORE_SKILL_KEYWORDS = [
    "Python", "PyTorch", "TensorFlow", "scikit-learn", "sklearn", "LangChain", "LLM",
    "RAG", "embeddings", "vector search", "FAISS", "Milvus", "Qdrant", "Pinecone",
    "Weaviate", "Elasticsearch", "OpenSearch", "ranking", "recommender systems",
    "recommendation systems", "NLP", "MLflow", "Docker", "Kubernetes", "AWS", "GCP",
    "Azure", "Airflow", "Spark", "data pipelines", "Kafka", "BentoML", "FastAPI",
]

ADVANCED_AI_SKILLS = {
    "llm", "rag", "langchain", "embeddings", "vector search", "faiss", "milvus",
    "qdrant", "pinecone", "weaviate", "elasticsearch", "opensearch", "ranking",
    "recommendation systems", "recommender systems", "nlp", "fine-tuning llms",
    "lora", "qlora", "pytorch", "tensorflow", "mlflow", "bentoml",
}

TECH_TITLE_TERMS = [
    "ai engineer", "machine learning engineer", "ml engineer", "data scientist",
    "applied scientist", "search engineer", "ranking engineer", "software engineer",
    "backend engineer", "data engineer", "nlp engineer", "founding engineer",
    "staff engineer", "senior engineer", "principal engineer", "tech lead",
]

NON_TECH_TITLE_TERMS = [
    "hr", "recruiter", "talent acquisition", "marketing", "sales", "graphic designer",
    "accountant", "civil engineer", "mechanical engineer", "business development",
    "operations", "content writer", "customer support", "support agent", "seo",
    "finance", "admin", "human resources", "brand designer",
]

PRODUCT_INDUSTRY_TERMS = [
    "product", "saas", "software", "internet", "ecommerce", "e-commerce", "fintech",
    "marketplace", "data platform", "ai", "machine learning", "analytics",
    "search", "recommendation", "hr tech", "recruiting", "talent intelligence",
]

SERVICE_COMPANIES = [
    "tcs", "infosys", "wipro", "accenture", "cognizant", "capgemini", "mindtree",
    "tech mahindra", "hcl", "lti", "ltimindtree",
]

LOCATION_TERMS = [
    "pune", "noida", "delhi", "ncr", "gurugram", "gurgaon", "mumbai",
    "hyderabad", "bangalore", "bengaluru", "india", "chennai", "kolkata",
    "ahmedabad", "jaipur", "indore", "kochi", "trivandrum", "thiruvananthapuram",
    "coimbatore", "vizag", "visakhapatnam", "nagpur", "surat", "lucknow",
    "chandigarh", "bhubaneswar", "mysore", "mysuru", "vadodara", "kerala",
    "tamil nadu", "karnataka", "maharashtra", "telangana", "andhra pradesh",
    "gujarat", "rajasthan", "madhya pradesh", "haryana", "punjab", "west bengal",
    "uttar pradesh", "odisha",
]

# Roles are based in / near the Pune-Noida hiring zone, so a candidate already
# located here does not need to relocate even if willing_to_relocate is false.
INDIA_HUB_TERMS = [
    "pune", "noida", "delhi", "ncr", "gurugram", "gurgaon", "new delhi",
]

# Component weights (sum to 1.0). Shared by scoring and the JSON breakdown so the
# two can never drift apart. Emphasis is on real career evidence over raw
# semantic keyword overlap.
WEIGHTS = {
    "semantic_match": 0.25,
    "career_evidence": 0.25,
    "core_skill_fit": 0.15,
    "seniority_fit": 0.10,
    "product_company_fit": 0.08,
    "behavioral_signal_fit": 0.10,
    "logistics_fit": 0.07,
}

# --- Rare, direct-domain career evidence (Task 2) -------------------------------
# The pool's career descriptions are templated (~44 unique paragraphs). A few
# paragraphs are the genuinely scarce, directly-JD-relevant signal — recruiter-facing
# ranking/retrieval, candidate-JD matching, learning-to-rank, end-to-end ranking with
# behavioral-signal integration (~9-12 occurrences each) — versus the common generic
# templates (semantic search over a ~500K-doc knowledge base, content recommendation
# for 10M+ users). These phrases earn a modest bonus so rarer elite evidence edges out
# common-template evidence. Phrases are grouped by concept to avoid double-counting
# near-variants. Magnitudes are the tuning knobs (easy to adjust or revert).
RARE_ELITE_CAREER_CONCEPTS = {
    "recruiter-facing ranking/retrieval": ["recruiter-facing"],
    "candidate-JD matching": ["candidate-jd matching", "candidate jd matching", "candidate-job matching"],
    "learning-to-rank": ["learning to rank", "learning-to-rank"],
    "behavioral-signal ranking": ["behavioral-signal integration", "behavioral signal integration"],
    "end-to-end ranking pipeline": ["end-to-end ranking"],
}
RARE_ELITE_PER_CONCEPT = 4.0     # career-evidence points per distinct elite concept
RARE_ELITE_BONUS_CAP = 12.0      # cap on the total elite bonus (career-evidence points)
# Final-scale deduction for common-template-only evidence AND unwilling to relocate AND
# far from the Pune/NCR hub. Deliberately gated so elite-tier candidates are never
# demoted for location.
COMMON_TIER_FAR_DEDUCTION = 4.0
