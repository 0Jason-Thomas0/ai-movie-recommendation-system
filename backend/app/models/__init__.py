from app.core.database import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.movie import Movie, Genre, movie_genres  # noqa: F401
from app.models.rating import Rating  # noqa: F401
from app.models.watchlist import WatchlistItem  # noqa: F401
from app.models.favorite import Favorite  # noqa: F401
from app.models.recommendation import Recommendation, RecommendationItem  # noqa: F401
from app.models.notification import Notification  # noqa: F401
