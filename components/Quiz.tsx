
import React, { useState } from 'react';
import { QuizQuestion } from '../types';

interface QuizProps {
  questions: QuizQuestion[];
  animalName: string;
}

const Quiz: React.FC<QuizProps> = ({ questions, animalName }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const startQuiz = () => {
    setIsActive(true);
    setCurrentStep(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsFinished(false);
  };

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === questions[currentStep].correctAnswerIndex) {
      setScore(prev => prev + 1);
    }
  };

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  if (!isActive) {
    return (
      <div className="mt-16 bg-emerald-900 text-white rounded-[2.5rem] p-12 text-center shadow-2xl overflow-hidden relative group">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="relative z-10">
          <span className="text-emerald-400 font-black text-xs uppercase tracking-[0.3em] mb-4 block">Interactive Knowledge Check</span>
          <h3 className="serif text-4xl font-bold mb-6">Ready to test your expertise on the {animalName}?</h3>
          <p className="text-emerald-100/70 max-w-xl mx-auto mb-10 text-lg">Challenge yourself with a high-accuracy biological quiz based on our scientific findings.</p>
          <button 
            onClick={startQuiz}
            className="bg-white text-emerald-900 hover:bg-emerald-50 font-black px-12 py-5 rounded-2xl transition-all shadow-xl active:scale-95 text-lg"
          >
            Start Scientific Quiz
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="mt-16 bg-slate-900 text-white rounded-[2.5rem] p-12 text-center shadow-2xl relative animate-in fade-in zoom-in duration-500">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
        <div className="relative z-10">
          <div className="text-6xl mb-6">🏆</div>
          <h3 className="serif text-5xl font-bold mb-4">Research Complete</h3>
          <p className="text-slate-400 text-xl mb-8">You scored <span className="text-white font-bold">{score}</span> out of <span className="text-white font-bold">{questions.length}</span></p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={startQuiz}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-10 py-4 rounded-xl transition-all"
            >
              Try Again
            </button>
            <button 
              onClick={() => setIsActive(false)}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-10 py-4 rounded-xl transition-all"
            >
              Exit Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];

  return (
    <div className="mt-16 bg-white border border-slate-200 rounded-[2.5rem] p-12 shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-between items-center mb-10">
        <div>
          <span className="text-emerald-600 font-black text-xs uppercase tracking-widest block mb-1">Knowledge Validation</span>
          <p className="text-slate-400 text-sm font-bold">Question {currentStep + 1} of {questions.length}</p>
        </div>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 w-8 rounded-full transition-all ${i === currentStep ? 'bg-emerald-500' : i < currentStep ? 'bg-emerald-200' : 'bg-slate-100'}`}></div>
          ))}
        </div>
      </div>

      <h4 className="serif text-3xl font-bold text-slate-800 mb-10 leading-tight">
        {currentQuestion.question}
      </h4>

      <div className="grid gap-4 mb-10">
        {currentQuestion.options.map((option, idx) => {
          let stateClass = "border-slate-100 hover:border-emerald-200 hover:bg-emerald-50";
          if (isAnswered) {
            if (idx === currentQuestion.correctAnswerIndex) {
              stateClass = "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20";
            } else if (selectedOption === idx) {
              stateClass = "border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500/20";
            } else {
              stateClass = "border-slate-100 opacity-50";
            }
          }

          return (
            <button
              key={idx}
              disabled={isAnswered}
              onClick={() => handleOptionClick(idx)}
              className={`p-6 rounded-2xl border-2 text-left font-semibold text-lg transition-all flex items-center justify-between group ${stateClass}`}
            >
              <span>{option}</span>
              {isAnswered && idx === currentQuestion.correctAnswerIndex && (
                <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              )}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="bg-slate-50 rounded-2xl p-8 mb-10 border border-slate-100 animate-in fade-in slide-in-from-top-4">
          <p className="text-slate-500 text-sm font-black uppercase tracking-widest mb-2">Researcher's Explanation</p>
          <p className="text-slate-700 font-medium italic leading-relaxed">"{currentQuestion.explanation}"</p>
        </div>
      )}

      {isAnswered && (
        <button
          onClick={nextStep}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl transition-all shadow-lg text-lg flex items-center justify-center gap-2"
        >
          {currentStep === questions.length - 1 ? "View Results" : "Next Question"}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      )}
    </div>
  );
};

export default Quiz;
