// Pocket realms reached from houses: the Concord relic realms and the Folded Cellar.
(function () {
  const MG = BT.MG;

  // Hidden realms behind the portals.
  BT.POCKET_SPECS = [
    {
      id: 'sunvault', name: 'The Sun Vault', style: 'vault', depth: 2, w: 10, h: 10, seed: 6101,
      rooms: 2, loops: 0.15, secret: 0.1, encounter: 0.05, groupsMax: 2, upFrom: { map: 'q3', at: 'p' },
      monsters: [['clockwork', 3], ['skeleton_lord', 2], ['ghost', 1]],
      features: [
        { t: 'fight', at: 'far', groups: [['sunwarden', 1], ['clockwork', 2]], items: ['sunshard'], gold: 600,
          text: 'In a chamber of gold, a knight made of sunlight rises from a throne. "The Shard stays hidden until the faiths are one again. Prove you seek peace - by besting me!"' },
        { t: 'msg', at: 'near', text: 'Golden walls glow with a light that has no source. Carved everywhere: "ALL THAT SETS WILL RISE." Beneath it, in older letters: "...AND ALL THAT RISES MUST ONE DAY SET."', deco: { wallsAll: 'dc_sunrelief', near: 1 } },
        { t: 'chest', at: 'deadend', count: 2, tier: 3 },
        { t: 'shrine', at: 'room', faith: 'dawn' },
      ],
    },
    {
      id: 'mirrorhall', name: 'The Hall of Still Mirrors', style: 'mirror', depth: 2, w: 10, h: 10, seed: 6202,
      rooms: 2, loops: 0.15, secret: 0.1, encounter: 0.05, groupsMax: 2, upFrom: { map: 'y2', at: 'p' },
      monsters: [['siren', 2], ['ice_elemental', 1], ['ghost', 2]],
      features: [
        { t: 'fight', at: 'far', groups: [['mirror_maiden', 1], ['siren', 2]], items: ['stillglass'], gold: 600,
          text: 'Every mirror shows the same pale woman, and then she steps out of all of them at once. "Ysolde set me to keep the Hourglass still. Nothing leaves this hall. Nothing ever changes."' },
        { t: 'msg', at: 'near', text: 'Mirrors of ice line the halls. In them you see yourselves as you were a year ago - before the winter. Your reflections smile, frozen.', deco: { props: 'pr_mirror_stand', near: 1, propCount: 2 } },
        { t: 'chest', at: 'deadend', count: 2, tier: 3 },
        { t: 'teleport', at: 'corridor', count: 1 },
      ],
    },
    {
      id: 'roothollow', name: 'The Root-Hollow', style: 'hollow', depth: 2, w: 10, h: 10, seed: 6303,
      rooms: 2, loops: 0.15, secret: 0.1, encounter: 0.05, groupsMax: 2, upFrom: { map: 'u3', at: 'p' },
      monsters: [['spider', 3], ['wolf', 2], ['zombie', 1]],
      features: [
        { t: 'fight', at: 'far', groups: [['root_horror', 1], ['spider', 3]], items: ['heartseed'], gold: 600,
          text: 'At the heart of the hollow, roots knot around a single glowing seed. They tear free of the earth and rise into a shape of bark and claws. The Hollow will not give up its Seed without a fight.' },
        { t: 'msg', at: 'near', text: 'Roots glow faintly amber in the dark. Bones are tangled among them, very old and very peaceful. Someone has carved: "WE WENT DOWN, SO THAT OTHERS MIGHT GROW."', deco: { walls: 'dc_rootsigil', wallsAll: 'dc_amberroots', props: ['pr_roots', 'pr_bones'], near: 1, propCount: 2 } },
        { t: 'chest', at: 'deadend', count: 2, tier: 3 },
        { t: 'zone', flag: MG.F_DARK, size: 6, count: 1 },
      ],
    },
    // The Folded Cellar: Malthor's grief, folded into a pocket of stillness under his house.
    {
      id: 'folded1', name: 'The Folded Cellar', style: 'folded', depth: 2, w: 14, h: 14, seed: 7101,
      rooms: 4, loops: 0.15, secret: 0.15, encounter: 0.05, groupsMax: 2, upFrom: { map: 'l1', at: 'd' },
      monsters: [['memory', 3], ['porcelain', 2], ['ghost', 1]],
      features: [
        { t: 'stairs', dir: 'down', to: 'folded2', at: 'far' },
        { t: 'msg', at: 'near', text: 'The stair ends in Malthor\'s cellar: the same shelves, the same crack in the wall. But the cellar goes on. Every doorway opens on another copy of it, a little colder, a little more wrong.', deco: { walls: 'dc_shelf', wallsAll: 'dc_frost', near: 1 } },
        { t: 'msg', at: 'random', text: 'Wallpaper from the parlour upstairs has grown into the brick here, roses frozen mid-bloom. Through a doorframe that leads nowhere you hear, very faintly, a woman humming an Isenmark lullaby.', deco: { walls: ['dc_painting', 'dc_door'], near: 1 } },
        { t: 'msg', at: 'random', text: 'A toy soldier lies on the floor, the size of your hand. A few steps on lies another - the size of a man.', deco: { props: ['pr_rockinghorse', 'pr_trunk'], near: 1, propCount: 2 } },
        { t: 'chest', at: 'deadend', count: 2, tier: 3 },
        { t: 'fight', at: 'mid', groups: [['porcelain', 3]], text: 'Three porcelain soldiers, Lyra\'s toys grown huge in the stillness, turn their painted faces towards you and lower their halberds.' },
        { t: 'trap', at: 'corridor', count: 3, dmg: [3, 6], text: 'The corridor folds - for a moment you stand in two places at once!' },
        { t: 'spinner', at: 'corridor', count: 2 },
        { t: 'teleport', at: 'corridor', count: 1 },
        { t: 'shrine', at: 'room', faith: 'pale' },
        { t: 'zone', flag: MG.F_DARK, size: 6, count: 1 },
      ],
    },
    {
      id: 'folded2', name: 'The Folded Cellar - The Still Room', style: 'folded', depth: 3, w: 12, h: 12, seed: 7202,
      rooms: 3, loops: 0.15, secret: 0.1, encounter: 0.055, groupsMax: 3, upFrom: { level: 'folded1' },
      monsters: [['memory', 3], ['porcelain', 2], ['wraith', 1], ['siren', 1]],
      features: [
        { t: 'fight', at: 'far', setFlag: 'irena', groups: [['irena_echo', 1], ['memory', 2]], items: ['lyralyre', 'stilllily'], gold: 800,
          text: 'At the heart of the fold is a perfect copy of the parlour upstairs, warm and candlelit. A dark-haired woman in silver rises from the armchair, and frost spreads from her feet. "Nothing changes here. Nothing is lost here. He made it so. You will not take her things away."',
          after: 'The echo of Irena lowers her hands. For a moment her face is warm, and she looks past you, up the endless stair. "Tell him I was never in the ice. Tell him to let our girl go." She is gone. On the armchair lie a silver lyre and a still-lily pin.',
          deco: { walls: ['dc_fireplace', 'dc_portrait_family', 'dc_window'], near: 1, props: ['pr_armchair', 'pr_lamp', 'pr_harp'], propCount: 3, floor: 'rug_blue' } },
        { t: 'msg', at: 'near', text: 'Snowflakes hang motionless in the air. Your breath does not fog; it simply stops in front of your lips.', deco: { props: ['pr_icicles_hang'], near: 1, propCount: 2 } },
        { t: 'msg', at: 'random', text: 'Irena\'s letters, tied with a ribbon. The last, to Lyra, is unfinished: "My little sun, when I am gone, light a candle for the Still Mother and one for the Dawn, and do not let your father keep you in the dark..."', deco: { props: ['pr_candles', 'pr_desk'], near: 1, propCount: 2 } },
        { t: 'chest', at: 'deadend', count: 2, tier: 4 },
        { t: 'fight', at: 'mid', groups: [['memory', 4], ['porcelain', 2]], text: 'Memories gather out of the snow: a wedding, a birthday, a sickbed. They turn on you with Irena\'s grief.' },
        { t: 'trap', at: 'corridor', count: 3, dmg: [4, 6], text: 'Time stutters. A year passes through your bones in a heartbeat!' },
        { t: 'teleport', at: 'corridor', count: 1 },
        { t: 'spinner', at: 'corridor', count: 2 },
      ],
    },
  ];
})();
