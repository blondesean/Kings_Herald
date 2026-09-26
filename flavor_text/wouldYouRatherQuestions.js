/* Question bank for the daily "would you rather" round (see
 * commands/passive/wouldYouRather.js). The daily trivia slot hands the day to
 * this game about half the time — see SUBJECTIVE_CHANCE in
 * commands/passive/trivia.js.
 *
 * Each entry is { question, options: { A, B } }: exactly two choices, no
 * `correct` (there is no right answer — the "correct" prediction is whichever
 * side the group actually picks most). All original, written for this
 * project. Keep them tame, and keep the two sides close to evenly appealing:
 * the game is about predicting the room, so a question everybody answers the
 * same way makes for a dull round.
 */
const wouldYouRatherQuestions = () => [
    { question: 'Window seat or aisle seat?', options: { A: 'Window seat', B: 'Aisle seat' } },
    { question: 'Would you rather always be 10 minutes early or always be 10 minutes late?', options: { A: 'Always 10 minutes early', B: 'Always 10 minutes late' } },
    { question: 'Would you rather have a rewind button or a pause button for your life?', options: { A: 'A rewind button', B: 'A pause button' } },
    { question: 'Pineapple on pizza: great or a crime?', options: { A: 'Great', B: 'A crime' } },
    { question: 'Would you rather talk to animals or speak every human language?', options: { A: 'Talk to animals', B: 'Speak every human language' } },
    { question: 'Sweet breakfast or savory breakfast?', options: { A: 'Sweet', B: 'Savory' } },
    { question: 'Would you rather live somewhere always cold or always hot?', options: { A: 'Always cold', B: 'Always hot' } },
    { question: 'Beach vacation or mountain vacation?', options: { A: 'Beach', B: 'Mountains' } },
    { question: 'Would you rather never need to sleep or never need to eat?', options: { A: 'Never need to sleep', B: 'Never need to eat' } },
    { question: 'Text or phone call?', options: { A: 'Text', B: 'Phone call' } },
    { question: 'Would you rather read the book first or watch the movie first?', options: { A: 'Read the book first', B: 'Watch the movie first' } },
    { question: 'Would you rather fly at walking speed or run 60 mph in straight lines only?', options: { A: 'Fly, but only at walking speed', B: 'Run 60 mph, but only in a straight line' } },
    { question: 'Would you rather eat your favorite meal every day or never eat the same meal twice?', options: { A: 'Favorite meal every day', B: 'Never the same meal twice' } },
    { question: 'Early bird or night owl?', options: { A: 'Early bird', B: 'Night owl' } },
    { question: 'Would you rather have a personal chef or a personal driver?', options: { A: 'A personal chef', B: 'A personal driver' } },
    { question: 'Would you rather work from home forever or in an office with great coworkers?', options: { A: 'Work from home forever', B: 'An office with great coworkers' } },
    { question: 'Would you rather know how every show ends or be surprised by everything?', options: { A: 'Know how everything ends', B: 'Be surprised by everything' } },
    { question: 'Would you rather live in a treehouse or on a houseboat?', options: { A: 'A treehouse', B: 'A houseboat' } },
    { question: 'Cats or dogs?', options: { A: 'Cats', B: 'Dogs' } },
    { question: 'Would you rather have free flights anywhere forever or free hotels anywhere forever?', options: { A: 'Free flights anywhere', B: 'Free hotels anywhere' } },
    { question: 'Would you rather have a photographic memory or learn any skill in a week?', options: { A: 'A photographic memory', B: 'Learn any skill in a week' } },
    { question: 'Pancakes or waffles?', options: { A: 'Pancakes', B: 'Waffles' } },
    { question: 'Spring or autumn?', options: { A: 'Spring', B: 'Autumn' } },
    { question: 'Would you rather only be able to whisper or only be able to shout?', options: { A: 'Only whisper', B: 'Only shout' } },
    { question: 'Would you rather have a tail you can control or wings too small to fly?', options: { A: 'A tail you can control', B: 'Tiny wings that cannot fly' } },
    { question: 'Karaoke night or board game night?', options: { A: 'Karaoke night', B: 'Board game night' } },
    { question: 'Would you rather never be able to lie or never be able to keep a secret?', options: { A: 'Never able to lie', B: 'Never able to keep a secret' } },
    { question: 'Would you rather live in a world with no music or no movies?', options: { A: 'No music', B: 'No movies' } },
    { question: 'Would you rather have one extra hour every day or one extra day every week?', options: { A: 'An extra hour every day', B: 'An extra day every week' } },
    { question: 'Would you rather give up sweets forever or salty snacks forever?', options: { A: 'Give up sweets', B: 'Give up salty snacks' } },
    { question: 'Would you rather meet your hero or meet your future self?', options: { A: 'Meet your hero', B: 'Meet your future self' } },
    { question: 'Would you rather always be slightly too warm or slightly too cold?', options: { A: 'Slightly too warm', B: 'Slightly too cold' } },
    { question: 'Front row at every concert or backstage at every concert?', options: { A: 'Front row', B: 'Backstage' } },
    { question: 'Would you rather explore space or explore the deep ocean?', options: { A: 'Explore space', B: 'Explore the deep ocean' } },
    { question: 'Would you rather only play classic games forever or only brand new releases forever?', options: { A: 'Only classics', B: 'Only new releases' } },
    { question: 'Would you rather never wait in line again or never sit in traffic again?', options: { A: 'Never wait in line', B: 'Never sit in traffic' } },
    { question: 'Would you rather be a famous actor or a famous musician?', options: { A: 'A famous actor', B: 'A famous musician' } },
    { question: 'Ice in your drink or no ice?', options: { A: 'Ice', B: 'No ice' } },
    { question: 'Would you rather sleep with a fan on or in total silence?', options: { A: 'Fan on', B: 'Total silence' } },
    { question: 'On a road trip, would you rather pick the music or pick the snacks?', options: { A: 'Pick the music', B: 'Pick the snacks' } },
    { question: 'Would you rather visit the past for a day or the future for a day?', options: { A: 'The past for a day', B: 'The future for a day' } },
    { question: 'Would you rather have unlimited pizza or unlimited tacos for life?', options: { A: 'Unlimited pizza', B: 'Unlimited tacos' } },
    { question: 'Would you rather always speak in rhyme or always speak in a movie-trailer voice?', options: { A: 'Always in rhyme', B: 'Always in a movie-trailer voice' } },
    { question: 'Would you rather be the funniest person in the room or the smartest?', options: { A: 'The funniest', B: 'The smartest' } },
    { question: 'Would you rather own a huge empty house or a tiny house full of everything you love?', options: { A: 'A huge empty house', B: 'A tiny house full of what you love' } },
    { question: 'Dessert first or dessert last?', options: { A: 'Dessert first', B: 'Dessert last' } },
    { question: 'Would you rather lose your phone for a week or your wallet for a week?', options: { A: 'Lose your phone', B: 'Lose your wallet' } },
    { question: 'Would you rather never do laundry or never do dishes?', options: { A: 'Never do laundry', B: 'Never do dishes' } },
    { question: 'Roller coaster or lazy river?', options: { A: 'Roller coaster', B: 'Lazy river' } },
    { question: 'Big city or countryside?', options: { A: 'Big city', B: 'Countryside' } },
];

module.exports = wouldYouRatherQuestions;
