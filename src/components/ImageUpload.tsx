import { useCallback, useState } from 'react';
import { Upload, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  selectedFile: File | null;
}

export function ImageUpload({ onFileSelect, onAnalyze, isAnalyzing, selectedFile }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    onFileSelect(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/png,image/jpeg';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) handleFile(file);
          };
          input.click();
        }}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      >
        {preview ? (
          <img src={preview} alt="Uploaded chart" className="mx-auto max-h-48 rounded object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-10 w-10" />
            <p className="text-sm font-medium">Grafik görüntüsünü sürükleyin veya tıklayın</p>
            <p className="text-xs">PNG / JPG desteklenir</p>
          </div>
        )}
      </div>

      <Button
        onClick={onAnalyze}
        disabled={!selectedFile || isAnalyzing}
        className="w-full"
        size="lg"
      >
        {isAnalyzing ? (
          <>Analiz ediliyor...</>
        ) : (
          <>
            <ImageIcon className="mr-2 h-4 w-4" />
            Analiz Et
          </>
        )}
      </Button>
    </div>
  );
}
