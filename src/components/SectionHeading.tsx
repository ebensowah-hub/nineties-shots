import React from 'react';
import { motion } from 'motion/react';
import { useCinematicMotion } from '../lib/motion';

interface SectionHeadingProps {
  number?: string;
  tag?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'between';
  className?: string;
  children?: React.ReactNode;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  number,
  tag,
  title,
  subtitle,
  align = 'left',
  className = '',
  children
}) => {
  const { reduceMotion, cinematicEase, hairlineVariants } = useCinematicMotion();

  return (
    <div className={`mb-12 md:mb-16 ${className}`}>
      <div className={`flex flex-col ${align === 'center' ? 'items-center text-center' : align === 'between' ? 'md:flex-row md:items-end md:justify-between gap-6' : 'items-start text-left'}`}>
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: reduceMotion ? 0 : 0.75, ease: cinematicEase }}
          className="max-w-3xl"
        >
          {(number || tag) && (
            <div className="flex items-center gap-3 mb-3">
              {tag && (
                <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase">
                  {tag}
                </span>
              )}
            </div>
          )}
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-light tracking-tight text-white uppercase">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-4 text-base md:text-lg text-neutral-400 font-light leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </motion.div>

        {children && (
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: reduceMotion ? 0 : 0.75, delay: reduceMotion ? 0 : 0.15, ease: cinematicEase }}
            className="mt-6 md:mt-0 flex-shrink-0"
          >
            {children}
          </motion.div>
        )}
      </div>

      <motion.div
        variants={hairlineVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="w-full h-px bg-neutral-800/80 mt-8 origin-left"
      />
    </div>
  );
};

