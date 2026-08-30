import React, { useState } from 'react';
import { ServiceItem, CategorySlug } from '../../types';
import {
  Briefcase,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  ListPlus,
  Layers
} from 'lucide-react';

interface AdminServicesProps {
  services: ServiceItem[];
  onAddService: (service: Partial<ServiceItem>) => Promise<void>;
  onUpdateService: (id: string, updates: Partial<ServiceItem>) => Promise<void>;
  onDeleteService: (id: string) => Promise<void>;
}

export const AdminServices: React.FC<AdminServicesProps> = ({
  services,
  onAddService,
  onUpdateService,
  onDeleteService
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategorySlug>('portraits');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [sampleImage, setSampleImage] = useState('');
  const [highlightsInput, setHighlightsInput] = useState('');
  const [deliverablesInput, setDeliverablesInput] = useState('');

  const baseCategories: { id: CategorySlug; name: string }[] = [
    { id: 'portraits', name: 'Portraits' },
    { id: 'lifestyle', name: 'Lifestyle' },
    { id: 'photo-shoots', name: 'Photo Shoots' }
  ];

  const customCategories = Array.from(new Set(services.map(s => s.category)))
    .filter(cat => !baseCategories.some(bc => bc.id === cat))
    .map(cat => ({
      id: cat as CategorySlug,
      name: services.find(s => s.category === cat)?.title || cat
    }));

  const categories = [...baseCategories, ...customCategories];

  const resetForm = () => {
    setTitle('');
    setCategory('portraits');
    setTagline('');
    setDescription('');
    setSampleImage('');
    setHighlightsInput('');
    setDeliverablesInput('');
    setEditingService(null);
  };

  const handleOpenEdit = (srv: ServiceItem) => {
    setEditingService(srv);
    setTitle(srv.title);
    setCategory(srv.category);
    setTagline(srv.tagline);
    setDescription(srv.description);
    setSampleImage(srv.sampleImage || '');
    setHighlightsInput((srv.highlights || []).join('\n'));
    setDeliverablesInput((srv.deliverables || []).join('\n'));
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setActionLoading(true);
      const payload: Partial<ServiceItem> = {
        title: title.trim(),
        category,
        tagline: tagline.trim(),
        description: description.trim(),
        sampleImage: sampleImage.trim() || 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200',
        highlights: highlightsInput.split('\n').map(s => s.trim()).filter(Boolean),
        deliverables: deliverablesInput.split('\n').map(s => s.trim()).filter(Boolean)
      };

      if (editingService) {
        await onUpdateService(editingService.id, payload);
      } else {
        await onAddService(payload);
      }
      setShowModal(false);
      resetForm();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500 block">
            COMMISSION OFFERINGS & PACKAGES
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading text-white uppercase tracking-tight">
            Services & Deliverables
          </h1>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add Service Offering</span>
        </button>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {services.map(srv => (
          <div
            key={srv.id}
            className="p-6 bg-neutral-950 border border-neutral-900 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          >
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-neutral-900 text-neutral-400 border border-neutral-800">
                  {srv.category}
                </span>
                <h3 className="text-lg font-heading text-white uppercase tracking-wide">
                  {srv.title}
                </h3>
              </div>

              <p className="text-xs font-mono text-neutral-300 italic">{srv.tagline}</p>
              <p className="text-xs text-neutral-400 font-light line-clamp-2">{srv.description}</p>

              <div className="pt-2 flex flex-wrap gap-2">
                {srv.deliverables?.slice(0, 4).map((d, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono bg-neutral-900/60 text-neutral-400 px-2 py-0.5 border border-neutral-900"
                  >
                    • {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
              <button
                onClick={() => handleOpenEdit(srv)}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-mono uppercase tracking-wider border border-neutral-800 flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                onClick={async () => {
                  if (window.confirm(`Delete service offering "${srv.title}"?`)) {
                    await onDeleteService(srv.id);
                  }
                }}
                className="p-1.5 text-neutral-500 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-neutral-900 flex items-center justify-between bg-neutral-900/40">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                  COMMISSION STRUCTURE
                </span>
                <h2 className="text-lg font-heading text-white uppercase tracking-wider">
                  {editingService ? `Edit Service: ${editingService.title}` : 'Add New Service Offering'}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Service Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Editorial & Fashion Campaigns"
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as CategorySlug)}
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="e.g. High-concept visual storytelling for brands"
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detailed breakdown of the approach, lighting, and art direction..."
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">Sample Image URL</label>
                <input
                  type="url"
                  value={sampleImage}
                  onChange={e => setSampleImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Highlights (one per line)</label>
                  <textarea
                    rows={3}
                    value={highlightsInput}
                    onChange={e => setHighlightsInput(e.target.value)}
                    placeholder="Full Lookbook Curation&#10;Medium Format Digital&#10;On-Location Lighting"
                    className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Deliverables (one per line)</label>
                  <textarea
                    rows={3}
                    value={deliverablesInput}
                    onChange={e => setDeliverablesInput(e.target.value)}
                    placeholder="25+ High-Res Retouched Masters&#10;Web & Social Crops&#10;Private Cloud Gallery"
                    className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-white text-black font-bold uppercase tracking-wider"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
