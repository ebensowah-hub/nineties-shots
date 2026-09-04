import React, { useState, useRef } from 'react';
import { PortfolioItem, CategorySlug } from '../../types';
import { uploadPortfolioImage } from '../../lib/api';
import {
  Image as ImageIcon,
  PlusCircle,
  Search,
  Filter,
  CheckCircle,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Star,
  Camera,
  X,
  Upload,
  Sparkles,
  Loader2
} from 'lucide-react';

interface AdminPortfolioProps {
  portfolio: PortfolioItem[];
  onAddPhoto: (item: Partial<PortfolioItem>) => Promise<void>;
  onUpdatePhoto: (id: string, updates: Partial<PortfolioItem>) => Promise<void>;
  onDeletePhoto: (id: string) => Promise<void>;
  onSetHero: (id: string) => Promise<void>;
  onSetPortrait: (url: string, alt?: string) => Promise<void>;
}

export const AdminPortfolio: React.FC<AdminPortfolioProps> = ({
  portfolio,
  onAddPhoto,
  onUpdatePhoto,
  onDeletePhoto,
  onSetHero,
  onSetPortrait
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PortfolioItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add/Edit photo form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<CategorySlug>('portraits');
  const [formImage, setFormImage] = useState('');
  const [formAlt, setFormAlt] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDate, setFormDate] = useState('2026');
  const [formDescription, setFormDescription] = useState('');
  const [formCamera, setFormCamera] = useState('Leica M11-P');
  const [formLens, setFormLens] = useState('Summilux-M 35mm f/1.4');
  const [formAperture, setFormAperture] = useState('f/2.0');
  const [formShutter, setFormShutter] = useState('1/500s');
  const [formIso, setFormIso] = useState('ISO 100');
  const [formFeatured, setFormFeatured] = useState(true);
  const [formOrientation, setFormOrientation] = useState<'portrait' | 'landscape' | 'square'>('portrait');

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Base official categories + any custom categories added dynamically
  const baseCategories: { id: CategorySlug; name: string }[] = [
    { id: 'portraits', name: 'Portraits' },
    { id: 'lifestyle', name: 'Lifestyle' },
    { id: 'photo-shoots', name: 'Photo Shoots' }
  ];

  // Merge any custom category present in the current portfolio items
  const customCategories = Array.from(new Set(portfolio.map(p => p.category)))
    .filter(cat => !baseCategories.some(bc => bc.id === cat))
    .map(cat => ({
      id: cat as CategorySlug,
      name: portfolio.find(p => p.category === cat)?.categoryLabel || cat
    }));

  const categories = [...baseCategories, ...customCategories];

  const filteredPortfolio = portfolio.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormTitle('');
    setFormCategory('portraits');
    setFormImage('');
    setPreviewUrl(null);
    setSelectedFileName(null);
    setUploadError(null);
    setUploadSuccess(false);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFormAlt('');
    setFormLocation('');
    setFormDate('2026');
    setFormDescription('');
    setFormCamera('Leica M11-P');
    setFormLens('Summilux-M 35mm f/1.4');
    setFormAperture('f/2.0');
    setFormShutter('1/500s');
    setFormIso('ISO 100');
    setFormFeatured(true);
    setFormOrientation('portrait');
  };

  const handleOpenEdit = (item: PortfolioItem) => {
    setEditingPhoto(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormImage(item.image);
    setPreviewUrl(item.image);
    setSelectedFileName(null);
    setUploadError(null);
    setUploadSuccess(true);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFormAlt(item.alt);
    setFormLocation(item.location || '');
    setFormDate(item.date || '2026');
    setFormDescription(item.description || '');
    setFormCamera(item.cameraSettings?.camera || '');
    setFormLens(item.cameraSettings?.lens || '');
    setFormAperture(item.cameraSettings?.aperture || '');
    setFormShutter(item.cameraSettings?.shutter || '');
    setFormIso(item.cameraSettings?.iso || '');
    setFormFeatured(item.featured ?? true);
    setFormOrientation(item.orientation || 'portrait');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setUploadError('Invalid format. Only JPG, PNG, and WebP images are permitted.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File size exceeds the 15MB limit.');
      return;
    }

    setUploadError(null);
    setUploadSuccess(false);
    setSelectedFileName(file.name);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    if (!formTitle.trim()) {
      const generatedTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      setFormTitle(generatedTitle);
    }

    try {
      setIsUploading(true);
      const res = await uploadPortfolioImage(file);
      setFormImage(res.url);
      setUploadSuccess(true);
      setIsUploading(false);
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(err.message || 'Failed to upload image. Please try again.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setUploadError('Invalid format. Only JPG, PNG, and WebP images are permitted.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File size exceeds the 15MB limit.');
      return;
    }

    setUploadError(null);
    setUploadSuccess(false);
    setSelectedFileName(file.name);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    if (!formTitle.trim()) {
      const generatedTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      setFormTitle(generatedTitle);
    }

    try {
      setIsUploading(true);
      const res = await uploadPortfolioImage(file);
      setFormImage(res.url);
      setUploadSuccess(true);
      setIsUploading(false);
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(err.message || 'Failed to upload image. Please try again.');
    }
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formImage.trim()) {
      setUploadError('Please select or upload an image before publishing.');
      return;
    }
    if (!formTitle.trim()) {
      setUploadError('Please provide a photograph title.');
      return;
    }

    try {
      setActionLoading(true);
      const photoPayload: Partial<PortfolioItem> = {
        title: formTitle.trim(),
        category: formCategory,
        categoryLabel: categories.find(c => c.id === formCategory)?.name || 'Portraits',
        image: formImage.trim(),
        thumbnail: formImage.trim(),
        alt: formAlt.trim() || formTitle.trim(),
        location: formLocation.trim(),
        date: formDate.trim(),
        description: formDescription.trim(),
        featured: formFeatured,
        orientation: formOrientation,
        cameraSettings: {
          camera: formCamera,
          lens: formLens,
          aperture: formAperture,
          shutter: formShutter,
          iso: formIso
        }
      };

      if (editingPhoto) {
        await onUpdatePhoto(editingPhoto.id, photoPayload);
        setEditingPhoto(null);
      } else {
        await onAddPhoto(photoPayload);
        setShowAddModal(false);
      }
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
            VISUAL ASSETS & CURATION
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading text-white uppercase tracking-tight">
            Portfolio Management
          </h1>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add Photograph</span>
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search photographs by title, location, or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-900 pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white font-mono"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-2 text-xs font-mono uppercase tracking-wider border whitespace-nowrap ${
              categoryFilter === 'all'
                ? 'bg-white text-black border-white font-semibold'
                : 'bg-neutral-950 text-neutral-400 border-neutral-900 hover:border-neutral-700'
            }`}
          >
            All Categories ({portfolio.length})
          </button>
          {categories.map(c => {
            const count = portfolio.filter(p => p.category === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setCategoryFilter(c.id)}
                className={`px-3 py-2 text-xs font-mono uppercase tracking-wider border whitespace-nowrap ${
                  categoryFilter === c.id
                    ? 'bg-white text-black border-white font-semibold'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-900 hover:border-neutral-700'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Photographs Grid */}
      {filteredPortfolio.length === 0 ? (
        <div className="p-16 bg-neutral-950 border border-neutral-900 text-center space-y-3">
          <ImageIcon className="w-10 h-10 mx-auto text-neutral-600 stroke-[1.2]" />
          <h3 className="text-sm font-mono text-neutral-300 uppercase tracking-wider">
            No photographs match your selection.
          </h3>
          <p className="text-xs font-mono text-neutral-500">
            Add a photograph or adjust the category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPortfolio.map(item => (
            <div
              key={item.id}
              className="bg-neutral-950 border border-neutral-900 group flex flex-col justify-between overflow-hidden"
            >
              {/* Photo Preview Container */}
              <div className="relative aspect-[4/5] bg-neutral-900 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Badges overlay */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className="text-[9px] font-mono uppercase px-2 py-0.5 bg-black/80 text-white border border-white/20 backdrop-blur-sm">
                    {item.categoryLabel}
                  </span>
                  {item.featured && (
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 bg-white text-black font-bold">
                      Featured
                    </span>
                  )}
                </div>

                {/* Hover Quick Action Buttons */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2 p-4 text-center">
                  <button
                    onClick={() => onSetHero(item.id)}
                    className="w-full py-1.5 px-2 bg-white hover:bg-neutral-200 text-black text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Set as Home Hero</span>
                  </button>

                  <button
                    onClick={() => onSetPortrait(item.image, item.title)}
                    className="w-full py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-mono uppercase tracking-wider border border-neutral-700 flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Set as About Portrait</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="w-full py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-mono uppercase tracking-wider border border-neutral-700 flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Details</span>
                  </button>
                </div>
              </div>

              {/* Photo Information & Controls */}
              <div className="p-3.5 space-y-2 border-t border-neutral-900 bg-neutral-950">
                <div>
                  <h3 className="font-mono text-xs font-semibold text-white truncate">
                    {item.title}
                  </h3>
                  <div className="text-[10px] font-mono text-neutral-500 truncate">
                    {item.location || 'Studio'} • {item.date}
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-900/60 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="text-[10px] font-mono text-neutral-400 hover:text-white uppercase tracking-wider flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (window.confirm(`Delete photograph "${item.title}"?`)) {
                        await onDeletePhoto(item.id);
                      }
                    }}
                    className="text-[10px] font-mono text-red-500 hover:text-red-400 uppercase tracking-wider flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Photograph Modal */}
      {(showAddModal || editingPhoto) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-neutral-900 flex items-center justify-between bg-neutral-900/40">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                  {editingPhoto ? 'CURATE RECORD' : 'NEW EXPOSURE'}
                </span>
                <h2 className="text-lg font-heading text-white uppercase tracking-wider">
                  {editingPhoto ? `Edit "${editingPhoto.title}"` : 'Add Photograph to Portfolio'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingPhoto(null);
                }}
                className="p-1 text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                    Photograph Image *
                  </label>
                  {formImage && (
                    <span className="text-[9px] text-neutral-500 truncate max-w-[240px]" title={formImage}>
                      Stored Ref: {formImage}
                    </span>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {previewUrl || formImage ? (
                  <div className="relative border border-neutral-800 bg-neutral-950 p-2.5 group">
                    <div className="relative aspect-[16/10] max-h-56 w-full overflow-hidden bg-black flex items-center justify-center">
                      <img
                        src={previewUrl || formImage}
                        alt="Photograph Preview"
                        className="w-full h-full object-contain"
                      />
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                          <span className="text-[11px] tracking-wider uppercase">Uploading to Cloud Storage...</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2 px-1">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {uploadSuccess || formImage ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-sans">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {uploadSuccess ? 'Uploaded to Storage' : 'Current Stored Photograph'}
                          </span>
                        ) : null}
                        {selectedFileName && (
                          <span className="text-[10px] text-neutral-400 truncate max-w-[160px]">
                            {selectedFileName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] tracking-wider uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          {editingPhoto ? 'Replace Image' : 'Upload Image'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormImage('');
                            setPreviewUrl(null);
                            setSelectedFileName(null);
                            setUploadSuccess(false);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          disabled={isUploading}
                          className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                          title="Clear Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-white bg-neutral-850'
                        : 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="px-4 py-2 bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors cursor-pointer"
                        >
                          Upload Image
                        </button>
                        <p className="text-[11px] text-neutral-400 mt-2">
                          Select a photo from your device or drag & drop here
                        </p>
                        <p className="text-[9px] text-neutral-500 tracking-wider uppercase">
                          JPG, PNG, WebP · Up to 15MB · Cloud Storage
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="p-2.5 bg-red-950/40 border border-red-800/60 text-red-300 text-[11px] flex items-center justify-between gap-2">
                    <span>{uploadError}</span>
                    <button
                      type="button"
                      onClick={() => setUploadError(null)}
                      className="text-red-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Photograph Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="e.g. Noir Silhouette III"
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as CategorySlug)}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Location</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    placeholder="e.g. Accra, Ghana"
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Year / Date</label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    placeholder="2026"
                    className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">Description / Context</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Editorial brief notes, lighting concepts, model notes..."
                  className="w-full bg-neutral-900 border border-neutral-800 p-2.5 text-white"
                />
              </div>

              {/* Camera Metadata */}
              <div className="p-3 bg-neutral-900/50 border border-neutral-800 space-y-2">
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest block">
                  TECHNICAL CAMERA METADATA
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] text-neutral-500 uppercase">Camera Body</label>
                    <input
                      type="text"
                      value={formCamera}
                      onChange={e => setFormCamera(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-850 p-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-500 uppercase">Lens</label>
                    <input
                      type="text"
                      value={formLens}
                      onChange={e => setFormLens(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-850 p-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-500 uppercase">Aperture</label>
                    <input
                      type="text"
                      value={formAperture}
                      onChange={e => setFormAperture(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-850 p-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-500 uppercase">Shutter Speed</label>
                    <input
                      type="text"
                      value={formShutter}
                      onChange={e => setFormShutter(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-850 p-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-500 uppercase">ISO</label>
                    <input
                      type="text"
                      value={formIso}
                      onChange={e => setFormIso(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-850 p-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formFeatured}
                        onChange={e => setFormFeatured(e.target.checked)}
                        className="w-4 h-4 accent-white"
                      />
                      <span className="text-[10px] text-white uppercase">Featured</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPhoto(null);
                  }}
                  className="px-4 py-2 bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-white text-black font-bold uppercase tracking-wider"
                >
                  {editingPhoto ? 'Save Changes' : 'Publish Photograph'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
