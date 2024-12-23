import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { User, Upload, X } from 'lucide-react';
import { Button } from './button';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';

interface ImageUploadProps {
  value?: string;
  onChange?: (file: File | null) => void;
  className?: string;
  maxSize?: number; // in MB
  aspectRatio?: number;
  onError?: (error: string) => void;
}

export function ImageUpload({
  value,
  onChange,
  className,
  maxSize = 5, // Default 5MB
  aspectRatio = 1, // Default square
  onError
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isHovered, setIsHovered] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validazione dimensione
    if (file.size > maxSize * 1024 * 1024) {
      onError?.(`L'immagine deve essere inferiore a ${maxSize}MB`);
      return;
    }

    // Validazione tipo file
    if (!file.type.startsWith('image/')) {
      onError?.('Il file deve essere un\'immagine');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImage(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const createFile = async (url: string) => {
    const response = await fetch(url);
    const data = await response.blob();
    return new File([data], "cropped_image.jpg", { type: 'image/jpeg' });
  };

  const handleCropConfirm = async () => {
    if (!originalImage || !croppedAreaPixels) return;

    // Crea un canvas per il ritaglio
    const canvas = document.createElement('canvas');
    const image = new Image();
    image.src = originalImage;

    await new Promise((resolve) => {
      image.onload = resolve;
    });

    // Imposta le dimensioni del canvas
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Disegna l'immagine ritagliata
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    // Converti il canvas in Blob
    const croppedImageUrl = canvas.toDataURL('image/jpeg');
    setPreview(croppedImageUrl);

    // Crea un nuovo File dall'immagine ritagliata
    const croppedFile = await createFile(croppedImageUrl);
    onChange?.(croppedFile);

    setIsCropperOpen(false);
  };

  const handleRemove = () => {
    setPreview(null);
    setOriginalImage(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onChange?.(null);
  };

  return (
    <>
      <div 
        className={cn(
          "relative inline-block",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Avatar className="w-32 h-32 border-2 border-amber-500/20 group-hover:border-amber-500/50 transition-all">
          {preview ? (
            <AvatarImage src={preview} alt="Preview" className="object-cover" />
          ) : (
            <AvatarFallback className="bg-amber-500/10">
              <User className="w-16 h-16 text-amber-500/50" />
            </AvatarFallback>
          )}
        </Avatar>
        
        {/* Overlay con azioni */}
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full bg-black/50 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-amber-500"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="w-5 h-5" />
            </Button>
            {preview && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:text-red-500"
                onClick={handleRemove}
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* Dialog per il cropping */}
      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Ritaglia l'immagine</DialogTitle>
          </DialogHeader>
          <div className="relative h-[400px] w-full">
            {originalImage && (
              <Cropper
                image={originalImage}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsCropperOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleCropConfirm}>
              Conferma
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
