/* Seasonal winter trivia bank for the Herald's daily trivia
 * (commands/passive/trivia.js). Drawn from every day of December and never
 * otherwise (see SEASONAL_STRETCHES in trivia.js), so it holds 31 questions:
 * one per day, and the no-repeat cycle asks each once before any repeats.
 *
 * Each entry is { question, options: { A, B, C, D }, correct }, same shape as
 * the main bank (flavor_text/triviaQuestions.js). The mix covers the December
 * holidays (Christmas, Hanukkah, Kwanzaa, the solstice, New Year's), holiday
 * films, songs and folklore from around the world, plus two for the court's
 * gamers. Each was written and fact-checked by hand, and the correct letters
 * are spread evenly (8 A, 8 B, 8 C, 7 D).
 */
const winterTriviaQuestions = () => [
    {
        question: 'In Home Alone (1990), what city are the McCallisters flying to when they leave Kevin behind?',
        options: { A: 'London', B: 'Rome', C: 'Paris', D: 'Madrid' },
        correct: 'C',
    },
    {
        question: 'What is the name of the Los Angeles skyscraper where Die Hard (1988) takes place?',
        options: { A: 'Nakatomi Plaza', B: 'Takagi Tower', C: 'Gruber Building', D: 'Century Tower' },
        correct: 'A',
    },
    {
        question: 'In Elf (2003), what does Buddy name as the four main food groups of elves?',
        options: { A: 'Cookies, milk, fudge and cocoa', B: 'Sugar, spice, gingerbread and syrup', C: 'Candy, candy canes, candy corns and syrup', D: 'Candy, cookies, cake and cocoa' },
        correct: 'C',
    },
    {
        question: "In The Nightmare Before Christmas (1993), what is the name of Jack Skellington's ghost dog?",
        options: { A: 'Zero', B: 'Oogie', C: 'Lock', D: 'Sparky' },
        correct: 'A',
    },
    {
        question: 'In Gremlins (1984), which of these is NOT one of the three rules for caring for a mogwai?',
        options: { A: 'Never feed it after midnight', B: 'Keep it away from bright light', C: 'Never get it wet', D: 'Never let it hear music' },
        correct: 'D',
    },
    {
        question: "In National Lampoon's Christmas Vacation (1989), how many imported Italian twinkle lights does Clark Griswold put on the house?",
        options: { A: '10,000', B: '25,000', C: '50,000', D: '100,000' },
        correct: 'B',
    },
    {
        question: "In Charles Dickens's A Christmas Carol (1843), what is the name of Scrooge's dead business partner?",
        options: { A: 'Bob Cratchit', B: 'Mr. Fezziwig', C: 'Jacob Marley', D: 'Fred' },
        correct: 'C',
    },
    {
        question: "The Star Wars Holiday Special (1978), aired only once, centers on Chewbacca's family celebrating which holiday?",
        options: { A: 'Life Day', B: 'Unity Day', C: 'Empire Day', D: 'Kashyyyk Day' },
        correct: 'A',
    },
    {
        question: 'In the first Harry Potter book, what Christmas present does Harry receive that once belonged to his father?',
        options: { A: 'A Firebolt', B: "The Marauder's Map", C: 'An Invisibility Cloak', D: 'A Remembrall' },
        correct: 'C',
    },
    {
        question: 'Bing Crosby recorded what Guinness World Records lists as the best-selling single of all time. Which song is it?',
        options: { A: 'Silent Night', B: 'White Christmas', C: 'Jingle Bells', D: 'Mele Kalikimaka' },
        correct: 'B',
    },
    {
        question: "Mariah Carey's \"All I Want for Christmas Is You\" came out in 1994. In what year did it first reach No. 1 on the Billboard Hot 100?",
        options: { A: '1994', B: '2000', C: '2012', D: '2019' },
        correct: 'D',
    },
    {
        question: 'Which carol was first performed on Christmas Eve 1818 in Oberndorf, Austria, accompanied by a guitar?',
        options: { A: 'O Holy Night', B: 'Silent Night', C: 'O Tannenbaum', D: 'Joy to the World' },
        correct: 'B',
    },
    {
        question: 'Counting every gift given on all twelve days, how many gifts does the singer receive in "The Twelve Days of Christmas"?',
        options: { A: '78', B: '144', C: '300', D: '364' },
        correct: 'D',
    },
    {
        question: 'In December 1965, two astronauts played "Jingle Bells" on a smuggled harmonica and sleigh bells, the first musical instruments played in space. Which mission were they on?',
        options: { A: 'Mercury-Atlas 9', B: 'Gemini 6A', C: 'Apollo 8', D: 'Vostok 6' },
        correct: 'B',
    },
    {
        question: 'Rudolph the Red-Nosed Reindeer first appeared in a 1939 booklet given away by which department store chain?',
        options: { A: 'Sears', B: "Macy's", C: 'Montgomery Ward', D: 'Gimbels' },
        correct: 'C',
    },
    {
        question: 'Where does the "X" in "Xmas" come from?',
        options: { A: 'The Roman numeral for ten', B: 'The Greek letter chi, the first letter of "Christ" in Greek', C: "A medieval monk's mark for a cross", D: "A Victorian shopkeepers' shorthand" },
        correct: 'B',
    },
    {
        question: 'Saint Nicholas, the bishop behind the Santa Claus legend, lived in a town that is now in which country?',
        options: { A: 'Greece', B: 'Italy', C: 'Turkey', D: 'The Netherlands' },
        correct: 'C',
    },
    {
        question: 'In the original 1823 printing of "A Visit from St. Nicholas", two of the reindeer were named Dunder and Blixem. What are they called today?',
        options: { A: 'Dasher and Dancer', B: 'Comet and Cupid', C: 'Donner and Blitzen', D: 'Prancer and Vixen' },
        correct: 'C',
    },
    {
        question: "The tradition that became NORAD Tracks Santa began in 1955, when a newspaper ad misprinted a phone number and sent children to a military hotline. Whose ad was it?",
        options: { A: "Macy's", B: "Woolworth's", C: 'Gimbels', D: 'Sears' },
        correct: 'D',
    },
    {
        question: 'Which prehistoric monument in Ireland has a passage that sunlight floods only at dawn in the days around the winter solstice?',
        options: { A: 'Newgrange', B: 'Skara Brae', C: 'Carnac', D: 'Stonehenge' },
        correct: 'A',
    },
    {
        question: "The first Times Square New Year's Eve ball was lowered on December 31 of which year?",
        options: { A: '1888', B: '1907', C: '1933', D: '1952' },
        correct: 'B',
    },
    {
        question: 'A 1974 advertising campaign made what a Christmas tradition in Japan?',
        options: { A: 'A bucket of KFC fried chicken', B: 'Exchanging pairs of socks', C: 'Eating sushi cake', D: 'Watching sumo on Christmas Eve' },
        correct: 'A',
    },
    {
        question: "In Icelandic folklore, which creature eats anyone who hasn't received new clothes before Christmas?",
        options: { A: 'The Yule Goat', B: 'The Yule Troll', C: 'The Yule Wolf', D: 'The Yule Cat' },
        correct: 'D',
    },
    {
        question: 'Since 1966, the Swedish town of Gävle has built a giant straw Yule Goat every December. What keeps happening to it?',
        options: { A: 'Students steal it', B: 'Real goats eat it', C: 'It floats off down the river', D: 'Vandals burn it down' },
        correct: 'D',
    },
    {
        question: "In Spain, what do people traditionally do at the stroke of midnight on New Year's Eve?",
        options: { A: 'Eat twelve grapes, one per chime', B: 'Throw a bucket of water out the window', C: "Smash plates on a friend's door", D: 'Burn a straw effigy' },
        correct: 'A',
    },
    {
        question: "Which country has sent a Christmas tree to London's Trafalgar Square every year since 1947, as thanks for Britain's help in World War II?",
        options: { A: 'Denmark', B: 'Norway', C: 'Sweden', D: 'Finland' },
        correct: 'B',
    },
    {
        question: 'What is the extra candle on a Hanukkah menorah, the one used to light the others, called?',
        options: { A: 'The shamash', B: 'The havdalah', C: 'The yahrzeit', D: 'The ner tamid' },
        correct: 'A',
    },
    {
        question: 'Outside Israel, the four letters on a dreidel stand for "A great miracle happened ___." What completes it?',
        options: { A: 'here', B: 'there', C: 'today', D: 'to us' },
        correct: 'B',
    },
    {
        question: 'Kwanzaa, first celebrated in 1966, runs for how many days?',
        options: { A: 'Five', B: 'Eight', C: 'Seven', D: 'Twelve' },
        correct: 'C',
    },
    {
        question: "In World of Warcraft, who is the jolly gift-giver of the Feast of Winter Veil?",
        options: { A: 'Greatfather Winter', B: 'Father Frost', C: 'Old Man Winter', D: 'Grandfather Snow' },
        correct: 'A',
    },
    {
        question: "In RuneScape's 2001 holiday event, what did the now-legendary party hats come out of?",
        options: { A: 'Snow globes', B: 'Presents under a tree', C: 'Stockings', D: 'Christmas crackers' },
        correct: 'D',
    },
];

module.exports = winterTriviaQuestions;
