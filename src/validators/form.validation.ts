import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { NextFunction } from "express";
import { HttpRequest, HttpResponse } from "../core/Types";

export function validationMiddleware<T>(dtoClass: any, viewName: string): (req: HttpRequest, res: HttpResponse, next: NextFunction) => void {
    return async (req: HttpRequest, res: HttpResponse, next: NextFunction) => {
        try {

            // Map frontend field names to DTO field names if needed
            if (req.body.patients) {
                req.body.patients = req.body.patients.map((patient:any) => ({
                    ...patient,
                    // Map birthDate to dateOfBirth if it exists
                    dateOfBirth: patient.birthDate || patient.dateOfBirth,
                    // Remove the original field to avoid confusion
                    ...(patient.birthDate && { birthDate: undefined })
                }));
            }

            // Convert request body to an instance of the DTO with transformation options
            const dtoInstance = plainToInstance(dtoClass, req.body, {
                enableImplicitConversion: true, // This helps with type conversions
                excludeExtraneousValues: false // Keep all values
            });

            // Validate the DTO instance
            const errors = await validate(dtoInstance, {
                whitelist: true, // Remove properties that don't exist in the DTO
                forbidNonWhitelisted: false, // Don't throw errors for non-whitelisted properties
                skipMissingProperties: false, // Don't skip validation for missing properties
            });

            if (errors.length > 0) {

                // Collect all the validation messages into an array
                const validationMessages = errors.flatMap(error =>
                    Object.values(error.constraints || {})
                );
                const numberedMessages = validationMessages.map((message, index) => `${index + 1}. ${message}`);

                if(viewName === 'api') {
                    return res.json({
                        status: false,
                        message: numberedMessages.join(', '),
                        data: null,
                    });
                }

                res.bag.errorMessage = numberedMessages.join(', ');
                return res.view(viewName);
            } else {
                req.body = dtoInstance;
            }

            return next();
        } catch (error) {
            console.error('Validation middleware error:', error);
            return next(error);
        }
    };
}