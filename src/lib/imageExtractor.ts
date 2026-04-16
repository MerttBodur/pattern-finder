// Extract a price pattern from a chart screenshot using Canvas API

export function extractPatternFromImage(file: File, numPoints = 30): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data, width, height } = imageData;

        // For each column sample, find the darkest pixel (likely the chart line)
        const columnStep = Math.floor(width / numPoints);
        const rawPoints: number[] = [];

        for (let col = 0; col < numPoints; col++) {
          const x = Math.min(col * columnStep + Math.floor(columnStep / 2), width - 1);
          let darkestY = 0;
          let darkestVal = 255 * 3;

          for (let y = 0; y < height; y++) {
            const idx = (y * width + x) * 4;
            const brightness = data[idx] + data[idx + 1] + data[idx + 2];
            if (brightness < darkestVal) {
              darkestVal = brightness;
              darkestY = y;
            }
          }

          // Invert Y (image coords: top=0, but price: top=high)
          rawPoints.push(height - darkestY);
        }

        // Normalize to 0-1
        const min = Math.min(...rawPoints);
        const max = Math.max(...rawPoints);
        const range = max - min || 1;
        const normalized = rawPoints.map(p => (p - min) / range);

        URL.revokeObjectURL(url);
        resolve(normalized);
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
