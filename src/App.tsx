import { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Experience } from './components/Experience'
import { useHandTracker } from './hooks/useHandTracker'
import { 
  Loader2, RefreshCw, X, Leaf, Eye, Trees, 
  MessageSquare, Layout, Play, Info, BookOpen, Scroll,
  History
} from 'lucide-react'
import { TAROT_CARDS, SPREAD_CONFIGS } from './constants/tarotData'
import type { SpreadType, ThreeCardMode } from './constants/tarotData'

type GameState = 'SETUP' | 'SHUFFLING' | 'DRAWING' | 'RESULT';

interface DrawnCard {
  cardIdx: number;
  isReversed: boolean;
  positionLabel: string;
  positionDescription: string;
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Game State
  const [gameState, setGameState] = useState<GameState>('SETUP');
  const [intention, setIntention] = useState('');
  const [spreadType, setSpreadType] = useState<SpreadType>('THREE_CARD');
  const [threeCardMode, setThreeCardMode] = useState<ThreeCardMode>('TIME');
  
  const [, setShuffledDeck] = useState<number[]>([]);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [detailViewCardIdx, setDetailViewCardIdx] = useState<number | null>(null); // State for Detail Modal
  const [showRulesModal, setShowRulesModal] = useState(false); // State for Rules Modal
  
  const { handData, status } = useHandTracker(videoRef.current || null)

  useEffect(() => {
    async function setupCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasError(true)
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: false
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => setIsCameraReady(true)
        }
      } catch (err) {
        console.error('Error accessing camera:', err)
        setHasError(true)
      }
    }
    setupCamera()
  }, [])

  const currentSpread = SPREAD_CONFIGS[spreadType];
  const positions = currentSpread.getPositions(threeCardMode);

  const startShuffling = () => {
    const deck = Array.from({ length: 78 }, (_, i) => i);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    setShuffledDeck(deck);
    setGameState('SHUFFLING');
    setTimeout(() => setGameState('DRAWING'), 3000);
  };

  const handleSelect = (cardIdx: number) => {
    if (gameState !== 'DRAWING' || drawnCards.length >= currentSpread.cardCount) return;
    const isReversed = Math.random() > 0.7;
    const position = positions[drawnCards.length];
    const newCard: DrawnCard = { cardIdx, isReversed, positionLabel: position.label, positionDescription: position.description };
    setDrawnCards(prev => {
        const next = [...prev, newCard];
        if (next.length === currentSpread.cardCount) setTimeout(() => setGameState('RESULT'), 1000);
        return next;
    });
  }

  const resetSelection = () => {
    setDrawnCards([]);
    setGameState('SETUP');
    setIntention('');
    setDetailViewCardIdx(null);
  }

  return (
    <div className="relative w-screen h-screen bg-forest-900 text-magic-cyan overflow-hidden font-sans selection:bg-magic-gold/30 selection:text-magic-gold">
      {!isCameraReady && !hasError && (
        <div className="fixed inset-0 z-[100] bg-forest-900 flex flex-col items-center justify-center gap-8">
          <div className="relative">
            <Loader2 className="w-24 h-24 text-magic-emerald animate-spin opacity-20" />
            <Leaf className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-magic-emerald animate-pulse" />
          </div>
          <div className="text-center space-y-4">
            <h3 className="text-5xl font-display italic font-bold text-magic-gold tracking-widest glow-gold">FOREST.AWAKE</h3>
            <p className="text-xs text-magic-cyan/60 font-sans tracking-[0.4em] uppercase">调律森林灵觉中...</p>
          </div>
          <button onClick={() => { setIsCameraReady(true); setHasError(true); }} className="mt-12 text-[10px] text-magic-cyan/40 hover:text-magic-gold uppercase tracking-[0.3em] font-sans transition-colors duration-500">[ 强制共鸣 / 手动覆盖 ]</button>
        </div>
      )}

      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 0, 10], fov: 50 }}>
          <Experience handData={handData} selectedCards={drawnCards.map(c => c.cardIdx)} onSelect={handleSelect} gameState={gameState} spreadType={spreadType} threeCardMode={threeCardMode} />
        </Canvas>
      </div>

      <div className="fixed top-12 right-12 z-50">
        <button 
          onClick={() => setShowRulesModal(true)}
          className="glass-panel p-3 rounded-full flex items-center justify-center border-magic-cyan/20 hover:bg-white/10 transition-colors shadow-2xl"
          title="塔罗奥义法则"
        >
          <Info className="w-6 h-6 text-magic-gold" />
        </button>
      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowRulesModal(false)}></div>
          <div className="relative glass-panel w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[32px] border border-white/10 shadow-2xl z-10 flex flex-col">
            <div className="sticky top-0 z-20 flex justify-between items-center p-6 border-b border-white/5 bg-magic-dark/80 backdrop-blur-md">
              <h2 className="text-2xl font-display italic font-bold text-white tracking-widest">奥义法则 <span className="text-magic-gold/60 text-sm ml-2">RULES & MECHANICS</span></h2>
              <button 
                onClick={() => setShowRulesModal(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <section>
                <h3 className="text-xl font-bold text-magic-cyan mb-4 flex items-center gap-2"><Scroll className="w-5 h-5"/> 手势交互 (Hand Tracking)</h3>
                <div className="space-y-3 text-sm text-white/80 leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/5">
                  <p><strong className="text-white">握拳制动 (Fist to Stop):</strong> 当你握紧拳头时，星轨牌堆的 3D 旋转将立即停止。这象征着你通过意志力让命运的齿轮暂时停歇，以便你凝视当下的能量。</p>
                  <p><strong className="text-white">捏取抽牌 (Pinch to Draw):</strong> 伸出食指与拇指进行捏合动作，即可从牌堆中抽取出命运之牌。卡牌将化作光影飞入下方的收纳托盘，在整个牌阵抽取完成前，它们将保持背面朝上，维持宇宙的悬念。</p>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-magic-pink mb-4 flex items-center gap-2"><RefreshCw className="w-5 h-5"/> 正逆位系统 (Upright & Reversed)</h3>
                <div className="space-y-3 text-sm text-white/80 leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/5">
                  <p>在正统的塔罗牌占卜中，卡牌被抽出来时有可能是正着的，也有可能是<strong className="text-magic-pink">上下颠倒</strong>的（即逆位）。本系统完全模拟真实洗牌的随机性，每次抽牌均有 30% 的概率出现逆位。</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-magic-emerald">正位 (Upright):</strong> 卡牌上下均为正常方向，边框呈现翠绿色。代表该牌面能量的顺畅流动、外部显化以及事物发展的积极面。</li>
                    <li><strong className="text-magic-pink">逆位 (Reversed):</strong> 卡牌呈现<strong className="text-magic-pink">上下颠倒</strong>状态，边框呈现粉红色。代表该能量受到阻碍、被内化、延迟，或者是需要你深度反思的心理阴影。逆位并非单纯的“坏”，而是宇宙提醒你转换视角、向内探索的重要契机。</li>
                  </ul>
                  <p className="mt-2 italic text-xs text-white/50">* 当你在 3D 牌桌上或详情列表中看到卡牌上下颠倒时，这是正规占卜的一部分，系统会为你提供专属的逆位深度解析。</p>
                </div>
              </section>
              
              <section>
                <h3 className="text-xl font-bold text-magic-gold mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5"/> 塔罗牌阵与结构 (Tarot Structure)</h3>
                <div className="space-y-3 text-sm text-white/80 leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/5">
                  <p><strong className="text-white">系统结构:</strong> 共 78 张牌。分为 22 张大阿卡纳（Major Arcana）揭示人生核心议题，以及 56 张小阿卡纳（Minor Arcana）描绘日常生活的四大元素（权杖-火、圣杯-水、宝剑-风、星币-土）。</p>
                  <p><strong className="text-white">牌阵模式:</strong>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>单张牌阵: 适合每日一抽或针对单一问题的快速能量指引。</li>
                      <li>三张牌阵: 经典的线性逻辑解析（过去-现在-未来 或 起因-经过-结果）。</li>
                      <li>凯尔特十字: 10 张牌的宏大牌阵，提供大师级的全景式命运解析，适合极其复杂的人生抉择。</li>
                    </ul>
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      <div className="fixed top-12 left-12 z-50 flex flex-col gap-6 pointer-events-none">
        <div className="glass-panel p-1 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto">
            <video ref={videoRef} autoPlay playsInline muted className="w-56 h-40 object-cover opacity-60 mix-blend-screen brightness-125" style={{ transform: 'scaleX(-1)' }} />
        </div>
        <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-4 border-magic-cyan/20">
          <div className={`w-3 h-3 rounded-full ${status === 'ready' ? 'bg-magic-emerald shadow-[0_0_10px_#34d399]' : 'bg-magic-gold shadow-[0_0_10px_#fde68a] animate-pulse'}`} />
          <span className="text-[11px] font-sans font-bold uppercase tracking-[0.25em] text-magic-cyan/80">
            {status === 'initializing' ? 'INITIALIZING' : status === 'ready' ? 'LINK_ACTIVE' : status === 'no-hand' ? 'AWAIT_SUBJECT' : 'SENSOR_OFFLINE'}
          </span>
        </div>
      </div>

      {gameState === 'SETUP' && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-forest-900/40 backdrop-blur-sm p-8">
            <div className="glass-panel max-w-2xl w-full p-12 rounded-[50px] space-y-10 animate-float border border-magic-gold/20 shadow-2xl">
                <div className="text-center space-y-2">
                    <h2 className="text-4xl font-display italic font-bold text-magic-gold">占卜意图设定</h2>
                    <p className="text-xs text-magic-cyan/50 tracking-[0.3em] uppercase">SET YOUR INTENTION</p>
                </div>
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 text-sm text-magic-gold/80 font-bold tracking-widest uppercase"><MessageSquare className="w-4 h-4" /> 你的问题 (选填)</label>
                        <textarea value={intention} onChange={(e) => setIntention(e.target.value)} placeholder="请在心中默念你的问题，或在此处记录..." className="w-full bg-forest-800/50 border border-magic-cyan/20 rounded-2xl p-5 text-magic-cyan placeholder:text-magic-cyan/20 focus:outline-none focus:border-magic-gold/50 transition-all resize-none h-32" />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 text-sm text-magic-gold/80 font-bold tracking-widest uppercase"><Layout className="w-4 h-4" /> 牌阵模式</label>
                            <select value={spreadType} onChange={(e) => setSpreadType(e.target.value as SpreadType)} className="w-full bg-forest-800/50 border border-magic-cyan/20 rounded-xl p-4 text-magic-cyan focus:outline-none">
                                <option value="SINGLE">单张模式 (快卜)</option>
                                <option value="THREE_CARD">三张模式 (因果/时间)</option>
                                <option value="CELTIC_CROSS">高阶模式 (凯尔特十字)</option>
                            </select>
                        </div>
                        {spreadType === 'THREE_CARD' && (
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 text-sm text-magic-gold/80 font-bold tracking-widest uppercase"><Info className="w-4 h-4" /> 解析逻辑</label>
                                <select value={threeCardMode} onChange={(e) => setThreeCardMode(e.target.value as ThreeCardMode)} className="w-full bg-forest-800/50 border border-magic-cyan/20 rounded-xl p-4 text-magic-cyan focus:outline-none">
                                    <option value="TIME">过去 / 现在 / 未来</option>
                                    <option value="CAUSE">起因 / 经过 / 结果</option>
                                    <option value="RELATION">自身 / 对方 / 关系现状</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>
                <button onClick={startShuffling} className="w-full py-6 bg-gradient-to-r from-magic-emerald/20 to-magic-gold/20 hover:from-magic-emerald/40 hover:to-magic-gold/40 border border-magic-gold/30 rounded-full text-magic-gold font-bold text-xl tracking-[0.5em] transition-all flex items-center justify-center gap-4 group">
                    <Play className="w-6 h-6 group-hover:scale-125 transition-transform" /> 开启森之共鸣
                </button>
            </div>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-between py-16 px-12">
        <header className={`flex flex-col items-center transition-all duration-1000 glass-panel-gold rounded-[40px] pointer-events-auto shadow-2xl ${ (gameState === 'SHUFFLING' || gameState === 'DRAWING') ? 'px-8 py-3 gap-1 mt-[-20px] scale-90 opacity-90' : 'px-12 py-8 gap-4' }`}>
          <div className="flex items-center gap-4 text-magic-gold">
            <Trees className={`transition-all duration-1000 ${ (gameState === 'SHUFFLING' || gameState === 'DRAWING') ? 'w-4 h-4' : 'w-6 h-6' }`} />
            <h1 className={`font-display italic font-black tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-b from-magic-gold to-magic-emerald uppercase transition-all duration-1000 ${ (gameState === 'SHUFFLING' || gameState === 'DRAWING') ? 'text-2xl' : 'text-6xl' }`}>星轨启示录</h1>
            <Trees className={`transition-all duration-1000 ${ (gameState === 'SHUFFLING' || gameState === 'DRAWING') ? 'w-4 h-4' : 'w-6 h-6' }`} />
          </div>
          <div className={`flex items-center gap-4 w-full transition-all duration-1000 ${ (gameState === 'SHUFFLING' || gameState === 'DRAWING') ? 'h-0 opacity-0' : 'h-auto opacity-100' }`}>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-magic-emerald/30 to-transparent" />
            <p className="text-magic-cyan font-sans tracking-[0.5em] text-[10px] uppercase opacity-80">{gameState === 'SHUFFLING' ? '正在洗牌...' : `已提取片段 (${drawnCards.length}/${currentSpread.cardCount})`}</p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-magic-emerald/30 to-transparent" />
          </div>
          {intention && gameState === 'SETUP' && (
             <p className="text-[10px] text-magic-gold/60 italic font-serif">" {intention.substring(0, 30)}{intention.length > 30 ? '...' : ''} "</p>
          )}
        </header>

        {(gameState === 'SHUFFLING' || gameState === 'DRAWING') && (
           <div className="fixed top-8 right-12 z-50 flex flex-col items-end gap-2 pointer-events-none">
              <div className="glass-panel px-6 py-2 rounded-full border-magic-cyan/20">
                <p className="text-magic-cyan font-sans tracking-[0.3em] text-[10px] uppercase font-bold">{gameState === 'SHUFFLING' ? 'SHUFFLING...' : `RECALLING (${drawnCards.length}/${currentSpread.cardCount})`}</p>
              </div>
           </div>
        )}

        {gameState === 'DRAWING' && (
             <div className="glass-panel px-8 py-3 rounded-full flex items-center gap-6 shadow-2xl animate-float pointer-events-auto mb-4 scale-90">
                <Eye className="w-4 h-4 text-magic-gold animate-pulse" />
                <div className="w-px h-4 bg-magic-cyan/20" />
                <div className="flex items-baseline gap-3 font-sans">
                  <p className="text-sm font-display italic tracking-[0.1em] text-magic-cyan">{drawnCards.length < currentSpread.cardCount ? `寻觅位：${positions[drawnCards.length].label}` : '抽取完成'}</p>
                  <p className="text-[8px] text-magic-cyan/40 tracking-[0.2em] uppercase">{positions[drawnCards.length]?.description || '即将解析命运'}</p>
                </div>
            </div>
        )}

        {gameState === 'RESULT' && (
          <div className="absolute inset-0 z-[100] bg-forest-900/98 backdrop-blur-3xl pointer-events-auto flex flex-col h-full animate-in fade-in duration-1000 overflow-hidden text-sm">
            <div className="w-full px-8 py-3 border-b border-magic-cyan/10 flex justify-between items-center glass-panel shrink-0">
               <div className="flex items-center gap-6">
                  <Scroll className="w-5 h-5 text-magic-gold" />
                  <div>
                    <h2 className="text-lg font-display italic font-bold text-magic-gold tracking-wider">{currentSpread.name} · 命运解构</h2>
                    <p className="text-[8px] text-magic-cyan/40 uppercase tracking-[0.3em]">Prophetic Analysis v5.2</p>
                  </div>
               </div>
               {intention && (
                  <div className="hidden lg:flex items-center gap-3 glass-panel-gold px-4 py-1 rounded-full italic font-serif text-[10px] text-magic-gold/70">
                    <MessageSquare className="w-3 h-3" /> “{intention.substring(0, 40)}{intention.length > 40 ? '...' : ''}”
                  </div>
               )}
               <button onClick={resetSelection} className="p-2 hover:bg-white/5 rounded-full transition-all text-magic-cyan hover:text-magic-gold"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-forest-900/50 relative">
              <div className="max-w-4xl mx-auto p-6 lg:p-10 space-y-8">
                  {drawnCards.map((card, i) => (
                    <div key={i} className="glass-panel p-6 rounded-[32px] flex flex-col md:flex-row gap-8 items-center border border-magic-cyan/5 hover:border-magic-gold/20 transition-all duration-500 group animate-in slide-in-from-bottom-4 duration-700">
                        <div className="relative shrink-0">
                           <div className={`w-32 aspect-[1536/2754] rounded-[16px] overflow-hidden border-2 shadow-xl transition-all duration-1000 bg-forest-900/50 flex items-center justify-center ${card.isReversed ? 'rotate-180 border-magic-pink' : 'border-magic-emerald'}`}>
                              <img src={TAROT_CARDS[card.cardIdx].image} className="w-full h-full object-cover" alt="" />
                           </div>
                           <div className="absolute -top-2 -left-2 w-7 h-7 bg-magic-gold text-forest-900 rounded-full flex items-center justify-center font-black text-xs shadow-lg z-20">{i + 1}</div>
                        </div>

                        <div className="flex-1 space-y-4 text-center md:text-left min-w-0 w-full">
                            <div>
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${card.isReversed ? 'bg-magic-pink/20 text-magic-pink' : 'bg-magic-emerald/20 text-magic-emerald'}`}>
                                        {card.isReversed ? '逆位' : '正位'}
                                    </span>
                                    <p className="text-[9px] font-bold text-magic-gold tracking-widest uppercase">{card.positionLabel}</p>
                                </div>
                                <h3 className="text-3xl font-display italic font-bold text-magic-cyan leading-none">
                                    {TAROT_CARDS[card.cardIdx].name}
                                </h3>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
                               {TAROT_CARDS[card.cardIdx].keywords.slice(0, 3).map((kw, idx) => (
                                   <div key={idx} className="bg-white/5 px-2.5 py-0.5 rounded-full text-[8px] font-bold text-magic-cyan/60 tracking-wider"># {kw}</div>
                               ))}
                            </div>

                            <p className="text-xs text-magic-cyan/70 leading-relaxed font-serif">
                                {card.isReversed 
                                  ? (TAROT_CARDS[card.cardIdx].meaningReversedSummary || "此位能量受阻，需要深度内省与调整。") 
                                  : (TAROT_CARDS[card.cardIdx].meaningSummary || "当前能量场的核心显现，预示着重要的生命节点。")}
                            </p>
                        </div>

                        <button onClick={() => setDetailViewCardIdx(i)} className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-full bg-magic-gold/10 hover:bg-magic-gold/20 text-magic-gold border border-magic-gold/20 transition-all text-xs font-bold tracking-widest uppercase group/btn">
                            <BookOpen className="w-4 h-4 group-hover/btn:scale-110 transition-transform" /> 阅读奥义
                        </button>
                    </div>
                  ))}

                  <div className="border-t border-magic-cyan/10 pt-10 pb-16 space-y-6">
                      <div className="flex flex-col items-center gap-2">
                         <History className="w-6 h-6 text-magic-emerald" />
                         <h4 className="text-lg font-display italic font-bold text-magic-emerald tracking-widest uppercase">综合评估报告</h4>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                          <div className="glass-panel p-5 rounded-[20px] border-magic-cyan/5 text-center space-y-2">
                             <h5 className="text-magic-gold font-bold text-[8px] tracking-widest uppercase mb-2 underline underline-offset-4 decoration-magic-gold/20">Primary Energy</h5>
                             <p className="text-[10px] text-magic-cyan/60 leading-relaxed">起点：{TAROT_CARDS[drawnCards[0].cardIdx].name}，奠定{drawnCards[0].isReversed ? '内敛' : '扩张'}基调。</p>
                          </div>
                          <div className="glass-panel p-5 rounded-[20px] border-magic-cyan/5 text-center space-y-2">
                             <h5 className="text-magic-gold font-bold text-[8px] tracking-widest uppercase mb-2 underline underline-offset-4 decoration-magic-gold/20">Dynamic Path</h5>
                             <p className="text-[10px] text-magic-cyan/60 leading-relaxed">能量流转平稳，转折点将是解决困惑的关键。</p>
                          </div>
                          <div className="glass-panel p-5 rounded-[20px] border-magic-cyan/5 text-center space-y-2">
                             <h5 className="text-magic-gold font-bold text-[8px] tracking-widest uppercase mb-2 underline underline-offset-4 decoration-magic-gold/20">Final Reveal</h5>
                             <p className="text-[10px] text-magic-cyan/60 leading-relaxed">终局：{TAROT_CARDS[drawnCards[drawnCards.length - 1].cardIdx].name}，象征圆满。</p>
                          </div>
                      </div>
                  </div>
              </div>

              {detailViewCardIdx !== null && (
                <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 lg:p-12 animate-in fade-in zoom-in-95 duration-500">
                    <div className="glass-panel max-w-5xl w-full max-h-[90vh] flex flex-col rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-magic-gold/30">
                        <div className="p-6 border-b border-magic-gold/10 flex justify-between items-center bg-black/40">
                             <div className="flex items-center gap-4">
                                <Scroll className="w-5 h-5 text-magic-gold" />
                                <span className="text-[10px] font-bold text-magic-gold tracking-[0.4em] uppercase">奥义深层解构 · DEEP LORE</span>
                             </div>
                             <button onClick={() => setDetailViewCardIdx(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-magic-gold"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 custom-scrollbar bg-forest-900/40">
                            <div className="flex flex-col lg:flex-row gap-12 items-start">
                                <div className="shrink-0 mx-auto lg:mx-0">
                                    <div className={`w-48 aspect-[1536/2754] rounded-[24px] overflow-hidden border-4 shadow-2xl transition-all duration-1000 bg-forest-900/50 flex items-center justify-center ${drawnCards[detailViewCardIdx].isReversed ? 'rotate-180 border-magic-pink' : 'border-magic-emerald'}`}>
                                        <img src={TAROT_CARDS[drawnCards[detailViewCardIdx].cardIdx].image} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="mt-6 flex flex-col items-center">
                                        <div className={`px-4 py-1 rounded-full text-[10px] font-bold ${drawnCards[detailViewCardIdx].isReversed ? 'bg-magic-pink/20 text-magic-pink' : 'bg-magic-emerald/20 text-magic-emerald'}`}>{drawnCards[detailViewCardIdx].isReversed ? 'INVERTED' : 'UPRIGHT'}</div>
                                        <p className="mt-2 text-[9px] text-magic-gold/60 font-bold uppercase tracking-widest">{drawnCards[detailViewCardIdx].positionLabel}</p>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-8 min-w-0">
                                    <h3 className="text-6xl font-display italic font-bold text-transparent bg-clip-text bg-gradient-to-r from-magic-gold via-magic-cyan to-magic-emerald leading-tight">{TAROT_CARDS[drawnCards[detailViewCardIdx].cardIdx].name}</h3>
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 text-magic-gold border-b border-magic-gold/10 pb-2">
                                            <BookOpen className="w-4 h-4" />
                                            <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase">核心释义</h4>
                                        </div>
                                        <p className="text-lg font-serif italic leading-relaxed text-magic-cyan/95 bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner">
                                            {drawnCards[detailViewCardIdx].isReversed ? (TAROT_CARDS[drawnCards[detailViewCardIdx].cardIdx].meaningReversed || "能量受阻...") : TAROT_CARDS[drawnCards[detailViewCardIdx].cardIdx].meaning}
                                        </p>
                                        <div className="space-y-4">
                                            <h5 className="text-[10px] font-bold text-magic-gold/40 tracking-widest uppercase flex items-center gap-2 italic">Detailed Symbolism // 符号剖析</h5>
                                            <p className="text-sm leading-relaxed text-magic-cyan/50 font-light indent-8 text-justify">{TAROT_CARDS[drawnCards[detailViewCardIdx].cardIdx].description}</p>
                                        </div>
                                    </div>
                                    <div className="bg-magic-gold/5 p-8 rounded-[32px] border border-magic-gold/10 shadow-xl">
                                        <div className="flex items-center gap-4 text-magic-gold mb-4">
                                            <Eye className="w-5 h-5 animate-pulse" />
                                            <h4 className="text-xs font-bold tracking-[0.4em] uppercase">森之高阶指引 · DIVINE ADVICE</h4>
                                        </div>
                                        <p className="text-2xl font-display italic text-magic-gold leading-relaxed drop-shadow-lg">“{drawnCards[detailViewCardIdx].isReversed ? (TAROT_CARDS[drawnCards[detailViewCardIdx].cardIdx].adviceReversed || "静心观察...") : TAROT_CARDS[drawnCards[detailViewCardIdx].cardIdx].advice}”</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-black/60 border-t border-magic-gold/10 flex justify-center shrink-0">
                             <button onClick={() => setDetailViewCardIdx(null)} className="px-12 py-3 glass-panel text-magic-gold rounded-full border border-magic-gold/20 hover:bg-magic-gold hover:text-forest-900 transition-all font-bold text-xs tracking-[0.5em] uppercase">关闭详情 | CLOSE ARCANA</button>
                        </div>
                    </div>
                </div>
              )}
            </div>

            <div className="w-full px-8 py-4 border-t border-magic-cyan/10 bg-black/40 flex justify-center items-center shrink-0">
                 <button onClick={resetSelection} className="group flex items-center gap-3 px-8 py-3 glass-panel text-magic-gold rounded-full border border-magic-gold/20 hover:bg-magic-gold hover:text-forest-900 transition-all duration-500 shadow-lg scale-90">
                    <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-700" />
                    <span className="text-xs font-bold tracking-[0.3em] uppercase">开启新占卜 | RESET</span>
                 </button>
            </div>
          </div>
        )}

        <footer className="text-magic-cyan/40 font-sans text-[9px] uppercase tracking-[0.8em] flex items-center gap-6 glass-panel px-8 py-3 rounded-full border-magic-cyan/10">
          <span>FOREST_KERNEL 5.2</span>
          <div className="w-1.5 h-1.5 rounded-full bg-magic-gold" />
          <span>{spreadType}_{threeCardMode}</span>
        </footer>
      </div>
    </div>
  )
}

export default App
