/* Seasonal Halloween trivia bank for the Herald's daily trivia
 * (commands/passive/trivia.js). Only ever drawn from during the Halloween
 * season — see SEASONAL_CHANCE_BY_MONTH in trivia.js (a 33% chance per round
 * in September, guaranteed in October, never otherwise).
 *
 * Each entry is { question, options: { A, B, C, D }, correct }, same shape as
 * the main bank (flavor_text/triviaQuestions.js).
 *
 * The first 45 entries are sourced verbatim from a single external Halloween
 * trivia set; their correct-answer letters happen to land close enough to an
 * even A/B/C/D split (9/14/14/8) that they were left as-is rather than
 * reshuffled.
 *
 * The rest are horror/paranormal trivia hand-picked from a larger
 * user-supplied list, fact-checked one by one, and kept only if both
 * accurate and non-trivial. Several from that same list were left out:
 * "Which 1973 film features Reverend Kane?" (Reverend Kane is a Poltergeist
 * II character — that film released in 1986, not 1973, so the question
 * contradicts its own premise), "Transylvania... where is this region
 * located?" (near-duplicate of the existing "Transylvania is commonly
 * associated with Dracula" question above), "What is the traditional name
 * for a vampire-hunting stake's most famous target?" (too subjective/vague
 * to have one unambiguous correct answer), and several that were accurate
 * but too easy for common knowledge (Medusa, Nessie, "Nightmare Before
 * Christmas" holiday, jack-o'-lanterns being pumpkins in North America — the
 * last of which would also sit oddly next to the existing "originally made
 * from turnips" question above). These later entries' options were shuffled
 * (unlike the first 45) to keep a deliberately even A/B/C/D split.
 */
const halloweenTriviaQuestions = () => [
    {
        question: 'What phobia do you suffer from if you have an intense fear of Halloween?',
        options: { A: 'Hallowphobia', B: 'Ghostphobia', C: 'Shamanphobia', D: 'Samhainophobia' },
        correct: 'D',
    },
    {
        question: 'What does the name Dracula mean?',
        options: { A: 'Blood drinker', B: 'Vampire Bat', C: "Devil's son", D: 'Evil one' },
        correct: 'C',
    },
    {
        question: 'In Medieval times, what was commonly used as a cure for leprosy?',
        options: { A: 'an apple', B: 'a spider', C: 'a pumpkin', D: 'a broom bristle' },
        correct: 'B',
    },
    {
        question: 'What U.S. city banned all Halloween celebrations from its schools in 1995?',
        options: { A: 'Salt Lake City, Utah', B: 'Los Altos, California', C: 'Philadelphia, Pennsylvania', D: 'Santa Fe, New Mexico' },
        correct: 'B',
    },
    {
        question: 'What year did the Halloween novelty song "Monster Mash" reach number one on the Billboard charts?',
        options: { A: 'never', B: '1962', C: '1967', D: '1965' },
        correct: 'B',
    },
    {
        question: "Jack O'Lanterns were originally made from what?",
        options: { A: 'turnips', B: 'pumpkins', C: 'cherries', D: 'celery' },
        correct: 'A',
    },
    {
        question: 'Playing with the Ouija Board is particularly popular during Halloween as contact with the afterlife is believed by some to be more likely. Which corporation currently markets the modern Ouija Board?',
        options: { A: 'Mayfair Games', B: 'Hasbro', C: 'Mattel', D: 'Milton Bradley' },
        correct: 'B',
    },
    {
        question: 'Who wrote the classic horror novel It (1986)?',
        options: { A: 'Anne Rice', B: 'Clive Barker', C: 'Stephen King', D: 'Judy Blume' },
        correct: 'C',
    },
    {
        question: "What is the name of Gomez and Morticia's mustachioed baby in the Addams Family Values (1993)?",
        options: { A: 'Puglsey', B: 'Pubert', C: 'Plutarch', D: 'Pluto' },
        correct: 'B',
    },
    {
        question: 'Who plays Beetlejuice in the 1988 film?',
        options: { A: 'Jim Carrey', B: 'Jeff Goldblum', C: 'Michael Keaton', D: 'Tom Hanks' },
        correct: 'C',
    },
    {
        question: 'Where does the Ghostbusters (1984) trio find their first ghost?',
        options: { A: 'The Empire State Building', B: 'The Metropolitan Museum of Art', C: 'Rockefeller Center', D: 'New York Public Library' },
        correct: 'D',
    },
    {
        question: 'Which US state produces the most pumpkins?',
        options: { A: 'Illinois', B: 'North Carolina', C: 'California', D: 'Virginia' },
        correct: 'A',
    },
    {
        question: 'What is the most disliked Halloween candy in America?',
        options: { A: 'Black licorice', B: 'Candy Corn', C: 'Tootsie Rolls', D: 'Smarties' },
        correct: 'B',
    },
    {
        question: 'Where does the biggest Halloween parade in the US take place?',
        options: { A: 'New York', B: 'Miami', C: 'Chicago', D: 'Atlanta' },
        correct: 'A',
    },
    {
        question: 'Transylvania is commonly associated with Dracula. Where is this region located?',
        options: { A: 'Scotland', B: 'Romania', C: 'Bulgaria', D: 'Austria' },
        correct: 'B',
    },
    {
        question: 'In Mean Girls, what does Cady dress up as for Halloween?',
        options: { A: 'A clown', B: 'A zombie', C: 'A bloody bride', D: 'A cowgirl' },
        correct: 'C',
    },
    {
        question: 'Who is the top scarer in Monsters Inc. (2001)?',
        options: { A: 'Sulley', B: 'Randall', C: 'Joe', D: 'Mike' },
        correct: 'A',
    },
    {
        question: 'What is a collection of witches called?',
        options: { A: 'Cavern', B: 'Coven', C: 'Cauldron', D: 'Parliament' },
        correct: 'B',
    },
    {
        question: 'What vegetable was once thought to have supernatural powers on Halloween?',
        options: { A: 'Cabbage', B: 'Squash', C: 'Egg Plant', D: 'Onion' },
        correct: 'A',
    },
    {
        question: "What percentage of Americans pretend they're not home on Halloween?",
        options: { A: '33%', B: '52%', C: '15%', D: '21%' },
        correct: 'D',
    },
    {
        question: "Which movie tops Rotten Tomatoes' list of the Scariest Horror Movies Ever?",
        options: { A: 'The Exorcist', B: 'It', C: 'Halloween', D: 'Pet Sematary' },
        correct: 'A',
    },
    {
        question: 'Which first lady was the first to decorate the White House for Halloween?',
        options: { A: 'Abigail Smith Adams', B: 'Anna Eleanor Roosevelt', C: 'Patricia Nixon', D: 'Mamie Eisenhower' },
        correct: 'D',
    },
    {
        question: 'Which U.S. president told a group of schoolkids that the White House was haunted by the ghost of Abraham Lincoln?',
        options: { A: 'Donald Trump', B: 'Bill Clinton', C: 'George H.W. Bush', D: 'Ronald Reagan' },
        correct: 'C',
    },
    {
        question: 'Where were the most famous scenes in the movie "Hocus Pocus" filmed?',
        options: { A: 'Portland, ME', B: 'Walpole, VT', C: 'Salem, MA', D: 'Hartford, CT' },
        correct: 'C',
    },
    {
        question: "What's the most popular adult Halloween candy?",
        options: { A: "Reese's Peanut Butter Cups", B: 'Milky Way', C: 'Snickers', D: "M&M's" },
        correct: 'D',
    },
    {
        question: 'What percentage of people planned to celebrate Halloween in 2022?',
        options: { A: '55%', B: '63%', C: '69%', D: '70%' },
        correct: 'C',
    },
    {
        question: 'How much money were consumers expected to spend on Halloween decorations in 2022?',
        options: { A: '1.7 Billion', B: '2.2 Billion', C: '3.4 Billion', D: '4.6 Billion' },
        correct: 'C',
    },
    {
        question: 'How much candy does the average American consume each year?',
        options: { A: '5 pounds', B: '6 pounds', C: '7 pounds', D: '8 pounds' },
        correct: 'D',
    },
    {
        question: 'On average, what percentage of Americans carve a pumpkin for Halloween?',
        options: { A: '30%', B: '45%', C: '50%', D: '55%' },
        correct: 'B',
    },
    {
        question: "What's the most popular kids' Halloween candy?",
        options: { A: "Reese's Peanut Butter Cups", B: 'Snickers', C: 'Butter Finger', D: 'Bubble Gum' },
        correct: 'A',
    },
    {
        question: 'What historic weather event occurred on Halloween in 1991?',
        options: { A: 'Halloween Avalanche', B: 'Halloween Blizzard', C: 'Halloween Flood', D: 'Halloween Wild Fire' },
        correct: 'B',
    },
    {
        question: "What's the top grossing horror movie of all time?",
        options: { A: 'The Blair Witch Project', B: 'The Exorcist', C: 'It', D: 'Halloween' },
        correct: 'C',
    },
    {
        question: 'What was the original working title of the movie "Beetlejuice"?',
        options: { A: 'Hidden Attic', B: 'Afterlife', C: 'Scared You', D: 'House Ghosts' },
        correct: 'D',
    },
    {
        question: 'What classic horror film is based on a true story?',
        options: { A: 'Poltergeist', B: 'Halloween', C: 'The Amityville Horror', D: 'Blair Witch Project' },
        correct: 'C',
    },
    {
        question: 'If you want to keep spirits out of your home on Halloween, what should you sprinkle on your doorstep?',
        options: { A: 'Holy Water', B: 'Sage', C: 'Salt', D: 'Garlic' },
        correct: 'C',
    },
    {
        question: 'From base to point, what is the order of colors on a piece of candy corn?',
        options: { A: 'White, Orange, Yellow', B: 'Yellow, Orange, White', C: 'Orange, Yellow, White', D: 'Orange, White, Yellow' },
        correct: 'B',
    },
    {
        question: "In It's the Great Pumpkin, Charlie Brown, who does Linus mistake for the Great Pumpkin?",
        options: { A: 'Charlie Brown', B: 'Pigpen', C: 'Lucy', D: 'Snoopy' },
        correct: 'D',
    },
    {
        question: 'How many colors of M&Ms are there in a normal bag?',
        options: { A: '8', B: '6', C: '7', D: '5' },
        correct: 'B',
    },
    {
        question: 'What does it mean if you see a blue pumpkin while trick-or-treating?',
        options: { A: 'Allergy-free treats', B: 'Support for veterans', C: 'Papa Smurf lives there', D: 'No Trick-Or-Treating' },
        correct: 'A',
    },
    {
        question: 'What Halloween costume does E.T. wear?',
        options: { A: 'Ghost', B: 'Pumpkin', C: 'Cowboy', D: 'Stormtrooper' },
        correct: 'A',
    },
    {
        question: 'What was the first individually wrapped penny candy in America?',
        options: { A: 'Laffy Taffy', B: 'Mary Janes', C: 'Tootsie Rolls', D: 'Smarties' },
        correct: 'C',
    },
    {
        question: 'What is trick-or-treating called in Mexico?',
        options: { A: 'Basurero', B: 'Vispera De Todos Los Santos', C: 'Calaverita', D: 'Caza De Monstruos' },
        correct: 'C',
    },
    {
        question: 'In The Nightmare Before Christmas, what character discovers a portal from "Halloween Town" to "Christmas Town"?',
        options: { A: 'Oogie Boogie', B: 'Coraline', C: 'Jack Skellington', D: 'Victor Van Dort' },
        correct: 'C',
    },
    {
        question: 'Which ailment did people believe could be cured by pumpkins?',
        options: { A: 'Poison Ivy', B: 'Freckles', C: 'Bee Sting', D: 'Blindness' },
        correct: 'B',
    },
    {
        question: 'What Michael Jackson song was adapted by An American Werewolf In London director John Landis into a highly successful Halloween-themed music video?',
        options: { A: 'Werewolves of London', B: 'Thriller', C: 'Black Magic Woman', D: "Somebody's Watching Me" },
        correct: 'B',
    },
    {
        question: "Which author wrote the novel *The Haunting of Hill House*?",
        options: { A: "Shirley Jackson", B: "Susan Hill", C: "Anne Rice", D: "Daphne du Maurier" },
        correct: 'A',
    },
    {
        question: "What is the name of the demon in *The Exorcist* who possesses Regan?",
        options: { A: "Abaddon", B: "Pazuzu", C: "Aamon", D: "Valak" },
        correct: 'B',
    },
    {
        question: "In *Halloween* (1978), what is Michael Myers's institutional psychiatrist called?",
        options: { A: "Dr. Lawrence Gordon", B: "Dr. Peter Venkman", C: "Dr. Sam Loomis", D: "Dr. Alan Grant" },
        correct: 'C',
    },
    {
        question: "What is a banshee traditionally associated with?",
        options: { A: "A possessed animal", B: "A haunted forest", C: "A cursed treasure", D: "A death omen" },
        correct: 'D',
    },
    {
        question: "Which ancient Celtic festival is commonly associated with the origins of Halloween?",
        options: { A: "Samhain", B: "Beltane", C: "Imbolc", D: "Lughnasadh" },
        correct: 'A',
    },
    {
        question: "What term describes a place supposedly haunted because of a traumatic or violent event repeatedly re-enacted as an apparition?",
        options: { A: "Poltergeist activity", B: "Residual haunting", C: "Demonic infestation", D: "Intelligent haunting" },
        correct: 'B',
    },
    {
        question: "Which horror film centers on a videotape said to cause the viewer's death seven days later?",
        options: { A: "Pulse", B: "Sinister", C: "The Ring", D: "The Grudge" },
        correct: 'C',
    },
    {
        question: "Which director made *The Shining* (1980)?",
        options: { A: "John Carpenter", B: "Roman Polanski", C: "Wes Craven", D: "Stanley Kubrick" },
        correct: 'D',
    },
    {
        question: "In *The Conjuring*, the Perron family farmhouse is located in which U.S. state?",
        options: { A: "Rhode Island", B: "Massachusetts", C: "Maine", D: "Connecticut" },
        correct: 'A',
    },
    {
        question: "What paranormal phenomenon is characterized in folklore by objects moving or being thrown seemingly without physical cause?",
        options: { A: "Precognition", B: "Poltergeist activity", C: "Clairvoyance", D: "Dowsing" },
        correct: 'B',
    },
    {
        question: "Which Edgar Allan Poe story features a narrator obsessed with the sound of a beating heart?",
        options: { A: "The Masque of the Red Death", B: "The Pit and the Pendulum", C: "The Tell-Tale Heart", D: "The Black Cat" },
        correct: 'C',
    },
    {
        question: "What is the name of the cursed videotape's ghost in the Japanese film *Ringu*?",
        options: { A: "Hideo Nakata", B: "Tomie Kawakami", C: "Kayako Saeki", D: "Sadako Yamamura" },
        correct: 'D',
    },
];

module.exports = halloweenTriviaQuestions;
