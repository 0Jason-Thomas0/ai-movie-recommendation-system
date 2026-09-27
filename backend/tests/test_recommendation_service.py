import os
import tempfile
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.ml.hybrid import HybridRecommender


@pytest.fixture(scope="module")
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def cleanup_model_dir():
    temp_dir = tempfile.mkdtemp()
    original_model_dir = os.environ.get("MODEL_DIR")
    os.environ["MODEL_DIR"] = temp_dir
    yield
    if original_model_dir is None:
        os.environ.pop("MODEL_DIR", None)
    else:
        os.environ["MODEL_DIR"] = original_model_dir


def test_hybrid_recommender_adjusts_weights():
    model = {"cf": None, "cb": None, "cf_weight": 0.6, "cb_weight": 0.4}
    recommender = HybridRecommender(model)

    recommender.adjust_weights_by_rating_count(2)
    assert recommender.cf_weight == 0.0
    assert recommender.cb_weight == 1.0

    recommender.adjust_weights_by_rating_count(10)
    assert recommender.cf_weight == 0.3
    assert recommender.cb_weight == 0.7

    recommender.adjust_weights_by_rating_count(30)
    assert recommender.cf_weight == 0.5
    assert recommender.cb_weight == 0.5

    recommender.adjust_weights_by_rating_count(100)
    assert recommender.cf_weight == 0.7
    assert recommender.cb_weight == 0.3
