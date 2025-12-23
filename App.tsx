
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Board from './components/Board';
import { HistoryItem, GameStatus, Course, Chapter, Lesson, Arrow, Highlight } from './types';
import { getChessHint } from './geminiService';
import { 
  Trophy, 
  RotateCcw, 
  History, 
  BrainCircuit,
  MessageSquare,
  BookOpen,
  Plus, 
  Trash2, 
  Save, 
  PenTool, 
  ChevronRight, 
  Edit2, 
  Check, 
  ArrowRight, 
  CheckCircle2, 
  ListPlus, 
  Pointer, 
  Settings2,
  Maximize2,
  Minimize2,
  LayoutDashboard,
  SearchCode,
  Expand,
  Monitor,
  Library,
  ChevronLeft,
  MoreVertical
} from 'lucide-react';

declare const Chess: any;

const INITIAL_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Chess Fundamentals',
    chapters: [
      {
        id: 'c1',
        title: '1. Opening Principles',
        lessons: [
          { id: 'l1.1', title: '1.1 Control the Center', fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', description: 'Focus on the center squares to dominate the board early.', arrows: [{ from: 'e2', to: 'e4', color: 'gold' }], highlights: [] },
        ]
      }
    ]
  }
];

const App: React.FC = () => {
  const [mode, setMode] = useState<'play' | 'create'>('play');
  const [view, setView] = useState<'library' | 'course'>('library');
  const [isFullscreenBoard, setIsFullscreenBoard] = useState(false);
  const [isFreePlacement, setIsFreePlacement] = useState(false);
  const [game, setGame] = useState<any>(new Chess());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string, to: string } | null>(null);
  const [hint, setHint] = useState<{ suggestedMove: string, reasoning: string, evaluation: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  
  // Course State
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('grandmaster_courses_v2');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('grandmaster_progress_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<{ arrows: Arrow[], highlights: Highlight[] }>({ arrows: [], highlights: [] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const [status, setStatus] = useState<GameStatus>({
    isCheck: false, isCheckmate: false, isDraw: false, isGameOver: false, turn: 'w', fen: 'start'
  });

  // Memoized Helpers
  const activeCourse = useMemo(() => 
    courses.find(c => c.id === activeCourseId) || null
  , [courses, activeCourseId]);

  const flatLessons = useMemo(() => {
    if (!activeCourse) return [];
    return activeCourse.chapters.flatMap(ch => ch.lessons);
  }, [activeCourse]);

  const activeLessonIndex = useMemo(() => {
    return flatLessons.findIndex(l => l.id === activeLessonId);
  }, [flatLessons, activeLessonId]);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('grandmaster_courses_v2', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('grandmaster_progress_v2', JSON.stringify(completedLessonIds));
  }, [completedLessonIds]);

  const updateStatus = useCallback((currentGame: any) => {
    setStatus({
      isCheck: currentGame.in_check(),
      isCheckmate: currentGame.in_checkmate(),
      isDraw: currentGame.in_draw() || currentGame.in_stalemate(),
      isGameOver: currentGame.game_over(),
      turn: currentGame.turn(),
      fen: currentGame.fen()
    });
  }, []);

  // Sync board state back to the course object
  const syncBoardToCourse = useCallback((newFen: string) => {
    if (mode === 'create' && activeCourseId && activeLessonId) {
      setCourses(prev => prev.map(c => {
        if (c.id === activeCourseId) {
          return {
            ...c,
            chapters: c.chapters.map(ch => ({
              ...ch,
              lessons: ch.lessons.map(l => l.id === activeLessonId ? { ...l, fen: newFen } : l)
            }))
          };
        }
        return c;
      }));
    }
  }, [mode, activeCourseId, activeLessonId]);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsBrowserFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsBrowserFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsBrowserFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const makeMove = useCallback((moveData: { from: string, to: string, promotion: string }) => {
    const newGame = new Chess(game.fen());
    
    if (isFreePlacement && mode === 'create') {
      const piece = newGame.get(moveData.from);
      if (piece) {
        newGame.remove(moveData.from);
        newGame.put(piece, moveData.to);
        const forcedGame = new Chess(newGame.fen());
        setGame(forcedGame);
        setLastMove({ from: moveData.from, to: moveData.to });
        updateStatus(forcedGame);
        syncBoardToCourse(forcedGame.fen());
        return true;
      }
      return null;
    }

    const move = newGame.move(moveData);
    if (move) {
      setGame(newGame);
      setLastMove({ from: move.from, to: move.to });
      setHistory(prev => [...prev, {
        move: `${move.from}-${move.to}`,
        san: move.san,
        color: move.color,
        fen: newGame.fen()
      }]);
      updateStatus(newGame);
      setHint(null);
      if (mode === 'create') syncBoardToCourse(newGame.fen());
    }
    return move;
  }, [game, isFreePlacement, mode, updateStatus, syncBoardToCourse]);

  const switchLesson = useCallback((lesson: Lesson) => {
    const newGame = new Chess(lesson.fen);
    setGame(newGame);
    setActiveLessonId(lesson.id);
    setAnnotations({ arrows: lesson.arrows || [], highlights: lesson.highlights || [] });
    setHistory([]);
    setLastMove(null);
    updateStatus(newGame);
    if (view === 'library') setView('course');
  }, [updateStatus, view]);

  const handleNextLesson = () => {
    if (activeLessonIndex < flatLessons.length - 1) {
      switchLesson(flatLessons[activeLessonIndex + 1]);
    }
  };

  const handleFinishLesson = () => {
    if (activeLessonId && !completedLessonIds.includes(activeLessonId)) {
      setCompletedLessonIds(prev => [...prev, activeLessonId]);
    }
    handleNextLesson();
  };

  const createNewCourse = () => {
    const newId = `course-${Date.now()}`;
    const newCourse: Course = {
      id: newId,
      title: 'Untitled Course',
      chapters: []
    };
    setCourses(prev => [...prev, newCourse]);
    setActiveCourseId(newId);
    setView('course');
    setMode('create');
  };

  const deleteCourse = (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      setCourses(prev => prev.filter(c => c.id !== courseId));
      if (activeCourseId === courseId) {
        setActiveCourseId(null);
        setView('library');
      }
    }
  };

  const addChapter = () => {
    if (!activeCourseId) return;
    setCourses(prev => prev.map(c => {
      if (c.id === activeCourseId) {
        return {
          ...c,
          chapters: [...c.chapters, {
            id: `c${Date.now()}`,
            title: `${c.chapters.length + 1}. New Chapter`,
            lessons: []
          }]
        };
      }
      return c;
    }));
  };

  const addLesson = (chapterId: string, afterLessonId?: string) => {
    if (!activeCourseId) return;
    const lessonId = `l${Date.now()}`;
    setCourses(prev => prev.map(c => {
      if (c.id === activeCourseId) {
        return {
          ...c,
          chapters: c.chapters.map(ch => {
            if (ch.id === chapterId) {
              const newLesson: Lesson = {
                id: lessonId,
                title: `New Lesson`,
                fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                description: '',
                arrows: [],
                highlights: []
              };
              let updatedLessons = [...ch.lessons];
              if (afterLessonId) {
                const index = updatedLessons.findIndex(l => l.id === afterLessonId);
                updatedLessons.splice(index + 1, 0, newLesson);
              } else {
                updatedLessons.push(newLesson);
              }
              return { ...ch, lessons: updatedLessons };
            }
            return ch;
          })
        };
      }
      return c;
    }));
    setActiveLessonId(lessonId);
  };

  const deleteLesson = (chapterId: string, lessonId: string) => {
    if (!activeCourseId) return;
    setCourses(prev => prev.map(c => {
      if (c.id === activeCourseId) {
        return {
          ...c,
          chapters: c.chapters.map(ch => ch.id === chapterId ? { ...ch, lessons: ch.lessons.filter(l => l.id !== lessonId) } : ch)
        };
      }
      return c;
    }));
    if (activeLessonId === lessonId) setActiveLessonId(null);
  };

  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditValue(currentTitle);
  };

  const saveEdit = () => {
    if (!editingId) return;
    setCourses(prev => prev.map(c => ({
      ...c,
      title: c.id === editingId ? editValue : c.title,
      chapters: c.chapters.map(ch => ({
        ...ch,
        title: ch.id === editingId ? editValue : ch.title,
        lessons: ch.lessons.map(l => ({
          ...l,
          title: l.id === editingId ? editValue : l.title
        }))
      }))
    })));
    setEditingId(null);
  };

  // Immediate sync for annotations as well
  useEffect(() => {
    if (mode === 'create' && activeCourseId && activeLessonId) {
      setCourses(prev => prev.map(c => {
        if (c.id === activeCourseId) {
          return {
            ...c,
            chapters: c.chapters.map(ch => ({
              ...ch,
              lessons: ch.lessons.map(l => l.id === activeLessonId ? { 
                ...l, 
                arrows: annotations.arrows, 
                highlights: annotations.highlights 
              } : l)
            }))
          };
        }
        return c;
      }));
    }
  }, [annotations, mode, activeCourseId, activeLessonId]);

  return (
    <div className={`flex flex-col lg:flex-row min-h-screen w-full bg-[#161512] font-sans p-4 lg:p-6 gap-6 overflow-hidden text-[#bababa] transition-all duration-500 ${isFullscreenBoard ? 'lg:px-12' : ''}`}>
      
      {/* Main Board View */}
      <div className={`flex flex-col items-center justify-center gap-6 mx-auto lg:mx-0 transition-all duration-500 ${isFullscreenBoard ? 'flex-[2] max-w-none' : 'flex-1 max-w-[700px]'}`}>
        <header className="w-full flex justify-between items-center bg-[#262421] p-4 rounded-xl border border-[#3c3a37] shadow-xl">
          <div className="flex items-center gap-4">
            <div className="bg-[#81b64c] p-2 rounded-lg shadow-inner">
              <Trophy className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none text-white uppercase">Grandmaster</h1>
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => { setMode('play'); setView('library'); }}
                  className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'play' ? 'bg-[#81b64c] text-white shadow-lg' : 'bg-[#3c3a37] text-[#989795] hover:text-white'}`}
                >
                  Learn
                </button>
                <button 
                  onClick={() => { setMode('create'); setIsFreePlacement(false); setView('course'); }}
                  className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'create' ? 'bg-[#81b64c] text-white shadow-lg' : 'bg-[#3c3a37] text-[#989795] hover:text-white'}`}
                >
                  Editor
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={toggleBrowserFullscreen}
              className={`p-2.5 rounded-lg transition-all ${isBrowserFullscreen ? 'bg-[#81b64c] text-white' : 'bg-[#3c3a37] text-[#bababa] hover:text-white hover:bg-[#4a4844]'}`}
              title="Toggle Browser Fullscreen"
            >
              <Expand size={20} />
            </button>
            <button 
              onClick={() => setIsFullscreenBoard(!isFullscreenBoard)}
              className={`p-2.5 rounded-lg transition-all ${isFullscreenBoard ? 'bg-[#81b64c] text-white shadow-[0_0_15px_rgba(129,182,76,0.4)]' : 'bg-[#3c3a37] text-[#bababa] hover:text-white hover:bg-[#4a4844]'}`}
              title={isFullscreenBoard ? "Exit Focus Mode" : "Focus Mode (Large Board)"}
            >
              {isFullscreenBoard ? <Minimize2 size={20} /> : <Monitor size={20} />}
            </button>
            <button 
              onClick={() => { const g = new Chess(); setGame(g); setHistory([]); updateStatus(g); if (mode === 'create') syncBoardToCourse(g.fen()); }} 
              className="p-2.5 rounded-lg bg-[#3c3a37] hover:bg-[#4a4844] transition-colors text-[#bababa]" 
              title="Reset Position"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </header>

        <div className={`w-full flex items-center justify-center transition-all duration-500 ${isFullscreenBoard ? 'max-w-[850px]' : 'max-w-[600px]'}`}>
          <Board 
            game={game} 
            onMove={makeMove} 
            lastMove={lastMove} 
            arrows={annotations.arrows}
            highlights={annotations.highlights}
            isEditable={mode === 'create'}
            onDrawArrow={(a) => setAnnotations(prev => ({...prev, arrows: [...prev.arrows, a]}))}
            onToggleHighlight={(s) => setAnnotations(prev => ({...prev, highlights: [...prev.highlights, {square: s, color: 'red'}]}))}
          />
        </div>

        {activeLessonId && !isFullscreenBoard && (
          <div className="w-full flex gap-3 max-w-[600px]">
            <button 
              onClick={handleFinishLesson}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#81b64c] hover:bg-[#a3d160] text-white font-black rounded-xl shadow-[0_4px_0_0_#45753b] active:shadow-none active:translate-y-[2px] transition-all uppercase tracking-tighter"
            >
              <CheckCircle2 size={22} />
              Finish Lesson
            </button>
            <button 
              onClick={handleNextLesson}
              className="px-6 py-4 bg-[#3c3a37] hover:bg-[#4a4844] text-white font-black rounded-xl shadow-[0_4px_0_0_#262421] active:shadow-none active:translate-y-[2px] transition-all uppercase tracking-tighter flex items-center gap-2"
              disabled={activeLessonIndex === flatLessons.length - 1}
            >
              Next <ArrowRight size={22} />
            </button>
          </div>
        )}

        <div className={`w-full bg-[#262421] border border-[#3c3a37] p-4 rounded-xl flex items-center justify-between shadow-lg transition-all duration-500 ${isFullscreenBoard ? 'max-w-[850px]' : 'max-w-[600px]'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-sm border border-[#4a4844] ${status.turn === 'w' ? 'bg-white shadow-[0_0_8px_white]' : 'bg-[#1b1917]'}`}></div>
            <div>
              <p className="text-[10px] text-[#989795] font-bold uppercase tracking-widest leading-none mb-1">Status</p>
              <p className="font-bold text-lg leading-none text-white">{status.turn === 'w' ? 'White to Move' : 'Black to Move'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {status.isCheck && !status.isCheckmate && <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-black uppercase tracking-widest animate-pulse">Check</span>}
            {isFreePlacement && <span className="px-3 py-1 bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/30 rounded-lg text-xs font-black uppercase tracking-widest">Board Editor</span>}
          </div>
        </div>
      </div>

      {/* Sidebar Area */}
      <div className={`flex flex-col gap-6 max-h-[calc(100vh-3rem)] transition-all duration-500 ${isFullscreenBoard ? 'flex-1 min-w-[320px] max-w-[450px]' : 'w-full lg:w-[380px]'}`}>
        
        <div className="flex-1 bg-[#262421] border border-[#3c3a37] rounded-xl flex flex-col overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-[#3c3a37] flex items-center justify-between bg-[#1e1c1a]">
            <div className="flex items-center gap-3">
              {view === 'library' ? <Library size={20} className="text-[#81b64c]" /> : <ChevronLeft size={24} className="text-[#989795] cursor-pointer hover:text-white" onClick={() => setView('library')} />}
              <h2 className="font-black text-sm uppercase tracking-widest text-white">
                {view === 'library' ? 'Course Library' : (activeCourse?.title || 'Course Details')}
              </h2>
            </div>
            {view === 'library' && (
              <button onClick={createNewCourse} className="p-2 bg-[#81b64c] hover:bg-[#a3d160] rounded-lg transition-colors text-white" title="New Course">
                <Plus size={18} />
              </button>
            )}
            {view === 'course' && mode === 'create' && (
               <button onClick={addChapter} className="p-2 bg-[#3c3a37] hover:bg-[#4a4844] rounded-lg transition-colors text-white" title="New Chapter">
                 <Plus size={18} />
               </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[#262421]">
            {view === 'library' ? (
              <div className="grid gap-4">
                {courses.length === 0 ? (
                  <div className="py-12 text-center opacity-40">
                    <p className="text-sm font-bold uppercase tracking-widest">Your library is empty</p>
                    <button onClick={createNewCourse} className="mt-4 text-xs text-[#81b64c] underline font-bold">Create your first course</button>
                  </div>
                ) : (
                  courses.map(course => (
                    <div key={course.id} className="group relative bg-[#1b1917] p-4 rounded-xl border border-[#3c3a37] hover:border-[#81b64c] transition-all cursor-pointer shadow-lg" onClick={() => { setActiveCourseId(course.id); setView('course'); }}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-black text-white text-sm uppercase tracking-tight truncate w-[80%]">{course.title}</h3>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={(e) => { e.stopPropagation(); startEditing(course.id, course.title); }} className="text-[#989795] hover:text-white"><Edit2 size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); deleteCourse(course.id); }} className="text-[#989795] hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      
                      {editingId === course.id ? (
                        <div className="flex gap-2 mb-2" onClick={e => e.stopPropagation()}>
                          <input value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEdit()} className="bg-[#262421] border border-[#3c3a37] rounded px-2 py-1 text-xs w-full text-white" autoFocus />
                          <button onClick={saveEdit} className="text-[#81b64c]"><Check size={16}/></button>
                        </div>
                      ) : null}

                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex-1 h-1.5 bg-[#262421] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#81b64c] transition-all" 
                            style={{ 
                              width: `${(course.chapters.flatMap(ch => ch.lessons).filter(l => completedLessonIds.includes(l.id)).length / (course.chapters.flatMap(ch => ch.lessons).length || 1)) * 100}%` 
                            }} 
                          />
                        </div>
                        <span className="text-[10px] font-black text-[#989795] uppercase">
                          {course.chapters.length} Chapters
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {activeCourse?.chapters.length === 0 ? (
                  <div className="py-12 text-center opacity-40">
                    <p className="text-xs font-bold uppercase tracking-widest">No chapters yet</p>
                    {mode === 'create' && <button onClick={addChapter} className="mt-4 text-[10px] text-[#81b64c] underline font-bold uppercase tracking-widest">Add First Chapter</button>}
                  </div>
                ) : (
                  activeCourse?.chapters.map((chapter) => (
                    <div key={chapter.id} className="space-y-2">
                      <div className="flex items-center justify-between group">
                        {editingId === chapter.id ? (
                          <div className="flex-1 flex gap-2">
                            <input 
                              value={editValue} 
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && saveEdit()}
                              className="bg-[#1b1917] border border-[#3c3a37] rounded px-2 py-1 text-xs w-full text-white"
                              autoFocus
                            />
                            <button onClick={saveEdit} className="text-[#81b64c]"><Check size={16}/></button>
                          </div>
                        ) : (
                          <h3 className="text-[10px] font-black text-[#989795] uppercase tracking-[0.15em] flex items-center gap-2">
                            {chapter.title}
                            {mode === 'create' && <button onClick={() => startEditing(chapter.id, chapter.title)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={10}/></button>}
                          </h3>
                        )}
                        {mode === 'create' && <button onClick={() => addLesson(chapter.id)} className="text-[#989795] hover:text-[#81b64c] opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={16} /></button>}
                      </div>

                      <div className="space-y-1 ml-1 border-l border-[#3c3a37] pl-3">
                        {chapter.lessons.map((lesson) => (
                          <div key={lesson.id} className="group flex flex-col gap-1">
                            <button 
                              onClick={() => switchLesson(lesson)}
                              className={`w-full text-left px-3 py-2.5 rounded-md text-xs transition-all flex items-center justify-between ${activeLessonId === lesson.id ? 'bg-[#312e2b] text-white border-l-4 border-[#81b64c]' : 'text-[#bababa] hover:bg-[#312e2b]'}`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                {completedLessonIds.includes(lesson.id) && <CheckCircle2 size={14} className="text-[#81b64c] shrink-0" />}
                                <span className="truncate font-bold">{lesson.title}</span>
                              </div>
                              {mode === 'create' && (
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Edit2 size={12} className="hover:text-white" onClick={(e) => { e.stopPropagation(); startEditing(lesson.id, lesson.title); }} />
                                  <Trash2 size={12} className="hover:text-red-500" onClick={(e) => { e.stopPropagation(); deleteLesson(chapter.id, lesson.id); }} />
                                </div>
                              )}
                            </button>
                            {mode === 'create' && (
                              <button 
                                onClick={() => addLesson(chapter.id, lesson.id)}
                                className="ml-auto flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#5c5a57] hover:text-[#81b64c] opacity-0 group-hover:opacity-100 transition-all py-1 px-2"
                              >
                                <ListPlus size={12} /> Insert Lesson
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-[#262421] border border-[#3c3a37] rounded-xl p-5 shadow-xl">
          {mode === 'play' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit size={20} className="text-[#81b64c]" />
                  <span className="text-xs font-black uppercase tracking-widest text-white">Insight</span>
                </div>
                <button 
                  onClick={async () => {
                    setIsAiLoading(true);
                    const res = await getChessHint(game.fen(), history.map(h => h.san));
                    setHint(res);
                    setIsAiLoading(false);
                  }}
                  disabled={isAiLoading || status.isGameOver}
                  className="px-4 py-1.5 bg-[#81b64c] text-white text-[10px] font-black rounded-lg uppercase tracking-widest hover:bg-[#a3d160] transition-all disabled:opacity-30"
                >
                  {isAiLoading ? 'Analyzing...' : 'Ask Coach'}
                </button>
              </div>
              {hint && (
                <div className="bg-[#1b1917] p-4 rounded-xl border border-[#3c3a37] animate-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xl font-black text-[#81b64c]">{hint.suggestedMove}</p>
                    <span className="text-[10px] font-bold text-[#989795]">{hint.evaluation}</span>
                  </div>
                  <p className="text-xs text-[#989795] leading-relaxed italic">"{hint.reasoning}"</p>
                </div>
              )}
              {activeLessonId && !hint && (
                <p className="text-xs text-[#989795] leading-relaxed">
                  {flatLessons.find(l => l.id === activeLessonId)?.description || "Complete the lesson goals to advance."}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings2 size={18} className="text-[#81b64c]" />
                    <span className="text-xs font-black uppercase tracking-widest text-white">Editor</span>
                  </div>
                  <button 
                    onClick={() => setIsFreePlacement(!isFreePlacement)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isFreePlacement ? 'bg-[#81b64c] text-white' : 'bg-[#3c3a37] text-[#989795] hover:text-white'}`}
                  >
                    <Pointer size={14} /> Board Editor: {isFreePlacement ? 'ON' : 'OFF'}
                  </button>
               </div>
               <textarea 
                  placeholder="Lesson objectives..."
                  className="w-full bg-[#1b1917] border border-[#3c3a37] rounded-xl p-4 text-xs text-[#e1e1e1] focus:outline-none focus:border-[#81b64c] h-32 resize-none custom-scrollbar transition-all"
                  value={flatLessons.find(l => l.id === activeLessonId)?.description || ''}
                  onChange={(e) => {
                    const newDesc = e.target.value;
                    setCourses(prev => prev.map(c => {
                      if (c.id === activeCourseId) {
                        return {
                          ...c,
                          chapters: c.chapters.map(ch => ({
                            ...ch,
                            lessons: ch.lessons.map(l => l.id === activeLessonId ? { ...l, description: newDesc } : l)
                          }))
                        };
                      }
                      return c;
                    }));
                  }}
               />
               <div className="text-[10px] text-[#81b64c] font-black uppercase tracking-wider flex items-center gap-1">
                  <Save size={14} /> Changes synced to local storage
               </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3c3a37; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4a4844; }
      `}</style>
    </div>
  );
};

export default App;
