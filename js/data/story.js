// Story text: the intro, tavern rumors, what each faith's priests say, Lyra's lines and the endings.
(function () {
  const D = BT.D;

  D.STORY = {
    title: 'Winter of Velmoor',
    subtitle: 'A tale in the spirit of The Bard\'s Tale',
    intro: [
      'Three faiths share the north. Velmoor prays to the Dawn: <i>all that sets will rise again.</i> Isenmark, beyond the mountains, kneels to the Pale Hour and its Still Mother: <i>what is loved should never change.</i> And beneath Velmoor\'s streets sleep the Old Kings of Vael-Harrow, who followed the Deep Root: <i>we go down, so that others may grow.</i> The Dawn\'s crusaders built Velmoor on their ruins three hundred years ago.',
      'When Lyra, daughter of the court archmage Malthor, lay dying of a wasting fever, the Dawn\'s priests told him to let her go to the morning. He would not. He went instead to Matron Sevrine of the Pale Hour, who taught him the Rite of Stillness.',
      'Malthor froze the moment of Lyra\'s life in a crystal of ice - and the rite spilled out of his tower and froze the whole city with her. That was a year ago. The snow has never stopped.',
      'Now the faiths are at each other\'s throats. The Dawn blames the Pale Hour, whose zealots dance in the snow and call the winter a miracle. The Root-folk say the dead walk because Malthor chained their king. The city guard serves the archmage under a curse, and the gates are sealed by ice.',
      'The Adventurers\' Guild has posted a call for heroes. Someone must climb Malthor\'s tower and end the winter - whatever the gods may think of it.',
    ],
    rumors: [
      // index chosen by progress
      ['The tower door opens only to the Moonstone Key. Malthor gave it to Kargath, the Warden of the Iron Keep.',
        'The Keep\'s gate answers only to the Iron Sigil, and that lies with the Old Kings in the crypt.',
        'And the crypt key? The Rat King\'s thieves stole it from old Thessaly, the Root-Warden. They lair in the sewers... right under this tavern. The cellar door is over there.',
        'Keep your voice down about gods in here. Last week a Dawn priest and two Pale Hour zealots broke every chair in the place.',
        'Old houses in this city hide old secrets. The clockmaker\'s, the widow Ysolde\'s, Bramwick\'s mill... Madame Zeyla talks about them when she\'s had a few. Something about a Concord.'],
      ['You have the crypt key? Then the graveyard is open to you. Beware: old King Morvane does not sleep anymore.',
        'Thessaly says Morvane was the last king-priest of the Deep Root. Chaining him in undeath is the worst sin her faith knows.',
        'In the crypt a stone mouth asks a riddle. They say the answer is under your feet with every step.'],
      ['The Iron Sigil! Then the Keep\'s gate will open. Kargath was the Dawn\'s finest knight. Brother Caddoc wants him burned. Free him from the curse, if you can.',
        'Matron Sevrine has been seen walking to the Keep. Some say she still advises the archmage.',
        'The Keep\'s riddle-mouth asks of something always coming, never here.'],
      ['The Moonstone Key... then it is time. Malthor\'s tower stands in the north-east of the city.',
        'Lyra\'s mother came from Isenmark and prayed to the Still Mother. Lyra was raised in the Dawn. Poor girl had a foot in two faiths.',
        'They say the tower asks the name of the one who sleeps in the crystal. And at the top it asks what he tried to stop.'],
      ['Spring is coming. Drink up, heroes - this round is on the house!',
        'Would you believe it? A Dawn priest and a Pale Hour sister came in together yesterday. Shared a bottle. Strange days.'],
    ],
    // What each faith's priest says, by story progress (0..4)
    faithTalk: {
      dawn: [
        'High Priestess Aurelle lowers her eyes. "I told Malthor the truth: that Lyra would rise with the Dawn, as all things do. He did not want the truth. He went to the Pale Hour instead." Behind her, Brother Caddoc mutters: "And now their witches dance in our snow."',
        '"You bring back the crypt key? The Root-Warden will be grateful," says Aurelle. Caddoc snorts. "The Root is a dead faith for dead men. Let them rot below."',
        '"Kargath was a knight of the Dawn," Aurelle says quietly. "Malthor made him a jailer. If you must face him, pray he remembers who he was."',
        '"The Pale Hour taught Malthor his rite," Caddoc says. "When the winter breaks, their hall will burn." Aurelle stops him with a hand on his arm. "The sun rises on all of us, Brother. Even on them."',
        'Bells ring across the city. Aurelle smiles. "The Dawn came. As it always does."',
      ],
      pale: [
        'Matron Sevrine smiles, serene as frost. "You look at the snow and see a curse. I see a father\'s love made perfect. The Still Mother keeps what we love - forever. Is that so terrible?"',
        '"The crypt? Let the Old Kings sleep in the cold. Nothing decays in Ysra\'s keeping," says Sevrine.',
        '"Yes, I taught Malthor the Rite of Stillness," Sevrine says, without shame. "His wife was one of us. He came to me weeping. What would you have done?"',
        'Sevrine looks out at the endless snow, and for the first time she seems unsure. "The Mother keeps what we love... but Lyra is not loved by being kept. Perhaps I taught him the wrong prayer."',
        '"Even the Still Mother lets go, in the end," Sevrine whispers. "Perhaps that is the deepest stillness of all."',
      ],
      root: [
        'Old Thessaly holds her lantern to your faces. "Three hundred years ago the Dawn came with swords and built their city on our kings. We forgave. But now the archmage has chained King Morvane in undeath. The dead cannot go down. That is why they walk."',
        '"You found my key! Bless you. Go down, then - and if you meet King Morvane, set him free. A king should feed the roots, not guard a wizard\'s trinkets."',
        '"Morvane is at rest," Thessaly breathes. "I felt it in the roots, like a long sigh. Thank you. The Root remembers."',
        '"The girl in the crystal cannot go down and cannot rise," Thessaly says. "She is caught between all three of our gods. Someone must help her choose."',
        '"She went down, so the spring could come up," Thessaly says, planting a seed in the thawing earth. "That is the oldest prayer there is."',
      ],
    },
    lyra: {
      sewers: 'A pale girl in a white nightgown stands in the dark, her feet not quite touching the water. "Please... my father did not mean any of this. The Rat King has the key to the crypt. Find it." She fades like breath on a cold window.',
      crypt: 'The pale girl again, shimmering among the tombs. "King Morvane taught my father magic, long before any priest did. Father bound him here to guard the Iron Sigil. Set the old king free - let him go down to the roots." She is gone.',
      keep: 'The pale girl stands beside an iced-over window. "Kargath carried me on his shoulders at the Dawn festival. Mother took me to the Pale Hall to light candles for the Still Mother. Nobody ever asked which god I liked best." She almost laughs, then vanishes.',
      tower: 'The pale girl waits on the stair. "You know who I am now, don\'t you? I am Lyra. The Dawn says I should rise, the Pale Hour says I should stay, the Root says I should go down. My body sleeps in the crystal above, and I cannot do any of them. Help my father let me go."',
    },
    ending: [
      'Malthor falls to his knees. The staff slips from his fingers, and the blue gem cracks.',
      '"Father," says a soft voice. Lyra\'s spirit kneels beside him, warm light where there was only ice. "It\'s time. Let me go."',
      'The archmage weeps, and for the first time in a year he lets the moment pass. The crystal melts. Lyra smiles, and is gone.',
      'Across Velmoor the snow turns to rain, the rain to sunlight. Water runs in the gutters, the ice on the gates groans and breaks, and somewhere a bird begins to sing.',
      'Three days later the whole city gathers in the old graveyard. Thessaly of the Deep Root lays Lyra\'s locket beneath the great oak. Aurelle of the Dawn lights a candle at sunrise. And Matron Sevrine of the Pale Hour, weeping, lets the candle burn down. For one morning, the three faiths pray together.',
    ],
    endingFaith: {
      dawn: 'The Dawn\'s bells ring out over the thaw. Brother Caddoc wanted the Pale Hall burned - but it was Aurelle, and your example, that kept the torches cold.',
      pale: 'Sevrine closes the Pale Hall\'s doors to mourn, and opens them again in spring. "The Mother keeps what we love," she preaches now, "in memory - not in ice."',
      root: 'Where the locket was buried, a green shoot pushes up through the last of the snow. Thessaly says it is a good sign. The Root remembers.',
      none: 'You never knelt at any of their altars. Perhaps that is why all three of them could stand beside you.',
    },
    endingLast: 'Spring has come to Velmoor. And in the Frostbitten Flagon, a bard is already writing the song of your deeds.',
  };
})();
