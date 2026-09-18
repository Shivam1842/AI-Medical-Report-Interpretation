import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CloudUpload, FileText, Eye, HardDrive, Lightbulb } from 'lucide-react';
import { formatFileSize, validateMedicalReportFile } from '../services/api'; 

// Dynamic API base URL switching between local and live Render backend
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://127.0.0.1:8000' 
  : 'https://ai-medical-report-interpretation.onrender.com';

export default function UploadReport() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelection = (file) => {
    if (!file) {
      return;
    }

    const validationError = validateMedicalReportFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError('');
    setSelectedFile(file); 
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    handleFileSelection(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please upload a valid medical report before continuing.');
      return;
    }

    setIsUploading(true);
    
    // Send user to the loading screen immediately
    navigate('/processing');

    // Prepare the file for the Python backend
    const formData = new FormData();
    formData.append("file", selectedFile); 

    try {
        // Send it to your FastAPI server (local or live Render backend)
        const response = await fetch(`${API_BASE_URL}/api/analyze`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
        }

        const data = await response.json();
        
        navigate('/results', { state: { reportData: data } });

    } catch (error) {
        console.error("Error during upload:", error);
        alert("Failed to analyze report. Ensure your backend is running.");
        setIsUploading(false);
        navigate('/upload'); 
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleFileSelection(file);
  };

  return (
    <div className="page">
      <div className="upload-layout">
        <section className="upload-panel">
          <h1 className="upload-panel__title">Upload Medical Report</h1>
          <p className="upload-panel__subtitle">
            Upload your medical report and we&apos;ll analyze it for you.
          </p>

          <div
            className={`upload-dropzone ${dragging ? 'upload-dropzone--dragging' : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div className="upload-dropzone__icon">
              <CloudUpload size={40} />
            </div>
            <h3>Drag &amp; Drop your file here</h3>
            <p>or</p>

            <button
              type="button"
              className="btn btn--secondary upload-button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              Browse Files
            </button>

            <input
              ref={inputRef}
              type="file"
              className="file-input"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleInputChange}
              aria-label="Upload medical report"
            />
          </div>

          <p className="supported-formats">Supported formats: PDF, JPG, PNG (Max 10MB)</p>

          {selectedFile && (
            <div className="file-meta" aria-live="polite">
              <div className="file-meta__name">
                <FileText size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                {selectedFile.name}
              </div>
              <div className="file-meta__size">{formatFileSize(selectedFile.size)}</div>
            </div>
          )}

          {error && <div className="validation-error">{error}</div>}

          <div className="summary-actions">
            <button 
                type="button" 
                className="btn btn--primary" 
                onClick={handleAnalyze}
                disabled={isUploading || !selectedFile}
            >
              {isUploading ? "Uploading..." : "Analyze Report"}
              <ArrowRight size={18} />
            </button>
          </div>
        </section>

        <aside className="tip-card">
          <div className="tip-card__header">
            <Lightbulb size={20} className="tip-card__icon" />
            <h3>Pro Tips for Best Results</h3>
          </div>
          <ul className="tip-list">
            <li>
              <Eye size={16} className="tip-list__icon" />
              <span>Ensure the report is clear and readable.</span>
            </li>
            <li>
              <FileText size={16} className="tip-list__icon" />
              <span>Supported formats: PDF, JPG, PNG.</span>
            </li>
            <li>
              <HardDrive size={16} className="tip-list__icon" />
              <span>Maximum file size: 10MB.</span>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}