import { Injectable } from '@angular/core';
import Ajv from 'ajv';

@Injectable({ providedIn: 'root' })
export class ValidationService {
  private ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });

  extractJSON(response: any): any {
    try {
      const raw = response?.response ?? response;
      if (typeof raw === 'string') return JSON.parse(raw);
      if (raw && typeof raw.data === 'string') return JSON.parse(raw.data);
      return raw;
    } catch {
      return null;
    }
  }

  async validateResponse(
    response: any,
    schema?: any
  ): Promise<{ valid: boolean; data?: any; error?: string }> {
    const data = this.extractJSON(response);
    if (!data) return { valid: false, error: 'Invalid JSON response' };

    if (!Array.isArray(data.series) || data.series.length === 0) {
      return { valid: false, error: 'Missing series array', data };
    }

    const hasValidData = data.series.some((s: any) => s && s.data !== undefined);
    if (!hasValidData) {
      return { valid: false, error: 'Series contains no data field', data };
    }

    if (!schema) return { valid: true, data };

    try {
      const id = schema.$id || schema.id;
      if (id && this.ajv.getSchema(id)) this.ajv.removeSchema(id);

      const validate = this.ajv.compile(schema);
      const isValid = validate(data);
      if (!isValid) {
        const err = validate.errors?.[0];
        const msg = (err?.instancePath || err?.schemaPath || '') + ' ' + (err?.message || 'invalid');
        return { valid: false, error: msg.trim(), data };
      }
    } catch {
    }

    return { valid: true, data };
  }
}