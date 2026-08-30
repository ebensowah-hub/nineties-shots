import React, { useState, useEffect } from 'react';
import { InquiryFormData } from '../types';
import { siteConfig } from '../data/siteConfig';
import { SectionHeading } from './SectionHeading';
import { submitInquiry, trackEvent } from '../lib/api';
import { 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface ContactViewProps {
  preselectedService?: string;
}

export const ContactView: React.FC<ContactViewProps> = ({ preselectedService }) => {
  const [formData, setFormData] = useState<InquiryFormData>({
    fullName: '',
    email: '',
    phoneOrWhatsapp: '',
    shootType: preselectedService || 'Portraits',
    preferredDate: '',
    location: '',
    budgetRange: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submissionRef, setSubmissionRef] = useState('');

  useEffect(() => {
    if (preselectedService) {
      setFormData(prev => ({ ...prev, shootType: preselectedService }));
    }
  }, [preselectedService]);

  const shootTypes = [
    'Portraits',
    'Lifestyle',
    'Photo Shoots',
    'Custom Concept / Other'
  ];

  const budgetOptions = [
    'Select estimated range (Optional)',
    'Under $1,500',
    '$1,500 – $3,000',
    '$3,000 – $6,000',
    '$6,000 – $12,000',
    '$12,000+ (Comprehensive Campaign)',
    'To be determined / Flexible'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Basic validation
    if (!formData.fullName.trim()) {
      setErrorMessage('Please provide your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!formData.message.trim()) {
      setErrorMessage('Please share a brief description of your project or vision.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitInquiry({
        clientName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phoneOrWhatsapp.trim(),
        shootType: formData.shootType,
        preferredDate: formData.preferredDate,
        location: formData.location,
        budgetRange: formData.budgetRange,
        message: formData.message
      });

      setSubmissionRef(res.reference || `NS-${Math.floor(100000 + Math.random() * 900000)}`);
      setIsSubmitted(true);
      trackEvent('inquiry_submitted', { shootType: formData.shootType, reference: res.reference });
    } catch {
      setErrorMessage('An error occurred while transmitting your inquiry. Please try again or reach out via WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp link generator using centralized configuration
  const getWhatsAppLink = () => {
    const cleanNumber = siteConfig.contact.whatsappNumber.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(siteConfig.contact.whatsappDefaultMessage);
    return `https://wa.me/${cleanNumber}?text=${text}`;
  };

  return (
    <div className="pt-32 pb-32 px-6 md:px-10 max-w-7xl mx-auto min-h-screen">
      <SectionHeading
        number="05"
        tag="Bookings & Inquiries"
        title="Contact"
        subtitle="Initiate a booking, request a quote, or discuss creative direction for your next shoot."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Left Column: Direct Info & WhatsApp CTA */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <span className="text-[11px] font-mono tracking-[0.25em] text-neutral-500 uppercase">
              DIRECT CHANNELS
            </span>
            <h3 className="text-2xl font-heading text-white uppercase tracking-tight">
              Get in Touch
            </h3>
            <p className="text-sm text-neutral-400 font-light leading-relaxed">
              We respond to all project inquiries and quote requests within 24–48 hours. For urgent assignments or immediate date checks, feel free to reach out directly via WhatsApp.
            </p>
          </div>

          {/* Contact Details Cards */}
          <div className="space-y-4 pt-2">
            {siteConfig.contact.email && (
              <div className="p-5 bg-neutral-950 border border-neutral-900 flex items-start gap-4">
                <Mail className="w-4 h-4 text-neutral-400 mt-1" />
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block">
                    EMAIL INQUIRIES
                  </span>
                  <a
                    href={`mailto:${siteConfig.contact.email}`}
                    className="text-sm text-white font-mono hover:underline mt-0.5 block"
                  >
                    {siteConfig.contact.email}
                  </a>
                </div>
              </div>
            )}

            {/* Centralized WhatsApp Contact Card */}
            <div className="p-5 bg-neutral-950 border border-neutral-900 flex items-start gap-4">
              <MessageSquare className="w-4 h-4 text-emerald-400 mt-1" />
              <div className="flex-1">
                <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block">
                  WHATSAPP DIRECT
                </span>
                <div className="flex items-center justify-between gap-3 mt-1">
                  <span className="text-sm font-mono text-white">
                    {siteConfig.contact.phone || siteConfig.contact.whatsappNumber}
                  </span>
                  <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-800/80 text-[11px] font-mono text-emerald-300 hover:bg-emerald-900/60 transition-colors uppercase tracking-wider"
                  >
                    <span>Chat Now</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="p-5 bg-neutral-950 border border-neutral-900 flex items-start gap-4">
              <MapPin className="w-4 h-4 text-neutral-400 mt-1" />
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block">
                  LOCATION & TRAVEL
                </span>
                <p className="text-xs text-neutral-300 font-mono mt-0.5">
                  {siteConfig.contact.location}
                </p>
              </div>
            </div>

            <div className="p-5 bg-neutral-950/60 border border-neutral-900/80 flex items-start gap-4">
              <Clock className="w-4 h-4 text-neutral-500 mt-1" />
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block">
                  AVAILABILITY NOTICE
                </span>
                <p className="text-xs text-neutral-400 font-light mt-0.5">
                  {siteConfig.contact.availabilityNotice}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Inquiry Booking Form */}
        <div className="lg:col-span-7">
          <div className="p-8 md:p-10 bg-neutral-950 border border-neutral-800">
            {isSubmitted ? (
              /* Submission Success State */
              <div className="py-8 text-center space-y-6">
                <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center mx-auto text-white">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400">
                    INQUIRY RECEIVED
                  </span>
                  <h4 className="text-2xl sm:text-3xl font-heading text-white uppercase tracking-tight">
                    Thank You, {formData.fullName.split(' ')[0]}
                  </h4>
                  <p className="text-sm text-neutral-400 font-light max-w-md mx-auto leading-relaxed">
                    Your inquiry has been successfully registered under reference code{' '}
                    <span className="font-mono text-white bg-neutral-900 px-2 py-0.5 border border-neutral-800">
                      {submissionRef}
                    </span>
                    . We will review your project brief and follow up shortly.
                  </p>
                </div>

                <div className="pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({
                        fullName: '',
                        email: '',
                        phoneOrWhatsapp: '',
                        shootType: 'Editorial & Campaigns',
                        preferredDate: '',
                        location: '',
                        budgetRange: '',
                        message: ''
                      });
                    }}
                    className="px-6 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-xs font-mono uppercase tracking-wider text-neutral-300 transition-colors"
                  >
                    Send Another Inquiry
                  </button>

                  <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
                  >
                    Quick WhatsApp Follow-up
                  </a>
                </div>
              </div>
            ) : (
              /* Active Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                  <h4 className="text-lg font-heading text-white uppercase tracking-wide">
                    Commission Brief
                  </h4>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">
                    * Required Fields
                  </span>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-950/40 border border-red-900/80 flex items-center gap-2.5 text-xs text-red-300 font-mono">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 block">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Jordan Hayes"
                      className="w-full bg-neutral-900/80 border border-neutral-800 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 block">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@organization.com"
                      className="w-full bg-neutral-900/80 border border-neutral-800 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                </div>

                {/* Phone & Shoot Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 block">
                      Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      name="phoneOrWhatsapp"
                      value={formData.phoneOrWhatsapp}
                      onChange={handleChange}
                      placeholder="020 806 6924"
                      className="w-full bg-neutral-900/80 border border-neutral-800 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 block">
                      Commission Type
                    </label>
                    <select
                      name="shootType"
                      value={formData.shootType}
                      onChange={handleChange}
                      className="w-full bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-neutral-100 focus:outline-none focus:border-white transition-colors"
                    >
                      {shootTypes.map(type => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 block">
                      Preferred Date / Timeline
                    </label>
                    <input
                      type="date"
                      name="preferredDate"
                      value={formData.preferredDate}
                      onChange={handleChange}
                      className="w-full bg-neutral-900/80 border border-neutral-800 px-4 py-3 text-sm text-neutral-100 focus:outline-none focus:border-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 block">
                      Shoot Location / City
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. London / Studio / On-site"
                      className="w-full bg-neutral-900/80 border border-neutral-800 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                </div>

                {/* Budget Range (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 block">
                    Estimated Budget Range (Optional)
                  </label>
                  <select
                    name="budgetRange"
                    value={formData.budgetRange}
                    onChange={handleChange}
                    className="w-full bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-neutral-100 focus:outline-none focus:border-white transition-colors"
                  >
                    {budgetOptions.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message / Brief */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 block">
                    Project Vision & Details *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about the concept, mood, subject, timeline, or any specific deliverables you need..."
                    className="w-full bg-neutral-900/80 border border-neutral-800 p-4 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-white transition-colors resize-y"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Transmitting Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Inquiry</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
