# app/main.py
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
import pandas as pd
import numpy as np
from datetime import datetime
import os
import json
from sqlalchemy import create_engine, text
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import des classes existantes
import sys
sys.path.append('.')
from ana import PostgreSQLConnector, DataPreprocessor, StatisticalAnalyzer, AIAnalyzer, Visualizer, ReportGenerator, PostgreSQLAnalysisPipeline

app = FastAPI(
    title="Questionnaire Analysis API",
    description="API intelligente pour l'analyse de questionnaires de formation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://marsamarocformation.onrender.com",
        "http://localhost:3000",
        "http://localhost:3001",
        "*"  # Fallback for development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Modèles Pydantic
class DatabaseConfig(BaseModel):
    host: str = "dpg-d79f5jbuibrs73c5ugs0-a.oregon-postgres.render.com"
    database: str = "marsa_eval"
    user: str = "marsa_user"
    password: str = "HaQUe0hlwZvaS2MPn6egMB1l2JdeWcIf"
    port: int = 5432

class AnalysisRequest(BaseModel):
    database_config: DatabaseConfig
    analysis_type: Optional[str] = "full"  # full, stats, ai, quality
    n_topics: Optional[int] = 3
    contamination: Optional[float] = 0.1

class QuestionStats(BaseModel):
    question_text: str
    moyenne: float
    mediane: float
    ecart_type: float
    min: float
    max: float
    count: int

class SentimentResult(BaseModel):
    label: str
    score: float
    intensity: str

class TrainingQuality(BaseModel):
    title: str
    score: float
    verdict: str
    avg_sentiment: float
    advice: str

# Stockage des résultats en mémoire
analysis_cache = {}

# Endpoints de base
@app.get("/")
async def root():
    return {
        "name": "Questionnaire Analysis API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": [
            "/docs",
            "/analyze",
            "/stats/descriptive",
            "/stats/nps",
            "/sentiment/analysis",
            "/topics",
            "/quality/trainings",
            "/reports/html",
            "/reports/markdown"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

# Endpoint principal d'analyse
@app.post("/analyze")
async def analyze_data(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    Lance une analyse complète des données depuis PostgreSQL
    """
    try:
        # Création de l'ID d'analyse
        analysis_id = f"analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Lancement de l'analyse en arrière-plan
        background_tasks.add_task(
            run_analysis_background,
            analysis_id,
            request.database_config,
            request.analysis_type,
            request.n_topics,
            request.contamination
        )
        
        return {
            "status": "started",
            "analysis_id": analysis_id,
            "message": "L'analyse a été lancée en arrière-plan. Utilisez /status/{analysis_id} pour suivre la progression.",
            "estimated_time": "30-60 secondes"
        }
        
    except Exception as e:
        logger.error(f"Erreur lors du lancement de l'analyse: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status/{analysis_id}")
async def get_analysis_status(analysis_id: str):
    """
    Récupère le statut d'une analyse
    """
    if analysis_id not in analysis_cache:
        raise HTTPException(status_code=404, detail="Analyse non trouvée")
    
    return analysis_cache[analysis_id]

@app.get("/stats/descriptive")
async def get_descriptive_stats(analysis_id: Optional[str] = None):
    """
    Récupère les statistiques descriptives
    """
    try:
        if analysis_id and analysis_id in analysis_cache:
            results = analysis_cache[analysis_id]
            if 'stats_analyzer' in results:
                stats = results['stats_analyzer'].stats_results.get('descriptive', {})
                return format_descriptive_stats(stats)
        
        # Si pas d'ID, on utilise la dernière analyse
        last_analysis = get_last_analysis()
        if last_analysis:
            stats = last_analysis.stats_analyzer.stats_results.get('descriptive', {})
            return format_descriptive_stats(stats)
        
        raise HTTPException(status_code=404, detail="Aucune donnée disponible")
        
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats/nps")
async def get_nps(analysis_id: Optional[str] = None):
    """
    Récupère le Net Promoter Score
    """
    try:
        if analysis_id and analysis_id in analysis_cache:
            results = analysis_cache[analysis_id]
            if 'stats_analyzer' in results:
                nps = results['stats_analyzer'].stats_results.get('nps', {})
                return nps
        
        last_analysis = get_last_analysis()
        if last_analysis:
            nps = last_analysis.stats_analyzer.stats_results.get('nps', {})
            return nps
        
        raise HTTPException(status_code=404, detail="Aucune donnée NPS disponible")
        
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sentiment/analysis")
async def get_sentiment_analysis(analysis_id: Optional[str] = None):
    """
    Récupère l'analyse de sentiment
    """
    try:
        if analysis_id and analysis_id in analysis_cache:
            results = analysis_cache[analysis_id]
            if 'ai_analyzer' in results:
                sentiment = results['ai_analyzer'].ai_results.get('sentiment', {})
                return {
                    "average_score": sentiment.get('average_score', 0),
                    "distribution": sentiment.get('global', {}),
                    "top_positive": sentiment.get('top_positive', []),
                    "top_negative": sentiment.get('top_negative', [])
                }
        
        last_analysis = get_last_analysis()
        if last_analysis:
            sentiment = last_analysis.ai_analyzer.ai_results.get('sentiment', {})
            return {
                "average_score": sentiment.get('average_score', 0),
                "distribution": sentiment.get('global', {}),
                "top_positive": sentiment.get('top_positive', []),
                "top_negative": sentiment.get('top_negative', [])
            }
        
        raise HTTPException(status_code=404, detail="Aucune donnée de sentiment disponible")
        
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/topics")
async def get_topics(analysis_id: Optional[str] = None):
    """
    Récupère les thèmes détectés par topic modeling
    """
    try:
        if analysis_id and analysis_id in analysis_cache:
            results = analysis_cache[analysis_id]
            if 'ai_analyzer' in results:
                topics = results['ai_analyzer'].ai_results.get('topics', {})
                return {
                    "themes": topics.get('themes', {}),
                    "distribution": topics.get('distribution', {})
                }
        
        last_analysis = get_last_analysis()
        if last_analysis:
            topics = last_analysis.ai_analyzer.ai_results.get('topics', {})
            return {
                "themes": topics.get('themes', {}),
                "distribution": topics.get('distribution', {})
            }
        
        raise HTTPException(status_code=404, detail="Aucun thème détecté")
        
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/quality/trainings")
async def get_training_quality(analysis_id: Optional[str] = None):
    """
    Récupère l'évaluation de la qualité des formations
    """
    try:
        if analysis_id and analysis_id in analysis_cache:
            results = analysis_cache[analysis_id]
            if 'preprocessor' in results:
                quality = results['preprocessor'].training_quality
                return format_training_quality(quality)
        
        last_analysis = get_last_analysis()
        if last_analysis:
            quality = last_analysis.preprocessor.training_quality
            return format_training_quality(quality)
        
        raise HTTPException(status_code=404, detail="Aucune donnée de qualité disponible")
        
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/clusters")
async def get_user_clusters(analysis_id: Optional[str] = None):
    """
    Récupère les clusters d'utilisateurs
    """
    try:
        if analysis_id and analysis_id in analysis_cache:
            results = analysis_cache[analysis_id]
            if 'ai_analyzer' in results:
                clusters = results['ai_analyzer'].ai_results.get('clusters', {})
                return {
                    "n_clusters": clusters.get('n_clusters', 0),
                    "size": clusters.get('size', {}),
                    "profiles": clusters.get('profiles', {}).to_dict() if hasattr(clusters.get('profiles'), 'to_dict') else {},
                    "role_composition": clusters.get('role_composition', {}).to_dict() if hasattr(clusters.get('role_composition'), 'to_dict') else {}
                }
        
        last_analysis = get_last_analysis()
        if last_analysis:
            clusters = last_analysis.ai_analyzer.ai_results.get('clusters', {})
            return {
                "n_clusters": clusters.get('n_clusters', 0),
                "size": clusters.get('size', {}),
                "profiles": clusters.get('profiles', {}).to_dict() if hasattr(clusters.get('profiles'), 'to_dict') else {},
                "role_composition": clusters.get('role_composition', {}).to_dict() if hasattr(clusters.get('role_composition'), 'to_dict') else {}
            }
        
        raise HTTPException(status_code=404, detail="Aucun cluster détecté")
        
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/anomalies")
async def get_anomalies(analysis_id: Optional[str] = None):
    """
    Récupère la détection d'anomalies
    """
    try:
        if analysis_id and analysis_id in analysis_cache:
            results = analysis_cache[analysis_id]
            if 'ai_analyzer' in results:
                anomalies = results['ai_analyzer'].ai_results.get('anomalies', {})
                return {
                    "count": anomalies.get('count', 0),
                    "percentage": anomalies.get('percentage', 0),
                    "users": anomalies.get('users', [])
                }
        
        last_analysis = get_last_analysis()
        if last_analysis:
            anomalies = last_analysis.ai_analyzer.ai_results.get('anomalies', {})
            return {
                "count": anomalies.get('count', 0),
                "percentage": anomalies.get('percentage', 0),
                "users": anomalies.get('users', [])
            }
        
        raise HTTPException(status_code=404, detail="Aucune anomalie détectée")
        
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/reports/html")
async def get_html_report(analysis_id: Optional[str] = None):
    """
    Télécharge le rapport HTML
    """
    try:
        if analysis_id and analysis_id in analysis_cache:
            results = analysis_cache[analysis_id]
            if 'reporter' in results:
                results['reporter'].generate_html_report()
                return FileResponse(
                    'rapport_analyse_postgresql.html',
                    media_type='text/html',
                    filename=f'rapport_analyse_{analysis_id}.html'
                )
        
        last_analysis = get_last_analysis()
        if last_analysis:
            last_analysis.reporter.generate_html_report()
            return FileResponse(
                'rapport_analyse_postgresql.html',
                media_type='text/html',
                filename='rapport_analyse_latest.html'
            )
        
        raise HTTPException(status_code=404, detail="Aucun rapport disponible")
        
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/reports/markdown")
async def get_markdown_report(analysis_id: Optional[str] = None):
    """
    Télécharge le rapport Markdown
    """
    try:
        if analysis_id and analysis_id in analysis_cache:
            results = analysis_cache[analysis_id]
            if 'reporter' in results:
                results['reporter'].generate_markdown_summary()
                return FileResponse(
                    'resume_analyse.md',
                    media_type='text/markdown',
                    filename=f'resume_analyse_{analysis_id}.md'
                )
        
        last_analysis = get_last_analysis()
        if last_analysis:
            last_analysis.reporter.generate_markdown_summary()
            return FileResponse(
                'resume_analyse.md',
                media_type='text/markdown',
                filename='resume_analyse_latest.md'
            )
        
        raise HTTPException(status_code=404, detail="Aucun rapport disponible")
        
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/visualizations/dashboard")
async def get_dashboard_image():
    """
    Récupère l'image du tableau de bord
    """
    if os.path.exists('dashboard_postgresql_analyse.png'):
        return FileResponse(
            'dashboard_postgresql_analyse.png',
            media_type='image/png',
            filename='dashboard.png'
        )
    raise HTTPException(status_code=404, detail="Image non trouvée")

@app.get("/visualizations/quality")
async def get_quality_chart():
    """
    Récupère le graphique de qualité des formations
    """
    if os.path.exists('formation_quality_chart.png'):
        return FileResponse(
            'formation_quality_chart.png',
            media_type='image/png',
            filename='quality_chart.png'
        )
    raise HTTPException(status_code=404, detail="Image non trouvée")

@app.get("/visualizations/sentiment")
async def get_sentiment_chart():
    """
    Récupère le graphique d'analyse de sentiment
    """
    if os.path.exists('sentiment_analysis_chart.png'):
        return FileResponse(
            'sentiment_analysis_chart.png',
            media_type='image/png',
            filename='sentiment_chart.png'
        )
    raise HTTPException(status_code=404, detail="Image non trouvée")

@app.get("/analyze")
async def analyze_get():
    """
    Retourne les graphiques et données d'analyse :
    - Répartition globale des verdicts
    - Score de qualité par formation  
    - Répartition des sentiments
    """
    try:
        # Récupérer la dernière analyse
        last_analysis = get_last_analysis()
        if not last_analysis:
            raise HTTPException(status_code=404, detail="Aucune analyse disponible. Utilisez POST /analyze pour lancer une analyse.")
        
        result = {
            "graphs": {},
            "data": {}
        }
        
        # 1. Répartition globale des verdicts
        if hasattr(last_analysis, 'preprocessor') and last_analysis.preprocessor.training_quality:
            training_quality = last_analysis.preprocessor.training_quality
            verdicts = [v['verdict'] for v in training_quality.values()]
            verdict_counts = pd.Series(verdicts).value_counts().to_dict()
            total_verdicts = len(verdicts)
            
            # Calcul des pourcentages
            verdict_percentages = {
                label: round((count / total_verdicts) * 100, 1) 
                for label, count in verdict_counts.items()
            }
            
            result["graphs"]["verdicts_distribution"] = {
                "labels": list(verdict_counts.keys()),
                "values": list(verdict_counts.values()),
                "percentages": [verdict_percentages[label] for label in verdict_counts.keys()],
                "colors": {
                    "BONNE": "#27ae60",
                    "MOYENNE": "#f39c12", 
                    "À AMÉLIORER": "#e74c3c"
                }
            }
            
            # 2. Score de qualité par formation
            quality_data = []
            for training_id, data in training_quality.items():
                quality_data.append({
                    "formation": data['title'],
                    "score": data['score'],
                    "verdict": data['verdict'],
                    "sentiment_moyen": data['avg_sentiment'],
                    "conseil": data['advice']
                })
            
            # Trier par score décroissant
            quality_data.sort(key=lambda x: x['score'], reverse=True)
            result["data"]["quality_by_formation"] = quality_data
        
        # 3. Répartition des sentiments
        if hasattr(last_analysis, 'ai_analyzer') and last_analysis.ai_analyzer.ai_results.get('sentiment'):
            sentiment_data = last_analysis.ai_analyzer.ai_results['sentiment']
            
            # Distribution globale des sentiments
            sentiment_dist = sentiment_data.get('global', {})
            total_sentiments = sum(sentiment_dist.values()) if sentiment_dist else 1
            
            # Calcul des pourcentages pour les sentiments
            sentiment_percentages = {
                label: round((count / total_sentiments) * 100, 1) 
                for label, count in sentiment_dist.items()
            }
            
            result["graphs"]["sentiments_distribution"] = {
                "labels": list(sentiment_dist.keys()),
                "values": list(sentiment_dist.values()),
                "percentages": [sentiment_percentages[label] for label in sentiment_dist.keys()],
                "colors": {
                    "positif": "#27ae60",
                    "neutre": "#95a5a6",
                    "négatif": "#e74c3c"
                },
                "score_moyen": sentiment_data.get('average_score', 0)
            }
            
            # Top commentaires positifs et négatifs
            result["data"]["top_comments"] = {
                "positifs": sentiment_data.get('top_positive', [])[:3],
                "negatifs": sentiment_data.get('top_negative', [])[:3]
            }
        
        # 4. Statistiques supplémentaires
        if hasattr(last_analysis, 'stats_analyzer') and last_analysis.stats_analyzer.stats_results.get('nps'):
            nps_data = last_analysis.stats_analyzer.stats_results['nps']
            result["data"]["nps"] = nps_data
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des données: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.get("/summary")
async def get_summary(analysis_id: Optional[str] = None):
    """
    Récupère un résumé complet de l'analyse
    """
    try:
        summary = {}
        
        # NPS
        if analysis_id and analysis_id in analysis_cache:
            results = analysis_cache[analysis_id]
            if 'stats_analyzer' in results:
                nps = results['stats_analyzer'].stats_results.get('nps', {})
                summary['nps'] = nps
            
            if 'ai_analyzer' in results:
                sentiment = results['ai_analyzer'].ai_results.get('sentiment', {})
                summary['sentiment'] = {
                    'average_score': sentiment.get('average_score', 0),
                    'distribution': sentiment.get('global', {})
                }
                
                anomalies = results['ai_analyzer'].ai_results.get('anomalies', {})
                summary['anomalies'] = {
                    'count': anomalies.get('count', 0),
                    'percentage': anomalies.get('percentage', 0)
                }
                
                clusters = results['ai_analyzer'].ai_results.get('clusters', {})
                summary['clusters'] = {
                    'n_clusters': clusters.get('n_clusters', 0),
                    'size': clusters.get('size', {})
                }
            
            if 'preprocessor' in results:
                quality = results['preprocessor'].training_quality
                if quality:
                    avg_score = np.mean([v['score'] for v in quality.values()])
                    summary['training_quality'] = {
                        'average_score': round(avg_score, 2),
                        'good': sum(1 for v in quality.values() if v['score'] >= 68),
                        'average': sum(1 for v in quality.values() if 45 <= v['score'] < 68),
                        'poor': sum(1 for v in quality.values() if v['score'] < 45)
                    }
        
        return summary
        
    except Exception as e:
        logger.error(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Fonctions utilitaires
def run_analysis_background(analysis_id, db_config, analysis_type, n_topics, contamination):
    """
    Exécute l'analyse en arrière-plan
    """
    try:
        analysis_cache[analysis_id] = {"status": "running", "progress": 0}
        
        # Debug: afficher la configuration reçue
        print(f"[DEBUG] Configuration reçue: host={db_config.host}, port={db_config.port}, database={db_config.database}")
        
        # Création du pipeline
        pipeline = PostgreSQLAnalysisPipeline(
            host=db_config.host,
            database=db_config.database,
            user=db_config.user,
            password=db_config.password,
            port=db_config.port
        )
        
        analysis_cache[analysis_id]["progress"] = 20
        analysis_cache[analysis_id]["status"] = "extracting_data"
        
        # Exécution de l'analyse
        result = pipeline.run_complete_analysis()
        
        analysis_cache[analysis_id]["progress"] = 100
        analysis_cache[analysis_id]["status"] = "completed"
        analysis_cache[analysis_id]["result"] = result
        analysis_cache[analysis_id]["timestamp"] = datetime.now().isoformat()
        
    except Exception as e:
        logger.error(f"Erreur dans l'analyse {analysis_id}: {e}")
        analysis_cache[analysis_id] = {
            "status": "failed",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

def get_last_analysis():
    """
    Récupère la dernière analyse terminée
    """
    completed_analyses = [
        (aid, data) for aid, data in analysis_cache.items()
        if data.get('status') == 'completed' and 'result' in data
    ]
    
    if completed_analyses:
        # Trier par timestamp
        completed_analyses.sort(key=lambda x: x[1].get('timestamp', ''), reverse=True)
        return completed_analyses[0][1]['result']
    
    return None

def format_descriptive_stats(stats):
    """
    Formate les statistiques descriptives pour l'API
    """
    if isinstance(stats, pd.DataFrame):
        return stats.reset_index().to_dict('records')
    return stats

def format_training_quality(quality):
    """
    Formate la qualité des formations pour l'API
    """
    if not quality:
        return {}
    
    return {
        training_id: {
            "title": data['title'],
            "score": data['score'],
            "verdict": data['verdict'],
            "avg_sentiment": data['avg_sentiment'],
            "advice": data['advice'],
            "numeric_avg": data.get('numeric_avg')
        }
        for training_id, data in quality.items()
    }

# Point d'entrée pour uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )