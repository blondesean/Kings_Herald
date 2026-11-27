/* Flavor text for the Christmas morning gift (see
 * commands/passive/christmasGift.js): the Herald plays Santa, none too
 * convincingly, and gives every member points. `points` is the size of each
 * gift. Every member's mention follows the line, so it doesn't name anyone.
 */
const christmasGiftLines = (points) => [
    `The great doors swing open and in stomps a figure in an ill-fitting red coat, a cotton beard hooked over his ears. "Ho, ho, ho! 'Tis I, Father Christmas, and most certainly not thy Herald!" he booms, in a voice suspiciously like the Herald's. "Every name upon my list is nice this year, so ${points} points for each of thee!"`,
    `Sleigh bells jingle in the courtyard, then comes a thud and a muffled curse. A red-suited figure staggers in, brushing snow from a beard that is plainly a mop head, the Herald's signet ring glinting on his finger. "Ho, ho, ho! Santa hath come to court! I checked my list twice, and every noble upon it gets ${points} points!"`,
    `"Ho, ho, ho!" A portly Santa squeezes out of the great hearth, coughing soot, his pillow belly sliding toward his knees. "Pay no mind to the heraldic tabard beneath this coat," he says hastily. "Santa bringeth gifts for all the court this Christmas morn: ${points} points apiece!"`,
    `A sack of coins thumps onto the floor of the great hall. Above it stands a Santa in a crooked red hat, reading from a scroll in a very familiar voice. "Ho, ho, ho! Not a single lump of coal this year, good court. Merry Christmas, and ${points} points to every one of thee!"`,
    `The Herald clears his throat, straps on a false white beard, and drops his voice an octave. "Ahem. HO, HO, HO! Thy Herald could not be here today. I am Santa Claus, and I bring ${points} points to every soul in this realm. Merry Christmas to all, and to all a good night!"`,
];

// Shown after the speech on a rehearsal run, matching the other previews.
const christmasGiftRehearsalNote = () => '*(This be but a rehearsal — no points were truly bestowed, and no one was summoned.)*';

module.exports = { christmasGiftLines, christmasGiftRehearsalNote };
