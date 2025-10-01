import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Download } from 'lucide-react';

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

// Set up PDF.js worker - use local worker file to avoid CDN issues
if (typeof window !== 'undefined') {
  console.log('Setting up PDF.js worker...');
  console.log('Current workerSrc:', pdfjsLib.GlobalWorkerOptions.workerSrc);
  
  // Use local worker file to avoid CDN 404 errors
  // The worker will be disabled in getDocument options anyway
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  console.log('PDF.js workerSrc set to local:', pdfjsLib.GlobalWorkerOptions.workerSrc);
  console.log('PDF.js worker setup completed');
}

const PdfViewer = ({ url, onPdfLoaded, editableDoc, onDocumentChange, activeTool, highlightColor = '#FFFFFF', textSettings, annotations, onAnnotationsChange }) => {
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [editingText, setEditingText] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [draggedAnnotation, setDraggedAnnotation] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (url) {
      loadPdf();
    }
  }, [url]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
  }, [pdfDoc, currentPage, scale, rotation, annotations]);


  const loadPdf = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== PDF LOADING DEBUG START ===');
      console.log('Loading PDF from URL:', url);
      console.log('Current workerSrc before load:', pdfjsLib.GlobalWorkerOptions.workerSrc);
      console.log('WorkerSrc type:', typeof pdfjsLib.GlobalWorkerOptions.workerSrc);
      console.log('WorkerSrc value:', pdfjsLib.GlobalWorkerOptions.workerSrc);

      // Enhanced PDF loading with better error handling
      let loadingTask;
      try {
        console.log('Creating PDF.js loading task with worker disabled...');
        const pdfOptions = {
          url: url,
          disableWorker: true, // Always disable worker to avoid MIME type issues
          ignoreEncryption: true, // Ignore encryption for encrypted PDFs
          maxImageSize: 1024 * 1024, // Limit image size to prevent memory issues
          isEvalSupported: false, // Disable eval for security
          disableAutoFetch: true, // Disable auto-fetching
          disableStream: true, // Disable streaming
          disableRange: true, // Disable range requests
          useWorkerFetch: false, // Disable worker fetch
          isOffscreenCanvasSupported: false, // Disable offscreen canvas
          // Add error handling options
          stopAtErrors: false, // Don't stop on parsing errors
          maxErrors: 100, // Limit number of errors to process
          disableFontFace: false, // Enable font face loading for better text rendering
          disableCreateObjectURL: false, // Enable object URL creation for better performance
          // Add standard font data URL to fix font warnings
          standardFontDataUrl: '/pdf.worker.min.js', // Use worker file as fallback
        };
        console.log('PDF.js options:', pdfOptions);
        
        loadingTask = pdfjsLib.getDocument(pdfOptions);
        console.log('PDF.js loading task created successfully');
      } catch (configError) {
        console.error('PDF.js configuration error:', configError);
        console.log('Falling back to minimal configuration...');
        // Fallback to minimal configuration
        const fallbackOptions = {
          url: url,
          disableWorker: true,
          ignoreEncryption: true,
          useWorkerFetch: false,
          isOffscreenCanvasSupported: false
        };
        console.log('Fallback PDF.js options:', fallbackOptions);
        loadingTask = pdfjsLib.getDocument(fallbackOptions);
        console.log('Fallback PDF.js loading task created');
      }
      
      const pdf = await loadingTask.promise;
      
      console.log('PDF loaded successfully:', pdf.numPages, 'pages');
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      
      if (onPdfLoaded) {
        onPdfLoaded(pdf);
      }
      
      // Force render the first page after PDF is loaded
      setTimeout(() => {
        console.log('Forcing page render after PDF load...');
        renderPage();
      }, 100);
    } catch (err) {
      console.error('Error loading PDF:', err);
      console.error('Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      
      // Provide more helpful error messages
      let errorMessage = `Failed to load PDF: ${err.message}`;
      if (err.message.includes('encrypted')) {
        errorMessage = 'PDF документ зашифрован и не может быть просмотрен.';
      } else if (err.message.includes('Invalid PDF') || err.message.includes('Invalid object ref')) {
        errorMessage = 'Неверный формат PDF файла. Убедитесь, что файл не поврежден.';
      } else if (err.message.includes('network')) {
        errorMessage = 'Ошибка загрузки PDF. Проверьте подключение к интернету.';
      } else if (err.message.includes('Expected instance of t')) {
        errorMessage = 'Ошибка парсинга PDF. Файл может быть поврежден или использовать неподдерживаемый формат.';
      } else if (err.message.includes('memory') || err.message.includes('out of memory')) {
        errorMessage = 'PDF файл слишком большой для обработки. Попробуйте файл меньшего размера.';
      } else if (err.message.includes('worker') || err.message.includes('MIME type')) {
        errorMessage = 'Ошибка загрузки PDF. Попробуйте обновить страницу или использовать другой браузер.';
      } else if (err.message.includes('fake worker')) {
        errorMessage = 'Ошибка инициализации PDF. Попробуйте обновить страницу.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderPage = async () => {
    if (!pdfDoc || !canvasRef.current) {
      console.log('Cannot render page - pdfDoc:', !!pdfDoc, 'canvasRef:', !!canvasRef.current);
      return;
    }

    try {
      console.log('Rendering page', currentPage, 'of', totalPages);
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      const viewport = page.getViewport({ scale, rotation });
      console.log('Viewport dimensions:', viewport.width, 'x', viewport.height);
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      console.log('Starting page render...');
      await page.render(renderContext).promise;
      console.log('Page render completed');
      
      // Render annotations on top of PDF
      renderAnnotations(context);
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  };

  const renderAnnotations = (context) => {
    annotations.forEach(annotation => {
      if (annotation.type === 'text') {
        context.font = `${annotation.fontSize}px ${annotation.fontFamily}`;
        context.fillStyle = annotation.color;
        context.fillText(annotation.text, annotation.x, annotation.y);
      } else if (annotation.type === 'highlight') {
        const width = Math.abs(annotation.endX - annotation.startX);
        const height = Math.abs(annotation.endY - annotation.startY);
        const x = Math.min(annotation.startX, annotation.endX);
        const y = Math.min(annotation.startY, annotation.endY);
        
        context.fillStyle = annotation.color; // No transparency
        context.fillRect(x, y, width, height);
      }
    });
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  const createPdfWithAnnotations = async (pdfDoc, annotations, pdfjsDoc) => {
    try {
      console.log('Creating PDF with annotations using PDF.js rendering');
      
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      
      // Create new PDF document
      const doc = new jsPDF();
      
      // Render all original PDF pages to canvas using PDF.js
      if (pdfjsDoc && pdfjsDoc.numPages > 0) {
        console.log(`Rendering ${pdfjsDoc.numPages} original PDF pages...`);
        
        for (let pageNum = 1; pageNum <= pdfjsDoc.numPages; pageNum++) {
          console.log(`Rendering page ${pageNum}...`);
          const page = await pdfjsDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.0 });
          
          // Create a separate canvas for rendering (not the display canvas)
          const renderCanvas = document.createElement('canvas');
          const renderCtx = renderCanvas.getContext('2d');
          renderCanvas.width = viewport.width;
          renderCanvas.height = viewport.height;
          
          // Render PDF page to the separate canvas
          const renderContext = {
            canvasContext: renderCtx,
            viewport: viewport
          };
          
          await page.render(renderContext).promise;
          
          // Convert canvas to image and add to jsPDF
          const imgData = renderCanvas.toDataURL('image/png');
          
          if (pageNum > 1) {
            doc.addPage(); // Add new page for each additional page
          }
          
          // Add the PDF page as background image
          doc.addImage(imgData, 'PNG', 0, 0, 210, 297); // A4 size in mm
          
          // Add annotations only to the first page (where they were created)
          const pageAnnotations = pageNum === 1 ? annotations : [];
          
          pageAnnotations.forEach(annotation => {
            if (annotation.type === 'text') {
              console.log('Adding text annotation to jsPDF page', pageNum, ':', annotation);
              
              // Convert coordinates from original canvas to PDF coordinates
              const canvasWidth = canvasRef.current?.width || 612;
              const canvasHeight = canvasRef.current?.height || 792;
              
              const pdfX = annotation.x * (210 / canvasWidth); // A4 width in mm
              const pdfY = annotation.y * (297 / canvasHeight); // A4 height in mm
              
              // Set font and color (use helvetica as fallback for arial)
              const fontName = annotation.fontFamily.toLowerCase().replace(' ', '');
              doc.setFont(fontName === 'arial' ? 'helvetica' : fontName);
              doc.setFontSize(annotation.fontSize);
              doc.setTextColor(annotation.color);
              
              // Add text
              doc.text(annotation.text, pdfX, pdfY);
              
              console.log('Text added to jsPDF at:', pdfX, pdfY);
            } else if (annotation.type === 'highlight') {
              console.log('Adding highlight annotation to jsPDF page', pageNum, ':', annotation);
              
              // Convert coordinates from original canvas to PDF coordinates
              const canvasWidth = canvasRef.current?.width || 612;
              const canvasHeight = canvasRef.current?.height || 792;
              
              const startX = Math.min(annotation.startX, annotation.endX) * (210 / canvasWidth);
              const startY = Math.min(annotation.startY, annotation.endY) * (297 / canvasHeight);
              const width = Math.abs(annotation.endX - annotation.startX) * (210 / canvasWidth);
              const height = Math.abs(annotation.endY - annotation.startY) * (297 / canvasHeight);
              
              // Only add highlight if it has meaningful size (at least 1mm x 1mm)
              if (width > 1 && height > 1) {
                // Set fill color - handle all colors properly
                if (annotation.color === '#000000') {
                  doc.setFillColor(0, 0, 0); // RGB black
                } else if (annotation.color === '#FFFFFF') {
                  doc.setFillColor(255, 255, 255); // RGB white
                } else if (annotation.color === '#FF0000') {
                  doc.setFillColor(255, 0, 0); // RGB red
                } else if (annotation.color === '#0000FF') {
                  doc.setFillColor(0, 0, 255); // RGB blue
                } else if (annotation.color === '#00FF00') {
                  doc.setFillColor(0, 255, 0); // RGB green
                } else if (annotation.color === '#FFFF00') {
                  doc.setFillColor(255, 255, 0); // RGB yellow
                } else {
                  // Convert hex to RGB for any other color
                  const hex = annotation.color.replace('#', '');
                  const r = parseInt(hex.substr(0, 2), 16);
                  const g = parseInt(hex.substr(2, 2), 16);
                  const b = parseInt(hex.substr(4, 2), 16);
                  doc.setFillColor(r, g, b);
                }
                
                // Add highlight rectangle
                doc.rect(startX, startY, width, height, 'F');
                
                console.log('Highlight added to jsPDF at:', startX, startY, 'size:', width, height, 'color:', annotation.color);
              } else {
                console.log('Skipping highlight annotation - too small:', width, height);
              }
            }
          });
          
          console.log(`Page ${pageNum} rendered to jsPDF`);
        }
        
        console.log('All original PDF pages rendered to jsPDF');
      } else {
        console.log('No PDF.js document available for rendering');
      }
      
      // Get PDF as array buffer
      const pdfBytes = doc.output('arraybuffer');
      console.log('jsPDF created successfully, size:', pdfBytes.byteLength);
      
      return pdfBytes;
      
    } catch (error) {
      console.error('Error creating PDF with annotations:', error);
      // Fallback to original PDF
      return await pdfDoc.save();
    }
  };

  const handleDownload = async () => {
    if (!editableDoc) return;
    
    try {
      console.log('Starting download with annotations:', annotations);
      console.log('Canvas dimensions:', canvasRef.current?.width, canvasRef.current?.height);
      console.log('EditableDoc type:', typeof editableDoc);
      console.log('EditableDoc methods:', Object.getOwnPropertyNames(editableDoc));
      console.log('EditableDoc has getPages:', typeof editableDoc.getPages);
      console.log('EditableDoc has save:', typeof editableDoc.save);
      console.log('EditableDoc has rgb:', typeof editableDoc.rgb);
      
      // Create PDF with annotations
      const pdfBytes = await createPdfWithAnnotations(editableDoc, annotations, pdfDoc);
      console.log('PDF bytes created:', pdfBytes.byteLength);
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited-form.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Download completed');
    } catch (err) {
      console.error('Error downloading PDF:', err);
    }
  };

  // Mouse event handlers for interactive editing
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    
    if (activeTool === 'select') {
      // Find annotation near click point
      const clickedAnnotation = annotations.find(annotation => {
        if (annotation.type === 'text') {
          const distance = Math.sqrt((annotation.x - x) ** 2 + (annotation.y - y) ** 2);
          return distance < 50;
        } else if (annotation.type === 'highlight') {
          const centerX = (annotation.startX + annotation.endX) / 2;
          const centerY = (annotation.startY + annotation.endY) / 2;
          const distance = Math.sqrt((centerX - x) ** 2 + (centerY - y) ** 2);
          return distance < 50;
        }
        return false;
      });
      
      if (clickedAnnotation) {
        setDraggedAnnotation(clickedAnnotation);
        if (clickedAnnotation.type === 'text') {
          setDragOffset({ x: x - clickedAnnotation.x, y: y - clickedAnnotation.y });
        } else {
          const centerX = (clickedAnnotation.startX + clickedAnnotation.endX) / 2;
          const centerY = (clickedAnnotation.startY + clickedAnnotation.endY) / 2;
          setDragOffset({ x: x - centerX, y: y - centerY });
        }
      }
    } else if (activeTool === 'text') {
      // Start text editing mode
      setEditingText({ x, y });
      setTextInput('');
    } else if (activeTool === 'highlight') {
      // Start highlight annotation
      setIsDrawing(true);
      const newAnnotation = {
        id: Date.now(),
        type: 'highlight',
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        color: highlightColor
      };
      onAnnotationsChange(prev => [...prev, newAnnotation]);
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    if (activeTool === 'select' && draggedAnnotation) {
      // Move dragged annotation
      onAnnotationsChange(prev => {
        return prev.map(annotation => {
          if (annotation.id === draggedAnnotation.id) {
            if (annotation.type === 'text') {
              return { ...annotation, x: x - dragOffset.x, y: y - dragOffset.y };
            } else if (annotation.type === 'highlight') {
              const deltaX = (x - dragOffset.x) - (annotation.startX + annotation.endX) / 2;
              const deltaY = (y - dragOffset.y) - (annotation.startY + annotation.endY) / 2;
              return {
                ...annotation,
                startX: annotation.startX + deltaX,
                startY: annotation.startY + deltaY,
                endX: annotation.endX + deltaX,
                endY: annotation.endY + deltaY
              };
            }
          }
          return annotation;
        });
      });
    } else if (isDrawing && activeTool === 'highlight') {
      // Update highlight annotation
      onAnnotationsChange(prev => {
        const updated = [...prev];
        const lastAnnotation = updated[updated.length - 1];
        if (lastAnnotation && lastAnnotation.type === 'highlight') {
          lastAnnotation.endX = x;
          lastAnnotation.endY = y;
        }
        return updated;
      });
    }
  };

  const handleMouseUp = (e) => {
    setIsDrawing(false);
    setDraggedAnnotation(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleTextSubmit = () => {
    if (editingText && textInput.trim()) {
      const newAnnotation = {
        id: Date.now(),
        type: 'text',
        x: editingText.x,
        y: editingText.y,
        text: textInput.trim(),
        fontSize: textSettings.fontSize,
        color: textSettings.color,
        fontFamily: textSettings.fontFamily
      };
      onAnnotationsChange(prev => [...prev, newAnnotation]);
    }
    setEditingText(null);
    setTextInput('');
  };

  const handleTextCancel = () => {
    setEditingText(null);
    setTextInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      handleTextCancel();
    }
  };

  const handleDoubleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    // Find text annotation near click point
    const clickedAnnotation = annotations.find(annotation => {
      if (annotation.type === 'text') {
        const distance = Math.sqrt((annotation.x - x) ** 2 + (annotation.y - y) ** 2);
        return distance < 50; // Within 50 pixels
      }
      return false;
    });
    
    if (clickedAnnotation) {
      setEditingText({ x: clickedAnnotation.x, y: clickedAnnotation.y });
      setTextInput(clickedAnnotation.text);
      // Remove the old annotation
      onAnnotationsChange(prev => prev.filter(ann => ann.id !== clickedAnnotation.id));
    }
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    // Find text annotation near click point
    const clickedAnnotation = annotations.find(annotation => {
      if (annotation.type === 'text') {
        const distance = Math.sqrt((annotation.x - x) ** 2 + (annotation.y - y) ** 2);
        return distance < 50; // Within 50 pixels
      }
      return false;
    });
    
    if (clickedAnnotation) {
      // Remove the annotation
      onAnnotationsChange(prev => prev.filter(ann => ann.id !== clickedAnnotation.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadPdf}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>
            
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-600 min-w-16 text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleRotate}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {editableDoc && (
              <button
                onClick={handleDownload}
                className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 rounded-md flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="p-4 bg-gray-100 overflow-auto relative" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex justify-center relative">
          <canvas 
            ref={canvasRef} 
            className={`shadow-lg bg-white ${activeTool === 'select' ? 'cursor-move' : 'cursor-crosshair'}`}
            style={{ maxWidth: '100%', height: 'auto' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleRightClick}
          />
          
          {/* Text Input Overlay */}
          {editingText && (
            <div 
              className="absolute bg-white border-2 border-blue-500 rounded shadow-lg p-2"
              style={{
                left: editingText.x * scale + 16, // Add padding offset
                top: editingText.y * scale + 16,  // Add padding offset
                zIndex: 1000
              }}
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="outline-none text-sm"
                placeholder="Введите текст..."
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleTextSubmit}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                >
                  ✓
                </button>
                <button
                  onClick={handleTextCancel}
                  className="bg-gray-500 text-white px-2 py-1 rounded text-xs"
                >
                  ✗
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;