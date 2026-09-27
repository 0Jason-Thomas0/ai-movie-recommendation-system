"""
Standalone Model Training Script.
Run this script to train the recommendation model on existing ratings data.

Usage:
    cd backend
    python scripts/train_model.py

Prerequisites:
    - Database must be running and seeded
    - At least 50 ratings in the database
    - .env file configured
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.mlops.pipeline import RetrainingPipeline


def main():
    print("=" * 60)
    print("  CineAI Recommendation Model Training Script")
    print("=" * 60)

    db = SessionLocal()
    try:
        from app.models.rating import Rating
        from sqlalchemy import func
        rating_count = db.query(func.count(Rating.id)).scalar() or 0
        print(f"\nFound {rating_count} ratings in database.")

        if rating_count < 10:
            print("\n⚠️  Warning: Less than 10 ratings found.")
            print("   The model will still train but accuracy may be very low.")
            print("   Add more ratings for better recommendations.")
            response = input("\nContinue anyway? (y/N): ").strip().lower()
            if response != "y":
                print("Training cancelled.")
                return

        print("\nStarting training pipeline...")
        pipeline = RetrainingPipeline(db)
        pipeline.run()
        print("\n✅ Training complete! Model saved to ./models/")
        print("   You can now start the API and get recommendations.")

    except KeyboardInterrupt:
        print("\n\nTraining interrupted by user.")
    except Exception as e:
        print(f"\n❌ Training failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
