import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { YatraMitraAiService } from '../services/YatraMitraAiService';

export class AiController {
  /**
   * POST /api/v1/ai/chat
   * Multimodal AI voice and chat query endpoint
   */
  public static async chat(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { message, language } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message text is required' });
        return;
      }

      const organizationId = req.user?.organizationId || req.body.organizationId;

      const aiResponse = await YatraMitraAiService.chat({
        message,
        language: language || 'hi',
        organizationId
      });

      res.json({
        success: true,
        ...aiResponse
      });
    } catch (err: any) {
      console.error('[AiController.chat] Error:', err);
      res.status(500).json({ error: 'Failed to process AI chat request' });
    }
  }
}
