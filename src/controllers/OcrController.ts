import { Request, Response } from 'express';
import { DocumentOcrExtractor } from '../parsers/DocumentOcrExtractor';

export class OcrController {
  public static extract(req: Request, res: Response): void {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Missing or invalid "text" in request body' });
        return;
      }

      const extracted = DocumentOcrExtractor.extractMetadata(text);
      res.json({ success: true, data: extracted });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
