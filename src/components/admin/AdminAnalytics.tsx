import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  MessageSquare,
  Instagram,
  MousePointer,
  Sparkles,
  Inbox
} from 'lucide-react';

interface AdminAnalyticsProps {
  analytics: {
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentEvents: any[];
    popularCategories: Record<string, number>;
    popularImages: Record<string, number>;
  };
  totalInquiries: number;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ analytics, totalInquiries }) => {
  const events = analytics?.eventsByType || {};

  const pageViews = events['page_view'] || 0;
  const portfolioViews = events['portfolio_view'] || 0;
  const photoOpens = events['portfolio_open'] || 0;
  const whatsappClicks = events['whatsapp_click'] || 0;
  const instagramClicks = events['instagram_click'] || 0;
  const tiktokClicks = events['tiktok_click'] || 0;
  const bookingStarts = events['booking_start'] || 0;

  const totalInteractions = whatsappClicks + instagramClicks + tiktokClicks + photoOpens;

  const categoryEntries = Object.entries(analytics?.popularCategories || {}).sort((a, b) => Number(b[1]) - Number(a[1]));
  const imageEntries = Object.entries(analytics?.popularImages || {}).sort((a, b) => Number(b[1]) - Number(a[1]));

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-neutral-900 pb-6">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500 block">
          PRIVACY-FOCUSED FIRST-PARTY INSIGHTS
        </span>
        <h1 className="text-2xl sm:text-3xl font-heading text-white uppercase tracking-tight">
          Website Analytics & Engagement
        </h1>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-5 bg-neutral-950 border border-neutral-900 space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-[10px] uppercase">
            <span>PAGE EXPOSURES</span>
            <Eye className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading text-white">{pageViews}</div>
          <div className="text-[10px] text-neutral-500">First-party anonymous views</div>
        </div>

        <div className="p-5 bg-neutral-950 border border-neutral-900 space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-[10px] uppercase">
            <span>PHOTO LIGHTBOX OPENS</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading text-white">{photoOpens}</div>
          <div className="text-[10px] text-neutral-500">Full-resolution inspections</div>
        </div>

        <div className="p-5 bg-neutral-950 border border-neutral-900 space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-[10px] uppercase">
            <span>WHATSAPP CTA CLICKS</span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading text-emerald-400">{whatsappClicks}</div>
          <div className="text-[10px] text-neutral-500">Direct conversation intent</div>
        </div>

        <div className="p-5 bg-neutral-950 border border-neutral-900 space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-[10px] uppercase">
            <span>INQUIRIES CONVERTED</span>
            <Inbox className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading text-white">{totalInquiries}</div>
          <div className="text-[10px] text-neutral-500">Submitted project briefs</div>
        </div>
      </div>

      {/* Engagement Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Method Breakdown */}
        <div className="p-6 bg-neutral-950 border border-neutral-900 space-y-5">
          <h2 className="text-xs font-mono uppercase font-bold text-white tracking-wider flex items-center gap-2">
            <MousePointer className="w-4 h-4 text-neutral-400" />
            <span>COMMUNICATION CHANNEL ENGAGEMENT</span>
          </h2>

          <div className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-400">
                <span>WhatsApp Direct Inquiries</span>
                <span className="text-white font-bold">{whatsappClicks}</span>
              </div>
              <div className="w-full bg-neutral-900 h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full"
                  style={{
                    width: `${totalInteractions > 0 ? (whatsappClicks / totalInteractions) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-400">
                <span>Instagram Profile Clicks</span>
                <span className="text-white font-bold">{instagramClicks}</span>
              </div>
              <div className="w-full bg-neutral-900 h-2 overflow-hidden">
                <div
                  className="bg-pink-500 h-full"
                  style={{
                    width: `${totalInteractions > 0 ? (instagramClicks / totalInteractions) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-400">
                <span>TikTok Profile Clicks</span>
                <span className="text-white font-bold">{tiktokClicks}</span>
              </div>
              <div className="w-full bg-neutral-900 h-2 overflow-hidden">
                <div
                  className="bg-cyan-500 h-full"
                  style={{
                    width: `${totalInteractions > 0 ? (tiktokClicks / totalInteractions) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Popular Categories */}
        <div className="p-6 bg-neutral-950 border border-neutral-900 space-y-5">
          <h2 className="text-xs font-mono uppercase font-bold text-white tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-neutral-400" />
            <span>POPULAR PORTFOLIO CATEGORIES</span>
          </h2>

          {categoryEntries.length === 0 ? (
            <p className="text-xs font-mono text-neutral-500 italic">
              Category engagement events will be visualized as visitors browse your portfolio.
            </p>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {categoryEntries.map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between p-2.5 bg-neutral-900/40 border border-neutral-900">
                  <span className="uppercase text-neutral-300">{cat}</span>
                  <span className="text-white font-bold">{count} visits</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
