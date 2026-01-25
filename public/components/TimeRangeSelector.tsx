import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TimeRange } from '../top-lists-client';
import { TranslationMapper } from '../translation-mapper';

interface TimeRangeSelectorProps {
  timeRange: TimeRange;
  onChange: (timeRange: TimeRange) => void;
  translator: TranslationMapper;
}

export function TimeRangeSelector({ timeRange, onChange, translator }: TimeRangeSelectorProps) {
  const [label, setLabel] = useState('Time Span');
  const [options, setOptions] = useState({
    long_term: 'All Time',
    medium_term: 'Last 6 Months',
    short_term: 'Last 4 Weeks'
  });

  useEffect(() => {
    translator.initializedPromise.then(() => {
      try {
        setLabel(translator.get('time-span-selection'));
        setOptions({
          long_term: translator.get('time-range-long-term'),
          medium_term: translator.get('time-range-medium-term'),
          short_term: translator.get('time-range-short-term')
        });
      } catch (e) {
        console.warn('Translation error:', e);
      }
    });
  }, [translator]);

  return (
    <div className="w-full max-w-xs">
      <Select value={timeRange} onValueChange={(value) => onChange(value as TimeRange)}>
        <SelectTrigger className="bg-card">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="long_term">{options.long_term}</SelectItem>
          <SelectItem value="medium_term">{options.medium_term}</SelectItem>
          <SelectItem value="short_term">{options.short_term}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
