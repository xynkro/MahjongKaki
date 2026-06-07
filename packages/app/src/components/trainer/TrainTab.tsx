import { useState } from 'react';
import { TrainerMenu, type DrillType } from './TrainerMenu';
import { EfficiencyDrill } from './EfficiencyDrill';
import { WaitsDrill } from './WaitsDrill';
import { DefenseDrill } from './DefenseDrill';
import { CallDrill } from './CallDrill';
import { PushFoldDrill } from './PushFoldDrill';
import { DirectionDrill } from './DirectionDrill';
import { ReadingDrill } from './ReadingDrill';

export function TrainTab() {
  const [drill, setDrill] = useState<DrillType | null>(null);

  if (!drill) return <TrainerMenu onSelect={setDrill} />;

  const onBack = () => setDrill(null);

  switch (drill) {
    case 'efficiency': return <EfficiencyDrill onBack={onBack} />;
    case 'waits': return <WaitsDrill onBack={onBack} />;
    case 'defense': return <DefenseDrill onBack={onBack} />;
    case 'call': return <CallDrill onBack={onBack} />;
    case 'pushfold': return <PushFoldDrill onBack={onBack} />;
    case 'direction': return <DirectionDrill onBack={onBack} />;
    case 'reading': return <ReadingDrill onBack={onBack} />;
  }
}
