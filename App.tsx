
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAnimalDetails, generateAnimalImages } from './services/geminiService';
import { AppState, ThreatLevel, AnimalData, FavoriteItem } from './types';
import ThreatBadge from './components/ThreatBadge';
import InfoSection from './components/InfoSection';
import Quiz from './components/Quiz';

const CHALLENGE_ANIMALS = [
  "Axolotl", "Pangolin", "Quokka", "Saiga Antelope", "Fennec Fox", 
  "Secretary Bird", "Maned Wolf", "Narwhal", "Red Panda", "Capybara"
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    animal: '',
    loading: false,
    error: null,
    data: null,
    imageUrls: null,
    favorites: [],
    searchHistory: [],
    streak: 0,
    lastSearchDate: null,
  });

  const [inputValue, setInputValue] = useState('');
  const [dailyChallenge, setDailyChallenge] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef<number | null>(null);

  useEffect(() => {
    const randomAnimal = CHALLENGE_ANIMALS[Math.floor(Math.random() * CHALLENGE_ANIMALS.length)];
    setDailyChallenge(randomAnimal);
  }, []);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('faunasphere_favorites');
    const savedHistory = localStorage.getItem('faunasphere_history');
    const savedStreak = localStorage.getItem('faunasphere_streak');
    const savedLastDate = localStorage.getItem('faunasphere_last_date');
    let streak = savedStreak ? parseInt(savedStreak) : 0;
    let lastDate = savedLastDate || null;
    if (lastDate) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const lastDateObj = new Date(lastDate); lastDateObj.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil(Math.abs(today.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) streak = 0;
    }
    setState(prev => ({
      ...prev,
      favorites: savedFavorites ? JSON.parse(savedFavorites) : [],
      searchHistory: savedHistory ? JSON.parse(savedHistory) : [],
      streak,
      lastSearchDate: lastDate,
    }));
  }, []);

  useEffect(() => {
    localStorage.setItem('faunasphere_favorites', JSON.stringify(state.favorites));
  }, [state.favorites]);

  useEffect(() => {
    localStorage.setItem('faunasphere_history', JSON.stringify(state.searchHistory));
  }, [state.searchHistory]);

  useEffect(() => {
    localStorage.setItem('faunasphere_streak', state.streak.toString());
    if (state.lastSearchDate) localStorage.setItem('faunasphere_last_date', state.lastSearchDate);
  }, [state.streak, state.lastSearchDate]);

  useEffect(() => {
    if (state.imageUrls && state.imageUrls.length > 1) {
      slideInterval.current = window.setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % state.imageUrls!.length);
      }, 7000);
    } else {
      if (slideInterval.current) clearInterval(slideInterval.current);
      setCurrentSlide(0);
    }
    return () => { if (slideInterval.current) clearInterval(slideInterval.current); };
  }, [state.imageUrls]);

  const updateStreak = useCallback(() => {
    const today = new Date().toDateString();
    setState(prev => {
      if (prev.lastSearchDate === today) return prev;
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      const newStreak = prev.lastSearchDate === yesterdayStr ? prev.streak + 1 : 1;
      return { ...prev, streak: newStreak, lastSearchDate: today };
    });
  }, []);

  const goHome = useCallback(() => {
    setInputValue('');
    setState(prev => ({ ...prev, animal: '', error: null, data: null, imageUrls: null, loading: false }));
  }, []);

  const performSearch = async (query: string) => {
    if (!query || state.loading) return;

    if (!(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }

    const trimmedQuery = query.trim();
    setInputValue(trimmedQuery);
    setState(prev => ({ ...prev, loading: true, error: null, data: null, imageUrls: null }));
    
    try {
      const details = await getAnimalDetails(trimmedQuery);
      if (!details.isAnimal) {
        setState(prev => ({ 
          ...prev, 
          animal: trimmedQuery, 
          loading: false, 
          error: `Species Verification Failed: "${trimmedQuery}" is not recognized as a biological animal species in our records.`, 
          data: details 
        }));
        return;
      }
      
      const images = await generateAnimalImages(details);
      updateStreak();
      
      setState(prev => {
        const newHistory = [details.commonName, ...prev.searchHistory.filter(h => h.toLowerCase() !== details.commonName.toLowerCase())].slice(0, 10);
        return { ...prev, animal: trimmedQuery, loading: false, error: null, data: details, imageUrls: images, searchHistory: newHistory };
      });
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, animal: trimmedQuery, error: `Could not research "${trimmedQuery}". Please try again.` }));
    }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); performSearch(inputValue); };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!state.imageUrls) return;
    setCurrentSlide(prev => (prev + 1) % state.imageUrls!.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!state.imageUrls) return;
    setCurrentSlide(prev => (prev - 1 + state.imageUrls!.length) % state.imageUrls!.length);
  };

  const toggleFavorite = () => {
    if (!state.data || !state.imageUrls) return;
    const isFav = state.favorites.some(f => f.name.toLowerCase() === state.data!.commonName.toLowerCase());
    if (isFav) {
      setState(prev => ({ ...prev, favorites: prev.favorites.filter(f => f.name.toLowerCase() !== state.data!.commonName.toLowerCase()) }));
    } else {
      setState(prev => ({ ...prev, favorites: [...prev.favorites, { name: state.data!.commonName, scientificName: state.data!.scientificName, image: state.imageUrls![0] }] }));
    }
  };

  const removeFavorite = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    setState(prev => ({ ...prev, favorites: prev.favorites.filter(f => f.name !== name) }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && (state.data || state.error)) goHome(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.data, state.error, goHome]);

  const isCurrentFavorited = state.data && state.favorites.some(f => f.name.toLowerCase() === state.data!.commonName.toLowerCase());
  const isHome = !(state.data?.isAnimal || state.error);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 selection:bg-emerald-100 selection:text-emerald-900">
      <header className={`transition-all duration-1000 ease-in-out bg-slate-900 text-white flex flex-col items-center justify-center relative overflow-hidden ${!isHome ? 'py-12' : 'h-[85vh] py-20'}`}>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
        <div className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${state.streak > 0 ? 'animate-bounce' : 'opacity-40'}`}>🔥</div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none">Streak</p>
            <p className="text-xl font-black text-white leading-none">{state.streak}</p>
          </div>
        </div>
        <div className="relative z-10 max-w-4xl w-full px-6 text-center">
          <button onClick={goHome} className="serif text-5xl md:text-8xl font-bold mb-4 tracking-tighter group outline-none">
            FaunaSphere<span className="text-emerald-500 group-hover:text-emerald-400">.</span>
          </button>
          <p className={`text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto transition-all duration-700 ${!isHome ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
            Scientifically accurate wildlife research grounded in Wikipedia.
          </p>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 max-w-2xl mx-auto relative group mb-4">
            <div className="relative flex-1">
              <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Search a species (e.g. Blue Whale)..." className="w-full px-8 py-5 rounded-2xl text-slate-900 text-lg focus:outline-none focus:ring-4 focus:ring-emerald-500/50 shadow-2xl bg-white/95" />
              {state.loading && <div className="absolute right-4 top-1/2 -translate-y-1/2"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}
            </div>
            <button type="submit" disabled={state.loading} className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold px-10 py-5 rounded-2xl text-lg transition-all shadow-2xl">
              {state.loading ? "Researching..." : "Search"}
            </button>
          </form>
          {isHome && (
            <div className="mt-8 flex flex-col items-center">
               <button onClick={() => performSearch(dailyChallenge)} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-6 transition-all active:scale-95 backdrop-blur-sm max-w-md flex items-center gap-6">
                 <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl">✨</div>
                 <div className="text-left"><p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Daily Challenge</p><p className="text-white font-bold text-lg">Study the <span className="underline decoration-emerald-500">{dailyChallenge}</span></p></div>
               </button>
            </div>
          )}
        </div>
      </header>

      {(state.error || (state.data && state.data.isAnimal)) && !state.loading && (
        <main className="max-w-6xl mx-auto px-6 -mt-12 relative z-20 animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-both">
          <div className="mb-6 flex justify-between items-center">
            <button onClick={goHome} className="text-xs font-bold text-white/60 hover:text-emerald-400 flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/40 backdrop-blur-md">← Return Home</button>
            {state.data && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-2 rounded-full bg-white border border-slate-100">Verification Engine: Gemini Pro Image 3</span>}
          </div>
          {state.error && (
            <div className="bg-white rounded-[2rem] shadow-2xl p-12 text-center border border-red-100">
              <div className="text-5xl mb-6">⚠️</div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Scientific Protocol Restriction</h2>
              <p className="text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">{state.error}</p>
              {state.data?.suggestions && state.data.suggestions.length > 0 && (
                <div className="mt-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Try researching these actual species:</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {state.data.suggestions.map((s, idx) => (
                      <button key={idx} onClick={() => performSearch(s)} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-6 py-3 rounded-xl transition-all border border-emerald-100 shadow-sm">{s}</button>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={goHome} className="mt-12 text-slate-400 hover:text-emerald-600 font-bold underline decoration-slate-200 underline-offset-8">Return to FaunaSphere Database</button>
            </div>
          )}
          {state.data && state.data.isAnimal && (
            <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
              <div className="relative aspect-[21/9] bg-slate-900 overflow-hidden group">
                <div className="flex h-full transition-transform duration-1000 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                  {(state.imageUrls || []).map((url, idx) => (
                    <div key={idx} className="min-w-full h-full relative">
                      <img src={url} className="w-full h-full object-cover" alt={`${state.data!.commonName} scientific visualization ${idx + 1}`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                    </div>
                  ))}
                </div>
                
                {(state.imageUrls || []).length > 1 && (
                  <>
                    <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 border border-white/20">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 border border-white/20">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                      {(state.imageUrls || []).map((_, idx) => (
                        <button key={idx} onClick={() => setCurrentSlide(idx)} className={`w-2 h-2 rounded-full transition-all ${currentSlide === idx ? 'bg-emerald-500 w-6' : 'bg-white/40'}`} />
                      ))}
                    </div>
                  </>
                )}

                <div className="absolute inset-x-0 bottom-0 p-8 md:p-14 text-white z-20">
                  <div className="flex justify-between items-end">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <ThreatBadge level={state.data.threats.level as ThreatLevel} />
                        <span className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-emerald-500/30 backdrop-blur-md">Biometric Accuracy Protocol</span>
                      </div>
                      <h2 className="serif text-5xl md:text-7xl font-bold tracking-tight mb-2">{state.data.commonName}</h2>
                      <p className="text-xl md:text-2xl italic text-slate-300 font-light">{state.data.scientificName}</p>
                    </div>
                    <button onClick={toggleFavorite} className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isCurrentFavorited ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-white/10 hover:bg-white/20 backdrop-blur-md'}`}>
                      <svg className="w-8 h-8" fill={isCurrentFavorited ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-14 grid lg:grid-cols-3 gap-16">
                <div className="lg:col-span-2 space-y-12">
                  <div className="relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-full"></div>
                    <p className="text-2xl text-slate-700 leading-relaxed serif italic">{state.data.wikipediaSummary}</p>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 p-8 rounded-[2rem]">
                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-4 flex items-center gap-2">
                       <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                       Zoological Analysis: Clinical Anatomical Blueprint
                    </h3>
                    <p className="text-emerald-900 text-lg font-medium italic leading-relaxed">"{state.data.visualDescriptionForAi}"</p>
                  </div>

                  <InfoSection title="Habitat & Distribution" icon="🌍">
                    <p className="text-slate-700 leading-relaxed">{state.data.habitat}</p>
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {state.data.habitatMapRegions.map((region, i) => (
                        <div key={i} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">{i+1}</span>
                          <span className="font-semibold text-slate-700">{region.name}</span>
                        </div>
                      ))}
                    </div>
                  </InfoSection>

                  <div className="grid md:grid-cols-2 gap-6">
                    {state.data.funFacts.map((fact, i) => (
                      <div key={i} className="bg-amber-50/50 p-8 rounded-[2rem] border border-amber-100">
                        <span className="text-amber-600 font-black text-xs uppercase tracking-widest mb-4 block">Scientific Insight 0{i+1}</span>
                        <p className="text-slate-800 text-lg font-medium leading-snug">{fact}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-10">
                    <InfoSection title="Evolutionary History" icon="⏳">
                       <p className="text-slate-700 leading-relaxed">{state.data.evolutionaryHistory}</p>
                    </InfoSection>

                    <InfoSection title="Anatomical Features" icon="🧬">
                       <ul className="grid md:grid-cols-2 gap-3">
                        {state.data.physicalFeatures.map((f, i) => (
                          <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </InfoSection>
                    <InfoSection title="Behavioral Psychology" icon="🧠">{state.data.behavior}</InfoSection>
                    <InfoSection title="Dietary Requirements" icon="🍖">{state.data.diet}</InfoSection>
                    <InfoSection title="Ecological Role" icon="🌿">{state.data.roleInEcosystem}</InfoSection>
                    
                    {state.data.scientificLiterature && state.data.scientificLiterature.length > 0 && (
                      <InfoSection title="Scientific Literature" icon="📚">
                        <div className="space-y-6 mt-4">
                          {state.data.scientificLiterature.map((paper, idx) => (
                            <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors">
                              <h4 className="font-bold text-slate-900 leading-tight mb-2">"{paper.title}"</h4>
                              <p className="text-sm text-slate-500 italic mb-1">{paper.authors} ({paper.year})</p>
                              <p className="text-xs font-black uppercase tracking-widest text-emerald-600">{paper.journal}</p>
                            </div>
                          ))}
                        </div>
                      </InfoSection>
                    )}
                  </div>

                  {state.data.quiz && state.data.quiz.length > 0 && (
                    <Quiz questions={state.data.quiz} animalName={state.data.commonName} />
                  )}
                </div>

                <aside className="space-y-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Taxonomy</h3>
                    <div className="space-y-4">
                      {Object.entries(state.data.taxonomy).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-[10px] font-bold uppercase text-slate-400">{key}</span>
                          <span className="text-sm font-semibold text-slate-700">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 sticky top-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 border-b pb-4">Conservation</h3>
                    <div className="mb-8">
                      <div className="flex justify-between items-end mb-3 text-[10px] font-black uppercase text-slate-400"><span>Status</span><span className="text-emerald-700">{state.data.threats.level}</span></div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full bg-emerald-500 transition-all duration-1000 ${state.data.threats.level.toLowerCase().includes('least') ? 'w-1/6' : 'w-4/5'}`}></div>
                      </div>
                      <p className="mt-4 text-sm text-slate-600 italic leading-relaxed">{state.data.threats.description}</p>
                    </div>
                    {state.data.sources && (
                      <div className="mt-10">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-tighter">Wikipedia Grounding Links</h4>
                        <div className="space-y-2">{state.data.sources.map((s, idx) => (
                          <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-emerald-600 hover:text-emerald-800 hover:underline truncate">Reference: {s.title}</a>
                        ))}</div>
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </div>
          )}
        </main>
      )}
      <footer className="mt-32 py-16 border-t border-slate-200 text-center text-slate-500 text-sm">
        <h2 className="serif text-3xl font-bold text-slate-900 mb-4">FaunaSphere<span className="text-emerald-500">.</span></h2>
        <p className="max-w-md mx-auto">Providing precise wildlife documentation through Wikipedia-grounded biological research and high-accuracy visual synthesis.</p>
        <div className="mt-8 flex justify-center gap-4 text-emerald-600 font-bold">
           <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="hover:underline">Billing Info</a>
           <span>•</span>
           <button onClick={() => window.aistudio.openSelectKey()} className="hover:underline">Manage API Key</button>
        </div>
      </footer>
    </div>
  );
};

export default App;
