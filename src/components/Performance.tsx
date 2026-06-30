import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RecruiterPerformance } from './RecruiterPerformance';
import { RecruitmentGoals } from './RecruitmentGoals';
import { ChannelPerformance } from './ChannelPerformance';

interface PerformanceProps {
  authUser: any;
}

export const Performance: React.FC<PerformanceProps> = ({ authUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'recruiter' | 'goals' | 'channels'>('recruiter');

  const subTabs = [
    { id: 'recruiter', label: 'Recruiter Performance', icon: 'ph-medal' },
    { id: 'goals', label: 'Recruitment Goals', icon: 'ph-target' },
    { id: 'channels', label: 'Channel Performance', icon: 'ph-megaphone' },
  ] as const;

  return (
    <div className="w-full space-y-4 md:space-y-6">
      {/* Sub-navigation Tabs at the Top */}
      <div className="flex bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-1 rounded-2xl md:rounded-full shadow-sm max-w-2xl mx-auto gap-1">
        {subTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 py-2.5 px-3 md:px-5 rounded-xl md:rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-300 relative ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <i className={`ph-bold ${tab.icon} text-sm md:text-base`}></i>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden text-[10px]">
                {tab.id === 'recruiter' ? 'Recruiter' : tab.id === 'goals' ? 'Goals' : 'Channels'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Render the selected sub-tab with a smooth animation */}
      <div className="relative w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeSubTab === 'recruiter' && <RecruiterPerformance authUser={authUser} />}
            {activeSubTab === 'goals' && <RecruitmentGoals authUser={authUser} />}
            {activeSubTab === 'channels' && <ChannelPerformance authUser={authUser} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
