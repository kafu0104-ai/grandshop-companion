// GRAND SHOP 商品マスター
// 表記ゆれ・所属・PRINCE CAT・マスコット分類は、このファイルだけで管理します。
const PRODUCT_MASTER = {
  units: [
    {
      id: 'starish',
      name: 'ST☆RISH',
      aliases: ['ST☆RISH', 'STARISH', 'スターリッシュ', 'シャイニング'],
      characters: [
        { id:'otoya', name:'一十木音也', shortName:'音也', aliases:['一十木 音也'] },
        { id:'masato', name:'聖川真斗', shortName:'真斗', aliases:['聖川 真斗'] },
        { id:'natsuki', name:'四ノ宮那月', shortName:'那月', aliases:['四ノ宮 那月'] },
        { id:'tokiya', name:'一ノ瀬トキヤ', shortName:'トキヤ', aliases:['一ノ瀬 トキヤ'] },
        { id:'ren', name:'神宮寺レン', shortName:'レン', aliases:['神宮寺 レン'] },
        { id:'sho', name:'来栖 翔', shortName:'翔', aliases:['来栖翔'] },
        { id:'cecil', name:'愛島セシル', shortName:'セシル', aliases:['愛島 セシル'] }
      ]
    },
    {
      id: 'quartet-night',
      name: 'QUARTET NIGHT',
      aliases: ['QUARTET NIGHT', 'カルテットナイト', 'カルナイ', 'シャイニング'],
      characters: [
        { id:'reiji', name:'寿 嶺二', shortName:'嶺二', aliases:['寿嶺二'] },
        { id:'ranmaru', name:'黒崎蘭丸', shortName:'蘭丸', aliases:['黒崎 蘭丸'] },
        { id:'ai', name:'美風 藍', shortName:'藍', aliases:['美風藍'] },
        { id:'camus', name:'カミュ', shortName:'カミュ', aliases:[] }
      ]
    },
    {
      id: 'heavens',
      name: 'HE★VENS',
      aliases: ['HE★VENS', 'HEAVENS', 'ヘヴンズ', 'ヘブンズ', 'レイジング'],
      characters: [
        { id:'eiichi', name:'鳳 瑛一', shortName:'瑛一', aliases:['鳳瑛一'] },
        { id:'kira', name:'皇 綺羅', shortName:'綺羅', aliases:['皇綺羅'] },
        { id:'nagi', name:'帝 ナギ', shortName:'ナギ', aliases:['帝ナギ'] },
        { id:'eiji', name:'鳳 瑛二', shortName:'瑛二', aliases:['鳳瑛二'] },
        { id:'van', name:'桐生院ヴァン', shortName:'ヴァン', aliases:['桐生院 ヴァン'] },
        { id:'yamato', name:'日向大和', shortName:'大和', aliases:['日向 大和'] },
        { id:'shion', name:'天草シオン', shortName:'シオン', aliases:['天草 シオン'] }
      ]
    }
  ],

  princeCats: [
    { id:'rosso', name:'ロッソ', characterId:'otoya' },
    { id:'cielo', name:'シエロ', characterId:'masato' },
    { id:'citron', name:'シトロン', characterId:'natsuki' },
    { id:'iris', name:'アイリス', characterId:'tokiya' },
    { id:'arancia', name:'アランチャ', characterId:'ren' },
    { id:'rosie', name:'ロージー', characterId:'sho' },
    { id:'lime', name:'ライム', characterId:'cecil' },
    { id:'verde', name:'ヴェルデ', characterId:'reiji' },
    { id:'granata', name:'グラナータ', characterId:'ranmaru' },
    { id:'lilla', name:'リラ', characterId:'ai' },
    { id:'acqua', name:'アクア', characterId:'camus' },
    { id:'rubino', name:'ルビーノ', characterId:'eiichi' },
    { id:'lapis', name:'ラピス', characterId:'kira' },
    { id:'rutile', name:'ルチル', characterId:'nagi' },
    { id:'amethyst', name:'アメジス', characterId:'eiji' },
    { id:'carnelian', name:'カネリア', characterId:'van' },
    { id:'paratia', name:'パラチア', characterId:'yamato' },
    { id:'peridot', name:'ペリド', characterId:'shion' }
  ],

  mascots: [
    { id:'onpukun', name:'おんぷくん', aliases:['おんぷ君'] },
    { id:'piyochan', name:'ピヨちゃん', aliases:['ピヨチャン'] },
    { id:'penguin', name:'ペンギン', aliases:['トキペン'] }
  ],

  unitVariants: {
    '夏の星': 'starish',
    '夏の夜': 'quartet-night'
  }
};

const normalizeMasterName = value => String(value || '')
  .normalize('NFKC')
  .toLowerCase()
  .replace(/[\s　・★☆]/g, '');

const MASTER_INDEX = (() => {
  const units = new Map();
  const characters = new Map();
  const characterAliases = new Map();

  PRODUCT_MASTER.units.forEach(unit => {
    units.set(unit.id, unit);
    unit.characters.forEach(character => {
      const info = { ...character, unitId:unit.id, unit:unit.name };
      characters.set(character.id, info);
      [character.name, character.shortName, ...(character.aliases || [])].forEach(alias => {
        characterAliases.set(normalizeMasterName(alias), info);
      });
    });
  });

  const princeCats = new Map();
  const princeCatAliases = new Map();
  PRODUCT_MASTER.princeCats.forEach(cat => {
    const character = characters.get(cat.characterId);
    const info = { ...cat, character:character.name, characterId:character.id, unit:character.unit, unitId:character.unitId };
    princeCats.set(cat.id, info);
    princeCatAliases.set(normalizeMasterName(cat.name), info);
  });

  const mascots = new Map();
  const mascotAliases = new Map();
  PRODUCT_MASTER.mascots.forEach(mascot => {
    const info = { ...mascot };
    mascots.set(mascot.id, info);
    [mascot.name, ...(mascot.aliases || [])].forEach(alias => mascotAliases.set(normalizeMasterName(alias), info));
  });

  return { units, characters, characterAliases, princeCats, princeCatAliases, mascots, mascotAliases };
})();

function findContained(map, normalizedText) {
  for (const [key, value] of map.entries()) {
    if (key && normalizedText.includes(key)) return value;
  }
  return null;
}

function enrichProduct(product) {
  const normalizedVariant = normalizeMasterName(product.variant);
  const normalizedText = normalizeMasterName(`${product.name || ''} ${product.variant || ''}`);

  let unitInfo = null;
  let characterInfo = MASTER_INDEX.characterAliases.get(normalizedVariant) || null;
  let princeCatInfo = MASTER_INDEX.princeCatAliases.get(normalizedVariant) || null;
  let mascotInfo = MASTER_INDEX.mascotAliases.get(normalizedVariant) || null;

  if (!characterInfo) characterInfo = findContained(MASTER_INDEX.characterAliases, normalizedText);
  if (!princeCatInfo) princeCatInfo = findContained(MASTER_INDEX.princeCatAliases, normalizedText);
  if (!mascotInfo) mascotInfo = findContained(MASTER_INDEX.mascotAliases, normalizedText);

  if (princeCatInfo) characterInfo = MASTER_INDEX.characters.get(princeCatInfo.characterId);
  if (characterInfo) unitInfo = MASTER_INDEX.units.get(characterInfo.unitId);

  const variantUnitId = PRODUCT_MASTER.unitVariants[product.variant];
  if (!unitInfo && variantUnitId) unitInfo = MASTER_INDEX.units.get(variantUnitId);

  const searchTerms = new Set([
    product.name, product.variant, product.code,
    unitInfo?.name,
    characterInfo?.name, characterInfo?.shortName,
    ...(characterInfo?.aliases || []),
    princeCatInfo?.name,
    mascotInfo?.name,
    ...(mascotInfo?.aliases || []),
    mascotInfo ? 'マスコットキャラクター' : null
  ].filter(Boolean));

  return {
    ...product,
    unitId: unitInfo?.id || null,
    unit: unitInfo?.name || null,
    characterId: characterInfo?.id || null,
    character: characterInfo?.name || null,
    princeCatId: princeCatInfo?.id || null,
    princeCat: princeCatInfo?.name || null,
    mascotId: mascotInfo?.id || null,
    mascot: mascotInfo?.name || null,
    affiliation: princeCatInfo ? 'prince-cat' : mascotInfo ? 'mascot' : characterInfo || unitInfo ? 'idol' : 'other',
    searchText: [...searchTerms].join(' ').toLowerCase()
  };
}
