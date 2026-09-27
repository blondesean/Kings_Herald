/* Question bank for the daily ranking round (see
 * commands/passive/rankingRound.js). It shares the subjective daily slot with
 * the would-you-rather round — see RANKED_SHARE in commands/passive/trivia.js.
 *
 * Each entry is { question, items }: a prompt that says which end of the list
 * is "first", and exactly five short items (button/list friendly, so keep them
 * under ~40 characters). There is no right answer; players are scored by how
 * closely their private ranking matches the group's average. All original,
 * written for this project. Keep the items close to evenly appealing so the
 * group's order isn't obvious in advance: pick the five best-known answers
 * (if two are near-equals, keep the more famous one), and spread them across
 * different types so the list is a real choice.
 */
const rankingQuestions = () => [
    { question: 'Rank these road-trip snacks, best to worst:', items: ['Salty chips', 'Gummy candy', 'Trail mix', 'Beef jerky', 'Fresh fruit'] },
    { question: 'Rank these superpowers, best to worst:', items: ['Flight', 'Invisibility', 'Super strength', 'Mind reading', 'Teleportation'] },
    { question: 'Rank these minor inconveniences, most annoying to least:', items: ['Wet socks', 'Slow wifi', 'A stubbed toe', 'Phone at 1% battery', 'A squeaky door'] },
    { question: 'Rank these pizza toppings, best to worst:', items: ['Pepperoni', 'Mushrooms', 'Sausage', 'Onions', 'Olives'] },
    { question: 'Rank these breakfast foods, best to worst:', items: ['Pancakes', 'Bacon and eggs', 'Cereal', 'A bagel', 'Waffles'] },
    { question: 'Rank these ice cream flavors, best to worst:', items: ['Vanilla', 'Chocolate', 'Strawberry', 'Mint chip', 'Cookie dough'] },
    { question: 'Rank these holidays, best to worst:', items: ['Halloween', 'Christmas', 'Thanksgiving', 'New Year\'s Eve', 'The Fourth of July'] },
    { question: 'Rank these ways to travel, best to worst:', items: ['Train', 'Plane', 'Car', 'Boat', 'Bicycle'] },
    { question: 'Rank these pets, best to worst:', items: ['Dog', 'Cat', 'Ants', 'Fish', 'Rabbit'] },
    { question: 'Rank these places to live, best to worst:', items: ['A cabin in the woods', 'A beach house', 'A penthouse in the city', 'A farm', 'A houseboat'] },
    { question: 'Rank these chores, most hated to least:', items: ['Dishes', 'Laundry', 'Vacuuming', 'Taking out the trash', 'Cleaning the bathroom'] },
    { question: 'Rank these game night picks, best to worst:', items: ['Charades', 'Trivia', 'Card games', 'Video games', 'Board games'] },
    { question: 'Rank these pasta shapes, best to worst:', items: ['Spaghetti', 'Penne', 'Fettuccine', 'Rigatoni', 'Macaroni'] },
    { question: 'Rank these times of day, best to worst:', items: ['Early morning', 'Mid-morning', 'Afternoon', 'Evening', 'Late night'] },
    { question: 'Rank these drinks, best to worst:', items: ['Coffee', 'Tea', 'Soda', 'Lemonade', 'Hot chocolate'] },
    { question: 'Rank these movie genres, best to worst:', items: ['Comedy', 'Action', 'Horror', 'Sci-fi', 'Romance'] },
    { question: 'Rank these kinds of weather, best to worst:', items: ['Sunny', 'Snowy', 'Rainy', 'Foggy', 'Windy'] },
    { question: 'Rank these side dishes, best to worst:', items: ['Fries', 'Mashed potatoes', 'Coleslaw', 'Rice', 'A side salad'] },
    { question: 'Rank these sports, best to worst:', items: ['Basketball', 'Soccer', 'Football', 'Tennis', 'Formula 1'] },
    { question: 'Rank these instruments to be great at, best to worst:', items: ['Guitar', 'Piano', 'Drums', 'Violin', 'Saxophone'] },
    { question: 'Rank these things to find in your pocket, best to worst:', items: ['A $20 bill', 'A forgotten gift card', 'A candy bar', 'Your missing earbuds', 'A note from a friend'] },
    { question: 'Rank these ways to spend a free Saturday, best to worst:', items: ['Sleeping in', 'Hiking', 'Gaming', 'Trying a new restaurant', 'Binge-watching a show'] },
    { question: 'Rank these mythical pets, best to worst:', items: ['A dragon', 'A unicorn', 'A phoenix', 'A griffin', 'A baby kraken'] },
    { question: 'Rank these annoying sounds, most annoying to least:', items: ['Nails on a chalkboard', 'A dripping faucet', 'Loud chewing', 'A car alarm', 'A buzzing fly'] },
    { question: 'Rank these fruits, best to worst:', items: ['Mango', 'Strawberry', 'Apple', 'Grapes', 'Pineapple'] },
    { question: 'Rank these Pokemon, best to worst:', items: ['Charizard', 'Pikachu', 'Gengar', 'Eevee', 'Mewtwo'] },
    { question: 'Rank these fast food chains, best to worst:', items: ["McDonald's", 'Chick-fil-A', 'Taco Bell', 'Subway', "Domino's"] },
    { question: 'Rank these types of cuisine, best to worst:', items: ['Italian', 'Mexican', 'Japanese', 'Indian', 'Chinese'] },
    { question: 'Rank these animes, best to worst:', items: ['Naruto', 'Dragon Ball Z', 'Death Note', 'Attack on Titan', 'Cowboy Bebop'] },
    { question: 'Rank these video games, best to worst:', items: ['Minecraft', 'Breath of the Wild', 'Elden Ring', 'Grand Theft Auto V', 'Portal 2'] },
    { question: 'Rank these TV shows, best to worst:', items: ['Breaking Bad', 'The Office', 'Game of Thrones', 'Stranger Things', 'Avatar: The Last Airbender'] },
    { question: 'Rank these documentaries, best to worst:', items: ['Planet Earth', 'Free Solo', 'The Social Dilemma', 'Tiger King', 'Super Size Me'] },
    { question: 'Rank these movies, best to worst:', items: ['The Godfather', 'The Dark Knight', 'Inception', 'Forrest Gump', 'Star Wars: A New Hope'] },
    { question: 'Rank these code editors and IDEs, best to worst:', items: ['VS Code', 'Vim', 'IntelliJ IDEA', 'Visual Studio', 'Notepad'] },
    { question: 'Rank these car brands, coolest to least cool:', items: ['Ferrari', 'Porsche', 'Tesla', 'Ford', 'Jeep'] },
    { question: 'Rank these Marvel heroes, coolest to least cool:', items: ['Spider-Man', 'Iron Man', 'Thor', 'Black Panther', 'Deadpool'] },
    { question: 'Rank these soft drinks, best to worst:', items: ['Coca-Cola', 'Dr Pepper', 'Mountain Dew', 'Sprite', 'Root beer'] },
    { question: 'Rank these desserts, best to worst:', items: ['Cheesecake', 'Chocolate chip cookies', 'Ice cream', 'Apple pie', 'Donuts'] },
    { question: 'Rank these Nintendo 64 games, best to worst:', items: ['Ocarina of Time', 'Super Mario 64', 'GoldenEye 007', 'Super Smash Bros.', 'Mario Kart 64'] },
    { question: 'Rank these Minecraft mobs, coolest to least cool:', items: ['Creeper', 'Enderman', 'Warden', 'Axolotl', 'Ender Dragon'] },
    { question: 'Rank these World of Warcraft characters, best to worst:', items: ['Arthas', 'Illidan', 'Thrall', 'Sylvanas', 'Jaina'] },
    { question: 'Rank these classic video games, best to worst:', items: ['Pac-Man', 'Tetris', 'Super Mario Bros.', 'Street Fighter II', 'Space Invaders'] },
    { question: 'Rank these shoe brands, most comfortable to least:', items: ['Nike', 'New Balance', 'Hoka', 'Crocs', 'Birkenstock'] },
    { question: 'Rank these programming languages, best to worst:', items: ['Python', 'JavaScript', 'Java', 'C++', 'Rust'] },
    { question: 'Rank these US cities, best to worst:', items: ['New York City', 'Chicago', 'Los Angeles', 'New Orleans', 'Seattle'] },
];

module.exports = rankingQuestions;
