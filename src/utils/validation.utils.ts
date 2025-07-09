import { z } from 'zod';

export class ValidationUtils {
  
  static safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
    const result = schema.safeParse(data);
    return result.success ? result.data : null;
  }

  static parseWithDetails<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: Array<{ field: string; message: string }>;
  } {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    }

    return {
      success: false,
      errors: result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    };
  }

  static validatePartial<T extends Record<string, any>>(
    schema: z.ZodObject<any>, 
    data: unknown, 
    fields: string[]
  ): {
    success: boolean;
    data?: Partial<T>;
    errors?: Array<{ field: string; message: string }>;
  } {
    try {
      const fieldObject = fields.reduce((acc, field) => ({ ...acc, [field]: true }), {} as any);
      const partialSchema = schema.pick(fieldObject);
      
      const result = this.parseWithDetails(partialSchema, data);
      return {
        success: result.success,
        data: result.data as Partial<T>,
        errors: result.errors
      };
    } catch (error) {
      return {
        success: false,
        errors: [{ field: 'general', message: 'Invalid field selection' }]
      };
    }
  }

  static isValidEmail(email: string): boolean {
    const emailSchema = z.string().email();
    return emailSchema.safeParse(email).success;
  }

  static isValidUUID(id: string): boolean {
    const uuidSchema = z.string().uuid();
    return uuidSchema.safeParse(id).success;
  }

  static isValidPhone(phone: string): boolean {
    const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/);
    return phoneSchema.safeParse(phone).success;
  }

  static isValidURL(url: string): boolean {
    const urlSchema = z.string().url();
    return urlSchema.safeParse(url).success;
  }

  static stringToNumber(value: string): number | null {
    const numberSchema = z.string().transform(val => {
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    });
    
    const result = numberSchema.safeParse(value);
    return result.success ? result.data : null;
  }

  static stringToDate(value: string): Date | null {
    const dateSchema = z.string().transform(val => {
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    });
    
    const result = dateSchema.safeParse(value);
    return result.success ? result.data : null;
  }

  static validateArray<T>(schema: z.ZodSchema<T>, data: unknown[]): {
    validItems: T[];
    invalidItems: Array<{ index: number; errors: Array<{ field: string; message: string }> }>;
  } {
    const validItems: T[] = [];
    const invalidItems: Array<{ index: number; errors: Array<{ field: string; message: string }> }> = [];

    data.forEach((item, index) => {
      const result = this.parseWithDetails(schema, item);
      
      if (result.success && result.data) {
        validItems.push(result.data);
      } else if (result.errors) {
        invalidItems.push({
          index,
          errors: result.errors
        });
      }
    });

    return { validItems, invalidItems };
  }
}

export class SchemaHelpers {
  
  static flexibleString(minLength: number = 1) {
    return z.string()
      .transform(val => val.trim() === '' ? undefined : val.trim())
      .optional()
      .refine(val => val === undefined || val.length >= minLength, {
        message: `String must be at least ${minLength} characters long`
      });
  }

  static positiveNumber() {
    return z.number().min(0, 'Number must be positive');
  }

  static requiredString(minLength: number = 1, message?: string) {
    return z.string()
      .min(minLength, message || `String must be at least ${minLength} characters long`)
      .transform(val => val.trim());
  }

  static enumSchema<T extends string>(values: readonly T[], fieldName: string = 'field') {
    return z.enum(values as [T, ...T[]], {
      errorMap: () => ({ message: `${fieldName} must be one of: ${values.join(', ')}` })
    });
  }
}
