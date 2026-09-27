from fastapi import APIRouter
from app.api.routes import auth, movies, ratings, watchlist, favorites, recommendations, users, admin, mlops

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(movies.router)
api_router.include_router(ratings.router)
api_router.include_router(watchlist.router)
api_router.include_router(favorites.router)
api_router.include_router(recommendations.router)
api_router.include_router(users.router)
api_router.include_router(admin.router)
api_router.include_router(mlops.router)
