// Enterable houses: room plans, furniture and events for every floor.
(function () {
  const MG = BT.MG;

  // ---------------- Enterable houses ----------------
  // Each floor is a room plan (see MG.fromRooms): `plan` holds room letters, `marks` event letters
  // (e exit, u/d stairs, n/o/q notes, c chest, f fight, m riddle mouth, p portal), `doors` the
  // openings between rooms ('x,y,d' with d = n|e|s|w; ',secret' looks like wall, ',cellar' a cellar door),
  // `rooms` the wallpaper, floor and ceiling of each room, `decals` wall pictures ('x,y,d,dc_name')
  // and `props` the furniture ('x,y,pr_name,side' where side n|e|s|w pushes it against that wall, c = centre).
  const ROOM = {
    shop: { wall: 'wall_clocks', floor: 'floor_oak', ceil: 'ceil_plaster' },
    kitchen: { wall: 'wall_stone', floor: 'floor_kitchen', ceil: 'ceil_plaster' },
    hallRose: { wall: 'wall_rose', floor: 'floor_oak', ceil: 'ceil_plaster' },
    hallBlue: { wall: 'wall_blue', floor: 'floor_oak', ceil: 'ceil_plaster' },
    workshop: { wall: 'wall_plaster', floor: 'floor_oak', ceil: 'ceil_plaster' },
    bedRose: { wall: 'wall_rose', floor: 'rug_red', ceil: 'ceil_plaster' },
    bedBlue: { wall: 'wall_blue', floor: 'rug_blue', ceil: 'ceil_plaster' },
    parlour: { wall: 'wall_blue', floor: 'rug_blue', ceil: 'ceil_plaster' },
    study: { wall: 'wall_books', floor: 'rug_red', ceil: 'ceil_plaster' },
    attic: { wall: 'wall_attic', floor: 'floor_attic', ceil: 'ceil_attic' },
    mill: { wall: 'wall_mill', floor: 'floor_mill', ceil: 'ceil_mill' },
    child: { wall: 'wall_child', floor: 'floor_child', ceil: 'ceil_plaster' },
  };
  const inner = (r) => Object.assign({}, r, { windows: false });
  BT.INTERIORS = [
    // ---- Orrin the Clockmaker (Dawn) ----
    {
      id: 'q1', name: 'Orrin\'s House - Shop',
      plan: ['SSSSKK', 'SSSSKK', 'SSSSHH', 'SSSSHH'],
      marks: ['......', '.n...c', '......', '.e...u'],
      rooms: { S: ROOM.shop, K: ROOM.kitchen, H: ROOM.hallRose },
      doors: ['3,0,e', '3,2,e', '4,1,s'],
      decals: ['1,3,s,dc_door', '2,0,n,dc_sun_disc', '0,1,w,dc_clockface', '5,0,e,dc_pots', '4,0,n,dc_shelf', '4,3,s,dc_painting'],
      props: ['1,0,pr_counter,n', '3,0,pr_clock_tall,n', '0,3,pr_clock_tall,w', '2,2,pr_table,c', '5,0,pr_cupboard,n', '4,2,pr_coatrack,n'],
      ev: {
        e: { t: 'warp', label: 'out', to: 'town', x: 13, y: 8, d: 1, text: 'You step back out into the snow.' },
        u: { t: 'warp', label: 'up', to: 'q2', at: 'd' },
        n: { t: 'msg', text: 'Dozens of clocks cover the walls, every one stopped at the same minute. A sun disc of the Dawn hangs over the counter. On a slate: "CLOSED - Orrin has gone to the Dawn. Pray for him."' },
        c: { t: 'chest', tier: 1 },
      },
    },
    {
      id: 'q2', name: 'Orrin\'s House - Workshop',
      plan: ['WWWWBB', 'WWWWBB', 'WWWWLL', 'WWWWLL'],
      marks: ['....n.', '......', '.....u', '.....d'],
      rooms: { W: ROOM.workshop, B: ROOM.bedRose, L: inner(ROOM.workshop) },
      doors: ['3,1,e', '3,3,e', '4,1,s'],
      decals: ['0,1,w,dc_tools', '3,0,n,dc_gears', '1,3,s,dc_clockface', '2,3,s,dc_shelf', '4,3,s,dc_sun_disc'],
      props: ['1,0,pr_workbench,n', '2,0,pr_gearwheel,n', '0,2,pr_clock_tall,w', '2,2,pr_table,c', '4,0,pr_desk,n', '5,0,pr_bed,n', '5,1,pr_wardrobe,e'],
      ev: {
        d: { t: 'warp', label: 'down', to: 'q1', at: 'u' },
        u: { t: 'warp', label: 'up', to: 'q3', at: 'd' },
        n: { t: 'msg', text: 'Orrin\'s journal: "When the Dawn\'s crusade came to Vael-Harrow, my great-grandmother hid the Sun Shard so no zealot could use it to start another war. The way to it is above, behind the clock wall. Only one who knows what a clock is may pass."' },
      },
    },
    {
      id: 'q3', name: 'Orrin\'s House - Attic',
      plan: ['AAAAHH', 'AAAAHH', 'AAAAAA', 'AAAAAA'],
      marks: ['...n.m', '.....p', '..f...', '.....d'],
      rooms: { A: ROOM.attic, H: inner(ROOM.attic) },
      doors: ['3,0,e,secret'],
      decals: ['3,0,e,dc_clockwall', '3,1,e,dc_clockwall', '4,0,n,dc_sun_disc'],
      props: ['0,0,pr_trunk,n', '0,3,pr_trunk,w', '1,0,pr_spinning_wheel,n', '2,1,pr_cobweb_hang,c', '4,3,pr_sacks,s'],
      ev: {
        d: { t: 'warp', label: 'down', to: 'q2', at: 'u' },
        n: { t: 'msg', text: 'Under the slanted roof stands a wall made entirely of clock faces. One of them, near the floor, ticks - the only moving clock in the whole city. (Walls are not always what they seem.)' },
        f: { t: 'fight', groups: [['clockwork', 2]], text: 'Two brass clockwork sentinels whirr to life and march at you!' },
        m: { t: 'riddle', flag: 'riddle_clock', q: 'I have a face but no eyes, and hands that cannot hold. I tell you the one thing I cannot keep. What am I?', a: ['clock', 'a clock', 'clocks', 'the clock', 'watch'],
          right: '"A clock," the mouth agrees, and all the clock faces in the attic begin to tick at once. Behind you, a doorway of golden light opens.' },
        p: { t: 'warp', label: 'portal', to: 'sunvault', require: { flag: 'riddle_clock' }, locked: 'An empty brass frame shaped like a sun. It is cold and dark. Perhaps the speaking stone beside it holds the key.' },
      },
    },
    // ---- the Widow Ysolde (Pale Hour) ----
    {
      id: 'y1', name: 'Ysolde\'s House - Parlour',
      plan: ['PPPDDD', 'PPPDDD', 'HHHKKK', 'HHHKKK'],
      marks: ['.n....', '......', '..u...', 'e....c'],
      rooms: { P: ROOM.parlour, D: ROOM.hallBlue, K: ROOM.kitchen, H: ROOM.hallBlue },
      doors: ['1,2,n', '2,0,e', '4,1,s', '2,3,e'],
      decals: ['0,3,s,dc_door', '1,0,n,dc_portrait_ysolde', '0,0,n,dc_pale_altar', '0,1,w,dc_fireplace_cold', '4,0,n,dc_tapestry', '5,2,e,dc_pots', '3,3,s,dc_shelf', '1,3,s,dc_painting'],
      props: ['2,0,pr_plant_frozen,n', '2,1,pr_armchair,e', '4,1,pr_dining,c', '5,0,pr_cupboard,e', '4,3,pr_cupboard,s', '0,2,pr_coatrack,w'],
      ev: {
        e: { t: 'warp', label: 'out', to: 'town', x: 19, y: 6, d: 1, text: 'You step back out into the snow.' },
        u: { t: 'warp', label: 'up', to: 'y2', at: 'd' },
        n: { t: 'msg', text: 'A cold, tidy parlour. Nothing has been moved in a long, long time. A small altar of the Pale Hour holds a candle that has never been lit, and a portrait of a stern woman in silver: "Ysolde, Keeper of the Still Hourglass."' },
        c: { t: 'chest', tier: 2 },
      },
    },
    {
      id: 'y2', name: 'Ysolde\'s House - Upper Room',
      plan: ['MMMBBB', 'SSSBBB', 'SSSBBB', 'LLLBBB'],
      marks: ['m.p...', '......', 'n.....', 'd.....'],
      rooms: { M: Object.assign(inner(ROOM.hallBlue), { floor: 'mirror_floor' }), S: Object.assign({}, ROOM.study, { floor: 'rug_blue' }), B: ROOM.bedBlue, L: inner(ROOM.hallBlue) },
      doors: ['1,1,n,secret', '1,3,n', '2,1,e', '2,3,e'],
      decals: ['1,1,n,dc_mirror_wall', '0,1,n,dc_painting', '2,1,n,dc_shelf', '4,0,n,dc_painting', '1,0,n,dc_frost', '0,0,w,dc_frost'],
      props: ['0,2,pr_desk,w', '2,2,pr_bookcase,e', '5,0,pr_bed,n', '3,0,pr_vanity,n', '5,3,pr_wardrobe,e', '4,3,pr_dresser,s', '1,0,pr_icicles_hang,c'],
      ev: {
        d: { t: 'warp', label: 'down', to: 'y1', at: 'u' },
        n: { t: 'msg', text: 'A letter, never sent: "Sevrine, you twist the Mother\'s word. Stillness is for grief to rest in - not a prison for the living. I have hidden the Hourglass where the dark keeps it. Look where the north wall looks back at you." - Ysolde' },
        m: { t: 'riddle', flag: 'riddle_dark', q: 'The more of me there is, the less you see. The Still Mother wraps the world in me each winter night. What am I?', a: ['darkness', 'dark', 'the dark', 'night', 'the night', 'blackness'],
          right: '"Darkness," the mouth breathes. The mirror beside it clouds with frost, then clears - and shows not your faces, but a pale hall beyond.' },
        p: { t: 'warp', label: 'portal', to: 'mirrorhall', require: { flag: 'riddle_dark' }, locked: 'A tall mirror rimed with frost. Your reflection does not move when you do. It waits for something.' },
      },
    },
    // ---- Bramwick's Old Mill (Deep Root) ----
    {
      id: 'u1', name: 'Bramwick\'s Mill - Grinding Floor',
      plan: ['GGGGSS', 'GGGGSS', 'GGGGEE', 'GGGGEE'],
      marks: ['.....c', '.n....', '......', 'u....e'],
      rooms: { G: ROOM.mill, S: inner(ROOM.mill), E: ROOM.mill },
      doors: ['4,2,w', '4,2,n'],
      decals: ['5,3,s,dc_door', '1,0,n,dc_axle_roots', '3,3,s,dc_root_carving', '5,1,e,dc_shelf'],
      props: ['2,1,pr_millstone,c,0.9', '0,0,pr_sacks,n', '3,0,pr_flourbin,n', '4,0,pr_barrel,n', '5,1,pr_crate,e', '0,2,pr_sacks,w'],
      ev: {
        e: { t: 'warp', label: 'out', to: 'town', x: 7, y: 12, d: 3, text: 'You step back out into the snow.' },
        u: { t: 'warp', label: 'up', to: 'u2', at: 'd' },
        n: { t: 'msg', text: 'The great millstone is frozen to its bed. Roots have grown up through the floorboards and twined around the axle, carved here and there with the tree-and-ring of the Deep Root.' },
        c: { t: 'chest', tier: 1 },
      },
    },
    {
      id: 'u2', name: 'Bramwick\'s Mill - Sack Loft',
      plan: ['LLLLBB', 'LLLLBB', 'LLLLBB', 'LLLLBB'],
      marks: ['...n.u', '......', '....f.', 'd.....'],
      rooms: { L: ROOM.mill, B: inner(ROOM.mill) },
      doors: ['3,1,e', '3,3,e'],
      decals: ['3,0,n,dc_root_carving', '0,1,w,dc_gears'],
      props: ['0,0,pr_sacks,n', '1,0,pr_sacks,n', '0,1,pr_sacks,w', '2,2,pr_gearwheel,c', '5,3,pr_sacks,e', '4,0,pr_sacks,n', '1,3,pr_barrel,s'],
      ev: {
        d: { t: 'warp', label: 'down', to: 'u1', at: 'u' },
        u: { t: 'warp', label: 'up', to: 'u3', at: 'd' },
        n: { t: 'msg', text: 'Flour sacks, burst and frozen. Scratched into a beam: "The Seed sleeps down in the Hollow. Old Bramwick took the way up to go down. Funny, that."' },
        f: { t: 'fight', groups: [['giant_rat', 4], ['wererat', 1]], text: 'Rats boil out of the frozen grain sacks!' },
      },
    },
    {
      id: 'u3', name: 'Bramwick\'s Mill - Cap Room',
      plan: ['CCCCHH', 'CCCCHH', 'CCCCCC', 'CCCCCC'],
      marks: ['.....m', '....p.', '.n....', '.....d'],
      rooms: { C: ROOM.mill, H: { wall: 'hollow', floor: 'hollowfloor', ceil: 'hollowceil', windows: false } },
      doors: ['3,0,e,secret'],
      decals: ['3,0,e,dc_roots', '2,0,n,dc_sail_window', '0,1,w,dc_gears', '4,0,n,dc_amberroots', '5,1,e,dc_roots'],
      props: ['1,0,pr_gearwheel,n', '0,3,pr_sacks,w', '2,3,pr_trunk,s', '4,0,pr_mushrooms,n'],
      ev: {
        d: { t: 'warp', label: 'down', to: 'u2', at: 'u' },
        n: { t: 'msg', text: 'Wind moans through the mill\'s cap. The great sails outside are locked with ice. In the north-east corner, a root has pushed straight through the wall - and the wall around it sounds hollow.' },
        m: { t: 'riddle', flag: 'riddle_root', q: 'I lie beneath every tree. I drink, but I am never thirsty. I hold up the tallest oak, yet no one ever sees me. What am I?', a: ['root', 'roots', 'a root', 'the root', 'the roots'],
          right: '"Root," sighs the mouth, and the floor beside you cracks open. Warm air and the smell of deep earth rise from a hollow lined with glowing roots.' },
        p: { t: 'warp', label: 'portal', to: 'roothollow', require: { flag: 'riddle_root' }, locked: 'A knot of roots covers the floor here, tight as a fist. Something lies beneath.' },
      },
    },
    // ---- Malthor's family house (the Folded House) ----
    {
      id: 'l1', name: 'Malthor\'s House - Ground Floor',
      plan: ['PPPKKK', 'PPPKKK', 'HHHHCC', 'HHHHCC'],
      marks: ['.n....', '....o.', '...u..', '.e...d'],
      rooms: { P: ROOM.parlour, K: ROOM.kitchen, H: ROOM.hallRose, C: inner(ROOM.kitchen) },
      doors: ['1,2,n', '3,2,n', '3,3,e,cellar'],
      decals: ['1,3,s,dc_door', '1,0,n,dc_portrait_family', '0,1,w,dc_fireplace_cold', '5,0,n,dc_pots', '4,0,n,dc_shelf', '0,2,w,dc_painting', '5,2,e,dc_frost', '4,2,n,dc_frost', '5,3,s,dc_frost'],
      props: ['2,0,pr_harp,n', '0,0,pr_armchair,n', '2,1,pr_plant_frozen,e', '4,1,pr_dining,c', '5,1,pr_cupboard,e', '0,2,pr_coatrack,w', '4,3,pr_icicles_hang,c', '5,2,pr_barrel,e'],
      ev: {
        e: { t: 'warp', label: 'out', to: 'town', x: 16, y: 2, d: 2, text: 'You step back out into the snow.' },
        u: { t: 'warp', label: 'up', to: 'l2', at: 'd' },
        d: { t: 'warp', label: 'down', to: 'folded1', text: 'The cellar stairs go down. And down. Far below, they end in the same cellar you just left - only colder.' },
        n: { t: 'msg', text: 'A family portrait hangs over the cold hearth: a tall silver-haired man, a dark-haired woman in Isenmark silver with a lily pin, and a small girl between them, all three laughing. Malthor, Irena and Lyra. By the window stands a silver harp, its strings furred with frost.' },
        o: { t: 'msg', text: 'The table is set for three. The plates are rimed with frost and the bread has turned to stone. No one has eaten here in eight years.' },
      },
    },
    {
      id: 'l2', name: 'Malthor\'s House - Upper Floor',
      plan: ['YYYBBB', 'YYYBBB', 'LLSSSS', 'LLSSSS'],
      marks: ['.n..o.', '......', '......', 'd...q.'],
      rooms: { Y: ROOM.child, B: ROOM.bedBlue, L: inner(ROOM.hallRose), S: ROOM.study },
      doors: ['0,2,n', '1,2,e', '4,2,n'],
      decals: ['1,0,n,dc_drawings', '3,0,n,dc_pale_altar', '3,3,s,dc_shelf', '5,2,e,dc_runes', '2,3,s,dc_clockface'],
      props: ['0,0,pr_bed_child,n', '2,0,pr_dollhouse,n', '2,1,pr_rockinghorse,e', '5,0,pr_bed,n', '4,1,pr_vanity,s', '3,1,pr_wardrobe,w', '4,3,pr_desk,s', '5,3,pr_bookcase,e', '3,2,pr_trunk,n'],
      ev: {
        d: { t: 'warp', label: 'down', to: 'l1', at: 'u' },
        n: { t: 'msg', text: 'A child\'s room, kept exactly as it was the winter her mother died. Drawings are pinned to the wall: a sun, a snowflake, a tree with its roots in a ring, and three stick figures holding hands. Pencil marks on the door frame measure a girl\'s height, and stop at ten years old.' },
        o: { t: 'msg', text: 'Irena\'s side of the bed is still made. On her little Pale Hour altar the candle has never been lit. Her jewel box is empty except for a note in Malthor\'s hand: "I took your things down to the cellar, where nothing will change."' },
        q: { t: 'msg', text: 'Malthor\'s study. The newest notes are in a shaking hand: "Since the Rite, the cellar stairs do not end. I went down a hundred steps and came back up into my own cellar - and the candle I carried was a year older. Irena\'s things are down there. So is something that wears her face. I cannot go again."' },
      },
    },
  ];
})();
