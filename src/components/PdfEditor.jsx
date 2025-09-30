import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import PdfViewer from './PdfViewer';
import EditingToolbar from './EditingToolbar';

console.log('PDFDocument import:', PDFDocument);
console.log('PDFDocument type:', typeof PDFDocument);
console.log('PDFDocument methods:', Object.getOwnPropertyNames(PDFDocument));

const PdfEditor = ({ pdfUrl, formTitle }) => {
  const [editableDoc, setEditableDoc] = useState(null);
  const [activeTool, setActiveTool] = useState('select');
  const [highlightColor, setHighlightColor] = useState('#FFFFFF');
  const [textSettings, setTextSettings] = useState({
    fontSize: 12,
    color: '#000000',
    fontFamily: 'Arial'
  });
  const [annotations, setAnnotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editHistory, setEditHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedStates, setSavedStates] = useState([]);
  const [currentStateIndex, setCurrentStateIndex] = useState(-1);

  useEffect(() => {
    if (pdfUrl) {
      loadEditablePdf();
    }
  }, [pdfUrl]);

  const loadEditablePdf = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      
      console.log('Loading PDF with URL:', pdfUrl);
      
      const response = await fetch(pdfUrl);
      
      console.log('Fetch response status:', response.status);
      console.log('Fetch response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch failed:', errorText);
        throw new Error(`Failed to fetch PDF: ${errorText}`);
      }
      
      const pdfBytes = await response.arrayBuffer();
      console.log('PDF bytes loaded:', pdfBytes.byteLength, 'bytes');
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      console.log('PDF document loaded for editing');
      console.log('PDFDocument type:', typeof pdfDoc);
      console.log('PDFDocument methods:', Object.getOwnPropertyNames(pdfDoc));
      console.log('PDFDocument has rgb:', typeof pdfDoc.rgb);
      
      setEditableDoc(pdfDoc);
      
      // Initialize edit history
      const initialState = await pdfDoc.save();
      setEditHistory([initialState]);
      setHistoryIndex(0);
    } catch (error) {
      console.error('Error loading PDF for editing:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolChange = (tool) => {
    setActiveTool(tool);
  };


  const handleSave = async () => {
    if (!editableDoc) return;

    try {
      const pdfBytes = await editableDoc.save();

      // Add to history
      const newHistory = editHistory.slice(0, historyIndex + 1);
      newHistory.push(pdfBytes);
      setEditHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      console.log('PDF state saved successfully');
    } catch (error) {
      console.error('Error saving PDF:', error);
    }
  };

  const handleSaveState = async () => {
    if (!editableDoc) return;

    try {
      const pdfBytes = await editableDoc.save();
      const stateNumber = String(savedStates.length + 1).padStart(4, '0');
      const newState = {
        id: Date.now(),
        name: `State ${stateNumber}`,
        pdfBytes,
        annotations: [...annotations],
        timestamp: new Date().toLocaleString()
      };

      setSavedStates(prev => [...prev, newState]);
      setCurrentStateIndex(savedStates.length);
      console.log('State saved:', newState.name);
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  const handlePrevState = () => {
    if (currentStateIndex > 0) {
      const newIndex = currentStateIndex - 1;
      setCurrentStateIndex(newIndex);
      loadState(savedStates[newIndex]);
    }
  };

  const handleNextState = () => {
    if (currentStateIndex < savedStates.length - 1) {
      const newIndex = currentStateIndex + 1;
      setCurrentStateIndex(newIndex);
      loadState(savedStates[newIndex]);
    }
  };

  const loadState = (state) => {
    if (!editableDoc || !state) return;

    try {
      // Load PDF bytes
      PDFDocument.load(state.pdfBytes).then(pdfDoc => {
        setEditableDoc(pdfDoc);
        onDocumentChange(pdfDoc);
      });

      // Load annotations
      setAnnotations(state.annotations);

      console.log('State loaded:', state.name);
    } catch (error) {
      console.error('Error loading state:', error);
    }
  };

  const handleUndo = async () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevState = editHistory[prevIndex];
      
      try {
        const restoredDoc = await PDFDocument.load(prevState);
        setEditableDoc(restoredDoc);
        setHistoryIndex(prevIndex);
      } catch (error) {
        console.error('Error undoing:', error);
      }
    }
  };

  const handleRedo = async () => {
    if (historyIndex < editHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = editHistory[nextIndex];
      
      try {
        const restoredDoc = await PDFDocument.load(nextState);
        setEditableDoc(restoredDoc);
        setHistoryIndex(nextIndex);
      } catch (error) {
        console.error('Error redoing:', error);
      }
    }
  };

  const handlePdfLoaded = (pdfDoc) => {
    console.log('PDF loaded in viewer:', pdfDoc.numPages, 'pages');
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Failed to Load PDF</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <div className="space-y-2">
            <button
              onClick={loadEditablePdf}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg mr-2"
            >
              Try Again
            </button>
            <a
              href="/"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Back to Forms
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading PDF Editor</h2>
          <p className="text-gray-600">Preparing {formTitle} for editing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{formTitle}</h1>
            <p className="text-sm text-gray-600 mt-1">Click and edit PDF form fields</p>
          </div>
          <a
            href="/"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Back to Forms
          </a>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-2">
               <EditingToolbar
                 activeTool={activeTool}
                 onToolChange={handleToolChange}
                 onSave={handleSave}
                 onUndo={handleUndo}
                 onRedo={handleRedo}
                 canUndo={historyIndex > 0}
                 canRedo={historyIndex < editHistory.length - 1}
                 textSettings={textSettings}
                 onTextSettingsChange={setTextSettings}
                 highlightColor={highlightColor}
                 onHighlightColorChange={setHighlightColor}
                 onSaveState={handleSaveState}
                 onPrevState={handlePrevState}
                 onNextState={handleNextState}
                 canPrevState={currentStateIndex > 0}
                 canNextState={currentStateIndex < savedStates.length - 1}
                 currentStateName={savedStates[currentStateIndex]?.name || 'No State'}
               />
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 p-6">
        <PdfViewer
          url={pdfUrl}
          onPdfLoaded={handlePdfLoaded}
          editableDoc={editableDoc}
          onDocumentChange={setEditableDoc}
          activeTool={activeTool}
          highlightColor={highlightColor}
          textSettings={textSettings}
          annotations={annotations}
          onAnnotationsChange={setAnnotations}
         />
       </div>

     </div>
   );
 };

export default PdfEditor;