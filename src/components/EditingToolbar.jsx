import React, { useState } from 'react';
import { 
  Type, 
  Highlighter, 
  PenTool, 
  MousePointer, 
  Square,
  Circle,
  Save,
  Undo,
  Redo,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const EditingToolbar = ({ 
  activeTool, 
  onToolChange, 
  onSave, 
  onUndo, 
  onRedo,
  canUndo,
  canRedo,
  textSettings,
  onTextSettingsChange,
  highlightColor,
  onHighlightColorChange,
  onSaveState,
  onPrevState,
  onNextState,
  canPrevState,
  canNextState,
  currentStateName
}) => {

  const tools = [
    { id: 'select', icon: MousePointer, label: 'Move Objects' },
    { id: 'text', icon: Type, label: 'Add Text' },
    { id: 'highlight', icon: Highlighter, label: 'Highlight' }
  ];

  return (
    <div className="bg-white shadow-lg rounded-lg border">
      {/* Main Tools */}
      <div className="flex items-center p-4 border-b">
        <div className="flex items-center space-x-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => onToolChange(tool.id)}
                className={`p-2 rounded-lg transition-colors ${
                  activeTool === tool.id
                    ? 'bg-primary-500 text-white'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={tool.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        <div className="mx-4 h-6 w-px bg-gray-200" />

        <div className="flex items-center space-x-2">
          <button
            onClick={onPrevState}
            disabled={!canPrevState}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
            title="Previous State"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-sm text-gray-600 min-w-20 text-center">
            {currentStateName}
          </span>
          
          <button
            onClick={onNextState}
            disabled={!canNextState}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
            title="Next State"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="mx-4 h-6 w-px bg-gray-200" />

        <button
          onClick={onSaveState}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Tool Settings */}
      {activeTool === 'text' && (
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Size
              </label>
              <select
                value={textSettings.fontSize}
                onChange={(e) => onTextSettingsChange({ ...textSettings, fontSize: parseInt(e.target.value) })}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value={8}>8px</option>
                <option value={10}>10px</option>
                <option value={12}>12px</option>
                <option value={14}>14px</option>
                <option value={16}>16px</option>
                <option value={18}>18px</option>
                <option value={24}>24px</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Family
              </label>
              <select
                value={textSettings.fontFamily}
                onChange={(e) => onTextSettingsChange({ ...textSettings, fontFamily: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={textSettings.color}
                onChange={(e) => onTextSettingsChange({ ...textSettings, color: e.target.value })}
                className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {activeTool === 'highlight' && (
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Highlight Color
              </label>
              <div className="flex space-x-2">
                <button
                  className={`w-8 h-8 rounded border-2 ${
                    highlightColor === '#FFFFFF' ? 'border-blue-500' : 'border-gray-300'
                  } bg-white`}
                  title="White highlight"
                  onClick={() => onHighlightColorChange('#FFFFFF')}
                />
                <button
                  className={`w-8 h-8 rounded border-2 ${
                    highlightColor === '#000000' ? 'border-blue-500' : 'border-gray-300'
                  } bg-black`}
                  title="Black highlight"
                  onClick={() => onHighlightColorChange('#000000')}
                />
                <button
                  className={`w-8 h-8 rounded border-2 ${
                    highlightColor === '#FF0000' ? 'border-blue-500' : 'border-gray-300'
                  } bg-red-500`}
                  title="Red highlight"
                  onClick={() => onHighlightColorChange('#FF0000')}
                />
                <button
                  className={`w-8 h-8 rounded border-2 ${
                    highlightColor === '#0000FF' ? 'border-blue-500' : 'border-gray-300'
                  } bg-blue-500`}
                  title="Blue highlight"
                  onClick={() => onHighlightColorChange('#0000FF')}
                />
                <button
                  className={`w-8 h-8 rounded border-2 ${
                    highlightColor === '#00FF00' ? 'border-blue-500' : 'border-gray-300'
                  } bg-green-500`}
                  title="Green highlight"
                  onClick={() => onHighlightColorChange('#00FF00')}
                />
                <button
                  className={`w-8 h-8 rounded border-2 ${
                    highlightColor === '#FFFF00' ? 'border-blue-500' : 'border-gray-300'
                  } bg-yellow-400`}
                  title="Yellow highlight"
                  onClick={() => onHighlightColorChange('#FFFF00')}
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EditingToolbar;