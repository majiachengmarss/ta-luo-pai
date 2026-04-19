import fs from 'fs';
import path from 'path';

const MAJOR_ARCANA = [
  { id: '00', name: "愚者", meaning: "新的开始，乐观，对宇宙的信任。这是一个冒险的召唤。", advice: "迈出信任的一步，宇宙会保护纯真之心。" },
  { id: '01', name: "魔术师", meaning: "显化，机智，力量。你已经拥有了你需要的工具。", advice: "运用你的意志力来创造你想要的现实。" },
  { id: '02', name: "女祭司", meaning: "直觉，神圣的知识，潜意识。向内看。", advice: "倾听你的梦境，答案隐藏在沉静之中。" },
  { id: '03', name: "皇后", meaning: "丰饶，女性力，自然。创造性的表达正在蓬勃发展。", advice: "滋养你自己，像母亲一样关爱你的每一个创意。" },
  { id: '04', name: "皇帝", meaning: "权威，结构，控制。现在是建立秩序的时候。", advice: "运用逻辑和自律，为你的生活打下坚实的基础。" },
  { id: '05', name: "教皇", meaning: "传统，精神智慧，信仰。遵循现有的规则或导师。", advice: "在传统和知识中寻找安慰，尊重神圣的仪式。" },
  { id: '06', name: "恋人", meaning: "爱，和谐，价值观的对齐。重要的决定即将到来。", advice: "遵循你的心，但在决策中保持诚实和整合。" },
  { id: '07', name: "战车", meaning: "胜利，意志力，自律。克服障碍并获得控制。", advice: "保持专注，即使在相互冲突的力量之间也要稳步前进。" },
  { id: '08', name: "力量", meaning: "勇气，耐力，慈悲。通过内在的宁静来驯服挑战。", advice: "展示温柔的力量。慈悲比单纯的武力更强大。" },
  { id: '09', name: "隐士", meaning: "内省，孤独，指引。现在是退后并寻求真理的时候。", advice: "在孤独中寻找答案。你内心的光就是你的向导。" },
  { id: '10', name: "命运之轮", meaning: "变化，周期，命运。命运的轮子正在转动。", advice: "接受不可避免的变化，顺势而为，而非逆流而动。" },
  { id: '11', name: "正义", meaning: "公平，因果，平衡。真理必须显露出来。", advice: "为你的行为负责。业力是公正的。" },
  { id: '12', name: "倒吊人", meaning: "牺牲，释放，新的视角。有时停下来就是前进。", advice: "换个角度看世界。放弃控制，接受现在的状态。" },
  { id: '13', name: "死亡", meaning: "结束，转变，重生。旧的必须消逝以让位给新的。", advice: "不要害怕告别。每一个终点都是一个新的起点。" },
  { id: '14', name: "节制", meaning: "平衡，节制，耐心。寻找中间道路。", advice: "调和对立面。保持耐心，你正在炼金你的生活。" },
  { id: '15', name: "恶魔", meaning: "束缚，成瘾，幻象。你被自己创造的阴影困住了。", advice: "承认你的阴影。打破那些限制你自由的锁链。" },
  { id: '16', name: "高塔", meaning: "剧变，灾难，觉醒。不稳固的基础正在崩溃。", advice: "拥抱混乱。只有旧结构倒塌，新真理才能升起。" },
  { id: '17', name: "星星", meaning: "希望，信仰，更新。在黑暗之后的慰藉。", advice: "相信宇宙。治愈正在发生，光就在前方。" },
  { id: '18', name: "月亮", meaning: "幻觉，恐惧，焦虑。潜意识的阴影浮现。", advice: "信任你的直觉而非感官。在迷雾中谨慎前行。" },
  { id: '19', name: "太阳", meaning: "快乐，成功，活力。一切都清晰而充满希望。", advice: "向世界展示你的光芒。庆祝你的成就和喜悦。" },
  { id: '20', name: "审判", meaning: "觉醒，重生，内在的召唤。评价你过去的经验。", advice: "听从你的召唤。是时候宽恕并继续前进了。" },
  { id: '21', name: "世界", meaning: "完成，融合，成功。旅程达到了圆满。", advice: "庆祝你的成就。你已经达到了一个主要的里程碑。" }
];

const SUIT_THEMES: Record<string, {name: string, theme: string}> = {
    'wands': { name: '权杖', theme: '行动、创造力、激情与意志' },
    'cups': { name: '圣杯', theme: '情感、关系、直觉与爱' },
    'swords': { name: '宝剑', theme: '思想、挑战、冲突与智慧' },
    'pentacles': { name: '星币', theme: '物质、财富、工作与现实' }
};

const NUM_THEMES: Record<number, {name: string, keyword: string}> = {
    1: { name: '王牌 (Ace)', keyword: '新的萌芽与纯粹的能量' },
    2: { name: '二 (II)', keyword: '平衡、选择与二元性' },
    3: { name: '三 (III)', keyword: '成长、合作与初步的显化' },
    4: { name: '四 (IV)', keyword: '稳定、结构与暂时的停歇' },
    5: { name: '五 (V)', keyword: '冲突、损失与不可避免的改变' },
    6: { name: '六 (VI)', keyword: '和谐、恢复与相互的支持' },
    7: { name: '七 (VII)', keyword: '评估、挑战与内在的坚持' },
    8: { name: '八 (VIII)', keyword: '快速的移动、精通与重复' },
    9: { name: '九 (IX)', keyword: '接近完成、韧性与满足' },
    10: { name: '十 (X)', keyword: '极致的完成、负担与周期的结束' },
    11: { name: '侍从 (Page)', keyword: '充满好奇心的新消息与探索者' },
    12: { name: '骑士 (Knight)', keyword: '充满驱动力的行动与追求者' },
    13: { name: '王后 (Queen)', keyword: '成熟的内化、滋养与掌控者' },
    14: { name: '国王 (King)', keyword: '绝对的权威、外化的力量与领导者' }
};

let output = `export interface TarotCardData {
  name: string;
  meaning: string;
  advice: string;
  image: string;
}

export const TAROT_CARDS: TarotCardData[] = [
`;

const cards = [];

// Add Major Arcana
for (const c of MAJOR_ARCANA) {
    cards.push(`  {
    name: "${c.name}",
    meaning: "${c.meaning}",
    advice: "${c.advice}",
    image: "/assets/cards/card_${c.id}.svg"
  }`);
}

// Add Minor Arcana
for (const suitKey of Object.keys(SUIT_THEMES)) {
    for (let i = 1; i <= 14; i++) {
        const suit = SUIT_THEMES[suitKey];
        const numInfo = NUM_THEMES[i];
        
        const cardName = `${suit.name}${numInfo.name}`;
        const meaning = `这是一张代表【${suit.theme}】领域的牌。当前的阶段特征是：${numInfo.keyword}。`;
        const advice = `在${suit.name.replace('星币', '现实').replace('宝剑', '思维').replace('权杖', '行动').replace('圣杯', '情感')}的领域中，你需要顺应当前的能量流动。`;
        
        cards.push(`  {
    name: "${cardName}",
    meaning: "${meaning}",
    advice: "${advice}",
    image: "/assets/cards/card_${suitKey}_${i}.svg"
  }`);
    }
}

output += cards.join(',\n') + '\n];\n';

fs.writeFileSync(path.join(process.cwd(), 'src', 'constants', 'tarotData.ts'), output);
console.log('Successfully generated tarotData.ts with 78 cards!');
