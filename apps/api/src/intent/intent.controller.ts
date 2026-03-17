import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { IntentService } from './intent.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('意图识别')
@Controller('intent')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IntentController {
  constructor(private readonly intentService: IntentService) {}

  @Post('parse')
  @ApiOperation({ summary: '解析自然语言任务' })
  async parse(@Request() req, @Body() body: { input: string }) {
    const result = await this.intentService.parseIntent(body.input);
    
    if (result.success && result.data.agentSuggestion) {
      const agentId = await this.intentService.suggestAgent(
        result.data.agentSuggestion,
        req.user.userId,
      );
      result.suggestedAgentId = agentId;
    }

    return result;
  }
}
