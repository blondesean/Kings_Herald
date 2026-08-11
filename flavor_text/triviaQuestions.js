/* Trivia bank for the Herald's daily trivia (commands/passive/trivia.js).
 *
 * Each entry is { question, options: { A, B, C, D }, correct }, `correct` being
 * one of 'A' | 'B' | 'C' | 'D'. Hard difficulty, and every question is about a
 * work, event, or discovery from 2000 or later (so: MCU yes, original trilogy
 * Star Wars no; Lord of the Rings films yes since they released 2001-2003).
 * Two halves: nerd (sci-fi/fantasy/gaming/anime/tech) and general knowledge
 * (science/history/sports/music/current events), 50 each.
 *
 * At most one question per franchise/universe in the nerd half (e.g. only one
 * Marvel Cinematic Universe question total, only one Game of Thrones-universe
 * question total, even though it spans multiple shows) — keeps any one IP
 * from dominating a day's question and dilutes the value of being an expert
 * in just one franchise.
 *
 * Correct answers are spread evenly across A/B/C/D on purpose — an earlier
 * version of this bank skewed heavily toward B, which let people farm points
 * by always reacting B. Keep new entries balanced the same way if the bank
 * grows again.
 *
 * Keep each question single-answer and unambiguous: no "which of these are
 * also true" traps, since credit depends on reacting with exactly one emoji.
 */
const triviaQuestions = () => [
    // ---- Nerd (sci-fi / fantasy / gaming / anime / tech), 2000+ ----
    {
        question: "In the Game of Thrones episode \"The Long Night\" (2019), who kills the Night King?",
        options: { A: 'Arya Stark', B: 'Jon Snow', C: 'Brienne of Tarth', D: 'Daenerys Targaryen' },
        correct: 'A',
    },
    {
        question: "In The Mandalorian, what is the real name of the character nicknamed \"Baby Yoda\"?",
        options: { A: 'Yaddle', B: 'Grogu', C: 'Kuiil', D: 'Din Djarin' },
        correct: 'B',
    },
    {
        question: "What year did Halo: Combat Evolved launch alongside the original Xbox?",
        options: { A: '1999', B: '2003', C: '2001', D: '2005' },
        correct: 'C',
    },
    {
        question: "In the 2007 video game Portal, what is the name of the protagonist controlled by the player?",
        options: { A: 'GLaDOS', B: 'Alyx Vance', C: 'Wheatley', D: 'Chell' },
        correct: 'D',
    },
    {
        question: "Which 2011 sandbox video game was created by Swedish developer Markus \"Notch\" Persson?",
        options: { A: 'Minecraft', B: 'Terraria', C: 'Roblox', D: "Garry's Mod" },
        correct: 'A',
    },
    {
        question: "In Elden Ring (2022), what title do players ultimately seek to claim by the game's end?",
        options: { A: 'Chosen Undead', B: 'Elden Lord', C: 'Ashen One', D: 'Bearer of the Curse' },
        correct: 'B',
    },
    {
        question: "In Red Dead Redemption 2 (2018), what is the name of the outlaw gang protagonist Arthur Morgan belongs to?",
        options: { A: 'The Del Lobos', B: "The O'Driscoll Boys", C: 'The Van der Linde gang', D: 'The Lemoyne Raiders' },
        correct: 'C',
    },
    {
        question: "Which 2020 video game by CD Projekt Red is set in the fictional Night City?",
        options: { A: 'The Witcher 3', B: 'Deus Ex', C: 'Watch Dogs', D: 'Cyberpunk 2077' },
        correct: 'D',
    },
    {
        question: "In Baldur's Gate 3 (2023), what parasite is implanted in the player character's brain at the start of the game?",
        options: { A: 'An illithid tadpole', B: 'A Brain Slug', C: 'A symbiote', D: 'A Cordyceps spore' },
        correct: 'A',
    },
    {
        question: "The 2015 game Undertale, by Toby Fox, is notable for letting players complete it without ever doing what?",
        options: { A: 'Saving', B: 'Killing any enemies', C: 'Leveling up', D: 'Speaking to NPCs' },
        correct: 'B',
    },
    {
        question: "In Overwatch (2016), what is the profession of the Swedish support hero Torbjörn?",
        options: { A: 'Doctor', B: 'Scientist', C: 'Engineer', D: 'Architect' },
        correct: 'C',
    },
    {
        question: "Which 2013 game follows survivors Joel and Ellie across a fungus-ravaged post-apocalyptic United States?",
        options: { A: 'Days Gone', B: 'Dying Light', C: 'State of Decay', D: 'The Last of Us' },
        correct: 'D',
    },
    {
        question: "In the 2022 anime/manga Chainsaw Man, what devil does protagonist Denji merge with to gain his powers?",
        options: { A: 'The Chainsaw Devil', B: 'The Gun Devil', C: 'The Blood Devil', D: 'The Control Devil' },
        correct: 'A',
    },
    {
        question: "Attack on Titan (manga began 2009) is primarily set within what defensive structure protecting humanity?",
        options: { A: 'The Great Wall', B: 'Three concentric walls (Maria, Rose, Sina)', C: 'An underground bunker', D: 'A floating city' },
        correct: 'B',
    },
    {
        question: "In Demon Slayer (2019 anime), what is the name of protagonist Tanjiro Kamado's demon sister?",
        options: { A: 'Shinobu', B: 'Mitsuri', C: 'Nezuko', D: 'Kanao' },
        correct: 'C',
    },
    {
        question: "Death Note (2006 anime) follows a student who gains the power to kill anyone by writing their name in a notebook — what is his name?",
        options: { A: 'L', B: 'Near', C: 'Ryuk', D: 'Light Yagami' },
        correct: 'D',
    },
    {
        question: "In the 2020 anime/manga Jujutsu Kaisen, what does protagonist Yuji Itadori swallow to gain cursed powers?",
        options: { A: 'A finger of Sukuna', B: 'A cursed doll', C: 'A sealed sword', D: "A demon's eye" },
        correct: 'A',
    },
    {
        question: "In Arcane (2021), which two sisters are the central protagonists, later becoming League of Legends champions Vi and Jinx?",
        options: { A: 'Caitlyn and Vi', B: 'Vi and Powder', C: 'Jinx and Caitlyn', D: 'Ekko and Vi' },
        correct: 'B',
    },
    {
        question: "What was the first cryptocurrency, introduced via a 2008 whitepaper by the pseudonymous \"Satoshi Nakamoto\"?",
        options: { A: 'Ethereum', B: 'Litecoin', C: 'Bitcoin', D: 'Dogecoin' },
        correct: 'C',
    },
    {
        question: "In what year was the first iPhone released by Apple?",
        options: { A: '2005', B: '2009', C: '2010', D: '2007' },
        correct: 'D',
    },
    {
        question: "ChatGPT, developed by OpenAI, was publicly released in what month and year?",
        options: { A: 'November 2022', B: 'June 2022', C: 'March 2023', D: 'January 2021' },
        correct: 'A',
    },
    {
        question: "Which social media platform, launched in 2016, popularized short-form vertical video and is owned by China's ByteDance?",
        options: { A: 'Vine', B: 'TikTok', C: 'Instagram Reels', D: 'Snapchat' },
        correct: 'B',
    },
    {
        question: "In Christopher Nolan's Inception (2010), what object does protagonist Cobb spin to test whether he is dreaming?",
        options: { A: 'A coin', B: 'A pocket watch', C: 'A top', D: 'A ring' },
        correct: 'C',
    },
    {
        question: "In Denis Villeneuve's Dune (2021), what is the name of the desert planet where most of the film is set?",
        options: { A: 'Caladan', B: 'Giedi Prime', C: 'Kaitain', D: 'Arrakis' },
        correct: 'D',
    },
    {
        question: "In the 2018 animated film Spider-Man: Into the Spider-Verse, what is the name of the teenage protagonist who becomes Spider-Man?",
        options: { A: 'Miles Morales', B: 'Peter Parker', C: "Miguel O'Hara", D: 'Peter B. Parker' },
        correct: 'A',
    },
    {
        question: "In Breaking Bad (2008–2013), what alias does Walter White adopt as a drug manufacturer?",
        options: { A: 'Gray Matter', B: 'Heisenberg', C: 'Los Pollos', D: 'The Cook' },
        correct: 'B',
    },
    {
        question: "Westworld (2016) is set in a futuristic theme park populated by lifelike androids referred to as what?",
        options: { A: 'Replicants', B: 'Synths', C: 'Hosts', D: 'Constructs' },
        correct: 'C',
    },
    {
        question: "In The Witcher, what is the name of the keep where witchers like Geralt are trained?",
        options: { A: 'Cintra', B: 'Novigrad', C: 'Skellige', D: 'Kaer Morhen' },
        correct: 'D',
    },
    {
        question: "In Avengers: Infinity War (2018) and Endgame (2019), how many Infinity Stones does Thanos need to control the universe?",
        options: { A: 'Six', B: 'Four', C: 'Five', D: 'Seven' },
        correct: 'A',
    },
    {
        question: "Stranger Things (2016) is set in the fictional town of what?",
        options: { A: 'Derry', B: 'Hawkins', C: 'Castle Rock', D: 'Silent Hill' },
        correct: 'B',
    },
    {
        question: "In Rick and Morty (2013), what is the designation of Rick Sanchez's home dimension?",
        options: { A: 'C-500A', B: 'Cronenberg World', C: 'C-137', D: "Evil Morty's dimension" },
        correct: 'C',
    },
    {
        question: "The Boys (2019) satirizes corporate-controlled superheroes; what company manages \"The Seven\"?",
        options: { A: 'Stark Industries', B: 'OsCorp', C: 'LexCorp', D: 'Vought International' },
        correct: 'D',
    },
    {
        question: "In Severance (2022), what is the name of the procedure that splits employees' memories between work and home life?",
        options: { A: 'Severance', B: 'Bifurcation', C: 'Compartmentalization', D: 'The Split' },
        correct: 'A',
    },
    {
        question: "What mundane business do protagonist Evelyn Wang and her family run in Everything Everywhere All at Once (2022)?",
        options: { A: 'A restaurant', B: 'A laundromat', C: 'A bakery', D: 'A grocery store' },
        correct: 'B',
    },
    {
        question: "In Invincible (2021 animated series), what is the real name of the teenage superhero protagonist?",
        options: { A: 'Nolan Grayson', B: 'Clark Kent', C: 'Mark Grayson', D: 'Damien Darkblood' },
        correct: 'C',
    },
    {
        question: "My Hero Academia (2016) takes place in a world where roughly what percentage of the population is said to possess superpowers called \"Quirks\"?",
        options: { A: '50%', B: '60%', C: '99%', D: '80%' },
        correct: 'D',
    },
    {
        question: "One Punch Man (2015) follows Saitama, a hero who can defeat any enemy with what limitation?",
        options: { A: 'A single punch', B: 'Only at night', C: 'Only using a sword', D: 'Only when angry' },
        correct: 'A',
    },
    {
        question: "In Fullmetal Alchemist: Brotherhood (2009), what is the fundamental law forbidding alchemists from creating something from nothing?",
        options: { A: 'The Law of Conservation', B: 'Equivalent Exchange', C: 'The First Law of Alchemy', D: "The Philosopher's Rule" },
        correct: 'B',
    },
    {
        question: "Which 2004 MMORPG by Blizzard Entertainment, set in the Warcraft universe, became one of the best-selling PC games of all time?",
        options: { A: 'EverQuest', B: 'Final Fantasy XI', C: 'World of Warcraft', D: 'Guild Wars' },
        correct: 'C',
    },
    {
        question: "In The Legend of Zelda: Breath of the Wild (2017), what is the name of the ancient evil force Link must defeat?",
        options: { A: 'Ganon', B: 'Demise', C: 'Vaati', D: 'Calamity Ganon' },
        correct: 'D',
    },
    {
        question: "God of War (2018 reboot) relocates protagonist Kratos from Greek mythology to what mythological setting?",
        options: { A: 'Norse', B: 'Egyptian', C: 'Celtic', D: 'Aztec' },
        correct: 'A',
    },
    {
        question: "Hades (2020), the roguelike by Supergiant Games, casts the player as which Greek god attempting to escape the Underworld?",
        options: { A: 'Ares', B: 'Zagreus', C: 'Hermes', D: 'Dionysus' },
        correct: 'B',
    },
    {
        question: "Which 2001 online encyclopedia, editable by anyone, was co-founded by Jimmy Wales and Larry Sanger?",
        options: { A: 'Encarta', B: 'Britannica Online', C: 'Wikipedia', D: 'Everipedia' },
        correct: 'C',
    },
    {
        question: "In Christopher Nolan's The Dark Knight (2008), what is the real identity of the villain Two-Face before his transformation?",
        options: { A: 'Jim Gordon', B: 'Alfred Pennyworth', C: 'Lucius Fox', D: 'Harvey Dent' },
        correct: 'D',
    },
    {
        question: "James Cameron's Avatar (2009) is set on a lush alien moon called what?",
        options: { A: 'Pandora', B: 'Endor', C: 'Arrakis', D: 'Kashyyyk' },
        correct: 'A',
    },
    {
        question: "In the Netflix series Squid Game (2021), what color tracksuits do the contestants wear?",
        options: { A: 'Blue', B: 'Green', C: 'Red', D: 'Gray' },
        correct: 'B',
    },
    {
        question: "HBO's Watchmen (2019), a sequel/remix of the original graphic novel, is primarily set in which American city?",
        options: { A: 'Chicago', B: 'Gotham', C: 'Tulsa', D: 'New York' },
        correct: 'C',
    },
    {
        question: "Fortnite's Battle Royale mode, launched in 2017, drops 100 players onto an island where the play area shrinks due to what environmental hazard?",
        options: { A: 'Rising lava', B: 'A sandstorm', C: 'Toxic gas', D: 'A storm' },
        correct: 'D',
    },
    {
        question: "Pokémon GO (2016), the augmented-reality mobile game, was developed by which company in partnership with Nintendo/The Pokémon Company?",
        options: { A: 'Niantic', B: 'Bungie', C: 'Riot Games', D: 'Supercell' },
        correct: 'A',
    },
    {
        question: "In Persona 5 (2016), the protagonist and allies form a group of supernatural thieves known as what?",
        options: { A: 'The Shadow Society', B: 'The Phantom Thieves', C: 'The Velvet Room', D: 'The Metaverse Guild' },
        correct: 'B',
    },
    // ---- General knowledge, 2000+ ----
    {
        question: "The Human Genome Project announced it had completed sequencing the human genome in what year?",
        options: { A: '2000', B: '2006', C: '2003', D: '2010' },
        correct: 'C',
    },
    {
        question: "In 2012, scientists at CERN announced the discovery of which long-sought subatomic particle?",
        options: { A: 'The neutrino', B: 'The graviton', C: 'The tau lepton', D: 'The Higgs boson' },
        correct: 'D',
    },
    {
        question: "Which dwarf planet did NASA's New Horizons spacecraft perform a historic flyby of in 2015?",
        options: { A: 'Pluto', B: 'Ceres', C: 'Eris', D: 'Makemake' },
        correct: 'A',
    },
    {
        question: "In 2019, scientists released the first-ever direct image of what astronomical object, located in the galaxy M87?",
        options: { A: 'A neutron star', B: 'A black hole', C: 'A pulsar', D: 'A quasar' },
        correct: 'B',
    },
    {
        question: "NASA's James Webb Space Telescope launched in December of what year?",
        options: { A: '2019', B: '2020', C: '2021', D: '2022' },
        correct: 'C',
    },
    {
        question: "The 2011 secession of what nation made it the world's newest internationally recognized country?",
        options: { A: 'Kosovo', B: 'Montenegro', C: 'East Timor', D: 'South Sudan' },
        correct: 'D',
    },
    {
        question: "The Burj Khalifa, the tallest building in the world, officially opened in Dubai in what year?",
        options: { A: '2010', B: '2008', C: '2012', D: '2014' },
        correct: 'A',
    },
    {
        question: "Which country hosted the 2008 Summer Olympics?",
        options: { A: 'Greece', B: 'China', C: 'United Kingdom', D: 'Brazil' },
        correct: 'B',
    },
    {
        question: "The United Kingdom's referendum to leave the European Union, commonly called Brexit, was held in what year?",
        options: { A: '2014', B: '2018', C: '2016', D: '2019' },
        correct: 'C',
    },
    {
        question: "Barack Obama, the first African American U.S. president, was elected in November of what year?",
        options: { A: '2004', B: '2009', C: '2012', D: '2008' },
        correct: 'D',
    },
    {
        question: "SpaceX achieved a historic first in December 2015 by successfully doing what with an orbital rocket booster?",
        options: { A: 'Landing it vertically for reuse', B: 'Launching it without fuel', C: 'Sending it to Mars', D: 'Docking it with the ISS' },
        correct: 'A',
    },
    {
        question: "Tesla's first mass-market sedan, the Model S, was released to customers starting in what year?",
        options: { A: '2008', B: '2012', C: '2010', D: '2015' },
        correct: 'B',
    },
    {
        question: "The COVID-19 outbreak was officially declared a global pandemic by the WHO in what month and year?",
        options: { A: 'December 2019', B: 'June 2020', C: 'March 2020', D: 'January 2021' },
        correct: 'C',
    },
    {
        question: "How many hijacked planes were involved in the September 11, 2001 attacks?",
        options: { A: 'Two', B: 'Three', C: 'Five', D: 'Four' },
        correct: 'D',
    },
    {
        question: "The 2008 global financial crisis is closely linked to the September bankruptcy of which major U.S. investment bank?",
        options: { A: 'Lehman Brothers', B: 'Goldman Sachs', C: 'Bear Stearns', D: 'Merrill Lynch' },
        correct: 'A',
    },
    {
        question: "The wave of pro-democracy uprisings across the Arab world beginning in late 2010 is commonly known as what?",
        options: { A: 'The Velvet Revolution', B: 'The Arab Spring', C: 'The Jasmine Uprising', D: 'The Cedar Revolution' },
        correct: 'B',
    },
    {
        question: "Which platform, founded in 2006, limited posts to 140 characters for much of its early history?",
        options: { A: 'Facebook', B: 'Tumblr', C: 'Twitter', D: 'Reddit' },
        correct: 'C',
    },
    {
        question: "Facebook was originally founded in 2004 under what more limited name, restricted to Harvard students?",
        options: { A: 'FaceConnect', B: 'HarvardBook', C: 'MyFace', D: 'TheFacebook' },
        correct: 'D',
    },
    {
        question: "Which US swimmer won a record eight gold medals at a single Olympics, the 2008 Beijing Games?",
        options: { A: 'Michael Phelps', B: 'Ryan Lochte', C: 'Caeleb Dressel', D: 'Mark Spitz' },
        correct: 'A',
    },
    {
        question: "Usain Bolt set his still-standing 100m world record of 9.58 seconds at which event?",
        options: { A: 'The 2008 Beijing Olympics', B: 'The 2009 World Championships in Berlin', C: 'The 2012 London Olympics', D: 'The 2016 Rio Olympics' },
        correct: 'B',
    },
    {
        question: "Which country won the FIFA World Cup in 2010, hosted in South Africa?",
        options: { A: 'Brazil', B: 'Netherlands', C: 'Spain', D: 'Germany' },
        correct: 'C',
    },
    {
        question: "The 2014 FIFA World Cup was hosted by which country, where the hosts suffered a famous 7-1 semifinal defeat to Germany?",
        options: { A: 'Argentina', B: 'Chile', C: 'Mexico', D: 'Brazil' },
        correct: 'D',
    },
    {
        question: "Leicester City's 2015–16 Premier League title win is one of the biggest upsets in sports history — their pre-season title odds with some bookmakers were roughly what?",
        options: { A: '5000 to 1', B: '500 to 1', C: '1000 to 1', D: '10000 to 1' },
        correct: 'A',
    },
    {
        question: "Tom Brady won his seventh and final Super Bowl in February 2021 while playing for which team?",
        options: { A: 'New England Patriots', B: 'Tampa Bay Buccaneers', C: 'Kansas City Chiefs', D: 'Green Bay Packers' },
        correct: 'B',
    },
    {
        question: "Which streaming music service, founded in Sweden in 2006, launched publicly in 2008 and became one of the world's largest music platforms?",
        options: { A: 'Pandora', B: 'Tidal', C: 'Spotify', D: 'Deezer' },
        correct: 'C',
    },
    {
        question: "Beyoncé's 2016 visual album, exploring themes of infidelity and Black womanhood, is titled what?",
        options: { A: 'Homecoming', B: 'Renaissance', C: '4', D: 'Lemonade' },
        correct: 'D',
    },
    {
        question: "Taylor Swift's 2021 re-recorded album \"Red (Taylor's Version)\" was released amid a dispute over ownership of her earlier masters — whose album was it?",
        options: { A: 'Taylor Swift', B: 'Adele', C: 'Olivia Rodrigo', D: 'Billie Eilish' },
        correct: 'A',
    },
    {
        question: "The 2010 Nobel Peace Prize was awarded to dissident Liu Xiaobo, who was imprisoned in which country and unable to accept it in person?",
        options: { A: 'Russia', B: 'China', C: 'Myanmar', D: 'North Korea' },
        correct: 'B',
    },
    {
        question: "Malala Yousafzai became the youngest-ever Nobel Peace Prize laureate in what year?",
        options: { A: '2012', B: '2013', C: '2014', D: '2015' },
        correct: 'C',
    },
    {
        question: "Which billionaire reached space in July 2021 aboard his own company's New Shepard rocket, days after a rival's suborbital flight?",
        options: { A: 'Elon Musk', B: 'Richard Branson', C: 'Mark Zuckerberg', D: 'Jeff Bezos' },
        correct: 'D',
    },
    {
        question: "The 2016 \"Panama Papers\" leak exposed a massive trove of documents from which entity, revealing offshore financial dealings of world leaders?",
        options: { A: 'A Panamanian law firm (Mossack Fonseca)', B: 'A Swiss bank', C: 'The IMF', D: 'A Cayman Islands hedge fund' },
        correct: 'A',
    },
    {
        question: "Which hashtag-driven movement went viral in 2017, encouraging survivors of sexual harassment and assault to share their stories?",
        options: { A: '#TimesUp', B: '#MeToo', C: '#BLM', D: '#NeverAgain' },
        correct: 'B',
    },
    {
        question: "The Black Lives Matter movement originated in 2013 following the acquittal of George Zimmerman in the shooting death of which teenager?",
        options: { A: 'Michael Brown', B: 'Eric Garner', C: 'Trayvon Martin', D: 'Tamir Rice' },
        correct: 'C',
    },
    {
        question: "Which 2010 volcanic eruption caused massive disruption to European air travel due to its ash cloud?",
        options: { A: 'Mount St. Helens', B: 'Krakatoa', C: 'Mount Etna', D: 'Eyjafjallajökull' },
        correct: 'D',
    },
    {
        question: "The 2011 earthquake and tsunami that caused the Fukushima nuclear disaster struck off the coast of which country?",
        options: { A: 'Japan', B: 'Indonesia', C: 'Chile', D: 'Philippines' },
        correct: 'A',
    },
    {
        question: "Which messaging app, founded in 2009 and acquired by Facebook in 2014 for roughly $19 billion, focused on simple cross-platform texting?",
        options: { A: 'Snapchat', B: 'WhatsApp', C: 'WeChat', D: 'Telegram' },
        correct: 'B',
    },
    {
        question: "NASA's Curiosity rover, searching for signs of ancient microbial life on Mars, touched down in what year?",
        options: { A: '2004', B: '2008', C: '2012', D: '2016' },
        correct: 'C',
    },
    {
        question: "In 2020, gene-editing pioneers Jennifer Doudna and Emmanuelle Charpentier won a Nobel Prize for CRISPR-Cas9 in what field?",
        options: { A: 'Physics', B: 'Medicine', C: 'Peace', D: 'Chemistry' },
        correct: 'D',
    },
    {
        question: "Which country became the first in the world to legalize same-sex marriage nationwide, in 2001?",
        options: { A: 'Netherlands', B: 'Belgium', C: 'Spain', D: 'Canada' },
        correct: 'A',
    },
    {
        question: "The 2004 Indian Ocean earthquake and tsunami, one of the deadliest disasters in recorded history, was centered off the coast of which island?",
        options: { A: 'Java', B: 'Sumatra', C: 'Sri Lanka', D: 'Bali' },
        correct: 'B',
    },
    {
        question: "SpaceX, founded in 2002, achieved the first privately-funded liquid-fueled rocket to reach orbit with which rocket in 2008?",
        options: { A: 'Falcon Heavy', B: 'Falcon 9', C: 'Falcon 1', D: 'Starship' },
        correct: 'C',
    },
    {
        question: "Which country split into two separate nations after a 2006 independence referendum?",
        options: { A: 'Czechoslovakia', B: 'Yugoslavia', C: 'The USSR', D: 'Serbia and Montenegro' },
        correct: 'D',
    },
    {
        question: "Kosovo unilaterally declared independence from Serbia in what year?",
        options: { A: '2008', B: '1999', C: '2003', D: '2012' },
        correct: 'A',
    },
    {
        question: "The 2010 WikiLeaks release of a massive trove of U.S. diplomatic cables was sourced in large part from which former U.S. Army intelligence analyst?",
        options: { A: 'Edward Snowden', B: 'Chelsea Manning', C: 'Reality Winner', D: 'Julian Assange' },
        correct: 'B',
    },
    {
        question: "In 2013, Edward Snowden leaked classified documents revealing mass surveillance programs run by which U.S. agency?",
        options: { A: 'The CIA', B: 'The FBI', C: 'The NSA', D: 'The DHS' },
        correct: 'C',
    },
    {
        question: "Which company's 2004 IPO made it a publicly traded search-engine giant?",
        options: { A: 'Yahoo', B: 'Amazon', C: 'eBay', D: 'Google' },
        correct: 'D',
    },
    {
        question: "Instagram, founded in 2010, was acquired by Facebook in what year for roughly $1 billion?",
        options: { A: '2012', B: '2010', C: '2014', D: '2016' },
        correct: 'A',
    },
    {
        question: "The Deepwater Horizon oil spill, one of the largest marine oil spills in history, occurred in the Gulf of Mexico in what year?",
        options: { A: '2008', B: '2010', C: '2012', D: '2014' },
        correct: 'B',
    },
    {
        question: "Pluto was reclassified from a planet to a \"dwarf planet\" by the International Astronomical Union in what year?",
        options: { A: '2003', B: '2009', C: '2006', D: '2012' },
        correct: 'C',
    },
    {
        question: "Queen Elizabeth II's Platinum Jubilee, marking 70 years on the British throne, was celebrated in what year?",
        options: { A: '2020', B: '2021', C: '2023', D: '2022' },
        correct: 'D',
    },
];

module.exports = triviaQuestions;
