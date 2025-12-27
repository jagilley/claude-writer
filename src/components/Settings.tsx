'use client';

import { ModelSettings, ThinkingMode } from '@/lib/types';

interface SettingsProps {
  settings: ModelSettings;
  onSettingsChange: (settings: ModelSettings) => void;
}

const PRESET_MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
  { id: 'claude-opus-4-0-20250115', name: 'Claude Opus 4' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
];

export default function Settings({ settings, onSettingsChange }: SettingsProps) {
  const handleModelChange = (modelId: string) => {
    onSettingsChange({ ...settings, modelId });
  };

  const handleThinkingModeChange = (thinkingMode: ThinkingMode) => {
    onSettingsChange({ ...settings, thinkingMode });
  };

  const handleThinkingBudgetChange = (budget: number) => {
    onSettingsChange({ ...settings, thinkingBudget: budget });
  };

  const isPresetModel = PRESET_MODELS.some((m) => m.id === settings.modelId);

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Model Settings</h3>

        {/* Model Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium">Model</label>

          {/* Preset models */}
          <div className="space-y-2">
            {PRESET_MODELS.map((model) => (
              <label
                key={model.id}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                  settings.modelId === model.id
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-[var(--chat-border)] hover:border-[var(--accent)]/50'
                }`}
              >
                <input
                  type="radio"
                  name="model"
                  value={model.id}
                  checked={settings.modelId === model.id}
                  onChange={() => handleModelChange(model.id)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">{model.name}</div>
                  <div className="text-xs text-gray-500">{model.id}</div>
                </div>
              </label>
            ))}

            {/* Custom model option */}
            <label
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                !isPresetModel
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--chat-border)] hover:border-[var(--accent)]/50'
              }`}
            >
              <input
                type="radio"
                name="model"
                checked={!isPresetModel}
                onChange={() => handleModelChange('')}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="font-medium">Custom Model</div>
                <input
                  type="text"
                  value={!isPresetModel ? settings.modelId : ''}
                  onChange={(e) => handleModelChange(e.target.value)}
                  placeholder="Enter model ID (e.g., claude-3-opus-20240229)"
                  className="mt-2 w-full p-2 text-sm border border-[var(--chat-border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPresetModel) handleModelChange('');
                  }}
                />
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Thinking Settings */}
      <div className="border-t border-[var(--chat-border)] pt-6">
        <h3 className="text-lg font-semibold mb-4">Extended Thinking</h3>

        <div className="space-y-4">
          {/* Thinking Mode Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium">Enable Extended Thinking</label>
              <p className="text-xs text-gray-500 mt-1">
                Allow Claude to think through complex problems step-by-step
              </p>
            </div>
            <button
              onClick={() =>
                handleThinkingModeChange(
                  settings.thinkingMode === 'enabled' ? 'disabled' : 'enabled'
                )
              }
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.thinkingMode === 'enabled'
                  ? 'bg-[var(--accent)]'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.thinkingMode === 'enabled' ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Thinking Budget */}
          {settings.thinkingMode === 'enabled' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Thinking Budget: {settings.thinkingBudget.toLocaleString()} tokens
              </label>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={settings.thinkingBudget}
                onChange={(e) => handleThinkingBudgetChange(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1K</span>
                <span>50K</span>
                <span>100K</span>
              </div>
              <p className="text-xs text-gray-500">
                Higher budgets allow for more thorough reasoning but increase response time and cost.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Current Settings Summary */}
      <div className="border-t border-[var(--chat-border)] pt-6">
        <h4 className="text-sm font-medium mb-2">Current Configuration</h4>
        <pre className="text-xs bg-[var(--sidebar-bg)] p-3 rounded-lg overflow-x-auto">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>
    </div>
  );
}
