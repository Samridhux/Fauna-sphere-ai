
import React from 'react';
import { ThreatLevel } from '../types';

interface ThreatBadgeProps {
  level: ThreatLevel;
}

const ThreatBadge: React.FC<ThreatBadgeProps> = ({ level }) => {
  const getColors = (l: ThreatLevel) => {
    switch (l) {
      case ThreatLevel.LEAST_CONCERN: return 'bg-green-100 text-green-800 border-green-200';
      case ThreatLevel.NEAR_THREATENED: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case ThreatLevel.VULNERABLE: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case ThreatLevel.ENDANGERED: return 'bg-orange-100 text-orange-800 border-orange-200';
      case ThreatLevel.CRITICALLY_ENDANGERED: return 'bg-red-100 text-red-800 border-red-200';
      case ThreatLevel.EXTINCT_IN_WILD:
      case ThreatLevel.EXTINCT: return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getColors(level)}`}>
      {level.toUpperCase()}
    </span>
  );
};

export default ThreatBadge;
