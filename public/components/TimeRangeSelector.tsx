import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger } from './ui/select';
import { TimeRange } from '../top-lists-client';
import { TranslationMapper } from '../translation-mapper';

interface TimeRangeSelectorProps {
  timeRange: TimeRange;
  onChange: (timeRange: TimeRange) => void;
  translator: TranslationMapper;
}

export function TimeRangeSelector({ timeRange, onChange, translator }: TimeRangeSelectorProps): React.JSX.Element {
  const [label, setLabel] = useState('Time Span');
  const [options, setOptions] = useState({
    long_term: 'All Time',
    medium_term: 'Last 6 Months',
    short_term: 'Last 4 Weeks'
  });
  const displayValue = options[timeRange] ?? label;

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
    <div className="w-full">
      <Select value={timeRange} onValueChange={(value) => onChange(value as TimeRange)} defaultValue={'long_term'}>
        <SelectTrigger className="bg-card">
          <span data-slot="select-value" className="flex flex-1 text-left">
            {displayValue}
          </span>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="long_term">{options.long_term}</SelectItem>
          <SelectItem value="medium_term">{options.medium_term}</SelectItem>
          <SelectItem value="short_term">{options.short_term}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
