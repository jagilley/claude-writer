'use client';

import { ModelSettings, ThinkingMode, DocumentSettings } from '@/lib/types';

interface SettingsProps {
  settings: ModelSettings;
  onSettingsChange: (settings: ModelSettings) => void;
  documentSettings: DocumentSettings;
  onDocumentSettingsChange: (settings: DocumentSettings) => void;
  currentDocumentName?: string;
}

const PRESET_MODELS = [
  { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5' },
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
];

export default function Settings({ settings, onSettingsChange, documentSettings, onDocumentSettingsChange, currentDocumentName }: SettingsProps) {
  const handleModelChange = (modelId: string) => {
    onSettingsChange({ ...settings, modelId });
  };

  const handleThinkingModeChange = (thinkingMode: ThinkingMode) => {
    onSettingsChange({ ...settings, thinkingMode });
  };

  const handleThinkingBudgetChange = (budget: number) => {
    onSettingsChange({ ...settings, thinkingBudget: budget });
  };

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
          {JSON.stringify({ model: settings, document: documentSettings }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
