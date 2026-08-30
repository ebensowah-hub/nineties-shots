import React from 'react';
import { ArrowLeft, Film } from 'lucide-react';

interface NotFoundProps {
  onBackToWork: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onBackToWork }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-32 text-center bg-[#080808]">
      <div className="max-w-md space-y-6">
        <div className="w-12 h-12 mx-auto border border-neutral-800 bg-neutral-950 flex items-center justify-center text-neutral-500">
          <Film className="w-6 h-6 stroke-[1.2]" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-neutral-600">
            ERROR 404 // EXPOSURE NOT FOUND
          </span>
          <h1 className="text-4xl sm:text-5xl font-heading font-light text-white uppercase tracking-tight">
            Lost Frame.
          </h1>
          <p className="text-sm text-neutral-400 font-mono leading-relaxed pt-2">
            The negative or archive sequence you requested has not been exposed or has been moved in the gallery.
          </p>
        </div>

        <div className="pt-6">
          <button
            onClick={onBackToWork}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Work</span>
          </button>
        </div>
      </div>
    </div>
  );
};
