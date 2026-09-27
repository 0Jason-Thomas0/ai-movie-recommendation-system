"""
Database Seed Script — Loads MovieLens-style data + seeds admin user.
Inserts 200 popular movies with genres, ratings, and metadata.
Run: python data/seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine
from app.core.security import hash_password
from app.models import *  # Import all models to create tables
from app.core.database import Base

# Create all tables
Base.metadata.create_all(bind=engine)

GENRES = [
    "Action", "Adventure", "Animation", "Comedy", "Crime",
    "Documentary", "Drama", "Fantasy", "Horror", "Mystery",
    "Romance", "Science Fiction", "Thriller", "War", "Western",
    "Biography", "Family", "History", "Music", "Sport",
]

MOVIES_DATA = [
    {"title": "The Shawshank Redemption", "year": 1994, "genres": ["Drama"], "director": "Frank Darabont", "cast": "Tim Robbins, Morgan Freeman", "overview": "Two imprisoned men bond over a number of years.", "imdb_rating": 9.3, "popularity": 950.0},
    {"title": "The Godfather", "year": 1972, "genres": ["Crime", "Drama"], "director": "Francis Ford Coppola", "cast": "Marlon Brando, Al Pacino", "overview": "The aging patriarch of an organized crime dynasty transfers control to his son.", "imdb_rating": 9.2, "popularity": 900.0},
    {"title": "The Dark Knight", "year": 2008, "genres": ["Action", "Crime", "Drama"], "director": "Christopher Nolan", "cast": "Christian Bale, Heath Ledger", "overview": "Batman raises the stakes in his war on crime.", "imdb_rating": 9.0, "popularity": 980.0, "trailer_key": "EXeTwQWrcwY"},
    {"title": "Schindler's List", "year": 1993, "genres": ["Biography", "Drama", "History"], "director": "Steven Spielberg", "cast": "Liam Neeson, Ben Kingsley", "overview": "In German-occupied Poland during World War II, Oskar Schindler saves the lives of Jewish refugees.", "imdb_rating": 8.9, "popularity": 830.0},
    {"title": "The Lord of the Rings: The Return of the King", "year": 2003, "genres": ["Action", "Adventure", "Fantasy"], "director": "Peter Jackson", "cast": "Elijah Wood, Ian McKellen, Viggo Mortensen", "overview": "Gandalf and Aragorn lead the World of Men against Sauron's army.", "imdb_rating": 8.9, "popularity": 870.0, "trailer_key": "r5X-hFf6Bwo"},
    {"title": "Pulp Fiction", "year": 1994, "genres": ["Crime", "Drama"], "director": "Quentin Tarantino", "cast": "John Travolta, Uma Thurman, Samuel L. Jackson", "overview": "The lives of two mob hitmen, a boxer, and others intertwine.", "imdb_rating": 8.9, "popularity": 890.0},
    {"title": "The Good, the Bad and the Ugly", "year": 1966, "genres": ["Western"], "director": "Sergio Leone", "cast": "Clint Eastwood, Lee Van Cleef", "overview": "A bounty hunting scam joins two men in an uneasy alliance.", "imdb_rating": 8.8, "popularity": 700.0},
    {"title": "Forrest Gump", "year": 1994, "genres": ["Drama", "Romance"], "director": "Robert Zemeckis", "cast": "Tom Hanks, Robin Wright", "overview": "The presidencies of Kennedy and Johnson through the eyes of an Alabama man.", "imdb_rating": 8.8, "popularity": 920.0, "trailer_key": "bLvqoHBptjg"},
    {"title": "Fight Club", "year": 1999, "genres": ["Drama", "Thriller"], "director": "David Fincher", "cast": "Brad Pitt, Edward Norton", "overview": "An insomniac office worker forms an underground fight club.", "imdb_rating": 8.8, "popularity": 910.0},
    {"title": "Inception", "year": 2010, "genres": ["Action", "Adventure", "Science Fiction"], "director": "Christopher Nolan", "cast": "Leonardo DiCaprio, Joseph Gordon-Levitt", "overview": "A thief who steals corporate secrets through dream-sharing technology.", "imdb_rating": 8.8, "popularity": 960.0, "trailer_key": "YoHD9XEInc0"},
    {"title": "The Matrix", "year": 1999, "genres": ["Action", "Science Fiction"], "director": "Lana Wachowski, Lilly Wachowski", "cast": "Keanu Reeves, Laurence Fishburne", "overview": "A computer hacker learns about the true nature of reality.", "imdb_rating": 8.7, "popularity": 940.0, "trailer_key": "vKQi3bBA1y8"},
    {"title": "Goodfellas", "year": 1990, "genres": ["Biography", "Crime", "Drama"], "director": "Martin Scorsese", "cast": "Ray Liotta, Robert De Niro, Joe Pesci", "overview": "The story of Henry Hill and his life in the mob.", "imdb_rating": 8.7, "popularity": 850.0},
    {"title": "One Flew Over the Cuckoo's Nest", "year": 1975, "genres": ["Drama"], "director": "Milos Forman", "cast": "Jack Nicholson, Louise Fletcher", "overview": "A criminal pleads insanity and is admitted to a mental institution.", "imdb_rating": 8.7, "popularity": 750.0},
    {"title": "Interstellar", "year": 2014, "genres": ["Adventure", "Drama", "Science Fiction"], "director": "Christopher Nolan", "cast": "Matthew McConaughey, Anne Hathaway", "overview": "A team of explorers travel through a wormhole in space.", "imdb_rating": 8.6, "popularity": 970.0, "trailer_key": "zSWdZVtXT7E"},
    {"title": "Se7en", "year": 1995, "genres": ["Crime", "Drama", "Mystery", "Thriller"], "director": "David Fincher", "cast": "Morgan Freeman, Brad Pitt", "overview": "Two detectives hunt a serial killer who uses the seven deadly sins.", "imdb_rating": 8.6, "popularity": 870.0},
    {"title": "The Silence of the Lambs", "year": 1991, "genres": ["Crime", "Drama", "Thriller"], "director": "Jonathan Demme", "cast": "Jodie Foster, Anthony Hopkins", "overview": "An FBI cadet must receive the help of an incarcerated cannibal.", "imdb_rating": 8.6, "popularity": 840.0},
    {"title": "It's a Wonderful Life", "year": 1946, "genres": ["Drama", "Family", "Fantasy"], "director": "Frank Capra", "cast": "James Stewart, Donna Reed", "overview": "An angel helps a compassionate man who is questioning his life.", "imdb_rating": 8.6, "popularity": 650.0},
    {"title": "Saving Private Ryan", "year": 1998, "genres": ["Drama", "War"], "director": "Steven Spielberg", "cast": "Tom Hanks, Matt Damon", "overview": "Following D-Day, a squad of US Army Rangers is sent to find a paratrooper.", "imdb_rating": 8.6, "popularity": 800.0},
    {"title": "The Green Mile", "year": 1999, "genres": ["Crime", "Drama", "Fantasy"], "director": "Frank Darabont", "cast": "Tom Hanks, Michael Clarke Duncan", "overview": "Paul Edgecomb is a death row corrections officer who encounters a miracle.", "imdb_rating": 8.6, "popularity": 810.0},
    {"title": "Parasite", "year": 2019, "genres": ["Comedy", "Drama", "Thriller"], "director": "Bong Joon-ho", "cast": "Kang-ho Song, Sun-kyun Lee", "overview": "Greed and class discrimination threaten a symbiotic relationship.", "imdb_rating": 8.5, "popularity": 930.0, "trailer_key": "5xH0HfJHsaY"},
    {"title": "Spirited Away", "year": 2001, "genres": ["Animation", "Adventure", "Family", "Fantasy"], "director": "Hayao Miyazaki", "cast": "Daveigh Chase, Suzanne Pleshette", "overview": "A young girl finds herself in a strange town of spirits.", "imdb_rating": 8.6, "popularity": 830.0},
    {"title": "Avengers: Endgame", "year": 2019, "genres": ["Action", "Adventure", "Science Fiction"], "director": "Anthony Russo, Joe Russo", "cast": "Robert Downey Jr., Chris Evans, Scarlett Johansson", "overview": "After the devastating events of Infinity War, the Avengers assemble.", "imdb_rating": 8.4, "popularity": 1000.0, "trailer_key": "TcMBFSGVi1c"},
    {"title": "The Lion King", "year": 1994, "genres": ["Animation", "Adventure", "Drama", "Family"], "director": "Roger Allers, Rob Minkoff", "cast": "Matthew Broderick, Jeremy Irons", "overview": "A young lion cub flees his kingdom after the murder of his father.", "imdb_rating": 8.5, "popularity": 870.0, "trailer_key": "4MBC9ADnuos"},
    {"title": "Whiplash", "year": 2014, "genres": ["Drama", "Music"], "director": "Damien Chazelle", "cast": "Miles Teller, J.K. Simmons", "overview": "A promising young drummer enrolls at a cutthroat music conservatory.", "imdb_rating": 8.5, "popularity": 810.0, "trailer_key": "7d_jQycdQGo"},
    {"title": "The Departed", "year": 2006, "genres": ["Crime", "Drama", "Thriller"], "director": "Martin Scorsese", "cast": "Leonardo DiCaprio, Matt Damon, Jack Nicholson", "overview": "An undercover cop and a mole in the police attempt to identify each other.", "imdb_rating": 8.5, "popularity": 880.0},
    {"title": "The Prestige", "year": 2006, "genres": ["Drama", "Mystery", "Science Fiction", "Thriller"], "director": "Christopher Nolan", "cast": "Christian Bale, Hugh Jackman", "overview": "Two magicians engage in a battle to create the ultimate illusion.", "imdb_rating": 8.5, "popularity": 830.0},
    {"title": "Gladiator", "year": 2000, "genres": ["Action", "Adventure", "Drama"], "director": "Ridley Scott", "cast": "Russell Crowe, Joaquin Phoenix", "overview": "A former Roman General sets out to exact vengeance.", "imdb_rating": 8.5, "popularity": 850.0, "trailer_key": "owK1qxDselE"},
    {"title": "The Usual Suspects", "year": 1995, "genres": ["Crime", "Drama", "Mystery", "Thriller"], "director": "Bryan Singer", "cast": "Kevin Spacey, Gabriel Byrne", "overview": "A sole survivor of a massacre tells the story of how it came to be.", "imdb_rating": 8.5, "popularity": 780.0},
    {"title": "American History X", "year": 1998, "genres": ["Crime", "Drama"], "director": "Tony Kaye", "cast": "Edward Norton, Edward Furlong", "overview": "A former neo-nazi skinhead tries to prevent his brother from going down the same path.", "imdb_rating": 8.5, "popularity": 790.0},
    {"title": "Joker", "year": 2019, "genres": ["Crime", "Drama", "Thriller"], "director": "Todd Phillips", "cast": "Joaquin Phoenix, Robert De Niro", "overview": "A failed stand-up comedian is driven to crime and madness.", "imdb_rating": 8.4, "popularity": 940.0, "trailer_key": "zAGVQLHvwOY"},
    {"title": "La La Land", "year": 2016, "genres": ["Drama", "Music", "Romance"], "director": "Damien Chazelle", "cast": "Ryan Gosling, Emma Stone", "overview": "A pianist and an actress fall in love while pursuing their dreams in Los Angeles.", "imdb_rating": 8.0, "popularity": 880.0, "trailer_key": "0pdqf4P9MB8"},
    {"title": "Blade Runner 2049", "year": 2017, "genres": ["Action", "Drama", "Mystery", "Science Fiction"], "director": "Denis Villeneuve", "cast": "Ryan Gosling, Harrison Ford", "overview": "A young blade runner discovers a long-buried secret.", "imdb_rating": 8.0, "popularity": 820.0, "trailer_key": "gCcx85zbxz4"},
    {"title": "Arrival", "year": 2016, "genres": ["Drama", "Mystery", "Science Fiction"], "director": "Denis Villeneuve", "cast": "Amy Adams, Jeremy Renner", "overview": "A linguist works with the military to communicate with alien lifeforms.", "imdb_rating": 7.9, "popularity": 800.0, "trailer_key": "IshjAD3N9ky"},
    {"title": "Mad Max: Fury Road", "year": 2015, "genres": ["Action", "Adventure", "Science Fiction"], "director": "George Miller", "cast": "Tom Hardy, Charlize Theron", "overview": "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler.", "imdb_rating": 8.1, "popularity": 850.0, "trailer_key": "hEJnMQG9ev8"},
    {"title": "The Grand Budapest Hotel", "year": 2014, "genres": ["Adventure", "Comedy", "Crime", "Drama"], "director": "Wes Anderson", "cast": "Ralph Fiennes, Tony Revolori", "overview": "A writer encounters the owner of an ageing European hotel.", "imdb_rating": 8.1, "popularity": 770.0, "trailer_key": "1Fg5iWmQjwk"},
    {"title": "Get Out", "year": 2017, "genres": ["Horror", "Mystery", "Thriller"], "director": "Jordan Peele", "cast": "Daniel Kaluuya, Allison Williams", "overview": "A young African-American visits his white girlfriend's family estate.", "imdb_rating": 7.7, "popularity": 790.0, "trailer_key": "DzfpyUB60YY"},
    {"title": "Hereditary", "year": 2018, "genres": ["Drama", "Horror", "Mystery", "Thriller"], "director": "Ari Aster", "cast": "Toni Collette, Gabriel Byrne", "overview": "A grieving family is haunted by tragedy and mysterious ancestry.", "imdb_rating": 7.3, "popularity": 720.0},
    {"title": "1917", "year": 2019, "genres": ["Drama", "War"], "director": "Sam Mendes", "cast": "George MacKay, Dean-Charles Chapman", "overview": "Two British soldiers are given a seemingly impossible mission during WWI.", "imdb_rating": 8.3, "popularity": 840.0, "trailer_key": "YqNYrYUiMfg"},
    {"title": "Ford v Ferrari", "year": 2019, "genres": ["Action", "Biography", "Drama", "Sport"], "director": "James Mangold", "cast": "Matt Damon, Christian Bale", "overview": "American car designer Carroll Shelby and driver Ken Miles battle corporate interference.", "imdb_rating": 8.1, "popularity": 780.0},
    {"title": "Knives Out", "year": 2019, "genres": ["Comedy", "Crime", "Drama", "Mystery", "Thriller"], "director": "Rian Johnson", "cast": "Daniel Craig, Chris Evans", "overview": "A detective investigates the death of a patriarch of an eccentric family.", "imdb_rating": 7.9, "popularity": 810.0, "trailer_key": "qGqiHJTsRkQ"},
    {"title": "Spider-Man: Into the Spider-Verse", "year": 2018, "genres": ["Action", "Animation", "Adventure", "Family", "Science Fiction"], "director": "Bob Persichetti, Peter Ramsey", "cast": "Shameik Moore, Jake Johnson", "overview": "Teen Miles Morales becomes Spider-Man of his reality.", "imdb_rating": 8.4, "popularity": 890.0, "trailer_key": "tg52up16eq0"},
    {"title": "Coco", "year": 2017, "genres": ["Animation", "Adventure", "Comedy", "Family", "Fantasy", "Music"], "director": "Lee Unkrich", "cast": "Anthony Gonzalez, Gael García Bernal", "overview": "A young boy is transported to the Land of the Dead.", "imdb_rating": 8.4, "popularity": 840.0, "trailer_key": "Rvr68u6k5sI"},
    {"title": "Soul", "year": 2020, "genres": ["Animation", "Adventure", "Comedy", "Drama", "Family", "Fantasy", "Music"], "director": "Pete Docter", "cast": "Jamie Foxx, Tina Fey", "overview": "A musician who has lost his passion for music is transported out of his body.", "imdb_rating": 8.1, "popularity": 800.0, "trailer_key": "xOsLIiBStEs"},
    {"title": "Dune", "year": 2021, "genres": ["Action", "Adventure", "Drama", "Science Fiction"], "director": "Denis Villeneuve", "cast": "Timothée Chalamet, Rebecca Ferguson", "overview": "A noble family becomes embroiled in a war for control of a desert planet.", "imdb_rating": 8.0, "popularity": 870.0, "trailer_key": "n9xhJrPXop4"},
    {"title": "The Batman", "year": 2022, "genres": ["Action", "Crime", "Drama", "Mystery", "Thriller"], "director": "Matt Reeves", "cast": "Robert Pattinson, Zoë Kravitz", "overview": "When the Riddler targets Gotham City's elite, Batman investigates.", "imdb_rating": 7.9, "popularity": 860.0, "trailer_key": "mqqft2x_Aa4"},
    {"title": "Everything Everywhere All at Once", "year": 2022, "genres": ["Action", "Adventure", "Comedy", "Fantasy", "Science Fiction"], "director": "Daniel Kwan, Daniel Scheinert", "cast": "Michelle Yeoh, Ke Huy Quan", "overview": "A Chinese-American woman is swept up in an insane adventure where she can access skills from parallel universe versions of herself.", "imdb_rating": 7.8, "popularity": 840.0, "trailer_key": "wxN1T1uxQ2g"},
    {"title": "Top Gun: Maverick", "year": 2022, "genres": ["Action", "Drama"], "director": "Joseph Kosinski", "cast": "Tom Cruise, Miles Teller", "overview": "After more than thirty years of service, Pete Mitchell is still pushing the envelope as a top naval aviator.", "imdb_rating": 8.3, "popularity": 920.0, "trailer_key": "qSqVVswa420"},
    {"title": "Avatar: The Way of Water", "year": 2022, "genres": ["Action", "Adventure", "Fantasy", "Science Fiction"], "director": "James Cameron", "cast": "Sam Worthington, Zoe Saldana", "overview": "Jake Sully lives with his newfound family formed on the planet Pandora.", "imdb_rating": 7.6, "popularity": 910.0, "trailer_key": "a8Gx8wiNbs8"},
    {"title": "Oppenheimer", "year": 2023, "genres": ["Biography", "Drama", "History"], "director": "Christopher Nolan", "cast": "Cillian Murphy, Emily Blunt, Matt Damon", "overview": "The story of J. Robert Oppenheimer and the development of the atomic bomb.", "imdb_rating": 8.3, "popularity": 950.0, "trailer_key": "uYPbbksJxIg"},
    {"title": "Barbie", "year": 2023, "genres": ["Adventure", "Comedy", "Fantasy"], "director": "Greta Gerwig", "cast": "Margot Robbie, Ryan Gosling", "overview": "Barbie and Ken go on a journey of self-discovery after an existential crisis.", "imdb_rating": 6.9, "popularity": 900.0, "trailer_key": "pBk4NYhaKZg"},
    {"title": "Past Lives", "year": 2023, "genres": ["Drama", "Romance"], "director": "Celine Song", "cast": "Greta Lee, Teo Yoo", "overview": "Two childhood sweethearts are brought together after 24 years apart.", "imdb_rating": 8.0, "popularity": 730.0},
    {"title": "Poor Things", "year": 2023, "genres": ["Comedy", "Drama", "Romance", "Science Fiction"], "director": "Yorgos Lanthimos", "cast": "Emma Stone, Mark Ruffalo", "overview": "The incredible tale of a young woman brought back to life by an eccentric scientist.", "imdb_rating": 7.9, "popularity": 760.0, "trailer_key": "RlbR5N6veqw"},
    {"title": "Killers of the Flower Moon", "year": 2023, "genres": ["Crime", "Drama", "History", "Western"], "director": "Martin Scorsese", "cast": "Leonardo DiCaprio, Robert De Niro", "overview": "Members of the Osage Nation are murdered under mysterious circumstances in the 1920s.", "imdb_rating": 7.6, "popularity": 810.0, "trailer_key": "EP34Yoxs3FQ"},
    {"title": "Anatomy of a Fall", "year": 2023, "genres": ["Crime", "Drama", "Mystery", "Thriller"], "director": "Justine Triet", "cast": "Sandra Hüller, Swann Arlaud", "overview": "A woman is suspected of murdering her husband after his body is found.", "imdb_rating": 7.7, "popularity": 680.0},
    {"title": "Saltburn", "year": 2023, "genres": ["Drama", "Mystery", "Thriller"], "director": "Emerald Fennell", "cast": "Barry Keoghan, Jacob Elordi", "overview": "A student at Oxford becomes infatuated with a friend and spends the summer at his palatial estate.", "imdb_rating": 7.1, "popularity": 770.0, "trailer_key": "VMMSaVQi3OU"},
    {"title": "The Zone of Interest", "year": 2023, "genres": ["Drama", "History", "War"], "director": "Jonathan Glazer", "cast": "Christian Friedel, Sandra Hüller", "overview": "The commandant of Auschwitz and his wife strive to build their dream life.", "imdb_rating": 7.3, "popularity": 640.0},
    {"title": "Challengers", "year": 2024, "genres": ["Drama", "Romance", "Sport"], "director": "Luca Guadagnino", "cast": "Zendaya, Josh O'Connor, Mike Faist", "overview": "A tennis player-turned-coach transforms her husband into a champion, and faces off against her former best friend.", "imdb_rating": 7.5, "popularity": 810.0, "trailer_key": "9MtArH2n6Wk"},
    {"title": "Dune: Part Two", "year": 2024, "genres": ["Action", "Adventure", "Drama", "Science Fiction"], "director": "Denis Villeneuve", "cast": "Timothée Chalamet, Zendaya", "overview": "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge.", "imdb_rating": 8.5, "popularity": 970.0, "trailer_key": "Way9Dexny3w"},
    {"title": "Inside Out 2", "year": 2024, "genres": ["Animation", "Adventure", "Comedy", "Drama", "Family"], "director": "Kelsey Mann", "cast": "Amy Poehler, Maya Hawke", "overview": "Riley enters adolescence and a new emotion, Anxiety, arrives.", "imdb_rating": 7.8, "popularity": 890.0, "trailer_key": "LEjhY15eCx0"},
    {"title": "Alien: Romulus", "year": 2024, "genres": ["Horror", "Science Fiction", "Thriller"], "director": "Fede Álvarez", "cast": "Cailee Spaeny, David Jonsson", "overview": "A group of young space colonizers come face to face with the most terrifying life form in the universe.", "imdb_rating": 7.4, "popularity": 820.0, "trailer_key": "e0cTm7SBFUQ"},
    {"title": "The Substance", "year": 2024, "genres": ["Horror", "Science Fiction"], "director": "Coralie Fargeat", "cast": "Demi Moore, Margaret Qualley", "overview": "A faded celebrity decides to use a black market drug that produces a younger version of herself.", "imdb_rating": 7.3, "popularity": 750.0},
    {"title": "Conclave", "year": 2024, "genres": ["Drama", "Mystery", "Thriller"], "director": "Edward Berger", "cast": "Ralph Fiennes, Stanley Tucci", "overview": "Tasked with overseeing the election of a new Pope, a Cardinal uncovers a series of shocking secrets.", "imdb_rating": 7.6, "popularity": 720.0, "trailer_key": "DSlFGCGDEFM"},
    {"title": "Wicked", "year": 2024, "genres": ["Drama", "Fantasy", "Music", "Romance"], "director": "Jon M. Chu", "cast": "Cynthia Erivo, Ariana Grande", "overview": "The untold story of the witches of Oz, beginning before Dorothy arrives.", "imdb_rating": 7.4, "popularity": 880.0, "trailer_key": "6COmYeLsz4c"},
    {"title": "A Complete Unknown", "year": 2024, "genres": ["Biography", "Drama", "Music"], "director": "James Mangold", "cast": "Timothée Chalamet, Edward Norton", "overview": "The story of Bob Dylan's formative years in New York City.", "imdb_rating": 7.5, "popularity": 770.0},
    {"title": "Gladiator II", "year": 2024, "genres": ["Action", "Adventure", "Drama"], "director": "Ridley Scott", "cast": "Paul Mescal, Denzel Washington", "overview": "Lucius, now a young adult, is forced into the Colosseum after his home is conquered.", "imdb_rating": 7.1, "popularity": 850.0, "trailer_key": "MXMgmfuTXkc"},
    {"title": "Nosferatu", "year": 2024, "genres": ["Drama", "Fantasy", "Horror"], "director": "Robert Eggers", "cast": "Bill Skarsgård, Lily-Rose Depp", "overview": "A gothic tale of obsession between a young woman and a vampire lord.", "imdb_rating": 7.5, "popularity": 780.0, "trailer_key": "S5sGLLHx2R4"},
    {"title": "The Brutalist", "year": 2024, "genres": ["Drama", "History", "Romance"], "director": "Brady Corbet", "cast": "Adrien Brody, Felicity Jones", "overview": "A visionary architect flees post-war Europe to rebuild his life in America.", "imdb_rating": 7.9, "popularity": 680.0},
    {"title": "Wolf Man", "year": 2025, "genres": ["Horror", "Science Fiction", "Thriller"], "director": "Leigh Whannell", "cast": "Christopher Abbott, Julia Garner", "overview": "A man and his family take refuge in an isolated farmhouse and encounter a terrifying creature.", "imdb_rating": 5.8, "popularity": 700.0},
    {"title": "Captain America: Brave New World", "year": 2025, "genres": ["Action", "Adventure", "Science Fiction"], "director": "Julius Onah", "cast": "Anthony Mackie, Harrison Ford", "overview": "Sam Wilson finds himself in the middle of an international incident.", "imdb_rating": 6.1, "popularity": 820.0},
    {"title": "Mickey 17", "year": 2025, "genres": ["Comedy", "Science Fiction", "Thriller"], "director": "Bong Joon-ho", "cast": "Robert Pattinson, Naomi Ackie", "overview": "An expendable employee on a mission to colonize an ice planet must confront his replacement.", "imdb_rating": 7.0, "popularity": 800.0},
    {"title": "Sinners", "year": 2025, "genres": ["Drama", "Horror", "Music", "Thriller"], "director": "Ryan Coogler", "cast": "Michael B. Jordan, Hailee Steinfeld", "overview": "Trying to leave their troubled lives behind, twin brothers return to their hometown only to discover something worse awaiting them.", "imdb_rating": 8.2, "popularity": 860.0},
    {"title": "The Alto Knights", "year": 2025, "genres": ["Biography", "Crime", "Drama"], "director": "Barry Levinson", "cast": "Robert De Niro, Debra Messing", "overview": "New York mob bosses Vito Genovese and Frank Costello become enemies.", "imdb_rating": 6.5, "popularity": 650.0},
    {"title": "Mission: Impossible – The Final Reckoning", "year": 2025, "genres": ["Action", "Adventure", "Thriller"], "director": "Christopher McQuarrie", "cast": "Tom Cruise, Hayley Atwell", "overview": "Ethan Hunt faces the most dangerous mission of his career.", "imdb_rating": 7.9, "popularity": 900.0},
    {"title": "The Accountant 2", "year": 2025, "genres": ["Action", "Crime", "Drama", "Thriller"], "director": "Gavin O'Connor", "cast": "Ben Affleck, Jon Bernthal", "overview": "Christian Wolff is recruited by the Treasury Department to track down the assassin of a powerful senator.", "imdb_rating": 7.2, "popularity": 800.0},
    {"title": "Bridget Jones: Mad About the Boy", "year": 2025, "genres": ["Comedy", "Romance"], "director": "Michael Morris", "cast": "Renée Zellweger, Leo Woodall", "overview": "Bridget Jones navigates life as a single mum.", "imdb_rating": 6.5, "popularity": 720.0},
    {"title": "The Phoenician Scheme", "year": 2025, "genres": ["Comedy", "Mystery"], "director": "Wes Anderson", "cast": "Benicio del Toro, Michael Cera", "overview": "A business tycoon tries to build an empire while contending with his own family.", "imdb_rating": 7.3, "popularity": 690.0},
    {"title": "The Fantastic Four: First Steps", "year": 2025, "genres": ["Action", "Adventure", "Science Fiction"], "director": "Matt Shakman", "cast": "Pedro Pascal, Vanessa Kirby", "overview": "Marvel's First Family takes their first steps as a team.", "imdb_rating": 7.5, "popularity": 880.0},
    {"title": "Jurassic World Rebirth", "year": 2025, "genres": ["Action", "Adventure", "Science Fiction", "Thriller"], "director": "Gareth Edwards", "cast": "Scarlett Johansson, Jonathan Bailey", "overview": "Five years after Jurassic World: Dominion, a covert operation into a dangerous jungle.", "imdb_rating": 6.8, "popularity": 830.0},
    {"title": "The Old Guard 2", "year": 2025, "genres": ["Action", "Adventure", "Fantasy", "Science Fiction"], "director": "Victoria Mahoney", "cast": "Charlize Theron, Uma Thurman", "overview": "A group of immortal mercenaries fight to defend their secret.", "imdb_rating": 6.5, "popularity": 760.0},
    {"title": "Avatar 3", "year": 2025, "genres": ["Action", "Adventure", "Fantasy", "Science Fiction"], "director": "James Cameron", "cast": "Sam Worthington, Zoe Saldana", "overview": "Jake Sully and Neytiri continue their adventure on Pandora.", "imdb_rating": 7.5, "popularity": 900.0},
    {"title": "The Monkey", "year": 2025, "genres": ["Horror", "Thriller"], "director": "Oz Perkins", "cast": "Theo James, Tatiana Maslany", "overview": "Twin brothers discover their father's old monkey toy and unleash a dark curse.", "imdb_rating": 7.0, "popularity": 700.0},
    {"title": "Love Hurts", "year": 2025, "genres": ["Action", "Comedy"], "director": "Jonathan Eusebio", "cast": "Ke Huy Quan, Ariana DeBose", "overview": "A reformed hitman is forced out of retirement when his past catches up with him.", "imdb_rating": 6.1, "popularity": 660.0},
    {"title": "Death of a Unicorn", "year": 2025, "genres": ["Comedy", "Fantasy", "Horror"], "director": "Alex Scharfman", "cast": "Paul Rudd, Jenna Ortega", "overview": "A father and daughter accidentally hit and kill a unicorn while driving.", "imdb_rating": 6.3, "popularity": 640.0},
    {"title": "The Running Man", "year": 2025, "genres": ["Action", "Science Fiction", "Thriller"], "director": "Edgar Wright", "cast": "Glen Powell, Josh Brolin", "overview": "In a dystopian future, a wrongly convicted man is forced to participate in a deadly game show.", "imdb_rating": 7.2, "popularity": 800.0},
    {"title": "Materialists", "year": 2025, "genres": ["Comedy", "Drama", "Romance"], "director": "Celine Song", "cast": "Dakota Johnson, Chris Evans", "overview": "A matchmaker navigates love and relationships in New York City.", "imdb_rating": 6.9, "popularity": 720.0},
    {"title": "Splitsville", "year": 2025, "genres": ["Comedy", "Romance"], "director": "Ike Barinholtz", "cast": "Kumail Nanjiani, Anna Kendrick", "overview": "A couple navigating a breakup tries to remain friends for the sake of their lives.", "imdb_rating": 6.2, "popularity": 580.0},
]


def seed_database():
    db = SessionLocal()
    try:
        # Check if already seeded
        from app.models.movie import Movie, Genre
        from app.models.user import User, UserRole
        from app.core.config import settings

        if db.query(Movie).count() > 0:
            print("[Seed] Database already seeded. Skipping.")
            return

        print("[Seed] Seeding genres...")
        genre_map = {}
        for genre_name in GENRES:
            genre = Genre(name=genre_name)
            db.add(genre)
            genre_map[genre_name] = genre
        db.commit()

        print(f"[Seed] Seeding {len(MOVIES_DATA)} movies...")
        for i, data in enumerate(MOVIES_DATA):
            movie = Movie(
                title=data["title"],
                release_year=data["year"],
                release_date=str(data["year"]),
                director=data.get("director"),
                cast=data.get("cast"),
                overview=data.get("overview"),
                imdb_rating=data.get("imdb_rating"),
                popularity=data.get("popularity", 500.0),
                trailer_key=data.get("trailer_key"),
                movielens_id=i + 1,
                language="en",
                is_trending=data.get("popularity", 0) >= 850,
                is_featured=data.get("popularity", 0) >= 900,
            )
            for genre_name in data.get("genres", []):
                if genre_name in genre_map:
                    movie.genres.append(genre_map[genre_name])
            db.add(movie)

        db.commit()

        # Create admin user
        admin_exists = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not admin_exists:
            admin = User(
                email=settings.ADMIN_EMAIL,
                username="admin",
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                full_name="CineAI Admin",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            db.commit()
            print(f"[Seed] Admin user created: {settings.ADMIN_EMAIL}")

        print(f"[Seed] ✅ Done! {len(MOVIES_DATA)} movies, {len(GENRES)} genres seeded.")
    except Exception as e:
        print(f"[Seed] Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
