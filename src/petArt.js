/* ASCII art for each pet species (see src/pets.js), drawn beside the pet's
 * details at the foot of /flex, /wardrobe and /inspect. Each figure is a few
 * lines tall and at most ART_MAX_WIDTH wide, so the sheet stays phone-width.
 * No backticks: the sheet is posted inside a Discord code block.
 *
 * Exposes:
 *   petArtLines(species) - the figure as an array of lines, or [] if none
 *   ART_MAX_WIDTH
 */

const ART_MAX_WIDTH = 26;

// String.raw keeps the backslashes as drawn; the first and last newline are trimmed.
const art = (strings) => String.raw(strings).replace(/^\n|\n$/g, '').split('\n');

const ART = {
    cat: art`
 /\_/\
( o.o )
 > ^ <
`,
    dog: art`
   / \__
  (    @\___
  /         O
 /   (_____/
/_____/   U
`,
    bird: art`
  _
 (o>
//\
V_/_
`,
    falcon: art`
   ___
  ( o >
 /|  )
/_|_/
   ^^
`,
    eagle: art`
 __    _    __
 \ \__( >__/ /
  \___  ___/
      \/
`,
    owl: art`
 ,_,
(O,O)
(   )
-"-"-
`,
    chimpanzee: art`
   .-"-.
  /|6 6|\
 {/(_0_)\}
  _/ ^ \_
 (/ /^\ \)
  ""' '""
`,
    gorilla: art`
    .-"-.
   ( o o )
 __/  ^  \__
/  \ \_/ /  \
\__/_____\__/
`,
    snake: art`
     _
  __( o>-
 /  _/
( (___
 \____)
`,
    spider: art`
  / _ \
\_\(_)/_/
 _//o\\_
  /   \
`,
    wolf: art`
 /\     /\
/  \___/  \
\  o   o  /
 \   ^   /
  \ \_/ /
   \___/
`,
    boar: art`
  .-~~~-.
>( oo   )~
 (_  ___)
  ||  ||
`,
    cow: art`
^__^
(oo)\_______
(__)\       )\/\
    ||----w |
    ||     ||
`,
    horse: art`
          /\
         / o\__
  ~~____/  ___/
 ~ (        )
    \ /\  /\
    || || ||
`,
    fox: art`
 /|      |\
/ |______| \
\  O    O  /
 \   /\   /
  \__\/__/
`,
    squirrel: art`
  .-~~-.
 (      \  /|
  \  ,   \/ o\
   \  )  (  _>
   (_/  (_)(_)
`,
    armadillo: art`
   .-""""-.
  / /||||\ \__
 (_/||||||\_o >
   ""    ""
`,
    kangaroo: art`
       /|
      / o\
     (  _/
     /  \=
    / () |
 __/ /  _|
(___/  (___>
`,
    deer: art`
\ /    \ /
 \\_..._//
  ( o o )
   \   /
    \_/
`,
    mouse: art`
 .--.   .--.
(    \_/    )
 \  o   o  /
==\   ^   /==
   '-----'
`,
};

const petArtLines = (species) => ART[species] || [];

module.exports = { petArtLines, ART_MAX_WIDTH, ART };
