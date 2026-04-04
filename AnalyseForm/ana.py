"""
SYSTÈME INTELLIGENT D'ANALYSE DE QUESTIONNAIRES - VERSION POSTGRESQL
Auteur: Assistant IA
Description: Analyse complète des réponses avec IA, statistiques et évaluation
             automatique de la qualité des formations pour PostgreSQL
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from sqlalchemy import create_engine, text
import psycopg2
import warnings
import re
from collections import Counter
warnings.filterwarnings('ignore')


# ==================== 1. CONFIGURATION ET CONNEXION POSTGRESQL ====================

class PostgreSQLConnector:
    """Gère la connexion à PostgreSQL et l'extraction des données"""

    def __init__(self, host, database, user, password, port=5432):
        self.host = host
        self.database = database
        self.user = user
        self.password = password
        self.port = port
        self.connection_string = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"
        self.engine = create_engine(self.connection_string)

    def test_connection(self):
        """Teste la connexion à PostgreSQL"""
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                print("[OK] Connexion PostgreSQL établie avec succès")
                return True
        except Exception as e:
            print(f"[ERREUR] Erreur de connexion PostgreSQL: {e}")
            return False

    def extract_all_data(self):
        """Extrait toutes les données avec jointures"""

        query = """
        SELECT
            u.id as user_id,
            u.full_name,
            u.email,
            u.role,
            u.username,
            r.training_id,
            t.title as training_title,
            t.theme,
            t.start_date,
            t.end_date,
            t.location,
            t.status as training_status,
            t.trainer_id,
            trainer.full_name as trainer_name,
            qn.id as questionnaire_id,
            qn.title as questionnaire_title,
            q.id as question_id,
            q.text as question_text,
            q.type as question_type,
            r.id as response_id,
            r.value as response_value
        FROM users u
        INNER JOIN response r ON u.id = r.user_id
        INNER JOIN question q ON r.question_id = q.id
        INNER JOIN questionnaire qn ON q.questionnaire_id = qn.id
        INNER JOIN training t ON r.training_id = t.id
        LEFT JOIN users trainer ON t.trainer_id = trainer.id
        ORDER BY u.id, r.training_id, q.id;
        """

        try:
            df = pd.read_sql(query, self.engine)
            print(f"[OK] {len(df)} réponses extraites avec succès")
            print(f"[STATS] {df['user_id'].nunique()} utilisateurs, "
                  f"{df['training_id'].nunique()} formations")
            return df
        except Exception as e:
            print(f"[ERREUR] Erreur d'extraction: {e}")
            return None

    def get_table_info(self):
        """Affiche les informations sur les tables"""
        query = """
        SELECT table_name, table_rows, data_length
        FROM information_schema.tables
        WHERE table_schema = :database
        ORDER BY table_name;
        """
        try:
            df_info = pd.read_sql(query, self.engine, params={'database': self.database})
            print("\n[INFO] Tables dans la base de données:")
            for _, row in df_info.iterrows():
                print(f"  - {row['table_name']}: {row['table_rows']} lignes")
            return df_info
        except Exception as e:
            print(f"[ATTENTION] Impossible de récupérer les infos des tables: {e}")
            return None


# ==================== 2. PRÉTRAITEMENT DES DONNÉES ====================

class DataPreprocessor:
    """Nettoie, prépare les données et évalue la qualité des formations"""

    def __init__(self, df):
        self.df_raw = df
        self.df_processed = None
        self.pivot_table = None
        self.data_summary = {}
        self.training_quality = {}

    # ---------- Mots-clés métier formations (français améliorés) ----------
    POSITIVE_KEYWORDS = [
        'excellent', 'parfait', 'très bien', 'super', 'intéressant', 'enrichissant',
        'utile', 'clair', 'compétent', 'professionnel', 'recommande', 'satisfait',
        'apprécié', 'pratique', 'concret', 'pédagogie', 'structuré', 'bien organisé',
        'répondu', 'appris', 'compétences', 'démonstrations', 'formidable', 'génial',
        'accessible', 'interactif', 'motivant', 'stimulant', 'nouveau', 'complet',
        'adapté', 'professionnalisme', 'dynamique', 'efficace', 'pertinent',
        'parfaitement', 'directement', 'enrichissante', 'satisfaisant', 'adapté',
        'bien', 'bon', 'bonne', 'beaucoup', 'facile', 'compréhensible', 'logique',
        'progressif', 'équilibré', 'pertinent', 'approprié', 'solide', 'rigoureux',
        'très satisfait', 'pleinement satisfait', 'satisfait globalement',
        'bonne qualité', 'très bonne qualité', 'explications claires',
    'très clair', 'bien expliqué', 'bien détaillé',
    'bonne organisation', 'bonne structure',
    'formation utile', 'formation intéressante', 'formation réussie',
    'très enrichissant', 'expérience positive',
    'bon formateur', 'excellent formateur',
    'bonne pédagogie', 'très pédagogique',
    'contenu riche', 'contenu pertinent',
    'bonne interaction', 'participatif',
    'gain de connaissances', 'valeur ajoutée',
    'applicable', 'directement applicable',
    'très pratique', 'cas concrets', 'exemples pertinents',
    'bonne ambiance', 'agréable',
    'formation complète', 'bien détaillée'
    ]

    NEGATIVE_KEYWORDS = [
        'déçu', 'décevant', 'insuffisant', 'trop basique', 'manque', 'manqué',
        'pas abordé', 'incomplet', 'confus', 'ennuyeux', 'inutile', 'superficiel',
        'flou', 'désorganisé', 'attentes non', 'problème', 'difficile', 'lent',
        'mal', 'mauvais', 'nul', 'monotone', 'redondant', 'trop long', 'trop court',
        'théorique', 'abstrait', 'pas clair', 'pas pratique', 'peu utile', 'dépassé',
        'obsolète', 'insuffisamment', 'inefficace', 'inadapté', 'incohérent',
        'confus', 'pauvre', 'faible', 'médiocre', 'lamentable', 'catastrophique',
        'horrible', 'terrible', 'affreux', 'désastreux', 'inacceptable',
        'très déçu', 'complètement déçu', 'pas satisfait',
    'mauvaise qualité', 'très mauvaise qualité',
    'explications confuses', 'mal expliqué',
    'manque de clarté', 'manque de structure',
    'mal organisé', 'organisation faible',
    'contenu pauvre', 'contenu insuffisant',
    'formation inutile', 'formation faible',
    'expérience négative',
    'mauvais formateur', 'formateur peu compétent',
    'manque de pédagogie',
    'trop rapide', 'trop lent',
    'pas adapté', 'niveau inadapté',
    'pas intéressant', 'manque d\'intérêt',
    'peu pertinent', 'non pertinent',
    'pas interactif', 'manque d\'interaction',
    'peu de pratique', 'pas assez pratique',
    'manque d\'exemples', 'pas d\'exemples concrets',
    'difficile à suivre', 'incompréhensible',
    'confusion', 'complexe', 'trop compliqué',
    'décevante', 'mal organisée', 'pas grand-chose',
    'manquait d\'intérêt', 'manque de pratique',
    'explications confuses', 'difficiles à comprendre',
    'mal structuré', 'difficile à suivre',
    'pas utiles', 'trop limités', 'pas appliquer',
    'revoir totalement', 'beaucoup d\'améliorations',
    'nécessaires', 'améliorer la pédagogie',
    'proposons des explications plus claires',
    'bases du sujet', 'pas maîtrisées', 'décevante'
    ]

    # ---------- Détecteurs d'intensité ----------
    STRONG_POSITIVE = ['très', 'beaucoup', 'totalement', 'parfaitement', 'fortement', 
                      'excellent', 'formidable', 'génial', 'exceptionnel']
    
    STRONG_NEGATIVE = ['très', 'beaucoup', 'totalement', 'fortement', 'complètement',
                      'catastrophique', 'horrible', 'terrible', 'affreux', 'désastreux']
    
    WEAK_INDICATORS = ['un peu', 'légèrement', 'partiellement', 'moyennement', 'quelque']

    def detect_intensity(self, text):
        """Détecte si une réponse est forte, moyenne ou faible"""
        text_lower = text.lower()
        if any(word in text_lower for word in self.STRONG_POSITIVE):
            return 'strong'
        elif any(word in text_lower for word in self.STRONG_NEGATIVE):
            return 'strong_negative'
        elif any(word in text_lower for word in self.WEAK_INDICATORS):
            return 'weak'
        return 'medium'

    def analyze_sentiment_french(self, text):
        """Analyse de sentiment améliorée pour le français"""
        text_lower = text.lower()
        
        # Détection d'intensité
        intensity = self.detect_intensity(text)
        
        # Score de base selon les mots-clés
        positive_score = sum(1 for kw in self.POSITIVE_KEYWORDS if kw in text_lower)
        negative_score = sum(1 for kw in self.NEGATIVE_KEYWORDS if kw in text_lower)
        
        # Ajustement selon l'intensité
        if intensity == 'strong':
            multiplier = 2.0  # Augmenté de 1.5 à 2.0
        elif intensity == 'strong_negative':
            multiplier = 0.3  # Réduit de 0.5 à 0.3 (plus pénalisant)
        elif intensity == 'weak':
            multiplier = 0.9  # Augmenté de 0.8 à 0.9
        else:
            multiplier = 1.0
        
        # Score final avec pondération plus agressive pour les négatifs
        if positive_score > negative_score:
            return min(1.0, (positive_score - negative_score) * 0.15 * multiplier)  # Réduit de 0.2 à 0.15
        elif negative_score > positive_score:
            # Pénalisation plus forte pour les négatifs
            return max(-1.0, -(negative_score - positive_score) * 0.25 * multiplier)  # Augmenté de 0.2 à 0.25
        else:
            # En cas d'égalité, légèrement négatif par défaut pour les réponses neutres
            return -0.1

    def clean_data(self):
        """Nettoie les données brutes et affiche les réponses par utilisateur"""
        df = self.df_raw.copy()

        # ── Affichage des réponses brutes ──
        print("\n[EXTRACTION] RÉPONSES RÉCUPÉRÉES DE LA BASE DE DONNÉES:")
        print("=" * 100)

        for user_id in sorted(df['user_id'].unique()):
            user_data = df[df['user_id'] == user_id]
            print(f"\n[UTILISATEUR {user_id}]:")
            print("-" * 50)

            for training_id in user_data['training_id'].unique():
                training_data = user_data[user_data['training_id'] == training_id]
                training_title = training_data['training_title'].iloc[0]
                print(f"\n*** FORMATION: {training_title} ***")
                print("-" * 50)

                for question_id in sorted(training_data['question_id'].unique()):
                    question_responses = training_data[training_data['question_id'] == question_id]
                    question_text = question_responses['question_text'].iloc[0]
                    question_type = question_responses['question_type'].iloc[0]
                    question_display = (question_text[:60] + "...") if len(question_text) > 60 else question_text
                    print(f"  [Q{question_id}]: {question_display}")
                    print(f"     Type: {question_type}")
                    for _, row in question_responses.iterrows():
                        print(f"     Reponse: {row['response_value']}")
                    print()

        print("=" * 100)
        print(f"[STATS] Total: {len(df)} réponses extraites de {df['user_id'].nunique()} utilisateurs\n")

        # ── Nettoyage ──
        df['start_date'] = pd.to_datetime(df['start_date'])
        df['end_date'] = pd.to_datetime(df['end_date'])
        df['response_value'] = df['response_value'].fillna('').astype(str).str.strip()
        df['response_value'] = df['response_value'].replace(['None', 'null', 'NULL'], '')

        df['training_duration'] = (df['end_date'] - df['start_date']).dt.days
        df['year_month'] = df['start_date'].dt.to_period('M')
        df['quarter'] = df['start_date'].dt.quarter
        df['year'] = df['start_date'].dt.year
        df['month'] = df['start_date'].dt.month
        df['day_of_week'] = df['start_date'].dt.day_name()

        def classify_response(row):
            if row['question_type'] in ['numeric', 'rating', 'scale']:
                try:
                    return float(row['response_value'])
                except Exception:
                    return np.nan
            return row['response_value']

        df['response_cleaned'] = df.apply(classify_response, axis=1)
        self.df_processed = df

        self.data_summary = {
            'total_responses': len(df),
            'unique_users': df['user_id'].nunique(),
            'unique_trainings': df['training_id'].nunique(),
            'unique_questions': df['question_id'].nunique(),
            'date_range': f"{df['start_date'].min().date()} à {df['start_date'].max().date()}",
            'question_types': df['question_type'].value_counts().to_dict(),
            'user_roles': df['role'].value_counts().to_dict() if 'role' in df.columns else {}
        }

        print("[OK] Données nettoyées avec succès")
        print(f"[STATS] {self.data_summary['unique_users']} utilisateurs, "
              f"{self.data_summary['unique_trainings']} formations")

        # ── Évaluation automatique des formations ──
        self.evaluate_trainings_quality()

        return self

    # ──────────────────────────────────────────────────────────────────────────
    # ÉVALUATION QUALITÉ DES FORMATIONS
    # ──────────────────────────────────────────────────────────────────────────

    def evaluate_trainings_quality(self):
        """
        Évalue la qualité de chaque formation à partir :
          - de l'analyse de sentiment VADER sur les réponses textuelles (OPEN/text)
          - d'une détection de mots-clés métier positifs / négatifs
          - de la moyenne des notes numériques (rating / scale / numeric)
        Produit un verdict clair : ✅ BONNE / ⚠️ MOYENNE / ❌ À AMÉLIORER
        """
        import nltk
        from nltk.sentiment import SentimentIntensityAnalyzer
        nltk.download('vader_lexicon', quiet=True)

        df = self.df_processed
        sia = SentimentIntensityAnalyzer()

        print("\n" + "=" * 100)
        print("ÉVALUATION AUTOMATIQUE DE LA QUALITÉ DES FORMATIONS")
        print("=" * 100)

        training_verdicts = {}

        for training_id in sorted(df['training_id'].unique()):
            training_data = df[df['training_id'] == training_id]
            training_title = training_data['training_title'].iloc[0]

            # ── Réponses textuelles ──
            open_responses = (
                training_data[training_data['question_type'].isin(['text', 'OPEN'])]
                ['response_value']
                .dropna()
                .astype(str)
            )
            open_responses = open_responses[
                open_responses.str.strip().str.lower().isin(['', 'nan', 'none', 'null']) == False
            ]

            sentiment_scores = []
            positive_hits = 0
            negative_hits = 0
            total_responses = len(open_responses)

            for response in open_responses:
                resp_lower = response.lower()

                # Score VADER (complémentaire)
                vader_score = sia.polarity_scores(response)['compound']
                
                # Notre analyse française améliorée
                french_score = self.analyze_sentiment_french(response)
                
                # Moyenne pondérée : 70% français, 30% VADER
                combined_score = 0.7 * french_score + 0.3 * vader_score
                sentiment_scores.append(combined_score)

                # Mots-clés contextuels avec intensité
                intensity = self.detect_intensity(response)
                if any(kw in resp_lower for kw in self.POSITIVE_KEYWORDS):
                    weight = 1.5 if intensity == 'strong' else 1.0
                    positive_hits += weight
                if any(kw in resp_lower for kw in self.NEGATIVE_KEYWORDS):
                    weight = 1.5 if intensity == 'strong_negative' else 1.0
                    negative_hits += weight

            # ── Données numériques ──
            numeric_data = training_data[
                training_data['question_type'].isin(['numeric', 'rating', 'scale'])
            ].copy()
            numeric_data['numeric_value'] = pd.to_numeric(
                numeric_data['response_value'], errors='coerce'
            )
            numeric_avg = (
                numeric_data['numeric_value'].mean()
                if not numeric_data.empty else None
            )

            # ── Score composite ──
            avg_sentiment = float(np.mean(sentiment_scores)) if sentiment_scores else 0.0
            score_parts = []
            weights = []

            # Composante 1 : sentiment franco-vader → [0, 100] (poids augmenté)
            if sentiment_scores:
                # Mapping plus strict pour mieux pénaliser les négatifs
                if avg_sentiment >= 0.4:  # Seuil relevé de 0.3 à 0.4
                    # Très positif: [0.4,1] -> [75,100]
                    sentiment_score = 75 + (avg_sentiment - 0.4) / 0.6 * 25
                elif avg_sentiment >= 0.1:  # Seuil relevé de 0 à 0.1
                    # Positif: [0.1,0.4] -> [55,75]
                    sentiment_score = 55 + (avg_sentiment - 0.1) / 0.3 * 20
                elif avg_sentiment >= -0.1:  # Seuil réduit de -0.3 à -0.1
                    # Légèrement négatif: [-0.1,0.1] -> [35,55] (réduit de 40,55)
                    sentiment_score = 35 + (avg_sentiment + 0.1) / 0.2 * 20
                else:
                    # Très négatif: [-1,-0.1] -> [10,35] (réduit de 20,40)
                    sentiment_score = 10 + (avg_sentiment + 1) / 0.9 * 25
                sentiment_score = max(0.0, min(100.0, sentiment_score))
                score_parts.append(sentiment_score)
                weights.append(2)  # Augmenté de 1 à 2

            # Composante 2 : ratio mots-clés → [0, 100] (poids maintenu)
            if total_responses > 0:
                keyword_ratio = (positive_hits - negative_hits) / total_responses
                keyword_score = max(0.0, min(100.0, (keyword_ratio + 1) / 2 * 100))
                score_parts.append(keyword_score)
                weights.append(1)

            # Composante 3 : notes numériques → [0, 100]  (poids réduit)
            if numeric_avg is not None and not np.isnan(numeric_avg):
                numeric_score = min(100.0, (numeric_avg / 5) * 100)
                score_parts.append(numeric_score)
                weights.append(1)  # Réduit de 2 à 1

            if weights:
                final_score = sum(s * w for s, w in zip(score_parts, weights)) / sum(weights)
            else:
                final_score = 50.0

            # ── Verdict ──
            if final_score >= 75:  # Seuil relevé de 68 à 75
                verdict       = "✅  BONNE FORMATION"
                verdict_emoji = "🟢"
                advice        = "Capitaliser sur les points forts, maintenir le niveau."
            elif final_score >= 55:  # Seuil relevé de 45 à 55
                verdict       = "⚠️   FORMATION MOYENNE"
                verdict_emoji = "🟡"
                advice        = "Des améliorations ciblées sont recommandées."
            else:
                verdict       = "❌  FORMATION À AMÉLIORER"
                verdict_emoji = "🔴"
                advice        = "Révision profonde du contenu et de la pédagogie nécessaire."

            training_verdicts[training_id] = {
                'title':               training_title,
                'verdict':             verdict,
                'score':               round(final_score, 1),
                'avg_sentiment':       round(avg_sentiment, 3),
                'positive_responses':  positive_hits,
                'negative_responses':  negative_hits,
                'total_open_responses':total_responses,
                'numeric_avg':         round(numeric_avg, 2) if (numeric_avg and not np.isnan(numeric_avg)) else None,
                'advice':              advice
            }
            print(f"  Sentiment     : {avg_sentiment:+.3f}  ({verdict_emoji})")
            print(
                f"  Reponses +    : {positive_hits}   |   "
                f"Reponses -    : {negative_hits}   |   "
                f"Total texte  : {total_responses}"
            )
            if numeric_avg is not None and not np.isnan(numeric_avg):
                print(f"  Note moy.     : {numeric_avg:.2f} / 5")
            print(f"  Conseil       : {advice}")

            # Verbatims représentatifs
            if sentiment_scores and open_responses.tolist():
                paired = sorted(
                    zip(sentiment_scores, open_responses.tolist()),
                    key=lambda x: x[0]
                )
                best  = paired[-1]
                worst = paired[0]
                if best[0] > 0.05:
                    txt = best[1]
                    print(f"\n  Meilleur avis : "
                          f"' {txt[:120]}{'...' if len(txt) > 120 else ''} '")
                if worst[0] < -0.05:
                    txt = worst[1]
                    print(f"  Critique cle  : "
                          f"' {txt[:120]}{'...' if len(txt) > 120 else ''} '")

        # ── Résumé global ──
        print(f"\n{'=' * 100}")
        print("RESUME GLOBAL DE TOUTES LES FORMATIONS")
        print(f"{'=' * 100}")

        if training_verdicts:
            scores_sorted = sorted(
                [(v['title'], v['score'], v['verdict'])
                 for v in training_verdicts.values()],
                key=lambda x: x[1], reverse=True
            )
            print(f"\n  {'Formation':<35} {'Score':>8}   Barre de progression              Verdict")
            print(f"  {'-'*35} {'-'*8}   {'-'*32}   {'-'*30}")
            for title, score, verdict in scores_sorted:
                filled  = int(score / 5)
                bar     = '#' * filled + '.' * (20 - filled)
                print(f"  {title[:35]:<35} {score:>6.1f}%  {bar}  {verdict}")

            avg_global = np.mean([v['score'] for v in training_verdicts.values()])
            n_good     = sum(1 for v in training_verdicts.values() if v['score'] >= 75)  # Seuil relevé à 75
            n_avg      = sum(1 for v in training_verdicts.values() if 55 <= v['score'] < 75)  # Seuil relevé à 55
            n_bad      = sum(1 for v in training_verdicts.values() if v['score'] < 55)  # Seuil relevé à 55

            print(f"\n  Score moyen global     : {avg_global:.1f} / 100")
            print(f"  Bonnes formations   : {n_good}")
            print(f"  Formations moyennes : {n_avg}")
            print(f"  A améliorer         : {n_bad}")

        print(f"\n{'=' * 100}\n")
        self.training_quality = training_verdicts
        return self

    def create_pivot_table(self):
        """Crée une table pivot pour les analyses"""

        numeric_questions = self.df_processed[
            self.df_processed['question_type'].isin(['numeric', 'rating', 'scale'])
        ].copy()

        text_questions = self.df_processed[
            self.df_processed['question_type'] == 'text'
        ].copy()

        choice_questions = self.df_processed[
            self.df_processed['question_type'].isin(['choice', 'multiple_choice', 'boolean'])
        ].copy()

        # Pivot numérique
        if not numeric_questions.empty:
            numeric_questions['numeric_value'] = pd.to_numeric(
                numeric_questions['response_value'], errors='coerce'
            )
            numeric_pivot = numeric_questions.pivot_table(
                index=['user_id', 'training_id', 'training_title', 'role'],
                columns='question_text',
                values='numeric_value',
                aggfunc='first'
            ).reset_index()
        else:
            numeric_pivot = pd.DataFrame()

        # Agrégation texte
        if not text_questions.empty:
            text_agg = text_questions.groupby(['user_id', 'training_id']).agg({
                'question_text':  lambda x: list(x),
                'response_value': lambda x: list(x)
            }).reset_index()
        else:
            text_agg = pd.DataFrame()

        # Agrégation choix
        if not choice_questions.empty:
            choice_summary = (
                choice_questions
                .groupby(['question_text', 'response_value'])
                .size()
                .reset_index(name='count')
            )
            choice_summary['percentage'] = (
                choice_summary
                .groupby('question_text')['count']
                .transform(lambda x: x / x.sum() * 100)
            )
        else:
            choice_summary = pd.DataFrame()

        self.pivot_table = {
            'numeric': numeric_pivot,
            'text':    text_agg,
            'choice':  choice_summary
        }
        print("[OK] Table pivot créée")
        return self


# ==================== 3. ANALYSES STATISTIQUES ====================

class StatisticalAnalyzer:
    """Effectue les analyses statistiques descriptives et inférentielles"""

    def __init__(self, data_preprocessor):
        self.dp = data_preprocessor
        self.df = self.dp.df_processed
        self.stats_results = {}

    def descriptive_statistics(self):
        numeric_data = self.df[
            self.df['question_type'].isin(['numeric', 'rating', 'scale'])
        ].copy()

        if numeric_data.empty:
            print("[ATTENTION] Aucune donnée numérique à analyser")
            return self

        numeric_data['numeric_value'] = pd.to_numeric(
            numeric_data['response_value'], errors='coerce'
        )

        stats = numeric_data.groupby('question_text')['numeric_value'].agg([
            ('moyenne',      'mean'),
            ('médiane',      'median'),
            ('écart_type',   'std'),
            ('min',          'min'),
            ('max',          'max'),
            ('compte',       'count'),
            ('quartile_25',  lambda x: x.quantile(0.25)),
            ('quartile_75',  lambda x: x.quantile(0.75))
        ]).round(2)

        mode_values = numeric_data.groupby('question_text')['numeric_value'].agg(
            lambda x: x.mode().iloc[0] if not x.mode().empty else np.nan
        )
        stats['mode'] = mode_values

        self.stats_results['descriptive'] = stats
        print("\n[STATS] STATISTIQUES DESCRIPTIVES:")
        print(stats[['moyenne', 'médiane', 'écart_type', 'compte']].to_string())
        return self

    def cross_analysis_by_role(self):
        numeric_data = self.df[
            self.df['question_type'].isin(['numeric', 'rating', 'scale'])
        ].copy()
        numeric_data['numeric_value'] = pd.to_numeric(
            numeric_data['response_value'], errors='coerce'
        )

        if 'role' not in numeric_data.columns:
            print("[ATTENTION] Colonne 'role' non trouvée")
            return self

        cross_stats = numeric_data.groupby(
            ['role', 'question_text']
        )['numeric_value'].agg(['mean', 'std', 'count', 'min', 'max']).round(2)

        from scipy import stats
        anova_results = {}
        for question in numeric_data['question_text'].unique():
            groups = []
            for role in numeric_data['role'].unique():
                group_data = numeric_data[
                    (numeric_data['question_text'] == question) &
                    (numeric_data['role'] == role)
                ]['numeric_value'].dropna()
                if len(group_data) > 0:
                    groups.append(group_data)
            if len(groups) >= 2:
                f_stat, p_value = stats.f_oneway(*groups)
                anova_results[question] = {
                    'f_statistic':  round(f_stat, 3),
                    'p_value':      round(p_value, 4),
                    'significatif': p_value < 0.05
                }

        self.stats_results['by_role'] = {
            'statistics': cross_stats,
            'anova':      anova_results
        }
        print("\n[ROLES] ANALYSE PAR RÔLE:")
        print(cross_stats.to_string())

        sig_questions = [q for q, res in anova_results.items() if res['significatif']]
        if sig_questions:
            print(f"\n[INFO] Différences significatives: {', '.join(sig_questions[:3])}")
        return self

    def temporal_analysis(self):
        numeric_data = self.df[
            self.df['question_type'].isin(['numeric', 'rating', 'scale'])
        ].copy()
        numeric_data['numeric_value'] = pd.to_numeric(
            numeric_data['response_value'], errors='coerce'
        )

        temporal_monthly = numeric_data.groupby(
            ['year_month', 'question_text']
        )['numeric_value'].agg(['mean', 'count']).round(2)

        temporal_quarterly = numeric_data.groupby(
            ['quarter', 'year', 'question_text']
        )['numeric_value'].mean().round(2)

        trends = {}
        for question in numeric_data['question_text'].unique():
            q_data = numeric_data[numeric_data['question_text'] == question].copy()
            q_data['time_idx'] = range(len(q_data))
            if len(q_data) > 1:
                corr = q_data['time_idx'].corr(q_data['numeric_value'])
                trends[question] = {
                    'correlation_temporelle': round(corr, 3),
                    'tendance': ('hausse' if corr > 0.3
                                 else 'baisse' if corr < -0.3 else 'stable')
                }

        self.stats_results['temporal'] = {
            'monthly':   temporal_monthly,
            'quarterly': temporal_quarterly,
            'trends':    trends
        }
        print("\n[TEMPS] ANALYSE TEMPORELLE:")
        for q, trend in list(trends.items())[:5]:
            print(f"  - {q[:50]}...: {trend['tendance']} "
                  f"(corr: {trend['correlation_temporelle']})")
        return self

    def calculate_nps(self):
        nps_keywords = [
            'recommand', 'recommander', 'nps', 'probabilité', 'probabilite',
            'recommend', 'likely', 'noter', 'notez'
        ]
        nps_questions = self.df[
            self.df['question_text'].str.lower().str.contains(
                '|'.join(nps_keywords), case=False, na=False
            )
        ].copy()

        if nps_questions.empty:
            rating_10 = self.df[
                (self.df['question_type'] == 'rating') &
                (self.df['response_value'].str.match(r'^\d+$').fillna(False))
            ].copy()
            if not rating_10.empty:
                rating_10['numeric_value'] = pd.to_numeric(
                    rating_10['response_value'], errors='coerce'
                )
                rating_10 = rating_10[rating_10['numeric_value'].between(0, 10)]
                if not rating_10.empty:
                    nps_questions = rating_10

        if not nps_questions.empty:
            nps_data = pd.to_numeric(nps_questions['response_value'], errors='coerce').dropna()
            nps_data = nps_data[nps_data.between(0, 10)]

            if len(nps_data) > 0:
                detractors = (nps_data <= 6).sum()
                passives   = ((nps_data >= 7) & (nps_data <= 8)).sum()
                promoters  = (nps_data >= 9).sum()
                total      = len(nps_data)
                nps_score  = ((promoters - detractors) / total) * 100

                if   nps_score >= 50: quality = "Excellent"
                elif nps_score >= 30: quality = "Très bon"
                elif nps_score >= 10: quality = "Bon"
                elif nps_score >= 0:  quality = "Acceptable"
                else:                 quality = "À améliorer"

                self.stats_results['nps'] = {
                    'score':             round(nps_score, 2),
                    'quality':           quality,
                    'promoteurs':        int(promoters),
                    'passifs':           int(passives),
                    'détracteurs':       int(detractors),
                    'total':             int(total),
                    'taux_promoteurs':   round(promoters / total * 100, 1),
                    'taux_detracteurs':  round(detractors / total * 100, 1)
                }
                print(f"\n[NPS] NET PROMOTER SCORE: {round(nps_score, 2)} - {quality}")
                print(f"  Promoteurs: {promoters} ({promoters/total*100:.1f}%)")
                print(f"  Passifs:    {passives}   ({passives/total*100:.1f}%)")
                print(f"  Détracteurs:{detractors} ({detractors/total*100:.1f}%)")
            else:
                print("[ATTENTION] Données NPS invalides")
        else:
            print("[ATTENTION] Aucune question NPS trouvée")
        return self


# ==================== 4. ANALYSES IA AVANCÉES ====================

from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from sklearn.decomposition import PCA
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import LatentDirichletAllocation

try:
    import emoji
    EMOJI_AVAILABLE = True
except ImportError:
    EMOJI_AVAILABLE = False


class AIAnalyzer:
    """Implémente les analyses basées sur l'IA"""

    def __init__(self, data_preprocessor):
        self.dp = data_preprocessor
        self.df = self.dp.df_processed
        self.ai_results = {}

        try:
            nltk.download('vader_lexicon',             quiet=True)
            nltk.download('stopwords',                 quiet=True)
            nltk.download('punkt',                     quiet=True)
            nltk.download('averaged_perceptron_tagger', quiet=True)
            print("[OK] Ressources NLTK chargées")
        except Exception as e:
            print(f"[ATTENTION] Problème avec NLTK: {e}")

    def sentiment_analysis(self):
        print(f"[DEBUG] Types de questions: {self.df['question_type'].value_counts().to_dict()}")

        text_responses = self.df[self.df['question_type'].isin(['text', 'OPEN'])].copy()
        if text_responses.empty:
            print("[ATTENTION] Aucune réponse textuelle à analyser")
            return self

        sia = SentimentIntensityAnalyzer()

        def analyze_sentiment(text):
            if pd.isna(text) or text in ('', 'nan'):
                return {'compound': 0, 'label': 'neutre', 'intensity': 'faible'}
            scores = sia.polarity_scores(str(text))
            if   scores['compound'] >= 0.5:  label, intensity = 'très positif', 'forte'
            elif scores['compound'] >= 0.05: label, intensity = 'positif',      'modérée'
            elif scores['compound'] <= -0.5: label, intensity = 'très négatif', 'forte'
            elif scores['compound'] <= -0.05:label, intensity = 'négatif',      'modérée'
            else:                            label, intensity = 'neutre',        'faible'
            return {**scores, 'label': label, 'intensity': intensity}

        text_responses['sentiment']           = text_responses['response_value'].apply(analyze_sentiment)
        text_responses['sentiment_score']     = text_responses['sentiment'].apply(lambda x: x['compound'])
        text_responses['sentiment_label']     = text_responses['sentiment'].apply(lambda x: x['label'])
        text_responses['sentiment_intensity'] = text_responses['sentiment'].apply(lambda x: x['intensity'])

        sentiment_stats    = text_responses['sentiment_label'].value_counts()
        intensity_stats    = text_responses['sentiment_intensity'].value_counts()
        sentiment_by_question = text_responses.groupby('question_text')['sentiment_score'].mean()

        top_positive = text_responses.nlargest(5, 'sentiment_score')[
            ['user_id', 'question_text', 'response_value', 'sentiment_score']
        ]
        top_negative = text_responses.nsmallest(5, 'sentiment_score')[
            ['user_id', 'question_text', 'response_value', 'sentiment_score']
        ]

        merged_data = text_responses.merge(
            self.df[['user_id', 'role']].drop_duplicates(), on='user_id', how='left'
        )

        self.ai_results['sentiment'] = {
            'global':        sentiment_stats.to_dict(),
            'intensity':     intensity_stats.to_dict(),
            'by_question':   sentiment_by_question.to_dict(),
            'top_positive':  top_positive.to_dict('records'),
            'top_negative':  top_negative.to_dict('records'),
            'average_score': round(text_responses['sentiment_score'].mean(), 3),
            'detailed':      merged_data.to_dict('records')
        }
        print(f"\n[SENTIMENT] Score moyen: {self.ai_results['sentiment']['average_score']}")
        print(f"  Répartition: {sentiment_stats.to_dict()}")
        return self

    def topic_modeling(self, n_topics=3, n_words=10):
        text_responses = self.df[
            (self.df['question_type'].isin(['text', 'OPEN'])) &
            (self.df['response_value'].str.len() > 15)
        ].copy()

        if len(text_responses) < 5:
            print("[ATTENTION] Pas assez de réponses textuelles pour le topic modeling")
            return self

        def preprocess_text(text):
            text = str(text).lower()
            text = re.sub(r'[^\w\s]', ' ', text)
            text = re.sub(r'\d+', '', text)
            if EMOJI_AVAILABLE:
                text = emoji.replace_emoji(text, replace='')
            return re.sub(r'\s+', ' ', text).strip()

        documents = text_responses['response_value'].apply(preprocess_text).tolist()

        vectorizer = TfidfVectorizer(
            max_df=0.85, min_df=2,
            stop_words=stopwords.words('french') + stopwords.words('english'),
            max_features=1000, ngram_range=(1, 2)
        )

        try:
            tfidf_matrix  = vectorizer.fit_transform(documents)
            feature_names = vectorizer.get_feature_names_out()

            lda = LatentDirichletAllocation(
                n_components=n_topics, random_state=42,
                max_iter=100, learning_method='online'
            )
            lda.fit(tfidf_matrix)

            topics = {}
            for idx, topic in enumerate(lda.components_):
                top_idx   = topic.argsort()[:-n_words-1:-1]
                top_words = [feature_names[i] for i in top_idx]
                top_scores= [round(topic[i], 3) for i in top_idx]
                topics[f"Thème {idx+1}"] = {'mots': top_words, 'scores': top_scores}

            doc_topics      = lda.transform(tfidf_matrix)
            dominant_topics = doc_topics.argmax(axis=1)
            topic_dist      = pd.Series(dominant_topics).value_counts().sort_index()

            self.ai_results['topics'] = {
                'themes':       topics,
                'distribution': topic_dist.to_dict(),
                'documents':    text_responses[['user_id', 'question_text', 'response_value']]
                                    .assign(topic_principal=dominant_topics)
            }
            print("\n[THEMES] THÈMES DÉTECTÉS:")
            for theme, data in topics.items():
                print(f"  {theme}: {', '.join(data['mots'][:5])}")
        except Exception as e:
            print(f"[ATTENTION] Erreur dans le topic modeling: {e}")
        return self

    def anomaly_detection(self, contamination=0.1):
        numeric_data = self.df[
            self.df['question_type'].isin(['numeric', 'rating', 'scale'])
        ].copy()

        if numeric_data.empty:
            print("[ATTENTION] Pas de données numériques pour la détection d'anomalies")
            return self

        numeric_data['numeric_value'] = pd.to_numeric(
            numeric_data['response_value'], errors='coerce'
        )

        user_features = numeric_data.groupby('user_id').agg({
            'numeric_value': ['mean', 'std', 'min', 'max', 'count'],
            'question_id':   'nunique'
        }).round(2)
        user_features.columns = ['_'.join(col).strip() for col in user_features.columns.values]
        user_features = user_features.fillna(0)

        if len(user_features) < 5:
            print("[ATTENTION] Pas assez d'utilisateurs pour la détection d'anomalies")
            return self

        scaler         = StandardScaler()
        features_scaled = scaler.fit_transform(user_features)

        iso_forest     = IsolationForest(contamination=contamination, random_state=42, n_estimators=100)
        iso_predictions = iso_forest.fit_predict(features_scaled)

        z_scores          = np.abs(features_scaled).mean(axis=1)
        z_threshold        = np.percentile(z_scores, 95)
        z_score_anomalies  = z_scores > z_threshold

        user_features['iso_forest_anomaly'] = iso_predictions
        user_features['z_score']            = z_scores
        user_features['z_score_anomaly']    = z_score_anomalies
        user_features['final_anomaly']      = (iso_predictions == -1) | z_score_anomalies

        anomalies = user_features[user_features['final_anomaly']].index.tolist()
        anomaly_details = self.df[self.df['user_id'].isin(anomalies)] if anomalies else pd.DataFrame()
        anomaly_profile = (
            anomaly_details.groupby('user_id').agg({
                'response_value': lambda x: list(x)[:5],
                'question_type':  lambda x: x.value_counts().to_dict(),
                'training_id':    'nunique'
            }) if not anomaly_details.empty else pd.DataFrame()
        )

        self.ai_results['anomalies'] = {
            'users':      anomalies,
            'count':      len(anomalies),
            'percentage': round(len(anomalies) / len(user_features) * 100, 2),
            'profiles':   anomaly_profile.to_dict('index') if not anomaly_profile.empty else {},
            'details':    anomaly_details
        }
        print(f"\n[ANOMALIES] {len(anomalies)} utilisateurs anormaux "
              f"({self.ai_results['anomalies']['percentage']}%)")
        return self

    def user_clustering(self, n_clusters=None):
        if not self.dp.pivot_table or self.dp.pivot_table['numeric'].empty:
            print("[ATTENTION] Pas de données pour le clustering")
            return self

        pivot = self.dp.pivot_table['numeric'].copy()
        feature_cols = [
            col for col in pivot.columns
            if col not in ['user_id', 'training_id', 'training_title', 'role']
        ]

        if len(feature_cols) < 2 or len(pivot) < 3:
            print("[ATTENTION] Pas assez de données pour le clustering")
            return self

        X = pivot[feature_cols].fillna(pivot[feature_cols].mean())

        if n_clusters is None:
            from sklearn.metrics import silhouette_score
            max_clusters = min(8, len(X) // 3)
            if max_clusters < 2:
                n_clusters = 2
            else:
                scores = []
                K_range = range(2, max_clusters + 1)
                for k in K_range:
                    km = KMeans(n_clusters=k, random_state=42, n_init=10)
                    km.fit(X)
                    scores.append(silhouette_score(X, km.labels_))
                n_clusters = list(K_range)[np.argmax(scores)]
                print(f"  Nombre optimal de clusters: {n_clusters}")

        scaler   = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        kmeans   = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(X_scaled)
        pivot['cluster'] = clusters

        cluster_profiles = pivot.groupby('cluster')[feature_cols].mean()
        role_composition = (
            pivot.groupby('cluster')['role'].value_counts().unstack().fillna(0)
            if 'role' in pivot.columns else pd.DataFrame()
        )

        pca      = PCA(n_components=2)
        X_pca    = pca.fit_transform(X_scaled)

        self.ai_results['clusters'] = {
            'n_clusters':      n_clusters,
            'assignments':     pivot[
                ['user_id', 'cluster', 'role'] if 'role' in pivot.columns
                else ['user_id', 'cluster']
            ],
            'profiles':        cluster_profiles,
            'role_composition':role_composition,
            'size':            pivot['cluster'].value_counts().sort_index().to_dict(),
            'pca_coords':      X_pca,
            'inertia':         kmeans.inertia_
        }
        print(f"\n[CLUSTERS] {n_clusters} profils types identifiés")
        for c, s in pivot['cluster'].value_counts().sort_index().items():
            print(f"  Cluster {c}: {s} utilisateurs")
        return self


# ==================== 5. VISUALISATION ====================

class Visualizer:
    """Crée des visualisations pour faciliter la prise de décision"""

    def __init__(self, statistical_analyzer, ai_analyzer):
        self.stats = statistical_analyzer
        self.ai    = ai_analyzer
        self.df    = self.stats.df
        plt.style.use('seaborn-v0_8-darkgrid')
        sns.set_palette("husl")

    def create_dashboard(self):
        fig = plt.figure(figsize=(24, 18))
        fig.suptitle('Tableau de Bord Intelligent - Analyse des Questionnaires',
                     fontsize=16, fontweight='bold', y=0.98)

        numeric_data = self.df[
            self.df['question_type'].isin(['numeric', 'rating', 'scale'])
        ].copy()
        if not numeric_data.empty:
            numeric_data['numeric_value'] = pd.to_numeric(
                numeric_data['response_value'], errors='coerce'
            )

        # 1 - Satisfaction par question
        plt.subplot(4, 4, 1)
        if not numeric_data.empty:
            avg_sat = numeric_data.groupby('question_text')['numeric_value'].mean().sort_values()
            if len(avg_sat) > 8:
                avg_sat = avg_sat.tail(8)
            colors = plt.cm.RdYlGn(avg_sat / 5)
            avg_sat.plot(kind='barh', ax=plt.gca(), color=colors)
            plt.title('Satisfaction par Question', fontweight='bold')
            plt.xlabel('Note moyenne (/5)')
            plt.xlim(0, 5)

        # 2 - Sentiments
        plt.subplot(4, 4, 2)
        if 'sentiment' in self.ai.ai_results:
            sd = self.ai.ai_results['sentiment']['global']
            cmap = {'très positif': 'darkgreen', 'positif': 'lightgreen',
                    'neutre': 'gray', 'négatif': 'lightcoral', 'très négatif': 'darkred'}
            colors = [cmap.get(k, 'blue') for k in sd.keys()]
            plt.pie(sd.values(), labels=sd.keys(), autopct='%1.1f%%',
                    colors=colors, startangle=90)
            plt.title('Analyse de Sentiment', fontweight='bold')

        # 3 - Évolution temporelle
        plt.subplot(4, 4, 3)
        if 'temporal' in self.stats.stats_results:
            temporal = self.stats.stats_results['temporal']['monthly'].groupby(level=0).mean()
            if not temporal.empty:
                for q in temporal.std().nlargest(3).index:
                    if q in temporal.columns:
                        plt.plot(temporal.index.astype(str), temporal[q],
                                 marker='o', label=q[:20])
                plt.title('Évolution Temporelle', fontweight='bold')
                plt.xticks(rotation=45, ha='right')
                plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left', fontsize=8)

        # 4 - Distribution
        plt.subplot(4, 4, 4)
        if not numeric_data.empty:
            top_q = numeric_data['question_text'].value_counts().index[:3]
            data_to_plot, labels = [], []
            for q in top_q:
                qd = numeric_data[numeric_data['question_text'] == q]['numeric_value'].dropna()
                if len(qd) > 0:
                    data_to_plot.append(qd)
                    labels.append(q[:20] + '...')
            if data_to_plot:
                bp = plt.boxplot(data_to_plot, labels=labels, patch_artist=True)
                for patch, color in zip(bp['boxes'], sns.color_palette("husl", len(data_to_plot))):
                    patch.set_facecolor(color)
                plt.title('Distribution des Réponses', fontweight='bold')
                plt.xticks(rotation=45, ha='right')

        # 5 - Heatmap corrélations
        plt.subplot(4, 4, 5)
        if self.stats.dp.pivot_table and not self.stats.dp.pivot_table['numeric'].empty:
            pivot = self.stats.dp.pivot_table['numeric']
            numeric_cols = [c for c in pivot.select_dtypes(include=[np.number]).columns
                            if c != 'user_id']
            if len(numeric_cols) > 1:
                corr = pivot[numeric_cols].corr()
                if corr.shape[0] > 8:
                    corr = corr.iloc[:8, :8]
                sns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm',
                            center=0, ax=plt.gca(), cbar_kws={'shrink': 0.8})
                plt.title('Corrélations', fontweight='bold')
                plt.xticks(rotation=45, ha='right')

        # 6 - Par rôle
        plt.subplot(4, 4, 6)
        if 'by_role' in self.stats.stats_results:
            by_role = self.stats.stats_results['by_role']['statistics'].reset_index()
            if not by_role.empty:
                for q in by_role['question_text'].unique()[:3]:
                    qd = by_role[by_role['question_text'] == q]
                    plt.bar([f"{r}\n({q[:10]})" for r in qd['role']],
                            qd['mean'], alpha=0.7, label=q[:15])
                plt.title('Satisfaction par Rôle', fontweight='bold')
                plt.xticks(rotation=45, ha='right')
                plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left', fontsize=8)

        # 7 - Mots fréquents
        plt.subplot(4, 4, 7)
        text_responses = self.df[self.df['question_type'].isin(['text', 'OPEN'])]['response_value']
        if not text_responses.empty:
            all_text = re.sub(r'[^\w\s]', '', ' '.join(text_responses.astype(str)).lower())
            words = [w for w in all_text.split() if len(w) > 3]
            word_freq = pd.Series(words).value_counts().head(15)
            colors = plt.cm.viridis(np.linspace(0, 1, len(word_freq)))
            word_freq.plot(kind='barh', ax=plt.gca(), color=colors[::-1])
            plt.title('Mots les Plus Fréquents', fontweight='bold')
            plt.xlabel('Fréquence')

        # 8 - Anomalies
        plt.subplot(4, 4, 8)
        if 'anomalies' in self.ai.ai_results:
            anomalies   = self.ai.ai_results['anomalies']
            total_users = self.df['user_id'].nunique()
            normal      = total_users - anomalies['count']
            plt.bar(['Normaux', 'Anormaux'], [normal, anomalies['count']],
                    color=['#2ecc71', '#e74c3c'], edgecolor='black', linewidth=1.5)
            plt.title(f"Détection d'Anomalies\n({anomalies['percentage']}%)", fontweight='bold')
            plt.ylabel('Nombre')

        # 9 - Clusters PCA
        plt.subplot(4, 4, 9)
        if 'clusters' in self.ai.ai_results:
            clusters     = self.ai.ai_results['clusters']
            pca_coords   = clusters['pca_coords']
            assignments  = clusters['assignments']
            sc = plt.scatter(pca_coords[:, 0], pca_coords[:, 1],
                             c=assignments['cluster'], cmap='tab10',
                             alpha=0.7, s=50, edgecolors='black', linewidth=0.5)
            plt.colorbar(sc, label='Cluster')
            plt.title(f"Clusters Utilisateurs\n({clusters['n_clusters']} groupes)", fontweight='bold')
            plt.xlabel('PC1'); plt.ylabel('PC2')

        # 10 - NPS
        plt.subplot(4, 4, 10)
        if 'nps' in self.stats.stats_results:
            nps = self.stats.stats_results['nps']['score']
            plt.barh([0], [100], color='lightgray', alpha=0.3)
            plt.barh([0], [nps + 100], color='green', alpha=0.8, left=-100)
            plt.xlim(-100, 100)
            plt.ylim(-0.5, 0.5)
            plt.title(f"NPS: {nps}\n({self.stats.stats_results['nps']['quality']})", fontweight='bold')
            plt.axvline(x=0, color='black', linestyle='--', alpha=0.5)
            plt.yticks([])

        # 11 - Distribution thèmes
        plt.subplot(4, 4, 11)
        if 'topics' in self.ai.ai_results:
            td = self.ai.ai_results['topics']['distribution']
            if td:
                plt.pie(td.values(), labels=[f"Thème {k+1}" for k in td.keys()],
                        autopct='%1.1f%%', startangle=90)
                plt.title('Distribution des Thèmes', fontweight='bold')

        # 12 - Participation mensuelle
        plt.subplot(4, 4, 12)
        participation = self.df.groupby('year_month')['user_id'].nunique()
        if not participation.empty:
            participation.plot(kind='line', marker='o', ax=plt.gca(), color='purple', linewidth=2)
            plt.title('Participants par Mois', fontweight='bold')
            plt.xticks(rotation=45, ha='right')
            plt.ylabel('Nb participants')

        # 13 - Sentiments par rôle
        plt.subplot(4, 4, 13)
        if 'sentiment' in self.ai.ai_results:
            sd = self.ai.ai_results['sentiment']['detailed']
            if sd:
                try:
                    sdf = pd.DataFrame(sd)
                    if 'role' in sdf.columns:
                        sbr = sdf.groupby(['role', 'sentiment_label']).size().unstack().fillna(0)
                        if not sbr.empty:
                            sns.heatmap(sbr, annot=True, fmt='.0f', cmap='YlOrRd', ax=plt.gca())
                            plt.title('Sentiments par Rôle', fontweight='bold')
                except Exception:
                    plt.title('Sentiments par Rôle', fontweight='bold')

        # 14 - Top formateurs
        plt.subplot(4, 4, 14)
        if 'trainer_name' in self.df.columns:
            nd = self.df[self.df['question_type'].isin(['numeric', 'rating', 'scale'])].copy()
            nd['numeric_value'] = pd.to_numeric(nd['response_value'], errors='coerce')
            if not nd.empty:
                ts = nd.groupby('trainer_name')['numeric_value'].mean().sort_values(ascending=False).head(5)
                if not ts.empty:
                    ts.plot(kind='bar', ax=plt.gca(), color='teal', edgecolor='black')
                    plt.title('Top 5 Formateurs', fontweight='bold')
                    plt.xticks(rotation=45, ha='right')
                    plt.ylabel('Note moyenne')

        # 15 - Volume par type de question
        plt.subplot(4, 4, 15)
        rr = self.df['question_type'].value_counts()
        rr.plot(kind='bar', ax=plt.gca(), color='coral', edgecolor='black')
        plt.title('Volume par Type de Question', fontweight='bold')
        plt.xticks(rotation=45, ha='right')
        plt.ylabel('Nombre')

        # 16 - Insights
        plt.subplot(4, 4, 16)
        plt.axis('off')
        insights = []
        if 'nps' in self.stats.stats_results:
            nps = self.stats.stats_results['nps']
            insights.append(f"• NPS: {nps['score']} ({nps['quality']})")
        if 'sentiment' in self.ai.ai_results:
            sg  = self.ai.ai_results['sentiment']['global']
            pos = sg.get('positif', 0) + sg.get('très positif', 0)
            tot = sum(sg.values())
            if tot > 0:
                insights.append(f"• Sentiment positif: {pos/tot*100:.1f}%")
        if 'anomalies' in self.ai.ai_results:
            insights.append(f"• Anomalies: {self.ai.ai_results['anomalies']['count']} utilisateurs")
        if 'clusters' in self.ai.ai_results:
            insights.append(f"• Profils: {self.ai.ai_results['clusters']['n_clusters']} types")
        if 'topics' in self.ai.ai_results:
            insights.append(f"• Thèmes: {len(self.ai.ai_results['topics']['themes'])} détectés")

        plt.text(0.1, 0.5,
                 f"INSIGHTS CLÉS\n\n" + ('\n'.join(insights) if insights else "• Analyse en cours…"),
                 transform=plt.gca().transAxes, fontsize=12, verticalalignment='center',
                 bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
        plt.title('Résumé IA', fontweight='bold')

        plt.tight_layout()
        plt.savefig('dashboard_postgresql_analyse.png', dpi=300, bbox_inches='tight')
        # plt.show()  # Désactivé pour ne pas afficher le graphique
        print("[OK] Dashboard sauvegardé → 'dashboard_postgresql_analyse.png'")

    def create_training_quality_chart(self):
        """
        Graphique dédié à l'évaluation de la qualité des formations.
        S'appuie sur les résultats de DataPreprocessor.evaluate_trainings_quality().
        """
        training_quality = self.stats.dp.training_quality

        if not training_quality:
            print("[ATTENTION] Aucune donnée de qualité de formation disponible")
            return

        titles  = [v['title']  for v in training_quality.values()]
        scores  = [v['score']  for v in training_quality.values()]
        verdicts= [v['verdict'] for v in training_quality.values()]

        # Couleurs selon le verdict
        bar_colors = []
        for s in scores:
            if   s >= 68: bar_colors.append('#2ecc71')
            elif s >= 45: bar_colors.append('#f39c12')
            else:         bar_colors.append('#e74c3c')

        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('ÉVALUATION DE LA QUALITÉ DES FORMATIONS',
                     fontsize=16, fontweight='bold')

        # ── Panneau 1 : barres des scores ──
        ax1 = axes[0, 0]
        y_pos = range(len(titles))
        bars  = ax1.barh(y_pos, scores, color=bar_colors, edgecolor='black', linewidth=0.8)
        ax1.set_yticks(y_pos)
        ax1.set_yticklabels([t[:30] for t in titles], fontsize=10)
        ax1.set_xlim(0, 100)
        ax1.axvline(68, color='green',  linestyle='--', alpha=0.6, label='Bonne (68)')
        ax1.axvline(45, color='orange', linestyle='--', alpha=0.6, label='Moyenne (45)')
        for bar, score in zip(bars, scores):
            ax1.text(bar.get_width() + 1, bar.get_y() + bar.get_height() / 2,
                     f'{score:.1f}%', va='center', fontsize=9, fontweight='bold')
        ax1.set_title('Score de qualité par formation', fontweight='bold')
        ax1.set_xlabel('Score / 100')
        ax1.legend(loc='lower right', fontsize=8)

        # ── Panneau 2 : Pie du verdict global ──
        ax2 = axes[0, 1]
        n_good = sum(1 for s in scores if s >= 68)
        n_avg  = sum(1 for s in scores if 45 <= s < 68)
        n_bad  = sum(1 for s in scores if s < 45)
        sizes  = [n_good, n_avg, n_bad]
        labels = ['Bonnes', 'Moyennes', 'À améliorer']
        colors = ['#2ecc71', '#f39c12', '#e74c3c']
        non_zero = [(s, l, c) for s, l, c in zip(sizes, labels, colors) if s > 0]
        if non_zero:
            sizes_nz, labels_nz, colors_nz = zip(*non_zero)
            ax2.pie(sizes_nz, labels=labels_nz, autopct='%1.0f%%',
                    colors=colors_nz, startangle=90,
                    wedgeprops={'edgecolor': 'white', 'linewidth': 2})
        ax2.set_title('Répartition globale des verdicts', fontweight='bold')

        # ── Panneau 3 : Sentiment moyen par formation ──
        ax3 = axes[1, 0]
        sentiments = [v['avg_sentiment'] for v in training_quality.values()]
        s_colors   = ['#2ecc71' if s > 0.05 else '#e74c3c' if s < -0.05 else '#95a5a6'
                      for s in sentiments]
        ax3.bar(range(len(titles)), sentiments, color=s_colors, edgecolor='black', linewidth=0.8)
        ax3.set_xticks(range(len(titles)))
        ax3.set_xticklabels([t[:20] for t in titles], rotation=30, ha='right', fontsize=9)
        ax3.axhline(0, color='black', linewidth=1)
        ax3.axhline( 0.05, color='green',  linestyle=':', alpha=0.7, label='+0.05')
        ax3.axhline(-0.05, color='red',    linestyle=':', alpha=0.7, label='-0.05')
        ax3.set_title('Sentiment moyen par formation', fontweight='bold')
        ax3.set_ylabel('Score sentiment [-1 … +1]')
        ax3.legend(fontsize=8)

        # ── Panneau 4 : Tableau récapitulatif ──
        ax4 = axes[1, 1]
        ax4.axis('off')

        summary_lines = ["RÉSUMÉ DE LA QUALITÉ DES FORMATIONS\n"]
        for v in sorted(training_quality.values(), key=lambda x: x['score'], reverse=True):
            emoji_flag = "🟢" if v['score'] >= 68 else "🟡" if v['score'] >= 45 else "🔴"
            summary_lines.append(
                f"{emoji_flag}  {v['title'][:28]:<30}  {v['score']:5.1f}/100\n"
                f"    {v['verdict']}\n"
                f"    Conseil : {v['advice']}\n"
            )

        avg_global = np.mean(scores)
        summary_lines.append(
            f"\nScore moyen global : {avg_global:.1f}/100\n"
            f"🟢 Bonnes : {n_good}   🟡 Moyennes : {n_avg}   🔴 À améliorer : {n_bad}"
        )

        ax4.text(0.02, 0.98, '\n'.join(summary_lines),
                 transform=ax4.transAxes, fontsize=9,
                 verticalalignment='top', fontfamily='monospace',
                 bbox=dict(boxstyle='round', facecolor='#eaf4fb', alpha=0.8))
        ax4.set_title('Récapitulatif', fontweight='bold')

        plt.tight_layout()
        plt.savefig('formation_quality_chart.png', dpi=300, bbox_inches='tight')
        # plt.show()  # Désactivé pour ne pas afficher le graphique
        print("[OK] Graphique de qualité sauvegardé → 'formation_quality_chart.png'")

    def create_sentiment_analysis_chart(self):
        """Graphique dédié à l'analyse de sentiment"""
        if 'sentiment' not in self.ai.ai_results:
            print("[ATTENTION] Aucune donnée de sentiment disponible")
            return

        sentiment = self.ai.ai_results['sentiment']

        fig, axes = plt.subplots(1, 3, figsize=(18, 6))
        fig.suptitle('Analyse de Sentiment des Réponses', fontsize=14, fontweight='bold')

        # 1 - Répartition
        ax1 = axes[0]
        sd = sentiment['global']
        cmap = {'très positif': '#2ecc71', 'positif': '#82e0aa',
                'neutre': '#aab7b8', 'négatif': '#f1948a', 'très négatif': '#e74c3c'}
        colors = [cmap.get(k, '#3498db') for k in sd.keys()]
        ax1.pie(sd.values(), labels=sd.keys(), autopct='%1.1f%%', colors=colors, startangle=90)
        ax1.set_title('Répartition des sentiments', fontweight='bold')

        # 2 - Score par question
        ax2 = axes[1]
        bq = sentiment['by_question']
        if bq:
            qnames = [k[:30] + '…' if len(k) > 30 else k for k in bq.keys()]
            qscores = list(bq.values())
            q_colors = ['#2ecc71' if s > 0 else '#e74c3c' for s in qscores]
            ax2.barh(qnames, qscores, color=q_colors, edgecolor='black', linewidth=0.5)
            ax2.axvline(0, color='black', linewidth=1)
            ax2.set_title('Sentiment moyen par question', fontweight='bold')
            ax2.set_xlabel('Score [-1 … +1]')

        # 3 - Top 5 avis
        ax3 = axes[2]
        ax3.axis('off')
        pos_items = sentiment['top_positive'][:3]
        neg_items = sentiment['top_negative'][:3]
        text = "TOP AVIS POSITIFS\n" + "─"*35 + "\n"
        for item in pos_items:
            rv = str(item['response_value'])
            text += f"• {rv[:60]}{'…' if len(rv) > 60 else ''}\n"
        text += "\nTOP CRITIQUES\n" + "─"*35 + "\n"
        for item in neg_items:
            rv = str(item['response_value'])
            text += f"• {rv[:60]}{'…' if len(rv) > 60 else ''}\n"
        ax3.text(0.02, 0.98, text, transform=ax3.transAxes, fontsize=9,
                 verticalalignment='top',
                 bbox=dict(boxstyle='round', facecolor='#fdfefe', alpha=0.8))
        ax3.set_title('Verbatims représentatifs', fontweight='bold')

        plt.tight_layout()
        plt.savefig('sentiment_analysis_chart.png', dpi=300, bbox_inches='tight')
        # plt.show()  # Désactivé pour ne pas afficher le graphique
        print("[OK] Graphique de sentiment sauvegardé → 'sentiment_analysis_chart.png'")


# ==================== 6. GÉNÉRATION DE RAPPORT ====================

class ReportGenerator:
    """Génère un rapport HTML et un résumé Markdown"""

    def __init__(self, stats_analyzer, ai_analyzer):
        self.stats = stats_analyzer
        self.ai    = ai_analyzer

    def generate_html_report(self):
        df             = self.stats.df
        total_responses = len(df)
        total_users    = df['user_id'].nunique()
        total_trainings= df['training_id'].nunique()
        training_quality = self.stats.dp.training_quality

        html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport d'Analyse IA - Questionnaires</title>
    <style>
        body  {{ font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: auto; background: #fff;
                     padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,.1); }}
        h1   {{ color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
        h2   {{ color: #34495e; margin-top: 30px; }}
        .kpi-box {{ display: inline-block; background: linear-gradient(135deg,#3498db,#2980b9);
                    color: #fff; padding: 20px; margin: 10px; border-radius: 10px; min-width: 180px; }}
        .kpi-value {{ font-size: 36px; font-weight: bold; }}
        .kpi-label {{ font-size: 14px; opacity: .9; }}
        .good   {{ background: linear-gradient(135deg,#2ecc71,#27ae60) !important; }}
        .avg    {{ background: linear-gradient(135deg,#f39c12,#e67e22) !important; }}
        .bad    {{ background: linear-gradient(135deg,#e74c3c,#c0392b) !important; }}
        table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
        th    {{ background: #3498db; color: #fff; padding: 12px; }}
        td    {{ padding: 10px; border-bottom: 1px solid #ddd; }}
        tr:hover {{ background: #f5f5f5; }}
        .card {{ background: #f8f9fa; border-left: 4px solid #3498db;
                 padding: 15px; margin: 10px 0; border-radius: 4px; }}
        .card.green  {{ border-color: #2ecc71; }}
        .card.orange {{ border-color: #f39c12; }}
        .card.red    {{ border-color: #e74c3c; }}
        .footer {{ margin-top: 50px; text-align: center; color: #7f8c8d; font-size: 12px; }}
        .score-bar {{ background: #ecf0f1; border-radius: 10px; height: 20px; width: 100%; }}
        .score-fill {{ height: 20px; border-radius: 10px; }}
    </style>
</head>
<body>
<div class="container">
    <h1>📊 Rapport d'Analyse Intelligente des Questionnaires</h1>
    <p>Généré le {pd.Timestamp.now().strftime('%d/%m/%Y à %H:%M')}</p>

    <h2>📈 Indicateurs Clés</h2>
    <div class="kpi-box">
        <div class="kpi-value">{total_responses}</div>
        <div class="kpi-label">Réponses totales</div>
    </div>
    <div class="kpi-box">
        <div class="kpi-value">{total_users}</div>
        <div class="kpi-label">Participants</div>
    </div>
    <div class="kpi-box">
        <div class="kpi-value">{total_trainings}</div>
        <div class="kpi-label">Formations</div>
    </div>"""

        if 'nps' in self.stats.stats_results:
            nps = self.stats.stats_results['nps']
            cls = 'good' if nps['score'] >= 30 else ('avg' if nps['score'] >= 0 else 'bad')
            html += f"""
    <div class="kpi-box {cls}">
        <div class="kpi-value">{nps['score']}</div>
        <div class="kpi-label">NPS — {nps['quality']}</div>
    </div>"""

        # ── Section qualité des formations ──
        if training_quality:
            html += "<h2>🎯 Évaluation de la Qualité des Formations</h2>"
            html += "<table><tr><th>Formation</th><th>Score</th><th>Progression</th><th>Sentiment</th><th>Note num.</th><th>Verdict</th></tr>"

            for v in sorted(training_quality.values(), key=lambda x: x['score'], reverse=True):
                s = v['score']
                color = '#2ecc71' if s >= 68 else ('#f39c12' if s >= 45 else '#e74c3c')
                num_note = f"{v['numeric_avg']}/5" if v['numeric_avg'] else "N/A"
                html += f"""<tr>
    <td><strong>{v['title']}</strong></td>
    <td><strong>{s:.1f}/100</strong></td>
    <td>
        <div class="score-bar">
            <div class="score-fill" style="width:{s}%;background:{color};"></div>
        </div>
    </td>
    <td>{v['avg_sentiment']:+.3f}</td>
    <td>{num_note}</td>
    <td style="color:{color};font-weight:bold">{v['verdict']}</td>
</tr>"""
            html += "</table>"

        # ── Statistiques descriptives ──
        if 'descriptive' in self.stats.stats_results:
            html += "<h2>📐 Statistiques Descriptives</h2>"
            html += ("<table><tr><th>Question</th><th>Moyenne</th><th>Médiane</th>"
                     "<th>Écart-type</th><th>Min</th><th>Max</th></tr>")
            for question, row in self.stats.stats_results['descriptive'].head(10).iterrows():
                html += (f"<tr><td>{question[:100]}</td><td>{row['moyenne']}</td>"
                         f"<td>{row['médiane']}</td><td>{row['écart_type']}</td>"
                         f"<td>{row['min']}</td><td>{row['max']}</td></tr>")
            html += "</table>"

        html += "<h2>🤖 Analyses IA</h2>"

        if 'sentiment' in self.ai.ai_results:
            s = self.ai.ai_results['sentiment']
            html += f"""<div class="card">
    <h3>💬 Analyse de Sentiment</h3>
    <p>Score moyen : <strong>{s['average_score']}</strong></p>
    <p>Répartition : {s['global']}</p>
</div>"""

        if 'topics' in self.ai.ai_results:
            html += '<div class="card"><h3>📚 Thèmes Détectés</h3>'
            for theme, data in self.ai.ai_results['topics']['themes'].items():
                html += f"<p><strong>{theme} :</strong> {', '.join(data['mots'][:5])}</p>"
            html += '</div>'

        if 'anomalies' in self.ai.ai_results:
            a = self.ai.ai_results['anomalies']
            html += f"""<div class="card red">
    <h3>🚨 Détection d'Anomalies</h3>
    <p>{a['count']} utilisateurs atypiques ({a['percentage']}%)</p>
</div>"""

        if 'clusters' in self.ai.ai_results:
            c = self.ai.ai_results['clusters']
            html += f"""<div class="card">
    <h3>👥 Clustering Utilisateurs</h3>
    <p>{c['n_clusters']} profils types identifiés — Distribution : {c['size']}</p>
</div>"""

        # ── Recommandations ──
        html += "<h2>💡 Recommandations</h2><div class='card green'>"
        recs = []

        if 'nps' in self.stats.stats_results:
            ns = self.stats.stats_results['nps']['score']
            if   ns < 0:  recs.append("🔴 <strong>URGENT</strong> : NPS négatif — plan d'action immédiat requis")
            elif ns < 30: recs.append("🟡 <strong>À SURVEILLER</strong> : NPS dans la moyenne — améliorer la fidélisation")
            else:         recs.append("🟢 <strong>EXCELLENT</strong> : Bon NPS — capitaliser sur les points forts")

        if training_quality:
            bad = [v['title'] for v in training_quality.values() if v['score'] < 45]
            if bad:
                recs.append(f"🔴 Réviser les formations : {', '.join(bad)}")
            avg_f = [v['title'] for v in training_quality.values() if 45 <= v['score'] < 68]
            if avg_f:
                recs.append(f"🟡 Améliorer les formations : {', '.join(avg_f)}")

        if 'sentiment' in self.ai.ai_results:
            neg = (self.ai.ai_results['sentiment']['global'].get('négatif', 0) +
                   self.ai.ai_results['sentiment']['global'].get('très négatif', 0))
            if neg > 0:
                recs.append(f"💬 Analyser les {neg} commentaires négatifs en détail")

        if 'anomalies' in self.ai.ai_results and self.ai.ai_results['anomalies']['count'] > 0:
            recs.append(f"👤 Contacter les {self.ai.ai_results['anomalies']['count']} utilisateurs atypiques")

        if 'clusters' in self.ai.ai_results:
            recs.append(f"📊 Adapter les formations aux {self.ai.ai_results['clusters']['n_clusters']} profils identifiés")

        for r in recs[:6]:
            html += f"<p>{r}</p>"
        html += "</div>"

        html += """    <div class="footer">
        <p>Rapport généré automatiquement par le Système Intelligent d'Analyse de Questionnaires</p>
    </div>
</div>
</body>
</html>"""

        with open('rapport_analyse_postgresql.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("[OK] Rapport HTML sauvegardé → 'rapport_analyse_postgresql.html'")
        return html

    def generate_markdown_summary(self):
        df = self.stats.df
        training_quality = self.stats.dp.training_quality

        md = [
            "# Résumé Exécutif — Analyse des Questionnaires\n",
            f"Date : {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M')}\n",
            "## 📈 Indicateurs Clés\n",
            f"- **Participants** : {df['user_id'].nunique()}",
            f"- **Formations**   : {df['training_id'].nunique()}",
            f"- **Réponses**     : {len(df)}",
        ]

        if 'nps' in self.stats.stats_results:
            nps = self.stats.stats_results['nps']
            md.append(f"- **NPS** : {nps['score']} ({nps['quality']})")

        # Qualité des formations
        if training_quality:
            md.append("\n## 🎯 Qualité des Formations\n")
            for v in sorted(training_quality.values(), key=lambda x: x['score'], reverse=True):
                flag = "🟢" if v['score'] >= 68 else ("🟡" if v['score'] >= 45 else "🔴")
                md.append(f"- {flag} **{v['title']}** : {v['score']:.1f}/100 — {v['verdict']}")
                md.append(f"  - Conseil : {v['advice']}")

        if 'descriptive' in self.stats.stats_results:
            md.append("\n## 🏆 Points Forts\n")
            for q, row in self.stats.stats_results['descriptive'].nlargest(3, 'moyenne').iterrows():
                md.append(f"- **{q[:50]}** : {row['moyenne']}/5")

            md.append("\n## ⚠️ Points d'Amélioration\n")
            for q, row in self.stats.stats_results['descriptive'].nsmallest(3, 'moyenne').iterrows():
                md.append(f"- **{q[:50]}** : {row['moyenne']}/5")

        md.append("\n## 🤖 Insights IA\n")
        if 'sentiment' in self.ai.ai_results:
            s   = self.ai.ai_results['sentiment']
            pos = s['global'].get('positif', 0) + s['global'].get('très positif', 0)
            neg = s['global'].get('négatif', 0) + s['global'].get('très négatif', 0)
            tot = sum(s['global'].values())
            md.append(f"- **Sentiment** : {pos/tot*100:.1f}% positif, {neg/tot*100:.1f}% négatif")

        if 'topics' in self.ai.ai_results:
            md.append("- **Thèmes principaux** :")
            for theme, data in list(self.ai.ai_results['topics']['themes'].items())[:3]:
                md.append(f"  - {theme} : {', '.join(data['mots'][:3])}")

        if 'clusters' in self.ai.ai_results:
            md.append(f"- **Profils utilisateurs** : {self.ai.ai_results['clusters']['n_clusters']} groupes")

        md.append("\n## 💡 Recommandations Prioritaires\n")
        i = 1
        if training_quality:
            bad = [v['title'] for v in training_quality.values() if v['score'] < 45]
            if bad:
                md.append(f"{i}. **URGENT** : Réviser — {', '.join(bad)}")
                i += 1
        if 'nps' in self.stats.stats_results and self.stats.stats_results['nps']['score'] < 0:
            md.append(f"{i}. **Améliorer** l'expérience globale (NPS négatif)")
            i += 1
        if 'anomalies' in self.ai.ai_results and self.ai.ai_results['anomalies']['count'] > 0:
            md.append(f"{i}. **Contacter** les {self.ai.ai_results['anomalies']['count']} utilisateurs atypiques")

        with open('resume_analyse.md', 'w', encoding='utf-8') as f:
            f.write('\n'.join(md))
        print("[OK] Résumé Markdown sauvegardé → 'resume_analyse.md'")
        return md


# ==================== 7. PIPELINE PRINCIPAL ====================

class PostgreSQLAnalysisPipeline:
    """Orchestre l'ensemble du processus d'analyse"""

    def __init__(self, host, database, user, password, port=5432):
        self.connector      = PostgreSQLConnector(host, database, user, password, port)
        self.df             = None
        self.preprocessor   = None
        self.stats_analyzer = None
        self.ai_analyzer    = None
        self.visualizer     = None
        self.reporter       = None

    def run_complete_analysis(self):
        print("=" * 70)
        print("[SYSTEM] SYSTÈME INTELLIGENT D'ANALYSE DE QUESTIONNAIRES - PostgreSQL")
        print("=" * 70)

        # Étape 1 : Connexion
        print("\n[ETAPE 1] Connexion à PostgreSQL")
        if not self.connector.test_connection():
            print("[ERREUR] Connexion échouée. Arrêt.")
            return

        # Étape 2 : Extraction
        print("\n[ETAPE 2] Extraction des données")
        self.df = self.connector.extract_all_data()
        if self.df is None or self.df.empty:
            print("[ERREUR] Aucune donnée extraite. Arrêt.")
            return

        # Étape 3 : Prétraitement + évaluation qualité formations
        print("\n[ETAPE 3] Prétraitement & Évaluation des formations")
        self.preprocessor = DataPreprocessor(self.df)
        self.preprocessor.clean_data().create_pivot_table()

        # Étape 4 : Analyses statistiques
        print("\n[ETAPE 4] Analyses statistiques")
        self.stats_analyzer = StatisticalAnalyzer(self.preprocessor)
        self.stats_analyzer.descriptive_statistics()
        self.stats_analyzer.cross_analysis_by_role()
        self.stats_analyzer.temporal_analysis()
        self.stats_analyzer.calculate_nps()

        # Étape 5 : Analyses IA
        print("\n[ETAPE 5] Analyses IA avancées")
        self.ai_analyzer = AIAnalyzer(self.preprocessor)
        self.ai_analyzer.sentiment_analysis()
        self.ai_analyzer.topic_modeling(n_topics=3)
        self.ai_analyzer.anomaly_detection(contamination=0.1)
        self.ai_analyzer.user_clustering()

        # Étape 6 : Visualisations (désactivé)
        # print("\n[ETAPE 6] Génération des visualisations")
        # self.visualizer = Visualizer(self.stats_analyzer, self.ai_analyzer)
        # self.visualizer.create_dashboard()
        # self.visualizer.create_training_quality_chart()
        # self.visualizer.create_sentiment_analysis_chart()

        # Étape 7 : Rapports
        print("\n[ETAPE 7] Génération des rapports")
        self.reporter = ReportGenerator(self.stats_analyzer, self.ai_analyzer)
        self.reporter.generate_html_report()
        self.reporter.generate_markdown_summary()

        print("\n" + "=" * 70)
        print("[OK] ANALYSE TERMINÉE AVEC SUCCÈS!")
        print("=" * 70)
        print("\nFichiers générés :")
        # print("  📊 dashboard_mysql_analyse.png")
        # print("  🎯 formation_quality_chart.png")
        # print("  💬 sentiment_analysis_chart.png")
        print("  📄 rapport_analyse_postgresql.html")
        print("  📝 resume_analyse.md")

        return self


# ==================== 8. POINT D'ENTRÉE ====================

if __name__ == "__main__":
    POSTGRESQL_CONFIG = {
        'host':     'localhost',
        'database': 'marsa_eval',
        'user':     'postgres',
        'password': 'password',
        'port':     5432
    }

    print("[CONFIG] CONFIGURATION POSTGRESQL")
    for k, v in POSTGRESQL_CONFIG.items():
        if k != 'password':
            print(f"  {k}: {v}")

    pipeline = PostgreSQLAnalysisPipeline(**POSTGRESQL_CONFIG)

    try:
        results = pipeline.run_complete_analysis()

        if results:
            print("\n" + "=" * 70)
            print("[RAPPORT] APERÇU DES RÉSULTATS")
            print("=" * 70)

            # Résumé qualité formations
            tq = results.preprocessor.training_quality
            if tq:
                print("\n🎯 Qualité des formations :")
                for v in sorted(tq.values(), key=lambda x: x['score'], reverse=True):
                    flag = "🟢" if v['score'] >= 68 else ("🟡" if v['score'] >= 45 else "🔴")
                    print(f"  {flag} {v['title'][:40]:<40} {v['score']:5.1f}/100  {v['verdict']}")

            if 'nps' in results.stats_analyzer.stats_results:
                nps = results.stats_analyzer.stats_results['nps']
                print(f"\n  • NPS          : {nps['score']} ({nps['quality']})")
            if 'sentiment' in results.ai_analyzer.ai_results:
                print(f"  • Sentiment moy: {results.ai_analyzer.ai_results['sentiment']['average_score']}")
            if 'clusters' in results.ai_analyzer.ai_results:
                print(f"  • Profils      : {results.ai_analyzer.ai_results['clusters']['n_clusters']}")
            if 'anomalies' in results.ai_analyzer.ai_results:
                print(f"  • Anomalies    : {results.ai_analyzer.ai_results['anomalies']['count']} utilisateurs")

    except Exception as e:
        print(f"\n[ERREUR] {e}")
        import traceback
        traceback.print_exc()