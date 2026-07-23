import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodType } from 'zod';

// CLAUDE.md: "All input validated with zod ... at the API boundary." Used
// per-@Body param (not a global pipe) so each route names its own schema:
// @Body(new ZodValidationPipe(SomeRequestSchema)) body: SomeRequest.
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: result.error.issues.map((issue) => issue.message).join('; '),
      });
    }
    return result.data;
  }
}
