/* Trivia bank for the Herald's daily trivia (commands/passive/trivia.js).
 *
 * Each entry is { question, options: { A, B, C, D } }, `correct` being one of
 * 'A' | 'B' | 'C' | 'D'. General-knowledge trivia (geography, science,
 * history) sourced from two places, both reshuffled into a roughly even
 * A/B/C/D spread regardless of how the source presented them — see the note
 * in flavor_text/triviaFlavor.js's sibling banks for why that balance
 * matters (players farming a fixed "always pick D" pattern):
 *
 *   - The first 33 questions are from quizado.com's "Most Challenging Trivia
 *     Questions of All Time" list — question text and all four answer
 *     options verbatim from that source. On the source page the correct
 *     answer was listed last (option 4) in 24 of these 33, which is what
 *     prompted the reshuffle in the first place.
 *
 *   - The next 28 are from mentimeter.com's trivia-questions blog post,
 *     which only supplies 3 options per question — the 4th (always a wrong
 *     answer, invented to fit the same theme/category as the real 3) was
 *     added by hand. Only that post's questions that actually had 3 listed
 *     options were used; a large majority of the post's other "trivia" is
 *     single-answer with no options, not multiple choice, and was skipped
 *     entirely. Two more were dropped outright: one had only 2 options and
 *     no marked correct answer (which city tea was invented in), and one was
 *     factually wrong regardless of which option you'd pick (claimed 2002
 *     Olympics answer was "Sydney", which actually hosted the 2000 Summer
 *     Games — the 2002 Games were the Salt Lake City Winter Games, not among
 *     the options offered).
 *
 *   - The rest are hard general-knowledge trivia hand-picked from a larger
 *     user-supplied list of 50, fact-checked one by one and kept only if
 *     both accurate and non-trivial. Four from that list were left out: the
 *     Bhutan-capital and "shortest day" planet questions duplicated ones
 *     already above; the Peace of Westphalia question offered "Eighty Years'
 *     War" as a wrong answer even though that treaty also ended that war
 *     (real ambiguity, not just a distractor); and the "word that's its own
 *     opposite" question offered "contronym" and "auto-antonym" as if only
 *     one were correct when they're synonyms for the same thing.
 *
 * Unlike an earlier version of this bank, these aren't restricted to
 * post-2000 works/events or split into a nerd/general-knowledge half — it's
 * straight trivia-night material instead.
 *
 * Keep each question single-answer and unambiguous: no "which of these are
 * also true" traps, since credit depends on clicking exactly one button.
 */
const triviaQuestions = () => [
    {
        question: "Who was the first person to swim the English Channel?",
        options: { A: "Matthew Webb", B: "Michael Phelps", C: "Robert Matthew", D: "John Davis" },
        correct: 'A',
    },
    {
        question: "What is the rarest blood type in the world?",
        options: { A: "A-positive", B: "AB-negative", C: "B-negative", D: "O-negative" },
        correct: 'B',
    },
    {
        question: "In what year was the first computer mouse patented?",
        options: { A: "1975", B: "1960", C: "1967", D: "1980" },
        correct: 'C',
    },
    {
        question: "Who wrote the first computer program?",
        options: { A: "Alan Turing", B: "Grace Hopper", C: "Charles Babbage", D: "Ada Lovelace" },
        correct: 'D',
    },
    {
        question: "What is the capital of Mongolia?",
        options: { A: "Ulaanbaatar", B: "Bishkek", C: "Almaty", D: "Tashkent" },
        correct: 'A',
    },
    {
        question: "What is the heaviest element on the periodic table?",
        options: { A: "Uranium", B: "Oganesson", C: "Plutonium", D: "Radium" },
        correct: 'B',
    },
    {
        question: "What is the smallest country in the world?",
        options: { A: "Monaco", B: "San Marino", C: "Vatican City", D: "Liechtenstein" },
        correct: 'C',
    },
    {
        question: "What is the capital of Australia?",
        options: { A: "Brisbane", B: "Melbourne", C: "Sydney", D: "Canberra" },
        correct: 'D',
    },
    {
        question: "What is the smallest bone in the human body?",
        options: { A: "Stapes", B: "Malleus", C: "Incus", D: "Metacarpal" },
        correct: 'A',
    },
    {
        question: "What is the coldest planet in the solar system?",
        options: { A: "Uranus", B: "Neptune", C: "Saturn", D: "Pluto" },
        correct: 'B',
    },
    {
        question: "What is the hottest planet in the solar system?",
        options: { A: "Jupiter", B: "Mars", C: "Venus", D: "Mercury" },
        correct: 'C',
    },
    {
        question: "What is the largest country in Asia?",
        options: { A: "Kazakhstan", B: "India", C: "China", D: "Russia" },
        correct: 'D',
    },
    {
        question: "What is the national animal of Scotland?",
        options: { A: "Unicorn", B: "Thistle", C: "Lion", D: "Eagle" },
        correct: 'A',
    },
    {
        question: "What is the most common blood type?",
        options: { A: "AB positive", B: "O positive", C: "B negative", D: "A positive" },
        correct: 'B',
    },
    {
        question: "What is the rarest naturally occurring element on Earth?",
        options: { A: "Iridium", B: "Gold", C: "Astatine", D: "Plutonium" },
        correct: 'C',
    },
    {
        question: "What is Bhutan's capital city?",
        options: { A: "Dhaka", B: "Lhasa", C: "Kathmandu", D: "Thimphu" },
        correct: 'D',
    },
    {
        question: "What is the only country in the world with a flag with a unique shape and not a rectangular or square design?",
        options: { A: "Nepal", B: "Japan", C: "Brazil", D: "Switzerland" },
        correct: 'A',
    },
    {
        question: "Which planet in our solar system has the shortest day?",
        options: { A: "Earth", B: "Jupiter", C: "Venus", D: "Mars" },
        correct: 'B',
    },
    {
        question: "Who was the last Byzantine Emperor, and when did the Byzantine Empire fall?",
        options: { A: "Justinian I, 565 AD", B: "Michael VIII Palaiologos, 1261 AD", C: "Constantine XI Palaiologos, 1453 AD", D: "Alexios IV Angelos, 1204 AD" },
        correct: 'C',
    },
    {
        question: "What is the official language of Burundi, an African country?",
        options: { A: "Swahili", B: "French", C: "Arabic", D: "Kirundi" },
        correct: 'D',
    },
    {
        question: "Which historical figure is credited with inventing the first practical telephone?",
        options: { A: "Alexander Graham Bell", B: "Thomas Edison", C: "Guglielmo Marconi", D: "Nikola Tesla" },
        correct: 'A',
    },
    {
        question: "Which ancient civilization is credited with creating the first known writing system?",
        options: { A: "Romans", B: "Sumerians", C: "Egyptians", D: "Greeks" },
        correct: 'B',
    },
    {
        question: "What chemical element is named after the Scandinavian region?",
        options: { A: "Copper", B: "Zinc", C: "Scandium", D: "Iron" },
        correct: 'C',
    },
    {
        question: "What is the name of the longest river in Europe?",
        options: { A: "Seine", B: "Thames", C: "Danube", D: "Volga" },
        correct: 'D',
    },
    {
        question: "Which element has the highest atomic number that naturally occurs on Earth?",
        options: { A: "Uranium", B: "Oganesson", C: "Plutonium", D: "Neon" },
        correct: 'A',
    },
    {
        question: "What is the only U.S. state that does not have a sales tax?",
        options: { A: "California", B: "Alaska", C: "New York", D: "Texas" },
        correct: 'B',
    },
    {
        question: "Which sea is known as the 'Dead Sea' due to its high salinity?",
        options: { A: "Red Sea", B: "Caspian Sea", C: "Dead Sea", D: "Mediterranean Sea" },
        correct: 'C',
    },
    {
        question: "What unique feature does the pangolin have that is different from other mammals?",
        options: { A: "Horns", B: "Fur", C: "Feathers", D: "Scales" },
        correct: 'D',
    },
    {
        question: "Which famous physicist developed the theory of quantum mechanics?",
        options: { A: "Max Planck", B: "Albert Einstein", C: "Isaac Newton", D: "James Clerk Maxwell" },
        correct: 'A',
    },
    {
        question: "What is the term for a fear of heights?",
        options: { A: "Claustrophobia", B: "Acrophobia", C: "Aerophobia", D: "Nyctophobia" },
        correct: 'B',
    },
    {
        question: "What is the chemical symbol for the element with the atomic number 79?",
        options: { A: "Ag", B: "Pt", C: "Au", D: "Pb" },
        correct: 'C',
    },
    {
        question: "Which Greek philosopher is known for his method of questioning as a form of teaching?",
        options: { A: "Plato", B: "Epicurus", C: "Aristotle", D: "Socrates" },
        correct: 'D',
    },
    {
        question: "Which country has the longest coastline in the world?",
        options: { A: "Canada", B: "Russia", C: "Australia", D: "United States" },
        correct: 'A',
    },
    {
        question: "Who sang the title song for the latest Bond film, No Time to Die?",
        options: { A: "Billie Eilish", B: "Dua Lipa", C: "Sam Smith", D: "Adele" },
        correct: 'A',
    },
    {
        question: "Which flies a green, white, and orange (in that order) tricolor flag?",
        options: { A: "India", B: "Ireland", C: "Ivory Coast", D: "Italy" },
        correct: 'B',
    },
    {
        question: "What company makes the Xperia model of smartphone?",
        options: { A: "Samsung", B: "LG", C: "Sony", D: "Nokia" },
        correct: 'C',
    },
    {
        question: "Which city is home to the Brandenburg Gate?",
        options: { A: "Munich", B: "Zurich", C: "Vienna", D: "Berlin" },
        correct: 'D',
    },
    {
        question: "Which of the following is NOT a fruit?",
        options: { A: "Rhubarb", B: "Tomatoes", C: "Avocados", D: "Cucumbers" },
        correct: 'A',
    },
    {
        question: "Where was the first example of paper money used?",
        options: { A: "Rome", B: "China", C: "Turkey", D: "Greece" },
        correct: 'B',
    },
    {
        question: "Who is generally considered the inventor of the motor car?",
        options: { A: "Rudolf Diesel", B: "Henry Ford", C: "Karl Benz", D: "Henry M. Leland" },
        correct: 'C',
    },
    {
        question: "If you were looking at Iguazu Falls, on what continent would you be?",
        options: { A: "North America", B: "Africa", C: "Asia", D: "South America" },
        correct: 'D',
    },
    {
        question: "What number was the Apollo mission that successfully put a man on the moon?",
        options: { A: "Apollo 11", B: "Apollo 12", C: "Apollo 13", D: "Apollo 10" },
        correct: 'A',
    },
    {
        question: "Which of the following languages has the longest alphabet?",
        options: { A: "Hebrew", B: "Russian", C: "Greek", D: "Arabic" },
        correct: 'B',
    },
    {
        question: "Who was the lead singer of the band The Who?",
        options: { A: "Don Henley", B: "Ozzy Osbourne", C: "Roger Daltrey", D: "Robert Plant" },
        correct: 'C',
    },
    {
        question: "What spirit is used in making a Tom Collins?",
        options: { A: "Rum", B: "Whiskey", C: "Vodka", D: "Gin" },
        correct: 'D',
    },
    {
        question: "The fear of insects is known as what?",
        options: { A: "Entomophobia", B: "Ornithophobia", C: "Ailurophobia", D: "Arachnophobia" },
        correct: 'A',
    },
    {
        question: "What was the name of the Franco-British supersonic commercial plane that operated from 1976-2003?",
        options: { A: "Mirage", B: "Concorde", C: "Comet", D: "Accord" },
        correct: 'B',
    },
    {
        question: "Which horoscope sign is a fish?",
        options: { A: "Aquarius", B: "Scorpio", C: "Pisces", D: "Cancer" },
        correct: 'C',
    },
    {
        question: "What is the largest US state (by landmass)?",
        options: { A: "Montana", B: "Texas", C: "California", D: "Alaska" },
        correct: 'D',
    },
    {
        question: "Which app has the most total users?",
        options: { A: "Instagram", B: "TikTok", C: "YouTube", D: "Snapchat" },
        correct: 'A',
    },
    {
        question: "Which Game of Thrones character is known as the Young Wolf?",
        options: { A: "Sansa Stark", B: "Robb Stark", C: "Arya Stark", D: "Jon Snow" },
        correct: 'B',
    },
    {
        question: "How many plays do people (generally) believe that Shakespeare wrote?",
        options: { A: "39", B: "27", C: "37", D: "47" },
        correct: 'C',
    },
    {
        question: "Which of the following was considered one of the Seven Ancient Wonders?",
        options: { A: "Colosseum", B: "Great Wall of China", C: "Leaning Tower of Pisa", D: "Colossus of Rhodes" },
        correct: 'D',
    },
    {
        question: "Who directed the Academy Award-winning movie, Gladiator?",
        options: { A: "Ridley Scott", B: "James Cameron", C: "Steven Spielberg", D: "Steven Soderbergh" },
        correct: 'A',
    },
    {
        question: "How long did dinosaurs live on the earth?",
        options: { A: "100-150 million years", B: "150-200 million years", C: "200+ million years", D: "50-100 million years" },
        correct: 'B',
    },
    {
        question: "What Italian city is famous for its system of canals?",
        options: { A: "Florence", B: "Rome", C: "Venice", D: "Naples" },
        correct: 'C',
    },
    {
        question: "What is the strongest muscle in the human body?",
        options: { A: "Tongue", B: "Glutes", C: "Heart", D: "Jaw" },
        correct: 'D',
    },
    {
        question: "What is the longest-running Broadway show ever?",
        options: { A: "The Phantom of the Opera", B: "Les Miserables", C: "The Lion King", D: "Chicago" },
        correct: 'A',
    },
    {
        question: "Where was the earliest documented case of the Spanish flu?",
        options: { A: "Spain", B: "USA", C: "France", D: "Mexico" },
        correct: 'B',
    },
    {
        question: "Which of the following languages is NOT derived from Latin?",
        options: { A: "Portuguese", B: "Spanish", C: "English", D: "French" },
        correct: 'C',
    },
    {
        question: "Arnold Schwarzenegger was married to a member of what famous US political family?",
        options: { A: "The Bushes", B: "The Rockefellers", C: "The Clintons", D: "The Kennedys" },
        correct: 'D',
    },
    {
        question: "Which element has the chemical symbol W?",
        options: { A: "Tungsten", B: "Tellurium", C: "Tin", D: "Tantalum" },
        correct: 'A',
    },
    {
        question: "Who composed the opera *The Magic Flute*?",
        options: { A: "Joseph Haydn", B: "Wolfgang Amadeus Mozart", C: "Antonio Salieri", D: "Christoph Willibald Gluck" },
        correct: 'B',
    },
    {
        question: "Which empire was ruled by Mansa Musa in the 14th century?",
        options: { A: "Kanem-Bornu Empire", B: "Ghana Empire", C: "Mali Empire", D: "Songhai Empire" },
        correct: 'C',
    },
    {
        question: "What is the smallest prime number greater than 100?",
        options: { A: "109", B: "103", C: "107", D: "101" },
        correct: 'D',
    },
    {
        question: "Which philosopher wrote *Critique of Pure Reason*?",
        options: { A: "Immanuel Kant", B: "David Hume", C: "Arthur Schopenhauer", D: "Georg Wilhelm Friedrich Hegel" },
        correct: 'A',
    },
    {
        question: "What is the SI derived unit of capacitance?",
        options: { A: "Tesla", B: "Farad", C: "Henry", D: "Weber" },
        correct: 'B',
    },
    {
        question: "Which moon of Neptune is notable for its retrograde orbit and likely captured origin?",
        options: { A: "Nereid", B: "Larissa", C: "Triton", D: "Proteus" },
        correct: 'C',
    },
    {
        question: "Who painted *Las Meninas*?",
        options: { A: "Francisco Goya", B: "El Greco", C: "Bartolomé Esteban Murillo", D: "Diego Velázquez" },
        correct: 'D',
    },
    {
        question: "Which language family does Hungarian belong to?",
        options: { A: "Uralic", B: "Kartvelian", C: "Altaic", D: "Indo-European" },
        correct: 'A',
    },
    {
        question: "What is the deepest known point in Earth's oceans called?",
        options: { A: "Horizon Deep", B: "Challenger Deep", C: "Tonga Deep", D: "Milwaukee Deep" },
        correct: 'B',
    },
    {
        question: "Which mathematician is associated with the incompleteness theorems?",
        options: { A: "David Hilbert", B: "Bernhard Riemann", C: "Kurt Gödel", D: "Emmy Noether" },
        correct: 'C',
    },
    {
        question: "Which country was formerly known as Abyssinia?",
        options: { A: "Eritrea", B: "Sudan", C: "Somalia", D: "Ethiopia" },
        correct: 'D',
    },
    {
        question: "What is the largest internal organ in the human body?",
        options: { A: "Liver", B: "Kidney", C: "Lung", D: "Spleen" },
        correct: 'A',
    },
    {
        question: "Which novel begins with the line often translated as 'Someone must have been telling lies about Josef K.'?",
        options: { A: "The Castle", B: "The Trial", C: "The Metamorphosis", D: "Amerika" },
        correct: 'B',
    },
    {
        question: "What is the name of the boundary around a black hole beyond which light cannot escape?",
        options: { A: "Ergosphere", B: "Accretion boundary", C: "Event horizon", D: "Photon sphere" },
        correct: 'C',
    },
    {
        question: "Which Roman emperor issued the Edict of Milan with Licinius in 313 CE?",
        options: { A: "Theodosius I", B: "Diocletian", C: "Aurelian", D: "Constantine I" },
        correct: 'D',
    },
    {
        question: "What is the only naturally occurring element with a liquid state near room temperature besides mercury?",
        options: { A: "Bromine", B: "Cesium", C: "Gallium", D: "Francium" },
        correct: 'A',
    },
    {
        question: "Which artist created the sculpture *The Thinker*?",
        options: { A: "Constantin Brâncuși", B: "Auguste Rodin", C: "Camille Claudel", D: "Aristide Maillol" },
        correct: 'B',
    },
    {
        question: "Which strait separates Asia from North America?",
        options: { A: "Luzon Strait", B: "Davis Strait", C: "Bering Strait", D: "Bosphorus" },
        correct: 'C',
    },
    {
        question: "What is the name of the process by which a solid changes directly into a gas?",
        options: { A: "Vaporization", B: "Deliquescence", C: "Deposition", D: "Sublimation" },
        correct: 'D',
    },
    {
        question: "Which Byzantine emperor is associated with the codification known as the *Corpus Juris Civilis*?",
        options: { A: "Justinian I", B: "Basil II", C: "Heraclius", D: "Constantine XI" },
        correct: 'A',
    },
    {
        question: "Which blood type is considered the universal red-cell donor?",
        options: { A: "AB negative", B: "O negative", C: "O positive", D: "A negative" },
        correct: 'B',
    },
    {
        question: "Which physicist formulated the uncertainty principle?",
        options: { A: "Erwin Schrödinger", B: "Max Born", C: "Werner Heisenberg", D: "Wolfgang Pauli" },
        correct: 'C',
    },
    {
        question: "Which ancient city was destroyed by the eruption of Mount Vesuvius in 79 CE alongside Pompeii?",
        options: { A: "Ravenna", B: "Ostia", C: "Capua", D: "Herculaneum" },
        correct: 'D',
    },
    {
        question: "What is the largest moon in the Solar System?",
        options: { A: "Ganymede", B: "Titan", C: "Callisto", D: "Io" },
        correct: 'A',
    },
    {
        question: "Which composer wrote *The Rite of Spring*?",
        options: { A: "Claude Debussy", B: "Igor Stravinsky", C: "Maurice Ravel", D: "Sergei Prokofiev" },
        correct: 'B',
    },
    {
        question: "Which country has the most time zones when its overseas territories are included?",
        options: { A: "United Kingdom", B: "Russia", C: "France", D: "United States" },
        correct: 'C',
    },
    {
        question: "What is the mathematical constant approximately equal to 2.71828?",
        options: { A: "π", B: "φ", C: "γ", D: "e" },
        correct: 'D',
    },
    {
        question: "Which scientist discovered pulsars jointly with Jocelyn Bell Burnell?",
        options: { A: "Antony Hewish", B: "James Chadwick", C: "Fred Hoyle", D: "Martin Ryle" },
        correct: 'A',
    },
    {
        question: "Which treaty formally ended World War I between Germany and the Allied Powers?",
        options: { A: "Treaty of Brest-Litovsk", B: "Treaty of Versailles", C: "Treaty of Trianon", D: "Treaty of Saint-Germain" },
        correct: 'B',
    },
    {
        question: "What is the longest cranial nerve in the human body?",
        options: { A: "Trigeminal nerve", B: "Hypoglossal nerve", C: "Vagus nerve", D: "Facial nerve" },
        correct: 'C',
    },
    {
        question: "Which playwright wrote *The Duchess of Malfi*?",
        options: { A: "Christopher Marlowe", B: "Thomas Middleton", C: "Ben Jonson", D: "John Webster" },
        correct: 'D',
    },
    {
        question: "Which African lake is the world's second-largest freshwater lake by surface area?",
        options: { A: "Lake Victoria", B: "Lake Tanganyika", C: "Lake Malawi", D: "Lake Chad" },
        correct: 'A',
    },
    {
        question: "Which civilization developed the quipu as a system of record keeping?",
        options: { A: "Aztec", B: "Inca", C: "Moche", D: "Maya" },
        correct: 'B',
    },
    {
        question: "Which Nobel Prize category was not among the original prizes established by Alfred Nobel's will?",
        options: { A: "Literature", B: "Physics", C: "Economics", D: "Chemistry" },
        correct: 'C',
    },
    {
        question: "What is the approximate Schwarzschild radius of a one-solar-mass black hole?",
        options: { A: "300 meters", B: "300 kilometers", C: "30 kilometers", D: "3 kilometers" },
        correct: 'D',
    },
    {
        question: "Which English king was defeated and killed at the Battle of Bosworth Field in 1485?",
        options: { A: "Richard III", B: "Edward IV", C: "Henry VI", D: "John" },
        correct: 'A',
    },
    {
        question: "Which metal is the principal component of the mineral hematite?",
        options: { A: "Manganese", B: "Iron", C: "Aluminum", D: "Copper" },
        correct: 'B',
    },
    {
        question: "Who wrote the philosophical work *Being and Time*?",
        options: { A: "Ludwig Wittgenstein", B: "Edmund Husserl", C: "Martin Heidegger", D: "Jean-Paul Sartre" },
        correct: 'C',
    },
    {
        question: "What is the name of the ancient supercontinent that existed before the breakup into Laurasia and Gondwana?",
        options: { A: "Gondwana", B: "Laurasia", C: "Rodinia", D: "Pangaea" },
        correct: 'D',
    },
    {
        question: "Which painter is associated with the technique of sfumato and the *Mona Lisa*?",
        options: { A: "Leonardo da Vinci", B: "Caravaggio", C: "Titian", D: "Raphael" },
        correct: 'A',
    },
    {
        question: "What is the largest desert on Earth by area?",
        options: { A: "Sahara Desert", B: "Antarctic Desert", C: "Gobi Desert", D: "Arabian Desert" },
        correct: 'B',
    },
    {
        question: "Which mathematician proved Fermat's Last Theorem in the 1990s?",
        options: { A: "John Nash", B: "Grigori Perelman", C: "Andrew Wiles", D: "Terence Tao" },
        correct: 'C',
    },
    {
        question: "Which city was historically known as Constantinople?",
        options: { A: "Izmir", B: "Thessaloniki", C: "Athens", D: "Istanbul" },
        correct: 'D',
    },
    {
        question: "What is the term for the study of fungi?",
        options: { A: "Mycology", B: "Bryology", C: "Phycology", D: "Entomology" },
        correct: 'A',
    },
    {
        question: "Which element has the highest melting point of all pure metals?",
        options: { A: "Rhenium", B: "Tungsten", C: "Iridium", D: "Osmium" },
        correct: 'B',
    },
];

module.exports = triviaQuestions;
