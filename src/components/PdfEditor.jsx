import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import PdfViewer from './PdfViewer';
import EditingToolbar from './EditingToolbar';

// Clean analytics fallback - no console spam
if (typeof window !== 'undefined' && !window.analytics) {
  window.analytics = {
    track: () => {},
    identify: () => {},
    page: () => {},
    group: () => {},
    alias: () => {},
    reset: () => {}
  };
}

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
      
      // Enhanced PDF loading with better error handling
      let pdfDoc;
      try {
        pdfDoc = await PDFDocument.load(pdfBytes, { 
          ignoreEncryption: true,
          parseSpeed: 0, // Parse as fast as possible
          throwOnInvalidBytes: false // Don't throw on invalid bytes
        });
      } catch (parseError) {
        console.error('PDF parsing error:', parseError);
        
        // Try alternative loading methods
        try {
          pdfDoc = await PDFDocument.load(pdfBytes, { 
            ignoreEncryption: true,
            parseSpeed: 1, // Slower but more thorough parsing
            throwOnInvalidBytes: false
          });
        } catch (altError) {
          console.error('Alternative PDF parsing failed:', altError);
          throw new Error(`PDF parsing failed: ${parseError.message}. This PDF may be corrupted or use an unsupported format.`);
        }
      }
      
      console.log('PDF document loaded for editing');
      console.log('PDFDocument type:', typeof pdfDoc);
      console.log('PDFDocument methods:', Object.getOwnPropertyNames(pdfDoc));
      console.log('PDFDocument has rgb:', typeof pdfDoc.rgb);
      
      setEditableDoc(pdfDoc);
      
      // Initialize edit history with error handling
      try {
        console.log('Saving initial state for history...');
        
        // Validate document before saving initial state
        if (typeof pdfDoc.save !== 'function') {
          throw new Error('Document save method not available');
        }
        
        // Try to get page count to validate document
        try {
          const pageCount = pdfDoc.getPageCount();
          console.log('Initial document has', pageCount, 'pages');
        } catch (pageError) {
          console.warn('Could not get initial page count:', pageError);
        }
        
        const initialState = await pdfDoc.save();
        
        if (!initialState || initialState.byteLength === 0) {
          throw new Error('Initial state is empty');
        }
        
        setEditHistory([initialState]);
        setHistoryIndex(0);
        console.log('Initial state saved successfully, size:', initialState.byteLength, 'bytes');
      } catch (saveError) {
        console.error('Error saving initial state:', saveError);
        console.error('Initial state error details:', {
          message: saveError.message,
          name: saveError.name,
          stack: saveError.stack
        });
        // Continue without history if save fails
        setEditHistory([]);
        setHistoryIndex(-1);
      }
    } catch (error) {
      console.error('Error loading PDF for editing:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Provide more helpful error messages
      let errorMessage = error.message;
      if (error.message.includes('encrypted')) {
        errorMessage = 'PDF документ зашифрован и не может быть отредактирован. Попробуйте другой документ.';
      } else if (error.message.includes('Invalid PDF') || error.message.includes('Invalid object ref')) {
        errorMessage = 'Неверный формат PDF файла. Убедитесь, что файл не поврежден.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Ошибка загрузки PDF. Проверьте подключение к интернету.';
      } else if (error.message.includes('Expected instance of t')) {
        errorMessage = 'Ошибка парсинга PDF. Файл может быть поврежден или использовать неподдерживаемый формат.';
      } else if (error.message.includes('parsing failed')) {
        errorMessage = 'Не удалось обработать PDF файл. Попробуйте другой документ.';
      }
      
      setLoadError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolChange = (tool) => {
    setActiveTool(tool);
  };


  const handleSave = async () => {
    if (!editableDoc) {
      console.error('Cannot save: No editable document');
      return;
    }

    try {
      // Validate document state before saving
      console.log('Validating document state before save...');
      
      // Check if document is in a valid state
      if (!editableDoc || typeof editableDoc.save !== 'function') {
        throw new Error('Document is not in a valid state for saving');
      }

      // Try to get page count to validate document integrity
      try {
        const pageCount = editableDoc.getPageCount();
        console.log('Document has', pageCount, 'pages');
      } catch (pageError) {
        console.warn('Could not get page count, but continuing with save:', pageError);
      }

      console.log('Saving document...');
      const pdfBytes = await editableDoc.save();
      
      if (!pdfBytes || pdfBytes.byteLength === 0) {
        throw new Error('Saved document is empty');
      }

      // Add to history
      const newHistory = editHistory.slice(0, historyIndex + 1);
      newHistory.push(pdfBytes);
      setEditHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      console.log('PDF state saved successfully, size:', pdfBytes.byteLength, 'bytes');
    } catch (error) {
      console.error('Error saving PDF:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Provide user-friendly error message
      let errorMessage = 'Ошибка сохранения PDF';
      if (error.message.includes('Expected instance of t')) {
        errorMessage = 'PDF документ поврежден. Попробуйте перезагрузить страницу.';
      } else if (error.message.includes('Document is not in a valid state')) {
        errorMessage = 'Документ не готов к сохранению. Попробуйте еще раз.';
      } else if (error.message.includes('Saved document is empty')) {
        errorMessage = 'Не удалось сохранить документ. Попробуйте еще раз.';
      }
      
      alert(errorMessage);
    }
  };

  const handleSaveState = async () => {
    if (!editableDoc) {
      console.error('Cannot save state: No editable document');
      return;
    }

    try {
      // Validate document state before saving
      console.log('Validating document state before save...');
      
      // Check if document is in a valid state
      if (!editableDoc || typeof editableDoc.save !== 'function') {
        throw new Error('Document is not in a valid state for saving');
      }

      // Try to get page count to validate document integrity
      try {
        const pageCount = editableDoc.getPageCount();
        console.log('Document has', pageCount, 'pages');
      } catch (pageError) {
        console.warn('Could not get page count, but continuing with save:', pageError);
      }

      console.log('Saving document state...');
      const pdfBytes = await editableDoc.save();
      
      if (!pdfBytes || pdfBytes.byteLength === 0) {
        throw new Error('Saved document is empty');
      }

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
      console.log('State saved successfully:', newState.name, 'Size:', pdfBytes.byteLength, 'bytes');
    } catch (error) {
      console.error('Error saving state:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Provide user-friendly error message
      let errorMessage = 'Ошибка сохранения состояния';
      if (error.message.includes('Expected instance of t')) {
        errorMessage = 'PDF документ поврежден. Попробуйте перезагрузить страницу.';
      } else if (error.message.includes('Document is not in a valid state')) {
        errorMessage = 'Документ не готов к сохранению. Попробуйте еще раз.';
      } else if (error.message.includes('Saved document is empty')) {
        errorMessage = 'Не удалось сохранить документ. Попробуйте еще раз.';
      }
      
      alert(errorMessage);
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